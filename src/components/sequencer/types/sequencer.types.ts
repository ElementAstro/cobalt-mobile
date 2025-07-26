// Core sequence types
export type SequenceStepType = 
  | "capture" 
  | "filter" 
  | "focus" 
  | "slew" 
  | "wait" 
  | "calibration"
  | "dither"
  | "meridian_flip"
  | "condition"
  | "loop";

export type SequenceStatus = 
  | "idle" 
  | "running" 
  | "paused" 
  | "completed" 
  | "error" 
  | "cancelled";

export type StepStatus = 
  | "pending" 
  | "running" 
  | "completed" 
  | "failed" 
  | "skipped" 
  | "cancelled";

// Equipment settings interfaces
export interface CaptureSettings {
  exposure: number;
  count: number;
  binning: "1x1" | "2x2" | "3x3" | "4x4";
  gain?: number;
  offset?: number;
  temperature?: number;
  frameType: "light" | "dark" | "flat" | "bias";
  filter?: string;
  dither?: boolean;
  ditherPixels?: number;
}

export interface FilterSettings {
  position: number;
  name?: string;
  waitTime?: number;
}

export interface FocusSettings {
  type: "auto" | "manual" | "relative";
  position?: number;
  tolerance?: number;
  maxAttempts?: number;
  useTemperatureCompensation?: boolean;
}

export interface SlewSettings {
  ra: string;
  dec: string;
  targetName?: string;
  platesolve?: boolean;
  centerTarget?: boolean;
  rotatorAngle?: number;
}

export interface WaitSettings {
  duration: number;
  reason?: string;
  waitForCondition?: boolean;
  condition?: SequenceCondition;
}

export interface CalibrationSettings {
  frameType: "dark" | "flat" | "bias";
  count: number;
  exposure?: number;
  binning?: string;
  temperature?: number;
}

export interface DitherSettings {
  pixels: number;
  raOnly?: boolean;
  settleTime?: number;
}

export interface ConditionSettings {
  type: "altitude" | "time" | "temperature" | "seeing" | "clouds";
  operator: ">" | "<" | "=" | ">=" | "<=";
  value: number;
  unit?: string;
  timeout?: number;
}

export interface LoopSettings {
  iterations: number;
  condition?: SequenceCondition;
  breakOnError?: boolean;
}

// Union type for all step settings
export type StepSettings = 
  | CaptureSettings 
  | FilterSettings 
  | FocusSettings 
  | SlewSettings 
  | WaitSettings 
  | CalibrationSettings
  | DitherSettings
  | ConditionSettings
  | LoopSettings;

// Sequence step interface
export interface SequenceStep {
  id: string;
  type: SequenceStepType;
  name: string;
  description?: string;
  settings: StepSettings;
  duration: number;
  estimatedDuration?: number;
  status: StepStatus;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  errors?: string[];
  retryCount?: number;
  maxRetries?: number;
  enabled: boolean;
  estimatedCompletion?: Date;
  conditions?: SequenceCondition[];
  onSuccess?: SequenceAction[];
  onFailure?: SequenceAction[];
}

// Sequence interface
export interface Sequence {
  id: string;
  name: string;
  description?: string;
  target?: string;
  steps: SequenceStep[];
  status: SequenceStatus;
  progress: number;
  currentStepIndex: number;
  startTime?: Date;
  endTime?: Date;
  estimatedDuration: number;
  actualDuration?: number;
  repeatCount?: number;
  currentRepeat?: number;
  conditions?: SequenceCondition[];
  metadata: SequenceMetadata;
  created: Date;
  modified: Date;
  version: string;
}

// Sequence metadata
export interface SequenceMetadata {
  author?: string;
  tags: string[];
  category?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  equipment?: string[];
  notes?: string;
  estimatedTime?: number;
  targetType?: "dso" | "planet" | "moon" | "sun" | "calibration";
  modified?: Date;
}

// Execution state
export interface SequenceExecutionState {
  sequence: Sequence | null;
  isRunning: boolean;
  isPaused: boolean;
  currentStep: SequenceStep | null;
  currentStepIndex: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  progress: number;
  startTime: Date | null;
  pausedTime: Date | null;
  estimatedEndTime: Date | null;
  elapsedTime: number;
  remainingTime: number;
  errors: SequenceError[];
  warnings: SequenceWarning[];
  logs: SequenceLogEntry[];
}

