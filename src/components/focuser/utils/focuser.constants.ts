/**
 * Focuser constants and default values
 */

import { 
  FocuserConfig, 
  FocuserCapabilities, 
  AutoFocusConfig, 
  StepSize,
  AutoFocusAlgorithm 
} from '../types/focuser.types';

// Default focuser configuration
export const DEFAULT_FOCUSER_CONFIG: FocuserConfig = {
  stepSize: 100,
  backlashSteps: 0,
  temperatureCompensation: false,
  temperatureCoefficient: 0.0,
  maxPosition: 50000,
  homeOnConnect: false,
  reverseDirection: false,
  speed: 50,
};

// Default focuser capabilities
export const DEFAULT_FOCUSER_CAPABILITIES: FocuserCapabilities = {
  hasTemperatureSensor: true,
  hasTemperatureCompensation: true,
  hasBacklashCompensation: true,
  hasAbsolutePosition: true,
  hasVariableSpeed: true,
  maxPosition: 50000,
  minPosition: 0,
  stepSize: 1,
  maxSpeed: 100,
  minSpeed: 1,
};

// Default auto focus configuration
export const DEFAULT_AUTOFOCUS_CONFIG: AutoFocusConfig = {
  stepSize: 100,
  maxSteps: 50,
  tolerance: 0.1,
  backlashSteps: 5,
  useTemperatureCompensation: false,
  algorithm: 'hyperbolic',
  exposureTime: 3.0,
  binning: 1,
};

// Available step sizes
export const STEP_SIZES: StepSize[] = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

// Auto focus algorithms
export const AUTOFOCUS_ALGORITHMS: AutoFocusAlgorithm[] = ['hyperbolic', 'parabolic', 'linear'];

// Focuser models and their specifications
export const FOCUSER_MODELS = {
  'ZWO EAF': {
    maxPosition: 50000,
    stepSize: 1,
    hasTemperatureSensor: true,
    hasBacklash: true,
    defaultSpeed: 50,
  },
  'Celestron Focus Motor': {
    maxPosition: 65535,
    stepSize: 1,
    hasTemperatureSensor: false,
    hasBacklash: true,
    defaultSpeed: 30,
  },
  'Pegasus Astro FocusCube': {
    maxPosition: 100000,
    stepSize: 1,
    hasTemperatureSensor: true,
    hasBacklash: true,
    defaultSpeed: 75,
  },
  'Moonlite Focuser': {
    maxPosition: 65535,
    stepSize: 1,
    hasTemperatureSensor: true,
    hasBacklash: true,
    defaultSpeed: 40,
  },
} as const;

// Status colors for UI
export const FOCUSER_STATUS_COLORS = {
  connected: 'success',
  disconnected: 'destructive',
  connecting: 'warning',
  error: 'destructive',
  moving: 'warning',
  idle: 'success',
} as const;

// Icons for different focuser states
export const FOCUSER_ICONS = {
  connected: 'Focus',
  disconnected: 'FocusOff',
  moving: 'RotateCw',
  autofocus: 'Zap',
  manual: 'Target',
  home: 'Home',
  stop: 'Square',
  in: 'Minus',
  out: 'Plus',
  temperature: 'Thermometer',
  curve: 'TrendingUp',
} as const;

// Movement constraints
export const MOVEMENT_CONSTRAINTS = {
  MIN_POSITION: 0,
  MAX_POSITION: 100000,
  MIN_STEP_SIZE: 1,
  MAX_STEP_SIZE: 1000,
  MIN_SPEED: 1,
  MAX_SPEED: 100,
  MOVEMENT_TIMEOUT: 30000, // 30 seconds
  POSITION_TOLERANCE: 5,
} as const;

// Auto focus constraints
export const AUTOFOCUS_CONSTRAINTS = {
  MIN_EXPOSURE: 0.1,
  MAX_EXPOSURE: 60.0,
  MIN_STEPS: 5,
  MAX_STEPS: 100,
  MIN_TOLERANCE: 0.01,
  MAX_TOLERANCE: 1.0,
  MIN_HFR: 0.5,
  MAX_HFR: 20.0,
  TIMEOUT: 300000, // 5 minutes
} as const;

// Temperature compensation
export const TEMPERATURE_COMPENSATION = {
  MIN_COEFFICIENT: -50.0,
  MAX_COEFFICIENT: 50.0,
  DEFAULT_COEFFICIENT: 0.0,
  REFERENCE_TEMPERATURE: 20.0,
  MIN_TEMPERATURE_CHANGE: 0.5, // Minimum change to trigger compensation
} as const;

// Curve fitting parameters
export const CURVE_FITTING = {
  MIN_SAMPLES: 5,
  MIN_R2: 0.7, // Minimum R² for valid curve
  OUTLIER_THRESHOLD: 2.0, // Standard deviations for outlier detection
  CONFIDENCE_THRESHOLD: 0.8,
} as const;

// Error codes
export const FOCUSER_ERROR_CODES = {
  CONNECTION_FAILED: 'FOCUSER_CONNECTION_FAILED',
  MOVEMENT_TIMEOUT: 'FOCUSER_MOVEMENT_TIMEOUT',
  POSITION_OUT_OF_RANGE: 'FOCUSER_POSITION_OUT_OF_RANGE',
  AUTOFOCUS_FAILED: 'AUTOFOCUS_FAILED',
  TEMPERATURE_SENSOR_ERROR: 'TEMPERATURE_SENSOR_ERROR',
  COMMUNICATION_ERROR: 'COMMUNICATION_ERROR',
  HARDWARE_ERROR: 'HARDWARE_ERROR',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
} as const;

// Default error messages
export const FOCUSER_ERROR_MESSAGES = {
  [FOCUSER_ERROR_CODES.CONNECTION_FAILED]: 'Failed to connect to focuser',
  [FOCUSER_ERROR_CODES.MOVEMENT_TIMEOUT]: 'Focuser movement timed out',
  [FOCUSER_ERROR_CODES.POSITION_OUT_OF_RANGE]: 'Position is out of valid range',
  [FOCUSER_ERROR_CODES.AUTOFOCUS_FAILED]: 'Auto focus routine failed',
  [FOCUSER_ERROR_CODES.TEMPERATURE_SENSOR_ERROR]: 'Temperature sensor error',
  [FOCUSER_ERROR_CODES.COMMUNICATION_ERROR]: 'Communication error with focuser',
  [FOCUSER_ERROR_CODES.HARDWARE_ERROR]: 'Focuser hardware error',
  [FOCUSER_ERROR_CODES.INVALID_CONFIGURATION]: 'Invalid focuser configuration',
} as const;

// Animation and UI constants
export const UI_CONSTANTS = {
  PROGRESS_UPDATE_INTERVAL: 100, // ms
  STATUS_UPDATE_INTERVAL: 1000, // ms
  CHART_UPDATE_INTERVAL: 500, // ms
  DEBOUNCE_DELAY: 300, // ms for input debouncing
  ANIMATION_DURATION: 200, // ms for UI animations
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  POSITION: /^\d+$/,
  STEP_SIZE: /^\d+$/,
  TEMPERATURE: /^-?\d+(\.\d+)?$/,
  COEFFICIENT: /^-?\d+(\.\d+)?$/,
} as const;
