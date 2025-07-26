/**
 * Mobile Accessibility Manager
 * Enhanced accessibility features for mobile devices
 */

import { hapticFeedback } from './mobile-utils';

export interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  voiceControlEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  focusIndicatorStyle: 'default' | 'high-contrast' | 'large';
  touchTargetSize: 'default' | 'large' | 'extra-large';
}

export interface FocusManagementOptions {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: string | HTMLElement;
  skipLinks?: boolean;
}

export class AccessibilityManager {
  private settings: AccessibilitySettings;
  private focusHistory: HTMLElement[] = [];
  private currentFocusTrap: HTMLElement | null = null;
  private announcements: HTMLElement | null = null;
  private skipLinksContainer: HTMLElement | null = null;

  constructor() {
    this.settings = {
      screenReaderEnabled: this.detectScreenReader(),
      highContrastMode: this.detectHighContrast(),
      reducedMotion: this.detectReducedMotion(),
      largeText: this.detectLargeText(),
      voiceControlEnabled: false,
      hapticFeedbackEnabled: hapticFeedback.isSupported(),
      focusIndicatorStyle: 'default',
      touchTargetSize: 'default',
    };

    this.initializeAccessibility();
  }

  private detectScreenReader(): boolean {
    // Check for common screen reader indicators
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    return (
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      navigator.userAgent.includes('TalkBack') ||
      window.speechSynthesis !== undefined
    );
  }

  private detectHighContrast(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  private detectReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private detectLargeText(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-data: reduce)').matches;
  }

