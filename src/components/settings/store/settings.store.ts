/**
 * Settings Store
 * Zustand store for managing application settings with persistence and validation
 */

import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type { StateCreator } from "zustand";
import {
  AppSettings,
  SettingsChangeEvent,
  SettingsExport
} from "../types/settings.types";
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  SETTINGS_VERSION
} from "../constants/settings.constants";
import { validateSettings, validateSettingValue } from "../utils/settings.validation";
import { migrateSettings } from "../utils/settings.migration";

// Settings store state interface
interface SettingsState {
  // Current settings
  settings: AppSettings;
  
  // State management
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
  lastBackup: Date | null;
  
  // Change tracking
  changeHistory: SettingsChangeEvent[];
  
  // Actions
  updateSetting: <T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T],
    value: AppSettings[T][keyof AppSettings[T]]
  ) => boolean;
  
  updateSettings: (newSettings: Partial<AppSettings>) => boolean;
  
  resetCategory: (category: keyof AppSettings) => void;
  resetAllSettings: () => void;
  
  saveSettings: () => Promise<boolean>;
  loadSettings: () => Promise<boolean>;
  
  exportSettings: () => SettingsExport;
  importSettings: (settingsData: SettingsExport) => Promise<boolean>;
  
  createBackup: () => Promise<boolean>;
  restoreFromBackup: () => Promise<boolean>;
  
  // Validation
  validateSetting: <T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T],
    value: AppSettings[T][keyof AppSettings[T]]
  ) => boolean | string;
  
  // Change history
  getChangeHistory: (category?: keyof AppSettings) => SettingsChangeEvent[];
  clearChangeHistory: () => void;
  
  // Utilities
  isDirty: () => boolean;
  getSettingValue: <T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T]
  ) => AppSettings[T][keyof AppSettings[T]];
}

// Create the settings store
type SettingsStore = StateCreator<
  SettingsState,
  [["zustand/subscribeWithSelector", never], ["zustand/persist", unknown]],
  [],
  SettingsState
>;

