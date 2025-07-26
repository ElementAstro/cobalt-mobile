/**
 * UI Settings Component
 * Manages user interface and appearance settings
 */

"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Palette, Volume2, Bell, Smartphone, Type } from "lucide-react";
import { useSettingsCategory } from "../hooks/use-settings";
import { 
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  UNITS_OPTIONS,
  DATE_FORMAT_OPTIONS,
  VALIDATION_RULES
} from "../constants/settings.constants";

export function UISettings() {
  const {
    settings,
    updateSetting,
    validateSetting,
  } = useSettingsCategory("ui");

  const validateAndUpdate = (key: keyof typeof settings, value: unknown) => {
    const validation = validateSetting(key, value as any);
    if (validation === true) {
      updateSetting(key, value as any);
      return true;
    } else {
      console.warn(`Validation failed for ${key}:`, validation);
      return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          User Interface
        </CardTitle>
        <CardDescription>
          Customize the app appearance and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme and Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(value) => validateAndUpdate("theme", value)}
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={settings.language}
              onValueChange={(value) => validateAndUpdate("language", value)}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Units and Date Format */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="units">Units</Label>
            <Select
              value={settings.units}
              onValueChange={(value) => validateAndUpdate("units", value)}
            >
              <SelectTrigger id="units">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={settings.dateFormat}
              onValueChange={(value) => validateAndUpdate("dateFormat", value)}
            >
              <SelectTrigger id="dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Time Format and Font Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select
              value={settings.timeFormat}
              onValueChange={(value) => validateAndUpdate("timeFormat", value)}
            >
              <SelectTrigger id="timeFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12 Hour</SelectItem>
                <SelectItem value="24h">24 Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fontSize">Font Size</Label>
            <Select
              value={settings.fontSize}
              onValueChange={(value) => validateAndUpdate("fontSize", value)}
            >
              <SelectTrigger id="fontSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">
                  <div className="flex items-center gap-2">
                    <Type className="h-3 w-3" />
                    Small
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Medium
                  </div>
                </SelectItem>
                <SelectItem value="large">
                  <div className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Large
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications and Sounds */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications & Sounds
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Show system notifications for important events
                </div>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting("notifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Sounds</Label>
                <div className="text-sm text-muted-foreground">
                  Play audio alerts for events
                </div>
              </div>
              <Switch
                checked={settings.sounds}
                onCheckedChange={(checked) => updateSetting("sounds", checked)}
              />
            </div>

            {settings.sounds && (
              <div className="space-y-2">
                <Label htmlFor="volume" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Volume: {settings.volume}%
                </Label>
                <Slider
                  id="volume"
                  value={[settings.volume]}
                  onValueChange={(value) => updateSetting("volume", value[0])}
                  max={VALIDATION_RULES.ui.volume.max}
                  min={VALIDATION_RULES.ui.volume.min}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mute</span>
                  <span>Max</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interface Behavior */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Interface Behavior
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Haptic Feedback</Label>
                <div className="text-sm text-muted-foreground">
                  Vibrate on touch interactions (mobile only)
                </div>
              </div>
              <Switch
                checked={settings.hapticFeedback}
                onCheckedChange={(checked) => updateSetting("hapticFeedback", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Animations</Label>
                <div className="text-sm text-muted-foreground">
                  Enable smooth transitions and animations
                </div>
              </div>
              <Switch
                checked={settings.animations}
                onCheckedChange={(checked) => updateSetting("animations", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <div className="text-sm text-muted-foreground">
                  Use smaller spacing and controls
                </div>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(checked) => updateSetting("compactMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Advanced Controls</Label>
                <div className="text-sm text-muted-foreground">
                  Display advanced options by default
                </div>
              </div>
              <Switch
                checked={settings.showAdvancedControls}
                onCheckedChange={(checked) => updateSetting("showAdvancedControls", checked)}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <div className="font-medium mb-1">Preview</div>
            <div className="text-muted-foreground">
              Theme: {settings.theme} • Language: {LANGUAGE_OPTIONS.find(l => l.value === settings.language)?.label} • 
              Units: {settings.units} • Font: {settings.fontSize}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
