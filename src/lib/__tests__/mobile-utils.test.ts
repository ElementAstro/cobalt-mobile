/**
 * @jest-environment jsdom
 */

import {
  TOUCH_TARGET,
  MOBILE_BREAKPOINTS,
  touchTargetClasses,
  getMobileInteractiveClasses,
  isMobileDevice,
  isMobileViewport,
  getViewportSize,
  hapticFeedback,
  safeArea,
  mobileSpacing,
  gestureUtils,
  touchInteraction,
  mobilePerformance,
} from '../mobile-utils';

// Mock navigator
const mockNavigator = {
  userAgent: '',
  maxTouchPoints: 0,
  vibrate: jest.fn(),
  hardwareConcurrency: 4,
  deviceMemory: 8,
  getBattery: jest.fn(),
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('mobile-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigator.userAgent = '';
    mockNavigator.maxTouchPoints = 0;
    mockNavigator.hardwareConcurrency = 4;
    mockNavigator.deviceMemory = 8;
    
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  describe('Constants', () => {
    it('should export touch target constants', () => {
      expect(TOUCH_TARGET.MIN_SIZE).toBe(44);
      expect(TOUCH_TARGET.RECOMMENDED_SIZE).toBe(48);
      expect(TOUCH_TARGET.SPACING).toBe(8);
    });

    it('should export mobile breakpoints', () => {
      expect(MOBILE_BREAKPOINTS.xs).toBe(320);
      expect(MOBILE_BREAKPOINTS.sm).toBe(375);
      expect(MOBILE_BREAKPOINTS.md).toBe(768);
      expect(MOBILE_BREAKPOINTS.lg).toBe(1024);
      expect(MOBILE_BREAKPOINTS.xl).toBe(1280);
    });

    it('should export touch target classes', () => {
      expect(touchTargetClasses.minTouch).toContain('44px');
      expect(touchTargetClasses.recommendedTouch).toContain('48px');
      expect(touchTargetClasses.touchOptimized).toContain('touch-manipulation');
      expect(touchTargetClasses.touchFeedback).toContain('active:scale-95');
      expect(touchTargetClasses.focusRing).toContain('focus:ring-2');
    });
  });

  describe('getMobileInteractiveClasses', () => {
    it('should return default classes', () => {
      const classes = getMobileInteractiveClasses();
      expect(classes).toContain('44px'); // min size
      expect(classes).toContain('touch-manipulation');
      expect(classes).toContain('active:scale-95'); // feedback
      expect(classes).toContain('focus:ring-2'); // focus
    });

    it('should handle size option', () => {
      const minClasses = getMobileInteractiveClasses({ size: 'min' });
      const recommendedClasses = getMobileInteractiveClasses({ size: 'recommended' });
      
      expect(minClasses).toContain('44px');
      expect(recommendedClasses).toContain('48px');
    });

    it('should handle feedback option', () => {
      const withFeedback = getMobileInteractiveClasses({ feedback: true });
      const withoutFeedback = getMobileInteractiveClasses({ feedback: false });
      
      expect(withFeedback).toContain('active:scale-95');
      expect(withoutFeedback).not.toContain('active:scale-95');
    });

    it('should handle focus option', () => {
      const withFocus = getMobileInteractiveClasses({ focus: true });
      const withoutFocus = getMobileInteractiveClasses({ focus: false });
      
      expect(withFocus).toContain('focus:ring-2');
      expect(withoutFocus).not.toContain('focus:ring-2');
    });

    it('should handle spacing option', () => {
      const withSpacing = getMobileInteractiveClasses({ spacing: true });
      const withoutSpacing = getMobileInteractiveClasses({ spacing: false });
      
      expect(withSpacing).toContain('gap-');
      expect(withoutSpacing).not.toContain('gap-');
    });
  });

  describe('Device Detection', () => {
    it('should detect mobile devices by user agent', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      expect(isMobileDevice()).toBe(true);

      mockNavigator.userAgent = 'Mozilla/5.0 (Android 10; Mobile; rv:81.0)';
      expect(isMobileDevice()).toBe(true);

      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      expect(isMobileDevice()).toBe(false);
    });

    it('should detect mobile devices by touch support', () => {
      mockNavigator.userAgent = '';
      mockNavigator.maxTouchPoints = 5;
      expect(isMobileDevice()).toBe(true);

      mockNavigator.maxTouchPoints = 0;
      // Mock ontouchstart
      Object.defineProperty(window, 'ontouchstart', {
        value: {},
        writable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should handle server-side rendering', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(isMobileDevice()).toBe(false);
      
      global.window = originalWindow;
    });
  });

  describe('Viewport Detection', () => {
    it('should detect mobile viewport', () => {
      window.innerWidth = 600;
      expect(isMobileViewport()).toBe(true);

      window.innerWidth = 800;
      expect(isMobileViewport()).toBe(false);
    });

    it('should get viewport size category', () => {
      window.innerWidth = 300;
      expect(getViewportSize()).toBe('xs');

      window.innerWidth = 350;
      expect(getViewportSize()).toBe('sm');

      window.innerWidth = 700;
      expect(getViewportSize()).toBe('md');

      window.innerWidth = 900;
      expect(getViewportSize()).toBe('lg');

      window.innerWidth = 1400;
      expect(getViewportSize()).toBe('xl');
    });

    it('should handle server-side rendering for viewport', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(isMobileViewport()).toBe(false);
      expect(getViewportSize()).toBe('md');
      
      global.window = originalWindow;
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger light haptic feedback', () => {
      hapticFeedback.light();
      expect(mockNavigator.vibrate).toHaveBeenCalledWith(10);
    });

    it('should trigger medium haptic feedback', () => {
      hapticFeedback.medium();
      expect(mockNavigator.vibrate).toHaveBeenCalledWith(20);
    });

    it('should trigger heavy haptic feedback', () => {
      hapticFeedback.heavy();
      expect(mockNavigator.vibrate).toHaveBeenCalledWith(30);
    });

    it('should trigger success haptic feedback', () => {
      hapticFeedback.success();
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([10, 50, 10]);
    });

    it('should trigger error haptic feedback', () => {
      hapticFeedback.error();
      expect(mockNavigator.vibrate).toHaveBeenCalledWith([50, 50, 50]);
    });

    it('should check if haptic feedback is supported', () => {
      expect(hapticFeedback.isSupported()).toBe(true);

      delete (mockNavigator as any).vibrate;
      expect(hapticFeedback.isSupported()).toBe(false);
    });

    it('should handle missing vibrate API gracefully', () => {
      delete (mockNavigator as any).vibrate;
      
      expect(() => {
        hapticFeedback.light();
        hapticFeedback.medium();
        hapticFeedback.heavy();
        hapticFeedback.success();
        hapticFeedback.error();
      }).not.toThrow();
    });
  });

  describe('Safe Area Utilities', () => {
    it('should provide safe area inset classes', () => {
      expect(safeArea.insets.top).toBe('pt-safe-top');
      expect(safeArea.insets.bottom).toBe('pb-safe-bottom');
      expect(safeArea.insets.left).toBe('pl-safe-left');
      expect(safeArea.insets.right).toBe('pr-safe-right');
      expect(safeArea.insets.all).toBe('p-safe');
    });

    it('should provide safe area margin classes', () => {
      expect(safeArea.margins.top).toBe('mt-safe-top');
      expect(safeArea.margins.bottom).toBe('mb-safe-bottom');
      expect(safeArea.margins.left).toBe('ml-safe-left');
      expect(safeArea.margins.right).toBe('mr-safe-right');
      expect(safeArea.margins.all).toBe('m-safe');
    });
  });

  describe('Mobile Spacing', () => {
    it('should provide compact spacing', () => {
      expect(mobileSpacing.compact.padding).toBe('p-3 md:p-4');
      expect(mobileSpacing.compact.margin).toBe('m-2 md:m-3');
      expect(mobileSpacing.compact.gap).toBe('gap-2 md:gap-3');
    });

    it('should provide standard spacing', () => {
      expect(mobileSpacing.standard.padding).toBe('p-4 md:p-6');
      expect(mobileSpacing.standard.margin).toBe('m-3 md:m-4');
      expect(mobileSpacing.standard.gap).toBe('gap-3 md:gap-4');
    });

    it('should provide generous spacing', () => {
      expect(mobileSpacing.generous.padding).toBe('p-6 md:p-8');
      expect(mobileSpacing.generous.margin).toBe('m-4 md:m-6');
      expect(mobileSpacing.generous.gap).toBe('gap-4 md:gap-6');
    });
  });

  describe('Gesture Utils', () => {
    it('should calculate gesture velocity', () => {
      const velocity = gestureUtils.calculateVelocity(0, 1000, 100);
      expect(velocity).toBe(0.1);

      const zeroVelocity = gestureUtils.calculateVelocity(0, 0, 100);
      expect(zeroVelocity).toBe(0);
    });

    it('should determine if gesture is a swipe', () => {
      expect(gestureUtils.isSwipeGesture(0.5, 100)).toBe(true);
      expect(gestureUtils.isSwipeGesture(0.1, 100)).toBe(false);
      expect(gestureUtils.isSwipeGesture(0.5, 20)).toBe(false);
    });

    it('should calculate gesture direction', () => {
      expect(gestureUtils.getGestureDirection(100, 10)).toBe('right');
      expect(gestureUtils.getGestureDirection(-100, 10)).toBe('left');
      expect(gestureUtils.getGestureDirection(10, 100)).toBe('down');
      expect(gestureUtils.getGestureDirection(10, -100)).toBe('up');
      expect(gestureUtils.getGestureDirection(10, 10)).toBeNull();
    });

    it('should detect pinch gestures', () => {
      const mockTouches = [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ] as any;

      const pinch = gestureUtils.detectPinchGesture(mockTouches);
      expect(pinch).toEqual({
        distance: Math.sqrt(20000), // sqrt((200-100)^2 + (200-100)^2)
        centerX: 150,
        centerY: 150,
      });

      const singleTouch = [{ clientX: 100, clientY: 100 }] as any;
      expect(gestureUtils.detectPinchGesture(singleTouch)).toBeNull();
    });
  });

  describe('Touch Interaction', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
      mockElement = document.createElement('div');
      document.body.appendChild(mockElement);
    });

    afterEach(() => {
      document.body.removeChild(mockElement);
    });

    it('should prevent default touch behaviors', () => {
      touchInteraction.preventDefaultTouch(mockElement);

      expect(mockElement.style.touchAction).toBe('none');
      expect(mockElement.style.userSelect).toBe('none');
      expect((mockElement.style as any).webkitTouchCallout).toBe('none');
    });

    it('should handle selective touch prevention', () => {
      touchInteraction.preventDefaultTouch(mockElement, {
        preventScroll: false,
        preventZoom: true,
        preventSelection: false,
      });

      expect(mockElement.style.touchAction).not.toBe('none');
      expect(mockElement.style.userSelect).toBe('none');
      expect((mockElement.style as any).webkitTouchCallout).not.toBe('none');
    });

    it('should add ripple effect for touch events', () => {
      const mockTouchEvent = {
        touches: [{ clientX: 150, clientY: 100 }],
      } as any;

      touchInteraction.addRippleEffect(mockElement, mockTouchEvent);

      expect(mockElement.style.position).toBe('relative');
      expect(mockElement.children.length).toBe(1);

      const ripple = mockElement.children[0] as HTMLElement;
      expect(ripple.className).toContain('animate-ping');
      expect(ripple.style.left).toBe('140px'); // 150 - 10
      expect(ripple.style.top).toBe('90px'); // 100 - 10
    });

    it('should add ripple effect for mouse events', () => {
      const mockMouseEvent = {
        clientX: 150,
        clientY: 100,
      } as any;

      // Mock getBoundingClientRect
      mockElement.getBoundingClientRect = jest.fn().mockReturnValue({
        left: 50,
        top: 50,
        width: 200,
        height: 100,
      });

      touchInteraction.addRippleEffect(mockElement, mockMouseEvent);

      expect(mockElement.children.length).toBe(1);

      const ripple = mockElement.children[0] as HTMLElement;
      expect(ripple.style.left).toBe('90px'); // (150 - 50) - 10
      expect(ripple.style.top).toBe('40px'); // (100 - 50) - 10
    });

    it('should remove ripple effect after timeout', (done) => {
      const mockTouchEvent = {
        touches: [{ clientX: 150, clientY: 100 }],
      } as any;

      touchInteraction.addRippleEffect(mockElement, mockTouchEvent);

      expect(mockElement.children.length).toBe(1);

      setTimeout(() => {
        expect(mockElement.children.length).toBe(0);
        done();
      }, 650);
    });

    it('should create debounced touch handler', (done) => {
      const mockCallback = jest.fn();
      const debouncedHandler = touchInteraction.debouncedTouch(mockCallback, 100);

      // Call multiple times rapidly
      debouncedHandler();
      debouncedHandler();
      debouncedHandler();

      // Should not be called immediately
      expect(mockCallback).not.toHaveBeenCalled();

      setTimeout(() => {
        // Should be called only once after delay
        expect(mockCallback).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });
  });

  describe('Mobile Performance', () => {
    it('should check for reduced motion preference', () => {
      (window.matchMedia as jest.Mock).mockReturnValue({ matches: true });
      expect(mobilePerformance.reduceMotion()).toBe(true);

      (window.matchMedia as jest.Mock).mockReturnValue({ matches: false });
      expect(mobilePerformance.reduceMotion()).toBe(false);
    });

    it('should detect low-end devices', () => {
      mockNavigator.hardwareConcurrency = 2;
      expect(mobilePerformance.isLowEndDevice()).toBe(true);

      mockNavigator.hardwareConcurrency = 4;
      expect(mobilePerformance.isLowEndDevice()).toBe(false);
    });

    it('should get device memory information', () => {
      mockNavigator.deviceMemory = 4;
      expect(mobilePerformance.getDeviceMemory()).toBe(4);

      delete (mockNavigator as any).deviceMemory;
      expect(mobilePerformance.getDeviceMemory()).toBeNull();
    });

    it('should check power save mode', async () => {
      const mockBattery = { charging: false, level: 0.1 };
      mockNavigator.getBattery = jest.fn().mockResolvedValue(mockBattery);

      const isPowerSave = await mobilePerformance.isPowerSaveMode();
      expect(isPowerSave).toBe(true);

      mockBattery.level = 0.5;
      const isNotPowerSave = await mobilePerformance.isPowerSaveMode();
      expect(isNotPowerSave).toBe(false);
    });

    it('should get optimized animation duration', () => {
      // Normal device
      mockNavigator.hardwareConcurrency = 4;
      mockNavigator.deviceMemory = 8;
      (window.matchMedia as jest.Mock).mockReturnValue({ matches: false });

      expect(mobilePerformance.getAnimationDuration(200)).toBe(200);

      // Reduced motion
      (window.matchMedia as jest.Mock).mockReturnValue({ matches: true });
      expect(mobilePerformance.getAnimationDuration(200)).toBe(0);

      // Low-end device
      (window.matchMedia as jest.Mock).mockReturnValue({ matches: false });
      mockNavigator.hardwareConcurrency = 2;
      expect(mobilePerformance.getAnimationDuration(200)).toBe(100);

      // Low memory device
      mockNavigator.hardwareConcurrency = 4;
      mockNavigator.deviceMemory = 2;
      expect(mobilePerformance.getAnimationDuration(200)).toBe(140);
    });

    it('should get optimal frame rate', () => {
      // Normal device
      mockNavigator.hardwareConcurrency = 4;
      mockNavigator.deviceMemory = 8;
      expect(mobilePerformance.getOptimalFrameRate()).toBe(60);

      // Low-end device
      mockNavigator.hardwareConcurrency = 2;
      expect(mobilePerformance.getOptimalFrameRate()).toBe(30);

      // Low memory device
      mockNavigator.hardwareConcurrency = 4;
      mockNavigator.deviceMemory = 2;
      expect(mobilePerformance.getOptimalFrameRate()).toBe(45);
    });

    it('should handle missing APIs gracefully', () => {
      delete (mockNavigator as any).hardwareConcurrency;
      delete (mockNavigator as any).deviceMemory;
      delete (mockNavigator as any).getBattery;

      expect(mobilePerformance.isLowEndDevice()).toBe(false);
      expect(mobilePerformance.getDeviceMemory()).toBeNull();
      expect(mobilePerformance.isPowerSaveMode()).resolves.toBe(false);
    });
  });
});
