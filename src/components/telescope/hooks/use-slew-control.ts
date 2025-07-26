/**
 * Hook for slew control functionality
 */

import { useCallback } from 'react';
import { useTelescope } from './use-telescope';
import { TelescopeTarget, Direction, SlewRate } from '../types/telescope.types';
import { COMMON_TARGETS } from '../utils/telescope.constants';
import { validateDirection, estimateSlewTime } from '../utils/telescope.utils';

export function useSlewControl() {
  const {
    mountStatus,
    slewTarget,
    slewRate,
    setSlewTarget,
    setSlewRate,
    startSlew,
    abortSlew,
    canSlew,
    canMove,
  } = useTelescope();

  // Set target from common targets list
  const selectCommonTarget = useCallback((targetName: string) => {
    const target = COMMON_TARGETS.find(t => t.name === targetName);
    if (target) {
      setSlewTarget({
        ra: target.ra,
        dec: target.dec,
        name: target.name,
      });
    }
  }, [setSlewTarget]);

  // Set custom target coordinates
  const setCustomTarget = useCallback((ra: string, dec: string, name?: string) => {
    setSlewTarget({
      ra,
      dec,
      name: name || 'Custom Target',
    });
  }, [setSlewTarget]);

  // Handle directional movement
  const moveDirection = useCallback((direction: Direction) => {
    if (!canMove) {
      console.warn(`Cannot move ${direction}: mount is not ready`);
      return false;
    }

    if (!validateDirection(direction)) {
      console.warn(`Invalid direction: ${direction}`);
      return false;
    }

    console.log(`Moving ${direction} at ${slewRate} rate`);
    // In a real implementation, this would send commands to the mount
    return true;
  }, [canMove, slewRate]);

  // Estimate slew time to current target
  const estimatedSlewTime = useCallback(() => {
    return estimateSlewTime(
      mountStatus.ra,
      mountStatus.dec,
      slewTarget.ra,
      slewTarget.dec,
      slewRate as SlewRate
    );
  }, [mountStatus.ra, mountStatus.dec, slewTarget.ra, slewTarget.dec, slewRate]);

  // Get available common targets
  const getCommonTargets = useCallback(() => {
    return COMMON_TARGETS;
  }, []);

  // Check if target is valid for slewing
  const isTargetValid = useCallback(() => {
    return slewTarget.ra.length > 0 && 
           slewTarget.dec.length > 0 && 
           slewTarget.name.length > 0;
  }, [slewTarget]);

  return {
    // State
    slewTarget,
    slewRate,
    canSlew,
    canMove,
    isSlewing: mountStatus.slewing,
    
    // Actions
    setSlewRate,
    selectCommonTarget,
    setCustomTarget,
    startSlew,
    abortSlew,
    moveDirection,
    
    // Utilities
    getCommonTargets,
    estimatedSlewTime,
    isTargetValid,
  };
}
