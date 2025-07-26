/**
 * Main focuser hook that provides focuser state and actions
 */

import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  FocuserDirection, 
  UseFocuserReturn, 
  // AutoFocusConfig, // Unused after removing parameter
  TemperatureUnit 
} from '../types/focuser.types';
import { 
  validatePosition, 
  // validateStepSize, // Unused for now
  formatPosition, 
  formatTemperature,
  calculateSteps,
  canMoveToPosition,
  estimateMovementTime
} from '../utils/focuser.utils';
// import { MOVEMENT_CONSTRAINTS } from '../utils/focuser.constants'; // Unused for now

export function useFocuser(): UseFocuserReturn {
  const {
    focuserStatus,
    autoFocus,
    stepSize,
    targetPosition,
    setFocuserStatus,
    setAutoFocus,
    // setStepSize, // Unused for now
    // setTargetPosition, // Unused for now
    equipmentStatus,
  } = useAppStore();

  // Enhanced status with connection info
  const status = useMemo(() => ({
    ...focuserStatus,
    connected: equipmentStatus.focuser === 'connected',
  }), [focuserStatus, equipmentStatus.focuser]);

  // Movement progress calculation
  const moveProgress = useMemo(() => {
    if (!status.moving) return { progress: 0 };
    
    const totalDistance = Math.abs(status.targetPosition - status.position);
    const remainingDistance = Math.abs(status.targetPosition - status.position);
    const progress = totalDistance > 0 ? ((totalDistance - remainingDistance) / totalDistance) * 100 : 0;
    
    return {
      progress: Math.min(100, Math.max(0, progress)),
      estimatedTimeRemaining: estimateMovementTime(status.position, status.targetPosition),
    };
  }, [status.moving, status.position, status.targetPosition]);

  // Move to absolute position
  const moveToPosition = useCallback(async (position: number) => {
    if (!canMoveToPosition(status.position, position, status.maxPosition, status.moving)) {
      throw new Error('Cannot move to position');
    }

    setFocuserStatus({
      moving: true,
      targetPosition: position,
    });

    // Simulate movement (in real implementation, this would be an API call)
    const movementTime = estimateMovementTime(status.position, position);
    
    setTimeout(() => {
      setFocuserStatus({
        moving: false,
        position: position,
      });
    }, movementTime * 1000);
  }, [status.position, status.maxPosition, status.moving, setFocuserStatus]);

  // Move relative steps
  const moveRelative = useCallback(async (steps: number, direction: FocuserDirection) => {
    const currentPos = status.position;
    const newPosition = direction === 'in' 
      ? Math.max(0, currentPos - steps)
      : Math.min(status.maxPosition, currentPos + steps);

    await moveToPosition(newPosition);
  }, [status.position, status.maxPosition, moveToPosition]);

  // Home focuser
  const homeFocuser = useCallback(async () => {
    if (status.moving) return;

    setFocuserStatus({
      moving: true,
      targetPosition: 0,
    });

    // Simulate homing (in real implementation, this would be an API call)
    setTimeout(() => {
      setFocuserStatus({
        moving: false,
        position: 0,
      });
    }, 5000); // Homing typically takes longer
  }, [status.moving, setFocuserStatus]);

  // Stop movement
  const stopMovement = useCallback(async () => {
    if (!status.moving) return;

    setFocuserStatus({
      moving: false,
      targetPosition: status.position, // Set target to current position
    });
  }, [status.moving, status.position, setFocuserStatus]);

  // Start auto focus
  const startAutoFocus = useCallback(async () => {
    if (autoFocus.running || status.moving) return;

    setAutoFocus({
      running: true,
      progress: 0,
      samples: [],

    });

    // Simulate auto-focus routine
    const interval = setInterval(() => {
      const currentAutoFocus = useAppStore.getState().autoFocus;
      const newProgress = currentAutoFocus.progress + 10;
      const newSamples = [...currentAutoFocus.samples];

      if (newProgress <= 100) {
        // Add sample data
        const samplePosition = status.position + (Math.random() - 0.5) * 1000;
        const sampleHfr = 2.0 + Math.random() * 2 + Math.abs(samplePosition - 15420) / 5000;
        newSamples.push({ 
          position: samplePosition, 
          hfr: sampleHfr,

        });
      }

      if (newProgress >= 100) {
        clearInterval(interval);
        const bestSample = newSamples.reduce((best, current) =>
          current.hfr < best.hfr ? current : best
        );
        setAutoFocus({
          running: false,
          progress: 100,
          bestPosition: bestSample.position,
          hfr: bestSample.hfr,
          samples: newSamples,

        });
      } else {
        setAutoFocus({ 
          progress: newProgress, 
          samples: newSamples 
        });
      }
    }, 500);
  }, [autoFocus.running, status.moving, status.position, setAutoFocus]);

  // Abort auto focus
  const abortAutoFocus = useCallback(async () => {
    if (!autoFocus.running) return;

    setAutoFocus({ 
      running: false, 
      progress: 0,

    });
  }, [autoFocus.running, setAutoFocus]);

  // Utility functions
  const canMove = useCallback(() => {
    return status.connected && !status.moving && !autoFocus.running;
  }, [status.connected, status.moving, autoFocus.running]);

  const isValidPosition = useCallback((position: number) => {
    return validatePosition(position, status.maxPosition);
  }, [status.maxPosition]);

  const calculateStepsBetween = useCallback((fromPosition: number, toPosition: number) => {
    return calculateSteps(fromPosition, toPosition);
  }, []);

  const formatPositionValue = useCallback((position: number) => {
    return formatPosition(position);
  }, []);

  const formatTemperatureValue = useCallback((temperature: number, unit?: TemperatureUnit) => {
    return formatTemperature(temperature, unit);
  }, []);

  return {
    // State
    status,
    autoFocus,
    moveProgress,
    stepSize,
    targetPosition,
    isLoading: false, // Could be enhanced with actual loading states
    error: null, // Could be enhanced with error handling

    // Actions
    moveToPosition,
    moveRelative,
    homeFocuser,
    stopMovement,
    startAutoFocus,
    abortAutoFocus,

    // Utilities
    canMove,
    isValidPosition,
    calculateSteps: calculateStepsBetween,
    formatPosition: formatPositionValue,
    formatTemperature: formatTemperatureValue,
  };
}
