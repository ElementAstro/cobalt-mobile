/**
 * Telescope module exports
 * Provides clean imports for all telescope-related components, hooks, types, and utilities
 */

// Main Components
export { default as TelescopeControl } from './components/telescope-control';
export { default as TelescopeDetailPage } from './components/telescope-detail-page';

// Sub Components
export { default as MountStatusComponent } from './components/mount-status';
export { default as SlewControl } from './components/slew-control';
export { default as ManualControl } from './components/manual-control';
export { default as MountControl } from './components/mount-control';

// Hooks
export { useTelescope } from './hooks/use-telescope';
export { useSlewControl } from './hooks/use-slew-control';
export { useMount } from './hooks/use-mount';

// Types
export type {
  MountStatus,
  SlewTarget,
  TelescopeTarget,
  MountCapabilities,
  MountInfo,
  CoordinateSystem,
  SlewProgress,
  GuidingStatus,
  AlignmentStatus,
  SlewRate,
  TrackingRate,
  MountType,
  ConnectionStatus,
  Direction,
  MountActions,
  TelescopeState,
  TelescopeControlProps,
  TelescopeDetailPageProps,
} from './types/telescope.types';

// Constants
export {
  TELESCOPE_CONSTANTS,
  SLEW_RATES,
  SLEW_RATE_DESCRIPTIONS,
  TRACKING_RATES,
  TRACKING_RATE_DESCRIPTIONS,
  COMMON_TARGETS,
  MOUNT_STATUS_COLORS,
  TELESCOPE_ICONS,
  DEFAULT_MOUNT_STATUS,
  DEFAULT_SLEW_TARGET,
} from './utils/telescope.constants';

// Utilities
export {
  validateRA,
  validateDec,
  validateCoordinates,
  validateSlewTarget,
  raToDecimalHours,
  decToDecimalDegrees,
  decimalHoursToRA,
  decimalDegreesToDec,
  formatCoordinate,
  calculateAngularSeparation,
  estimateSlewTime,
  getMountStatusColor,
  getMountStatusText,
  validateSlewRate,
  validateTrackingRate,
  validateDirection,
  formatDuration,
  canPerformOperation,
} from './utils/telescope.utils';
