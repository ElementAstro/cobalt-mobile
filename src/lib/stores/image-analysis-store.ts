import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { imageAnalyzer, ImageAnalysisResult, ImageMetrics, StarData } from '../image-processing/image-analyzer';

export interface ImageAnalysisState {
  // Current analysis data
  currentAnalysis: ImageAnalysisResult | null;
  analysisHistory: ImageAnalysisResult[];
  
  // Real-time monitoring
  isAnalyzing: boolean;
  autoAnalysis: boolean;
  analysisInterval: number; // seconds
  
  // Focus tracking
  focusHistory: ImageMetrics[];
  focusTarget: number; // Target HFR
  focusDirection: 'in' | 'out' | 'optimal';
  
  // Quality tracking
  qualityTrend: {
    hfr: 'improving' | 'degrading' | 'stable';
    snr: 'improving' | 'degrading' | 'stable';
    focus: 'improving' | 'degrading' | 'stable';
  };
  
  // Settings
  analysisSettings: {
    starDetectionThreshold: number;
    minStarSize: number;
    maxStarSize: number;
    enableSubPixelAccuracy: boolean;
    filterNoise: boolean;
  };
  
  // Alerts
  alerts: {
    focusAlert: boolean;
    saturationAlert: boolean;
    trackingAlert: boolean;
    lowSNRAlert: boolean;
  };
  
  // Actions
  analyzeImage: (imageData: ImageData | ArrayBuffer) => Promise<void>;
  analyzeSubframe: (imageData: ImageData | ArrayBuffer, region: { x: number; y: number; width: number; height: number }) => Promise<void>;
  setAutoAnalysis: (enabled: boolean) => void;
  setAnalysisInterval: (seconds: number) => void;
  setFocusTarget: (hfr: number) => void;
  updateAnalysisSettings: (settings: Partial<ImageAnalysisState['analysisSettings']>) => void;
  clearHistory: () => void;
  exportAnalysisData: () => string;
  
  // Computed getters
  getCurrentHFR: () => number;
  getCurrentSNR: () => number;
  getFocusScore: () => number;
  getStarCount: () => number;
  isInFocus: () => boolean;
  getQualityScore: () => number;
  getActiveAlerts: () => string[];
}

