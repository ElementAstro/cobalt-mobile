/**
 * Focuser utility functions
 */

import { 
  // FocuserStatus, // Unused for now
  AutoFocusSample, 
  FocusCurve, 
  TemperatureUnit,
  AutoFocusConfig,
  FocuserConfig,
  FocuserError
} from '../types/focuser.types';
import { 
  MOVEMENT_CONSTRAINTS, 
  AUTOFOCUS_CONSTRAINTS, 
  // TEMPERATURE_COMPENSATION, // Unused for now
  CURVE_FITTING,
  FOCUSER_ERROR_CODES,
  FOCUSER_ERROR_MESSAGES,
  VALIDATION_PATTERNS
} from './focuser.constants';

// Position validation
export function validatePosition(position: number, maxPosition: number = MOVEMENT_CONSTRAINTS.MAX_POSITION): boolean {
  return position >= MOVEMENT_CONSTRAINTS.MIN_POSITION && position <= maxPosition;
}

// Step size validation
export function validateStepSize(stepSize: number): boolean {
  return stepSize >= MOVEMENT_CONSTRAINTS.MIN_STEP_SIZE && stepSize <= MOVEMENT_CONSTRAINTS.MAX_STEP_SIZE;
}

// Temperature validation
export function validateTemperature(temperature: number): boolean {
  return temperature >= -50 && temperature <= 100; // Reasonable range for focuser temperatures
}

// Auto focus configuration validation
export function validateAutoFocusConfig(config: Partial<AutoFocusConfig>): boolean {
  if (config.exposureTime && (config.exposureTime < AUTOFOCUS_CONSTRAINTS.MIN_EXPOSURE || config.exposureTime > AUTOFOCUS_CONSTRAINTS.MAX_EXPOSURE)) {
    return false;
  }
  if (config.maxSteps && (config.maxSteps < AUTOFOCUS_CONSTRAINTS.MIN_STEPS || config.maxSteps > AUTOFOCUS_CONSTRAINTS.MAX_STEPS)) {
    return false;
  }
  if (config.tolerance && (config.tolerance < AUTOFOCUS_CONSTRAINTS.MIN_TOLERANCE || config.tolerance > AUTOFOCUS_CONSTRAINTS.MAX_TOLERANCE)) {
    return false;
  }
  return true;
}

// Focuser configuration validation
export function validateFocuserConfig(config: Partial<FocuserConfig>): boolean {
  if (config.stepSize && !validateStepSize(config.stepSize)) {
    return false;
  }
  if (config.maxPosition && config.maxPosition <= 0) {
    return false;
  }
  if (config.speed && (config.speed < MOVEMENT_CONSTRAINTS.MIN_SPEED || config.speed > MOVEMENT_CONSTRAINTS.MAX_SPEED)) {
    return false;
  }
  return true;
}

// Format position with thousands separator
export function formatPosition(position: number): string {
  return position.toLocaleString();
}

// Format temperature with unit
export function formatTemperature(temperature: number, unit: TemperatureUnit = 'celsius'): string {
  const symbol = unit === 'celsius' ? '°C' : '°F';
  const value = unit === 'celsius' ? temperature : (temperature * 9/5) + 32;
  return `${value.toFixed(1)}${symbol}`;
}

// Format HFR value
export function formatHfr(hfr: number): string {
  return hfr.toFixed(2);
}