const settingsStore: SettingsStore = (set, get) => ({
  // Initial state
  settings: DEFAULT_SETTINGS,
  hasUnsavedChanges: false,
  isLoading: false,
  lastSaved: null,
  lastBackup: null,
  changeHistory: [],

  // Update a single setting with validation
  updateSetting: <T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T],
    value: AppSettings[T][keyof AppSettings[T]]
  ) => {
          const validation = get().validateSetting(category, key, value);
          if (validation !== true) {
            console.warn(`Invalid setting value for ${String(category)}.${String(key)}:`, validation);
            return false;
          }

          set((state) => {
            const oldValue = state.settings[category][key];

            // Create change event
            const changeEvent: SettingsChangeEvent = {
              category,
              key: String(key),
              oldValue,
              newValue: value,
              timestamp: new Date(),
            };

            // Update the setting
            const newSettings = { ...state.settings };
            newSettings[category] = { ...newSettings[category], [key]: value } as AppSettings[typeof category];

            const newChangeHistory = [...state.changeHistory, changeEvent];

            // Keep change history manageable (last 100 changes)
            if (newChangeHistory.length > 100) {
              newChangeHistory.splice(0, newChangeHistory.length - 100);
            }

            return {
              ...state,
              settings: newSettings,
              hasUnsavedChanges: true,
              changeHistory: newChangeHistory,
            };
          });

          return true;
        },

  // Update multiple settings at once
  updateSettings: (newSettings: Partial<AppSettings>) => {
          const validation = validateSettings(newSettings);
          if (!validation.isValid) {
            console.warn("Invalid settings:", validation.errors);
            return false;
          }

          set((state) => {
            const updatedSettings = { ...state.settings };
            const newChangeHistory = [...state.changeHistory];

            Object.entries(newSettings).forEach(([category, categorySettings]) => {
              if (categorySettings && typeof categorySettings === "object") {
                const categoryKey = category as keyof AppSettings;
                (updatedSettings as any)[categoryKey] = {
                  ...updatedSettings[categoryKey],
                  ...categorySettings
                };

                Object.entries(categorySettings).forEach(([key, value]) => {
                  const oldValue = (state.settings as any)[category][key];

                  if (oldValue !== value) {
                    const changeEvent: SettingsChangeEvent = {
                      category: category as keyof AppSettings,
                      key,
                      oldValue,
                      newValue: value,
                      timestamp: new Date(),
                    };

                    newChangeHistory.push(changeEvent);
                  }
                });
              }
            });

            // Keep change history manageable
            if (newChangeHistory.length > 100) {
              newChangeHistory.splice(0, newChangeHistory.length - 100);
            }

            return {
              ...state,
              settings: updatedSettings,
              hasUnsavedChanges: true,
              changeHistory: newChangeHistory,
            };
          });

          return true;
        },

  // Reset a specific category to defaults
  resetCategory: (category: keyof AppSettings) => {
    set((state) => {
            const defaultCategorySettings = DEFAULT_SETTINGS[category] as any;
            const oldCategorySettings = state.settings[category];

            const newSettings = { ...state.settings };
            newSettings[category] = { ...defaultCategorySettings };

            // Add change event for category reset
            const changeEvent: SettingsChangeEvent = {
              category,
              key: "*",
              oldValue: oldCategorySettings,
              newValue: defaultCategorySettings,
              timestamp: new Date(),
            };

            const newChangeHistory = [...state.changeHistory, changeEvent];

            return {
              ...state,
              settings: newSettings,
              hasUnsavedChanges: true,
              changeHistory: newChangeHistory,
            };
          });
        },

  // Reset all settings to defaults
  resetAllSettings: () => {
    set((state) => {
            const oldSettings = { ...state.settings };

            // Add change event for full reset
            const changeEvent: SettingsChangeEvent = {
              category: "*" as keyof AppSettings,
              key: "*",
              oldValue: oldSettings,
              newValue: DEFAULT_SETTINGS,
              timestamp: new Date(),
            };

            const newChangeHistory = [...state.changeHistory, changeEvent];

            return {
              ...state,
              settings: { ...DEFAULT_SETTINGS },
              hasUnsavedChanges: true,
              changeHistory: newChangeHistory,
            };
          });
        },

  // Save settings to localStorage
  saveSettings: async () => {
    try {
      set((state) => ({ ...state, isLoading: true }));

            const { settings } = get();
            const validation = validateSettings(settings);
            
            if (!validation.isValid) {
              console.error("Cannot save invalid settings:", validation.errors);
              return false;
            }

            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
              version: SETTINGS_VERSION,
              settings,
              timestamp: new Date().toISOString(),
            }));

            set((state) => ({
              ...state,
              hasUnsavedChanges: false,
              lastSaved: new Date(),
              isLoading: false,
            }));

            return true;
          } catch (error) {
            console.error("Failed to save settings:", error);
      set((state) => ({ ...state, isLoading: false }));
      return false;
    }
  },

  // Load settings from localStorage
  loadSettings: async () => {
    try {
      set((state) => ({ ...state, isLoading: true }));

            const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!stored) {
        set((state) => ({ ...state, isLoading: false }));
        return true; // No stored settings is not an error
      }

      const parsed = JSON.parse(stored);
      const migratedSettings = migrateSettings(parsed);

      const validation = validateSettings(migratedSettings.settings);
      if (!validation.isValid) {
        console.warn("Loaded settings are invalid, using defaults:", validation.errors);
        set((state) => ({
          ...state,
          settings: DEFAULT_SETTINGS,
          isLoading: false,
        }));
        return false;
      }

      set((state) => ({
        ...state,
        settings: migratedSettings.settings,
        hasUnsavedChanges: false,
        lastSaved: new Date(migratedSettings.timestamp),
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error("Failed to load settings:", error);
      set((state) => ({
        ...state,
        settings: DEFAULT_SETTINGS,
        isLoading: false,
      }));
      return false;
    }
  },

  // Export settings for backup/sharing
  exportSettings: () => {
    const { settings } = get();
    return {
      version: SETTINGS_VERSION,
      timestamp: new Date().toISOString(),
      settings,
      metadata: {
        appVersion: "1.0.0", // This should come from app config
        platform: typeof window !== "undefined" ? "web" : "unknown",
      },
    };
  },

  // Import settings from backup/file
  importSettings: async (settingsData: SettingsExport) => {
    try {
      const migratedData = migrateSettings(settingsData as any);
      const validation = validateSettings(migratedData.settings);

      if (!validation.isValid) {
        console.error("Cannot import invalid settings:", validation.errors);
        return false;
      }

      set((state) => {
        const oldSettings = { ...state.settings };

        // Add change event for import
        const changeEvent: SettingsChangeEvent = {
          category: "*" as keyof AppSettings,
          key: "import",
          oldValue: oldSettings,
          newValue: migratedData.settings,
          timestamp: new Date(),
        };

        const newChangeHistory = [...state.changeHistory, changeEvent];

        return {
          ...state,
          settings: migratedData.settings,
          hasUnsavedChanges: true,
          changeHistory: newChangeHistory,
        };
      });

      return true;
    } catch (error) {
      console.error("Failed to import settings:", error);
      return false;
    }
  },

  // Create backup
  createBackup: async () => {
    try {
      const backup = get().exportSettings();
      localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backup));
      localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, new Date().toISOString());

      set((state) => ({
        ...state,
        lastBackup: new Date(),
      }));

      return true;
    } catch (error) {
      console.error("Failed to create backup:", error);
      return false;
    }
  },

  // Restore from backup
  restoreFromBackup: async () => {
    try {
      const backup = localStorage.getItem(STORAGE_KEYS.BACKUP);
      if (!backup) {
        console.warn("No backup found");
        return false;
      }

      const backupData = JSON.parse(backup);
      return await get().importSettings(backupData);
    } catch (error) {
      console.error("Failed to restore from backup:", error);
      return false;
    }
  },

  // Validate a setting value
  validateSetting: <T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T],
    value: AppSettings[T][keyof AppSettings[T]]
  ) => {
    return validateSettingValue(category, key, value);
  },

  // Get change history
  getChangeHistory: (category?: keyof AppSettings) => {
    const { changeHistory } = get();
    if (!category) return changeHistory;
    return changeHistory.filter(change => change.category === category);
  },

  // Clear change history
  clearChangeHistory: () => {
    set((state) => ({
      ...state,
      changeHistory: [],
    }));
  },

  // Check if settings have unsaved changes
  isDirty: () => {
    return get().hasUnsavedChanges;
  },

  // Get a specific setting value
  getSettingValue: <T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T]
  ) => {
    return get().settings[category][key];
  },
});

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector(
    persist(
      settingsStore,
      {
        name: STORAGE_KEYS.SETTINGS,
        partialize: (state) => ({
          settings: state.settings,
          lastSaved: state.lastSaved,
          lastBackup: state.lastBackup,
        }),
      }
    )
  )
);

// Subscribe to settings changes for automatic backup
useSettingsStore.subscribe(
  (state) => state.hasUnsavedChanges,
  (hasChanges) => {
    if (hasChanges) {
      // Auto-backup after 5 minutes of changes
      setTimeout(() => {
        const store = useSettingsStore.getState();
        if (store.hasUnsavedChanges && store.settings.advanced.backupSettings) {
          store.createBackup();
        }
      }, 5 * 60 * 1000);
    }
  }
);