// Conditions and actions
export interface SequenceCondition {
  id: string;
  type: "weather" | "altitude" | "time" | "equipment" | "custom";
  description: string;
  expression: string;
  enabled: boolean;
}

export interface SequenceAction {
  id: string;
  type: "abort" | "pause" | "skip" | "retry" | "notify" | "custom";
  description: string;
  parameters: Record<string, unknown>;
}

// Error and logging
export interface SequenceError {
  id: string;
  stepId?: string;
  timestamp: Date;
  level: "error" | "critical";
  message: string;
  details?: string;
  recoverable: boolean;
}

export interface SequenceWarning {
  id: string;
  stepId?: string;
  timestamp: Date;
  message: string;
  details?: string;
}

export interface SequenceLogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "debug" | "warn" | "error";
  message: string;
  stepId?: string;
  data?: Record<string, unknown>;
}

// Validation
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Library and templates
export interface SequenceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Omit<SequenceStep, 'id' | 'status' | 'progress' | 'startTime' | 'endTime'>[];
  metadata: SequenceMetadata;
  isBuiltIn: boolean;
}

export interface SequenceLibrary {
  sequences: Sequence[];
  templates: SequenceTemplate[];
  categories: string[];
  tags: string[];
}

// Import/Export
export interface SequenceExport {
  version: string;
  sequences: Sequence[];
  templates?: SequenceTemplate[];
  exportDate: Date;
  metadata?: Record<string, unknown>;
}

// Enhanced serialization types
export interface SerializationOptions {
  compress?: boolean;
  includeMetadata?: boolean;
  includeStatistics?: boolean;
  format?: 'json' | 'binary' | 'compressed';
  version?: string;
}

export interface SerializedData {
  version: string;
  format: 'json' | 'binary' | 'compressed';
  compressed: boolean;
  checksum?: string;
  timestamp: Date;
  size: number;
  data: string | ArrayBuffer;
  metadata?: {
    originalSize?: number;
    compressionRatio?: number;
    serializationTime?: number;
  };
}

export interface SerializationResult {
  success: boolean;
  data?: SerializedData;
  error?: string;
  warnings?: string[];
  performance?: {
    serializationTime: number;
    compressionTime?: number;
    originalSize: number;
    finalSize: number;
    compressionRatio?: number;
  };
}

export interface DeserializationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  performance?: {
    deserializationTime: number;
    decompressionTime?: number;
  };
  migration?: {
    fromVersion: string;
    toVersion: string;
    migrationsApplied: string[];
  };
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  sequences: string[]; // sequence IDs
  templates: string[]; // template IDs
  settings: WorkspaceSettings;
  metadata: WorkspaceMetadata;
  created: Date;
  modified: Date;
  version: string;
}

export interface WorkspaceSettings {
  defaultTarget?: string;
  defaultEquipment?: string[];
  autoSave?: boolean;
  notifications?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  units?: 'metric' | 'imperial';
}

export interface WorkspaceMetadata {
  author?: string;
  tags: string[];
  category?: string;
  isShared?: boolean;
  shareUrl?: string;
  collaborators?: string[];
  notes?: string;
}

// Target management types
export interface Target {
  id: string;
  name: string;
  type: 'dso' | 'planet' | 'moon' | 'sun' | 'star' | 'custom';
  coordinates: TargetCoordinates;
  metadata: TargetMetadata;
  observability?: ObservabilityData;
  created: Date;
  modified: Date;
}

export interface TargetCoordinates {
  ra: number; // hours
  dec: number; // degrees
  epoch?: number; // J2000.0 by default
  properMotion?: {
    ra: number; // mas/year
    dec: number; // mas/year
  };
  parallax?: number; // mas
  radialVelocity?: number; // km/s
}

export interface TargetMetadata {
  commonNames?: string[];
  catalogIds?: string[];
  constellation?: string;
  magnitude?: number;
  size?: {
    major: number; // arcminutes
    minor: number; // arcminutes
    angle: number; // degrees
  };
  distance?: number; // light years
  notes?: string;
  tags: string[];
}

