/**
 * Settings Validation Utilities
 * Comprehensive validation functions for all settings
 */

import {
  AppSettings
  // SettingsValidationRules, // Unused for now
  // Theme, // Unused for now
  // Language, // Unused for now
  // Units, // Unused for now
  // Protocol, // Unused for now
  // ConnectionInterface, // Unused for now
  // ImageFormat, // Unused for now
  // LogLevel, // Unused for now
  // DateFormat // Unused for now
} from "../types/settings.types";
import { 
  VALIDATION_RULES,
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  UNITS_OPTIONS,
  PROTOCOL_OPTIONS,
  CONNECTION_INTERFACE_OPTIONS,
  IMAGE_FORMAT_OPTIONS,
  LOG_LEVEL_OPTIONS,
  DATE_FORMAT_OPTIONS
} from "../constants/settings.constants";

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validate a single setting value
export function validateSettingValue<T extends keyof AppSettings>(
  category: T,
  key: keyof AppSettings[T],
  value: AppSettings[T][keyof AppSettings[T]]
): boolean | string {
  try {
    // Type-specific validations
    switch (category) {
      case "connection":
        return validateConnectionSetting(key as keyof AppSettings["connection"], value);
      case "ui":
        return validateUISetting(key as keyof AppSettings["ui"], value);
      case "imaging":
        return validateImagingSetting(key as keyof AppSettings["imaging"], value);
      case "safety":
        return validateSafetySetting(key as keyof AppSettings["safety"], value);
      case "advanced":
        return validateAdvancedSetting(key as keyof AppSettings["advanced"], value);
      case "equipment":
        return validateEquipmentSetting(key as keyof AppSettings["equipment"], value);
      default:
        return "Unknown settings category";
    }
  } catch (error) {
    return `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

// Validate connection settings
function validateConnectionSetting(key: keyof AppSettings["connection"], value: unknown): boolean | string {
  const rules = VALIDATION_RULES.connection;

  switch (key) {
    case "protocol":
      return PROTOCOL_OPTIONS.some(opt => opt.value === value) || "Invalid protocol";
    
    case "interface":
      return CONNECTION_INTERFACE_OPTIONS.some(opt => opt.value === value) || "Invalid interface";
    
    case "host":
      if (typeof value !== "string") return "Host must be a string";
      if (value.length === 0) return "Host cannot be empty";
      // Basic IP/hostname validation
      const hostRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return hostRegex.test(value) || "Invalid host address";
    
    case "port":
      return validateNumberRange(value, rules.port.min, rules.port.max, "Port");
    
    case "timeout":
      return validateNumberRange(value, rules.timeout.min, rules.timeout.max, "Timeout");
    
    case "maxRetries":
      return validateNumberRange(value, rules.maxRetries.min, rules.maxRetries.max, "Max retries");
    
    case "retryDelay":
      return validateNumberRange(value, rules.retryDelay.min, rules.retryDelay.max, "Retry delay");
    
    case "keepAliveInterval":
      return validateNumberRange(value, rules.keepAliveInterval.min, rules.keepAliveInterval.max, "Keep alive interval");
    
    case "autoReconnect":
    case "keepAlive":
      return typeof value === "boolean" || "Must be a boolean value";
    
    default:
      return true;
  }
}

// Validate UI settings
function validateUISetting(key: keyof AppSettings["ui"], value: unknown): boolean | string {
  const rules = VALIDATION_RULES.ui;

  switch (key) {
    case "theme":
      return THEME_OPTIONS.some(opt => opt.value === value) || "Invalid theme";
    
    case "language":
      return LANGUAGE_OPTIONS.some(opt => opt.value === value) || "Invalid language";
    
    case "units":
      return UNITS_OPTIONS.some(opt => opt.value === value) || "Invalid units";
    
    case "dateFormat":
      return DATE_FORMAT_OPTIONS.some(opt => opt.value === value) || "Invalid date format";
    
    case "timeFormat":
      return ["12h", "24h"].includes(value as string) || "Invalid time format";

    case "fontSize":
      return rules.fontSize.includes(value as string) || "Invalid font size";
    
    case "volume":
      return validateNumberRange(value, rules.volume.min, rules.volume.max, "Volume");
    
    case "notifications":
    case "sounds":
    case "hapticFeedback":
    case "animations":
    case "compactMode":
    case "showAdvancedControls":
      return typeof value === "boolean" || "Must be a boolean value";
    
    default:
      return true;
  }
}

// Validate imaging settings
function validateImagingSetting(key: keyof AppSettings["imaging"], value: unknown): boolean | string {
  const rules = VALIDATION_RULES.imaging;

  switch (key) {
    case "saveFormat":
      return IMAGE_FORMAT_OPTIONS.some(opt => opt.value === value) || "Invalid image format";
    
    case "saveLocation":
      if (typeof value !== "string") return "Save location must be a string";
      if (value.length === 0) return "Save location cannot be empty";
      return true;
    
    case "filenameTemplate":
      if (typeof value !== "string") return "Filename template must be a string";
      if (value.length === 0) return "Filename template cannot be empty";
      return true;
    
    case "compressionQuality":
      return validateNumberRange(value, rules.compressionQuality.min, rules.compressionQuality.max, "Compression quality");
    
    case "maxFileSize":
      return validateNumberRange(value, rules.maxFileSize.min, rules.maxFileSize.max, "Max file size");
    
    case "autoSave":
    case "compression":
    case "autoStretch":
    case "histogramEqualization":
    case "darkFrameSubtraction":
    case "flatFieldCorrection":
    case "createBackups":
      return typeof value === "boolean" || "Must be a boolean value";
    
    default:
      return true;
  }
}

// Validate safety settings
function validateSafetySetting(key: keyof AppSettings["safety"], value: unknown): boolean | string {
  const rules = VALIDATION_RULES.safety;

  switch (key) {
    case "temperatureLimit":
      return validateNumberRange(value, rules.temperatureLimit.min, rules.temperatureLimit.max, "Temperature limit");
    
    case "windSpeedLimit":
      return validateNumberRange(value, rules.windSpeedLimit.min, rules.windSpeedLimit.max, "Wind speed limit");
    
    case "cloudLimit":
      return validateNumberRange(value, rules.cloudLimit.min, rules.cloudLimit.max, "Cloud limit");
    
    case "humidityLimit":
      return validateNumberRange(value, rules.humidityLimit.min, rules.humidityLimit.max, "Humidity limit");
    
    case "dewPointMargin":
      return validateNumberRange(value, rules.dewPointMargin.min, rules.dewPointMargin.max, "Dew point margin");
    
    case "safetyTimeout":
      return validateNumberRange(value, rules.safetyTimeout.min, rules.safetyTimeout.max, "Safety timeout");
    
    case "parkOnDisconnect":
    case "stopOnError":
    case "emergencyStop":
    case "weatherMonitoring":
    case "autoAbortOnWeather":
    case "confirmDangerousActions":
      return typeof value === "boolean" || "Must be a boolean value";
    
    default:
      return true;
  }
}

// Validate advanced settings
function validateAdvancedSetting(key: keyof AppSettings["advanced"], value: unknown): boolean | string {
  const rules = VALIDATION_RULES.advanced;

  switch (key) {
    case "logLevel":
      return LOG_LEVEL_OPTIONS.some(opt => opt.value === value) || "Invalid log level";
    
    case "maxLogSize":
      return validateNumberRange(value, rules.maxLogSize.min, rules.maxLogSize.max, "Max log size");
    
    case "logRetentionDays":
      return validateNumberRange(value, rules.logRetentionDays.min, rules.logRetentionDays.max, "Log retention days");
    
    case "autoBackupInterval":
      return validateNumberRange(value, rules.autoBackupInterval.min, rules.autoBackupInterval.max, "Auto backup interval");
    
    case "maxConcurrentConnections":
      return validateNumberRange(value, rules.maxConcurrentConnections.min, rules.maxConcurrentConnections.max, "Max concurrent connections");
    
    case "backupSettings":
    case "developerMode":
    case "debugMode":
    case "performanceMonitoring":
    case "crashReporting":
    case "analyticsEnabled":
    case "betaFeatures":
    case "customScripts":
    case "apiAccess":
      return typeof value === "boolean" || "Must be a boolean value";
    
    default:
      return true;
  }
}

// Validate equipment settings (simplified for now)
function validateEquipmentSetting(key: keyof AppSettings["equipment"], value: unknown): boolean | string {
  // Equipment settings validation would be more complex in a real implementation
  // For now, just basic type checking
  if (typeof value === "object" && value !== null) {
    return true;
  }
  return "Equipment settings must be objects";
}

// Helper function to validate number ranges
function validateNumberRange(value: unknown, min: number, max: number, fieldName: string): boolean | string {
  if (typeof value !== "number") {
    return `${fieldName} must be a number`;
  }
  if (isNaN(value)) {
    return `${fieldName} cannot be NaN`;
  }
  if (value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (value > max) {
    return `${fieldName} must be at most ${max}`;
  }
  return true;
}

// Validate entire settings object
export function validateSettings(settings: Partial<AppSettings>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    Object.entries(settings).forEach(([category, categorySettings]) => {
      if (categorySettings && typeof categorySettings === "object") {
        Object.entries(categorySettings).forEach(([key, value]) => {
          const validation = validateSettingValue(
            category as keyof AppSettings,
            key as any,
            value
          );
          
          if (validation !== true) {
            errors.push(`${category}.${key}: ${validation}`);
          }
        });
      }
    });
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Validate settings compatibility
export function validateSettingsCompatibility(settings: AppSettings): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for incompatible combinations
  if (settings.connection.interface === "usb" && settings.connection.protocol === "indi") {
    warnings.push("USB interface with INDI protocol may have limited functionality");
  }

  if (settings.imaging.compression && settings.imaging.saveFormat === "fits") {
    warnings.push("FITS format with compression may not be supported by all applications");
  }

  if (settings.safety.temperatureLimit > 40 && settings.equipment.camera.coolingTarget < -20) {
    warnings.push("High temperature limit with aggressive cooling may cause condensation");
  }

  if (settings.advanced.developerMode && !settings.safety.confirmDangerousActions) {
    warnings.push("Developer mode without confirmation prompts can be dangerous");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
