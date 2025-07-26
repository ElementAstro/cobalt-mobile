/**
 * Main camera hook that provides camera state and actions
 */

import { useAppStore } from '@/lib/store';
import { CameraSettings, CameraStatus } from '../types/camera.types';
import { validateCameraSettings } from '../utils/camera.utils';

export function useCamera() {
  const {
    cameraSettings,
    isCapturing,
    captureProgress,
    liveViewActive,
    cameraTemp,
    targetTemp,
    coolingPower,
    setCameraSettings,
    setIsCapturing,
    setCaptureProgress,
    setLiveViewActive,
    setCameraTemp,
    setTargetTemp,
    setCoolingPower,
    startCapture,
    abortCapture,
    equipmentStatus,
  } = useAppStore();

  // Camera status object
  const cameraStatus: CameraStatus = {
    isCapturing,
    captureProgress,
    liveViewActive,
    cameraTemp,
    targetTemp,
    coolingPower,
    connected: equipmentStatus.camera === 'connected',
  };

  // Safe camera settings update with validation
  const updateCameraSettings = (newSettings: Partial<CameraSettings>) => {
    if (validateCameraSettings(newSettings)) {
      setCameraSettings(newSettings);
      return true;
    }
    console.warn('Invalid camera settings:', newSettings);
    return false;
  };

  // Toggle live view
  const toggleLiveView = () => {
    setLiveViewActive(!liveViewActive);
  };

  // Check if camera is ready for capture
  const isReadyForCapture = () => {
    return cameraStatus.connected && !isCapturing;
  };

  // Get camera connection status
  const getConnectionStatus = () => {
    return equipmentStatus.camera;
  };

  // Check if cooling is active and effective
  const isCoolingEffective = () => {
    if (!cameraSettings.coolingEnabled) return false;
    const tempDiff = Math.abs(cameraTemp - cameraSettings.temperature);
    return tempDiff <= 2; // Within 2 degrees is considered effective
  };

  return {
    // State
    cameraSettings,
    cameraStatus,
    
    // Actions
    updateCameraSettings,
    toggleLiveView,
    startCapture,
    abortCapture,
    
    // Computed values
    isReadyForCapture: isReadyForCapture(),
    connectionStatus: getConnectionStatus(),
    isCoolingEffective: isCoolingEffective(),
    
    // Direct store actions (for backward compatibility)
    setCameraSettings,
    setLiveViewActive,
    setIsCapturing,
    setCaptureProgress,
    setCameraTemp,
    setTargetTemp,
    setCoolingPower,
  };
}
