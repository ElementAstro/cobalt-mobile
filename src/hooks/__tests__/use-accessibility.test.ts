/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useAccessibility } from '../use-accessibility';

// Mock the accessibility manager
jest.mock('@/lib/accessibility-manager', () => ({
  accessibilityManager: {
    getInstance: jest.fn(() => ({
      announce: jest.fn(),
      trapFocus: jest.fn(),
      releaseFocusTrap: jest.fn(),
      getSettings: jest.fn(() => ({
        screenReaderEnabled: false,
        highContrastMode: false,
        reducedMotion: false,
        largeText: false,
        voiceControlEnabled: false,
        hapticFeedbackEnabled: false,
        focusIndicatorStyle: 'default',
        touchTargetSize: 'default',
      })),
      updateSettings: jest.fn(),
      getTouchTargetClasses: jest.fn(() => ''),
      getFocusIndicatorClasses: jest.fn(() => ''),
    })),
    announce: jest.fn(),
    trapFocus: jest.fn(),
    releaseFocusTrap: jest.fn(),
    getSettings: jest.fn(() => ({
      screenReaderEnabled: false,
      highContrastMode: false,
      reducedMotion: false,
      largeText: false,
      voiceControlEnabled: false,
      hapticFeedbackEnabled: false,
      focusIndicatorStyle: 'default',
      touchTargetSize: 'default',
    })),
    updateSettings: jest.fn(),
    getTouchTargetClasses: jest.fn(() => ''),
    getFocusIndicatorClasses: jest.fn(() => ''),
  },
}));

// Mock mobile utils
jest.mock('@/lib/mobile-utils', () => ({
  getMobileInteractiveClasses: jest.fn(() => 'mock-mobile-classes'),
}));

// Mock device detection
jest.mock('@/lib/utils/device-detection', () => ({
  deviceDetector: {},
  getDeviceInfo: jest.fn(() => ({
    type: 'desktop',
    capabilities: {
      touchScreen: false,
    },
  })),
}));

