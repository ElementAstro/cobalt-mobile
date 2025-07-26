/**
 * FilterWheel constants and default configurations
 */

import { FilterInfo, FilterWheelConfig, FilterWheelCapabilities, FilterType } from '../types/filterwheel.types';

// Default filter configurations
export const DEFAULT_FILTERS: FilterInfo[] = [
  {
    position: 1,
    name: "Luminance",
    type: "L",
    color: "#ffffff",
    installed: true,
    description: "Luminance filter for monochrome imaging",
    wavelength: 550, // Center wavelength in nm
    bandwidth: 200, // Bandwidth in nm
  },
  {
    position: 2,
    name: "Red",
    type: "R",
    color: "#ff0000",
    installed: true,
    description: "Red filter for RGB imaging",
    wavelength: 650,
    bandwidth: 100,
  },
  {
    position: 3,
    name: "Green",
    type: "G",
    color: "#00ff00",
    installed: true,
    description: "Green filter for RGB imaging",
    wavelength: 530,
    bandwidth: 100,
  },
  {
    position: 4,
    name: "Blue",
    type: "B",
    color: "#0000ff",
    installed: true,
    description: "Blue filter for RGB imaging",
    wavelength: 470,
    bandwidth: 100,
  },
  {
    position: 5,
    name: "Ha",
    type: "Ha",
    color: "#ff6b6b",
    installed: true,
    description: "Hydrogen Alpha narrowband filter",
    wavelength: 656,
    bandwidth: 7,
  },
  {
    position: 6,
    name: "OIII",
    type: "OIII",
    color: "#4ecdc4",
    installed: true,
    description: "Oxygen III narrowband filter",
    wavelength: 501,
    bandwidth: 7,
  },
  {
    position: 7,
    name: "SII",
    type: "SII",
    color: "#ffe66d",
    installed: true,
    description: "Sulfur II narrowband filter",
    wavelength: 672,
    bandwidth: 8,
  },
  {
    position: 8,
    name: "Empty",
    type: "Empty",
    color: "#666666",
    installed: false,
    description: "Empty filter slot",
  },
];

// Filter type definitions
export const FILTER_TYPES: Record<FilterType, { name: string; description: string; color: string }> = {
  L: { name: "Luminance", description: "Broadband luminance filter", color: "#ffffff" },
  R: { name: "Red", description: "Red color filter", color: "#ff0000" },
  G: { name: "Green", description: "Green color filter", color: "#00ff00" },
  B: { name: "Blue", description: "Blue color filter", color: "#0000ff" },
  Ha: { name: "Hydrogen Alpha", description: "656nm narrowband filter", color: "#ff6b6b" },
  OIII: { name: "Oxygen III", description: "501nm narrowband filter", color: "#4ecdc4" },
  SII: { name: "Sulfur II", description: "672nm narrowband filter", color: "#ffe66d" },
  Empty: { name: "Empty", description: "No filter installed", color: "#666666" },
  Custom: { name: "Custom", description: "Custom filter", color: "#9ca3af" },
};

// Default filter wheel configuration
export const DEFAULT_FILTERWHEEL_CONFIG: FilterWheelConfig = {
  maxPositions: 8,
  homePosition: 1,
  temperatureMonitoring: true,
  autoHome: true,
  movementTimeout: 30, // 30 seconds
  temperatureThreshold: 50, // 50°C
};

// Default filter wheel capabilities
export const DEFAULT_FILTERWHEEL_CAPABILITIES: FilterWheelCapabilities = {
  hasTemperatureSensor: true,
  hasPositionSensor: true,
  supportsAutoHome: true,
  maxFilters: 8,
  minTemperature: -40,
  maxTemperature: 85,
  movementSpeed: 2, // positions per second
};

// Status colors for different states
export const FILTERWHEEL_STATUS_COLORS = {
  connected: "#10b981", // green-500
  disconnected: "#ef4444", // red-500
  connecting: "#f59e0b", // amber-500
  error: "#dc2626", // red-600
  moving: "#3b82f6", // blue-500
  idle: "#6b7280", // gray-500
  homing: "#8b5cf6", // violet-500
  calibrating: "#06b6d4", // cyan-500
} as const;

