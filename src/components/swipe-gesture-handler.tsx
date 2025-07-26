"use client";

import type React from "react";
import { useState, useCallback } from "react";

import { useSwipe } from "@/hooks/use-swipe";
import { useEnhancedInteractions } from "@/hooks/use-enhanced-interactions";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { mobilePerformance } from "@/lib/mobile-utils";

interface SwipeGestureHandlerProps {
  children: React.ReactNode;
  className?: string;
  enableEnhancedGestures?: boolean;
  showVisualFeedback?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export default function SwipeGestureHandler({
  children,
  className,
  enableEnhancedGestures = true,
  showVisualFeedback = true,
  onSwipeStart,
  onSwipeEnd,
}: SwipeGestureHandlerProps) {
  const { swipeState, isSwipeEnabled } = useSwipe();
  const [enhancedSwipeState, setEnhancedSwipeState] = useState({
    isActive: false,
    direction: null as 'left' | 'right' | null,
    progress: 0,
    velocity: 0,
  });

  // Enhanced gesture handling
  const { ref: gestureRef } = useEnhancedInteractions({
    disabled: !enableEnhancedGestures || !isSwipeEnabled,
    adaptToPerformance: true,
    enableHapticFeedback: true,
    enableRippleEffect: false,
    onMove: useCallback((gesture: any) => {
      if (gesture.direction === 'left' || gesture.direction === 'right') {
        const progress = Math.min(Math.abs(gesture.deltaX) / 200, 1);
        setEnhancedSwipeState({
          isActive: true,
          direction: gesture.direction,
          progress,
          velocity: gesture.velocity,
        });
        onSwipeStart?.();
      }
    }, [onSwipeStart]),
    onSwipe: useCallback((gesture: any) => {
      if (gesture.direction === 'left' || gesture.direction === 'right') {
        // Handle swipe completion
        onSwipeEnd?.();
      }
    }, [onSwipeEnd]),
    onEnd: useCallback(() => {
      setEnhancedSwipeState({
        isActive: false,
        direction: null,
        progress: 0,
        velocity: 0,
      });
      onSwipeEnd?.();
    }, [onSwipeEnd]),
  });

  const getSwipeProgress = () => {
    if (enableEnhancedGestures) {
      return enhancedSwipeState.progress;
    }

    if (!swipeState.isActive || !swipeState.direction) return 0;
    const deltaX = Math.abs(swipeState.currentX - swipeState.startX);
    const maxDistance = 200;
    return Math.min(deltaX / maxDistance, 1);
  };

  const getSwipeDirection = () => {
    if (enableEnhancedGestures) {
      return enhancedSwipeState.direction;
    }
    return swipeState.direction;
  };

  const getIsSwipeActive = () => {
    if (enableEnhancedGestures) {
      return enhancedSwipeState.isActive;
    }
    return swipeState.isActive;
  };

  const swipeProgress = getSwipeProgress();
  const swipeDirection = getSwipeDirection();
  const isSwipeActive = getIsSwipeActive();
  const animationDuration = mobilePerformance.getAnimationDuration(200);

  return (
    <div
      ref={enableEnhancedGestures ? gestureRef as any : undefined}
      className={cn("relative", className)}
    >
      {children}

      {/* Enhanced Swipe Indicators */}
      <AnimatePresence>
        {showVisualFeedback && isSwipeEnabled && isSwipeActive && swipeDirection && (
          <>
            {/* Left Swipe Indicator */}
            {swipeDirection === "left" && (
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.8 }}
                animate={{
                  opacity: swipeProgress,
                  x: 50 - swipeProgress * 50,
                  scale: 0.8 + swipeProgress * 0.2,
                }}
                exit={{ opacity: 0, x: 50, scale: 0.8 }}
                transition={{ duration: animationDuration / 1000 }}
                className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50"
              >
                <div className={cn(
                  "bg-primary text-primary-foreground p-4 rounded-full shadow-lg",
                  "border-2 border-primary-foreground/20",
                  swipeProgress > 0.7 && "animate-pulse"
                )}>
                  <ChevronRight className="h-6 w-6" />
                </div>
                {/* Progress Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary-foreground/30">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="calc(50% - 4px)"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${swipeProgress * 100} 100`}
                      className="text-primary-foreground"
                    />
                  </svg>
                </div>
              </motion.div>
            )}

            {/* Right Swipe Indicator */}
            {swipeDirection === "right" && (
              <motion.div
                initial={{ opacity: 0, x: -50, scale: 0.8 }}
                animate={{
                  opacity: swipeProgress,
                  x: -50 + swipeProgress * 50,
                  scale: 0.8 + swipeProgress * 0.2,
                }}
                exit={{ opacity: 0, x: -50, scale: 0.8 }}
                transition={{ duration: animationDuration / 1000 }}
                className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50"
              >
                <div className={cn(
                  "bg-primary text-primary-foreground p-4 rounded-full shadow-lg",
                  "border-2 border-primary-foreground/20",
                  swipeProgress > 0.7 && "animate-pulse"
                )}>
                  <ChevronLeft className="h-6 w-6" />
                </div>
                {/* Progress Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary-foreground/30">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="calc(50% - 4px)"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${swipeProgress * 100} 100`}
                      className="text-primary-foreground"
                    />
                  </svg>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Enhanced Swipe Overlay Effect */}
      <AnimatePresence>
        {showVisualFeedback && isSwipeEnabled && isSwipeActive && swipeDirection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: swipeProgress * 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: animationDuration / 1000 }}
            className={cn(
              "fixed inset-0 z-40 pointer-events-none",
              swipeDirection === "left"
                ? "bg-gradient-to-l from-primary/20 via-primary/10 to-transparent"
                : "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent"
            )}
          />
        )}
      </AnimatePresence>

      {/* Velocity Indicator */}
      <AnimatePresence>
        {enableEnhancedGestures && showVisualFeedback && enhancedSwipeState.velocity > 0.5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border text-xs font-medium">
              Fast Swipe
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
