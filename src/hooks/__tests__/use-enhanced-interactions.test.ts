/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';

// Mock the interaction manager before importing the hook
const mockInteractionManager = {
  on: jest.fn(),
  off: jest.fn(),
  onTouch: jest.fn(),
  destroy: jest.fn(),
};

jest.mock('@/lib/interaction-manager', () => ({
  InteractionManager: jest.fn().mockImplementation(() => mockInteractionManager),
}));

// Mock mobile utils
jest.mock('@/lib/mobile-utils', () => ({
  mobilePerformance: {
    isLowEndDevice: jest.fn(() => false),
    reduceMotion: jest.fn(() => false),
  },
}));

// Now import the hook after mocking
import { useEnhancedInteractions } from '../use-enhanced-interactions';

// Mock performance monitor
jest.mock('@/lib/performance-monitor', () => ({
  usePerformanceMonitor: () => ({
    measureInteraction: jest.fn((name, fn) => fn()),
    shouldRenderEffect: jest.fn(() => true),
  }),
}));

describe('useEnhancedInteractions', () => {
  let mockElement: HTMLDivElement;
  let mockInteractionManagerConstructor: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked constructor
    const { InteractionManager } = require('@/lib/interaction-manager');
    mockInteractionManagerConstructor = InteractionManager as jest.Mock;

    // Create a mock DOM element
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  describe('Basic functionality', () => {
    it('should return a ref object', () => {
      const { result } = renderHook(() => useEnhancedInteractions());

      expect(result.current.ref).toBeDefined();
      expect(result.current.ref.current).toBeNull();
    });

    it('should create interaction manager when ref is set', () => {
      const onSwipe = jest.fn();
      const { result } = renderHook(() =>
        useEnhancedInteractions({ onSwipe })
      );

      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(mockInteractionManagerConstructor).toHaveBeenCalledWith(mockElement, expect.any(Object));
      expect(mockInteractionManager.on).toHaveBeenCalledWith('swipe', expect.any(Function));
    });

    it('should destroy interaction manager on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useEnhancedInteractions({ onSwipe: jest.fn() })
      );

      act(() => {
        result.current.ref.current = mockElement;
      });

      unmount();

      expect(mockInteractionManager.destroy).toHaveBeenCalled();
    });
  });

  describe('Gesture Handling', () => {
    it('should register swipe gesture handler', () => {
      const onSwipe = jest.fn();
      const { result } = renderHook(() =>
        useEnhancedInteractions({ onSwipe })
      );

      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(mockInteractionManager.on).toHaveBeenCalledWith('swipe', expect.any(Function));
    });

    it('should register tap gesture handler', () => {
      const onTap = jest.fn();
      const { result } = renderHook(() =>
        useEnhancedInteractions({ onTap })
      );

      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(mockInteractionManager.on).toHaveBeenCalledWith('tap', expect.any(Function));
    });

    it('should register long press gesture handler', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useEnhancedInteractions({ onLongPress })
      );

      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(mockInteractionManager.on).toHaveBeenCalledWith('longpress', expect.any(Function));
    });

    it('should register pinch gesture handler', () => {
      const onPinch = jest.fn();
      const { result } = renderHook(() =>
        useEnhancedInteractions({ onPinch })
      );

      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(mockInteractionManager.on).toHaveBeenCalledWith('pinch', expect.any(Function));
    });
  });

  describe('Configuration Options', () => {
    it('should create interaction manager with haptic feedback enabled', () => {
      const { result } = renderHook(() =>
        useEnhancedInteractions({
          onSwipe: jest.fn(),
          enableHapticFeedback: true
        })
      );

      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(mockInteractionManagerConstructor).toHaveBeenCalledWith(
        mockElement,
        expect.objectContaining({ enableHapticFeedback: true })
      );
    });

    it('should create interaction manager with custom swipe threshold', () => {
      const customThreshold = 75;
      const { result } = renderHook(() =>
        useEnhancedInteractions({
          onSwipe: jest.fn(),
          swipeThreshold: customThreshold
        })
      );

      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(mockInteractionManagerConstructor).toHaveBeenCalledWith(
        mockElement,
        expect.objectContaining({ swipeThreshold: customThreshold })
      );
    });

    it('should handle multiple gesture handlers', () => {
      const onSwipe = jest.fn();
      const onTap = jest.fn();
      const onPinch = jest.fn();

      const { result } = renderHook(() =>
        useEnhancedInteractions({ onSwipe, onTap, onPinch })
      );

      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(mockInteractionManager.on).toHaveBeenCalledWith('swipe', expect.any(Function));
      expect(mockInteractionManager.on).toHaveBeenCalledWith('tap', expect.any(Function));
      expect(mockInteractionManager.on).toHaveBeenCalledWith('pinch', expect.any(Function));
    });
  });

  describe('Performance Integration', () => {
    it('should register gesture handlers with interaction manager', () => {
      const onSwipe = jest.fn();
      const { result } = renderHook(() =>
        useEnhancedInteractions({ onSwipe })
      );

      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(mockInteractionManager.on).toHaveBeenCalledWith('swipe', expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('should handle interaction manager creation errors gracefully', () => {
      mockInteractionManagerConstructor.mockImplementation(() => {
        throw new Error('Failed to create manager');
      });

      const { result } = renderHook(() =>
        useEnhancedInteractions({ onSwipe: jest.fn() })
      );

      expect(() => {
        act(() => {
          result.current.ref.current = mockElement;
        });
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should create new interaction manager when element changes', () => {
      const { result } = renderHook(() =>
        useEnhancedInteractions({ onSwipe: jest.fn() })
      );

      // Set initial element
      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(mockInteractionManagerConstructor).toHaveBeenCalledTimes(1);

      // Change to new element
      const newElement = document.createElement('div');
      document.body.appendChild(newElement);

      act(() => {
        result.current.ref.current = newElement;
      });

      expect(mockInteractionManager.destroy).toHaveBeenCalledTimes(1);
      expect(mockInteractionManagerConstructor).toHaveBeenCalledTimes(2);

      document.body.removeChild(newElement);
    });

    it('should handle null ref assignment', () => {
      const { result } = renderHook(() =>
        useEnhancedInteractions({ onSwipe: jest.fn() })
      );

      act(() => {
        result.current.ref.current = mockElement;
      });

      expect(() => {
        act(() => {
          result.current.ref.current = null;
        });
      }).not.toThrow();

      expect(mockInteractionManager.destroy).toHaveBeenCalled();
    });
  });
});
