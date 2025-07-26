/**
 * Settings Provider
 * React context provider for settings management
 */

"use client";

import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useSettings } from "../hooks/use-settings";
import { useSettingsIntegration, useSettingsApplication } from "../hooks/use-settings-integration";
import { AppSettings, SettingsExport } from "../types/settings.types";

// Settings context interface
interface SettingsContextType {
  settings: AppSettings;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
  updateSetting: <T extends keyof AppSettings>(
    category: T,
    key: keyof AppSettings[T],
    value: AppSettings[T][keyof AppSettings[T]]
  ) => boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => boolean;
  saveSettings: () => Promise<boolean>;
  resetCategory: (category: keyof AppSettings) => void;
  resetAllSettings: () => void;
  exportSettings: () => SettingsExport;
  importSettings: (settingsData: SettingsExport) => Promise<boolean>;
  createBackup: () => Promise<boolean>;
  restoreFromBackup: () => Promise<boolean>;
}

// Create context
const SettingsContext = createContext<SettingsContextType | null>(null);

// Provider component
interface SettingsProviderProps {
  children: ReactNode;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export function SettingsProvider({
  children,
  autoSave = true,
  autoSaveDelay = 5000
}: SettingsProviderProps) {
  const settingsHook = useSettings();

  // Initialize integrations
  useSettingsIntegration();
  useSettingsApplication();

  // Configure auto-save
  useEffect(() => {
    settingsHook.setAutoSaveEnabled(autoSave);
    settingsHook.setAutoSaveDelay(autoSaveDelay);
  }, [autoSave, autoSaveDelay, settingsHook]);

  const contextValue: SettingsContextType = {
    settings: settingsHook.settings,
    hasUnsavedChanges: settingsHook.hasUnsavedChanges,
    isLoading: settingsHook.isLoading,
    lastSaved: settingsHook.lastSaved,
    updateSetting: settingsHook.updateSetting,
    updateSettings: settingsHook.updateSettings,
    saveSettings: settingsHook.saveSettings,
    resetCategory: settingsHook.resetCategory,
    resetAllSettings: settingsHook.resetAllSettings,
    exportSettings: settingsHook.exportSettings,
    importSettings: settingsHook.importSettings,
    createBackup: settingsHook.createBackup,
    restoreFromBackup: settingsHook.restoreFromBackup,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook to use settings context
export function useSettingsContext(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettingsContext must be used within a SettingsProvider");
  }
  return context;
}

// HOC for components that need settings
export function withSettings<P extends object>(
  Component: React.ComponentType<P>
) {
  return function SettingsWrappedComponent(props: P) {
    return (
      <SettingsProvider>
        <Component {...props} />
      </SettingsProvider>
    );
  };
}
