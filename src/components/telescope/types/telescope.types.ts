/**
 * Telescope/Mount-related types and interfaces
 */

export interface MountStatus {
  ra: string;
  dec: string;
  alt: string;
  az: string;
  tracking: boolean;
  slewing: boolean;
  parked: boolean;
  aligned: boolean;
  guiding: boolean;
}

export interface SlewTarget {
  ra: string;
  dec: string;
  name: string;
}

export interface TelescopeTarget {
  name: string;
  ra: string;
  dec: string;
  type?: 'galaxy' | 'nebula' | 'cluster' | 'star' | 'planet' | 'other';
  magnitude?: number;
  constellation?: string;
  description?: string;
}

export interface MountCapabilities {
  canSlew: boolean;
  canTrack: boolean;
  canPark: boolean;
  canGuide: boolean;
  canSync: boolean;
  canAbort: boolean;
  hasDirectionalControl: boolean;
  supportedSlewRates: SlewRate[];
  supportedTrackingRates: TrackingRate[];
}

export interface MountInfo {
  name: string;
  model: string;
  driverVersion?: string;
  firmwareVersion?: string;
  serialNumber?: string;
  manufacturer?: string;
}

export interface CoordinateSystem {
  ra: string;
  dec: string;
  alt?: string;
  az?: string;
  epoch?: string;
}

export interface SlewProgress {
  isSlewing: boolean;
  progress: number;
  estimatedTimeRemaining?: number;
  targetReached: boolean;
}

export interface GuidingStatus {
  isGuiding: boolean;
  rmsError: number;
  raError: number;
  decError: number;
  corrections: number;
  lastCorrection?: Date;
}

export interface AlignmentStatus {
  isAligned: boolean;
  alignmentMethod?: 'polar' | 'star' | 'plate-solving';
  alignmentStars: number;
  polarError?: number;
  lastAlignment?: Date;
}

export type SlewRate = 'Guide' | 'Centering' | 'Find' | 'Max';
export type TrackingRate = 'Sidereal' | 'Lunar' | 'Solar' | 'King';
export type MountType = 'equatorial' | 'altazimuth' | 'dobsonian';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error';
export type Direction = 'North' | 'South' | 'East' | 'West';

export interface MountActions {
  setMountStatus: (status: Partial<MountStatus>) => void;
  setSlewTarget: (target: Partial<SlewTarget>) => void;
  setSlewRate: (rate: SlewRate) => void;
  setTrackingRate: (rate: TrackingRate) => void;
  startSlew: () => void;
  abortSlew: () => void;
  parkMount: () => void;
  unparkMount: () => void;
  enableTracking: (enabled: boolean) => void;
  enableGuiding: (enabled: boolean) => void;
  moveDirection: (direction: Direction) => void;
  syncToTarget: () => void;
  goToHome: () => void;
}

export interface TelescopeState extends MountStatus, MountActions {
  slewTarget: SlewTarget;
  slewRate: SlewRate;
  trackingRate: TrackingRate;
  mountInfo: MountInfo;
  capabilities: MountCapabilities;
  slewProgress: SlewProgress;
  guidingStatus: GuidingStatus;
  alignmentStatus: AlignmentStatus;
}

export interface TelescopeControlProps {
  className?: string;
  showAdvanced?: boolean;
  compactMode?: boolean;
}

import { CurrentPage } from '@/lib/store';

export interface TelescopeDetailPageProps {
  onBack: () => void;
  onSwipeNavigate?: (page: CurrentPage) => void;
  currentPage?: CurrentPage;
}
