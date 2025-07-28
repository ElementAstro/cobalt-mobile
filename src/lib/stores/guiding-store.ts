import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  guidingEngine,
  GuidingParameters,
  GuidingCalibration,
  GuidingStats,
  GuidingState,
  PolarAlignmentData
} from '../guiding/guiding-engine';

export interface GuidingStoreState {
  // Connection state
  isConnected: boolean;
  connectionStatus: string;
  
  // Guiding state
  guidingState: GuidingState;
  guidingParameters: GuidingParameters;
  
  // Calibration
  currentCalibration: GuidingCalibration | null;
  calibrationHistory: GuidingCalibration[];
  isCalibrating: boolean;
  calibrationProgress: number;
  
  // Guiding session
  currentSession: GuidingStats | null;
  sessionHistory: GuidingStats[];
  isGuiding: boolean;
  
  // Polar alignment
  currentPolarAlignment: PolarAlignmentData | null;
  polarAlignmentHistory: PolarAlignmentData[];
  isPolarAligning: boolean;
  polarAlignmentMethod: 'drift' | 'platesolve';
  
  // Dithering
  isDithering: boolean;
  ditherSettings: {
    enabled: boolean;
    amount: number; // pixels
    settleTime: number; // seconds
    frequency: number; // frames between dithers
  };
  ditherCounter: number;
  
  // UI state
  selectedTab: 'guiding' | 'calibration' | 'polar' | 'settings' | 'history';
  showAdvancedSettings: boolean;
  chartTimeRange: '5m' | '15m' | '1h' | '3h' | 'session';
  
  // Statistics
  sessionStats: {
    totalSessions: number;
    averageRMS: number;
    bestRMS: number;
    totalGuidingTime: number; // hours
    successRate: number; // percentage
  };
  
  // Actions
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  
  // Calibration actions
  startCalibration: () => Promise<void>;
  clearCalibration: () => void;
  
  // Guiding actions
  selectGuideStar: (x: number, y: number) => void;
  startGuiding: () => Promise<void>;
  stopGuiding: () => Promise<void>;
  pauseGuiding: () => void;
  resumeGuiding: () => void;
  
  // Dithering actions
  dither: (offsetX?: number, offsetY?: number) => Promise<void>;
  updateDitherSettings: (settings: Partial<GuidingStoreState['ditherSettings']>) => void;
  
  // Polar alignment actions
  startPolarAlignment: (method?: 'drift' | 'platesolve') => Promise<void>;
  setPolarAlignmentMethod: (method: 'drift' | 'platesolve') => void;
  
  // Parameter management
  updateGuidingParameters: (params: Partial<GuidingParameters>) => void;
  resetParametersToDefault: () => void;
  
  // UI actions
  setSelectedTab: (tab: GuidingStoreState['selectedTab']) => void;
  setShowAdvancedSettings: (show: boolean) => void;
  setChartTimeRange: (range: GuidingStoreState['chartTimeRange']) => void;
  
  // Data management
  exportGuidingData: () => string;
  clearHistory: () => void;
  
  // Computed getters
  getGuidingQuality: () => 'excellent' | 'good' | 'fair' | 'poor';
  getCurrentRMS: () => { ra: number; dec: number; total: number };
  getCalibrationQuality: () => 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  getPolarAlignmentQuality: () => 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  getRecentGuidingData: () => { timestamps: Date[]; ra: number[]; dec: number[] };
}

const defaultGuidingParameters: GuidingParameters = {
  aggressiveness: 75,
  minMove: 0.1,
  maxMove: 5.0,
  calibrationSteps: 8,
  settleTime: 10,
  settlePixels: 1.5,
  ditherAmount: 3.0,
  ditherSettleTime: 15,
  enableDecGuiding: true,
  enableRAGuiding: true,
  hysteresis: 10,
  lowpassFilter: 20,
  resistSwitch: true,
  resistSwitchThreshold: 2.0
};

