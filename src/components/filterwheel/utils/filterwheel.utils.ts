/**
 * FilterWheel utility functions
 * Helper functions for filter wheel operations, validation, and formatting
 */

import {
  FilterInfo,
  FilterWheelStatus,
  FilterValidationResult,
  PositionValidationResult,
  MovementProgress,
  TemperatureUnit,
  ConnectionStatus,
  MovementStatus,
} from '../types/filterwheel.types';

import {
  FILTERWHEEL_STATUS_COLORS,
  TEMPERATURE_THRESHOLDS,
  MOVEMENT_CONSTANTS,
  VALIDATION_RULES,
  FILTERWHEEL_ERRORS,
} from './filterwheel.constants';

// Position validation
export function validatePosition(position: number, maxPositions: number = 8): PositionValidationResult {
  const isValid = Number.isInteger(position) && position >= 1 && position <= maxPositions;
  
  if (!isValid) {
    return {
      isValid: false,
      error: `Position must be between 1 and ${maxPositions}`,
      canMove: false,
    };
  }
  
  return {
    isValid: true,
    canMove: true,
  };
}

// Filter validation
export function validateFilter(filter: Partial<FilterInfo>): FilterValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate position
  if (filter.position !== undefined) {
    const positionResult = validatePosition(filter.position);
    if (!positionResult.isValid) {
      errors.push(positionResult.error || 'Invalid position');
    }
  }
  
  // Validate name
  if (filter.name !== undefined) {
    if (filter.name.length < VALIDATION_RULES.name.minLength) {
      errors.push('Filter name is too short');
    }
    if (filter.name.length > VALIDATION_RULES.name.maxLength) {
      errors.push('Filter name is too long');
    }
  }
  
  // Validate type
  if (filter.type !== undefined) {
    if (filter.type.length < VALIDATION_RULES.type.minLength) {
      errors.push('Filter type is too short');
    }
    if (filter.type.length > VALIDATION_RULES.type.maxLength) {
      errors.push('Filter type is too long');
    }
  }
  
  // Validate color
  if (filter.color !== undefined) {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!colorRegex.test(filter.color)) {
      errors.push('Invalid color format (use hex format like #ff0000)');
    }
  }
  
  // Validate wavelength
  if (filter.wavelength !== undefined) {
    if (filter.wavelength < 200 || filter.wavelength > 1200) {
      warnings.push('Wavelength outside typical range (200-1200nm)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Movement calculations
export function calculateMovementTime(fromPosition: number, toPosition: number): number {
  const distance = Math.abs(toPosition - fromPosition);
  const baseTime = distance / MOVEMENT_CONSTANTS.defaultSpeed;
  const totalTime = baseTime + MOVEMENT_CONSTANTS.accelerationTime + MOVEMENT_CONSTANTS.decelerationTime + MOVEMENT_CONSTANTS.settlingTime;
  
  return Math.min(totalTime, MOVEMENT_CONSTANTS.maxMovementTime);
}

export function getMovementDirection(fromPosition: number, toPosition: number): 'clockwise' | 'counterclockwise' {
  // Assuming positions are arranged in a circle
  const diff = toPosition - fromPosition;
  const maxPositions = 8; // Default max positions
  
  // Calculate shortest path
  const clockwiseDistance = diff > 0 ? diff : diff + maxPositions;
  const counterclockwiseDistance = diff < 0 ? Math.abs(diff) : maxPositions - diff;
  
  return clockwiseDistance <= counterclockwiseDistance ? 'clockwise' : 'counterclockwise';
}

export function estimateRemainingTime(progress: MovementProgress, totalTime: number): number {
  if (progress.progress >= 100) return 0;
  
  const elapsed = progress.startTime ? (Date.now() - progress.startTime.getTime()) / 1000 : 0;
  const remaining = totalTime - elapsed;
  
  return Math.max(0, remaining);
}

// Temperature utilities
export function formatTemperature(temperature: number, unit: TemperatureUnit = 'celsius'): string {
  if (unit === 'fahrenheit') {
    const fahrenheit = (temperature * 9/5) + 32;
    return `${fahrenheit.toFixed(1)}°F`;
  }
  return `${temperature.toFixed(1)}°C`;
}

export function isTemperatureNormal(temperature: number): boolean {
  return temperature >= TEMPERATURE_THRESHOLDS.normal.min && 
         temperature <= TEMPERATURE_THRESHOLDS.normal.max;
}

export function getTemperatureStatus(temperature: number): 'normal' | 'warning' | 'critical' {
  if (temperature >= TEMPERATURE_THRESHOLDS.critical.min && 
      temperature <= TEMPERATURE_THRESHOLDS.critical.max) {
    if (temperature >= TEMPERATURE_THRESHOLDS.warning.min && 
        temperature <= TEMPERATURE_THRESHOLDS.warning.max) {
      if (temperature >= TEMPERATURE_THRESHOLDS.normal.min && 
          temperature <= TEMPERATURE_THRESHOLDS.normal.max) {
        return 'normal';
      }
      return 'warning';
    }
    return 'warning';
  }
  return 'critical';
}

// Status utilities
export function getStatusColor(status: ConnectionStatus | MovementStatus): string {
  return FILTERWHEEL_STATUS_COLORS[status] || FILTERWHEEL_STATUS_COLORS.idle;
}

export function getConnectionStatusText(connected: boolean): string {
  return connected ? 'Connected' : 'Disconnected';
}

export function canPerformMovement(status: FilterWheelStatus): boolean {
  return status.connected && !status.moving;
}

// Filter utilities
export function getFilterByPosition(filters: FilterInfo[], position: number): FilterInfo | undefined {
  return filters.find(filter => filter.position === position);
}

export function getInstalledFilters(filters: FilterInfo[]): FilterInfo[] {
  return filters.filter(filter => filter.installed);
}

export function getAvailablePositions(filters: FilterInfo[]): number[] {
  return filters
    .filter(filter => filter.installed)
    .map(filter => filter.position)
    .sort((a, b) => a - b);
}

export function getEmptyPositions(filters: FilterInfo[]): number[] {
  return filters
    .filter(filter => !filter.installed)
    .map(filter => filter.position)
    .sort((a, b) => a - b);
}

// Progress utilities
export function createMovementProgress(startTime?: Date): MovementProgress {
  return {
    progress: 0,
    startTime: startTime || new Date(),
    estimatedTimeRemaining: undefined,
    endTime: undefined,
  };
}

export function updateMovementProgress(
  current: MovementProgress,
  newProgress: number,
  totalTime?: number
): MovementProgress {
  const updated: MovementProgress = {
    ...current,
    progress: Math.min(100, Math.max(0, newProgress)),
  };
  
  if (totalTime && current.startTime) {
    updated.estimatedTimeRemaining = estimateRemainingTime(updated, totalTime);
  }
  
  if (updated.progress >= 100) {
    updated.endTime = new Date();
    updated.estimatedTimeRemaining = 0;
  }
  
  return updated;
}

// Formatting utilities
export function formatFilterName(filter: FilterInfo): string {
  return filter.name || `Position ${filter.position}`;
}

export function formatFilterType(filter: FilterInfo): string {
  return filter.type || 'Unknown';
}

export function formatPosition(position: number): string {
  return `Position ${position}`;
}

export function formatMovementStatus(isMoving: boolean, currentPosition: number, targetPosition?: number): string {
  if (!isMoving) {
    return `At position ${currentPosition}`;
  }
  
  if (targetPosition) {
    return `Moving to position ${targetPosition}`;
  }
  
  return 'Moving...';
}

// Error handling utilities
export function getErrorMessage(errorCode: keyof typeof FILTERWHEEL_ERRORS): string {
  return FILTERWHEEL_ERRORS[errorCode] || 'Unknown error occurred';
}

export function isValidErrorCode(code: string): code is keyof typeof FILTERWHEEL_ERRORS {
  return code in FILTERWHEEL_ERRORS;
}

// Comparison utilities
export function compareFilters(a: FilterInfo, b: FilterInfo): number {
  return a.position - b.position;
}

export function areFiltersEqual(a: FilterInfo, b: FilterInfo): boolean {
  return a.position === b.position &&
         a.name === b.name &&
         a.type === b.type &&
         a.color === b.color &&
         a.installed === b.installed;
}

// Array utilities
export function sortFiltersByPosition(filters: FilterInfo[]): FilterInfo[] {
  return [...filters].sort(compareFilters);
}

export function groupFiltersByType(filters: FilterInfo[]): Record<string, FilterInfo[]> {
  return filters.reduce((groups, filter) => {
    const type = filter.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(filter);
    return groups;
  }, {} as Record<string, FilterInfo[]>);
}

// Debounce utility for frequent updates
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
