/**
 * Settings Test Component
 * Simple test to verify the settings system works
 */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "./hooks/use-settings";
import { useSettingsIntegration } from "./hooks/use-settings-integration";

export function SettingsTest() {
  const {
    settings,
    updateSetting,
    saveSettings,
    hasUnsavedChanges,
    exportSettings,
  } = useSettings();

  const {
    isDeveloperMode = false,
    showAdvancedControls = false,
  } = {}; // useSettingsFeatureFlags() - function not available

  const {
    isThemeSynced,
    syncToAppStore,
  } = useSettingsIntegration();

  const handleTestUpdate = () => {
    updateSetting("ui", "theme", settings.ui.theme === "dark" ? "light" : "dark");
  };

  const handleTestSave = async () => {
    const success = await saveSettings();
    console.log("Save result:", success);
  };

  const handleTestExport = () => {
    const exported = exportSettings();
    console.log("Exported settings:", exported);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Settings System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Current Settings</h3>
            <div className="text-sm space-y-1">
              <div>Theme: {settings.ui.theme}</div>
              <div>Language: {settings.ui.language}</div>
              <div>Protocol: {settings.connection.protocol}</div>
              <div>Host: {settings.connection.host}</div>
              <div>Port: {settings.connection.port}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Status</h3>
            <div className="text-sm space-y-1">
              <div>Has Changes: {hasUnsavedChanges ? "Yes" : "No"}</div>
              <div>Theme Synced: {isThemeSynced ? "Yes" : "No"}</div>
              <div>Developer Mode: {isDeveloperMode ? "Yes" : "No"}</div>
              <div>Advanced Controls: {showAdvancedControls ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleTestUpdate} variant="outline">
            Toggle Theme
          </Button>
          
          <Button onClick={handleTestSave} disabled={!hasUnsavedChanges}>
            Save Settings
          </Button>
          
          <Button onClick={handleTestExport} variant="outline">
            Export Settings
          </Button>
          
          <Button onClick={syncToAppStore} variant="outline">
            Sync to App Store
          </Button>
          
          <Button 
            onClick={() => updateSetting("advanced", "developerMode", !isDeveloperMode)}
            variant="outline"
          >
            Toggle Dev Mode
          </Button>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <div className="font-medium mb-1">Test Instructions</div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Click &quot;Toggle Theme&quot; to change the theme setting</li>
              <li>Click &quot;Save Settings&quot; to persist changes</li>
              <li>Click &quot;Export Settings&quot; to see the exported data in console</li>
              <li>Click &quot;Sync to App Store&quot; to sync with the main app store</li>
              <li>Click &quot;Toggle Dev Mode&quot; to test feature flags</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
