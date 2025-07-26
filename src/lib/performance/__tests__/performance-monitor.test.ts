/**
 * @jest-environment jsdom
 */

import { PerformanceMonitor } from '../performance-monitor';

// Mock performance API
const mockPerformance = {
  now: jest.fn(),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
};

// Ensure performance is available globally
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
  configurable: true,
});

// Also set it on window for browser-like environment
Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
  configurable: true,
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
    mockPerformance.getEntriesByType.mockReturnValue([]);
    mockPerformance.mark.mockImplementation(() => {});
    mockPerformance.measure.mockImplementation(() => {});

    // Ensure performance is available globally for each test
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true,
      configurable: true,
    });

    monitor = new PerformanceMonitor();
  });

  describe('Basic Functionality', () => {
    it('should create performance monitor instance', () => {
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should start timing operations', () => {
      monitor.startTiming('test-operation');
      
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-operation-start');
    });

    it('should end timing operations', () => {
      monitor.startTiming('test-operation');
      monitor.endTiming('test-operation');
      
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-operation-end');
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'test-operation',
        'test-operation-start',
        'test-operation-end'
      );
    });

    it('should measure operation duration', () => {
      const startTime = 1000;
      const endTime = 1500;
      
      mockPerformance.now
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);

      const duration = monitor.measureOperation(() => {
        // Simulate some work
        return 'result';
      });

      expect(duration).toBe(500); // 1500 - 1000
    });
  });

  describe('Memory Monitoring', () => {
    it('should get memory usage when available', () => {
      // Mock memory API
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000,
          jsHeapSizeLimit: 4000000,
        },
        configurable: true,
      });

      const memoryInfo = monitor.getMemoryUsage();
      
      expect(memoryInfo).toEqual({
        used: 1000000,
        total: 2000000,
        limit: 4000000,
      });
    });

    it('should handle missing memory API gracefully', () => {
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true,
      });

      const memoryInfo = monitor.getMemoryUsage();
      
      expect(memoryInfo).toEqual({
        used: 0,
        total: 0,
        limit: 0,
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should collect performance metrics', () => {
      mockPerformance.getEntriesByType.mockReturnValue([
        {
          name: 'test-operation',
          duration: 100,
          startTime: 1000,
        },
      ]);

      const metrics = monitor.getMetrics();

      expect(mockPerformance.getEntriesByType).toHaveBeenCalledWith('measure');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual({
        name: 'test-operation',
        duration: 100,
        startTime: 1000,
        endTime: 1100,
        type: 'timing',
      });
    });

    it('should clear performance data', () => {
      monitor.clearMetrics();
      
      expect(mockPerformance.clearMarks).toHaveBeenCalled();
      expect(mockPerformance.clearMeasures).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle performance API errors gracefully', () => {
      mockPerformance.mark.mockImplementation(() => {
        throw new Error('Performance API error');
      });

      expect(() => {
        monitor.startTiming('test-operation');
      }).not.toThrow();
    });

    it('should handle missing performance API', () => {
      Object.defineProperty(global, 'performance', {
        value: undefined,
        writable: true,
      });

      const newMonitor = new PerformanceMonitor();
      
      expect(() => {
        newMonitor.startTiming('test');
        newMonitor.endTiming('test');
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should measure real async operations', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'completed';
      };

      const startTime = Date.now();
      const result = await monitor.measureAsyncOperation(operation);
      const endTime = Date.now();

      expect(result).toBe('completed');
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should track multiple concurrent operations', () => {
      // Reset call counts
      mockPerformance.mark.mockClear();
      mockPerformance.measure.mockClear();

      monitor.startTiming('operation-1');
      monitor.startTiming('operation-2');
      monitor.startTiming('operation-3');

      monitor.endTiming('operation-1');
      monitor.endTiming('operation-2');
      monitor.endTiming('operation-3');

      expect(mockPerformance.mark).toHaveBeenCalledTimes(6); // 3 starts + 3 ends
      expect(mockPerformance.measure).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance Thresholds', () => {
    it('should detect slow operations', () => {
      mockPerformance.getEntriesByType.mockReturnValue([
        {
          name: 'slow-operation',
          duration: 2000, // 2 seconds
          startTime: 1000,
        },
      ]);

      const slowOperations = monitor.getSlowOperations(1000); // threshold: 1 second

      expect(slowOperations).toHaveLength(1);
      expect(slowOperations[0].name).toBe('slow-operation');
      expect(slowOperations[0].duration).toBe(2000);
    });

    it('should filter fast operations', () => {
      mockPerformance.getEntriesByType.mockReturnValue([
        {
          name: 'fast-operation',
          duration: 50,
          startTime: 1000,
        },
      ]);

      const slowOperations = monitor.getSlowOperations(1000);
      
      expect(slowOperations).toHaveLength(0);
    });
  });

  describe('Resource Monitoring', () => {
    it('should monitor resource loading times', () => {
      mockPerformance.getEntriesByType.mockReturnValue([
        {
          name: 'https://example.com/image.jpg',
          duration: 500,
          transferSize: 1024,
          responseEnd: 1500,
          responseStart: 1000,
        },
      ]);

      const resources = monitor.getResourceMetrics();
      
      expect(mockPerformance.getEntriesByType).toHaveBeenCalledWith('resource');
      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('https://example.com/image.jpg');
    });
  });
});