export interface ObservabilityData {
  altitude?: number;
  azimuth?: number;
  transitTime?: Date;
  riseTime?: Date;
  setTime?: Date;
  moonSeparation?: number;
  airmass?: number;
  visibility?: 'excellent' | 'good' | 'fair' | 'poor' | 'not_visible';
}

export interface TargetLibrary {
  targets: Target[];
  categories: string[];
  catalogs: string[];
  tags: string[];
}

// Target search and import types
export interface TargetSearchOptions {
  query?: string;
  type?: string;
  constellation?: string;
  magnitude?: { min?: number; max?: number };
  size?: { min?: number; max?: number };
  tags?: string[];
  catalogs?: string[];
}

export interface TargetImportData {
  name: string;
  ra: string | number;
  dec: string | number;
  type?: string;
  magnitude?: number;
  size?: { major: number; minor: number; angle: number };
  commonNames?: string[];
  catalogIds?: string[];
  constellation?: string;
  notes?: string;
}

export interface ObservabilityCalculation {
  latitude: number;
  longitude: number;
  date: Date;
  timezone?: string;
}

// Step editor types
export interface StepEditOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move' | 'duplicate' | 'bulk_update';
  timestamp: Date;
  data: any;
  previousData?: any;
}

export interface BulkEditOptions {
  stepIds: string[];
  updates: Partial<SequenceStep>;
  validateEach?: boolean;
  skipInvalid?: boolean;
}

export interface BulkEditResult {
  success: boolean;
  updatedSteps: string[];
  failedSteps: { stepId: string; error: string }[];
  warnings: string[];
}

export interface ClipboardData {
  type: 'steps';
  steps: SequenceStep[];
  timestamp: Date;
  source: string;
}

export interface UndoRedoState {
  operations: StepEditOperation[];
  currentIndex: number;
  maxOperations: number;
}

// Equipment profile validation and comparison types
export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  compatibility: {
    camera: boolean;
    mount: boolean;
    focuser: boolean;
    filterWheel: boolean;
    overall: boolean;
  };
}

export interface ProfileComparison {
  profile1: EquipmentProfile;
  profile2: EquipmentProfile;
  differences: ProfileDifference[];
  compatibility: number; // 0-100%
  recommendations: string[];
}

export interface ProfileDifference {
  category: string;
  field: string;
  value1: any;
  value2: any;
  impact: 'low' | 'medium' | 'high';
  description: string;
}

// Scheduler types
export interface SchedulingOptions {
  startDate: Date;
  endDate: Date;
  location: { latitude: number; longitude: number };
  priorities: {
    weather: number;
    target: number;
    equipment: number;
    time: number;
  };
  constraints: {
    minAltitude: number;
    maxAirmass: number;
    moonSeparation: number;
    weatherRequirements: string[];
  };
}

export interface SchedulingResult {
  success: boolean;
  scheduledSequences: ScheduledSequence[];
  conflicts: SchedulingConflict[];
  warnings: string[];
  statistics: {
    totalTime: number;
    utilizationRate: number;
    sequenceCount: number;
    targetCount: number;
  };
}

