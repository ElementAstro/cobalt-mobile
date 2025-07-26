/**
 * Focuser TypeScript type definitions
 * Comprehensive types for focuser functionality
 */

// Core focuser status
export interface FocuserStatus {
  position: number;
  targetPosition: number;
  moving: boolean;
  temperature: number;
  connected: boolean;
  maxPosition: number;
  stepSize: number;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  backlash?: number;
  temperatureCompensation?: boolean;
}

// Auto focus sample data point
export interface AutoFocusSample {
  position: number;
  hfr: number;
  timestamp?: Date;
  starCount?: number;
  fwhm?: number;
  eccentricity?: number;
}

// Auto focus configuration
export interface AutoFocusConfig {
  stepSize: number;
  maxSteps: number;
  tolerance: number;
  backlashSteps: number;
  useTemperatureCompensation: boolean;
  algorithm: 'hyperbolic' | 'parabolic' | 'linear';
  exposureTime: number;
  binning: number;
  filterPosition?: number;
  subFrame?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Auto focus data and state
export interface AutoFocusData {
  running: boolean;
  progress: number;
  bestPosition: number;
  hfr: number;
  samples: AutoFocusSample[];
  config?: AutoFocusConfig;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  curve?: {
    leftSlope: number;
    rightSlope: number;
    minimum: number;
    r2: number;
  };
}

// Movement progress tracking
export interface MovementProgress {
  progress: number;
  estimatedTimeRemaining?: number;
  startTime?: Date;
  endTime?: Date;
  startPosition?: number;
  targetPosition?: number;
}

// Focuser capabilities
export interface FocuserCapabilities {
  hasTemperatureSensor: boolean;
  hasTemperatureCompensation: boolean;
  hasBacklashCompensation: boolean;
  hasAbsolutePosition: boolean;
  hasVariableSpeed: boolean;
  maxPosition: number;
  minPosition: number;
  stepSize: number;
  maxSpeed?: number;
  minSpeed?: number;
}

// Focuser configuration
export interface FocuserConfig {
  stepSize: number;
  backlashSteps: number;
  temperatureCompensation: boolean;
  temperatureCoefficient: number;
  maxPosition: number;
  homeOnConnect: boolean;
  reverseDirection: boolean;
  speed: number;
}

// Focuser actions/operations
export interface FocuserActions {
  moveToPosition: (position: number) => Promise<void>;
  moveRelative: (steps: number) => Promise<void>;
  homeFocuser: () => Promise<void>;
  stopMovement: () => Promise<void>;
  startAutoFocus: (config?: Partial<AutoFocusConfig>) => Promise<void>;
  abortAutoFocus: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  calibrate: () => Promise<void>;
  setTemperatureCompensation: (enabled: boolean) => Promise<void>;
}

// Focuser state for store
export interface FocuserState {
  status: FocuserStatus;
  autoFocus: AutoFocusData;
  moveProgress: MovementProgress;
  config: FocuserConfig;
  capabilities: FocuserCapabilities;
  stepSize: number;
  targetPosition: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Focus curve analysis
export interface FocusCurve {
  samples: AutoFocusSample[];
  bestPosition: number;
  bestHfr: number;
  leftSlope: number;
  rightSlope: number;
  minimum: number;
  r2: number;
  isValid: boolean;
  confidence: number;
}

// Temperature compensation data
export interface TemperatureCompensation {
  enabled: boolean;
  coefficient: number;
  referenceTemperature: number;
  currentAdjustment: number;
  history: Array<{
    temperature: number;
    position: number;
    timestamp: Date;
  }>;
}

// Constants types
export type FocuserDirection = 'in' | 'out';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
export type MovementStatus = 'idle' | 'moving' | 'homing' | 'calibrating' | 'error';
export type AutoFocusAlgorithm = 'hyperbolic' | 'parabolic' | 'linear';
export type AutoFocusStatus = 'idle' | 'running' | 'completed' | 'failed' | 'aborted';

// Utility types
export type StepSize = 1 | 5 | 10 | 25 | 50 | 100 | 250 | 500 | 1000;
export type TemperatureUnit = 'celsius' | 'fahrenheit';

// Hook return types
export interface UseFocuserReturn {
  // State
  status: FocuserStatus;
  autoFocus: AutoFocusData;
  moveProgress: MovementProgress;
  stepSize: number;
  targetPosition: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  moveToPosition: (position: number) => Promise<void>;
  moveRelative: (steps: number, direction: FocuserDirection) => Promise<void>;
  homeFocuser: () => Promise<void>;
  stopMovement: () => Promise<void>;
  startAutoFocus: (config?: Partial<AutoFocusConfig>) => Promise<void>;
  abortAutoFocus: () => Promise<void>;
  
  // Utilities
  canMove: () => boolean;
  isValidPosition: (position: number) => boolean;
  calculateSteps: (fromPosition: number, toPosition: number) => number;
  formatPosition: (position: number) => string;
  formatTemperature: (temperature: number, unit?: TemperatureUnit) => string;
}

export interface UseAutoFocusReturn {
  // State
  autoFocus: AutoFocusData;
  isRunning: boolean;
  progress: number;
  samples: AutoFocusSample[];
  bestPosition: number;
  bestHfr: number;
  curve: FocusCurve | null;
  
  // Actions
  startAutoFocus: (config?: Partial<AutoFocusConfig>) => Promise<void>;
  abortAutoFocus: () => Promise<void>;
  
  // Analysis
  analyzeCurve: () => FocusCurve | null;
  getStatistics: () => {
    minHfr: number;
    maxHfr: number;
    range: number;
    sampleCount: number;
  };
}

// Event types for focuser operations
export interface FocuserEvent {
  type: 'position_changed' | 'movement_started' | 'movement_completed' | 'autofocus_started' | 'autofocus_completed' | 'error';
  timestamp: Date;
  data?: Record<string, unknown>;
}

// Error types
export interface FocuserError {
  code: string;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}
