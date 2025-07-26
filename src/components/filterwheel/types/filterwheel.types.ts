/**
 * FilterWheel TypeScript type definitions
 * Comprehensive types for filter wheel functionality
 */

import { CurrentPage } from "@/lib/store";

// Core filter information
export interface FilterInfo {
  position: number;
  name: string;
  type: string;
  color: string;
  installed: boolean;
  description?: string;
  manufacturer?: string;
  model?: string;
  wavelength?: number; // in nanometers
  bandwidth?: number; // in nanometers
}

// Filter wheel status
export interface FilterWheelStatus {
  currentPosition: number;
  targetPosition: number;
  moving: boolean;
  connected: boolean;
  temperature: number;
  maxPositions?: number;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
}

// Movement progress tracking
export interface MovementProgress {
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // in seconds
  startTime?: Date;
  endTime?: Date;
}

// Filter wheel configuration
export interface FilterWheelConfig {
  maxPositions: number;
  homePosition: number;
  temperatureMonitoring: boolean;
  autoHome: boolean;
  movementTimeout: number; // in seconds
  temperatureThreshold: number; // in celsius
}

// Filter wheel capabilities
export interface FilterWheelCapabilities {
  hasTemperatureSensor: boolean;
  hasPositionSensor: boolean;
  supportsAutoHome: boolean;
  maxFilters: number;
  minTemperature: number;
  maxTemperature: number;
  movementSpeed: number; // positions per second
}

// Filter wheel actions/operations
export interface FilterWheelActions {
  moveToPosition: (position: number) => Promise<void>;
  homeFilterWheel: () => Promise<void>;
  stopMovement: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  calibrate: () => Promise<void>;
}

// Filter wheel state for store
export interface FilterWheelState {
  status: FilterWheelStatus;
  filters: FilterInfo[];
  moveProgress: MovementProgress;
  config: FilterWheelConfig;
  capabilities: FilterWheelCapabilities;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Filter wheel events
export type FilterWheelEvent = 
  | 'position-changed'
  | 'movement-started'
  | 'movement-completed'
  | 'movement-failed'
  | 'temperature-changed'
  | 'connection-changed'
  | 'error-occurred';

export interface FilterWheelEventData {
  event: FilterWheelEvent;
  timestamp: Date;
  data?: Record<string, unknown>;
  position?: number;
  temperature?: number;
  error?: string;
}

// Filter wheel component props
export interface FilterWheelControlProps {
  className?: string;
  showTemperature?: boolean;
  showProgress?: boolean;
  compactMode?: boolean;
  onPositionChange?: (position: number) => void;
  onError?: (error: string) => void;
}

export interface FilterWheelDetailPageProps {
  onBack: () => void;
  onSwipeNavigate?: (page: CurrentPage) => void;
  currentPage?: CurrentPage;
  className?: string;
}

export interface FilterSelectionProps {
  filters: FilterInfo[];
  currentPosition: number;
  targetPosition: number;
  isMoving: boolean;
  onFilterSelect: (position: number) => void;
  disabled?: boolean;
  compactMode?: boolean;
  className?: string;
}

export interface FilterWheelStatusProps {
  status: FilterWheelStatus;
  currentFilter?: FilterInfo;
  targetFilter?: FilterInfo;
  moveProgress?: MovementProgress;
  showTemperature?: boolean;
  showConnection?: boolean;
  className?: string;
}

export interface QuickActionsProps {
  onHome: () => void;
  onFilterSelect: (position: number) => void;
  currentPosition: number;
  isMoving: boolean;
  disabled?: boolean;
  className?: string;
}

export interface FilterListProps {
  filters: FilterInfo[];
  currentPosition: number;
  onFilterSelect?: (position: number) => void;
  showActions?: boolean;
  className?: string;
}

// Validation types
export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PositionValidationResult {
  isValid: boolean;
  error?: string;
  canMove: boolean;
}

// Constants types
export type FilterType = 'L' | 'R' | 'G' | 'B' | 'Ha' | 'OIII' | 'SII' | 'Empty' | 'Custom';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export type MovementStatus = 'idle' | 'moving' | 'homing' | 'calibrating' | 'error';

// Utility types
export type FilterPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type TemperatureUnit = 'celsius' | 'fahrenheit';

// Hook return types
export interface UseFilterWheelReturn {
  // State
  status: FilterWheelStatus;
  filters: FilterInfo[];
  moveProgress: MovementProgress;
  currentFilter: FilterInfo | undefined;
  targetFilter: FilterInfo | undefined;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  moveToPosition: (position: number) => Promise<void>;
  homeFilterWheel: () => Promise<void>;
  stopMovement: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  
  // Utilities
  canMoveToPosition: (position: number) => boolean;
  getFilterByPosition: (position: number) => FilterInfo | undefined;
  getInstalledFilters: () => FilterInfo[];
  isPositionValid: (position: number) => boolean;
}

export interface UseFilterWheelMovementReturn {
  // Movement state
  isMoving: boolean;
  progress: MovementProgress;
  canMove: boolean;
  
  // Movement actions
  moveToPosition: (position: number) => Promise<void>;
  stopMovement: () => Promise<void>;
  homeFilterWheel: () => Promise<void>;
  
  // Movement utilities
  estimateMovementTime: (fromPosition: number, toPosition: number) => number;
  getMovementDirection: (fromPosition: number, toPosition: number) => 'clockwise' | 'counterclockwise';
}

export interface UseFilterWheelStatusReturn {
  // Status state
  status: FilterWheelStatus;
  isConnected: boolean;
  temperature: number;
  
  // Status actions
  refreshStatus: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Status utilities
  getStatusColor: () => string;
  getConnectionStatusText: () => string;
  isTemperatureNormal: () => boolean;
  getFormattedTemperature: () => string;
  getTemperatureStatus: () => string;
  getDetailedStatus: () => {
    connection: {
      status: 'connected' | 'disconnected' | 'connecting' | 'error';
      text: string;
      color: string;
    };
    temperature: {
      value: number;
      formatted: string;
      status: 'normal' | 'warning' | 'critical';
      isNormal: boolean;
    };
    position: {
      current: number;
      target: number | null;
      isMoving: boolean;
    };
  };
}
