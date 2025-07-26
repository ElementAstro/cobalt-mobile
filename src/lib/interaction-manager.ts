/**
 * Enhanced Mobile Interaction Manager
 * Coordinates all mobile interactions, gestures, and touch events
 */

import { gestureUtils, touchInteraction, hapticFeedback, mobilePerformance } from './mobile-utils';

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface GestureState {
  isActive: boolean;
  startTime: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  type: 'swipe' | 'tap' | 'long-press' | 'pinch' | 'pan' | null;
  touches: TouchPoint[];
}

export interface InteractionConfig {
  swipeThreshold: number;
  tapTimeout: number;
  longPressTimeout: number;
  velocityThreshold: number;
  preventDefaultTouch: boolean;
  enableHapticFeedback: boolean;
  enableRippleEffect: boolean;
  debounceDelay: number;
}

export type GestureCallback = (gesture: GestureState) => void;
export type TouchCallback = (event: TouchEvent) => void;

export class InteractionManager {
  private element: HTMLElement;
  private config: InteractionConfig;
  private gestureState: GestureState;
  private callbacks: Map<string, GestureCallback[]>;
  private touchCallbacks: Map<string, TouchCallback[]>;
  private longPressTimer: NodeJS.Timeout | null = null;
  private tapTimer: NodeJS.Timeout | null = null;
  private lastTapTime = 0;
  private tapCount = 0;

  constructor(element: HTMLElement, config: Partial<InteractionConfig> = {}) {
    this.element = element;
    this.config = {
      swipeThreshold: 50,
      tapTimeout: 300,
      longPressTimeout: 500,
      velocityThreshold: 0.3,
      preventDefaultTouch: true,
      enableHapticFeedback: true,
      enableRippleEffect: true,
      debounceDelay: 100,
      ...config,
    };

    this.gestureState = this.createInitialGestureState();
    this.callbacks = new Map();
    this.touchCallbacks = new Map();

    this.setupEventListeners();
    this.setupTouchOptimizations();
  }

  private createInitialGestureState(): GestureState {
    return {
      isActive: false,
      startTime: 0,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
      direction: null,
      type: null,
      touches: [],
    };
  }

  private setupEventListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    
    // Mouse events for desktop testing
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  private setupTouchOptimizations() {
    if (this.config.preventDefaultTouch) {
      touchInteraction.preventDefaultTouch(this.element, {
        preventScroll: true,
        preventZoom: true,
        preventSelection: true,
      });
    }
  }

  private handleTouchStart(event: TouchEvent) {
    this.triggerTouchCallback('touchstart', event);
    
    if (this.config.preventDefaultTouch) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    const now = Date.now();

    // Handle multi-touch
    if (event.touches.length > 1) {
      this.handleMultiTouch(event);
      return;
    }

    // Reset gesture state
    this.gestureState = {
      ...this.createInitialGestureState(),
      isActive: true,
      startTime: now,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      touches: Array.from(event.touches).map((t, index) => ({
        id: t.identifier,
        x: t.clientX,
        y: t.clientY,
        timestamp: now,
      })),
    };

    // Setup long press detection
    this.longPressTimer = setTimeout(() => {
      if (this.gestureState.isActive) {
        this.gestureState.type = 'long-press';
        this.triggerGestureCallback('longpress', this.gestureState);
        if (this.config.enableHapticFeedback) {
          hapticFeedback.medium();
        }
      }
    }, this.config.longPressTimeout);

    // Add ripple effect
    if (this.config.enableRippleEffect) {
      touchInteraction.addRippleEffect(this.element, event);
    }
  }

