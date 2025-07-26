/**
 * Filter wheel movement hook
 * Specialized hook for handling filter wheel movement operations
 */

import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { UseFilterWheelMovementReturn } from '../types/filterwheel.types';
import {
  calculateMovementTime,
  getMovementDirection,
  canPerformMovement,
  // createMovementProgress, // Unused for now
  // updateMovementProgress, // Unused for now
} from '../utils/filterwheel.utils';

export function useFilterWheelMovement(): UseFilterWheelMovementReturn {
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

  // Movement state
  const isMoving = status.moving;
  const canMove = canPerformMovement(status);

  // Enhanced progress object
  const progress = useMemo(() => ({
    progress: moveProgress,
    estimatedTimeRemaining: undefined,
    startTime: undefined,
    endTime: undefined,
  }), [moveProgress]);

  // Move to position with enhanced error handling
  const moveToPosition = useCallback(async (position: number): Promise<void> => {
    if (!canMove) {
      throw new Error('Cannot move: filter wheel is not connected or already moving');
    }

    if (position === status.currentPosition) {
      return; // Already at target position
    }

    if (position < 1 || position > 8) {
      throw new Error('Invalid position: must be between 1 and 8');
    }

    // Start movement
    setFilterWheelStatus({ moving: true, targetPosition: position });
    setMoveProgress(0);

    const totalTime = calculateMovementTime(status.currentPosition, position);
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progressPercent = Math.min(100, (elapsed / totalTime) * 100);
        
        setMoveProgress(progressPercent);
        
        if (progressPercent >= 100) {
          clearInterval(interval);
          setFilterWheelStatus({
            moving: false,
            currentPosition: position,
          });
          resolve();
        }
      }, 100);

      // Safety timeout
      setTimeout(() => {
        clearInterval(interval);
        setFilterWheelStatus({ moving: false });
        reject(new Error('Movement timeout'));
      }, (totalTime + 5) * 1000);
    });
  }, [canMove, status, setFilterWheelStatus, setMoveProgress]);

  // Stop movement
  const stopMovement = useCallback(async (): Promise<void> => {
    if (isMoving) {
      setFilterWheelStatus({ moving: false });
      setMoveProgress(0);
    }
  }, [isMoving, setFilterWheelStatus, setMoveProgress]);

  // Home filter wheel
  const homeFilterWheel = useCallback(async (): Promise<void> => {
    return moveToPosition(1);
  }, [moveToPosition]);

  // Estimate movement time between positions
  const estimateMovementTime = useCallback((fromPosition: number, toPosition: number): number => {
    return calculateMovementTime(fromPosition, toPosition);
  }, []);

  // Get movement direction
  const getMovementDirectionUtil = useCallback((fromPosition: number, toPosition: number) => {
    return getMovementDirection(fromPosition, toPosition);
  }, []);

  return {
    // Movement state
    isMoving,
    progress,
    canMove,

    // Movement actions
    moveToPosition,
    stopMovement,
    homeFilterWheel,

    // Movement utilities
    estimateMovementTime,
    getMovementDirection: getMovementDirectionUtil,
  };
}
