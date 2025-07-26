/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useOptimizedState, useMemoizedCallback, useStableRef, useRenderCount } from '../use-render-optimization';

describe('useOptimizedState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with the provided value', () => {
    const { result } = renderHook(() => useOptimizedState('initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('should batch multiple state updates', () => {
    const { result } = renderHook(() => useOptimizedState(0));

    act(() => {
      const [, setState] = result.current;
      setState(1);
      setState(2);
      setState(3);
    });

    // Updates should be batched, so state should still be 0
    expect(result.current[0]).toBe(0);

    // Fast-forward to trigger batched update
    act(() => {
      jest.runAllTimers();
    });

    expect(result.current[0]).toBe(3);
  });

  it('should handle functional updates', () => {
    const { result } = renderHook(() => useOptimizedState(10));

    act(() => {
      const [, setState] = result.current;
      setState(prev => prev + 1);
      setState(prev => prev * 2);
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current[0]).toBe(22); // (10 + 1) * 2
  });

  it('should cancel previous batched updates when new ones arrive', () => {
    const { result } = renderHook(() => useOptimizedState(0));

    act(() => {
      const [, setState] = result.current;
      setState(1);
    });

    act(() => {
      jest.advanceTimersByTime(5);
    });

    act(() => {
      const [, setState] = result.current;
      setState(2);
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current[0]).toBe(2);
  });

  it('should cleanup timeout on unmount', () => {
    const { result, unmount } = renderHook(() => useOptimizedState(0));

    act(() => {
      const [, setState] = result.current;
      setState(1);
    });

    unmount();

    act(() => {
      jest.runAllTimers();
    });

    // Should not throw or cause issues
    expect(true).toBe(true);
  });
});

describe('useMemoizedCallback', () => {
  it('should return a stable callback reference', () => {
    const mockFn = jest.fn();
    const { result, rerender } = renderHook(
      ({ deps }) => useMemoizedCallback(mockFn, deps),
      { initialProps: { deps: [1, 2] } }
    );

    const firstCallback = result.current;

    rerender({ deps: [1, 2] });
    const secondCallback = result.current;

    expect(firstCallback).toBe(secondCallback);
  });

  it('should update callback when dependencies change', () => {
    let capturedValue = 1;
    const mockFn = jest.fn(() => capturedValue);
    const { result, rerender } = renderHook(
      ({ deps }) => useMemoizedCallback(mockFn, deps),
      { initialProps: { deps: [1, 2] } }
    );

    const firstCallback = result.current;

    // Call the callback to capture the initial value
    act(() => {
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Change the captured value and dependencies
    capturedValue = 2;
    rerender({ deps: [1, 3] });
    const secondCallback = result.current;

    // The callback reference should remain stable (this is the intended behavior)
    expect(firstCallback).toBe(secondCallback);

    // But it should call the updated function
    act(() => {
      result.current();
    });
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should call the underlying function with correct arguments', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useMemoizedCallback(mockFn, []));

    act(() => {
      result.current('arg1', 'arg2');
    });

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should handle functions with different signatures', () => {
    const mockFn = jest.fn((a: number, b: string) => `${a}-${b}`);
    const { result } = renderHook(() => useMemoizedCallback(mockFn, []));

    let returnValue: string;
    act(() => {
      returnValue = result.current(42, 'test');
    });

    expect(returnValue!).toBe('42-test');
    expect(mockFn).toHaveBeenCalledWith(42, 'test');
  });
});

describe('useStableRef', () => {
  it('should maintain stable reference across renders', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useStableRef(value),
      { initialProps: { value: 'initial' } }
    );

    const firstRef = result.current;

    rerender({ value: 'updated' });
    const secondRef = result.current;

    expect(firstRef).toBe(secondRef);
    expect(firstRef.current).toBe('updated');
  });

  it('should update current value when value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useStableRef(value),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current.current).toBe('updated');
  });

  it('should work with complex objects', () => {
    const initialObj = { name: 'test', count: 0 };
    const updatedObj = { name: 'test', count: 1 };

    const { result, rerender } = renderHook(
      ({ value }) => useStableRef(value),
      { initialProps: { value: initialObj } }
    );

    expect(result.current.current).toBe(initialObj);

    rerender({ value: updatedObj });
    expect(result.current.current).toBe(updatedObj);
  });
});

describe('useRenderCount', () => {
  it('should track render count starting from 1', () => {
    const { result } = renderHook(() => useRenderCount());

    expect(result.current).toBe(1);
  });

  it('should increment render count on each render', () => {
    const { result, rerender } = renderHook(() => useRenderCount());

    expect(result.current).toBe(1);

    rerender();
    expect(result.current).toBe(2);

    rerender();
    expect(result.current).toBe(3);
  });

  it('should maintain count across prop changes', () => {
    const { result, rerender } = renderHook(
      ({ prop }) => useRenderCount(),
      { initialProps: { prop: 'initial' } }
    );

    expect(result.current).toBe(1);

    rerender({ prop: 'changed' });
    expect(result.current).toBe(2);

    rerender({ prop: 'changed-again' });
    expect(result.current).toBe(3);
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should work together for complex optimization scenarios', () => {
    const { result, rerender } = renderHook(() => {
      const [state, setState] = useOptimizedState({ count: 0, name: 'test' });
      const renderCount = useRenderCount();
      const stableRef = useStableRef(state);
      
      const memoizedIncrement = useMemoizedCallback(() => {
        setState(prev => ({ ...prev, count: prev.count + 1 }));
      }, []);

      return {
        state,
        setState,
        renderCount,
        stableRef,
        memoizedIncrement,
      };
    });

    expect(result.current.renderCount).toBe(1);
    expect(result.current.state.count).toBe(0);

    const firstIncrement = result.current.memoizedIncrement;

    // Trigger multiple updates
    act(() => {
      result.current.memoizedIncrement();
      result.current.memoizedIncrement();
    });

    // Should still be batched
    expect(result.current.state.count).toBe(0);

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.state.count).toBe(2);

    // Rerender and check callback stability
    rerender();
    expect(result.current.memoizedIncrement).toBe(firstIncrement);
  });

  it('should handle error scenarios gracefully', () => {
    const { result } = renderHook(() => {
      const [state, setState] = useOptimizedState(null);
      
      const memoizedCallback = useMemoizedCallback((value: any) => {
        if (value === null) {
          throw new Error('Null value not allowed');
        }
        setState(value);
      }, []);

      return { state, memoizedCallback };
    });

    expect(() => {
      act(() => {
        result.current.memoizedCallback(null);
      });
    }).toThrow('Null value not allowed');

    // Should still be functional after error
    act(() => {
      result.current.memoizedCallback('valid-value');
    });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.state).toBe('valid-value');
  });

  it('should optimize performance in high-frequency update scenarios', () => {
    const updateCallback = jest.fn();
    
    const { result } = renderHook(() => {
      const [state, setState] = useOptimizedState(0);
      const renderCount = useRenderCount();
      
      const memoizedUpdate = useMemoizedCallback((value: number) => {
        setState(value);
        updateCallback(value);
      }, []);

      return { state, renderCount, memoizedUpdate };
    });

    // Simulate high-frequency updates
    act(() => {
      for (let i = 1; i <= 100; i++) {
        result.current.memoizedUpdate(i);
      }
    });

    // Should have batched all updates
    expect(result.current.state).toBe(0); // Still initial value
    expect(updateCallback).toHaveBeenCalledTimes(100); // But callback called each time

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.state).toBe(100); // Final value after batching
    expect(result.current.renderCount).toBe(2); // Only 2 renders (initial + batched update)
  });
});