// Format exposure time
export function formatExposureTime(seconds: number): string {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`;
  }
  return `${seconds.toFixed(1)}s`;
}

// Calculate movement time estimate
export function estimateMovementTime(fromPosition: number, toPosition: number, speed: number = 50): number {
  const distance = Math.abs(toPosition - fromPosition);
  const baseTime = distance / 1000; // Base time in seconds
  const speedFactor = 100 / speed; // Speed adjustment
  return baseTime * speedFactor;
}

// Calculate steps between positions
export function calculateSteps(fromPosition: number, toPosition: number): number {
  return Math.abs(toPosition - fromPosition);
}

// Calculate temperature compensation adjustment
export function calculateTemperatureCompensation(
  currentTemp: number, 
  referenceTemp: number, 
  coefficient: number
): number {
  const tempDiff = currentTemp - referenceTemp;
  return Math.round(tempDiff * coefficient);
}

// Analyze focus curve from samples
export function analyzeFocusCurve(samples: AutoFocusSample[]): FocusCurve | null {
  if (samples.length < CURVE_FITTING.MIN_SAMPLES) {
    return null;
  }

  // Sort samples by position
  const sortedSamples = [...samples].sort((a, b) => a.position - b.position);
  
  // Find minimum HFR
  const bestSample = sortedSamples.reduce((best, current) => 
    current.hfr < best.hfr ? current : best
  );

  // Calculate basic statistics
  // const positions = sortedSamples.map(s => s.position); // Unused for now
  const hfrValues = sortedSamples.map(s => s.hfr);
  
  // const minPosition = Math.min(...positions); // Unused for now
  // const maxPosition = Math.max(...positions); // Unused for now
  const minHfr = Math.min(...hfrValues);
  // const maxHfr = Math.max(...hfrValues); // Unused for now

  // Simple curve analysis (could be enhanced with proper curve fitting)
  const leftSamples = sortedSamples.filter(s => s.position < bestSample.position);
  const rightSamples = sortedSamples.filter(s => s.position > bestSample.position);

  const leftSlope = leftSamples.length > 1 ? calculateSlope(leftSamples) : 0;
  const rightSlope = rightSamples.length > 1 ? calculateSlope(rightSamples) : 0;

  // Calculate R² (simplified)
  const r2 = calculateR2(sortedSamples, bestSample);

  const isValid = r2 >= CURVE_FITTING.MIN_R2;
  const confidence = Math.min(r2, 1.0);

  return {
    samples: sortedSamples,
    bestPosition: bestSample.position,
    bestHfr: bestSample.hfr,
    leftSlope,
    rightSlope,
    minimum: minHfr,
    r2,
    isValid,
    confidence,
  };
}

// Calculate slope for a set of samples
function calculateSlope(samples: AutoFocusSample[]): number {
  if (samples.length < 2) return 0;
  
  const first = samples[0];
  const last = samples[samples.length - 1];
  
  return (last.hfr - first.hfr) / (last.position - first.position);
}

// Calculate R² coefficient (simplified)
function calculateR2(samples: AutoFocusSample[], bestSample: AutoFocusSample): number {
  if (samples.length < 3) return 0;
  
  const meanHfr = samples.reduce((sum, s) => sum + s.hfr, 0) / samples.length;
  
  let ssRes = 0;
  let ssTot = 0;
  
  for (const sample of samples) {
    // Simple parabolic model around best position
    const predicted = bestSample.hfr + Math.pow(sample.position - bestSample.position, 2) * 0.0001;
    ssRes += Math.pow(sample.hfr - predicted, 2);
    ssTot += Math.pow(sample.hfr - meanHfr, 2);
  }
  
  return ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
}

// Get focus curve statistics
export function getFocusCurveStatistics(samples: AutoFocusSample[]) {
  if (samples.length === 0) {
    return {
      minHfr: 0,
      maxHfr: 0,
      range: 0,
      sampleCount: 0,
    };
  }

  const hfrValues = samples.map(s => s.hfr);
  const positions = samples.map(s => s.position);
  
  return {
    minHfr: Math.min(...hfrValues),
    maxHfr: Math.max(...hfrValues),
    range: Math.max(...positions) - Math.min(...positions),
    sampleCount: samples.length,
  };
}

// Create focuser error
export function createFocuserError(code: keyof typeof FOCUSER_ERROR_CODES, context?: Record<string, unknown>): FocuserError {
  return {
    code,
    message: (FOCUSER_ERROR_MESSAGES as any)[code] || 'Unknown focuser error',
    timestamp: new Date(),
    context,
  };
}

// Check if position is within tolerance
export function isPositionWithinTolerance(current: number, target: number, tolerance: number = MOVEMENT_CONSTRAINTS.POSITION_TOLERANCE): boolean {
  return Math.abs(current - target) <= tolerance;
}

// Validate input using patterns
export function validateInput(value: string, type: keyof typeof VALIDATION_PATTERNS): boolean {
  return VALIDATION_PATTERNS[type].test(value);
}

// Calculate auto focus progress
export function calculateAutoFocusProgress(currentStep: number, totalSteps: number): number {
  return Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));
}

// Generate auto focus sample positions
export function generateAutoFocusPositions(
  startPosition: number, 
  stepSize: number, 
  maxSteps: number
): number[] {
  const positions: number[] = [];
  const halfSteps = Math.floor(maxSteps / 2);
  
  for (let i = -halfSteps; i <= halfSteps; i++) {
    positions.push(startPosition + (i * stepSize));
  }
  
  return positions.filter(pos => pos >= 0);
}

// Check if focuser can move to position
export function canMoveToPosition(
  currentPosition: number, 
  targetPosition: number, 
  maxPosition: number,
  isMoving: boolean
): boolean {
  if (isMoving) return false;
  if (!validatePosition(targetPosition, maxPosition)) return false;
  if (currentPosition === targetPosition) return false;
  return true;
}

// Format movement duration
export function formatMovementDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(0)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}
