/**
 * Settings Types and Interfaces
 * Comprehensive type definitions for all settings categories
 */

// Base types for common settings values
export type Theme = "light" | "dark" | "auto";
export type Language = "en" | "es" | "fr" | "de" | "zh" | "ja";
export type Units = "metric" | "imperial";
export type Protocol = "ascom" | "indi";
export type ConnectionInterface = "wifi" | "bluetooth" | "usb";
export type ImageFormat = "fits" | "raw" | "tiff" | "jpg" | "png";
export type LogLevel = "debug" | "info" | "warning" | "error";
export type DateFormat = "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY" | "DD-MM-YYYY";

// Connection Settings
export interface ConnectionSettings {
  protocol: Protocol;
  interface: ConnectionInterface;
  host: string;
  port: number;
  timeout: number;
  autoReconnect: boolean;
  maxRetries: number;
  retryDelay: number;
  keepAlive: boolean;
  keepAliveInterval: number;
}

// User Interface Settings
export interface UISettings {
  theme: Theme;
  language: Language;
  units: Units;
  dateFormat: DateFormat;
  timeFormat: "12h" | "24h";
  notifications: boolean;
  sounds: boolean;
  volume: number;
  hapticFeedback: boolean;
  animations: boolean;
  fontSize: "small" | "medium" | "large";
  compactMode: boolean;
  showAdvancedControls: boolean;
}

// Imaging Settings
export interface ImagingSettings {
  autoSave: boolean;
  saveFormat: ImageFormat;
  saveLocation: string;
  filenameTemplate: string;
  compression: boolean;
  compressionQuality: number;
  autoStretch: boolean;
  histogramEqualization: boolean;
  darkFrameSubtraction: boolean;
  flatFieldCorrection: boolean;
  createBackups: boolean;
  maxFileSize: number; // in MB
}

// Safety Settings
export interface SafetySettings {
  parkOnDisconnect: boolean;
  stopOnError: boolean;
  temperatureLimit: number;
  windSpeedLimit: number;
  cloudLimit: number;
  humidityLimit: number;
  dewPointMargin: number;
  emergencyStop: boolean;
  safetyTimeout: number;
  weatherMonitoring: boolean;
  autoAbortOnWeather: boolean;
  confirmDangerousActions: boolean;
}

// Advanced Settings
export interface AdvancedSettings {
  logLevel: LogLevel;
  maxLogSize: number;
  logRetentionDays: number;
  backupSettings: boolean;
  autoBackupInterval: number; // in hours
  developerMode: boolean;
  debugMode: boolean;
  performanceMonitoring: boolean;
  crashReporting: boolean;
  analyticsEnabled: boolean;
  betaFeatures: boolean;
  customScripts: boolean;
  apiAccess: boolean;
  maxConcurrentConnections: number;
}

// Equipment-specific settings
export interface EquipmentSettings {
  camera: {
    defaultExposure: number;
    defaultGain: number;
    defaultOffset: number;
    coolingTarget: number;
    autoCalibration: boolean;
    pixelSize: number;
    focalLength: number;
  };
  mount: {
    slewRate: "guide" | "centering" | "find" | "max";
    trackingRate: "sidereal" | "lunar" | "solar" | "custom";
    guidingEnabled: boolean;
    autoMeridianFlip: boolean;
    parkPosition: "home" | "zenith" | "custom";
    unattendedFlip: boolean;
  };
  filterWheel: {
    autoFocus: boolean;
    focusOffsets: Record<string, number>;
    changeTimeout: number;
  };
  focuser: {
    stepSize: number;
    backlash: number;
    autoFocus: boolean;
    temperatureCompensation: boolean;
  };
}

// Main Settings Interface
export interface AppSettings {
  connection: ConnectionSettings;
  ui: UISettings;
  imaging: ImagingSettings;
  safety: SafetySettings;
  advanced: AdvancedSettings;
  equipment: EquipmentSettings;
}

// Settings validation rules
export interface SettingsValidationRules {
  connection: {
    port: { min: number; max: number };
    timeout: { min: number; max: number };
    maxRetries: { min: number; max: number };
    retryDelay: { min: number; max: number };
    keepAliveInterval: { min: number; max: number };
  };
  ui: {
    volume: { min: number; max: number };
    fontSize: string[];
  };
  imaging: {
    compressionQuality: { min: number; max: number };
    maxFileSize: { min: number; max: number };
  };
  safety: {
    temperatureLimit: { min: number; max: number };
    windSpeedLimit: { min: number; max: number };
    cloudLimit: { min: number; max: number };
    humidityLimit: { min: number; max: number };
    dewPointMargin: { min: number; max: number };
    safetyTimeout: { min: number; max: number };
  };
  advanced: {
    maxLogSize: { min: number; max: number };
    logRetentionDays: { min: number; max: number };
    autoBackupInterval: { min: number; max: number };
    maxConcurrentConnections: { min: number; max: number };
  };
}

// Settings change event types
export interface SettingsChangeEvent<T = unknown> {
  category: keyof AppSettings;
  key: string;
  oldValue: T;
  newValue: T;
  timestamp: Date;
}

// Settings export/import types
export interface SettingsExport {
  version: string;
  timestamp: string;
  settings: AppSettings;
  metadata: {
    appVersion: string;
    platform: string;
    deviceId?: string;
  };
}

// Settings category metadata
export interface SettingsCategoryMeta {
  id: keyof AppSettings;
  title: string;
  description: string;
  icon: string;
  order: number;
  requiresRestart?: boolean;
  dangerous?: boolean;
}

// Settings field metadata
export interface SettingsFieldMeta {
  key: string;
  type: "string" | "number" | "boolean" | "select" | "slider" | "file" | "color";
  label: string;
  description?: string;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: unknown) => boolean | string;
  };
  dependencies?: Array<{
    field: string;
    value: unknown;
    condition: "equals" | "not_equals" | "greater_than" | "less_than";
  }>;
  requiresRestart?: boolean;
  dangerous?: boolean;
}
