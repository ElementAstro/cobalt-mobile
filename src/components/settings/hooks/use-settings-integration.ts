/**
 * Settings Integration Hook
 * Bridges the new settings system with the existing app store
 */

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useSettingsStore } from "../store/settings.store";
import { Theme, Language, ConnectionInterface } from "../types/settings.types";

/**
 * Hook to sync settings between the new settings system and the existing app store
 */
export function useSettingsIntegration() {
  const {
    // App store getters
    theme: appTheme,
    language: appLanguage,
    connectionType: appConnectionType,
    isDarkMode: appIsDarkMode,
    
    // App store setters
    setTheme: setAppTheme,
    setLanguage: setAppLanguage,
    setConnectionType: setAppConnectionType,
    setIsDarkMode: setAppIsDarkMode,
  } = useAppStore();

  const {
    settings,
    updateSetting,
    loadSettings,
  } = useSettingsStore();

  // Sync from app store to settings store on mount
  useEffect(() => {
    loadSettings().then(() => {
      // Only sync if settings are different to avoid loops
      if (settings.ui.theme !== appTheme) {
        updateSetting("ui", "theme", appTheme as Theme);
      }
      if (settings.ui.language !== appLanguage) {
        updateSetting("ui", "language", appLanguage as Language);
      }
      if (settings.connection.interface !== appConnectionType) {
        updateSetting("connection", "interface", appConnectionType as ConnectionInterface);
      }
    });
  }, [
    appConnectionType,
    appLanguage,
    appTheme,
    loadSettings,
    settings.connection.interface,
    settings.ui.language,
    settings.ui.theme,
    updateSetting
  ]);

  // Sync from settings store to app store when settings change
  useEffect(() => {
    if (settings.ui.theme !== appTheme) {
      setAppTheme(settings.ui.theme as Theme);
    }
  }, [settings.ui.theme, appTheme, setAppTheme]);

  useEffect(() => {
    if (settings.ui.language !== appLanguage) {
      setAppLanguage(settings.ui.language as Language);
    }
  }, [settings.ui.language, appLanguage, setAppLanguage]);

  useEffect(() => {
    if (settings.connection.interface !== appConnectionType) {
      setAppConnectionType(settings.connection.interface as ConnectionInterface);
    }
  }, [settings.connection.interface, appConnectionType, setAppConnectionType]);

  // Handle dark mode based on theme setting
  useEffect(() => {
    let shouldBeDark = appIsDarkMode;
    
    if (settings.ui.theme === "dark") {
      shouldBeDark = true;
    } else if (settings.ui.theme === "light") {
      shouldBeDark = false;
    } else if (settings.ui.theme === "auto") {
      // Check system preference
      shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    if (shouldBeDark !== appIsDarkMode) {
      setAppIsDarkMode(shouldBeDark);
    }
  }, [settings.ui.theme, appIsDarkMode, setAppIsDarkMode]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (settings.ui.theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = (e: MediaQueryListEvent) => {
        setAppIsDarkMode(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }
  }, [settings.ui.theme, setAppIsDarkMode]);

  return {
    // Expose current sync status
    isThemeSynced: settings.ui.theme === appTheme,
    isLanguageSynced: settings.ui.language === appLanguage,
    isConnectionSynced: settings.connection.interface === appConnectionType,
    
    // Manual sync functions
    syncToAppStore: () => {
      setAppTheme(settings.ui.theme as Theme);
      setAppLanguage(settings.ui.language as Language);
      setAppConnectionType(settings.connection.interface as ConnectionInterface);
    },
    
    syncFromAppStore: () => {
      updateSetting("ui", "theme", appTheme as Theme);
      updateSetting("ui", "language", appLanguage as Language);
      updateSetting("connection", "interface", appConnectionType as ConnectionInterface);
    },
  };
}

/**
 * Hook to apply settings to the document/app
 */
export function useSettingsApplication() {
  const { settings } = useSettingsStore();

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    
    switch (settings.ui.fontSize) {
      case "small":
        root.style.fontSize = "14px";
        break;
      case "large":
        root.style.fontSize = "18px";
        break;
      default:
        root.style.fontSize = "16px";
        break;
    }
  }, [settings.ui.fontSize]);

  // Apply compact mode
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.ui.compactMode) {
      root.classList.add("compact-mode");
    } else {
      root.classList.remove("compact-mode");
    }
  }, [settings.ui.compactMode]);

  // Apply animations setting
  useEffect(() => {
    const root = document.documentElement;
    
    if (!settings.ui.animations) {
      root.classList.add("no-animations");
    } else {
      root.classList.remove("no-animations");
    }
  }, [settings.ui.animations]);

  // Apply haptic feedback setting (for mobile)
  useEffect(() => {
    if ("vibrate" in navigator && !settings.ui.hapticFeedback) {
      // Disable haptic feedback by overriding vibrate
      const originalVibrate = navigator.vibrate;
      navigator.vibrate = () => false;
      
      return () => {
        navigator.vibrate = originalVibrate;
      };
    }
  }, [settings.ui.hapticFeedback]);

  return {
    appliedSettings: {
      fontSize: settings.ui.fontSize,
      compactMode: settings.ui.compactMode,
      animations: settings.ui.animations,
      hapticFeedback: settings.ui.hapticFeedback,
    },
  };
}

