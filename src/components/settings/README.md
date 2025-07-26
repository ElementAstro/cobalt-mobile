# Settings System Documentation

## Overview

The new modular settings system provides a comprehensive, type-safe, and maintainable way to manage application settings. It replaces the monolithic `settings-panel.tsx` with a well-architected system that includes validation, persistence, migration, and integration with the existing app store.

## Architecture

### Core Components

```
src/components/settings/
├── components/           # React components
│   ├── SettingsPanel.tsx        # Main settings panel with tabs
│   ├── SettingsProvider.tsx     # React context provider
│   ├── ConnectionSettings.tsx   # Connection settings component
│   ├── UISettings.tsx          # UI settings component
│   ├── ImagingSettings.tsx     # Imaging settings component
│   ├── SafetySettings.tsx      # Safety settings component
│   └── AdvancedSettings.tsx    # Advanced settings component
├── hooks/               # Custom hooks
│   ├── use-settings.ts          # Main settings hooks
│   └── use-settings-integration.ts # App store integration
├── store/               # State management
│   └── settings.store.ts        # Zustand store
├── types/               # TypeScript types
│   └── settings.types.ts        # All type definitions
├── constants/           # Constants and defaults
│   └── settings.constants.ts    # Default values and options
├── utils/               # Utility functions
│   ├── settings.validation.ts   # Validation logic
│   └── settings.migration.ts    # Migration utilities
└── index.ts            # Main exports
```

## Key Features

### 1. Type Safety
- Comprehensive TypeScript types for all settings
- Compile-time validation of setting keys and values
- Type-safe hooks and components

### 2. Validation
- Real-time validation of setting values
- Range validation for numeric values
- Format validation for strings (IP addresses, etc.)
- Cross-setting compatibility checks

### 3. Persistence
- Automatic saving with configurable delay
- Manual save/load functionality
- Settings versioning for migration
- Backup and restore capabilities

### 4. Migration
- Automatic migration between settings versions
- Backward compatibility with old settings format
- Safe fallback to defaults on migration failure

### 5. Integration
- Seamless integration with existing app store
- Automatic synchronization of shared settings
- Feature flags based on settings
- Settings-based notifications and UI behavior

## Usage

### Basic Usage

```tsx
import { SettingsPanel, SettingsProvider } from "@/components/settings";

function App() {
  return (
    <SettingsProvider autoSave={true} autoSaveDelay={3000}>
      <SettingsPanel />
    </SettingsProvider>
  );
}
```

### Using Settings Hooks

```tsx
import { useSettings, useSettingsCategory, useSetting } from "@/components/settings";

function MyComponent() {
  // Access all settings
  const { settings, updateSetting, saveSettings } = useSettings();
  
  // Access specific category
  const { settings: uiSettings, updateSetting: updateUI } = useSettingsCategory("ui");
  
  // Access specific setting
  const [theme, setTheme] = useSetting("ui", "theme");
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>Set Dark Theme</button>
    </div>
  );
}
```

### Feature Flags

```tsx
import { useSettingsFeatureFlags } from "@/components/settings";

function AdvancedFeature() {
  const { isDeveloperMode, showAdvancedControls } = useSettingsFeatureFlags();
  
  if (!isDeveloperMode) return null;
  
  return <div>Advanced developer features</div>;
}
```

### Notifications

```tsx
import { useSettingsNotifications } from "@/components/settings";

function MyComponent() {
  const { notifySuccess, notifyError, playSound } = useSettingsNotifications();
  
  const handleSuccess = () => {
    notifySuccess("Operation completed successfully!");
    playSound(600, 150); // frequency, duration
  };
}
```

## Settings Categories

### Connection Settings
- Protocol (ASCOM/INDI)
- Interface (WiFi/Bluetooth/USB)
- Host and port configuration
- Connection timeouts and retries
- Keep-alive settings

### UI Settings
- Theme (light/dark/auto)
- Language selection
- Units (metric/imperial)
- Date and time formats
- Notifications and sounds
- Font size and layout options

### Imaging Settings
- File formats and compression
- Save locations and filename templates
- Image processing options
- Backup settings

### Safety Settings
- Environmental limits (temperature, wind, clouds, humidity)
- Emergency actions
- Weather monitoring
- Safety timeouts

### Advanced Settings
- Logging configuration
- Performance monitoring
- Developer features
- Backup and recovery
- Dangerous settings (with confirmation)

## Validation Rules

Settings are validated according to rules defined in `settings.constants.ts`:

```typescript
export const VALIDATION_RULES = {
  connection: {
    port: { min: 1, max: 65535 },
    timeout: { min: 5, max: 300 },
    // ...
  },
  // ...
};
```

## Migration

The system automatically migrates settings from older versions:

```typescript
// Check if migration is needed
const needsMigration = needsMigration(oldSettings);

// Perform migration
const migratedSettings = migrateSettings(oldSettings);
```

## Integration with App Store

The settings system integrates with the existing Zustand app store:

- Theme settings sync with app theme
- Language settings sync with app language
- Connection settings sync with app connection type
- Automatic dark mode detection for "auto" theme

## Best Practices

### 1. Adding New Settings
1. Add the setting to the appropriate interface in `settings.types.ts`
2. Add default value in `settings.constants.ts`
3. Add validation rules if needed
4. Update the appropriate settings component
5. Add migration logic if changing existing settings

### 2. Validation
- Always validate user input
- Provide clear error messages
- Use type-safe validation functions

### 3. Performance
- Use `useSettingsCategory` for components that only need specific settings
- Use `useSetting` for components that only need a single setting
- Avoid unnecessary re-renders by being specific about dependencies

### 4. Testing
- Test settings validation
- Test migration between versions
- Test integration with app store
- Test persistence and backup/restore

## API Reference

### Hooks

#### `useSettings()`
Main hook providing access to all settings functionality.

#### `useSettingsCategory(category)`
Hook for accessing a specific settings category.

#### `useSetting(category, key)`
Hook for accessing a single setting value.

#### `useSettingsValidation()`
Hook for accessing validation status and errors.

#### `useSettingsPersistence()`
Hook for managing settings persistence.

#### `useSettingsIntegration()`
Hook for app store integration.

#### `useSettingsFeatureFlags()`
Hook for feature flags based on settings.

#### `useSettingsNotifications()`
Hook for settings-based notifications.

### Components

#### `<SettingsProvider>`
Context provider that must wrap components using settings.

#### `<SettingsPanel>`
Main settings panel with tabbed interface.

#### Individual setting components
- `<ConnectionSettings>`
- `<UISettings>`
- `<ImagingSettings>`
- `<SafetySettings>`
- `<AdvancedSettings>`

## Troubleshooting

### Common Issues

1. **Settings not persisting**: Check that `SettingsProvider` is properly configured
2. **Validation errors**: Check validation rules in constants
3. **Migration failures**: Check migration logic and fallback to defaults
4. **Integration issues**: Verify app store integration hooks are called

### Debug Mode

Enable developer mode in advanced settings to access debug features:
- Verbose logging
- Settings export/import
- Manual backup/restore
- Validation details

## Future Enhancements

- Settings search functionality
- Settings categories grouping
- Custom validation rules
- Settings templates
- Cloud synchronization
- Settings history and rollback