describe('useAccessibility', () => {
  let mockAccessibilityManager: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { accessibilityManager } = require('@/lib/accessibility-manager');
    mockAccessibilityManager = accessibilityManager;
  });

  describe('Basic functionality', () => {
    it('should initialize with default settings', () => {
      const { result } = renderHook(() => useAccessibility());

      expect(result.current.settings).toEqual({
        screenReaderEnabled: false,
        highContrastMode: false,
        reducedMotion: false,
        largeText: false,
        voiceControlEnabled: false,
        hapticFeedbackEnabled: false,
        focusIndicatorStyle: 'default',
        touchTargetSize: 'default',
      });
    });

    it('should provide announce function', () => {
      const { result } = renderHook(() => useAccessibility());

      expect(typeof result.current.announce).toBe('function');
    });

    it('should provide utility functions', () => {
      const { result } = renderHook(() => useAccessibility());

      expect(typeof result.current.updateSettings).toBe('function');
      expect(typeof result.current.getTouchTargetClasses).toBe('function');
      expect(typeof result.current.getFocusIndicatorClasses).toBe('function');
    });
  });

  describe('Announcements', () => {
    it('should call accessibility manager announce method', () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.announce('Test announcement');
      });

      expect(mockAccessibilityManager.announce).toHaveBeenCalledWith('Test announcement', 'polite');
    });

    it('should handle announcements with priority', () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.announce('Urgent message', 'assertive');
      });

      expect(mockAccessibilityManager.announce).toHaveBeenCalledWith('Urgent message', 'assertive');
    });

    it('should handle empty announcements', () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.announce('');
      });

      expect(mockAccessibilityManager.announce).toHaveBeenCalledWith('', 'polite');
    });

    it('should handle multiple announcements', () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.announce('First announcement');
        result.current.announce('Second announcement', 'assertive');
      });

      expect(mockAccessibilityManager.announce).toHaveBeenCalledTimes(2);
      expect(mockAccessibilityManager.announce).toHaveBeenNthCalledWith(1, 'First announcement', 'polite');
      expect(mockAccessibilityManager.announce).toHaveBeenNthCalledWith(2, 'Second announcement', 'assertive');
    });
  });

  describe('Settings Management', () => {
    it('should update settings', () => {
      const { result } = renderHook(() => useAccessibility());

      const newSettings = {
        highContrastMode: true,
        reducedMotion: true,
      };

      act(() => {
        result.current.updateSettings(newSettings);
      });

      expect(mockAccessibilityManager.updateSettings).toHaveBeenCalledWith(newSettings);
    });

    it('should update settings and refresh local state', () => {
      const { result } = renderHook(() => useAccessibility());

      // Mock updated settings
      mockAccessibilityManager.getSettings.mockReturnValue({
        screenReaderEnabled: false,
        highContrastMode: true,
        reducedMotion: true,
        largeText: false,
        voiceControlEnabled: false,
        hapticFeedbackEnabled: false,
        focusIndicatorStyle: 'default',
        touchTargetSize: 'default',
      });

      const newSettings = {
        highContrastMode: true,
        reducedMotion: true,
      };

      act(() => {
        result.current.updateSettings(newSettings);
      });

      expect(result.current.settings.highContrastMode).toBe(true);
      expect(result.current.settings.reducedMotion).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should provide touch target classes', () => {
      const { result } = renderHook(() => useAccessibility());

      mockAccessibilityManager.getTouchTargetClasses.mockReturnValue('touch-target-large');

      const classes = result.current.getTouchTargetClasses();

      expect(mockAccessibilityManager.getTouchTargetClasses).toHaveBeenCalled();
      expect(classes).toBe('touch-target-large');
    });

    it('should provide focus indicator classes', () => {
      const { result } = renderHook(() => useAccessibility());

      mockAccessibilityManager.getFocusIndicatorClasses.mockReturnValue('focus-indicator-high-contrast');

      const classes = result.current.getFocusIndicatorClasses();

      expect(mockAccessibilityManager.getFocusIndicatorClasses).toHaveBeenCalled();
      expect(classes).toBe('focus-indicator-high-contrast');
    });
  });

  describe('Settings Persistence', () => {
    it('should handle partial settings updates', () => {
      const { result } = renderHook(() => useAccessibility());

      const partialSettings = {
        highContrastMode: true,
        largeText: true,
      };

      act(() => {
        result.current.updateSettings(partialSettings);
      });

      expect(mockAccessibilityManager.updateSettings).toHaveBeenCalledWith(partialSettings);
    });

    it('should handle all accessibility settings', () => {
      const { result } = renderHook(() => useAccessibility());

      const allSettings = {
        screenReaderEnabled: true,
        highContrastMode: true,
        reducedMotion: true,
        largeText: true,
        voiceControlEnabled: true,
        hapticFeedbackEnabled: true,
        focusIndicatorStyle: 'high-contrast' as const,
        touchTargetSize: 'large' as const,
      };

      act(() => {
        result.current.updateSettings(allSettings);
      });

      expect(mockAccessibilityManager.updateSettings).toHaveBeenCalledWith(allSettings);
    });
  });

  describe('Error Handling', () => {
    it('should propagate accessibility manager errors', () => {
      mockAccessibilityManager.announce.mockImplementation(() => {
        throw new Error('Announcement failed');
      });

      const { result } = renderHook(() => useAccessibility());

      expect(() => {
        act(() => {
          result.current.announce('Test');
        });
      }).toThrow('Announcement failed');
    });

    it('should propagate settings update errors', () => {
      mockAccessibilityManager.updateSettings.mockImplementation(() => {
        throw new Error('Settings update failed');
      });

      const { result } = renderHook(() => useAccessibility());

      expect(() => {
        act(() => {
          result.current.updateSettings({ highContrastMode: true });
        });
      }).toThrow('Settings update failed');
    });

    it('should propagate initialization errors', () => {
      mockAccessibilityManager.getSettings.mockImplementation(() => {
        throw new Error('Manager not available');
      });

      expect(() => {
        renderHook(() => useAccessibility());
      }).toThrow('Manager not available');
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      // Reset mocks to default behavior for cleanup tests
      mockAccessibilityManager.getSettings.mockReturnValue({
        screenReaderEnabled: false,
        highContrastMode: false,
        reducedMotion: false,
        largeText: false,
        voiceControlEnabled: false,
        hapticFeedbackEnabled: false,
        focusIndicatorStyle: 'default',
        touchTargetSize: 'default',
      });
    });

    it('should not cause memory leaks when unmounted', () => {
      const { unmount } = renderHook(() => useAccessibility());

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should handle multiple mount/unmount cycles', () => {
      expect(() => {
        const { unmount: unmount1 } = renderHook(() => useAccessibility());
        const { unmount: unmount2 } = renderHook(() => useAccessibility());

        unmount1();
        unmount2();
      }).not.toThrow();
    });
  });
});
