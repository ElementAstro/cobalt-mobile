/**
 * Mobile Performance Monitor and Optimization System
 * Monitors device performance and adapts UI accordingly
 */

import React from 'react';
import { mobilePerformance } from './mobile-utils';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  interactionLatency: number;
  batteryLevel: number;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  networkSpeed: 'slow' | 'medium' | 'fast';
}

export interface PerformanceSettings {
  animationQuality: 'low' | 'medium' | 'high';
  renderQuality: 'low' | 'medium' | 'high';
  enableAnimations: boolean;
  enableTransitions: boolean;
  enableShadows: boolean;
  enableBlur: boolean;
  maxConcurrentAnimations: number;
  frameRateTarget: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private settings: PerformanceSettings;
  private observers: Map<string, (metrics: PerformanceMetrics) => void>;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private renderTimes: number[] = [];
  private interactionTimes: number[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.metrics = {
      fps: 60,
      memoryUsage: 0,
      renderTime: 0,
      interactionLatency: 0,
      batteryLevel: 100,
      thermalState: 'nominal',
      networkSpeed: 'fast',
    };

    this.settings = {
      animationQuality: 'high',
      renderQuality: 'high',
      enableAnimations: true,
      enableTransitions: true,
      enableShadows: true,
      enableBlur: true,
      maxConcurrentAnimations: 10,
      frameRateTarget: 60,
    };

    this.observers = new Map();
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // Initialize performance observer for render timing
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'measure') {
              this.renderTimes.push(entry.duration);
              if (this.renderTimes.length > 100) {
                this.renderTimes.shift();
              }
            }
          });
        });

        observer.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }

    // Monitor frame rate
    this.startFrameRateMonitoring();

    // Monitor battery and thermal state
    this.monitorDeviceState();
  }

  private startFrameRateMonitoring() {
    if (typeof window === 'undefined' || typeof performance === 'undefined') return;

    const measureFPS = () => {
      const now = performance.now();
      if (this.lastFrameTime > 0) {
        const delta = now - this.lastFrameTime;
        const fps = 1000 / delta;
        this.frameCount++;
        
        // Update FPS every 60 frames
        if (this.frameCount % 60 === 0) {
          this.metrics.fps = Math.round(fps);
          this.adaptPerformanceSettings();
        }
      }
      this.lastFrameTime = now;
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };

    this.isMonitoring = true;
    requestAnimationFrame(measureFPS);
  }

  private async monitorDeviceState() {
    if (typeof navigator === 'undefined') return;

    // Monitor battery
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        this.metrics.batteryLevel = battery.level * 100;
        
        battery.addEventListener('levelchange', () => {
          this.metrics.batteryLevel = battery.level * 100;
          this.adaptPerformanceSettings();
        });
      } catch (error) {
        console.warn('Battery API not supported:', error);
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      const updateMemory = () => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      };

      updateMemory();
      setInterval(updateMemory, 5000);
    }

    // Monitor network speed
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.updateNetworkSpeed(connection.effectiveType);
      
      connection.addEventListener('change', () => {
        this.updateNetworkSpeed(connection.effectiveType);
      });
    }
  }

  private updateNetworkSpeed(effectiveType: string) {
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        this.metrics.networkSpeed = 'slow';
        break;
      case '3g':
        this.metrics.networkSpeed = 'medium';
        break;
      case '4g':
      default:
        this.metrics.networkSpeed = 'fast';
        break;
    }
    this.adaptPerformanceSettings();
  }

  private adaptPerformanceSettings() {
    const { fps, memoryUsage, batteryLevel, networkSpeed } = this.metrics;
    
    // Determine performance level
    let performanceLevel: 'low' | 'medium' | 'high' = 'high';
    
    if (fps < 30 || memoryUsage > 80 || batteryLevel < 20 || networkSpeed === 'slow') {
      performanceLevel = 'low';
    } else if (fps < 45 || memoryUsage > 60 || batteryLevel < 50 || networkSpeed === 'medium') {
      performanceLevel = 'medium';
    }

    // Adapt settings based on performance level
    switch (performanceLevel) {
      case 'low':
        this.settings = {
          animationQuality: 'low',
          renderQuality: 'low',
          enableAnimations: false,
          enableTransitions: false,
          enableShadows: false,
          enableBlur: false,
          maxConcurrentAnimations: 2,
          frameRateTarget: 30,
        };
        break;
      case 'medium':
        this.settings = {
          animationQuality: 'medium',
          renderQuality: 'medium',
          enableAnimations: true,
          enableTransitions: true,
          enableShadows: false,
          enableBlur: false,
          maxConcurrentAnimations: 5,
          frameRateTarget: 45,
        };
        break;
      case 'high':
        this.settings = {
          animationQuality: 'high',
          renderQuality: 'high',
          enableAnimations: true,
          enableTransitions: true,
          enableShadows: true,
          enableBlur: true,
          maxConcurrentAnimations: 10,
          frameRateTarget: 60,
        };
        break;
    }

    // Notify observers
    this.notifyObservers();
  }

  private notifyObservers() {
    this.observers.forEach((callback) => {
      callback(this.metrics);
    });
  }

  // Public API
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getSettings(): PerformanceSettings {
    return { ...this.settings };
  }

  public subscribe(id: string, callback: (metrics: PerformanceMetrics) => void) {
    this.observers.set(id, callback);
  }

  public unsubscribe(id: string) {
    this.observers.delete(id);
  }

  public measureInteraction(name: string, fn: () => void | Promise<void>) {
    if (typeof performance === 'undefined') {
      return fn();
    }

    const start = performance.now();
    
    const finish = () => {
      const end = performance.now();
      const duration = end - start;
      this.interactionTimes.push(duration);
      
      if (this.interactionTimes.length > 50) {
        this.interactionTimes.shift();
      }
      
      this.metrics.interactionLatency = this.interactionTimes.reduce((a, b) => a + b, 0) / this.interactionTimes.length;
    };

    performance.mark(`${name}-start`);
    
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(() => {
          performance.mark(`${name}-end`);
          performance.measure(name, `${name}-start`, `${name}-end`);
          finish();
        });
      } else {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        finish();
        return result;
      }
    } catch (error) {
      finish();
      throw error;
    }
  }

  public getOptimizedAnimationConfig() {
    const { animationQuality, enableAnimations, enableTransitions } = this.settings;
    
    return {
      duration: enableAnimations ? mobilePerformance.getAnimationDuration() : 0,
      ease: animationQuality === 'low' ? 'linear' : 'easeInOut',
      enableTransitions,
      enableAnimations,
      reducedMotion: !enableAnimations,
    };
  }

  public shouldRenderEffect(effectType: 'shadow' | 'blur' | 'gradient'): boolean {
    switch (effectType) {
      case 'shadow':
        return this.settings.enableShadows;
      case 'blur':
        return this.settings.enableBlur;
      case 'gradient':
        return this.settings.renderQuality !== 'low';
      default:
        return true;
    }
  }

  public getOptimalImageQuality(): 'low' | 'medium' | 'high' {
    return this.settings.renderQuality;
  }

  public destroy() {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.observers.clear();
  }
}

