import { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentMounts: number;
  rerenders: number;
  lastRenderTime: number;
  fps?: number;
  isLowEndDevice?: boolean;
  networkStatus?: 'online' | 'offline' | 'slow';
  batteryLevel?: number;
}

interface PerformanceOptions {
  trackMemory?: boolean;
  logToConsole?: boolean;
  threshold?: number; // ms - log if render time exceeds this
}

export function usePerformance(
  componentName: string,
  options: PerformanceOptions = {}
) {
  const {
    trackMemory = false,
    logToConsole = process.env.NODE_ENV === 'development',
    threshold = 16, // 60fps = ~16ms per frame
  } = options;

  const renderStartTime = useRef<number>(0);
  const mountCount = useRef<number>(0);
  const rerenderCount = useRef<number>(0);
  const isInitialRender = useRef<boolean>(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentMounts: 0,
    rerenders: 0,
    lastRenderTime: 0,
  });

  // Track component mount
  useEffect(() => {
    mountCount.current += 1;
    setMetrics(prev => ({
      ...prev,
      componentMounts: mountCount.current,
    }));
    if (logToConsole) {
      console.log(`🏗️ ${componentName} mounted (${mountCount.current} times)`);
    }
  }, [componentName, logToConsole]);

  // Track render start
  useEffect(() => {
    if (typeof performance !== 'undefined' && performance.now) {
      renderStartTime.current = performance.now();
    }
  });

  // Track render end and calculate metrics
  useLayoutEffect(() => {
    if (typeof performance === 'undefined' || !performance.now) {
      return;
    }

    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;

    // Only increment rerender count after the initial render
    if (!isInitialRender.current) {
      rerenderCount.current += 1;
    } else {
      isInitialRender.current = false;
    }

    let memoryUsage: number | undefined;
    if (trackMemory && 'memory' in performance) {
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      memoryUsage = memory?.usedJSHeapSize ?? 0; // Return raw bytes as expected by tests
    }

    const newMetrics: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      componentMounts: mountCount.current,
      rerenders: rerenderCount.current,
      lastRenderTime: renderEndTime,
    };

    // Use a ref to store the latest metrics to avoid triggering re-renders
    // and update state only during the next tick to break the cycle
    const timeoutId = setTimeout(() => {
      setMetrics(newMetrics);
    }, 0);

    if (logToConsole) {
      if (renderTime > threshold) {
        console.warn(
          `⚠️ ${componentName} slow render: ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
        );
      } else {
        console.log(
          `⚡ ${componentName} render: ${renderTime.toFixed(2)}ms`
        );
      }

      if (memoryUsage) {
        console.log(`💾 Memory usage: ${memoryUsage.toFixed(2)}MB`);
      }
    }

    return () => clearTimeout(timeoutId);
  }); // Runs on every render but defers state updates

  const getAverageRenderTime = useCallback(() => {
    // This would require storing historical data
    return metrics.renderTime;
  }, [metrics.renderTime]);

  const resetMetrics = useCallback(() => {
    mountCount.current = 0;
    rerenderCount.current = 0;
    setMetrics({
      renderTime: 0,
      componentMounts: 0,
      rerenders: 0,
      lastRenderTime: 0,
    });
  }, []);

  // Performance measurement utilities
  const startMeasure = useCallback((name: string) => {
    try {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`${name}-start`);
      }
    } catch (error) {
      // Silently handle performance API errors
      if (logToConsole) {
        console.warn('Performance API error:', error);
      }
    }
  }, [logToConsole]);

  const endMeasure = useCallback((name: string) => {
    try {
      if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }
    } catch (error) {
      // Silently handle performance API errors
      if (logToConsole) {
        console.warn('Performance API error:', error);
      }
    }
  }, [logToConsole]);

  const measureFunction = useCallback(<T>(name: string, fn: () => T): T => {
    startMeasure(name);
    try {
      const result = fn();
      endMeasure(name);
      return result;
    } catch (error) {
      endMeasure(name);
      throw error;
    }
  }, [startMeasure, endMeasure]);

  return {
    metrics,
    getAverageRenderTime,
    resetMetrics,
    isSlowRender: metrics.renderTime > threshold,
    startMeasure,
    endMeasure,
    measureFunction,
  };
}

// Hook for measuring async operations
export function useAsyncPerformance() {
  const [operations, setOperations] = useState<Map<string, number>>(new Map());

  const startOperation = useCallback((operationName: string) => {
    if (typeof performance === 'undefined' || !performance.now) {
      return 0;
    }
    const startTime = performance.now();
    setOperations(prev => new Map(prev).set(operationName, startTime));
    return startTime;
  }, []);

  const endOperation = useCallback((operationName: string) => {
    if (typeof performance === 'undefined' || !performance.now) {
      return 0;
    }
    const endTime = performance.now();
    const startTime = operations.get(operationName);
    
    if (startTime) {
      const duration = endTime - startTime;
      setOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(operationName);
        return newMap;
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`);
      }

      return duration;
    }

    return 0;
  }, [operations]);

  const measureAsync = useCallback(async <T>(
    operationName: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    // Use performance marks for async operations
    try {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`${operationName}-start`);
      }
    } catch (error) {
      // Silently handle performance API errors
    }

    startOperation(operationName);
    try {
      const result = await asyncFn();
      endOperation(operationName);

      try {
        if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
          performance.mark(`${operationName}-end`);
          performance.measure(operationName, `${operationName}-start`, `${operationName}-end`);
        }
      } catch (error) {
        // Silently handle performance API errors
      }

      return result;
    } catch (error) {
      endOperation(operationName);

      try {
        if (typeof performance !== 'undefined' && performance.mark) {
          performance.mark(`${operationName}-end`);
        }
      } catch (perfError) {
        // Silently handle performance API errors
      }

      throw error;
    }
  }, [startOperation, endOperation]);

  return {
    startOperation,
    endOperation,
    measureAsync,
    activeOperations: Array.from(operations.keys()),
  };
}

// Hook for debouncing callback functions
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Hook for debouncing values
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttling operations
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgs = useRef<Parameters<T> | null>(null);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs.current = args;

    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        if (lastArgs.current) {
          callback(...lastArgs.current);
        }
      }, delay - (now - lastCall.current));
    }
  }, [callback, delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

// Hook for monitoring frame rate
export function useFrameRate(options: { lowFPSThreshold?: number } = {}) {
  const { lowFPSThreshold = 30 } = options;
  const [fps, setFps] = useState<number>(0);
  const frameCount = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    if (typeof performance === 'undefined' || !performance.now) {
      return;
    }

    lastTime.current = performance.now();

    const updateFps = () => {
      frameCount.current++;
      const currentTime = performance.now();

      if (currentTime - lastTime.current >= 1000) {
        const calculatedFps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        setFps(calculatedFps);
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      animationFrame.current = requestAnimationFrame(updateFps);
    };

    animationFrame.current = requestAnimationFrame(updateFps);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  const isLowFPS = fps > 0 && fps < lowFPSThreshold;

  return {
    fps,
    isLowFPS,
  };
}

// Hook for lazy loading components
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: T }>,
  deps: unknown[] = []
) {
  const [component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    setLoading(true);
    setError(null);
    
    importFn()
      .then((module) => {
        if (!cancelled) {
          setComponent(module.default);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [importFn, deps]);

  return { component, loading, error };
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { elementRef, isIntersecting, entry };
}

const PerformanceHooks = {
  usePerformance,
  useAsyncPerformance,
  useDebounce,
  useThrottle,
  useFrameRate,
  useLazyComponent,
  useIntersectionObserver,
};

export default PerformanceHooks;
