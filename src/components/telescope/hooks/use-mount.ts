/**
 * Hook for mount control functionality
 */

import { useCallback } from 'react';
import { useTelescope } from './use-telescope';
// import { TrackingRate } from '../types/telescope.types'; // Unused for now
import { validateTrackingRate, getMountStatusColor, getMountStatusText } from '../utils/telescope.utils';

export function useMount() {
  const {
    mountStatus,
    trackingRate,
    setTrackingRate,
    parkMount,
    unparkMount,
    enableTracking,
    enableGuiding,
    syncToTarget,
    goToHome,
    canTrack,
    canGuide,
  } = useTelescope();

  // Toggle park status
  const togglePark = useCallback(() => {
    if (mountStatus.parked) {
      unparkMount();
    } else {
      parkMount();
    }
  }, [mountStatus.parked, parkMount, unparkMount]);

  // Set tracking rate with validation
  const setValidatedTrackingRate = useCallback((rate: string) => {
    if (validateTrackingRate(rate)) {
      setTrackingRate(rate);
    } else {
      console.warn(`Invalid tracking rate: ${rate}`);
    }
  }, [setTrackingRate]);

  // Toggle tracking
  const toggleTracking = useCallback(() => {
    enableTracking(!mountStatus.tracking);
  }, [mountStatus.tracking, enableTracking]);

  // Toggle guiding
  const toggleGuiding = useCallback(() => {
    enableGuiding(!mountStatus.guiding);
  }, [mountStatus.guiding, enableGuiding]);

  // Get mount status display info
  const getStatusInfo = useCallback(() => {
    return {
      color: getMountStatusColor(mountStatus),
      text: getMountStatusText(mountStatus),
      isOperational: !mountStatus.parked && mountStatus.aligned,
    };
  }, [mountStatus]);

  // Check if mount is ready for operations
  const isReady = useCallback(() => {
    return !mountStatus.parked && mountStatus.aligned;
  }, [mountStatus.parked, mountStatus.aligned]);

  // Get tracking status info
  const getTrackingInfo = useCallback(() => {
    return {
      enabled: mountStatus.tracking,
      rate: trackingRate,
      canEnable: canTrack,
    };
  }, [mountStatus.tracking, trackingRate, canTrack]);

  // Get guiding status info
  const getGuidingInfo = useCallback(() => {
    return {
      enabled: mountStatus.guiding,
      canEnable: canGuide,
      requiresTracking: !mountStatus.tracking,
    };
  }, [mountStatus.guiding, mountStatus.tracking, canGuide]);

  return {
    // State
    mountStatus,
    trackingRate,
    
    // Actions
    togglePark,
    setTrackingRate: setValidatedTrackingRate,
    toggleTracking,
    toggleGuiding,
    syncToTarget,
    goToHome,
    
    // Status checks
    canTrack,
    canGuide,
    isReady,
    
    // Display helpers
    getStatusInfo,
    getTrackingInfo,
    getGuidingInfo,
  };
}
