/**
 * Manual focuser controls hook for step-by-step movement operations
 */

import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { FocuserDirection } from '../types/focuser.types';
import { 
  validatePosition, 
  validateStepSize,
  canMoveToPosition,
  estimateMovementTime
} from '../utils/focuser.utils';
import { STEP_SIZES } from '../utils/focuser.constants';

export function useFocuserControls() {
  const {
    focuserStatus,
    autoFocus,
    stepSize,
    targetPosition,
    setFocuserStatus,
    setStepSize,
    setTargetPosition,
    equipmentStatus,
  } = useAppStore();

  // Enhanced status
  const status = useMemo(() => ({
    ...focuserStatus,
    connected: equipmentStatus.focuser === 'connected',
  }), [focuserStatus, equipmentStatus.focuser]);

  // Check if controls are enabled
  const controlsEnabled = useMemo(() => {
    return status.connected && !status.moving && !autoFocus.running;
  }, [status.connected, status.moving, autoFocus.running]);

  // Move in/out by step size
  const moveBySteps = useCallback(async (direction: FocuserDirection, steps: number = stepSize) => {
    if (!controlsEnabled) {
      throw new Error('Focuser controls are disabled');
    }

    const currentPos = status.position;
    const newPosition = direction === 'in' 
      ? Math.max(0, currentPos - steps)
      : Math.min(status.maxPosition, currentPos + steps);

    if (!canMoveToPosition(currentPos, newPosition, status.maxPosition, status.moving)) {
      throw new Error('Cannot move to position');
    }

    setFocuserStatus({
      moving: true,
      targetPosition: newPosition,
    });

    // Simulate movement
    const movementTime = estimateMovementTime(currentPos, newPosition);
    
    setTimeout(() => {
      setFocuserStatus({
        moving: false,
        position: newPosition,
      });
    }, movementTime * 1000);
  }, [controlsEnabled, stepSize, status.position, status.maxPosition, status.moving, setFocuserStatus]);

  // Move in (towards camera)
  const moveIn = useCallback(async (steps?: number) => {
    await moveBySteps('in', steps);
  }, [moveBySteps]);

  // Move out (away from camera)
  const moveOut = useCallback(async (steps?: number) => {
    await moveBySteps('out', steps);
  }, [moveBySteps]);

  // Move to specific position
  const moveToPosition = useCallback(async (position: number) => {
    if (!controlsEnabled) {
      throw new Error('Focuser controls are disabled');
    }

    if (!validatePosition(position, status.maxPosition)) {
      throw new Error('Invalid position');
    }

    if (!canMoveToPosition(status.position, position, status.maxPosition, status.moving)) {
      throw new Error('Cannot move to position');
    }

    setFocuserStatus({
      moving: true,
      targetPosition: position,
    });

    // Simulate movement
    const movementTime = estimateMovementTime(status.position, position);
    
    setTimeout(() => {
      setFocuserStatus({
        moving: false,
        position: position,
      });
    }, movementTime * 1000);
  }, [controlsEnabled, status.position, status.maxPosition, status.moving, setFocuserStatus]);

  // Move to target position (from input)
  const moveToTargetPosition = useCallback(async () => {
    await moveToPosition(targetPosition);
  }, [moveToPosition, targetPosition]);

  // Home focuser (move to position 0)
  const homeFocuser = useCallback(async () => {
    if (!controlsEnabled) {
      throw new Error('Focuser controls are disabled');
    }

    setFocuserStatus({
      moving: true,
      targetPosition: 0,
    });

    // Simulate homing (typically takes longer)
    setTimeout(() => {
      setFocuserStatus({
        moving: false,
        position: 0,
      });
      setTargetPosition(0);
    }, 5000);
  }, [controlsEnabled, setFocuserStatus, setTargetPosition]);

  // Stop movement
  const stopMovement = useCallback(async () => {
    if (!status.moving) return;

    setFocuserStatus({
      moving: false,
      targetPosition: status.position,
    });
  }, [status.moving, status.position, setFocuserStatus]);

  // Update step size
  const updateStepSize = useCallback((newStepSize: number) => {
    if (!validateStepSize(newStepSize)) {
      throw new Error('Invalid step size');
    }
    setStepSize(newStepSize);
  }, [setStepSize]);

  // Update target position
  const updateTargetPosition = useCallback((position: number) => {
    if (!validatePosition(position, status.maxPosition)) {
      throw new Error('Invalid target position');
    }
    setTargetPosition(position);
  }, [status.maxPosition, setTargetPosition]);

  // Get available step sizes
  const availableStepSizes = useMemo(() => STEP_SIZES, []);

  // Check if position is valid
  const isValidPosition = useCallback((position: number) => {
    return validatePosition(position, status.maxPosition);
  }, [status.maxPosition]);

  // Check if step size is valid
  const isValidStepSize = useCallback((size: number) => {
    return validateStepSize(size);
  }, []);

  // Calculate movement time estimate
  const getMovementTimeEstimate = useCallback((toPosition: number) => {
    return estimateMovementTime(status.position, toPosition);
  }, [status.position]);

  // Get movement direction
  const getMovementDirection = useCallback((toPosition: number): FocuserDirection | null => {
    if (toPosition === status.position) return null;
    return toPosition > status.position ? 'out' : 'in';
  }, [status.position]);

  // Check if can move in direction
  const canMoveInDirection = useCallback((direction: FocuserDirection, steps: number = stepSize) => {
    if (!controlsEnabled) return false;
    
    const newPosition = direction === 'in' 
      ? status.position - steps
      : status.position + steps;
    
    return validatePosition(newPosition, status.maxPosition);
  }, [controlsEnabled, status.position, status.maxPosition, stepSize]);

  return {
    // State
    status,
    stepSize,
    targetPosition,
    controlsEnabled,
    availableStepSizes,

    // Movement actions
    moveIn,
    moveOut,
    moveBySteps,
    moveToPosition,
    moveToTargetPosition,
    homeFocuser,
    stopMovement,

    // Configuration actions
    updateStepSize,
    updateTargetPosition,

    // Utilities
    isValidPosition,
    isValidStepSize,
    getMovementTimeEstimate,
    getMovementDirection,
    canMoveInDirection,
  };
}
