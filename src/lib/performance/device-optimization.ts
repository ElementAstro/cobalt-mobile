import { deviceDetector, getDeviceInfo, getPerformanceTier, getOptimalSettings } from '@/lib/utils/device-detection';

// Performance optimization strategies
export interface PerformanceConfig {
  imageQuality: 'low' | 'medium' | 'high';
  animationLevel: 'none' | 'reduced' | 'full';
  cacheStrategy: 'minimal' | 'moderate' | 'aggressive';
  updateFrequency: number; // milliseconds
  batchSize: number;
  preloadDistance: number; // number of items to preload
  virtualScrolling: boolean;
  lazyLoading: boolean;
  webWorkers: boolean;
  serviceWorker: boolean;
}

export interface OptimizationResult {
  config: PerformanceConfig;
  features: {
    enabledFeatures: string[];
    disabledFeatures: string[];
    fallbackFeatures: string[];
  };
  recommendations: string[];
}

class DeviceOptimizer {
  private currentConfig: PerformanceConfig | null = null;
  private observers = new Set<(config: PerformanceConfig) => void>();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize optimizer with device-specific settings
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    this.updateConfiguration();
    
    // Listen for device changes
    deviceDetector.addListener(() => {
      this.updateConfiguration();
    });

    // Listen for network changes
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', () => {
        this.updateConfiguration();
      });
    }

    // Listen for memory pressure (Chrome only)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usedRatio > 0.8) {
          this.handleMemoryPressure();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Get optimized configuration for current device
   */
  getOptimizedConfig(): OptimizationResult {
    if (!this.currentConfig) {
      this.updateConfiguration();
    }

    const deviceInfo = getDeviceInfo();
    const performanceTier = getPerformanceTier();
    const optimalSettings = getOptimalSettings();

    const features = this.determineFeatures(performanceTier, deviceInfo);
    const recommendations = this.generateRecommendations(performanceTier, deviceInfo);

    return {
      config: this.currentConfig!,
      features,
      recommendations,
    };
  }

  /**
   * Update configuration based on current device state
   */
  private updateConfiguration(): void {
    const performanceTier = getPerformanceTier();
    const deviceInfo = getDeviceInfo();
    const optimalSettings = getOptimalSettings();

    this.currentConfig = this.generateConfig(performanceTier, deviceInfo, optimalSettings);
    
    // Notify observers
    this.observers.forEach(observer => {
      try {
        observer(this.currentConfig!);
      } catch (error) {
        console.error('Error in performance config observer:', error);
      }
    });
  }

  /**
   * Generate performance configuration
   */
  private generateConfig(
    tier: 'low' | 'medium' | 'high',
    deviceInfo: any,
    optimalSettings: any
  ): PerformanceConfig {
    const baseConfigs = {
      low: {
        imageQuality: 'low' as const,
        animationLevel: 'none' as const,
        cacheStrategy: 'minimal' as const,
        updateFrequency: 5000,
        batchSize: 5,
        preloadDistance: 1,
        virtualScrolling: true,
        lazyLoading: true,
        webWorkers: false,
        serviceWorker: true,
      },
      medium: {
        imageQuality: 'medium' as const,
        animationLevel: 'reduced' as const,
        cacheStrategy: 'moderate' as const,
        updateFrequency: 2000,
        batchSize: 10,
        preloadDistance: 3,
        virtualScrolling: true,
        lazyLoading: true,
        webWorkers: true,
        serviceWorker: true,
      },
      high: {
        imageQuality: 'high' as const,
        animationLevel: 'full' as const,
        cacheStrategy: 'aggressive' as const,
        updateFrequency: 1000,
        batchSize: 20,
        preloadDistance: 5,
        virtualScrolling: false,
        lazyLoading: false,
        webWorkers: true,
        serviceWorker: true,
      },
    };

    let config = { ...baseConfigs[tier] };

    // Apply device-specific adjustments
    if (deviceInfo) {
      // Adjust for connection quality
      if (deviceInfo.performance.saveData) {
        config.imageQuality = 'low';
        config.cacheStrategy = 'minimal';
        config.updateFrequency = Math.max(config.updateFrequency, 5000);
      }

      // Adjust for mobile devices
      if (deviceInfo.type === 'mobile') {
        config.batchSize = Math.min(config.batchSize, 10);
        config.virtualScrolling = true;
        config.lazyLoading = true;
      }

      // Adjust for reduced motion preference
      if (deviceInfo.capabilities && !optimalSettings.animationsEnabled) {
        config.animationLevel = 'none';
      }

      // Adjust for memory constraints
      if (deviceInfo.performance.memory && deviceInfo.performance.memory < 2) {
        config.cacheStrategy = 'minimal';
        config.batchSize = Math.min(config.batchSize, 5);
        config.webWorkers = false;
      }
    }

    return config;
  }

  /**
   * Determine enabled/disabled features
   */
  private determineFeatures(tier: string, deviceInfo: any): OptimizationResult['features'] {
    const enabledFeatures: string[] = [];
    const disabledFeatures: string[] = [];
    const fallbackFeatures: string[] = [];

    // Core features based on performance tier
    if (tier === 'high') {
      enabledFeatures.push('high-quality-images', 'smooth-animations', 'real-time-updates');
    } else if (tier === 'medium') {
      enabledFeatures.push('medium-quality-images', 'reduced-animations', 'periodic-updates');
      fallbackFeatures.push('high-quality-images');
    } else {
      enabledFeatures.push('low-quality-images', 'minimal-animations', 'manual-updates');
      disabledFeatures.push('smooth-animations', 'real-time-updates');
      fallbackFeatures.push('medium-quality-images', 'reduced-animations');
    }

    // Device-specific features
    if (deviceInfo?.capabilities.webgl2) {
      enabledFeatures.push('webgl2-rendering');
    } else if (deviceInfo?.capabilities.webgl) {
      enabledFeatures.push('webgl-rendering');
      fallbackFeatures.push('webgl2-rendering');
    } else {
      disabledFeatures.push('webgl-rendering', 'webgl2-rendering');
      fallbackFeatures.push('canvas-rendering');
    }

    // Network-dependent features
    if (deviceInfo?.performance.connectionType === 'wifi' || 
        deviceInfo?.performance.connectionType === 'ethernet') {
      enabledFeatures.push('background-sync', 'auto-updates', 'high-quality-streaming');
    } else if (deviceInfo?.performance.effectiveType === '4g') {
      enabledFeatures.push('background-sync', 'compressed-updates');
      fallbackFeatures.push('high-quality-streaming');
    } else {
      disabledFeatures.push('background-sync', 'auto-updates', 'high-quality-streaming');
      fallbackFeatures.push('manual-sync', 'compressed-updates');
    }

    // Storage-dependent features
    if (deviceInfo?.capabilities.indexedDB) {
      enabledFeatures.push('offline-storage', 'data-caching');
    } else if (deviceInfo?.capabilities.localStorage) {
      enabledFeatures.push('basic-storage');
      fallbackFeatures.push('offline-storage');
    } else {
      disabledFeatures.push('offline-storage', 'data-caching');
      fallbackFeatures.push('session-only-storage');
    }

    return {
      enabledFeatures,
      disabledFeatures,
      fallbackFeatures,
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(tier: string, deviceInfo: any): string[] {
    const recommendations: string[] = [];

    if (tier === 'low') {
      recommendations.push(
        'Consider closing other apps to free up memory',
        'Connect to Wi-Fi for better performance',
        'Enable data saver mode to reduce bandwidth usage'
      );
    }

    if (deviceInfo?.performance.memory && deviceInfo.performance.memory < 2) {
      recommendations.push('Device has limited memory - some features may be disabled');
    }

    if (deviceInfo?.performance.saveData) {
      recommendations.push('Data saver mode is enabled - using optimized content');
    }

    if (deviceInfo?.performance.connectionType === '2g' || 
        deviceInfo?.performance.connectionType === 'slow-2g') {
      recommendations.push(
        'Slow connection detected - enabling offline mode',
        'Consider switching to a faster network for real-time features'
      );
    }

    if (!deviceInfo?.capabilities.webgl) {
      recommendations.push('WebGL not supported - using fallback rendering');
    }

    return recommendations;
  }

  /**
   * Handle memory pressure situations
   */
  private handleMemoryPressure(): void {
    console.warn('Memory pressure detected, applying emergency optimizations');
    
    // Force low-performance configuration
    this.currentConfig = {
      imageQuality: 'low',
      animationLevel: 'none',
      cacheStrategy: 'minimal',
      updateFrequency: 10000,
      batchSize: 3,
      preloadDistance: 0,
      virtualScrolling: true,
      lazyLoading: true,
      webWorkers: false,
      serviceWorker: true,
    };

    // Notify observers
    this.observers.forEach(observer => {
      try {
        observer(this.currentConfig!);
      } catch (error) {
        console.error('Error in emergency performance config observer:', error);
      }
    });

    // Trigger garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * Add configuration change observer
   */
  addObserver(observer: (config: PerformanceConfig) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): PerformanceConfig | null {
    return this.currentConfig;
  }

  /**
   * Force configuration update
   */
  forceUpdate(): void {
    this.updateConfiguration();
  }
}

// Create singleton instance
export const deviceOptimizer = new DeviceOptimizer();

// Utility functions
export function getImageQuality(): 'low' | 'medium' | 'high' {
  const config = deviceOptimizer.getCurrentConfig();
  return config?.imageQuality || 'medium';
}

export function shouldUseAnimations(): boolean {
  const config = deviceOptimizer.getCurrentConfig();
  return config?.animationLevel !== 'none';
}

export function getUpdateFrequency(): number {
  const config = deviceOptimizer.getCurrentConfig();
  return config?.updateFrequency || 2000;
}

export function shouldUseVirtualScrolling(): boolean {
  const config = deviceOptimizer.getCurrentConfig();
  return config?.virtualScrolling || false;
}

export function getBatchSize(): number {
  const config = deviceOptimizer.getCurrentConfig();
  return config?.batchSize || 10;
}
