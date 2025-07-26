/**
 * Telescope/Mount constants and configuration
 */

import { SlewRate, TrackingRate, TelescopeTarget } from '../types/telescope.types';

export const TELESCOPE_CONSTANTS = {
  // Slew timeout (in milliseconds)
  SLEW_TIMEOUT: 30000,
  DEFAULT_SLEW_DURATION: 3000,
  
  // Coordinate precision
  RA_PRECISION: 3, // decimal places for RA
  DEC_PRECISION: 2, // decimal places for Dec
  
  // Movement timeouts
  DIRECTIONAL_MOVE_TIMEOUT: 100,
  TRACKING_UPDATE_INTERVAL: 1000,
  
  // Default values
  DEFAULT_SLEW_RATE: 'Guide' as SlewRate,
  DEFAULT_TRACKING_RATE: 'Sidereal' as TrackingRate,
  
  // Limits
  MAX_SLEW_ATTEMPTS: 3,
  MIN_ALTITUDE: -90,
  MAX_ALTITUDE: 90,
} as const;

export const SLEW_RATES: readonly SlewRate[] = [
  'Guide',
  'Centering', 
  'Find',
  'Max'
] as const;

export const SLEW_RATE_DESCRIPTIONS = {
  Guide: 'Guide (0.5x)',
  Centering: 'Centering (16x)',
  Find: 'Find (64x)',
  Max: 'Max (800x)',
} as const;

export const TRACKING_RATES: readonly TrackingRate[] = [
  'Sidereal',
  'Lunar',
  'Solar', 
  'King'
] as const;

export const TRACKING_RATE_DESCRIPTIONS = {
  Sidereal: 'Sidereal (23h 56m 4s)',
  Lunar: 'Lunar (24h 50m 28s)',
  Solar: 'Solar (24h 00m 00s)',
  King: 'King (23h 56m 27s)',
} as const;

export const COMMON_TARGETS: readonly TelescopeTarget[] = [
  {
    name: 'M31 - Andromeda Galaxy',
    ra: '00h 42m 44s',
    dec: '+41° 16\' 09"',
    type: 'galaxy',
    magnitude: 3.4,
    constellation: 'Andromeda',
    description: 'The nearest major galaxy to the Milky Way'
  },
  {
    name: 'M42 - Orion Nebula',
    ra: '05h 35m 17s',
    dec: '-05° 23\' 14"',
    type: 'nebula',
    magnitude: 4.0,
    constellation: 'Orion',
    description: 'A stellar nursery in the constellation Orion'
  },
  {
    name: 'M45 - Pleiades',
    ra: '03h 47m 29s',
    dec: '+24° 07\' 00"',
    type: 'cluster',
    magnitude: 1.6,
    constellation: 'Taurus',
    description: 'The Seven Sisters open star cluster'
  },
  {
    name: 'M13 - Hercules Cluster',
    ra: '16h 41m 41s',
    dec: '+36° 27\' 37"',
    type: 'cluster',
    magnitude: 5.8,
    constellation: 'Hercules',
    description: 'Great globular cluster in Hercules'
  },
  {
    name: 'M57 - Ring Nebula',
    ra: '18h 53m 35s',
    dec: '+33° 01\' 45"',
    type: 'nebula',
    magnitude: 8.8,
    constellation: 'Lyra',
    description: 'Famous planetary nebula in Lyra'
  },
  {
    name: 'M27 - Dumbbell Nebula',
    ra: '19h 59m 36s',
    dec: '+22° 43\' 16"',
    type: 'nebula',
    magnitude: 7.5,
    constellation: 'Vulpecula',
    description: 'Bright planetary nebula'
  },
  {
    name: 'M51 - Whirlpool Galaxy',
    ra: '13h 29m 53s',
    dec: '+47° 11\' 43"',
    type: 'galaxy',
    magnitude: 8.4,
    constellation: 'Canes Venatici',
    description: 'Classic spiral galaxy with companion'
  },
  {
    name: 'M81 - Bode\'s Galaxy',
    ra: '09h 55m 33s',
    dec: '+69° 03\' 55"',
    type: 'galaxy',
    magnitude: 6.9,
    constellation: 'Ursa Major',
    description: 'Bright spiral galaxy in Ursa Major'
  }
] as const;

export const MOUNT_STATUS_COLORS = {
  connected: 'bg-green-500',
  disconnected: 'bg-gray-500',
  error: 'bg-red-500',
  tracking: 'bg-blue-500',
  slewing: 'bg-yellow-500',
  parked: 'bg-orange-500',
  aligned: 'bg-green-500',
  guiding: 'bg-purple-500',
} as const;

export const TELESCOPE_ICONS = {
  telescope: 'Telescope',
  mount: 'Compass',
  slew: 'Navigation',
  target: 'Target',
  park: 'Home',
  abort: 'Square',
  tracking: 'RotateCcw',
  manual: 'Crosshair',
  north: 'ArrowUp',
  south: 'ArrowDown',
  east: 'ArrowRight',
  west: 'ArrowLeft',
  home: 'Home',
} as const;

export const DEFAULT_MOUNT_STATUS = {
  ra: '00h 00m 00s',
  dec: '+00° 00\' 00"',
  alt: '00° 00\' 00"',
  az: '000° 00\' 00"',
  tracking: false,
  slewing: false,
  parked: true,
  aligned: false,
  guiding: false,
} as const;

export const DEFAULT_SLEW_TARGET = {
  ra: '00h 00m 00s',
  dec: '+00° 00\' 00"',
  name: 'Custom Target',
} as const;
