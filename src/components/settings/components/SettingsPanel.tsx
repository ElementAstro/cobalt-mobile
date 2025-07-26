/**
 * Main Settings Panel Component
 * Provides tabbed navigation and manages all settings categories
 */

"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Search,
  Wifi,
  Palette,
  Camera,
  Shield,
  Code,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { ConnectionSettings } from "./ConnectionSettings";
import { UISettings } from "./UISettings";
import { ImagingSettings } from "./ImagingSettings";
import { SafetySettings } from "./SafetySettings";
import { AdvancedSettings } from "./AdvancedSettings";
import { useSettings, useSettingsPersistence, useSettingsValidation } from "../hooks/use-settings";
// import { useSettingsFeatureFlags } from "../hooks/use-settings-integration"; // Unused for now
import { SETTINGS_CATEGORIES } from "../constants/settings.constants";

// Icon mapping for categories
const CATEGORY_ICONS = {
  connection: Wifi,
  ui: Palette,
  imaging: Camera,
  equipment: Settings,
  safety: Shield,
  advanced: Code,
} as const;

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState("connection");
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    // settings, // Unused for now
    // resetCategory, // Unused for now
    resetAllSettings,
    exportSettings,
    importSettings,
  } = useSettings();

  const {
    hasUnsavedChanges,
    saveStatus,
    saveWithStatus,
    // backupWithStatus, // Unused for now
  } = useSettingsPersistence();

  const {
    hasErrors,
    hasWarnings,
    errors,
    warnings,
    isValid,
  } = useSettingsValidation();

  // const { isDeveloperMode } = useSettingsFeatureFlags(); // Unused for now

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return SETTINGS_CATEGORIES;
    
    return SETTINGS_CATEGORIES.filter(category =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Handle settings export
  const handleExport = () => {
    const settingsData = exportSettings();
    const blob = new Blob([JSON.stringify(settingsData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astro-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle settings import
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const settingsData = JSON.parse(text);
          const success = await importSettings(settingsData);
          if (success) {
            console.log("Settings imported successfully");
          } else {
            console.error("Failed to import settings");
          }
        } catch (error) {
          console.error("Error importing settings:", error);
        }
      }
    };
    input.click();
  };

  // Get save button status
  const getSaveButtonStatus = () => {
    switch (saveStatus) {
      case "saving":
        return { text: "Saving...", disabled: true, icon: Clock };
      case "success":
        return { text: "Saved", disabled: false, icon: CheckCircle };
      case "error":
        return { text: "Error", disabled: false, icon: AlertCircle };
      default:
        return { text: "Save Settings", disabled: !hasUnsavedChanges || !isValid, icon: Save };
    }
  };

  const saveButtonStatus = getSaveButtonStatus();
  const SaveIcon = saveButtonStatus.icon;

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={saveWithStatus}
                disabled={saveButtonStatus.disabled}
                className="flex items-center gap-2"
                variant={saveStatus === "error" ? "destructive" : "default"}
              >
                <SaveIcon className="h-4 w-4" />
                {saveButtonStatus.text}
              </Button>
              
              <Button
                onClick={handleExport}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              
              <Button
                onClick={handleImport}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              
              <Button
                onClick={() => resetAllSettings()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset All
              </Button>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex gap-2 mt-4">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Unsaved Changes
              </Badge>
            )}
            
            {hasErrors && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.length} Error{errors.length !== 1 ? 's' : ''}
              </Badge>
            )}
            
            {hasWarnings && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
              </Badge>
            )}
            
            {isValid && !hasUnsavedChanges && (
              <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                All Settings Valid
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {filteredCategories.map((category) => {
            const Icon = CATEGORY_ICONS[category.id] || Settings;
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{category.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <ConnectionSettings />
        </TabsContent>

        <TabsContent value="ui" className="space-y-4">
          <UISettings />
        </TabsContent>

        <TabsContent value="imaging" className="space-y-4">
          <ImagingSettings />
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                Equipment settings component coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <SafetySettings />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <AdvancedSettings />
        </TabsContent>
      </Tabs>

      {/* Validation errors/warnings display */}
      {(hasErrors || hasWarnings) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {hasErrors && (
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-2">Validation Errors</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {hasWarnings && (
                <div>
                  <h4 className="text-sm font-medium text-orange-600 mb-2">Warnings</h4>
                  <ul className="text-sm text-orange-600 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
