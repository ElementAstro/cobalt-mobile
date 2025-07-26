/**
 * Camera-related constants and configuration values
 */

import { BinningMode, ImageFormat, FrameType } from '../types/camera.types';

export const CAMERA_CONSTANTS = {
  // Exposure limits (in seconds)
  MIN_EXPOSURE: 0.001,
  MAX_EXPOSURE: 3600,
  DEFAULT_EXPOSURE: 300,

  // ISO values
  ISO_VALUES: [100, 200, 400, 800, 1600, 3200, 6400] as const,
  DEFAULT_ISO: 1600,

  // Gain and offset limits
  MIN_GAIN: 0,
  MAX_GAIN: 300,
  DEFAULT_GAIN: 100,
  MIN_OFFSET: 0,
  MAX_OFFSET: 50,
  DEFAULT_OFFSET: 10,

  // Temperature limits (Celsius)
  MIN_TEMPERATURE: -40,
  MAX_TEMPERATURE: 20,
  DEFAULT_TEMPERATURE: -10,

  // Capture progress update interval (ms)
  PROGRESS_UPDATE_INTERVAL: 100,

  // Live view settings
  LIVE_VIEW_REFRESH_RATE: 30, // fps
  LIVE_VIEW_QUALITY: 'medium' as const,
} as const;

export const BINNING_OPTIONS: readonly BinningMode[] = [
  '1x1',
  '2x2', 
  '3x3',
  '4x4'
] as const;

export const IMAGE_FORMATS: readonly ImageFormat[] = [
  'FITS',
  'RAW',
  'TIFF',
  'JPEG'
] as const;

export const FRAME_TYPES: readonly FrameType[] = [
  'Light',
  'Dark',
  'Bias',
  'Flat'
] as const;

export const CAMERA_MODELS = {
  ZWO_ASI2600MC_PRO: {
    name: 'ZWO ASI2600MC Pro',
    hasShutter: false,
    hasCooling: true,
    hasGainControl: true,
    hasOffsetControl: true,
    minExposure: 0.000032,
    maxExposure: 2000,
    minGain: 0,
    maxGain: 300,
    minOffset: 0,
    maxOffset: 50,
    supportedBinning: ['1x1', '2x2', '3x3', '4x4'] as BinningMode[],
    supportedFormats: ['FITS', 'RAW', 'TIFF'] as ImageFormat[],
  },
  // Add more camera models as needed
} as const;

export const DEFAULT_CAMERA_SETTINGS = {
  exposure: CAMERA_CONSTANTS.DEFAULT_EXPOSURE,
  iso: CAMERA_CONSTANTS.DEFAULT_ISO,
  binning: '1x1' as BinningMode,
  gain: CAMERA_CONSTANTS.DEFAULT_GAIN,
  offset: CAMERA_CONSTANTS.DEFAULT_OFFSET,
  temperature: CAMERA_CONSTANTS.DEFAULT_TEMPERATURE,
  coolingEnabled: true,
  frameType: 'Light' as FrameType,
  imageFormat: 'FITS' as ImageFormat,
} as const;

export const CAMERA_STATUS_COLORS = {
  connected: 'bg-green-500',
  disconnected: 'bg-gray-500',
  error: 'bg-red-500',
} as const;

export const CAMERA_ICONS = {
  camera: 'Camera',
  capture: 'Camera',
  abort: 'Square',
  liveView: 'Eye',
  download: 'Download',
  settings: 'Settings',
  timer: 'Timer',
  aperture: 'Aperture',
} as const;
