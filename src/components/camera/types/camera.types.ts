/**
 * Camera-related types and interfaces
 */

export interface CameraSettings {
  exposure: number;
  iso: number;
  binning: string;
  gain: number;
  offset: number;
  temperature: number;
  coolingEnabled: boolean;
  frameType: string;
  imageFormat: string;
}

export interface CameraStatus {
  isCapturing: boolean;
  captureProgress: number;
  liveViewActive: boolean;
  cameraTemp: number;
  targetTemp: number;
  coolingPower: number;
  connected: boolean;
}

export interface CaptureOptions {
  exposure: number;
  count: number;
  binning: string;
  frameType: string;
  imageFormat: string;
}

export interface LiveViewConfig {
  active: boolean;
  refreshRate: number;
  quality: 'low' | 'medium' | 'high';
}

export type FrameType = 'Light' | 'Dark' | 'Bias' | 'Flat';
export type ImageFormat = 'FITS' | 'RAW' | 'TIFF' | 'JPEG';
export type BinningMode = '1x1' | '2x2' | '3x3' | '4x4';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface CameraInfo {
  name: string;
  model: string;
  serialNumber?: string;
  driverVersion?: string;
  firmwareVersion?: string;
}

export interface CoolingSettings {
  enabled: boolean;
  targetTemperature: number;
  currentTemperature: number;
  coolingPower: number;
  maxCoolingPower: number;
}

export interface CameraCapabilities {
  hasShutter: boolean;
  hasCooling: boolean;
  hasGainControl: boolean;
  hasOffsetControl: boolean;
  minExposure: number;
  maxExposure: number;
  minGain: number;
  maxGain: number;
  minOffset: number;
  maxOffset: number;
  supportedBinning: BinningMode[];
  supportedFormats: ImageFormat[];
}

export interface CameraActions {
  setCameraSettings: (settings: Partial<CameraSettings>) => void;
  setIsCapturing: (capturing: boolean) => void;
  setCaptureProgress: (progress: number) => void;
  setLiveViewActive: (active: boolean) => void;
  setCameraTemp: (temp: number) => void;
  setTargetTemp: (temp: number) => void;
  setCoolingPower: (power: number) => void;
  startCapture: () => void;
  abortCapture: () => void;
}

export interface CameraState extends CameraStatus, CameraActions {
  cameraSettings: CameraSettings;
  cameraInfo: CameraInfo;
  capabilities: CameraCapabilities;
}