// Temperature thresholds
export const TEMPERATURE_THRESHOLDS = {
  normal: { min: -10, max: 40 }, // °C
  warning: { min: -20, max: 50 }, // °C
  critical: { min: -30, max: 60 }, // °C
} as const;

// Movement timing constants
export const MOVEMENT_CONSTANTS = {
  defaultSpeed: 2, // positions per second
  accelerationTime: 0.5, // seconds
  decelerationTime: 0.5, // seconds
  settlingTime: 0.2, // seconds
  maxMovementTime: 30, // seconds
  progressUpdateInterval: 100, // milliseconds
} as const;

// Common filter wheel models
export const FILTERWHEEL_MODELS = {
  'ZWO EFW 8x1.25"': {
    maxPositions: 8,
    filterSize: '1.25"',
    manufacturer: 'ZWO',
    hasTemperatureSensor: true,
  },
  'ZWO EFW 8x2"': {
    maxPositions: 8,
    filterSize: '2"',
    manufacturer: 'ZWO',
    hasTemperatureSensor: true,
  },
  'Celestron CFW-L-8': {
    maxPositions: 8,
    filterSize: '1.25"',
    manufacturer: 'Celestron',
    hasTemperatureSensor: false,
  },
  'QHYCCD CFW3-US': {
    maxPositions: 7,
    filterSize: '1.25"',
    manufacturer: 'QHYCCD',
    hasTemperatureSensor: true,
  },
} as const;

// Quick action filter presets
export const QUICK_ACTION_FILTERS = [
  { position: 1, name: "Luminance", icon: "L" },
  { position: 2, name: "Red", icon: "R" },
  { position: 5, name: "Ha", icon: "Hα" },
  { position: 6, name: "OIII", icon: "O" },
] as const;

// Error messages
export const FILTERWHEEL_ERRORS = {
  notConnected: "Filter wheel is not connected",
  invalidPosition: "Invalid filter position",
  movementTimeout: "Filter wheel movement timed out",
  temperatureHigh: "Filter wheel temperature is too high",
  positionSensorError: "Position sensor error",
  communicationError: "Communication error with filter wheel",
  calibrationRequired: "Filter wheel calibration required",
  filterNotInstalled: "No filter installed at this position",
} as const;

// Success messages
export const FILTERWHEEL_MESSAGES = {
  connected: "Filter wheel connected successfully",
  disconnected: "Filter wheel disconnected",
  movementComplete: "Filter wheel movement completed",
  homeComplete: "Filter wheel homed successfully",
  calibrationComplete: "Filter wheel calibration completed",
} as const;

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  filterChange: 300,
  statusUpdate: 200,
  progressUpdate: 100,
  errorDisplay: 500,
} as const;

// Grid layout configurations
export const GRID_LAYOUTS = {
  compact: {
    filterSelection: "grid-cols-2",
    quickActions: "grid-cols-2",
    status: "grid-cols-1",
  },
  normal: {
    filterSelection: "grid-cols-2 lg:grid-cols-4",
    quickActions: "grid-cols-2 lg:grid-cols-4",
    status: "grid-cols-1 lg:grid-cols-3",
  },
  expanded: {
    filterSelection: "grid-cols-3 lg:grid-cols-6",
    quickActions: "grid-cols-3 lg:grid-cols-6",
    status: "grid-cols-2 lg:grid-cols-4",
  },
} as const;

// Icon mappings for filter types
export const FILTER_ICONS = {
  L: "⚪",
  R: "🔴",
  G: "🟢",
  B: "🔵",
  Ha: "🌹",
  OIII: "💎",
  SII: "🟡",
  Empty: "⚫",
  Custom: "🔘",
} as const;

// Validation constants
export const VALIDATION_RULES = {
  position: {
    min: 1,
    max: 8,
  },
  temperature: {
    min: -50,
    max: 100,
  },
  name: {
    minLength: 1,
    maxLength: 20,
  },
  type: {
    minLength: 1,
    maxLength: 10,
  },
} as const;