  private handleTouchMove(event: TouchEvent) {
    this.triggerTouchCallback('touchmove', event);
    
    if (!this.gestureState.isActive) return;

    if (this.config.preventDefaultTouch) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    const now = Date.now();

    // Update gesture state
    this.gestureState.currentX = touch.clientX;
    this.gestureState.currentY = touch.clientY;
    this.gestureState.deltaX = touch.clientX - this.gestureState.startX;
    this.gestureState.deltaY = touch.clientY - this.gestureState.startY;

    // Calculate velocity
    const distance = Math.sqrt(
      this.gestureState.deltaX ** 2 + this.gestureState.deltaY ** 2
    );
    this.gestureState.velocity = gestureUtils.calculateVelocity(
      this.gestureState.startTime,
      now,
      distance
    );

    // Determine direction
    this.gestureState.direction = gestureUtils.getGestureDirection(
      this.gestureState.deltaX,
      this.gestureState.deltaY
    );

    // Clear long press timer if moved too much
    if (distance > 10 && this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Determine gesture type
    if (distance > this.config.swipeThreshold) {
      this.gestureState.type = 'swipe';
    } else if (distance > 5) {
      this.gestureState.type = 'pan';
    }

    // Trigger move callbacks
    this.triggerGestureCallback('move', this.gestureState);
  }

  private handleTouchEnd(event: TouchEvent) {
    this.triggerTouchCallback('touchend', event);
    
    if (!this.gestureState.isActive) return;

    const now = Date.now();
    const distance = Math.sqrt(
      this.gestureState.deltaX ** 2 + this.gestureState.deltaY ** 2
    );

    // Clear timers
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Determine final gesture type
    if (this.gestureState.type === null) {
      if (distance < 10 && now - this.gestureState.startTime < this.config.tapTimeout) {
        this.handleTap(now);
      }
    } else if (this.gestureState.type === 'swipe') {
      this.triggerGestureCallback('swipe', this.gestureState);
      if (this.config.enableHapticFeedback) {
        hapticFeedback.light();
      }
    }

    // Trigger end callback
    this.triggerGestureCallback('end', this.gestureState);

    // Reset state
    this.gestureState = this.createInitialGestureState();
  }

  private handleTouchCancel(event: TouchEvent) {
    this.triggerTouchCallback('touchcancel', event);
    this.resetGestureState();
  }

  private handleMultiTouch(event: TouchEvent) {
    if (event.touches.length === 2) {
      const pinchData = gestureUtils.detectPinchGesture(event.touches);
      if (pinchData) {
        this.gestureState.type = 'pinch';
        this.triggerGestureCallback('pinch', {
          ...this.gestureState,
          ...pinchData,
        });
      }
    }
  }

  private handleTap(timestamp: number) {
    const timeSinceLastTap = timestamp - this.lastTapTime;
    
    if (timeSinceLastTap < this.config.tapTimeout) {
      this.tapCount++;
    } else {
      this.tapCount = 1;
    }

    this.lastTapTime = timestamp;

    // Clear existing tap timer
    if (this.tapTimer) {
      clearTimeout(this.tapTimer);
    }

    // Set new tap timer
    this.tapTimer = setTimeout(() => {
      if (this.tapCount === 1) {
        this.gestureState.type = 'tap';
        this.triggerGestureCallback('tap', this.gestureState);
      } else if (this.tapCount === 2) {
        this.triggerGestureCallback('doubletap', this.gestureState);
      }
      
      if (this.config.enableHapticFeedback) {
        hapticFeedback.light();
      }
      
      this.tapCount = 0;
    }, this.config.tapTimeout);
  }

  // Mouse event handlers for desktop testing
  private handleMouseDown(event: MouseEvent) {
    const touchEvent = this.createTouchEventFromMouse(event, 'touchstart');
    this.handleTouchStart(touchEvent);
  }

  private handleMouseMove(event: MouseEvent) {
    if (!this.gestureState.isActive) return;
    const touchEvent = this.createTouchEventFromMouse(event, 'touchmove');
    this.handleTouchMove(touchEvent);
  }

  private handleMouseUp(event: MouseEvent) {
    const touchEvent = this.createTouchEventFromMouse(event, 'touchend');
    this.handleTouchEnd(touchEvent);
  }

  private createTouchEventFromMouse(event: MouseEvent, type: string): TouchEvent {
    const touch = {
      identifier: 0,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      screenX: event.screenX,
      screenY: event.screenY,
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 1,
      target: event.target,
    } as Touch;

    return {
      type,
      touches: type === 'touchend' ? [] : [touch],
      changedTouches: [touch],
      targetTouches: type === 'touchend' ? [] : [touch],
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
    } as any;
  }

  private resetGestureState() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.tapTimer) {
      clearTimeout(this.tapTimer);
      this.tapTimer = null;
    }
    this.gestureState = this.createInitialGestureState();
  }

  private triggerGestureCallback(type: string, gesture: GestureState) {
    const callbacks = this.callbacks.get(type);
    if (callbacks) {
      callbacks.forEach(callback => callback(gesture));
    }
  }

  private triggerTouchCallback(type: string, event: TouchEvent) {
    const callbacks = this.touchCallbacks.get(type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  // Public API
  public on(event: string, callback: GestureCallback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  public off(event: string, callback: GestureCallback) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  public onTouch(event: string, callback: TouchCallback) {
    if (!this.touchCallbacks.has(event)) {
      this.touchCallbacks.set(event, []);
    }
    this.touchCallbacks.get(event)!.push(callback);
  }

  public destroy() {
    this.resetGestureState();
    this.callbacks.clear();
    this.touchCallbacks.clear();
    
    // Remove event listeners
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }
}

// Factory function for easy creation
export function createInteractionManager(
  element: HTMLElement,
  config?: Partial<InteractionConfig>
): InteractionManager {
  return new InteractionManager(element, config);
}
