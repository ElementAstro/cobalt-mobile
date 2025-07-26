/**
 * Accessibility Hook
 * React hook for managing accessibility features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { accessibilityManager, AccessibilitySettings, FocusManagementOptions } from '@/lib/accessibility-manager';
import { getMobileInteractiveClasses } from '@/lib/mobile-utils';
import { deviceDetector, getDeviceInfo } from '@/lib/utils/device-detection';

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(accessibilityManager.getSettings());

  useEffect(() => {
    // Update settings when they change
    const updateSettings = () => {
      setSettings(accessibilityManager.getSettings());
    };

    // Listen for settings changes (if we add an event system later)
    updateSettings();
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    accessibilityManager.announce(message, priority);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    accessibilityManager.updateSettings(newSettings);
    setSettings(accessibilityManager.getSettings());
  }, []);

  return {
    settings,
    announce,
    updateSettings,
    getTouchTargetClasses: accessibilityManager.getTouchTargetClasses.bind(accessibilityManager),
    getFocusIndicatorClasses: accessibilityManager.getFocusIndicatorClasses.bind(accessibilityManager),
  };
}

// Hook for focus management
export function useFocusManagement(options: FocusManagementOptions = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const [isFocusTrapped, setIsFocusTrapped] = useState(false);

  const trapFocus = useCallback(() => {
    if (containerRef.current) {
      accessibilityManager.trapFocus(containerRef.current, options);
      setIsFocusTrapped(true);
    }
  }, [options]);

  const releaseFocus = useCallback(() => {
    accessibilityManager.releaseFocusTrap();
    setIsFocusTrapped(false);
  }, []);

  useEffect(() => {
    return () => {
      if (isFocusTrapped) {
        releaseFocus();
      }
    };
  }, [isFocusTrapped, releaseFocus]);

  return {
    ref: containerRef,
    trapFocus,
    releaseFocus,
    isFocusTrapped,
  };
}

// Hook for accessible button/interactive element
export function useAccessibleInteractive(options: {
  onActivate?: () => void;
  disabled?: boolean;
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaHaspopup?: string;
  ariaPressed?: boolean;
  tabIndex?: number;
} = {}) {
  const { settings, announce, getTouchTargetClasses, getFocusIndicatorClasses } = useAccessibility();
  const elementRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (options.disabled) return;

    // Handle malformed event objects
    if (!event || typeof event.key !== 'string') return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      options.onActivate?.();

      if (settings.hapticFeedbackEnabled) {
        // Haptic feedback is handled in the accessibility manager
      }
    }
  }, [options.onActivate, options.disabled, settings.hapticFeedbackEnabled]);

  const handleClick = useCallback(() => {
    if (options.disabled) return;
    options.onActivate?.();
  }, [options.onActivate, options.disabled]);

  const getAccessibleProps = useCallback(() => {
    const baseClasses = getMobileInteractiveClasses({
      size: settings.touchTargetSize === 'default' ? 'min' : 'recommended',
      feedback: true,
      focus: true,
    });

    const props: any = {
      ref: elementRef,
      className: `${baseClasses} ${getTouchTargetClasses()} ${getFocusIndicatorClasses()}`,
      role: options.role || 'button',
      'aria-disabled': options.disabled,
      tabIndex: options.tabIndex !== undefined ? options.tabIndex : (options.disabled ? -1 : 0),
      onKeyDown: handleKeyDown,
      onClick: handleClick,
    };

    // Only include aria attributes if they are defined
    if (options.ariaLabel) {
      props['aria-label'] = options.ariaLabel;
    }
    if (options.ariaDescribedBy) {
      props['aria-describedby'] = options.ariaDescribedBy;
    }
    if (options.ariaExpanded !== undefined) {
      props['aria-expanded'] = options.ariaExpanded;
    }
    if (options.ariaHaspopup) {
      props['aria-haspopup'] = options.ariaHaspopup;
    }
    if (options.ariaPressed !== undefined) {
      props['aria-pressed'] = options.ariaPressed;
    }

    return props;
  }, [
    settings.touchTargetSize,
    getTouchTargetClasses,
    getFocusIndicatorClasses,
    options.role,
    options.ariaLabel,
    options.ariaDescribedBy,
    options.ariaExpanded,
    options.ariaHaspopup,
    options.ariaPressed,
    options.disabled,
    options.tabIndex,
    handleKeyDown,
    handleClick,
  ]);

  return {
    getAccessibleProps,
    announce,
    settings,
  };
}

// Hook for accessible form elements
export function useAccessibleForm() {
  const { settings, announce } = useAccessibility();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((name: string, value: any, rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  }) => {
    let error = '';

    if (rules.required && (!value || value.toString().trim() === '')) {
      error = `${name} is required`;
    } else if (rules.minLength && value.toString().length < rules.minLength) {
      error = `${name} must be at least ${rules.minLength} characters`;
    } else if (rules.maxLength && value.toString().length > rules.maxLength) {
      error = `${name} must be no more than ${rules.maxLength} characters`;
    } else if (rules.pattern && !rules.pattern.test(value.toString())) {
      error = `${name} format is invalid`;
    } else if (rules.custom) {
      error = rules.custom(value) || '';
    }

    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));

    // Announce errors for screen readers
    if (error && settings.screenReaderEnabled) {
      announce(`Error in ${name}: ${error}`, 'assertive');
    }

    return !error;
  }, [announce, settings.screenReaderEnabled]);

  const getFieldProps = useCallback((name: string, options: {
    label: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
  }) => {
    const hasError = !!errors[name];
    const fieldId = `field-${name}`;
    const errorId = `error-${name}`;

    return {
      field: {
        id: fieldId,
        name,
        type: options.type || 'text',
        placeholder: options.placeholder,
        'aria-label': options.label,
        'aria-required': options.required,
        'aria-invalid': hasError,
        'aria-describedby': hasError ? errorId : undefined,
        className: hasError ? 'error' : '',
      },
      label: {
        htmlFor: fieldId,
        children: options.label + (options.required ? ' *' : ''),
      },
      error: hasError ? {
        id: errorId,
        role: 'alert',
        'aria-live': 'polite',
        children: errors[name],
      } : null,
    };
  }, [errors]);

  return {
    validateField,
    getFieldProps,
    errors,
    clearErrors: () => setErrors({}),
    announce,
    settings,
  };
}

// Hook for accessible navigation
export function useAccessibleNavigation() {
  const { settings, announce } = useAccessibility();

  const announceNavigation = useCallback((destination: string) => {
    if (settings.screenReaderEnabled) {
      announce(`Navigating to ${destination}`, 'polite');
    }
  }, [announce, settings.screenReaderEnabled]);

  const getNavItemProps = useCallback((label: string, isActive: boolean = false) => {
    return {
      role: 'tab',
      'aria-selected': isActive,
      'aria-label': label,
      tabIndex: isActive ? 0 : -1,
    };
  }, []);

  const getNavContainerProps = useCallback(() => {
    return {
      role: 'tablist',
      'aria-label': 'Main navigation',
    };
  }, []);

  return {
    announceNavigation,
    getNavItemProps,
    getNavContainerProps,
    settings,
  };
}

// Hook for accessible modals/dialogs
export function useAccessibleModal(isOpen: boolean) {
  const { trapFocus, releaseFocus, ref } = useFocusManagement({
    trapFocus: true,
    restoreFocus: true,
  });
  const { announce, settings } = useAccessibility();

  useEffect(() => {
    if (isOpen) {
      trapFocus();
      if (settings.screenReaderEnabled) {
        announce('Dialog opened', 'assertive');
      }
    } else {
      releaseFocus();
    }
  }, [isOpen, trapFocus, releaseFocus, announce, settings.screenReaderEnabled]);

  const getModalProps = useCallback(() => {
    return {
      ref,
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': 'modal-title',
      'aria-describedby': 'modal-description',
    };
  }, [ref]);

  return {
    getModalProps,
    announce,
    settings,
  };
}

// Enhanced accessibility hook for cross-device compatibility
export function useEnhancedAccessibility() {
  const baseAccessibility = useAccessibility();
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    screenReader: false,
    voiceOver: false,
    talkBack: false,
    switchControl: false,
    voiceControl: false,
    highContrast: false,
    reducedMotion: false,
    largeText: false,
  });

  // Detect accessibility features
  useEffect(() => {
    const detectAccessibilityFeatures = () => {
      const capabilities = {
        screenReader: detectScreenReader(),
        voiceOver: detectVoiceOver(),
        talkBack: detectTalkBack(),
        switchControl: detectSwitchControl(),
        voiceControl: detectVoiceControl(),
        highContrast: detectHighContrast(),
        reducedMotion: detectReducedMotion(),
        largeText: detectLargeText(),
      };

      setDeviceCapabilities(capabilities);
    };

    detectAccessibilityFeatures();

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
    ];

    const handleChange = () => detectAccessibilityFeatures();
    mediaQueries.forEach(mq => mq.addEventListener('change', handleChange));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', handleChange));
    };
  }, []);

  // Device-specific announcement
  const announceForDevice = useCallback((message: string, options?: {
    priority?: 'polite' | 'assertive';
    deviceSpecific?: boolean;
  }) => {
    const deviceInfo = getDeviceInfo();
    if (!deviceInfo) return;

    let announcement = message;

    if (options?.deviceSpecific) {
      // Add device-specific context
      if (deviceInfo.type === 'mobile') {
        announcement = `On mobile: ${message}`;
      } else if (deviceInfo.type === 'tablet') {
        announcement = `On tablet: ${message}`;
      }
    }

    baseAccessibility.announce(announcement, options?.priority);
  }, [baseAccessibility]);

  // Get device-optimized classes
  const getDeviceOptimizedClasses = useCallback((baseClasses: string) => {
    const deviceInfo = getDeviceInfo();
    if (!deviceInfo) return baseClasses;

    const enhancements = [];

    // Touch target enhancements
    if (deviceInfo.capabilities.touchScreen) {
      enhancements.push('min-h-[44px] min-w-[44px]'); // iOS guidelines
    }

    // High contrast support
    if (deviceCapabilities.highContrast) {
      enhancements.push('contrast-more:border-2 contrast-more:border-current');
    }

    // Reduced motion support
    if (deviceCapabilities.reducedMotion) {
      enhancements.push('motion-reduce:transition-none motion-reduce:animate-none');
    }

    // Large text support
    if (deviceCapabilities.largeText) {
      enhancements.push('text-lg md:text-xl');
    }

    return `${baseClasses} ${enhancements.join(' ')}`;
  }, [deviceCapabilities]);

  return {
    ...baseAccessibility,
    deviceCapabilities,
    announceForDevice,
    getDeviceOptimizedClasses,
  };
}

// Utility functions for accessibility detection
function detectScreenReader(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for common screen reader indicators
  return !!(
    window.navigator.userAgent.includes('NVDA') ||
    window.navigator.userAgent.includes('JAWS') ||
    window.speechSynthesis ||
    (window as any).speechSynthesis
  );
}

function detectVoiceOver(): boolean {
  if (typeof window === 'undefined') return false;

  // VoiceOver detection (iOS/macOS)
  return !!(
    (window as any).speechSynthesis &&
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
  );
}

function detectTalkBack(): boolean {
  if (typeof window === 'undefined') return false;

  // TalkBack detection (Android)
  return !!(
    (window as any).speechSynthesis &&
    /Android/.test(navigator.userAgent)
  );
}

function detectSwitchControl(): boolean {
  if (typeof window === 'undefined') return false;

  // Switch Control is harder to detect, look for indicators
  return !!(
    'ontouchstart' in window &&
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(any-hover: hover)').matches
  );
}

function detectVoiceControl(): boolean {
  if (typeof window === 'undefined') return false;

  // Voice control detection
  return !!(
    'webkitSpeechRecognition' in window ||
    'SpeechRecognition' in window
  );
}

function detectHighContrast(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-contrast: high)').matches;
}

function detectReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function detectLargeText(): boolean {
  if (typeof window === 'undefined') return false;

  // Detect if user has increased text size
  const testElement = document.createElement('div');
  testElement.style.fontSize = '1rem';
  testElement.style.position = 'absolute';
  testElement.style.visibility = 'hidden';
  testElement.textContent = 'Test';

  document.body.appendChild(testElement);
  const fontSize = window.getComputedStyle(testElement).fontSize;
  document.body.removeChild(testElement);

  return parseFloat(fontSize) > 16; // Default is usually 16px
}
