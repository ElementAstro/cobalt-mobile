"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/lib/stores/user-store';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Camera,
  Download,
  Upload,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle,
  Monitor,
  Smartphone,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Wifi,
  Bluetooth,
  Usb,
} from 'lucide-react';

interface EnhancedSettingsPanelProps {
  className?: string;
  onClose?: () => void;
}

export function EnhancedSettingsPanel({ className, onClose }: EnhancedSettingsPanelProps) {
  const { 
    profile, 
    preferences, 
    updatePreferences, 
    isLoading, 
    error 
  } = useUserStore();
  
  const {
    theme,
    language,
    connectionType,
    setTheme,
    setLanguage,
    setConnectionType,
  } = useAppStore();

  const { announce } = useAccessibility();
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);

  // Handle preference updates
  const handlePreferenceUpdate = useCallback((updates: any) => {
    setLocalPreferences(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Save preferences
  const handleSave = useCallback(async () => {
    const success = await updatePreferences(localPreferences);
    if (success) {
      setHasUnsavedChanges(false);
      announce('Settings saved successfully');
    } else {
      announce('Failed to save settings');
    }
  }, [localPreferences, updatePreferences, announce]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      setLocalPreferences(preferences);
      setHasUnsavedChanges(false);
      announce('Settings reset to defaults');
    }
  }, [preferences, announce]);

  // Export settings
  const handleExport = useCallback(() => {
    const settingsData = {
      preferences: localPreferences,
      appSettings: { theme, language, connectionType },
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
    
    const blob = new Blob([JSON.stringify(settingsData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cobalt-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    announce('Settings exported successfully');
  }, [localPreferences, theme, language, connectionType, announce]);

  // Import settings
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settingsData = JSON.parse(e.target?.result as string);
        
        if (settingsData.preferences) {
          setLocalPreferences(settingsData.preferences);
          setHasUnsavedChanges(true);
        }
        
        if (settingsData.appSettings) {
          const { theme: importedTheme, language: importedLanguage, connectionType: importedConnection } = settingsData.appSettings;
          if (importedTheme) setTheme(importedTheme);
          if (importedLanguage) setLanguage(importedLanguage);
          if (importedConnection) setConnectionType(importedConnection);
        }
        
        announce('Settings imported successfully');
      } catch (error) {
        announce('Failed to import settings - invalid file format');
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  }, [setTheme, setLanguage, setConnectionType, announce]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("w-full max-w-4xl mx-auto space-y-6", className)}
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings & Preferences
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600">
                  Unsaved Changes
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
              
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ×
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-destructive">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Equipment
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language */}
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={language}
                  onValueChange={(value: any) => {
                    setLanguage(value);
                    setHasUnsavedChanges(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Units */}
              <div className="space-y-2">
                <Label>Units</Label>
                <Select
                  value={localPreferences.units}
                  onValueChange={(value: 'metric' | 'imperial') =>
                    handlePreferenceUpdate({ units: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (°C, km, kg)</SelectItem>
                    <SelectItem value="imperial">Imperial (°F, mi, lb)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Format */}
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  value={localPreferences.dateFormat}
                  onValueChange={(value: any) =>
                    handlePreferenceUpdate({ dateFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Format */}
              <div className="space-y-2">
                <Label>Time Format</Label>
                <Select
                  value={localPreferences.timeFormat}
                  onValueChange={(value: '12h' | '24h') =>
                    handlePreferenceUpdate({ timeFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Connection Type */}
              <div className="space-y-2">
                <Label>Preferred Connection</Label>
                <Select
                  value={connectionType}
                  onValueChange={(value: any) => {
                    setConnectionType(value);
                    setHasUnsavedChanges(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wifi">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        Wi-Fi
                      </div>
                    </SelectItem>
                    <SelectItem value="bluetooth">
                      <div className="flex items-center gap-2">
                        <Bluetooth className="h-4 w-4" />
                        Bluetooth
                      </div>
                    </SelectItem>
                    <SelectItem value="usb">
                      <div className="flex items-center gap-2">
                        <Usb className="h-4 w-4" />
                        USB
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance & Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={theme}
                  onValueChange={(value: any) => {
                    setTheme(value);
                    setHasUnsavedChanges(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Auto (System)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Display Options */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Display Options</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compactMode">Compact Mode</Label>
                    <Switch
                      id="compactMode"
                      checked={localPreferences.privacy.shareData} // Placeholder
                      onCheckedChange={(checked) =>
                        handlePreferenceUpdate({ compactMode: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="animations">Enable Animations</Label>
                    <Switch
                      id="animations"
                      checked={true} // Placeholder
                      onCheckedChange={(checked) =>
                        handlePreferenceUpdate({ animations: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="highContrast">High Contrast</Label>
                    <Switch
                      id="highContrast"
                      checked={false} // Placeholder
                      onCheckedChange={(checked) =>
                        handlePreferenceUpdate({ highContrast: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label className="font-medium">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Master switch for all notifications
                  </p>
                </div>
                <Switch
                  checked={localPreferences.notifications.inApp}
                  onCheckedChange={(checked) =>
                    handlePreferenceUpdate({
                      notifications: {
                        ...localPreferences.notifications,
                        inApp: checked,
                      },
                    })
                  }
                />
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Notification Types</Label>
                <div className="space-y-3">
                  {Object.entries(localPreferences.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) =>
                          handlePreferenceUpdate({
                            notifications: {
                              ...localPreferences.notifications,
                              [key]: checked,
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Control who can see your profile
                    </p>
                  </div>
                  <Select
                    value={localPreferences.privacy.profileVisibility}
                    onValueChange={(value: any) =>
                      handlePreferenceUpdate({
                        privacy: {
                          ...localPreferences.privacy,
                          profileVisibility: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Share Usage Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the app by sharing anonymous usage data
                    </p>
                  </div>
                  <Switch
                    checked={localPreferences.privacy.shareData}
                    onCheckedChange={(checked) =>
                      handlePreferenceUpdate({
                        privacy: {
                          ...localPreferences.privacy,
                          shareData: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow analytics to help us understand app usage
                    </p>
                  </div>
                  <Switch
                    checked={localPreferences.privacy.analytics}
                    onCheckedChange={(checked) =>
                      handlePreferenceUpdate({
                        privacy: {
                          ...localPreferences.privacy,
                          analytics: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Settings */}
        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Connect Equipment</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically connect to known equipment on startup
                    </p>
                  </div>
                  <Switch
                    checked={localPreferences.equipment.autoConnect}
                    onCheckedChange={(checked) =>
                      handlePreferenceUpdate({
                        equipment: {
                          ...localPreferences.equipment,
                          autoConnect: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Simulation Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use simulated equipment for testing and development
                    </p>
                  </div>
                  <Switch
                    checked={localPreferences.equipment.simulationMode}
                    onCheckedChange={(checked) =>
                      handlePreferenceUpdate({
                        equipment: {
                          ...localPreferences.equipment,
                          simulationMode: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Settings
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Settings
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