export const useGuidingStore = create<GuidingStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      connectionStatus: 'Disconnected',
      guidingState: {
        isGuiding: false,
        isCalibrated: false,
        isConnected: false,
        currentStar: null,
        lockPosition: null,
        currentError: { ra: 0, dec: 0 },
        currentCorrection: { ra: 0, dec: 0 },
        exposureTime: 2.0,
        gain: 50,
        frameRate: 0.5,
        temperature: -10,
        status: 'idle',
        statusMessage: 'Ready',
        settleProgress: 0
      },
      guidingParameters: defaultGuidingParameters,
      currentCalibration: null,
      calibrationHistory: [],
      isCalibrating: false,
      calibrationProgress: 0,
      currentSession: null,
      sessionHistory: [],
      isGuiding: false,
      currentPolarAlignment: null,
      polarAlignmentHistory: [],
      isPolarAligning: false,
      polarAlignmentMethod: 'drift',
      isDithering: false,
      ditherSettings: {
        enabled: true,
        amount: 3.0,
        settleTime: 15,
        frequency: 5
      },
      ditherCounter: 0,
      selectedTab: 'guiding',
      showAdvancedSettings: false,
      chartTimeRange: '15m',
      sessionStats: {
        totalSessions: 0,
        averageRMS: 0,
        bestRMS: 999,
        totalGuidingTime: 0,
        successRate: 100
      },

      // Actions
      connect: async () => {
        try {
          const success = await guidingEngine.connect();
          if (success) {
            set({ 
              isConnected: true, 
              connectionStatus: 'Connected',
              guidingState: guidingEngine.getState()
            });
          }
          return success;
        } catch (error) {
          set({ connectionStatus: 'Connection failed' });
          return false;
        }
      },

      disconnect: async () => {
        await guidingEngine.disconnect();
        set({ 
          isConnected: false, 
          connectionStatus: 'Disconnected',
          guidingState: guidingEngine.getState()
        });
      },

      // Calibration actions
      startCalibration: async () => {
        set({ isCalibrating: true, calibrationProgress: 0 });
        
        try {
          const calibration = await guidingEngine.startCalibration();
          const { calibrationHistory } = get();
          
          set({
            currentCalibration: calibration,
            calibrationHistory: [calibration, ...calibrationHistory].slice(0, 50),
            isCalibrating: false,
            calibrationProgress: 100,
            guidingState: guidingEngine.getState()
          });
        } catch (error) {
          set({ isCalibrating: false, calibrationProgress: 0 });
          throw error;
        }
      },

      clearCalibration: () => {
        set({ 
          currentCalibration: null,
          guidingState: { ...get().guidingState, isCalibrated: false }
        });
      },

      // Guiding actions
      selectGuideStar: (x, y) => {
        guidingEngine.selectGuideStar(x, y);
        set({ guidingState: guidingEngine.getState() });
      },

      startGuiding: async () => {
        set({ isGuiding: true });
        
        try {
          await guidingEngine.startGuiding();
          set({ 
            guidingState: guidingEngine.getState(),
            currentSession: guidingEngine.getCurrentStats(),
            ditherCounter: 0
          });
        } catch (error) {
          set({ isGuiding: false });
          throw error;
        }
      },

      stopGuiding: async () => {
        await guidingEngine.stopGuiding();
        const session = guidingEngine.getCurrentStats();
        
        if (session) {
          const { sessionHistory, sessionStats } = get();
          const newHistory = [session, ...sessionHistory].slice(0, 100);
          
          // Update session statistics
          const newStats = {
            totalSessions: sessionStats.totalSessions + 1,
            averageRMS: newHistory.reduce((sum, s) => sum + s.rmsTotal, 0) / newHistory.length,
            bestRMS: Math.min(sessionStats.bestRMS, session.rmsTotal),
            totalGuidingTime: sessionStats.totalGuidingTime + 
              ((session.endTime?.getTime() || Date.now()) - session.startTime.getTime()) / (1000 * 60 * 60),
            successRate: (newHistory.filter(s => s.rmsTotal < 2.0).length / newHistory.length) * 100
          };
          
          set({
            isGuiding: false,
            sessionHistory: newHistory,
            sessionStats: newStats,
            currentSession: null,
            guidingState: guidingEngine.getState()
          });
        } else {
          set({ 
            isGuiding: false,
            guidingState: guidingEngine.getState()
          });
        }
      },

      pauseGuiding: () => {
        // Implementation for pausing guiding
        set({ guidingState: { ...get().guidingState, status: 'idle' } });
      },

      resumeGuiding: () => {
        // Implementation for resuming guiding
        set({ guidingState: { ...get().guidingState, status: 'guiding' } });
      },

      // Dithering actions
      dither: async (offsetX, offsetY) => {
        set({ isDithering: true });
        
        try {
          await guidingEngine.dither(offsetX, offsetY);
          set({ 
            isDithering: false,
            ditherCounter: 0,
            guidingState: guidingEngine.getState()
          });
        } catch (error) {
          set({ isDithering: false });
          throw error;
        }
      },

      updateDitherSettings: (settings) => {
        const { ditherSettings } = get();
        set({ ditherSettings: { ...ditherSettings, ...settings } });
      },

      // Polar alignment actions
      startPolarAlignment: async (method = 'drift') => {
        set({ isPolarAligning: true, polarAlignmentMethod: method });
        
        try {
          const alignmentData = await guidingEngine.startPolarAlignment(method);
          const { polarAlignmentHistory } = get();
          
          set({
            currentPolarAlignment: alignmentData,
            polarAlignmentHistory: [alignmentData, ...polarAlignmentHistory].slice(0, 20),
            isPolarAligning: false,
            guidingState: guidingEngine.getState()
          });
        } catch (error) {
          set({ isPolarAligning: false });
          throw error;
        }
      },

      setPolarAlignmentMethod: (method) => {
        set({ polarAlignmentMethod: method });
      },

      // Parameter management
      updateGuidingParameters: (params) => {
        const { guidingParameters } = get();
        const newParams = { ...guidingParameters, ...params };
        guidingEngine.updateParameters(newParams);
        set({ guidingParameters: newParams });
      },

      resetParametersToDefault: () => {
        guidingEngine.updateParameters(defaultGuidingParameters);
        set({ guidingParameters: defaultGuidingParameters });
      },

      // UI actions
      setSelectedTab: (tab) => {
        set({ selectedTab: tab });
      },

      setShowAdvancedSettings: (show) => {
        set({ showAdvancedSettings: show });
      },

      setChartTimeRange: (range) => {
        set({ chartTimeRange: range });
      },

      // Data management
      exportGuidingData: () => {
        const { sessionHistory, calibrationHistory, polarAlignmentHistory, sessionStats } = get();
        const exportData = {
          timestamp: new Date().toISOString(),
          sessionStats,
          sessions: sessionHistory,
          calibrations: calibrationHistory,
          polarAlignments: polarAlignmentHistory
        };
        return JSON.stringify(exportData, null, 2);
      },

      clearHistory: () => {
        set({
          sessionHistory: [],
          calibrationHistory: [],
          polarAlignmentHistory: [],
          sessionStats: {
            totalSessions: 0,
            averageRMS: 0,
            bestRMS: 999,
            totalGuidingTime: 0,
            successRate: 100
          }
        });
      },

      // Computed getters
      getGuidingQuality: () => {
        const { currentSession } = get();
        if (!currentSession) return 'poor';
        
        const rms = currentSession.rmsTotal;
        if (rms < 0.5) return 'excellent';
        if (rms < 1.0) return 'good';
        if (rms < 2.0) return 'fair';
        return 'poor';
      },

      getCurrentRMS: () => {
        const { currentSession } = get();
        if (!currentSession) return { ra: 0, dec: 0, total: 0 };
        
        return {
          ra: currentSession.rmsRA,
          dec: currentSession.rmsDec,
          total: currentSession.rmsTotal
        };
      },

      getCalibrationQuality: () => {
        const { currentCalibration } = get();
        if (!currentCalibration) return 'none';
        return currentCalibration.calibrationQuality;
      },

      getPolarAlignmentQuality: () => {
        const { currentPolarAlignment } = get();
        if (!currentPolarAlignment) return 'none';
        return currentPolarAlignment.quality;
      },

      getRecentGuidingData: () => {
        const { currentSession, chartTimeRange } = get();
        if (!currentSession) return { timestamps: [], ra: [], dec: [] };
        
        const now = Date.now();
        const timeRangeMs = {
          '5m': 5 * 60 * 1000,
          '15m': 15 * 60 * 1000,
          '1h': 60 * 60 * 1000,
          '3h': 3 * 60 * 60 * 1000,
          'session': now - currentSession.startTime.getTime()
        }[chartTimeRange];
        
        const cutoffTime = now - timeRangeMs;
        const validIndices = currentSession.corrections.timestamps
          .map((timestamp, index) => ({ timestamp, index }))
          .filter(({ timestamp }) => timestamp.getTime() >= cutoffTime)
          .map(({ index }) => index);
        
        return {
          timestamps: validIndices.map(i => currentSession.corrections.timestamps[i]),
          ra: validIndices.map(i => currentSession.corrections.ra[i]),
          dec: validIndices.map(i => currentSession.corrections.dec[i])
        };
      }
    }),
    {
      name: 'guiding-storage',
      partialize: (state) => ({
        guidingParameters: state.guidingParameters,
        ditherSettings: state.ditherSettings,
        polarAlignmentMethod: state.polarAlignmentMethod,
        selectedTab: state.selectedTab,
        showAdvancedSettings: state.showAdvancedSettings,
        chartTimeRange: state.chartTimeRange,
        sessionHistory: state.sessionHistory.slice(-20), // Keep last 20 sessions
        calibrationHistory: state.calibrationHistory.slice(-10), // Keep last 10 calibrations
        polarAlignmentHistory: state.polarAlignmentHistory.slice(-5), // Keep last 5 alignments
        sessionStats: state.sessionStats
      })
    }
  )
);

