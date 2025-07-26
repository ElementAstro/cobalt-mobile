/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import {
  usePerformance,
  useAsyncPerformance,
  useDebounce,
  useThrottle,
  useFrameRate
} from '../use-performance';

// Mock performance API
const mockPerformance = {
  now: jest.fn(),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('usePerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
    consoleSpy.log.mockClear();
    consoleSpy.warn.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default metrics', () => {
      const { result } = renderHook(() => usePerformance('TestComponent'));

      expect(result.current.metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(result.current.metrics.componentMounts).toBe(1);
      expect(result.current.metrics.rerenders).toBe(0);
      expect(result.current.metrics.lastRenderTime).toBeGreaterThanOrEqual(0);
    });

    it('should track component mounts', () => {
      const { result, rerender } = renderHook(() => usePerformance('TestComponent'));

      expect(result.current.metrics.componentMounts).toBe(1);

      rerender();
      expect(result.current.metrics.componentMounts).toBe(1); // Should not increment on rerender
    });

    it('should track rerenders', () => {
      const { result, rerender } = renderHook(() => usePerformance('TestComponent'));

      expect(result.current.metrics.rerenders).toBe(0);

      rerender();
      expect(result.current.metrics.rerenders).toBe(1);

      rerender();
      expect(result.current.metrics.rerenders).toBe(2);
    });

    it('should measure render time', () => {
      mockPerformance.now
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1016); // End time (16ms later)

      const { result } = renderHook(() => usePerformance('TestComponent'));

      expect(result.current.metrics.renderTime).toBeGreaterThan(0);
      expect(result.current.metrics.lastRenderTime).toBeGreaterThan(0);
    });
  });

  describe('Performance Options', () => {
    it('should track memory when enabled', () => {
      const { result } = renderHook(() => 
        usePerformance('TestComponent', { trackMemory: true })
      );

      expect(result.current.metrics.memoryUsage).toBe(1000000);
    });

    it('should log to console in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderHook(() => usePerformance('TestComponent', { logToConsole: true }));

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('🏗️ TestComponent mounted')
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should warn when render time exceeds threshold', () => {
      // Clear previous calls
      consoleSpy.warn.mockClear();

      mockPerformance.now
        .mockReturnValueOnce(1000) // render start
        .mockReturnValueOnce(1050); // render end (50ms later)

      renderHook(() =>
        usePerformance('TestComponent', { threshold: 16, logToConsole: true })
      );

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ TestComponent slow render')
      );
    });

    it('should not log when logToConsole is disabled', () => {
      renderHook(() => 
        usePerformance('TestComponent', { logToConsole: false })
      );

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('Performance Utilities', () => {
    it('should provide startMeasure and endMeasure functions', () => {
      const { result } = renderHook(() => usePerformance('TestComponent'));

      expect(typeof result.current.startMeasure).toBe('function');
      expect(typeof result.current.endMeasure).toBe('function');

      act(() => {
        result.current.startMeasure('custom-operation');
      });

      expect(mockPerformance.mark).toHaveBeenCalledWith('custom-operation-start');

      act(() => {
        result.current.endMeasure('custom-operation');
      });

      expect(mockPerformance.mark).toHaveBeenCalledWith('custom-operation-end');
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'custom-operation',
        'custom-operation-start',
        'custom-operation-end'
      );
    });

    it('should provide measureFunction utility', () => {
      const { result } = renderHook(() => usePerformance('TestComponent'));
      const mockFunction = jest.fn(() => 'result');

      let functionResult: string;
      act(() => {
        functionResult = result.current.measureFunction('test-fn', mockFunction);
      });

      expect(mockFunction).toHaveBeenCalled();
      expect(functionResult!).toBe('result');
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-fn-start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-fn-end');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing performance API gracefully', () => {
      Object.defineProperty(global, 'performance', {
        value: undefined,
        writable: true,
      });

      expect(() => {
        renderHook(() => usePerformance('TestComponent'));
      }).not.toThrow();

      // Restore performance API
      Object.defineProperty(global, 'performance', {
        value: mockPerformance,
        writable: true,
      });
    });

    it('should handle performance API errors', () => {
      mockPerformance.mark.mockImplementation(() => {
        throw new Error('Performance API error');
      });

      expect(() => {
        const { result } = renderHook(() => usePerformance('TestComponent'));
        act(() => {
          result.current.startMeasure('test');
        });
      }).not.toThrow();
    });
  });
});

describe('useAsyncPerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  it('should measure async operations', async () => {
    const { result } = renderHook(() => useAsyncPerformance());

    const asyncOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'completed';
    };

    let operationResult: string;
    await act(async () => {
      operationResult = await result.current.measureAsync('async-test', asyncOperation);
    });

    expect(operationResult!).toBe('completed');
    expect(mockPerformance.mark).toHaveBeenCalledWith('async-test-start');
    expect(mockPerformance.mark).toHaveBeenCalledWith('async-test-end');
  });

  it('should handle async operation errors', async () => {
    const { result } = renderHook(() => useAsyncPerformance());

    const failingOperation = async () => {
      throw new Error('Async operation failed');
    };

    await act(async () => {
      await expect(
        result.current.measureAsync('failing-test', failingOperation)
      ).rejects.toThrow('Async operation failed');
    });

    expect(mockPerformance.mark).toHaveBeenCalledWith('failing-test-start');
    expect(mockPerformance.mark).toHaveBeenCalledWith('failing-test-end');
  });
});

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce function calls', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useDebounce(mockCallback, 500));

    // Call multiple times rapidly
    act(() => {
      result.current('test1');
      result.current('test2');
      result.current('test3');
    });

    // Should not have been called yet
    expect(mockCallback).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should have been called once with the last value
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('test3');
  });

  it('should cancel previous debounced calls', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useDebounce(mockCallback, 500));

    act(() => {
      result.current('test1');
    });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    act(() => {
      result.current('test2');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('test2');
  });
});

describe('useThrottle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should throttle function calls', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useThrottle(mockCallback, 500));

    // Mock Date.now to work with fake timers
    jest.spyOn(Date, 'now').mockImplementation(() => jest.now());

    // Call multiple times rapidly
    act(() => {
      result.current('test1');
      result.current('test2');
      result.current('test3');
    });

    // Should have been called once immediately
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('test1');

    // Fast-forward time to trigger the delayed call
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // The last call ('test3') should have been executed
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith('test3');

    // Call again after throttle period - should execute immediately
    act(() => {
      result.current('test4');
    });

    expect(mockCallback).toHaveBeenCalledTimes(3);
    expect(mockCallback).toHaveBeenCalledWith('test4');
  });
});

describe('useFrameRate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should track frame rate', () => {
    const { result } = renderHook(() => useFrameRate());

    expect(result.current.fps).toBe(0);
    expect(result.current.isLowFPS).toBe(false);

    // Simulate frame updates
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // FPS should be calculated
    expect(typeof result.current.fps).toBe('number');
  });

  it('should detect low FPS', () => {
    const { result } = renderHook(() => useFrameRate({ lowFPSThreshold: 30 }));

    // Mock low FPS scenario - simulate 10 FPS (100ms per frame)
    let time = 0;
    mockPerformance.now.mockImplementation(() => {
      time += 100; // 100ms per frame = 10 FPS
      return time;
    });

    // Simulate multiple frames over 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // After 1 second with 10 FPS, should detect low FPS
    expect(result.current.fps).toBeLessThan(30);
    expect(result.current.isLowFPS).toBe(true);
  });
});