// Lazy singleton instance
let _performanceMonitor: PerformanceMonitor | null = null;

export const performanceMonitor = {
  getInstance(): PerformanceMonitor {
    if (!_performanceMonitor && typeof window !== 'undefined') {
      _performanceMonitor = new PerformanceMonitor();
    }
    return _performanceMonitor!;
  },

  // Proxy methods for backward compatibility
  getMetrics() {
    return this.getInstance()?.getMetrics() || {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      renderTime: 0,
      batteryLevel: 100,
      thermalState: 'nominal' as const,
      networkSpeed: 'fast' as const,
      deviceType: 'desktop' as const,
      isLowEndDevice: false,
      timestamp: Date.now(),
    };
  },

  getSettings() {
    return this.getInstance()?.getSettings() || {
      enableAnimations: true,
      enableTransitions: true,
      enableBlur: true,
      maxConcurrentAnimations: 3,
      frameRateTarget: 60,
    };
  },

  measureInteraction(name: string, fn: () => void) {
    return this.getInstance()?.measureInteraction(name, fn) || fn();
  },

  getOptimizedAnimationConfig(baseConfig?: any) {
    const instance = this.getInstance();
    if (!instance) {
      // Fallback for server-side rendering
      return baseConfig || {
        duration: 200,
        ease: 'easeInOut',
        enableTransitions: true,
        enableAnimations: true,
        reducedMotion: false,
      };
    }
    return instance.getOptimizedAnimationConfig() || baseConfig;
  },

  shouldRenderEffect(effectName: 'shadow' | 'blur' | 'gradient' | string) {
    const instance = this.getInstance();
    if (!instance) return true;

    // Type guard for known effect types
    if (effectName === 'shadow' || effectName === 'blur' || effectName === 'gradient') {
      return instance.shouldRenderEffect(effectName);
    }

    // For unknown effect types, return true (render by default)
    return true;
  },

  getOptimalImageQuality() {
    return this.getInstance()?.getOptimalImageQuality() || 'high';
  },

  subscribe(id: string, callback: (metrics: PerformanceMetrics) => void) {
    const instance = this.getInstance();
    if (instance) {
      instance.subscribe(id, callback);
    }
  },

  unsubscribe(id: string) {
    const instance = this.getInstance();
    if (instance) {
      instance.unsubscribe(id);
    }
  }
};

// React hook for using performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState(performanceMonitor.getMetrics());
  const [settings, setSettings] = React.useState(performanceMonitor.getSettings());

  React.useEffect(() => {
    const id = `hook-${Math.random()}`;
    
    performanceMonitor.subscribe(id, (newMetrics) => {
      setMetrics(newMetrics);
      setSettings(performanceMonitor.getSettings());
    });

    return () => {
      performanceMonitor.unsubscribe(id);
    };
  }, []);

  return {
    metrics,
    settings,
    measureInteraction: performanceMonitor.measureInteraction.bind(performanceMonitor),
    getOptimizedAnimationConfig: performanceMonitor.getOptimizedAnimationConfig.bind(performanceMonitor),
    shouldRenderEffect: performanceMonitor.shouldRenderEffect.bind(performanceMonitor),
    getOptimalImageQuality: performanceMonitor.getOptimalImageQuality.bind(performanceMonitor),
  };
}
