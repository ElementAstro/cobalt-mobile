"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSimplePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useEnhancedInteractions } from '@/hooks/use-enhanced-interactions';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  canRefresh: boolean;
  pullDistance: number;
  getRefreshProgress: () => number;
  getRefreshRotation: () => number;
  className?: string;
  velocity?: number;
  gestureType?: 'none' | 'pull' | 'swipe';
}

export function PullToRefreshIndicator({
  isPulling,
  isRefreshing,
  canRefresh,
  pullDistance,
  getRefreshProgress,
  getRefreshRotation,
  className,
}: PullToRefreshIndicatorProps) {
  const progress = getRefreshProgress();
  const rotation = getRefreshRotation();

  return (
    <AnimatePresence>
      {(isPulling || isRefreshing) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={cn(
            "absolute top-0 left-1/2 transform -translate-x-1/2 z-50",
            "flex flex-col items-center justify-center",
            "bg-background/90 backdrop-blur-sm rounded-full",
            "w-16 h-16 shadow-lg border",
            className
          )}
          style={{
            transform: `translateX(-50%) translateY(${Math.max(pullDistance - 32, -50)}px)`,
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Progress Ring */}
            <svg
              className="absolute inset-0 w-12 h-12 transform -rotate-90"
              viewBox="0 0 48 48"
            >
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-muted-foreground/20"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className={cn(
                  "text-primary transition-colors duration-200",
                  canRefresh && "text-green-500"
                )}
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress)}`}
                strokeLinecap="round"
              />
            </svg>

            {/* Icon */}
            <div className="relative z-10">
              {isRefreshing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-6 w-6 text-primary" />
                </motion.div>
              ) : canRefresh ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Check className="h-6 w-6 text-green-500" />
                </motion.div>
              ) : (
                <motion.div
                  style={{ rotate: rotation }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <ChevronDown className="h-6 w-6 text-muted-foreground" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Status Text */}
          <motion.div
            className="absolute -bottom-8 text-xs text-center text-muted-foreground whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isRefreshing ? (
              "Refreshing..."
            ) : canRefresh ? (
              "Release to refresh"
            ) : (
              "Pull to refresh"
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface PullToRefreshContainerProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  className?: string;
  enabled?: boolean;
  threshold?: number;
  showIndicator?: boolean;
}

export function PullToRefreshContainer({
  children,
  onRefresh,
  className,
  enabled = true,
  threshold = 80,
  showIndicator = true,
}: PullToRefreshContainerProps) {
  const [enhancedState, setEnhancedState] = useState({
    velocity: 0,
    lastPullTime: 0,
    gestureType: 'none' as 'none' | 'pull' | 'swipe',
  });

  const pullToRefresh = useSimplePullToRefresh(onRefresh, {
    enabled,
    threshold,
  });

  // Enhanced gesture detection using the new interaction system
  const { ref: gestureRef } = useEnhancedInteractions({
    disabled: !enabled,
    onMove: (gesture) => {
      if (gesture.direction === 'down' && gesture.startY < 100) {
        const velocity = gesture.velocity;
        const now = Date.now();

        setEnhancedState({
          velocity,
          lastPullTime: now,
          gestureType: velocity > 0.5 ? 'swipe' : 'pull',
        });
      }
    },
    onEnd: () => {
      setEnhancedState(prev => ({
        ...prev,
        gestureType: 'none',
      }));
    },
  });

  const getTransformValue = () => {
    if (!pullToRefresh.isPulling) return 0;

    const baseTransform = Math.min(pullToRefresh.pullDistance * 0.5, 50);

    // Add velocity-based enhancement
    if (enhancedState.gestureType === 'swipe' && enhancedState.velocity > 0.5) {
      return Math.min(baseTransform * 1.2, 60);
    }

    return baseTransform;
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        // Enhanced touch handling
        "touch-pan-y overscroll-behavior-y-contain",
        className
      )}
      {...pullToRefresh.containerProps}
      ref={gestureRef as any}
    >
      {showIndicator && (
        <PullToRefreshIndicator
          isPulling={pullToRefresh.isPulling}
          isRefreshing={pullToRefresh.isRefreshing}
          canRefresh={pullToRefresh.canRefresh}
          pullDistance={pullToRefresh.pullDistance}
          getRefreshProgress={pullToRefresh.getRefreshProgress}
          getRefreshRotation={pullToRefresh.getRefreshRotation}
          // Enhanced visual feedback
          velocity={enhancedState.velocity}
          gestureType={enhancedState.gestureType}
        />
      )}

      <div
        className={cn(
          "transition-transform duration-300 ease-out",
          pullToRefresh.isPulling && "transform-gpu",
          // Enhanced animation based on gesture type
          enhancedState.gestureType === 'swipe' && "transition-duration-150"
        )}
        style={{
          transform: pullToRefresh.isPulling
            ? `translateY(${getTransformValue()}px)`
            : undefined,
          // Add subtle scale effect for fast swipes
          ...(enhancedState.gestureType === 'swipe' && enhancedState.velocity > 0.7 && {
            transformOrigin: 'top center',
            scale: '1.02',
          }),
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Higher-order component for easy integration
export function withPullToRefresh<P extends object>(
  Component: React.ComponentType<P>,
  onRefresh: () => Promise<void> | void,
  options?: Omit<PullToRefreshContainerProps, 'children' | 'onRefresh'>
) {
  return function PullToRefreshWrapped(props: P) {
    return (
      <PullToRefreshContainer onRefresh={onRefresh} {...options}>
        <Component {...props} />
      </PullToRefreshContainer>
    );
  };
}

// Hook for manual control
export function usePullToRefreshControl() {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const triggerRefresh = React.useCallback(async (refreshFn: () => Promise<void> | void) => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshFn();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return {
    isRefreshing,
    triggerRefresh,
  };
}
