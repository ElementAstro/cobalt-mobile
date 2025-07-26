/**
 * Settings Module Exports
 * Main entry point for the settings system
 */

// Main components
export { SettingsPanel } from "./components/SettingsPanel";
export { SettingsProvider, useSettingsContext, withSettings } from "./components/SettingsProvider";
export { ConnectionSettings } from "./components/ConnectionSettings";
export { UISettings } from "./components/UISettings";
export { ImagingSettings as ImagingSettingsComponent } from "./components/ImagingSettings";
export { SafetySettings as SafetySettingsComponent } from "./components/SafetySettings";
export { AdvancedSettings as AdvancedSettingsComponent } from "./components/AdvancedSettings";

// Hooks
export {
  useSettings,
  useSettingsCategory,
  useSetting,
  useSettingsChangeNotifications,
  useSettingsValidation,
  useSettingsPersistence
} from "./hooks/use-settings";

export {
  useSettingsIntegration,
  useSettingsApplication,
  useSettingsFeatureFlags,
  useSettingsNotifications
} from "./hooks/use-settings-integration";

// Store
export { useSettingsStore } from "./store/settings.store";

// Types
export type {
  AppSettings,
  ConnectionSettings as ConnectionSettingsType,
  UISettings as UISettingsType,
  ImagingSettings,
  SafetySettings as SafetySettingsType,
  AdvancedSettings,
  EquipmentSettings,
  SettingsChangeEvent,
  SettingsExport,
  SettingsCategoryMeta,
  SettingsFieldMeta,
  Theme,
  Language,
  Units,
  Protocol,
  ConnectionInterface,
  ImageFormat,
  LogLevel,
  DateFormat,
} from "./types/settings.types";

// Constants
export {
  DEFAULT_SETTINGS,
  VALIDATION_RULES,
  SETTINGS_CATEGORIES,
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  UNITS_OPTIONS,
  PROTOCOL_OPTIONS,
  CONNECTION_INTERFACE_OPTIONS,
  IMAGE_FORMAT_OPTIONS,
  LOG_LEVEL_OPTIONS,
  DATE_FORMAT_OPTIONS,
  STORAGE_KEYS,
  SETTINGS_VERSION,
  FILENAME_TEMPLATE_VARIABLES,
  DEFAULT_FILENAME_TEMPLATES,
} from "./constants/settings.constants";

// Utilities
export {
  validateSettings,
  validateSettingValue,
  type ValidationResult,
} from "./utils/settings.validation";

export {
  migrateSettings,
  needsMigration,
  getMigrationInfo,
} from "./utils/settings.migration";

// Re-export for backward compatibility
export { SettingsPanel as default } from "./components/SettingsPanel";
