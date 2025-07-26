/**
 * Enhanced Interactions Hook
 * React hook for managing mobile interactions and gestures
 */

import { useEffect, useRef, useCallback } from 'react';
import { InteractionManager, GestureState, InteractionConfig, GestureCallback } from '@/lib/interaction-manager';
import { mobilePerformance } from '@/lib/mobile-utils';

export interface UseEnhancedInteractionsOptions extends Partial<InteractionConfig> {
  onSwipe?: (gesture: GestureState) => void;
  onTap?: (gesture: GestureState) => void;
  onDoubleTap?: (gesture: GestureState) => void;
  onLongPress?: (gesture: GestureState) => void;
  onPinch?: (gesture: GestureState) => void;
  onPan?: (gesture: GestureState) => void;
  onMove?: (gesture: GestureState) => void;
  onEnd?: (gesture: GestureState) => void;
  disabled?: boolean;
  adaptToPerformance?: boolean;
}

export function useEnhancedInteractions(options: UseEnhancedInteractionsOptions = {}) {
  const {
    onSwipe,
    onTap,
    onDoubleTap,
    onLongPress,
    onPinch,
    onPan,
    onMove,
    onEnd,
    disabled = false,
    adaptToPerformance = true,
    ...config
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const managerRef = useRef<InteractionManager | null>(null);
  const callbacksRef = useRef<Map<string, GestureCallback>>(new Map());

  // Adapt configuration based on device performance
  const getAdaptedConfig = useCallback(() => {
    if (!adaptToPerformance) return config;

    const baseConfig = { ...config };

    if (mobilePerformance.isLowEndDevice()) {
      baseConfig.debounceDelay = (baseConfig.debounceDelay || 100) * 1.5;
      baseConfig.enableRippleEffect = false;
    }

    if (mobilePerformance.reduceMotion()) {
      baseConfig.enableRippleEffect = false;
    }

    return baseConfig;
  }, [config, adaptToPerformance]);

  // Create manager setup function
  const setupManager = useCallback((element: HTMLElement | null) => {
    // Clean up existing manager
    if (managerRef.current) {
      managerRef.current.destroy();
      managerRef.current = null;
      callbacksRef.current.clear();
    }

    if (!element || disabled) {
      return;
    }

    try {
      const manager = new InteractionManager(element, getAdaptedConfig());
      managerRef.current = manager;

      // Register callbacks
      const callbacks = new Map<string, GestureCallback>();

      if (onSwipe) {
        const callback = (gesture: GestureState) => onSwipe(gesture);
        callbacks.set('swipe', callback);
        manager.on('swipe', callback);
      }

      if (onTap) {
        const callback = (gesture: GestureState) => onTap(gesture);
        callbacks.set('tap', callback);
        manager.on('tap', callback);
      }

      if (onDoubleTap) {
        const callback = (gesture: GestureState) => onDoubleTap(gesture);
        callbacks.set('doubletap', callback);
        manager.on('doubletap', callback);
      }

      if (onLongPress) {
        const callback = (gesture: GestureState) => onLongPress(gesture);
        callbacks.set('longpress', callback);
        manager.on('longpress', callback);
      }

      if (onPinch) {
        const callback = (gesture: GestureState) => onPinch(gesture);
        callbacks.set('pinch', callback);
        manager.on('pinch', callback);
      }

      if (onPan) {
        const callback = (gesture: GestureState) => onPan(gesture);
        callbacks.set('pan', callback);
        manager.on('pan', callback);
      }

      if (onMove) {
        const callback = (gesture: GestureState) => onMove(gesture);
        callbacks.set('move', callback);
        manager.on('move', callback);
      }

      if (onEnd) {
        const callback = (gesture: GestureState) => onEnd(gesture);
        callbacks.set('end', callback);
        manager.on('end', callback);
      }

      callbacksRef.current = callbacks;
    } catch (error) {
      console.warn('Failed to create InteractionManager:', error);
      // Gracefully handle the error by not setting up the manager
      managerRef.current = null;
      callbacksRef.current.clear();
    }
  }, [
    disabled,
    onSwipe,
    onTap,
    onDoubleTap,
    onLongPress,
    onPinch,
    onPan,
    onMove,
    onEnd,
    getAdaptedConfig,
  ]);

  // Callback ref that sets up manager when element is attached
  const callbackRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
    setupManager(element);
  }, [setupManager]);



  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
        callbacksRef.current.clear();
      }
    };
  }, []);

  // Re-setup manager when callbacks change
  useEffect(() => {
    if (elementRef.current) {
      setupManager(elementRef.current);
    }
  }, [setupManager]);

  return {
    ref: callbackRef,
    manager: managerRef.current,
  };
}

// Specialized hooks for common use cases
export function useSwipeGesture(
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down', gesture: GestureState) => void,
  options: Omit<UseEnhancedInteractionsOptions, 'onSwipe'> = {}
) {
  return useEnhancedInteractions({
    ...options,
    onSwipe: (gesture) => {
      if (gesture.direction) {
        onSwipe(gesture.direction, gesture);
      }
    },
  });
}

export function useTapGesture(
  onTap: (gesture: GestureState) => void,
  options: Omit<UseEnhancedInteractionsOptions, 'onTap'> = {}
) {
  return useEnhancedInteractions({
    ...options,
    onTap,
  });
}

export function useLongPressGesture(
  onLongPress: (gesture: GestureState) => void,
  options: Omit<UseEnhancedInteractionsOptions, 'onLongPress'> = {}
) {
  return useEnhancedInteractions({
    ...options,
    onLongPress,
  });
}

export function usePinchGesture(
  onPinch: (gesture: GestureState) => void,
  options: Omit<UseEnhancedInteractionsOptions, 'onPinch'> = {}
) {
  return useEnhancedInteractions({
    ...options,
    onPinch,
  });
}

export function usePanGesture(
  onPan: (gesture: GestureState) => void,
  options: Omit<UseEnhancedInteractionsOptions, 'onPan'> = {}
) {
  return useEnhancedInteractions({
    ...options,
    onPan,
  });
}

// Hook for drag and drop functionality
export function useDragGesture(
  onDragStart?: (gesture: GestureState) => void,
  onDragMove?: (gesture: GestureState) => void,
  onDragEnd?: (gesture: GestureState) => void,
  options: UseEnhancedInteractionsOptions = {}
) {
  let isDragging = false;

  return useEnhancedInteractions({
    ...options,
    onMove: (gesture) => {
      if (!isDragging && gesture.type === 'pan') {
        isDragging = true;
        onDragStart?.(gesture);
      }
      if (isDragging) {
        onDragMove?.(gesture);
      }
    },
    onEnd: (gesture) => {
      if (isDragging) {
        isDragging = false;
        onDragEnd?.(gesture);
      }
    },
  });
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(
  onRefresh: () => void | Promise<void>,
  options: {
    threshold?: number;
    resistance?: number;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 80, resistance = 2.5, enabled = true } = options;
  let pullDistance = 0;
  let isPulling = false;

  return useEnhancedInteractions({
    disabled: !enabled,
    onMove: (gesture) => {
      if (gesture.direction === 'down' && gesture.startY < 50) {
        isPulling = true;
        pullDistance = Math.max(0, gesture.deltaY / resistance);
      }
    },
    onEnd: async (gesture) => {
      if (isPulling && pullDistance > threshold) {
        await onRefresh();
      }
      isPulling = false;
      pullDistance = 0;
    },
  });
}
