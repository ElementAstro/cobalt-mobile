/**
 * Enhanced Gesture Navigation Component
 * Advanced gesture handling with conflict resolution and multi-touch support
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEnhancedInteractions } from '@/hooks/use-enhanced-interactions';
import { hapticFeedback, mobilePerformance } from '@/lib/mobile-utils';
import { GestureState as InteractionGestureState } from '@/lib/interaction-manager';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';

export interface GestureNavigationProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  onRotate?: (angle: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  children: React.ReactNode;
  className?: string;
  enabledGestures?: {
    swipe?: boolean;
    pinch?: boolean;
    rotate?: boolean;
    pan?: boolean;
  };
  gestureThresholds?: {
    swipeDistance?: number;
    swipeVelocity?: number;
    pinchSensitivity?: number;
    rotateSensitivity?: number;
  };
  showVisualFeedback?: boolean;
  conflictResolution?: 'priority' | 'simultaneous' | 'exclusive';
}

interface LocalGestureState {
  activeGestures: Set<string>;
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
  swipeProgress: number;
  pinchScale: number;
  rotationAngle: number;
  panDelta: { x: number; y: number };
  lastGestureTime: number;
}

export function EnhancedGestureNavigation({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinchIn,
  onPinchOut,
  onRotate,
  onPan,
  children,
  className,
  enabledGestures = {
    swipe: true,
    pinch: true,
    rotate: false,
    pan: true,
  },
  gestureThresholds = {
    swipeDistance: 50,
    swipeVelocity: 0.3,
    pinchSensitivity: 0.1,
    rotateSensitivity: 5,
  },
  showVisualFeedback = true,
  conflictResolution = 'priority',
}: GestureNavigationProps) {
  const [gestureState, setGestureState] = useState<LocalGestureState>({
    activeGestures: new Set(),
    swipeDirection: null,
    swipeProgress: 0,
    pinchScale: 1,
    rotationAngle: 0,
    panDelta: { x: 0, y: 0 },
    lastGestureTime: 0,
  });

  const gestureStartRef = useRef<{
    pinchDistance?: number;
    rotationStart?: number;
    panStart?: { x: number; y: number };
  }>({});

  const animationDuration = mobilePerformance.getAnimationDuration(200);

  // Gesture conflict resolution
  const resolveGestureConflict = useCallback((newGesture: string, currentGestures: Set<string>) => {
    if (conflictResolution === 'simultaneous') {
      return true; // Allow all gestures
    }

    if (conflictResolution === 'exclusive') {
      return currentGestures.size === 0; // Only allow if no other gestures active
    }

    // Priority-based resolution
    const gesturePriority = {
      pinch: 3,
      rotate: 2,
      swipe: 1,
      pan: 0,
    };

    const currentMaxPriority = Math.max(
      ...Array.from(currentGestures).map(g => gesturePriority[g as keyof typeof gesturePriority] || 0)
    );
    const newGesturePriority = gesturePriority[newGesture as keyof typeof gesturePriority] || 0;

    return newGesturePriority >= currentMaxPriority;
  }, [conflictResolution]);

  // Enhanced gesture handling
  const { ref: gestureRef } = useEnhancedInteractions({
    onMove: useCallback((gesture: InteractionGestureState) => {
      const now = Date.now();
      
      // Handle swipe gestures
      if (enabledGestures.swipe && gesture.direction) {
        const canSwipe = resolveGestureConflict('swipe', gestureState.activeGestures);
        if (canSwipe) {
          const distance = Math.sqrt(gesture.deltaX ** 2 + gesture.deltaY ** 2);
          const progress = Math.min(distance / (gestureThresholds.swipeDistance || 50), 1);
          
          setGestureState(prev => ({
            ...prev,
            activeGestures: new Set([...prev.activeGestures, 'swipe']),
            swipeDirection: gesture.direction,
            swipeProgress: progress,
            lastGestureTime: now,
          }));
        }
      }

      // Handle pan gestures
      if (enabledGestures.pan && gesture.type === 'pan') {
        const canPan = resolveGestureConflict('pan', gestureState.activeGestures);
        if (canPan) {
          setGestureState(prev => ({
            ...prev,
            activeGestures: new Set([...prev.activeGestures, 'pan']),
            panDelta: { x: gesture.deltaX, y: gesture.deltaY },
            lastGestureTime: now,
          }));
          
          onPan?.(gesture.deltaX, gesture.deltaY);
        }
      }
    }, [enabledGestures, gestureThresholds, resolveGestureConflict, gestureState.activeGestures, onPan]),

    onSwipe: useCallback((gesture: InteractionGestureState) => {
      if (!enabledGestures.swipe) return;

      const velocity = gesture.velocity;
      const distance = Math.sqrt(gesture.deltaX ** 2 + gesture.deltaY ** 2);

      if (velocity >= (gestureThresholds.swipeVelocity || 0.3) && 
          distance >= (gestureThresholds.swipeDistance || 50)) {
        
        hapticFeedback.light();
        
        switch (gesture.direction) {
          case 'left':
            onSwipeLeft?.();
            break;
          case 'right':
            onSwipeRight?.();
            break;
          case 'up':
            onSwipeUp?.();
            break;
          case 'down':
            onSwipeDown?.();
            break;
        }
      }
    }, [enabledGestures.swipe, gestureThresholds, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]),

    onPinch: useCallback((gesture: InteractionGestureState) => {
      if (!enabledGestures.pinch) return;

      const canPinch = resolveGestureConflict('pinch', gestureState.activeGestures);
      if (!canPinch) return;

      // Calculate pinch scale
      const currentDistance = (gesture as any).distance;
      if (!gestureStartRef.current.pinchDistance) {
        gestureStartRef.current.pinchDistance = currentDistance;
      }

      const scale = currentDistance / (gestureStartRef.current.pinchDistance || 1);
      const scaleDelta = scale - gestureState.pinchScale;

      if (Math.abs(scaleDelta) > (gestureThresholds.pinchSensitivity || 0.1)) {
        setGestureState(prev => ({
          ...prev,
          activeGestures: new Set([...prev.activeGestures, 'pinch']),
          pinchScale: scale,
          lastGestureTime: Date.now(),
        }));

        if (scale > 1) {
          onPinchOut?.(scale);
        } else {
          onPinchIn?.(scale);
        }

        hapticFeedback.light();
      }
    }, [enabledGestures.pinch, gestureThresholds, resolveGestureConflict, gestureState, onPinchIn, onPinchOut]),

    onEnd: useCallback(() => {
      // Reset gesture state
      setGestureState(prev => ({
        ...prev,
        activeGestures: new Set(),
        swipeDirection: null,
        swipeProgress: 0,
        panDelta: { x: 0, y: 0 },
      }));

      // Reset gesture start references
      gestureStartRef.current = {};
    }, []),
  });

  // Auto-reset gesture state after timeout
  useEffect(() => {
    if (gestureState.activeGestures.size > 0) {
      const timeout = setTimeout(() => {
        setGestureState(prev => ({
          ...prev,
          activeGestures: new Set(),
          swipeDirection: null,
          swipeProgress: 0,
          panDelta: { x: 0, y: 0 },
        }));
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [gestureState.lastGestureTime]);

  const getSwipeIcon = () => {
    switch (gestureState.swipeDirection) {
      case 'left': return ChevronLeft;
      case 'right': return ChevronRight;
      case 'up': return ChevronUp;
      case 'down': return ChevronDown;
      default: return ChevronRight;
    }
  };

  const getGestureIcon = () => {
    if (gestureState.activeGestures.has('pinch')) {
      return gestureState.pinchScale > 1 ? ZoomIn : ZoomOut;
    }
    if (gestureState.activeGestures.has('rotate')) {
      return RotateCcw;
    }
    if (gestureState.activeGestures.has('pan')) {
      return Move;
    }
    return null;
  };

  return (
    <div
      ref={gestureRef as React.RefObject<HTMLDivElement>}
      className={cn(
        "relative touch-none select-none",
        "overscroll-behavior-contain",
        className
      )}
    >
      {children}

      {/* Visual Feedback Overlays */}
      {showVisualFeedback && (
        <>
          {/* Swipe Indicator */}
          <AnimatePresence>
            {gestureState.activeGestures.has('swipe') && gestureState.swipeDirection && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: gestureState.swipeProgress, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: animationDuration / 1000 }}
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
              >
                <div className="bg-primary/90 text-primary-foreground p-4 rounded-full shadow-lg backdrop-blur-sm">
                  {React.createElement(getSwipeIcon(), { className: "h-8 w-8" })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multi-touch Gesture Indicator */}
          <AnimatePresence>
            {(gestureState.activeGestures.has('pinch') || 
              gestureState.activeGestures.has('rotate') || 
              gestureState.activeGestures.has('pan')) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
              >
                <div className="bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg border shadow-lg flex items-center gap-2">
                  {React.createElement(getGestureIcon() || Move, { className: "h-4 w-4" })}
                  <span className="text-sm font-medium">
                    {gestureState.activeGestures.has('pinch') && `Scale: ${gestureState.pinchScale.toFixed(2)}`}
                    {gestureState.activeGestures.has('pan') && 'Panning'}
                    {gestureState.activeGestures.has('rotate') && 'Rotating'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gesture Conflict Indicator */}
          <AnimatePresence>
            {gestureState.activeGestures.size > 1 && conflictResolution === 'priority' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
              >
                <div className="bg-yellow-500/90 text-yellow-900 px-3 py-1 rounded-full text-xs font-medium">
                  Multiple gestures detected
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
