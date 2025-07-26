/**
 * Main filter wheel hook that provides filter wheel state and actions
 */

import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { UseFilterWheelReturn } from '../types/filterwheel.types';
import {
  getFilterByPosition,
  getInstalledFilters,
  validatePosition,
  canPerformMovement,
  // createMovementProgress, // Unused for now
  // updateMovementProgress, // Unused for now
  calculateMovementTime,
} from '../utils/filterwheel.utils';
import { DEFAULT_FILTERS } from '../utils/filterwheel.constants';

export function useFilterWheel(): UseFilterWheelReturn {
  const {
    filterWheelStatus,
    moveProgress,
    setFilterWheelStatus,
    setMoveProgress,
    equipmentStatus,
  } = useAppStore();

  // Enhanced status with connection info
  const status = useMemo(() => ({
    ...filterWheelStatus,
    connected: equipmentStatus.filterWheel === 'connected',
  }), [filterWheelStatus, equipmentStatus.filterWheel]);

  // Use default filters for now (could be made configurable later)
  const filters = useMemo(() => DEFAULT_FILTERS, []);

  // Movement progress with enhanced data
  const movementProgress = useMemo(() => ({
    progress: moveProgress,
    estimatedTimeRemaining: undefined,
    startTime: undefined,
    endTime: undefined,
  }), [moveProgress]);

  // Get current and target filters
  const currentFilter = useMemo(() => 
    getFilterByPosition(filters, status.currentPosition),
    [filters, status.currentPosition]
  );

  const targetFilter = useMemo(() => 
    getFilterByPosition(filters, status.targetPosition),
    [filters, status.targetPosition]
  );

  // Move to position action
  const moveToPosition = useCallback(async (position: number): Promise<void> => {
    // Validate position
    const validation = validatePosition(position);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Check if movement is possible
    if (!canPerformMovement(status)) {
      throw new Error('Cannot move: filter wheel is not connected or already moving');
    }

    // Check if already at position
    if (position === status.currentPosition) {
      return;
    }

    // Start movement
    setFilterWheelStatus({ moving: true, targetPosition: position });
    setMoveProgress(0);

    // Calculate movement time
    const totalTime = calculateMovementTime(status.currentPosition, position);

    // Simulate filter wheel movement with progress updates
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(100, (elapsed / totalTime) * 100);
        
        setMoveProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          setFilterWheelStatus({
            moving: false,
            currentPosition: position,
          });
          setMoveProgress(100);
          resolve();
        }
      }, 100); // Update every 100ms

      // Timeout safety
      setTimeout(() => {
        clearInterval(interval);
        setFilterWheelStatus({ moving: false });
        reject(new Error('Movement timeout'));
      }, (totalTime + 5) * 1000); // Add 5 second buffer
    });
  }, [status, setFilterWheelStatus, setMoveProgress]);

  // Home filter wheel action
  const homeFilterWheel = useCallback(async (): Promise<void> => {
    return moveToPosition(1); // Home position is typically position 1
  }, [moveToPosition]);

  // Stop movement action
  const stopMovement = useCallback(async (): Promise<void> => {
    if (status.moving) {
      setFilterWheelStatus({ moving: false });
      setMoveProgress(0);
    }
  }, [status.moving, setFilterWheelStatus, setMoveProgress]);

  // Refresh status action
  const refreshStatus = useCallback(async (): Promise<void> => {
    // In a real implementation, this would fetch status from the device
    // For now, we'll just trigger a state update
    setFilterWheelStatus({ ...status });
  }, [status, setFilterWheelStatus]);

  // Utility functions
  const canMoveToPosition = useCallback((position: number): boolean => {
    const validation = validatePosition(position);
    return validation.isValid && canPerformMovement(status) && position !== status.currentPosition;
  }, [status]);

  const getFilterByPositionUtil = useCallback((position: number) => {
    return getFilterByPosition(filters, position);
  }, [filters]);

  const getInstalledFiltersUtil = useCallback(() => {
    return getInstalledFilters(filters);
  }, [filters]);

  const isPositionValid = useCallback((position: number): boolean => {
    return validatePosition(position).isValid;
  }, []);

  return {
    // State
    status,
    filters,
    moveProgress: movementProgress,
    currentFilter,
    targetFilter,
    isLoading: false, // Could be enhanced with actual loading state
    error: null, // Could be enhanced with error handling

    // Actions
    moveToPosition,
    homeFilterWheel,
    stopMovement,
    refreshStatus,

    // Utilities
    canMoveToPosition,
    getFilterByPosition: getFilterByPositionUtil,
    getInstalledFilters: getInstalledFiltersUtil,
    isPositionValid,
  };
}
