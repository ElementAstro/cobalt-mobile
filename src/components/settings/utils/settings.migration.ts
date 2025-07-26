/**
 * Settings Migration Utilities
 * Handle migration between different settings versions
 */

import { AppSettings, SettingsExport } from "../types/settings.types";
import { DEFAULT_SETTINGS, SETTINGS_VERSION } from "../constants/settings.constants";

// Migration function type
type MigrationFunction = (oldSettings: Record<string, unknown>) => Record<string, unknown>;

// Migration registry
const MIGRATIONS: Record<string, MigrationFunction> = {
  "1.0.0": migrateFrom1_0_0,
  "1.1.0": migrateFrom1_1_0,
  "2.0.0": migrateFrom2_0_0,
};

/**
 * Migrate settings from any version to the current version
 */
export function migrateSettings(settingsData: Record<string, unknown>): SettingsExport {
  try {
    // Handle different input formats
    let version: string;
    let settings: Record<string, unknown>;
    let timestamp: string;
    let metadata: Record<string, unknown> = {};

    if (typeof settingsData === "object" && settingsData !== null) {
      if ("version" in settingsData) {
        // New format with version
        version = (settingsData as any).version || "1.0.0";
        settings = (settingsData as any).settings || settingsData;
        timestamp = (settingsData as any).timestamp || new Date().toISOString();
        metadata = (settingsData as any).metadata || {};
      } else if ("connection" in settingsData || "ui" in settingsData) {
        // Direct settings object (legacy)
        version = "1.0.0";
        settings = settingsData;
        timestamp = new Date().toISOString();
      } else {
        // Unknown format, use defaults
        console.warn("Unknown settings format, using defaults");
        return {
          version: SETTINGS_VERSION,
          timestamp: new Date().toISOString(),
          settings: DEFAULT_SETTINGS,
          metadata: {
            appVersion: "1.0.0",
            platform: "web",
          },
        };
      }
    } else {
      // Invalid input, use defaults
      console.warn("Invalid settings data, using defaults");
      return {
        version: SETTINGS_VERSION,
        timestamp: new Date().toISOString(),
        settings: DEFAULT_SETTINGS,
        metadata: {
          appVersion: "1.0.0",
          platform: "web",
        },
      };
    }

    // Apply migrations in sequence
    let migratedSettings = settings;
    const versionNumbers = Object.keys(MIGRATIONS).sort(compareVersions);
    
    for (const migrationVersion of versionNumbers) {
      if (compareVersions(version, migrationVersion) < 0) {
        console.log(`Migrating settings from ${version} to ${migrationVersion}`);
        migratedSettings = MIGRATIONS[migrationVersion](migratedSettings);
        version = migrationVersion;
      }
    }

    // Ensure all required fields exist by merging with defaults
    const finalSettings = mergeWithDefaults(migratedSettings);

    return {
      version: SETTINGS_VERSION,
      timestamp,
      settings: finalSettings,
      metadata: {
        appVersion: "1.0.0",
        platform: "web",
        ...metadata,
      },
    };
  } catch (error) {
    console.error("Settings migration failed:", error);
    return {
      version: SETTINGS_VERSION,
      timestamp: new Date().toISOString(),
      settings: DEFAULT_SETTINGS,
      metadata: {
        appVersion: "1.0.0",
        platform: "web",
      },
    };
  }
}

/**
 * Migration from version 1.0.0 (original settings-panel.tsx format)
 */
