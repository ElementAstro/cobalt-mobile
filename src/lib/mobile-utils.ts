/**
 * Mobile-specific utilities for touch interactions and accessibility
 */

import { cn } from './utils';

/**
 * Touch target size constants following WCAG guidelines
 * Minimum touch target size should be 44x44px (iOS) or 48x48px (Android)
 */
export const TOUCH_TARGET = {
  MIN_SIZE: 44, // Minimum size in pixels
  RECOMMENDED_SIZE: 48, // Recommended size for better UX
  SPACING: 8, // Minimum spacing between touch targets
} as const;

/**
 * Mobile breakpoints for responsive design
 */
export const MOBILE_BREAKPOINTS = {
  xs: 320,
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/**
 * Utility class names for mobile-optimized touch targets
 */
export const touchTargetClasses = {
  // Minimum touch target size
  minTouch: `min-h-[${TOUCH_TARGET.MIN_SIZE}px] min-w-[${TOUCH_TARGET.MIN_SIZE}px]`,
  
  // Recommended touch target size
  recommendedTouch: `min-h-[${TOUCH_TARGET.RECOMMENDED_SIZE}px] min-w-[${TOUCH_TARGET.RECOMMENDED_SIZE}px]`,
  
  // Touch-friendly spacing
  touchSpacing: `gap-${TOUCH_TARGET.SPACING / 4}`, // Tailwind uses 4px base
  
  // Touch manipulation optimization
  touchOptimized: 'touch-manipulation select-none',
  
  // Active state feedback
  touchFeedback: 'active:scale-95 transition-transform duration-75',
  
  // Focus indicators for accessibility
  focusRing: 'focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none',
} as const;

/**
 * Generate mobile-optimized class names for interactive elements
 */
export function getMobileInteractiveClasses(options: {
  size?: 'min' | 'recommended';
  feedback?: boolean;
  focus?: boolean;
  spacing?: boolean;
} = {}) {
  const {
    size = 'min',
    feedback = true,
    focus = true,
    spacing = false,
  } = options;

  return cn(
    // Touch target size
    size === 'min' ? touchTargetClasses.minTouch : touchTargetClasses.recommendedTouch,
    
    // Touch optimization
    touchTargetClasses.touchOptimized,
    
    // Visual feedback
    feedback && touchTargetClasses.touchFeedback,
    
    // Focus indicators
    focus && touchTargetClasses.focusRing,
    
    // Spacing
    spacing && touchTargetClasses.touchSpacing
  );
}

/**
 * Check if the current device is likely a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0)
  );
}

/**
 * Check if the current viewport is mobile-sized
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINTS.md;
}

/**
 * Get the current viewport size category
 */
export function getViewportSize(): keyof typeof MOBILE_BREAKPOINTS {
  if (typeof window === 'undefined') return 'md';
  
  const width = window.innerWidth;
  
  if (width < MOBILE_BREAKPOINTS.xs) return 'xs';
  if (width < MOBILE_BREAKPOINTS.sm) return 'sm';
  if (width < MOBILE_BREAKPOINTS.md) return 'md';
  if (width < MOBILE_BREAKPOINTS.lg) return 'lg';
  return 'xl';
}

/**
 * Haptic feedback utilities
 */
export const hapticFeedback = {
  /**
   * Trigger light haptic feedback
   */
  light(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Trigger medium haptic feedback
   */
  medium(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Trigger heavy haptic feedback
   */
  heavy(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },

  /**
   * Trigger success haptic feedback
   */
  success(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Trigger error haptic feedback
   */
  error(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  },

  /**
   * Check if haptic feedback is supported
   */
  isSupported(): boolean {
    return 'vibrate' in navigator;
  },
} as const;

/**
 * Safe area utilities for devices with notches/home indicators
 */
export const safeArea = {
  /**
   * Get safe area inset classes
   */
  insets: {
    top: 'pt-safe-top',
    bottom: 'pb-safe-bottom',
    left: 'pl-safe-left',
    right: 'pr-safe-right',
    all: 'p-safe',
  },

  /**
   * Get margin safe area classes
   */
  margins: {
    top: 'mt-safe-top',
    bottom: 'mb-safe-bottom',
    left: 'ml-safe-left',
    right: 'mr-safe-right',
    all: 'm-safe',
  },
} as const;

/**
 * Mobile-optimized spacing utilities
 */
export const mobileSpacing = {
  // Compact spacing for mobile
  compact: {
    padding: 'p-3 md:p-4',
    margin: 'm-2 md:m-3',
    gap: 'gap-2 md:gap-3',
  },
  
  // Standard spacing
  standard: {
    padding: 'p-4 md:p-6',
    margin: 'm-3 md:m-4',
    gap: 'gap-3 md:gap-4',
  },
  
  // Generous spacing
  generous: {
    padding: 'p-6 md:p-8',
    margin: 'm-4 md:m-6',
    gap: 'gap-4 md:gap-6',
  },
} as const;

/**
 * Enhanced gesture recognition utilities
 */
export const gestureUtils = {
  /**
   * Calculate gesture velocity
   */
  calculateVelocity: (startTime: number, endTime: number, distance: number) => {
    const timeDiff = endTime - startTime;
    return timeDiff > 0 ? distance / timeDiff : 0;
  },

  /**
   * Determine if gesture is a swipe based on velocity and distance
   */
  isSwipeGesture: (velocity: number, distance: number, minVelocity = 0.3, minDistance = 50) => {
    return velocity >= minVelocity && distance >= minDistance;
  },

  /**
   * Calculate gesture direction with improved accuracy
   */
  getGestureDirection: (deltaX: number, deltaY: number, threshold = 30) => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Require minimum movement
    if (absX < threshold && absY < threshold) return null;

    // Determine primary direction
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  },

  /**
   * Detect multi-touch gestures
   */
  detectPinchGesture: (touches: TouchList) => {
    if (touches.length !== 2) return null;

    const touch1 = touches[0];
    const touch2 = touches[1];

    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;

    return { distance, centerX, centerY };
  },
} as const;

/**
 * Enhanced touch interaction utilities
 */
export const touchInteraction = {
  /**
   * Prevent default touch behaviors that interfere with custom gestures
   */
  preventDefaultTouch: (element: HTMLElement, options: {
    preventScroll?: boolean;
    preventZoom?: boolean;
    preventSelection?: boolean;
  } = {}) => {
    const { preventScroll = true, preventZoom = true, preventSelection = true } = options;

    if (preventScroll) {
      element.style.touchAction = 'none';
    }

    if (preventZoom) {
      element.style.userSelect = 'none';
      element.style.webkitUserSelect = 'none';
    }

    if (preventSelection) {
      (element.style as any).webkitTouchCallout = 'none';
    }
  },

  /**
   * Add touch ripple effect
   */
  addRippleEffect: (element: HTMLElement, event: TouchEvent | MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = ('touches' in event ? event.touches[0].clientX : event.clientX) - rect.left;
    const y = ('touches' in event ? event.touches[0].clientY : event.clientY) - rect.top;

    const ripple = document.createElement('div');
    ripple.className = 'absolute rounded-full bg-current opacity-25 animate-ping pointer-events-none';
    ripple.style.left = `${x - 10}px`;
    ripple.style.top = `${y - 10}px`;
    ripple.style.width = '20px';
    ripple.style.height = '20px';

    element.style.position = 'relative';
    element.appendChild(ripple);

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  },

  /**
   * Debounce touch events to prevent multiple triggers
   */
  debouncedTouch: (callback: () => void, delay = 300) => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  },
} as const;

// Helper functions to avoid circular references
const checkIsLowEndDevice = () => {
  if (typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator) {
    return navigator.hardwareConcurrency <= 2;
  }
  return false;
};

const getDeviceMemoryInfo = () => {
  if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
    return (navigator as any).deviceMemory;
  }
  return null;
};

const checkReduceMotion = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

/**
 * Performance optimization utilities for mobile
 */
export const mobilePerformance = {
  /**
   * Optimize animations for mobile
   */
  reduceMotion: checkReduceMotion,

  /**
   * Check if device has limited resources
   */
  isLowEndDevice: checkIsLowEndDevice,

  /**
   * Get device memory information
   */
  getDeviceMemory: getDeviceMemoryInfo,

  /**
   * Check if device is in power saving mode
   */
  isPowerSaveMode: () => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      return (navigator as any).getBattery().then((battery: any) => battery.charging === false && battery.level < 0.2);
    }
    return Promise.resolve(false);
  },

  /**
   * Get optimized animation duration based on device capabilities
   */
  getAnimationDuration: (baseMs: number = 200) => {
    if (checkReduceMotion()) return 0;
    if (checkIsLowEndDevice()) return baseMs * 0.5;
    const memory = getDeviceMemoryInfo();
    if (memory && memory < 4) return baseMs * 0.7;
    return baseMs;
  },

  /**
   * Optimize frame rate based on device capabilities
   */
  getOptimalFrameRate: () => {
    if (checkIsLowEndDevice()) return 30;
    const memory = getDeviceMemoryInfo();
    if (memory && memory < 4) return 45;
    return 60;
  },
} as const;
