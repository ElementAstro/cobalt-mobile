"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { hapticFeedback } from '@/lib/mobile-utils';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number; // Distance to trigger refresh
  resistance?: number; // Resistance factor for pull distance
  enabled?: boolean;
  refreshingTimeout?: number; // Maximum time to show refreshing state
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
  refreshingTimeout = 10000,
}: PullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false,
  });

  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const containerRef = useRef<HTMLElement | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAtTop = useCallback(() => {
    if (!containerRef.current) return false;
    return containerRef.current.scrollTop <= 0;
  }, []);

  const calculatePullDistance = useCallback((deltaY: number) => {
    // Apply resistance to make pulling feel more natural
    return Math.max(0, deltaY / resistance);
  }, [resistance]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || !isAtTop()) return;
    
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  }, [enabled, isAtTop]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing || !isAtTop()) return;

    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;

    if (deltaY > 0) {
      // Prevent default scrolling when pulling down
      e.preventDefault();
      
      const pullDistance = calculatePullDistance(deltaY);
      const canRefresh = pullDistance >= threshold;

      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance,
        canRefresh,
      }));

      // Provide haptic feedback when threshold is reached
      if (canRefresh && !state.canRefresh) {
        hapticFeedback.medium();
      }
    }
  }, [enabled, state.isRefreshing, state.canRefresh, isAtTop, calculatePullDistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || state.isRefreshing) return;

    if (state.canRefresh && state.isPulling) {
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
      }));

      hapticFeedback.success();

      try {
        // Set a timeout to prevent infinite refreshing
        refreshTimeoutRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            isRefreshing: false,
            pullDistance: 0,
            canRefresh: false,
          }));
        }, refreshingTimeout);

        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh error:', error);
        hapticFeedback.error();
      } finally {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false,
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        canRefresh: false,
      }));
    }
  }, [enabled, state.canRefresh, state.isPulling, state.isRefreshing, onRefresh, refreshingTimeout]);

  const bindToElement = useCallback((element: HTMLElement | null) => {
    if (containerRef.current) {
      containerRef.current.removeEventListener('touchstart', handleTouchStart);
      containerRef.current.removeEventListener('touchmove', handleTouchMove);
      containerRef.current.removeEventListener('touchend', handleTouchEnd);
    }

    containerRef.current = element;

    if (element && enabled) {
      element.addEventListener('touchstart', handleTouchStart, { passive: false });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (containerRef.current) {
        containerRef.current.removeEventListener('touchstart', handleTouchStart);
        containerRef.current.removeEventListener('touchmove', handleTouchMove);
        containerRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const getRefreshProgress = useCallback(() => {
    return Math.min(state.pullDistance / threshold, 1);
  }, [state.pullDistance, threshold]);

  const getRefreshRotation = useCallback(() => {
    return state.isRefreshing ? 360 : getRefreshProgress() * 180;
  }, [state.isRefreshing, getRefreshProgress]);

  return {
    ...state,
    bindToElement,
    getRefreshProgress,
    getRefreshRotation,
    threshold,
  };
}

// Hook for simpler usage with automatic binding
export function useSimplePullToRefresh(
  onRefresh: () => Promise<void> | void,
  options?: Omit<PullToRefreshOptions, 'onRefresh'>
) {
  const pullToRefresh = usePullToRefresh({ onRefresh, ...options });
  
  const containerProps = {
    ref: pullToRefresh.bindToElement,
    style: {
      transform: pullToRefresh.isPulling 
        ? `translateY(${Math.min(pullToRefresh.pullDistance, 100)}px)` 
        : undefined,
      transition: pullToRefresh.isPulling ? 'none' : 'transform 0.3s ease-out',
    },
  };

  return {
    ...pullToRefresh,
    containerProps,
  };
}
