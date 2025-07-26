/**
 * Settings Hooks
 * Custom hooks for settings management
 */

import { useCallback, useEffect, useState } from "react";
import { useSettingsStore } from "../store/settings.store";
import { AppSettings, SettingsChangeEvent } from "../types/settings.types";
import { validateSettingValue } from "../utils/settings.validation";

/**
 * Main settings hook - provides access to all settings functionality
 */
export function useSettings() {
  const {
    settings,
    hasUnsavedChanges,
    isLoading,
    lastSaved,
    lastBackup,
    updateSetting,
    updateSettings,
    resetCategory,
    resetAllSettings,
    saveSettings,
    loadSettings,
    exportSettings,
    importSettings,
    createBackup,
    restoreFromBackup,
    validateSetting,
    getChangeHistory,
    clearChangeHistory,
    isDirty,
    getSettingValue,
  } = useSettingsStore();

  // Initialize settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Auto-save functionality
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveDelay, setAutoSaveDelay] = useState(5000); // 5 seconds

  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges) return;

    const timeoutId = setTimeout(() => {
      if (hasUnsavedChanges) {
        saveSettings();
      }
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [hasUnsavedChanges, autoSaveEnabled, autoSaveDelay, saveSettings]);

  // Safe update with validation
  const safeUpdateSetting = useCallback(
    <T extends keyof AppSettings>(
      category: T,
      key: keyof AppSettings[T],
      value: AppSettings[T][keyof AppSettings[T]]
    ) => {
      const validation = validateSetting(category, key, value);
      if (validation === true) {
        return updateSetting(category, key, value);
      } else {
        console.warn(`Validation failed for ${String(category)}.${String(key)}:`, validation);
        return false;
      }
    },
    [updateSetting, validateSetting]
  );

  // Batch update with rollback on error
  const batchUpdateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const originalSettings = { ...settings };
      
      try {
        const success = updateSettings(updates);
        if (!success) {
          // Rollback on validation failure
          updateSettings(originalSettings);
          return false;
        }
        return true;
      } catch (error) {
        // Rollback on any error
        updateSettings(originalSettings);
        console.error("Batch update failed:", error);
        return false;
      }
    },
    [settings, updateSettings]
  );

  return {
    // Current state
    settings,
    hasUnsavedChanges,
    isLoading,
    lastSaved,
    lastBackup,
    isDirty: isDirty(),

    // Update functions
    updateSetting: safeUpdateSetting,
    updateSettings,
    batchUpdateSettings,

    // Reset functions
    resetCategory,
    resetAllSettings,

    // Persistence
    saveSettings,
    loadSettings,
    exportSettings,
    importSettings,

    // Backup
    createBackup,
    restoreFromBackup,

    // Validation
    validateSetting,

    // Change tracking
    getChangeHistory,
    clearChangeHistory,

    // Utilities
    getSettingValue,

    // Auto-save controls
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveDelay,
    setAutoSaveDelay,
  };
}

/**
 * Hook for a specific settings category
 */
export function useSettingsCategory<T extends keyof AppSettings>(category: T) {
  const {
    settings,
    updateSetting,
    resetCategory,
    validateSetting,
    getChangeHistory,
  } = useSettingsStore();

  const categorySettings = settings[category];

  const updateCategorySetting = useCallback(
    (key: keyof AppSettings[T], value: AppSettings[T][keyof AppSettings[T]]) => {
      return updateSetting(category, key, value);
    },
    [category, updateSetting]
  );

  const validateCategorySetting = useCallback(
    (key: keyof AppSettings[T], value: AppSettings[T][keyof AppSettings[T]]) => {
      return validateSetting(category, key, value);
    },
    [category, validateSetting]
  );

  const resetCategorySettings = useCallback(() => {
    resetCategory(category);
  }, [category, resetCategory]);

  const getCategoryChangeHistory = useCallback(() => {
    return getChangeHistory(category);
  }, [category, getChangeHistory]);

  return {
    settings: categorySettings,
    updateSetting: updateCategorySetting,
    validateSetting: validateCategorySetting,
    resetCategory: resetCategorySettings,
    getChangeHistory: getCategoryChangeHistory,
  };
}

/**
 * Hook for a specific setting value with real-time updates
 */
export function useSetting<T extends keyof AppSettings>(
  category: T,
  key: keyof AppSettings[T]
) {
  const { settings, updateSetting, validateSetting } = useSettingsStore();
  
  const value = settings[category][key];

  const setValue = useCallback(
    (newValue: AppSettings[T][keyof AppSettings[T]]) => {
      return updateSetting(category, key, newValue);
    },
    [category, key, updateSetting]
  );

  const validate = useCallback(
    (newValue: AppSettings[T][keyof AppSettings[T]]) => {
      return validateSetting(category, key, newValue);
    },
    [category, key, validateSetting]
  );

  return [value, setValue, validate] as const;
}

/**
 * Hook for settings change notifications
 */
export function useSettingsChangeNotifications() {
  const [notifications, setNotifications] = useState<SettingsChangeEvent[]>([]);
  const { getChangeHistory } = useSettingsStore();

  useEffect(() => {
    // Get recent changes (last 10)
    const recentChanges = getChangeHistory().slice(-10);
    setNotifications(recentChanges);
  }, [getChangeHistory]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissNotification = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    notifications,
    clearNotifications,
    dismissNotification,
  };
}

/**
 * Hook for settings validation status
 */
export function useSettingsValidation() {
  const { settings } = useSettingsStore();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  useEffect(() => {
    // Validate all settings
    const errors: string[] = [];
    const warnings: string[] = [];

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

    setValidationErrors(errors);
    setValidationWarnings(warnings);
  }, [settings]);

  return {
    hasErrors: validationErrors.length > 0,
    hasWarnings: validationWarnings.length > 0,
    errors: validationErrors,
    warnings: validationWarnings,
    isValid: validationErrors.length === 0,
  };
}

/**
 * Hook for settings persistence status
 */
export function useSettingsPersistence() {
  const {
    hasUnsavedChanges,
    isLoading,
    lastSaved,
    lastBackup,
    saveSettings,
    createBackup,
  } = useSettingsStore();

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [backupStatus, setBackupStatus] = useState<"idle" | "creating" | "success" | "error">("idle");

  const saveWithStatus = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const success = await saveSettings();
      setSaveStatus(success ? "success" : "error");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return success;
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return false;
    }
  }, [saveSettings]);

  const backupWithStatus = useCallback(async () => {
    setBackupStatus("creating");
    try {
      const success = await createBackup();
      setBackupStatus(success ? "success" : "error");
      setTimeout(() => setBackupStatus("idle"), 2000);
      return success;
    } catch {
      setBackupStatus("error");
      setTimeout(() => setBackupStatus("idle"), 2000);
      return false;
    }
  }, [createBackup]);

  return {
    hasUnsavedChanges,
    isLoading,
    lastSaved,
    lastBackup,
    saveStatus,
    backupStatus,
    saveWithStatus,
    backupWithStatus,
  };
}