function migrateFrom1_0_0(oldSettings: Record<string, unknown>): Record<string, unknown> {
  const old = oldSettings as any;
  const migrated: Record<string, unknown> = {
    connection: {
      protocol: old.connection?.protocol || "ascom",
      interface: old.connection?.interface || "wifi",
      host: old.connection?.host || "192.168.1.100",
      port: old.connection?.port || 11111,
      timeout: old.connection?.timeout || 30,
      // Add new fields with defaults
      autoReconnect: true,
      maxRetries: 3,
      retryDelay: 5,
      keepAlive: true,
      keepAliveInterval: 30,
    },
    ui: {
      theme: old.ui?.theme || "auto",
      language: old.ui?.language || "en",
      units: old.ui?.units || "metric",
      dateFormat: old.ui?.dateFormat || "YYYY-MM-DD",
      notifications: old.ui?.notifications ?? true,
      sounds: old.ui?.sounds ?? true,
      volume: old.ui?.volume || 50,
      // Add new fields with defaults
      timeFormat: "24h",
      hapticFeedback: true,
      animations: true,
      fontSize: "medium",
      compactMode: false,
      showAdvancedControls: false,
    },
    imaging: {
      autoSave: old.imaging?.autoSave ?? true,
      saveFormat: old.imaging?.saveFormat || "fits",
      saveLocation: old.imaging?.saveLocation || "/storage/astrophotography",
      filenameTemplate: old.imaging?.filenameTemplate || "{target}_{filter}_{timestamp}",
      compression: old.imaging?.compression ?? false,
      // Add new fields with defaults
      compressionQuality: 85,
      autoStretch: false,
      histogramEqualization: false,
      darkFrameSubtraction: true,
      flatFieldCorrection: true,
      createBackups: false,
      maxFileSize: 500,
    },
    safety: {
      parkOnDisconnect: old.safety?.parkOnDisconnect ?? true,
      stopOnError: old.safety?.stopOnError ?? true,
      temperatureLimit: old.safety?.temperatureLimit || 50,
      windSpeedLimit: old.safety?.windSpeedLimit || 30,
      cloudLimit: old.safety?.cloudLimit || 80,
      // Add new fields with defaults
      humidityLimit: 85,
      dewPointMargin: 5,
      emergencyStop: true,
      safetyTimeout: 300,
      weatherMonitoring: true,
      autoAbortOnWeather: true,
      confirmDangerousActions: true,
    },
    advanced: {
      logLevel: old.advanced?.logLevel || "info",
      maxLogSize: old.advanced?.maxLogSize || 100,
      backupSettings: old.advanced?.backupSettings ?? true,
      developerMode: old.advanced?.developerMode ?? false,
      // Add new fields with defaults
      logRetentionDays: 30,
      autoBackupInterval: 24,
      debugMode: false,
      performanceMonitoring: false,
      crashReporting: true,
      analyticsEnabled: false,
      betaFeatures: false,
      customScripts: false,
      apiAccess: false,
      maxConcurrentConnections: 5,
    },
    // Add new equipment section
    equipment: DEFAULT_SETTINGS.equipment,
  };

  return migrated;
}

/**
 * Migration from version 1.1.0
 */
function migrateFrom1_1_0(oldSettings: Record<string, unknown>): Record<string, unknown> {
  // Add any specific migrations for 1.1.0 -> 2.0.0
  return {
    ...oldSettings,
    // Add equipment section if missing
    equipment: oldSettings.equipment || DEFAULT_SETTINGS.equipment,
  };
}

/**
 * Migration from version 2.0.0 (current version - no migration needed)
 */
function migrateFrom2_0_0(oldSettings: Record<string, unknown>): Record<string, unknown> {
  return oldSettings;
}

/**
 * Merge migrated settings with defaults to ensure all fields exist
 */
function mergeWithDefaults(settings: Record<string, unknown>): AppSettings {
  const settingsAny = settings as any;
  const merged: AppSettings = {
    connection: {
      ...DEFAULT_SETTINGS.connection,
      ...(settingsAny.connection || {}),
    },
    ui: {
      ...DEFAULT_SETTINGS.ui,
      ...(settingsAny.ui || {}),
    },
    imaging: {
      ...DEFAULT_SETTINGS.imaging,
      ...(settingsAny.imaging || {}),
    },
    safety: {
      ...DEFAULT_SETTINGS.safety,
      ...(settingsAny.safety || {}),
    },
    advanced: {
      ...DEFAULT_SETTINGS.advanced,
      ...(settingsAny.advanced || {}),
    },
    equipment: {
      camera: {
        ...DEFAULT_SETTINGS.equipment.camera,
        ...(settingsAny.equipment?.camera || {}),
      },
      mount: {
        ...DEFAULT_SETTINGS.equipment.mount,
        ...(settingsAny.equipment?.mount || {}),
      },
      filterWheel: {
        ...DEFAULT_SETTINGS.equipment.filterWheel,
        ...(settingsAny.equipment?.filterWheel || {}),
      },
      focuser: {
        ...DEFAULT_SETTINGS.equipment.focuser,
        ...(settingsAny.equipment?.focuser || {}),
      },
    },
  };

  return merged;
}

/**
 * Compare version strings (simple semantic versioning)
 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    
    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }
  
  return 0;
}

/**
 * Check if migration is needed
 */
export function needsMigration(settingsData: unknown): boolean {
  if (!settingsData || typeof settingsData !== "object") {
    return true;
  }

  const version = (settingsData as any).version || "1.0.0";
  return compareVersions(version, SETTINGS_VERSION) < 0;
}

/**
 * Get migration info
 */
export function getMigrationInfo(settingsData: unknown): {
  fromVersion: string;
  toVersion: string;
  needsMigration: boolean;
} {
  const fromVersion = (settingsData as any)?.version || "1.0.0";
  const toVersion = SETTINGS_VERSION;
  
  return {
    fromVersion,
    toVersion,
    needsMigration: compareVersions(fromVersion, toVersion) < 0,
  };
}
