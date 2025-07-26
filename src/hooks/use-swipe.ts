"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";

export function useSwipe() {
  const {
    swipeState,
    setSwipeState,
    resetSwipeState,
    handleSwipeNavigation,
    currentPage,
  } = useAppStore();

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      setSwipeState({
        isActive: true,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        direction: null,
      });
    },
    [setSwipeState]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!swipeState.isActive) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeState.startX;
      const deltaY = Math.abs(touch.clientY - swipeState.startY);

      setSwipeState({
        currentX: touch.clientX,
        currentY: touch.clientY,
      });

      // Determine swipe direction
      if (Math.abs(deltaX) > swipeState.threshold && deltaY < 100) {
        const direction = deltaX > 0 ? "right" : "left";
        setSwipeState({ direction });

        // Prevent default scrolling for horizontal swipes
        e.preventDefault();
      }
    },
    [swipeState, setSwipeState]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!swipeState.isActive) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeState.startX;
      const deltaY = Math.abs(touch.clientY - swipeState.startY);

      // Only process horizontal swipes with sufficient distance
      if (Math.abs(deltaX) > swipeState.threshold && deltaY < 100) {
        const direction = deltaX > 0 ? "right" : "left";
        handleSwipeNavigation(direction);
      }

      resetSwipeState();
    },
    [swipeState, handleSwipeNavigation, resetSwipeState]
  );

  const isSwipeEnabled = useCallback(() => {
    const devicePages = [
      "camera-detail",
      "mount-detail",
      "filter-detail",
      "focuser-detail",
    ];
    return devicePages.includes(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (!isSwipeEnabled()) return;

    const options = { passive: false };

    document.addEventListener("touchstart", handleTouchStart, options);
    document.addEventListener("touchmove", handleTouchMove, options);
    document.addEventListener("touchend", handleTouchEnd, options);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isSwipeEnabled]);

  return {
    swipeState,
    isSwipeEnabled: isSwipeEnabled(),
  };
}
