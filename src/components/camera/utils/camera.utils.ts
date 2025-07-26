/**
 * Camera utility functions
 */

import { CameraSettings, ImageFormat, BinningMode, ConnectionStatus } from '../types/camera.types';
import { CAMERA_CONSTANTS, CAMERA_STATUS_COLORS } from './camera.constants';

/**
 * Validates camera exposure time
 */
export function validateExposure(exposure: number): boolean {
  return exposure >= CAMERA_CONSTANTS.MIN_EXPOSURE && exposure <= CAMERA_CONSTANTS.MAX_EXPOSURE;
}

/**
 * Validates camera gain value
 */
export function validateGain(gain: number): boolean {
  return gain >= CAMERA_CONSTANTS.MIN_GAIN && gain <= CAMERA_CONSTANTS.MAX_GAIN;
}

/**
 * Validates camera offset value
 */
export function validateOffset(offset: number): boolean {
  return offset >= CAMERA_CONSTANTS.MIN_OFFSET && offset <= CAMERA_CONSTANTS.MAX_OFFSET;
}

/**
 * Validates camera temperature setting
 */
export function validateTemperature(temperature: number): boolean {
  return temperature >= CAMERA_CONSTANTS.MIN_TEMPERATURE && temperature <= CAMERA_CONSTANTS.MAX_TEMPERATURE;
}

/**
 * Formats exposure time for display
 */
export function formatExposureTime(seconds: number): string {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`;
  } else if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }
}

/**
 * Formats temperature for display
 */
export function formatTemperature(celsius: number | null | undefined, unit: 'C' | 'F' = 'C'): string {
  // Handle null/undefined values
  if (celsius === null || celsius === undefined || isNaN(celsius)) {
    return unit === 'F' ? '--°F' : '--°C';
  }

  if (unit === 'F') {
    const fahrenheit = (celsius * 9/5) + 32;
    return `${fahrenheit.toFixed(1)}°F`;
  }
  return `${celsius.toFixed(1)}°C`;
}

/**
 * Calculates estimated capture time
 */
export function calculateCaptureTime(exposure: number, count: number = 1): number {
  // Add overhead time for readout, processing, etc.
  const overheadPerFrame = 2; // seconds
  return (exposure + overheadPerFrame) * count;
}

/**
 * Gets status color class for camera connection
 */
export function getStatusColor(status: ConnectionStatus): string {
  return CAMERA_STATUS_COLORS[status] || CAMERA_STATUS_COLORS.disconnected;
}

/**
 * Validates camera settings object
 */
export function validateCameraSettings(settings: Partial<CameraSettings>): boolean {
  if (settings.exposure !== undefined && !validateExposure(settings.exposure)) {
    return false;
  }
  if (settings.gain !== undefined && !validateGain(settings.gain)) {
    return false;
  }
  if (settings.offset !== undefined && !validateOffset(settings.offset)) {
    return false;
  }
  if (settings.temperature !== undefined && !validateTemperature(settings.temperature)) {
    return false;
  }
  return true;
}

/**
 * Calculates cooling power percentage
 */
export function calculateCoolingPower(currentTemp: number, targetTemp: number, maxPower: number = 100): number {
  const tempDiff = Math.abs(currentTemp - targetTemp);
  const powerNeeded = Math.min(tempDiff * 10, maxPower); // Simple linear calculation
  return Math.round(powerNeeded);
}

/**
 * Estimates time to reach target temperature
 */
export function estimateCoolingTime(currentTemp: number, targetTemp: number): number {
  const tempDiff = Math.abs(currentTemp - targetTemp);
  const coolingRate = 0.5; // degrees per minute (approximate)
  return Math.ceil(tempDiff / coolingRate); // minutes
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Estimates image file size based on settings
 */
export function estimateImageSize(
  width: number = 6248, 
  height: number = 4176, 
  binning: BinningMode = '1x1',
  format: ImageFormat = 'FITS'
): number {
  const binningFactor = parseInt(binning.charAt(0));
  const actualWidth = width / binningFactor;
  const actualHeight = height / binningFactor;
  
  let bytesPerPixel: number;
  switch (format) {
    case 'FITS':
      bytesPerPixel = 2; // 16-bit
      break;
    case 'RAW':
      bytesPerPixel = 2; // 16-bit
      break;
    case 'TIFF':
      bytesPerPixel = 2; // 16-bit
      break;
    case 'JPEG':
      bytesPerPixel = 1; // 8-bit compressed
      break;
    default:
      bytesPerPixel = 2;
  }
  
  return actualWidth * actualHeight * bytesPerPixel;
}