export interface SchedulingConflict {
  type: 'time_overlap' | 'equipment_conflict' | 'weather_constraint' | 'target_visibility';
  sequences: string[];
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

// Workspace filtering and search types
export interface WorkspaceFilter {
  category?: string;
  tags?: string[];
  author?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  isShared?: boolean;
}

export interface WorkspaceSearchResult {
  workspaces: Workspace[];
  totalCount: number;
  hasMore: boolean;
}

export interface WorkspaceStats {
  totalSequences: number;
  totalTemplates: number;
  totalDuration: number;
  lastModified: Date;
  collaboratorCount: number;
  isActive: boolean;
}

export interface WorkspaceCollaboration {
  workspaceId: string;
  collaborators: WorkspaceCollaborator[];
  permissions: WorkspacePermissions;
  shareSettings: WorkspaceShareSettings;
}

export interface WorkspaceCollaborator {
  id: string;
  name: string;
  email?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedDate: Date;
  lastActive?: Date;
}

export interface WorkspacePermissions {
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canInvite: boolean;
  canExport: boolean;
}

export interface WorkspaceShareSettings {
  isPublic: boolean;
  shareUrl?: string;
  allowComments: boolean;
  allowDownload: boolean;
  expiresAt?: Date;
}

// Advanced scheduling types
export interface ScheduleRule {
  id: string;
  name: string;
  type: 'time' | 'condition' | 'event';
  enabled: boolean;
  priority: number;
  conditions: ScheduleCondition[];
  actions: ScheduleAction[];
  created: Date;
  modified: Date;
}

export interface ScheduleCondition {
  id: string;
  type: 'time_range' | 'altitude' | 'weather' | 'moon_phase' | 'equipment_status' | 'custom';
  operator: '>' | '<' | '=' | '>=' | '<=' | 'between' | 'in' | 'not_in';
  value: any;
  unit?: string;
  tolerance?: number;
}

export interface ScheduleAction {
  id: string;
  type: 'start_sequence' | 'pause_sequence' | 'stop_sequence' | 'change_target' | 'notify' | 'custom';
  parameters: Record<string, any>;
  delay?: number;
}

export interface ScheduledSequence {
  id: string;
  sequenceId: string;
  targetId?: string;
  scheduledStart: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  rules: string[]; // rule IDs
  conditions: ScheduleCondition[];
  metadata: {
    estimatedDuration: number;
    weatherRequirements?: string[];
    equipmentRequirements?: string[];
    notes?: string;
  };
}

// Equipment profile types
export interface EquipmentProfile {
  id: string;
  name: string;
  description?: string;
  equipment: EquipmentConfiguration;
  settings: EquipmentSettings;
  calibration: CalibrationData;
  metadata: {
    author?: string;
    tags: string[];
    category?: string;
    isDefault?: boolean;
    lastUsed?: Date;
  };
  created: Date;
  modified: Date;
  version: string;
}

export interface EquipmentConfiguration {
  camera: CameraConfig;
  mount: MountConfig;
  focuser?: FocuserConfig;
  filterWheel?: FilterWheelConfig;
  guider?: GuiderConfig;
  rotator?: RotatorConfig;
  dome?: DomeConfig;
  weather?: WeatherConfig;
}

export interface CameraConfig {
  name: string;
  model: string;
  pixelSize: number; // microns
  resolution: { width: number; height: number };
  cooled: boolean;
  maxCooling?: number;
  gainRange?: { min: number; max: number };
  offsetRange?: { min: number; max: number };
  binningModes: string[];
  frameTypes: string[];
}

export interface MountConfig {
  name: string;
  model: string;
  type: 'equatorial' | 'altaz' | 'dobsonian';
  maxSlewRate: number; // degrees per second
  trackingAccuracy: number; // arcseconds RMS
  payloadCapacity: number; // kg
  hasGPS: boolean;
  hasPEC: boolean;
}

export interface FocuserConfig {
  name: string;
  model: string;
  stepSize: number; // microns per step
  maxTravel: number; // mm
  hasTemperatureCompensation: boolean;
  backlash: number; // steps
}

export interface FilterWheelConfig {
  name: string;
  model: string;
  positions: number;
  filters: FilterConfig[];
}

export interface FilterConfig {
  position: number;
  name: string;
  type: 'luminance' | 'red' | 'green' | 'blue' | 'ha' | 'oiii' | 'sii' | 'custom';
  bandwidth?: number; // nm
  centralWavelength?: number; // nm
  focusOffset?: number; // steps
}

export interface GuiderConfig {
  name: string;
  model: string;
  pixelSize: number;
  focalLength: number;
  maxExposure: number;
}

export interface RotatorConfig {
  name: string;
  model: string;
  stepSize: number; // degrees per step
  range: { min: number; max: number }; // degrees
}

export interface DomeConfig {
  name: string;
  model: string;
  diameter: number; // meters
  hasShutter: boolean;
  canSlave: boolean;
}

export interface WeatherConfig {
  name: string;
  model: string;
  sensors: string[];
  safetyLimits: {
    windSpeed: number; // km/h
    humidity: number; // %
    temperature: { min: number; max: number }; // celsius
    pressure: { min: number; max: number }; // hPa
    cloudCover: number; // %
    rainRate: number; // mm/h
  };
}

export interface EquipmentSettings {
  camera: CameraSettings;
  mount: MountSettings;
  focuser?: FocuserSettings;
  filterWheel?: FilterWheelSettings;
  guider?: GuiderSettings;
  safety: SafetySettings;
}

export interface CameraSettings {
  defaultGain: number;
  defaultOffset: number;
  defaultBinning: string;
  coolingTarget: number;
  downloadTimeout: number;
  imageFormat: string;
}

export interface MountSettings {
  slewRate: number;
  trackingRate: number;
  guidingRate: number;
  flipHourAngle: number;
  parkPosition: { ra: number; dec: number };
  limits: {
    eastLimit: number;
    westLimit: number;
    horizonLimit: number;
  };
}

export interface FocuserSettings {
  defaultPosition: number;
  temperatureCoefficient: number;
  backlashCompensation: number;
  maxStep: number;
}

export interface FilterWheelSettings {
  defaultFilter: number;
  changeTimeout: number;
  settleTime: number;
}

export interface GuiderSettings {
  exposure: number;
  gain: number;
  aggressiveness: number;
  ditherAmount: number;
  settleTime: number;
}

export interface SafetySettings {
  enableWeatherMonitoring: boolean;
  enableEquipmentMonitoring: boolean;
  autoAbortOnError: boolean;
  maxConsecutiveErrors: number;
  emergencyStopConditions: string[];
}

export interface CalibrationData {
  darks: CalibrationFrameSet[];
  flats: CalibrationFrameSet[];
  bias: CalibrationFrameSet[];
  defectMap?: string; // path to defect map file
  lastCalibrated: Date;
  validUntil?: Date;
}

export interface CalibrationFrameSet {
  id: string;
  type: 'dark' | 'flat' | 'bias';
  exposure: number;
  temperature: number;
  gain: number;
  offset: number;
  binning: string;
  count: number;
  path: string;
  created: Date;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

// Enhanced template system
export interface AdvancedSequenceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author?: string;

