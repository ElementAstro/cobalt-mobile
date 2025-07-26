/**
 * Camera module exports
 * Provides clean imports for all camera-related components, hooks, types, and utilities
 */

// Main Components
export { default as CameraControl } from './components/camera-control';
export { default as CameraDetailPage } from './components/camera-detail-page';

// Sub Components
export { default as CameraStatusComponent } from './components/camera-status';
export { default as ExposureSettings } from './components/exposure-settings';
export { default as CameraSettingsComponent } from './components/camera-settings';
export { default as CaptureControls } from './components/capture-controls';
export { default as LiveView } from './components/live-view';

// Hooks
export { useCamera } from './hooks/use-camera';
export { useCameraCapture } from './hooks/use-camera-capture';
export { useCameraSettings } from './hooks/use-camera-settings';

// Types
export type {
  CameraSettings,
  CameraStatus,
  CaptureOptions,
  LiveViewConfig,
  FrameType,
  ImageFormat,
  BinningMode,
  ConnectionStatus,
  CameraInfo,
  CoolingSettings,
  CameraCapabilities,
  CameraActions,
  CameraState,
} from './types/camera.types';

// Constants
export {
  CAMERA_CONSTANTS,
  BINNING_OPTIONS,
  IMAGE_FORMATS,
  FRAME_TYPES,
  CAMERA_MODELS,
  DEFAULT_CAMERA_SETTINGS,
  CAMERA_STATUS_COLORS,
  CAMERA_ICONS,
} from './utils/camera.constants';

// Utilities
export {
  validateExposure,
  validateGain,
  validateOffset,
  validateTemperature,
  formatExposureTime,
  formatTemperature,
  calculateCaptureTime,
  getStatusColor,
  validateCameraSettings,
  calculateCoolingPower,
  estimateCoolingTime,
  formatFileSize,
  estimateImageSize,
} from './utils/camera.utils';
