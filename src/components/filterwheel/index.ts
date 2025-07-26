/**
 * FilterWheel module exports
 * Provides clean imports for all filter wheel-related components, hooks, types, and utilities
 */

// Main Components
export { default as FilterWheelControl } from './components/filterwheel-control';
export { default as FilterWheelDetailPage } from './components/filterwheel-detail-page';

// Sub Components
export { default as FilterWheelStatusComponent } from './components/filterwheel-status';
export { default as FilterSelection } from './components/filter-selection';
export { default as QuickActions } from './components/quick-actions';
export { default as FilterList } from './components/filter-list';

// Hooks
export { useFilterWheel } from './hooks/use-filterwheel';
export { useFilterWheelMovement } from './hooks/use-filterwheel-movement';
export { useFilterWheelStatus } from './hooks/use-filterwheel-status';

// Types
export type {
  FilterInfo,
  FilterWheelStatus,
  MovementProgress,
  FilterWheelConfig,
  FilterWheelCapabilities,
  FilterWheelActions,
  FilterWheelState,
  FilterWheelEvent,
  FilterWheelEventData,
  FilterWheelControlProps,
  FilterWheelDetailPageProps,
  FilterSelectionProps,
  FilterWheelStatusProps,
  QuickActionsProps,
  FilterListProps,
  FilterValidationResult,
  PositionValidationResult,
  UseFilterWheelReturn,
  UseFilterWheelMovementReturn,
  UseFilterWheelStatusReturn,
  FilterType,
  ConnectionStatus,
  MovementStatus,
  FilterPosition,
  TemperatureUnit,
} from './types/filterwheel.types';

// Constants
export {
  DEFAULT_FILTERS,
  FILTER_TYPES,
  DEFAULT_FILTERWHEEL_CONFIG,
  DEFAULT_FILTERWHEEL_CAPABILITIES,
  FILTERWHEEL_STATUS_COLORS,
  TEMPERATURE_THRESHOLDS,
  MOVEMENT_CONSTANTS,
  FILTERWHEEL_MODELS,
  QUICK_ACTION_FILTERS,
  FILTERWHEEL_ERRORS,
  FILTERWHEEL_MESSAGES,
  ANIMATION_DURATIONS,
  GRID_LAYOUTS,
  FILTER_ICONS,
  VALIDATION_RULES,
} from './utils/filterwheel.constants';

// Utilities
export {
  validatePosition,
  validateFilter,
  calculateMovementTime,
  getMovementDirection,
  estimateRemainingTime,
  formatTemperature,
  isTemperatureNormal,
  getTemperatureStatus,
  getStatusColor,
  getConnectionStatusText,
  canPerformMovement,
  getFilterByPosition,
  getInstalledFilters,
  getAvailablePositions,
  getEmptyPositions,
  createMovementProgress,
  updateMovementProgress,
  formatFilterName,
  formatFilterType,
  formatPosition,
  formatMovementStatus,
  getErrorMessage,
  isValidErrorCode,
  compareFilters,
  areFiltersEqual,
  sortFiltersByPosition,
  groupFiltersByType,
  debounce,
} from './utils/filterwheel.utils';