  // Template structure
  steps: TemplateStep[];
  variables: TemplateVariable[];
  conditions: TemplateCondition[];

  // Requirements
  requirements: {
    equipment: string[];
    weather?: string[];
    targets?: string[];
    minDuration?: number;
    maxDuration?: number;
  };

  // Metadata
  metadata: {
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedTime: number;
    targetTypes: string[];
    isBuiltIn: boolean;
    downloadCount?: number;
    rating?: number;
    reviews?: TemplateReview[];
  };

  created: Date;
  modified: Date;
}

export interface TemplateStep {
  id: string;
  type: SequenceStepType;
  name: string;
  description?: string;
  settings: Record<string, any>;
  duration: number | string; // can be variable reference
  conditions?: TemplateCondition[];
  variables?: string[]; // variable names used in this step
  optional?: boolean;
  repeatCount?: number | string;
}

export interface TemplateVariable {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select' | 'target' | 'equipment';
  defaultValue: any;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
    required?: boolean;
  };
  category?: string;
}

export interface TemplateCondition {
  id: string;
  expression: string;
  description?: string;
  variables: string[];
}

export interface TemplateReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: Date;
  helpful: number;
}

// Conditional logic types
export interface ConditionalStep extends Omit<SequenceStep, 'conditions' | 'onSuccess' | 'onFailure'> {
  conditions: StepCondition[];
  onSuccess?: ConditionalAction[];
  onFailure?: ConditionalAction[];
  onTimeout?: ConditionalAction[];
}

export interface StepCondition {
  id: string;
  type: 'weather' | 'equipment' | 'time' | 'target' | 'sequence' | 'custom';
  expression: string;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface ConditionalAction {
  id: string;
  type: 'continue' | 'skip' | 'retry' | 'abort' | 'goto' | 'notify' | 'custom';
  description: string;
  parameters: Record<string, any>;
  delay?: number;
}

// Statistics
export interface SequenceStatistics {
  totalSequences: number;
  completedSequences: number;
  totalRuntime: number;
  averageRuntime: number;
  successRate: number;
  totalExposureTime: number;
  mostUsedStepTypes: Array<{ type: SequenceStepType; count: number }>;
  recentActivity: Array<{ date: Date; sequenceId: string; status: SequenceStatus }>;
}
