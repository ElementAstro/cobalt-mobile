"use client";

import React, { useEffect, useRef, useCallback, useState } from 'react';

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryPressure: 'low' | 'medium' | 'high';
  gcCount: number;
  lastGCTime: number;
}

interface MemoryOptimizationOptions {
  enableAutoCleanup?: boolean;
  cleanupInterval?: number;
  memoryThreshold?: number; // MB
  enableGCMonitoring?: boolean;
}

export function useMemoryOptimization(options: MemoryOptimizationOptions = {}) {
  const {
    enableAutoCleanup = true,
    cleanupInterval = 30000, // 30 seconds
    enableGCMonitoring = true,
  } = options;

  const [metrics, setMetrics] = useState<MemoryMetrics>({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    memoryPressure: 'low',
    gcCount: 0,
    lastGCTime: 0,
  });

  const cleanupCallbacks = useRef<Set<() => void>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const gcObserver = useRef<PerformanceObserver | null>(null);

  // Register cleanup callback
  const registerCleanup = useCallback((callback: () => void) => {
    cleanupCallbacks.current.add(callback);
    return () => {
      cleanupCallbacks.current.delete(callback);
    };
  }, []);

  // Force garbage collection (if available)
  const forceGC = useCallback(() => {
    if ('gc' in window && typeof (window as { gc?: () => void }).gc === 'function') {
      (window as { gc: () => void }).gc();
    }
  }, []);

  // Get memory metrics
  const getMemoryMetrics = useCallback((): MemoryMetrics => {
    const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (!memory) {
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        memoryPressure: 'low',
        gcCount: metrics.gcCount,
        lastGCTime: metrics.lastGCTime,
      };
    }

    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

    let memoryPressure: 'low' | 'medium' | 'high' = 'low';
    const usageRatio = usedMB / limitMB;

    if (usageRatio > 0.8) {
      memoryPressure = 'high';
    } else if (usageRatio > 0.6) {
      memoryPressure = 'medium';
    }

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      memoryPressure,
      gcCount: metrics.gcCount,
      lastGCTime: metrics.lastGCTime,
    };
  }, [metrics.gcCount, metrics.lastGCTime]);

  // Cleanup function
  const cleanup = useCallback(() => {
    cleanupCallbacks.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Memory cleanup callback failed:', error);
      }
    });

    // Clear any cached data or large objects
    if (enableAutoCleanup) {
      // Force garbage collection if available
      forceGC();
    }
  }, [enableAutoCleanup, forceGC]);

  // Monitor memory usage
  const checkMemoryUsage = useCallback(() => {
    const newMetrics = getMemoryMetrics();
    setMetrics(newMetrics);

    // Auto cleanup if memory pressure is high
    if (enableAutoCleanup && newMetrics.memoryPressure === 'high') {
      cleanup();
    }

    // Warn about memory issues
    if (newMetrics.memoryPressure === 'high') {
      console.warn('High memory pressure detected:', {
        usedMB: (newMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2),
        limitMB: (newMetrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
      });
    }
  }, [getMemoryMetrics, enableAutoCleanup, cleanup]);

  // Set up garbage collection monitoring
  useEffect(() => {
    if (!enableGCMonitoring || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      gcObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name.includes('gc')) {
            setMetrics(prev => ({
              ...prev,
              gcCount: prev.gcCount + 1,
              lastGCTime: Date.now(),
            }));
          }
        });
      });

      gcObserver.current.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('GC monitoring not supported:', error);
    }

    return () => {
      if (gcObserver.current) {
        gcObserver.current.disconnect();
      }
    };
  }, [enableGCMonitoring]);

  // Set up periodic memory monitoring
  useEffect(() => {
    if (cleanupInterval > 0) {
      intervalRef.current = setInterval(() => {
        checkMemoryUsage();
      }, cleanupInterval);
    }

    // Initial check
    checkMemoryUsage();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [cleanupInterval, checkMemoryUsage]);

  return {
    metrics,
    registerCleanup,
    cleanup,
    forceGC,
    checkMemoryUsage,
  };
}

// Hook for component-level memory optimization
export function useComponentMemoryOptimization(componentName: string) {
  const { registerCleanup } = useMemoryOptimization();
  const cacheRef = useRef<Map<string, unknown>>(new Map());
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const listenersRef = useRef<Set<() => void>>(new Set());

  // Register component cleanup
  useEffect(() => {
    return registerCleanup(() => {
      // Clear cache
      cacheRef.current.clear();
      
      // Clear timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
      
      // Remove listeners
      listenersRef.current.forEach(removeListener => removeListener());
      listenersRef.current.clear();
      
      console.debug(`Memory cleanup for ${componentName} completed`);
    });
  }, [componentName, registerCleanup]);

  const addTimer = useCallback((timer: NodeJS.Timeout) => {
    timersRef.current.add(timer);
    return () => {
      clearTimeout(timer);
      timersRef.current.delete(timer);
    };
  }, []);

  const addListener = useCallback((removeListener: () => void) => {
    listenersRef.current.add(removeListener);
    return () => {
      removeListener();
      listenersRef.current.delete(removeListener);
    };
  }, []);

  const setCache = useCallback((key: string, value: unknown) => {
    cacheRef.current.set(key, value);
  }, []);

  const getCache = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    addTimer,
    addListener,
    setCache,
    getCache,
    clearCache,
  };
}

// Hook for image and asset optimization
export function useAssetOptimization() {
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const { registerCleanup } = useMemoryOptimization();

  useEffect(() => {
    return registerCleanup(() => {
      // Clear image cache
      imageCache.current.forEach((img) => {
        img.src = '';
        img.onload = null;
        img.onerror = null;
      });
      imageCache.current.clear();
    });
  }, [registerCleanup]);

  const preloadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    if (imageCache.current.has(src)) {
      return Promise.resolve(imageCache.current.get(src)!);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache.current.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const clearImageCache = useCallback(() => {
    imageCache.current.forEach((img) => {
      img.src = '';
    });
    imageCache.current.clear();
  }, []);

  return {
    preloadImage,
    clearImageCache,
    cacheSize: imageCache.current.size,
  };
}

// Performance-aware component wrapper
export function withMemoryOptimization<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function MemoryOptimizedComponent(props: P) {
    useComponentMemoryOptimization(componentName);
    return <Component {...props} />;
  };
}