export const useImageAnalysisStore = create<ImageAnalysisState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentAnalysis: null,
      analysisHistory: [],
      isAnalyzing: false,
      autoAnalysis: false,
      analysisInterval: 30, // 30 seconds
      focusHistory: [],
      focusTarget: 2.5,
      focusDirection: 'optimal',
      qualityTrend: {
        hfr: 'stable',
        snr: 'stable',
        focus: 'stable'
      },
      analysisSettings: {
        starDetectionThreshold: 3.0,
        minStarSize: 2,
        maxStarSize: 50,
        enableSubPixelAccuracy: true,
        filterNoise: true
      },
      alerts: {
        focusAlert: false,
        saturationAlert: false,
        trackingAlert: false,
        lowSNRAlert: false
      },

      // Actions
      analyzeImage: async (imageData: ImageData | ArrayBuffer) => {
        set({ isAnalyzing: true });
        
        try {
          const { analysisSettings } = get();
          const result = await imageAnalyzer.analyzeImage(imageData, analysisSettings);
          
          const { analysisHistory, focusHistory } = get();
          
          // Update trends
          const trends = imageAnalyzer.calculateTrend(
            result.metrics,
            focusHistory.slice(-10) // Last 10 measurements
          );
          
          // Check for alerts
          const alerts = {
            focusAlert: result.metrics.hfr > get().focusTarget + 1.0,
            saturationAlert: result.metrics.saturation > 5,
            trackingAlert: result.metrics.eccentricity > 0.5,
            lowSNRAlert: result.metrics.snr < 5
          };
          
          set({
            currentAnalysis: result,
            analysisHistory: [...analysisHistory.slice(-49), result], // Keep last 50
            focusHistory: [...focusHistory.slice(-99), result.metrics], // Keep last 100
            focusDirection: result.focusAnalysis.focusDirection,
            qualityTrend: trends,
            alerts,
            isAnalyzing: false
          });
        } catch (error) {
          console.error('Image analysis failed:', error);
          set({ isAnalyzing: false });
        }
      },

      analyzeSubframe: async (imageData: ImageData | ArrayBuffer, region) => {
        try {
          const result = await imageAnalyzer.analyzeSubframe(imageData, region);
          
          if (result.metrics && result.focusAnalysis) {
            const { focusHistory } = get();
            
            // Update focus tracking with subframe data
            set({
              focusHistory: [...focusHistory.slice(-99), result.metrics],
              focusDirection: result.focusAnalysis.focusDirection
            });
          }
        } catch (error) {
          console.error('Subframe analysis failed:', error);
        }
      },

      setAutoAnalysis: (enabled: boolean) => {
        set({ autoAnalysis: enabled });
      },

      setAnalysisInterval: (seconds: number) => {
        set({ analysisInterval: Math.max(5, Math.min(300, seconds)) }); // 5s to 5min
      },

      setFocusTarget: (hfr: number) => {
        set({ focusTarget: Math.max(0.5, Math.min(10, hfr)) });
      },

      updateAnalysisSettings: (settings) => {
        const { analysisSettings } = get();
        set({
          analysisSettings: { ...analysisSettings, ...settings }
        });
      },

      clearHistory: () => {
        set({
          analysisHistory: [],
          focusHistory: [],
          qualityTrend: {
            hfr: 'stable',
            snr: 'stable',
            focus: 'stable'
          }
        });
      },

      exportAnalysisData: () => {
        const { analysisHistory, focusHistory } = get();
        const exportData = {
          timestamp: new Date().toISOString(),
          analysisHistory,
          focusHistory,
          settings: get().analysisSettings
        };
        return JSON.stringify(exportData, null, 2);
      },

      // Computed getters
      getCurrentHFR: () => {
        const { currentAnalysis } = get();
        return currentAnalysis?.metrics.hfr || 0;
      },

      getCurrentSNR: () => {
        const { currentAnalysis } = get();
        return currentAnalysis?.metrics.snr || 0;
      },

      getFocusScore: () => {
        const { currentAnalysis } = get();
        return currentAnalysis?.metrics.focusScore || 0;
      },

      getStarCount: () => {
        const { currentAnalysis } = get();
        return currentAnalysis?.metrics.starCount || 0;
      },

      isInFocus: () => {
        const { currentAnalysis, focusTarget } = get();
        if (!currentAnalysis) return false;
        return currentAnalysis.metrics.hfr <= focusTarget + 0.5;
      },

      getQualityScore: () => {
        const { currentAnalysis } = get();
        return currentAnalysis?.qualityAssessment.score || 0;
      },

      getActiveAlerts: () => {
        const { alerts } = get();
        const activeAlerts: string[] = [];
        
        if (alerts.focusAlert) activeAlerts.push('Focus needs attention');
        if (alerts.saturationAlert) activeAlerts.push('High saturation detected');
        if (alerts.trackingAlert) activeAlerts.push('Poor tracking detected');
        if (alerts.lowSNRAlert) activeAlerts.push('Low signal-to-noise ratio');
        
        return activeAlerts;
      }
    }),
    {
      name: 'image-analysis-storage',
      partialize: (state) => ({
        autoAnalysis: state.autoAnalysis,
        analysisInterval: state.analysisInterval,
        focusTarget: state.focusTarget,
        analysisSettings: state.analysisSettings,
        focusHistory: state.focusHistory.slice(-20), // Persist last 20 focus measurements
      })
    }
  )
);

// Auto-analysis functionality
let analysisTimer: NodeJS.Timeout | null = null;

export const startAutoAnalysis = () => {
  const store = useImageAnalysisStore.getState();
  
  if (analysisTimer) {
    clearInterval(analysisTimer);
  }
  
  if (store.autoAnalysis) {
    analysisTimer = setInterval(() => {
      const currentStore = useImageAnalysisStore.getState();
      if (currentStore.autoAnalysis && !currentStore.isAnalyzing) {
        // In a real implementation, this would capture the current image
        // For simulation, we'll generate a test image
        const testImageData = new Uint16Array(1024 * 1024);
        currentStore.analyzeImage(testImageData.buffer);
      }
    }, store.analysisInterval * 1000);
  }
};

export const stopAutoAnalysis = () => {
  if (analysisTimer) {
    clearInterval(analysisTimer);
    analysisTimer = null;
  }
};

// Subscribe to interval changes
useImageAnalysisStore.subscribe(
  (state) => state.analysisInterval,
  () => {
    const store = useImageAnalysisStore.getState();
    if (store.autoAnalysis) {
      startAutoAnalysis();
    }
  }
);

// Subscribe to auto-analysis changes
useImageAnalysisStore.subscribe(
  (state) => state.autoAnalysis,
  (autoAnalysis) => {
    if (autoAnalysis) {
      startAutoAnalysis();
    } else {
      stopAutoAnalysis();
    }
  }
);

export default useImageAnalysisStore;
