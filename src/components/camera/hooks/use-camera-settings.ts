/**
 * Camera settings hook for managing camera configuration
 */

import { useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { CameraSettings, BinningMode, FrameType, ImageFormat } from '../types/camera.types';
import { 
  validateExposure, 
  validateGain, 
  validateOffset, 
  validateTemperature,
  validateCameraSettings 
} from '../utils/camera.utils';
import { 
  CAMERA_CONSTANTS, 
  BINNING_OPTIONS, 
  FRAME_TYPES, 
  IMAGE_FORMATS,
  DEFAULT_CAMERA_SETTINGS 
} from '../utils/camera.constants';

export function useCameraSettings() {
  const {
    cameraSettings,
    setCameraSettings,
  } = useAppStore();

  // Update exposure with validation
  const updateExposure = useCallback((exposure: number) => {
    if (validateExposure(exposure)) {
      setCameraSettings({ exposure });
      return true;
    }
    return false;
  }, [setCameraSettings]);

  // Update ISO
  const updateISO = useCallback((iso: number) => {
    setCameraSettings({ iso });
  }, [setCameraSettings]);

  // Update gain with validation
  const updateGain = useCallback((gain: number) => {
    if (validateGain(gain)) {
      setCameraSettings({ gain });
      return true;
    }
    return false;
  }, [setCameraSettings]);

  // Update offset with validation
  const updateOffset = useCallback((offset: number) => {
    if (validateOffset(offset)) {
      setCameraSettings({ offset });
      return true;
    }
    return false;
  }, [setCameraSettings]);

  // Update binning
  const updateBinning = useCallback((binning: BinningMode) => {
    setCameraSettings({ binning });
  }, [setCameraSettings]);

  // Update frame type
  const updateFrameType = useCallback((frameType: FrameType) => {
    setCameraSettings({ frameType });
  }, [setCameraSettings]);

  // Update image format
  const updateImageFormat = useCallback((imageFormat: ImageFormat) => {
    setCameraSettings({ imageFormat });
  }, [setCameraSettings]);

  // Update cooling settings
  const updateCooling = useCallback((coolingEnabled: boolean, temperature?: number) => {
    const updates: Partial<CameraSettings> = { coolingEnabled };
    
    if (temperature !== undefined && validateTemperature(temperature)) {
      updates.temperature = temperature;
    }
    
    setCameraSettings(updates);
  }, [setCameraSettings]);

  // Update temperature with validation
  const updateTemperature = useCallback((temperature: number) => {
    if (validateTemperature(temperature)) {
      setCameraSettings({ temperature });
      return true;
    }
    return false;
  }, [setCameraSettings]);

  // Reset to default settings
  const resetToDefaults = useCallback(() => {
    setCameraSettings(DEFAULT_CAMERA_SETTINGS);
  }, [setCameraSettings]);

  // Bulk update settings with validation
  const updateSettings = useCallback((newSettings: Partial<CameraSettings>) => {
    if (validateCameraSettings(newSettings)) {
      setCameraSettings(newSettings);
      return true;
    }
    return false;
  }, [setCameraSettings]);

  // Get validation limits
  const getValidationLimits = useCallback(() => ({
    exposure: {
      min: CAMERA_CONSTANTS.MIN_EXPOSURE,
      max: CAMERA_CONSTANTS.MAX_EXPOSURE,
    },
    gain: {
      min: CAMERA_CONSTANTS.MIN_GAIN,
      max: CAMERA_CONSTANTS.MAX_GAIN,
    },
    offset: {
      min: CAMERA_CONSTANTS.MIN_OFFSET,
      max: CAMERA_CONSTANTS.MAX_OFFSET,
    },
    temperature: {
      min: CAMERA_CONSTANTS.MIN_TEMPERATURE,
      max: CAMERA_CONSTANTS.MAX_TEMPERATURE,
    },
  }), []);

  // Get available options
  const getAvailableOptions = useCallback(() => ({
    binning: BINNING_OPTIONS,
    frameTypes: FRAME_TYPES,
    imageFormats: IMAGE_FORMATS,
    isoValues: CAMERA_CONSTANTS.ISO_VALUES,
  }), []);

  return {
    // Current settings
    settings: cameraSettings,
    
    // Individual setting updates
    updateExposure,
    updateISO,
    updateGain,
    updateOffset,
    updateBinning,
    updateFrameType,
    updateImageFormat,
    updateCooling,
    updateTemperature,
    
    // Bulk operations
    updateSettings,
    resetToDefaults,
    
    // Validation and options
    validationLimits: getValidationLimits(),
    availableOptions: getAvailableOptions(),
    
    // Validation functions
    validateExposure,
    validateGain,
    validateOffset,
    validateTemperature,
  };
}
