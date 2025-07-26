"use client";

import { useCallback } from "react";
import { FilterWheelControlProps } from "../types/filterwheel.types";
import { useFilterWheel } from "../hooks/use-filterwheel";
import FilterWheelStatus from "./filterwheel-status";
import FilterSelection from "./filter-selection";
import QuickActions from "./quick-actions";
import FilterList from "./filter-list";

export default function FilterWheelControl({
  className = "",
  showTemperature = true,
  showProgress = true,
  compactMode = false,
  onPositionChange,
  onError,
}: FilterWheelControlProps) {
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

  // Handle filter selection with error handling
  const handleFilterSelect = useCallback(async (position: number) => {
    try {
      if (!canMoveToPosition(position)) {
        return;
      }

      await moveToPosition(position);
      onPositionChange?.(position);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(errorMessage);
      console.error('Filter wheel movement error:', error);
    }
  }, [canMoveToPosition, moveToPosition, onPositionChange, onError]);

  // Handle home action
  const handleHome = useCallback(async () => {
    try {
      await homeFilterWheel();
      onPositionChange?.(1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(errorMessage);
      console.error('Filter wheel home error:', error);
    }
  }, [homeFilterWheel, onPositionChange, onError]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Wheel Status */}
      <FilterWheelStatus
        status={status}
        currentFilter={currentFilter}
        targetFilter={targetFilter}
        moveProgress={showProgress ? moveProgress : undefined}
        showTemperature={showTemperature}
        showConnection={true}
      />

      {/* Filter Selection */}
      <FilterSelection
        filters={filters}
        currentPosition={status.currentPosition}
        targetPosition={status.targetPosition}
        isMoving={status.moving}
        onFilterSelect={handleFilterSelect}
        compactMode={compactMode}
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
