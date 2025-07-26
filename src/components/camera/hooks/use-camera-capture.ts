/**
 * Camera capture hook for managing capture operations
 */

import { useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { CaptureOptions } from '../types/camera.types';
import { calculateCaptureTime, formatExposureTime } from '../utils/camera.utils';

export function useCameraCapture() {
  const {
    cameraSettings,
    isCapturing,
    captureProgress,
    setCaptureProgress,
    setIsCapturing,
    startCapture,
    abortCapture,
  } = useAppStore();

  // Start capture with custom options
  const startCaptureWithOptions = useCallback((options?: Partial<CaptureOptions>) => {
    if (isCapturing) {
      console.warn('Capture already in progress');
      return false;
    }

    // If options provided, could update settings first
    if (options) {
      // This would require updating the store with new settings
      console.log('Capture options:', options);
    }

    startCapture();
    return true;
  }, [isCapturing, startCapture]);

  // Abort current capture
  const abortCurrentCapture = useCallback(() => {
    if (!isCapturing) {
      console.warn('No capture in progress');
      return false;
    }

    abortCapture();
    return true;
  }, [isCapturing, abortCapture]);

  // Get capture status information
  const getCaptureInfo = useCallback(() => {
    const estimatedTime = calculateCaptureTime(cameraSettings.exposure);
    const remainingTime = isCapturing 
      ? (estimatedTime * (100 - captureProgress)) / 100 
      : 0;

    return {
      isCapturing,
      progress: captureProgress,
      estimatedTotalTime: estimatedTime,
      remainingTime,
      formattedExposureTime: formatExposureTime(cameraSettings.exposure),
      formattedRemainingTime: formatExposureTime(remainingTime),
    };
  }, [isCapturing, captureProgress, cameraSettings.exposure]);

  // Check if capture can be started
  const canStartCapture = useCallback(() => {
    return !isCapturing && cameraSettings.exposure > 0;
  }, [isCapturing, cameraSettings.exposure]);

  // Get capture progress as a percentage string
  const getProgressPercentage = useCallback(() => {
    return `${captureProgress.toFixed(0)}%`;
  }, [captureProgress]);

  // Simulate capture progress (this would be replaced with real camera integration)
  useEffect(() => {
    if (!isCapturing) return;

    const interval = setInterval(() => {
      const increment = (100 / cameraSettings.exposure) * 0.1; // Update every 100ms
      const newProgress = captureProgress + increment;

      if (newProgress >= 100) {
        setIsCapturing(false);
        setCaptureProgress(100);
      } else {
        setCaptureProgress(newProgress);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCapturing, cameraSettings.exposure, captureProgress, setCaptureProgress, setIsCapturing]);

  return {
    // State
    isCapturing,
    captureProgress,
    
    // Actions
    startCapture: startCaptureWithOptions,
    abortCapture: abortCurrentCapture,
    
    // Computed values
    captureInfo: getCaptureInfo(),
    canStartCapture: canStartCapture(),
    progressPercentage: getProgressPercentage(),
    
    // Utilities
    calculateCaptureTime: (exposure: number, count?: number) => calculateCaptureTime(exposure, count),
    formatExposureTime,
  };
}
