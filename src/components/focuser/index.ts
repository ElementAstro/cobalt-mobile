/**
 * Focuser module exports
 * Provides clean imports for all focuser-related components, hooks, types, and utilities
 */

// Main Components
export { default as FocuserControl } from './components/focuser-control';
export { default as FocuserDetailPage } from './components/focuser-detail-page';

// Sub Components
export { default as FocuserStatusComponent } from './components/focuser-status';
export { default as ManualControls } from './components/manual-controls';
export { default as AutoFocusControls } from './components/autofocus-controls';
export { default as FocusCurveComponent } from './components/focus-curve';

// Hooks
export { useFocuser } from './hooks/use-focuser';
export { useAutoFocus } from './hooks/use-autofocus';
export { useFocuserControls } from './hooks/use-focuser-controls';

// Types
export type {
  FocuserStatus,
  AutoFocusSample,
  AutoFocusConfig,
  AutoFocusData,
  MovementProgress,
  FocuserCapabilities,
  FocuserConfig,
  FocuserActions,
  FocuserState,
  FocusCurve,
  TemperatureCompensation,
  FocuserDirection,
  ConnectionStatus,
  MovementStatus,
  AutoFocusAlgorithm,
  AutoFocusStatus,
  StepSize,
  TemperatureUnit,
  UseFocuserReturn,
  UseAutoFocusReturn,
  FocuserEvent,
  FocuserError,
} from './types/focuser.types';

// Constants
export {
  DEFAULT_FOCUSER_CONFIG,
  DEFAULT_FOCUSER_CAPABILITIES,
  DEFAULT_AUTOFOCUS_CONFIG,
  STEP_SIZES,
  AUTOFOCUS_ALGORITHMS,
  FOCUSER_MODELS,
  FOCUSER_STATUS_COLORS,
  FOCUSER_ICONS,
  MOVEMENT_CONSTRAINTS,
  AUTOFOCUS_CONSTRAINTS,
  TEMPERATURE_COMPENSATION,
  CURVE_FITTING,
  FOCUSER_ERROR_CODES,
  FOCUSER_ERROR_MESSAGES,
  UI_CONSTANTS,
  VALIDATION_PATTERNS,
} from './utils/focuser.constants';

// Utilities
export {
  validatePosition,
  validateStepSize,
  validateTemperature,
  validateAutoFocusConfig,
  validateFocuserConfig,
  formatPosition,
  formatTemperature,
  formatHfr,
  formatExposureTime,
  estimateMovementTime,
  calculateSteps,
  calculateTemperatureCompensation,
  analyzeFocusCurve,
  getFocusCurveStatistics,
  createFocuserError,
  isPositionWithinTolerance,
  validateInput,
  calculateAutoFocusProgress,
  generateAutoFocusPositions,
  canMoveToPosition,
  formatMovementDuration,
} from './utils/focuser.utils';
