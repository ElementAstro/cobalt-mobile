/**
 * Advanced Settings Component
 * Manages advanced settings for power users
 */

"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { 
  Code, 
  AlertTriangle, 
  Database, 
  Activity, 
  Bug, 
  FileText,
  Download,
  // Upload, // Unused for now
  Trash2,
  RefreshCw
} from "lucide-react";
import { useSettingsCategory, useSettingsPersistence } from "../hooks/use-settings";
import { 
  LOG_LEVEL_OPTIONS,
  VALIDATION_RULES 
} from "../constants/settings.constants";

export function AdvancedSettings() {
  const {
    settings,
    updateSetting,
    validateSetting,
    resetCategory,
  } = useSettingsCategory("advanced");

  const {
    backupWithStatus,
    backupStatus,
  } = useSettingsPersistence();

  const [showDangerousSettings, setShowDangerousSettings] = useState(false);

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

  const handleClearLogs = () => {
    if (confirm("Are you sure you want to clear all logs? This action cannot be undone.")) {
      console.log("Clearing application logs...");
      // In a real implementation, this would clear the logs
    }
  };

  const handleResetAdvanced = () => {
    if (confirm("Are you sure you want to reset all advanced settings to defaults?")) {
      resetCategory();
    }
  };

  const handleExportLogs = () => {
    // In a real implementation, this would export logs
    const logs = "Sample log data...";
    const blob = new Blob([logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astro-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Advanced Settings
        </CardTitle>
        <CardDescription>
          Advanced configuration options for power users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logging Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Logging & Debugging
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logLevel">Log Level</Label>
              <Select
                value={settings.logLevel}
                onValueChange={(value) => validateAndUpdate("logLevel", value)}
              >
                <SelectTrigger id="logLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOG_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLogSize">Max Log Size (MB)</Label>
              <Input
                id="maxLogSize"
                type="number"
                value={settings.maxLogSize}
                onChange={(e) => validateAndUpdate("maxLogSize", Number(e.target.value))}
                min={VALIDATION_RULES.advanced.maxLogSize.min}
                max={VALIDATION_RULES.advanced.maxLogSize.max}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logRetentionDays">
              Log Retention: {settings.logRetentionDays} days
            </Label>
            <Slider
              id="logRetentionDays"
              value={[settings.logRetentionDays]}
              onValueChange={(value) => updateSetting("logRetentionDays", value[0])}
              min={VALIDATION_RULES.advanced.logRetentionDays.min}
              max={VALIDATION_RULES.advanced.logRetentionDays.max}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{VALIDATION_RULES.advanced.logRetentionDays.min} day</span>
              <span>{VALIDATION_RULES.advanced.logRetentionDays.max} days</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleExportLogs}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Logs
            </Button>
            <Button
              onClick={handleClearLogs}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Logs
            </Button>
          </div>
        </div>

        {/* Backup Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup & Recovery
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Backups</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically backup settings periodically
                </div>
              </div>
              <Switch
                checked={settings.backupSettings}
                onCheckedChange={(checked) => updateSetting("backupSettings", checked)}
              />
            </div>

            {settings.backupSettings && (
              <div className="space-y-2">
                <Label htmlFor="autoBackupInterval">
                  Backup Interval: {settings.autoBackupInterval} hours
                </Label>
                <Slider
                  id="autoBackupInterval"
                  value={[settings.autoBackupInterval]}
                  onValueChange={(value) => updateSetting("autoBackupInterval", value[0])}
                  min={VALIDATION_RULES.advanced.autoBackupInterval.min}
                  max={VALIDATION_RULES.advanced.autoBackupInterval.max}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 hour</span>
                  <span>1 week</span>
                </div>
              </div>
            )}

            <Button
              onClick={backupWithStatus}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={backupStatus === "creating"}
            >
              <RefreshCw className={`h-4 w-4 ${backupStatus === "creating" ? "animate-spin" : ""}`} />
              {backupStatus === "creating" ? "Creating Backup..." : "Create Backup Now"}
            </Button>
          </div>
        </div>

        {/* Performance & Monitoring */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance & Monitoring
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Performance Monitoring</Label>
                <div className="text-sm text-muted-foreground">
                  Monitor app performance and resource usage
                </div>
              </div>
              <Switch
                checked={settings.performanceMonitoring}
                onCheckedChange={(checked) => updateSetting("performanceMonitoring", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Crash Reporting</Label>
                <div className="text-sm text-muted-foreground">
                  Send crash reports to help improve the app
                </div>
              </div>
              <Switch
                checked={settings.crashReporting}
                onCheckedChange={(checked) => updateSetting("crashReporting", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Analytics</Label>
                <div className="text-sm text-muted-foreground">
                  Send anonymous usage data to improve the app
                </div>
              </div>
              <Switch
                checked={settings.analyticsEnabled}
                onCheckedChange={(checked) => updateSetting("analyticsEnabled", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxConcurrentConnections">Max Concurrent Connections</Label>
              <Input
                id="maxConcurrentConnections"
                type="number"
                value={settings.maxConcurrentConnections}
                onChange={(e) => validateAndUpdate("maxConcurrentConnections", Number(e.target.value))}
                min={VALIDATION_RULES.advanced.maxConcurrentConnections.min}
                max={VALIDATION_RULES.advanced.maxConcurrentConnections.max}
              />
            </div>
          </div>
        </div>

        {/* Developer Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Developer Settings
            </h4>
            <Button
              onClick={() => setShowDangerousSettings(!showDangerousSettings)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              {showDangerousSettings ? "Hide" : "Show"} Dangerous Settings
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Developer Mode</Label>
                <div className="text-sm text-muted-foreground">
                  Enable developer tools and debugging features
                </div>
              </div>
              <Switch
                checked={settings.developerMode}
                onCheckedChange={(checked) => updateSetting("developerMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Debug Mode</Label>
                <div className="text-sm text-muted-foreground">
                  Enable verbose debugging output
                </div>
              </div>
              <Switch
                checked={settings.debugMode}
                onCheckedChange={(checked) => updateSetting("debugMode", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Beta Features</Label>
                <div className="text-sm text-muted-foreground">
                  Enable experimental features (may be unstable)
                </div>
              </div>
              <Switch
                checked={settings.betaFeatures}
                onCheckedChange={(checked) => updateSetting("betaFeatures", checked)}
              />
            </div>

            {showDangerousSettings && (
              <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-800">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Dangerous Settings</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Custom Scripts</Label>
                      <div className="text-sm text-muted-foreground">
                        Allow execution of custom scripts (security risk)
                      </div>
                    </div>
                    <Switch
                      checked={settings.customScripts}
                      onCheckedChange={(checked) => updateSetting("customScripts", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>API Access</Label>
                      <div className="text-sm text-muted-foreground">
                        Enable external API access (security risk)
                      </div>
                    </div>
                    <Switch
                      checked={settings.apiAccess}
                      onCheckedChange={(checked) => updateSetting("apiAccess", checked)}
                    />
                  </div>

                  <Button
                    onClick={handleResetAdvanced}
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset Advanced Settings
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <div className="font-medium mb-1">System Information</div>
            <div className="text-muted-foreground space-y-1">
              <div>Log Level: {settings.logLevel.toUpperCase()}</div>
              <div>Max Log Size: {settings.maxLogSize} MB</div>
              <div>Developer Mode: {settings.developerMode ? "Enabled" : "Disabled"}</div>
              <div>Debug Mode: {settings.debugMode ? "Enabled" : "Disabled"}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