  private initializeAccessibility() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    this.createAnnouncementRegion();
    this.createSkipLinks();
    this.setupKeyboardNavigation();
    this.applyAccessibilityStyles();
    this.setupMediaQueryListeners();
  }

  private createAnnouncementRegion() {
    if (typeof document === 'undefined') return;

    this.announcements = document.createElement('div');
    this.announcements.setAttribute('aria-live', 'polite');
    this.announcements.setAttribute('aria-atomic', 'true');
    this.announcements.className = 'sr-only';
    this.announcements.id = 'accessibility-announcements';
    document.body.appendChild(this.announcements);
  }

  private createSkipLinks() {
    if (typeof document === 'undefined') return;

    this.skipLinksContainer = document.createElement('div');
    this.skipLinksContainer.className = 'skip-links';
    this.skipLinksContainer.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#search" class="skip-link">Skip to search</a>
    `;
    document.body.insertBefore(this.skipLinksContainer, document.body.firstChild);
  }

  private setupKeyboardNavigation() {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (event) => {
      // Enhanced keyboard navigation
      switch (event.key) {
        case 'Tab':
          this.handleTabNavigation(event);
          break;
        case 'Escape':
          this.handleEscapeKey(event);
          break;
        case 'Enter':
        case ' ':
          this.handleActivation(event);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(event);
          break;
      }
    });

    // Focus management
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target && target !== document.body) {
        this.focusHistory.push(target);
        if (this.focusHistory.length > 10) {
          this.focusHistory.shift();
        }
      }
    });
  }

  private handleTabNavigation(event: KeyboardEvent) {
    if (this.currentFocusTrap) {
      const focusableElements = this.getFocusableElements(this.currentFocusTrap);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }

  private handleEscapeKey(event: KeyboardEvent) {
    if (this.currentFocusTrap) {
      this.releaseFocusTrap();
      event.preventDefault();
    }
  }

  private handleActivation(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button')) {
      if (this.settings.hapticFeedbackEnabled) {
        hapticFeedback.light();
      }
    }
  }

  private handleArrowNavigation(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const role = target.getAttribute('role');
    
    if (role === 'tablist' || role === 'menubar' || role === 'listbox') {
      event.preventDefault();
      this.navigateWithinRole(target, event.key);
    }
  }

  private navigateWithinRole(container: HTMLElement, key: string) {
    const items = Array.from(container.querySelectorAll('[role="tab"], [role="menuitem"], [role="option"]'));
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    
    let nextIndex = currentIndex;
    
    switch (key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
    }
    
    (items[nextIndex] as HTMLElement)?.focus();
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(selector));
  }

  private applyAccessibilityStyles() {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }

      .skip-links {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
      }

      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        transition: top 0.3s;
      }

      .skip-link:focus {
        top: 6px;
      }

      /* High contrast mode styles */
      @media (prefers-contrast: high) {
        * {
          border-color: currentColor !important;
        }
        
        button, input, select, textarea {
          border: 2px solid currentColor !important;
        }
      }

      /* Reduced motion styles */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* Large touch targets */
      .touch-target-large {
        min-height: 48px !important;
        min-width: 48px !important;
      }

      .touch-target-extra-large {
        min-height: 56px !important;
        min-width: 56px !important;
      }

      /* Enhanced focus indicators */
      .focus-indicator-high-contrast:focus {
        outline: 3px solid #000 !important;
        outline-offset: 2px !important;
      }

      .focus-indicator-large:focus {
        outline: 4px solid currentColor !important;
        outline-offset: 4px !important;
      }
    `;
    document.head.appendChild(style);
  }

  private setupMediaQueryListeners() {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    if (window.matchMedia) {
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotionQuery.addEventListener('change', (e) => {
        this.settings.reducedMotion = e.matches;
      });

      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      highContrastQuery.addEventListener('change', (e) => {
        this.settings.highContrastMode = e.matches;
      });
    }
  }

  // Public API
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (this.announcements) {
      this.announcements.setAttribute('aria-live', priority);
      this.announcements.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (this.announcements) {
          this.announcements.textContent = '';
        }
      }, 1000);
    }
  }

  public trapFocus(container: HTMLElement, options: FocusManagementOptions = {}) {
    this.currentFocusTrap = container;
    
    if (options.initialFocus) {
      const initialElement = typeof options.initialFocus === 'string' 
        ? container.querySelector(options.initialFocus) as HTMLElement
        : options.initialFocus;
      initialElement?.focus();
    } else {
      const firstFocusable = this.getFocusableElements(container)[0];
      firstFocusable?.focus();
    }
  }

  public releaseFocusTrap() {
    this.currentFocusTrap = null;
    
    // Restore focus to previous element
    const lastFocused = this.focusHistory[this.focusHistory.length - 2];
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
  }

  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AccessibilitySettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettingsToDOM();
  }

  private applySettingsToDOM() {
    if (typeof document === 'undefined') return;

    document.documentElement.classList.toggle('high-contrast', this.settings.highContrastMode);
    document.documentElement.classList.toggle('large-text', this.settings.largeText);
    document.documentElement.classList.toggle('reduced-motion', this.settings.reducedMotion);
  }

  public getTouchTargetClasses(): string {
    switch (this.settings.touchTargetSize) {
      case 'large':
        return 'touch-target-large';
      case 'extra-large':
        return 'touch-target-extra-large';
      default:
        return '';
    }
  }

  public getFocusIndicatorClasses(): string {
    switch (this.settings.focusIndicatorStyle) {
      case 'high-contrast':
        return 'focus-indicator-high-contrast';
      case 'large':
        return 'focus-indicator-large';
      default:
        return '';
    }
  }
}

// Lazy singleton instance
let _accessibilityManager: AccessibilityManager | null = null;

export const accessibilityManager = {
  getInstance(): AccessibilityManager {
    if (!_accessibilityManager && typeof window !== 'undefined') {
      _accessibilityManager = new AccessibilityManager();
    }
    return _accessibilityManager!;
  },

  // Proxy methods for backward compatibility
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    return this.getInstance()?.announce(message, priority);
  },

  trapFocus(container: HTMLElement, options: FocusManagementOptions = {}) {
    return this.getInstance()?.trapFocus(container, options);
  },

  releaseFocusTrap() {
    return this.getInstance()?.releaseFocusTrap();
  },

  getSettings() {
    return this.getInstance()?.getSettings() || {
      screenReaderEnabled: false,
      highContrastMode: false,
      reducedMotion: false,
      largeText: false,
      voiceControlEnabled: false,
      hapticFeedbackEnabled: false,
      focusIndicatorStyle: 'default' as const,
      touchTargetSize: 'default' as const,
    };
  },

  updateSettings(newSettings: Partial<AccessibilitySettings>) {
    return this.getInstance()?.updateSettings(newSettings);
  },

  getTouchTargetClasses() {
    return this.getInstance()?.getTouchTargetClasses() || '';
  },

  getFocusIndicatorClasses() {
    return this.getInstance()?.getFocusIndicatorClasses() || '';
  }
};
