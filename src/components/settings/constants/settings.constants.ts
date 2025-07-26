/**
 * Settings Constants and Default Values
 * Centralized constants for settings validation and defaults
 */

import { 
  AppSettings, 
  SettingsValidationRules, 
  SettingsCategoryMeta,
  Theme,
  Language,
  Units,
  Protocol,
  ConnectionInterface,
  ImageFormat,
  LogLevel,
  DateFormat
} from "../types/settings.types";

// Default settings values
export const DEFAULT_SETTINGS: AppSettings = {
  connection: {
    protocol: "ascom",
    interface: "wifi",
    host: "192.168.1.100",
    port: 11111,
    timeout: 30,
    autoReconnect: true,
    maxRetries: 3,
    retryDelay: 5,
    keepAlive: true,
    keepAliveInterval: 30,
  },
  ui: {
    theme: "auto",
    language: "en",
    units: "metric",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
    notifications: true,
    sounds: true,
    volume: 50,
    hapticFeedback: true,
    animations: true,
    fontSize: "medium",
    compactMode: false,
    showAdvancedControls: false,
  },
  imaging: {
    autoSave: true,
    saveFormat: "fits",
    saveLocation: "/storage/astrophotography",
    filenameTemplate: "{target}_{filter}_{timestamp}",
    compression: false,
    compressionQuality: 85,
    autoStretch: false,
    histogramEqualization: false,
    darkFrameSubtraction: true,
    flatFieldCorrection: true,
    createBackups: false,
    maxFileSize: 500, // MB
  },
  safety: {
    parkOnDisconnect: true,
    stopOnError: true,
    temperatureLimit: 50,
    windSpeedLimit: 30,
    cloudLimit: 80,
    humidityLimit: 85,
    dewPointMargin: 5,
    emergencyStop: true,
    safetyTimeout: 300,
    weatherMonitoring: true,
    autoAbortOnWeather: true,
    confirmDangerousActions: true,
  },
  advanced: {
    logLevel: "info",
    maxLogSize: 100,
    logRetentionDays: 30,
    backupSettings: true,
    autoBackupInterval: 24,
    developerMode: false,
    debugMode: false,
    performanceMonitoring: false,
    crashReporting: true,
    analyticsEnabled: false,
    betaFeatures: false,
    customScripts: false,
    apiAccess: false,
    maxConcurrentConnections: 5,
  },
  equipment: {
    camera: {
      defaultExposure: 300,
      defaultGain: 100,
      defaultOffset: 10,
      coolingTarget: -10,
      autoCalibration: true,
      pixelSize: 3.76,
      focalLength: 1000,
    },
    mount: {
      slewRate: "centering",
      trackingRate: "sidereal",
      guidingEnabled: true,
      autoMeridianFlip: true,
      parkPosition: "home",
      unattendedFlip: false,
    },
    filterWheel: {
      autoFocus: true,
      focusOffsets: {},
      changeTimeout: 30,
    },
    focuser: {
      stepSize: 1,
      backlash: 0,
      autoFocus: true,
      temperatureCompensation: false,
    },
  },
};

// Validation rules
export const VALIDATION_RULES: SettingsValidationRules = {
  connection: {
    port: { min: 1, max: 65535 },
    timeout: { min: 5, max: 300 },
    maxRetries: { min: 0, max: 10 },
    retryDelay: { min: 1, max: 60 },
    keepAliveInterval: { min: 10, max: 300 },
  },
  ui: {
    volume: { min: 0, max: 100 },
    fontSize: ["small", "medium", "large"],
  },
  imaging: {
    compressionQuality: { min: 1, max: 100 },
    maxFileSize: { min: 1, max: 10000 },
  },
  safety: {
    temperatureLimit: { min: -50, max: 100 },
    windSpeedLimit: { min: 0, max: 100 },
    cloudLimit: { min: 0, max: 100 },
    humidityLimit: { min: 0, max: 100 },
    dewPointMargin: { min: 0, max: 20 },
    safetyTimeout: { min: 30, max: 3600 },
  },
  advanced: {
    maxLogSize: { min: 1, max: 1000 },
    logRetentionDays: { min: 1, max: 365 },
    autoBackupInterval: { min: 1, max: 168 },
    maxConcurrentConnections: { min: 1, max: 20 },
  },
};

// Settings categories metadata
export const SETTINGS_CATEGORIES: SettingsCategoryMeta[] = [
  {
    id: "connection",
    title: "Connection",
    description: "Configure how the app connects to your equipment",
    icon: "Wifi",
    order: 1,
  },
  {
    id: "ui",
    title: "User Interface",
    description: "Customize the app appearance and behavior",
    icon: "Palette",
    order: 2,
  },
  {
    id: "imaging",
    title: "Imaging",
    description: "Configure image capture and processing settings",
    icon: "Camera",
    order: 3,
  },
  {
    id: "equipment",
    title: "Equipment",
    description: "Device-specific settings and calibration",
    icon: "Settings",
    order: 4,
  },
  {
    id: "safety",
    title: "Safety",
    description: "Configure safety limits and automatic responses",
    icon: "Shield",
    order: 5,
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Advanced settings for power users",
    icon: "Code",
    order: 6,
    dangerous: true,
  },
];

// Option lists for select fields
export const THEME_OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

export const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
];

export const UNITS_OPTIONS: Array<{ value: Units; label: string }> = [
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
];

export const PROTOCOL_OPTIONS: Array<{ value: Protocol; label: string }> = [
  { value: "ascom", label: "ASCOM" },
  { value: "indi", label: "INDI" },
];

export const CONNECTION_INTERFACE_OPTIONS: Array<{ value: ConnectionInterface; label: string }> = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "bluetooth", label: "Bluetooth" },
  { value: "usb", label: "USB" },
];

export const IMAGE_FORMAT_OPTIONS: Array<{ value: ImageFormat; label: string }> = [
  { value: "fits", label: "FITS" },
  { value: "raw", label: "RAW" },
  { value: "tiff", label: "TIFF" },
  { value: "jpg", label: "JPEG" },
  { value: "png", label: "PNG" },
];

export const LOG_LEVEL_OPTIONS: Array<{ value: LogLevel; label: string }> = [
  { value: "debug", label: "Debug" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
];

export const DATE_FORMAT_OPTIONS: Array<{ value: DateFormat; label: string }> = [
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
];

// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: "astro-settings-v2",
  BACKUP: "astro-settings-backup",
  LAST_BACKUP: "astro-settings-last-backup",
} as const;

// Settings version for migration
export const SETTINGS_VERSION = "2.0.0";

// File name templates
export const FILENAME_TEMPLATE_VARIABLES = [
  "{target}",
  "{filter}",
  "{timestamp}",
  "{date}",
  "{time}",
  "{exposure}",
  "{gain}",
  "{binning}",
  "{temperature}",
  "{sequence}",
  "{frame_type}",
] as const;

// Default filename templates
export const DEFAULT_FILENAME_TEMPLATES = [
  "{target}_{filter}_{timestamp}",
  "{date}_{target}_{filter}_{exposure}s",
  "{target}_{frame_type}_{filter}_{sequence:03d}",
  "{date}_{time}_{target}_{filter}",
] as const;