// Set up event listeners for guiding engine
guidingEngine.onEvent((event, data) => {
  const store = useGuidingStore.getState();
  
  switch (event) {
    case 'connected':
      useGuidingStore.setState({ 
        isConnected: true, 
        connectionStatus: 'Connected',
        guidingState: guidingEngine.getState()
      });
      break;
      
    case 'disconnected':
      useGuidingStore.setState({ 
        isConnected: false, 
        connectionStatus: 'Disconnected',
        guidingState: guidingEngine.getState()
      });
      break;
      
    case 'calibration_progress':
      useGuidingStore.setState({ 
        calibrationProgress: (data.step / data.total) * 100 
      });
      break;
      
    case 'guiding_step':
      useGuidingStore.setState({ 
        guidingState: guidingEngine.getState(),
        currentSession: guidingEngine.getCurrentStats()
      });
      
      // Auto-dither check
      if (store.ditherSettings.enabled && store.isGuiding) {
        const newCounter = store.ditherCounter + 1;
        if (newCounter >= store.ditherSettings.frequency) {
          store.dither();
        } else {
          useGuidingStore.setState({ ditherCounter: newCounter });
        }
      }
      break;
      
    case 'dither_started':
      useGuidingStore.setState({ isDithering: true });
      break;
      
    case 'dither_complete':
      useGuidingStore.setState({ 
        isDithering: false,
        ditherCounter: 0
      });
      break;
      
    default:
      // Update guiding state for all other events
      useGuidingStore.setState({ 
        guidingState: guidingEngine.getState()
      });
      break;
  }
});

export default useGuidingStore;
