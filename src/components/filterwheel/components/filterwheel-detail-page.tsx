"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SwipeNavigation from "../../swipe-navigation";
import { FilterWheelDetailPageProps } from "../types/filterwheel.types";
import { CurrentPage } from "@/lib/store";
import { useFilterWheel } from "../hooks/use-filterwheel";
import FilterWheelStatus from "./filterwheel-status";
import FilterSelection from "./filter-selection";
import QuickActions from "./quick-actions";
import FilterList from "./filter-list";

export default function FilterWheelDetailPage({
  onBack,
  onSwipeNavigate,
  currentPage,
  className = "",
}: FilterWheelDetailPageProps) {
  const {
    status,
    filters,
    moveProgress,
    currentFilter,
    targetFilter,
    moveToPosition,
    homeFilterWheel,
    canMoveToPosition,
  } = useFilterWheel();

  // Handle filter selection
  const handleFilterSelect = useCallback(async (position: number) => {
    try {
      if (!canMoveToPosition(position)) {
        return;
      }
      await moveToPosition(position);
    } catch (error) {
      console.error('Filter wheel movement error:', error);
    }
  }, [canMoveToPosition, moveToPosition]);

  // Handle home action
  const handleHome = useCallback(async () => {
    try {
      await homeFilterWheel();
    } catch (error) {
      console.error('Filter wheel home error:', error);
    }
  }, [homeFilterWheel]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Filter Wheel</h2>
          <p className="text-sm text-muted-foreground">
            {status.model || 'ZWO EFW 8x1.25"'} • Swipe to navigate
          </p>
        </div>
      </div>

      {/* Swipe Navigation */}
      {onSwipeNavigate && currentPage && (
        <SwipeNavigation
          currentPage={currentPage as CurrentPage}
          onNavigate={onSwipeNavigate}
        />
      )}

      {/* Filter Wheel Status */}
      <FilterWheelStatus
        status={status}
        currentFilter={currentFilter}
        targetFilter={targetFilter}
        moveProgress={moveProgress}
        showTemperature={true}
        showConnection={true}
      />

      {/* Filter Selection */}
      <FilterSelection
        filters={filters}
        currentPosition={status.currentPosition}
        targetPosition={status.targetPosition}
        isMoving={status.moving}
        onFilterSelect={handleFilterSelect}
        compactMode={false}
      />

      {/* Quick Actions */}
      <QuickActions
        onHome={handleHome}
        onFilterSelect={handleFilterSelect}
        currentPosition={status.currentPosition}
        isMoving={status.moving}
      />

      {/* Filter Information */}
      <FilterList
        filters={filters}
        currentPosition={status.currentPosition}
        onFilterSelect={handleFilterSelect}
        showActions={true}
      />
    </div>
  );
}
