/**
 * Performance Monitor for tracking application performance metrics
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  type: 'timing' | 'counter' | 'gauge';
  value?: number;
  tags?: Record<string, string>;
}

export interface PerformanceSettings {
  enableTiming: boolean;
  enableMemoryTracking: boolean;
  enableNetworkTracking: boolean;
  maxMetrics: number;
  slowOperationThreshold: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private activeTimings: Map<string, number> = new Map();
  private settings: PerformanceSettings;
  private observers: PerformanceObserver[] = [];

  constructor(settings: Partial<PerformanceSettings> = {}) {
    this.settings = {
      enableTiming: true,
      enableMemoryTracking: true,
      enableNetworkTracking: true,
      maxMetrics: 1000,
      slowOperationThreshold: 1000,
      ...settings,
    };

    this.initializeObservers();
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: `navigation.${entry.name}`,
            startTime: entry.startTime,
            endTime: entry.startTime + entry.duration,
            duration: entry.duration,
            type: 'timing',
          });
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: `resource.${entry.name}`,
            startTime: entry.startTime,
            endTime: entry.startTime + entry.duration,
            duration: entry.duration,
            type: 'timing',
          });
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Observe measure timing
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            startTime: entry.startTime,
            endTime: entry.startTime + entry.duration,
            duration: entry.duration,
            type: 'timing',
          });
        }
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);
    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
    }
  }

  startTiming(name: string): void {
    if (!this.settings.enableTiming) return;

    try {
      const startTime = this.now();
      this.activeTimings.set(name, startTime);

      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`${name}-start`);
      }
    } catch (error) {
      console.warn('Failed to start timing:', error);
    }
  }

  endTiming(name: string): number {
    if (!this.settings.enableTiming) return 0;

    try {
      const endTime = this.now();
      const startTime = this.activeTimings.get(name);

      if (startTime === undefined) {
        console.warn(`No start time found for timing: ${name}`);
        return 0;
      }

      const duration = endTime - startTime;
      this.activeTimings.delete(name);

      if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }

      this.recordMetric({
        name,
        startTime,
        endTime,
        duration,
        type: 'timing',
      });

      return duration;
    } catch (error) {
      console.warn('Failed to end timing:', error);
      return 0;
    }
  }

  recordCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      startTime: this.now(),
      type: 'counter',
      value,
      tags,
    });
  }

  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      startTime: this.now(),
      type: 'gauge',
      value,
      tags,
    });
  }

  private recordMetric(metric: PerformanceMetric): void {
    // Enforce max metrics limit
    if (this.metrics.size >= this.settings.maxMetrics) {
      const oldestKey = this.metrics.keys().next().value;
      if (oldestKey) {
        this.metrics.delete(oldestKey);
      }
    }

    this.metrics.set(`${metric.name}-${metric.startTime}`, metric);

    // Log slow operations
    if (metric.duration && metric.duration > this.settings.slowOperationThreshold) {
      console.warn(`Slow operation detected: ${metric.name} took ${metric.duration}ms`);
    }
  }

  getMetrics(): PerformanceMetric[] {
    // Get metrics from performance API if available
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      try {
        const measureEntries = performance.getEntriesByType('measure') as PerformanceMeasure[];
        const apiMetrics = measureEntries.map(entry => ({
          name: entry.name,
          startTime: entry.startTime,
          endTime: entry.startTime + entry.duration,
          duration: entry.duration,
          type: 'timing' as const,
        }));

        // Combine with stored metrics
        return [...Array.from(this.metrics.values()), ...apiMetrics];
      } catch (error) {
        console.warn('Failed to get performance entries:', error);
      }
    }

    return Array.from(this.metrics.values());
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.getMetrics().filter(metric => metric.name === name);
  }

  getSlowOperations(threshold?: number): PerformanceMetric[] {
    const slowThreshold = threshold || this.settings.slowOperationThreshold;
    return this.getMetrics().filter(metric => 
      metric.duration && metric.duration > slowThreshold
    );
  }

  getAverageTime(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const totalTime = metrics.reduce((sum, metric) => sum + (metric.duration || 0), 0);
    return totalTime / metrics.length;
  }

  getMemoryUsage(): { used: number; total: number; limit: number } {
    try {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory;
        return {
          used: memory.usedJSHeapSize || 0,
          total: memory.totalJSHeapSize || 0,
          limit: memory.jsHeapSizeLimit || 0,
        };
      }
    } catch (error) {
      console.warn('Failed to get memory usage:', error);
    }

    // Return default values when memory API is not available
    return {
      used: 0,
      total: 0,
      limit: 0,
    };
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.activeTimings.clear();

    // Clear performance API data
    if (typeof performance !== 'undefined') {
      try {
        if (performance.clearMarks) performance.clearMarks();
        if (performance.clearMeasures) performance.clearMeasures();
      } catch (error) {
        console.warn('Failed to clear performance data:', error);
      }
    }
  }

  destroy(): void {
    this.clearMetrics();
    
    // Disconnect observers
    for (const observer of this.observers) {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect performance observer:', error);
      }
    }
    this.observers = [];
  }

  private now(): number {
    try {
      return typeof performance !== 'undefined' && performance.now 
        ? performance.now() 
        : Date.now();
    } catch (error) {
      return Date.now();
    }
  }

  // Utility method for measuring function execution
  measure<T>(name: string, fn: () => T): T {
    this.startTiming(name);
    try {
      const result = fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  // Method for measuring operation duration
  measureOperation<T>(fn: () => T): number {
    const startTime = this.now();
    try {
      fn();
      const endTime = this.now();
      return endTime - startTime;
    } catch (error) {
      const endTime = this.now();
      return endTime - startTime;
    }
  }

  // Method for measuring async operations
  async measureAsyncOperation<T>(fn: () => Promise<T>): Promise<T> {
    const startTime = this.now();
    try {
      const result = await fn();
      const endTime = this.now();
      const duration = endTime - startTime;

      this.recordMetric({
        name: 'async-operation',
        startTime,
        endTime,
        duration,
        type: 'timing',
      });

      return result;
    } catch (error) {
      const endTime = this.now();
      const duration = endTime - startTime;

      this.recordMetric({
        name: 'async-operation-error',
        startTime,
        endTime,
        duration,
        type: 'timing',
      });

      throw error;
    }
  }

  // Method for getting resource metrics
  getResourceMetrics(): Array<{ name: string; duration: number; startTime: number }> {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return [];
    }

    try {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resourceEntries.map(entry => ({
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
      }));
    } catch (error) {
      console.warn('Failed to get resource metrics:', error);
      return [];
    }
  }


  // Utility method for measuring async function execution
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(name);
    try {
      const result = await fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  // Get performance summary
  getSummary(): {
    totalMetrics: number;
    slowOperations: number;
    averageResponseTime: number;
    memoryUsage: { used: number; total: number; limit: number } | null;
  } {
    const metrics = this.getMetrics();
    const slowOps = this.getSlowOperations();
    const timingMetrics = metrics.filter(m => m.type === 'timing' && m.duration);
    const avgResponseTime = timingMetrics.length > 0
      ? timingMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / timingMetrics.length
      : 0;

    return {
      totalMetrics: metrics.length,
      slowOperations: slowOps.length,
      averageResponseTime: avgResponseTime,
      memoryUsage: this.getMemoryUsage(),
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
