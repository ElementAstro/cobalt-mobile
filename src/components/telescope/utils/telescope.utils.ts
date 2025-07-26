/**
 * Telescope/Mount utility functions
 */

import { MountStatus, SlewTarget, SlewRate, TrackingRate, Direction } from '../types/telescope.types';
import { TELESCOPE_CONSTANTS } from './telescope.constants';

/**
 * Validates Right Ascension coordinate format
 */
export function validateRA(ra: string): boolean {
  const raPattern = /^([0-1]?[0-9]|2[0-3])h\s*([0-5]?[0-9])m\s*([0-5]?[0-9](?:\.[0-9]+)?)s?$/;
  return raPattern.test(ra.trim());
}

/**
 * Validates Declination coordinate format
 */
export function validateDec(dec: string): boolean {
  const decPattern = /^[+-]?([0-8]?[0-9]|90)°\s*([0-5]?[0-9])'\s*([0-5]?[0-9](?:\.[0-9]+)?)"?$/;
  return decPattern.test(dec.trim());
}

/**
 * Validates a complete coordinate pair
 */
export function validateCoordinates(ra: string, dec: string): boolean {
  return validateRA(ra) && validateDec(dec);
}

/**
 * Validates slew target
 */
export function validateSlewTarget(target: SlewTarget): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!target.name.trim()) {
    errors.push('Target name is required');
  }

  if (!validateRA(target.ra)) {
    errors.push('Invalid Right Ascension format');
  }

  if (!validateDec(target.dec)) {
    errors.push('Invalid Declination format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Converts RA from string to decimal hours
 */
export function raToDecimalHours(ra: string): number {
  const match = ra.match(/^([0-1]?[0-9]|2[0-3])h\s*([0-5]?[0-9])m\s*([0-5]?[0-9](?:\.[0-9]+)?)s?$/);
  if (!match) throw new Error('Invalid RA format');
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseFloat(match[3]);
  
  return hours + minutes / 60 + seconds / 3600;
}

/**
 * Converts Dec from string to decimal degrees
 */
export function decToDecimalDegrees(dec: string): number {
  const match = dec.match(/^([+-]?)([0-8]?[0-9]|90)°\s*([0-5]?[0-9])'\s*([0-5]?[0-9](?:\.[0-9]+)?)"?$/);
  if (!match) throw new Error('Invalid Dec format');
  
  const sign = match[1] === '-' ? -1 : 1;
  const degrees = parseInt(match[2]);
  const minutes = parseInt(match[3]);
  const seconds = parseFloat(match[4]);
  
  return sign * (degrees + minutes / 60 + seconds / 3600);
}

/**
 * Converts decimal hours to RA string format
 */
export function decimalHoursToRA(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = ((hours - h) * 60 - m) * 60;
  
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toFixed(1).padStart(4, '0')}s`;
}

/**
 * Converts decimal degrees to Dec string format
 */
export function decimalDegreesToDec(degrees: number): string {
  const sign = degrees >= 0 ? '+' : '-';
  const absDegrees = Math.abs(degrees);
  const d = Math.floor(absDegrees);
  const m = Math.floor((absDegrees - d) * 60);
  const s = ((absDegrees - d) * 60 - m) * 60;
  
  return `${sign}${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}' ${s.toFixed(1).padStart(4, '0')}"`;
}

/**
 * Formats coordinate for display
 */
export function formatCoordinate(coordinate: string, type: 'ra' | 'dec'): string {
  if (type === 'ra') {
    return validateRA(coordinate) ? coordinate : 'Invalid RA';
  } else {
    return validateDec(coordinate) ? coordinate : 'Invalid Dec';
  }
}

/**
 * Calculates angular separation between two coordinates
 */
export function calculateAngularSeparation(
  ra1: string, dec1: string,
  ra2: string, dec2: string
): number {
  try {
    const ra1Hours = raToDecimalHours(ra1);
    const dec1Deg = decToDecimalDegrees(dec1);
    const ra2Hours = raToDecimalHours(ra2);
    const dec2Deg = decToDecimalDegrees(dec2);
    
    // Convert to radians
    const ra1Rad = ra1Hours * Math.PI / 12;
    const dec1Rad = dec1Deg * Math.PI / 180;
    const ra2Rad = ra2Hours * Math.PI / 12;
    const dec2Rad = dec2Deg * Math.PI / 180;
    
    // Haversine formula
    const deltaRA = ra2Rad - ra1Rad;
    const deltaDec = dec2Rad - dec1Rad;
    
    const a = Math.sin(deltaDec / 2) ** 2 + 
              Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.sin(deltaRA / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return c * 180 / Math.PI; // Convert back to degrees
  } catch {
    return NaN;
  }
}

/**
 * Estimates slew time based on angular separation
 */
export function estimateSlewTime(
  currentRA: string, currentDec: string,
  targetRA: string, targetDec: string,
  slewRate: SlewRate
): number {
  const separation = calculateAngularSeparation(currentRA, currentDec, targetRA, targetDec);
  if (isNaN(separation)) return TELESCOPE_CONSTANTS.DEFAULT_SLEW_DURATION;
  
  // Base time calculation (simplified)
  const rateMultipliers = {
    Guide: 0.5,
    Centering: 16,
    Find: 64,
    Max: 800
  };
  
  const baseTime = separation / rateMultipliers[slewRate] * 1000; // Convert to ms
  return Math.max(1000, Math.min(baseTime, TELESCOPE_CONSTANTS.SLEW_TIMEOUT));
}

/**
 * Gets status color for mount state
 */
export function getMountStatusColor(status: Partial<MountStatus>): string {
  if (status.slewing) return 'destructive';
  if (status.parked) return 'secondary';
  if (status.tracking) return 'default';
  if (status.aligned) return 'default';
  return 'secondary';
}

/**
 * Gets status text for mount state
 */
export function getMountStatusText(status: Partial<MountStatus>): string {
  if (status.slewing) return 'Slewing';
  if (status.parked) return 'Parked';
  if (status.tracking) return 'Tracking';
  if (status.aligned) return 'Aligned';
  return 'Idle';
}

/**
 * Validates slew rate
 */
export function validateSlewRate(rate: string): rate is SlewRate {
  return ['Guide', 'Centering', 'Find', 'Max'].includes(rate);
}

/**
 * Validates tracking rate
 */
export function validateTrackingRate(rate: string): rate is TrackingRate {
  return ['Sidereal', 'Lunar', 'Solar', 'King'].includes(rate);
}

/**
 * Validates direction for manual movement
 */
export function validateDirection(direction: string): direction is Direction {
  return ['North', 'South', 'East', 'West'].includes(direction);
}

/**
 * Formats time duration for display
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Checks if mount can perform operation
 */
export function canPerformOperation(
  operation: 'slew' | 'track' | 'guide' | 'move',
  status: MountStatus
): boolean {
  switch (operation) {
    case 'slew':
      return !status.slewing && !status.parked;
    case 'track':
      return !status.parked;
    case 'guide':
      return !status.parked && status.tracking;
    case 'move':
      return !status.parked && !status.slewing;
    default:
      return false;
  }
}
