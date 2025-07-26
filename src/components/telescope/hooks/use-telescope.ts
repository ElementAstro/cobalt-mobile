/**
 * Main telescope hook that provides telescope state and actions
 */

import { useAppStore } from '@/lib/store';
// import { MountStatus, SlewTarget, SlewRate, TrackingRate } from '../types/telescope.types'; // Unused for now
import { validateSlewTarget, canPerformOperation } from '../utils/telescope.utils';

export function useTelescope() {
  const {
    mountStatus,
    slewTarget,
    slewRate,
    trackingRate,
    setMountStatus,
    setSlewTarget,
    setSlewRate,
    setTrackingRate,
    equipmentStatus,
  } = useAppStore();

  // Mount status with connection info
  const telescopeStatus = {
    ...mountStatus,
    connected: equipmentStatus.mount === 'connected',
  };

  // Actions
  const startSlew = async () => {
    if (!telescopeStatus.connected) {
      throw new Error('Mount not connected');
    }

    if (!canPerformOperation('slew', mountStatus)) {
      throw new Error('Operation not permitted');
    }

    const validation = validateSlewTarget(slewTarget);
    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    setMountStatus({ slewing: true });

    // Simulate slew completion
    setTimeout(() => {
      setMountStatus({
        slewing: false,
        ra: slewTarget.ra,
        dec: slewTarget.dec,
      });
    }, 3000);

    return true;
  };

  const abortSlew = () => {
    setMountStatus({ slewing: false });
  };

  const parkMount = () => {
    setMountStatus({
      parked: true,
      tracking: false,
      slewing: false,
      guiding: false,
    });
  };

  const unparkMount = () => {
    setMountStatus({ parked: false });
  };

  const enableTracking = (enabled: boolean) => {
    if (!canPerformOperation('track', mountStatus)) {
      console.warn('Cannot change tracking: mount is parked');
      return false;
    }

    setMountStatus({ tracking: enabled });
    return true;
  };

  const startTracking = async () => {
    if (!canPerformOperation('track', mountStatus)) {
      throw new Error('Cannot track while parked');
    }

    setMountStatus({ tracking: true });
    return true;
  };

  const stopTracking = async () => {
    setMountStatus({ tracking: false });
    return true;
  };

  const enableGuiding = (enabled: boolean) => {
    if (!canPerformOperation('guide', mountStatus)) {
      console.warn('Cannot change guiding: mount is parked or not tracking');
      return false;
    }
    
    setMountStatus({ guiding: enabled });
    return true;
  };

  const syncToTarget = () => {
    const validation = validateSlewTarget(slewTarget);
    if (!validation.isValid) {
      console.warn('Cannot sync: invalid target coordinates', validation.errors);
      return false;
    }

    setMountStatus({
      ra: slewTarget.ra,
      dec: slewTarget.dec,
      aligned: true,
    });
    return true;
  };

  const goToHome = () => {
    if (!canPerformOperation('slew', mountStatus)) {
      console.warn('Cannot go to home: mount is parked or slewing');
      return false;
    }

    setMountStatus({ slewing: true });
    
    // Simulate going to home position
    setTimeout(() => {
      setMountStatus({
        slewing: false,
        ra: '00h 00m 00s',
        dec: '+90° 00\' 00"',
      });
    }, 2000);

    return true;
  };

  return {
    // State
    telescopeStatus,
    mountStatus: telescopeStatus,
    slewTarget,
    slewRate,
    trackingRate,
    
    // Actions
    setMountStatus,
    setSlewTarget,
    setSlewRate,
    setTrackingRate,
    startSlew,
    abortSlew,
    parkMount,
    unparkMount,
    enableTracking,
    startTracking,
    stopTracking,
    enableGuiding,
    syncToTarget,
    goToHome,
    
    // Computed
    canSlew: telescopeStatus.connected && canPerformOperation('slew', mountStatus),
    canTrack: telescopeStatus.connected && canPerformOperation('track', mountStatus),
    canGuide: telescopeStatus.connected && canPerformOperation('guide', mountStatus),
    canMove: telescopeStatus.connected && canPerformOperation('move', mountStatus),
  };
}