/**
 * Hook for settings-based feature flags
 */
export function useSettingsFeatureFlags() {
  const { settings } = useSettingsStore();

  return {
    // Developer features
    isDeveloperMode: settings.advanced.developerMode,
    isDebugMode: settings.advanced.debugMode,
    areBetaFeaturesEnabled: settings.advanced.betaFeatures,
    areCustomScriptsEnabled: settings.advanced.customScripts,
    isApiAccessEnabled: settings.advanced.apiAccess,
    
    // UI features
    showAdvancedControls: settings.ui.showAdvancedControls,
    
    // Safety features
    isWeatherMonitoringEnabled: settings.safety.weatherMonitoring,
    shouldConfirmDangerousActions: settings.safety.confirmDangerousActions,
    
    // Performance features
    isPerformanceMonitoringEnabled: settings.advanced.performanceMonitoring,
    isCrashReportingEnabled: settings.advanced.crashReporting,
    isAnalyticsEnabled: settings.advanced.analyticsEnabled,
  };
}

/**
 * Hook for settings-based notifications
 */
export function useSettingsNotifications() {
  const { settings } = useSettingsStore();

  const canShowNotifications = settings.ui.notifications && "Notification" in window;
  const canPlaySounds = settings.ui.sounds;
  const volume = settings.ui.volume / 100; // Convert to 0-1 range

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!canShowNotifications) return;

    if (Notification.permission === "granted") {
      new Notification(title, options);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, options);
        }
      });
    }
  };

  const playSound = (frequency: number = 800, duration: number = 200) => {
    if (!canPlaySounds || volume === 0) return;

    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn("Could not play sound:", error);
    }
  };

  const vibrate = (pattern: number | number[] = 200) => {
    if (settings.ui.hapticFeedback && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return {
    canShowNotifications,
    canPlaySounds,
    volume,
    showNotification,
    playSound,
    vibrate,
    
    // Convenience methods
    notifySuccess: (message: string) => {
      showNotification("Success", { body: message, icon: "/success-icon.png" });
      playSound(600, 150);
      vibrate(100);
    },
    
    notifyError: (message: string) => {
      showNotification("Error", { body: message, icon: "/error-icon.png" });
      playSound(300, 300);
      vibrate([100, 50, 100]);
    },
    
    notifyWarning: (message: string) => {
      showNotification("Warning", { body: message, icon: "/warning-icon.png" });
      playSound(450, 200);
      vibrate(150);
    },
  };
}
