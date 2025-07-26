/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('useIsMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Mobile Detection', () => {
    it('should return true for mobile screen sizes', () => {
      // Set mobile screen size (< 768px)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should return false for desktop screen sizes', () => {
      // Set desktop screen size (>= 768px)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it('should return false for tablet screen sizes', () => {
      // Set tablet screen size (>= 768px)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  describe('Responsive Behavior', () => {
    it('should respond to media query changes', () => {
      const mockMatchMedia = window.matchMedia as jest.Mock;
      let mediaQueryCallback: () => void;

      // Mock matchMedia to capture the callback
      mockMatchMedia.mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            mediaQueryCallback = callback;
          }
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      // Set initial mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result, rerender } = renderHook(() => useIsMobile());

      // Should initially be mobile
      expect(result.current).toBe(true);

      // Change to desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      // Trigger the media query change
      act(() => {
        if (mediaQueryCallback) {
          mediaQueryCallback();
        }
      });

      // Should now be desktop
      expect(result.current).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined window.innerWidth', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useIsMobile());

      // Should default to false when width is undefined
      expect(result.current).toBe(false);
    });

    it('should handle exactly 768px width (boundary case)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());

      // 768px should be considered desktop (not mobile)
      expect(result.current).toBe(false);
    });

    it('should handle 767px width (mobile boundary)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      const { result } = renderHook(() => useIsMobile());

      // 767px should be considered mobile
      expect(result.current).toBe(true);
    });
  });
});
