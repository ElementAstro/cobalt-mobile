/**
 * Safety Settings Component
 * Manages safety limits and automatic responses
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
// import { Input } from "@/components/ui/input"; // Unused for now
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Shield, AlertTriangle, Thermometer, Wind, Cloud, Droplets } from "lucide-react";
import { useSettingsCategory } from "../hooks/use-settings";
import { VALIDATION_RULES } from "../constants/settings.constants";

export function SafetySettings() {
  const {
    settings,
    updateSetting,
    // validateSetting, // Unused for now
  } = useSettingsCategory("safety");

  // const validateAndUpdate = (key: keyof typeof settings, value: unknown) => {
  //   const validation = validateSetting(key, value);
  //   if (validation === true) {
  //     updateSetting(key, value);
  //     return true;
  //   } else {
  //     console.warn(`Validation failed for ${key}:`, validation);
  //     return false;
  //   }
  // };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Safety Settings
        </CardTitle>
        <CardDescription>
          Configure safety limits and automatic responses to protect your equipment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Emergency Actions */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Emergency Actions
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Park Mount on Disconnect</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically park the mount when connection is lost
                </div>
              </div>
              <Switch
                checked={settings.parkOnDisconnect}
                onCheckedChange={(checked) => updateSetting("parkOnDisconnect", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Stop on Error</Label>
                <div className="text-sm text-muted-foreground">
                  Stop sequences when errors occur
                </div>
              </div>
              <Switch
                checked={settings.stopOnError}
                onCheckedChange={(checked) => updateSetting("stopOnError", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Emergency Stop</Label>
                <div className="text-sm text-muted-foreground">
                  Enable emergency stop functionality
                </div>
              </div>
              <Switch
                checked={settings.emergencyStop}
                onCheckedChange={(checked) => updateSetting("emergencyStop", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Confirm Dangerous Actions</Label>
                <div className="text-sm text-muted-foreground">
                  Require confirmation for potentially dangerous operations
                </div>
              </div>
              <Switch
                checked={settings.confirmDangerousActions}
                onCheckedChange={(checked) => updateSetting("confirmDangerousActions", checked)}
              />
            </div>
          </div>
        </div>

        {/* Environmental Limits */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-500" />
            Environmental Limits
          </h4>
          
          <div className="space-y-4">
            {/* Temperature Limit */}
            <div className="space-y-2">
              <Label htmlFor="temperatureLimit" className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Temperature Limit: {settings.temperatureLimit}°C
              </Label>
              <Slider
                id="temperatureLimit"
                value={[settings.temperatureLimit]}
                onValueChange={(value) => updateSetting("temperatureLimit", value[0])}
                min={VALIDATION_RULES.safety.temperatureLimit.min}
                max={VALIDATION_RULES.safety.temperatureLimit.max}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{VALIDATION_RULES.safety.temperatureLimit.min}°C</span>
                <span>{VALIDATION_RULES.safety.temperatureLimit.max}°C</span>
              </div>
            </div>

            {/* Wind Speed Limit */}
            <div className="space-y-2">
              <Label htmlFor="windSpeedLimit" className="flex items-center gap-2">
                <Wind className="h-4 w-4" />
                Wind Speed Limit: {settings.windSpeedLimit} km/h
              </Label>
              <Slider
                id="windSpeedLimit"
                value={[settings.windSpeedLimit]}
                onValueChange={(value) => updateSetting("windSpeedLimit", value[0])}
                min={VALIDATION_RULES.safety.windSpeedLimit.min}
                max={VALIDATION_RULES.safety.windSpeedLimit.max}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{VALIDATION_RULES.safety.windSpeedLimit.min} km/h</span>
                <span>{VALIDATION_RULES.safety.windSpeedLimit.max} km/h</span>
              </div>
            </div>

            {/* Cloud Limit */}
            <div className="space-y-2">
              <Label htmlFor="cloudLimit" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Cloud Coverage Limit: {settings.cloudLimit}%
              </Label>
              <Slider
                id="cloudLimit"
                value={[settings.cloudLimit]}
                onValueChange={(value) => updateSetting("cloudLimit", value[0])}
                min={VALIDATION_RULES.safety.cloudLimit.min}
                max={VALIDATION_RULES.safety.cloudLimit.max}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Clear</span>
                <span>Overcast</span>
              </div>
            </div>

            {/* Humidity Limit */}
            <div className="space-y-2">
              <Label htmlFor="humidityLimit" className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Humidity Limit: {settings.humidityLimit}%
              </Label>
              <Slider
                id="humidityLimit"
                value={[settings.humidityLimit]}
                onValueChange={(value) => updateSetting("humidityLimit", value[0])}
                min={VALIDATION_RULES.safety.humidityLimit.min}
                max={VALIDATION_RULES.safety.humidityLimit.max}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Dry</span>
                <span>Very Humid</span>
              </div>
            </div>

            {/* Dew Point Margin */}
            <div className="space-y-2">
              <Label htmlFor="dewPointMargin">Dew Point Margin: {settings.dewPointMargin}°C</Label>
              <Slider
                id="dewPointMargin"
                value={[settings.dewPointMargin]}
                onValueChange={(value) => updateSetting("dewPointMargin", value[0])}
                min={VALIDATION_RULES.safety.dewPointMargin.min}
                max={VALIDATION_RULES.safety.dewPointMargin.max}
                step={0.5}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Minimum temperature difference above dew point to prevent condensation
              </div>
            </div>
          </div>
        </div>

        {/* Weather Monitoring */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Weather Monitoring</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weather Monitoring</Label>
                <div className="text-sm text-muted-foreground">
                  Monitor weather conditions automatically
                </div>
              </div>
              <Switch
                checked={settings.weatherMonitoring}
                onCheckedChange={(checked) => updateSetting("weatherMonitoring", checked)}
              />
            </div>

            {settings.weatherMonitoring && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Abort on Bad Weather</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically abort sequences when weather limits are exceeded
                  </div>
                </div>
                <Switch
                  checked={settings.autoAbortOnWeather}
                  onCheckedChange={(checked) => updateSetting("autoAbortOnWeather", checked)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Safety Timeout */}
        <div className="space-y-2">
          <Label htmlFor="safetyTimeout">Safety Timeout: {settings.safetyTimeout} seconds</Label>
          <Slider
            id="safetyTimeout"
            value={[settings.safetyTimeout]}
            onValueChange={(value) => updateSetting("safetyTimeout", value[0])}
            min={VALIDATION_RULES.safety.safetyTimeout.min}
            max={VALIDATION_RULES.safety.safetyTimeout.max}
            step={30}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{VALIDATION_RULES.safety.safetyTimeout.min}s</span>
            <span>{VALIDATION_RULES.safety.safetyTimeout.max}s</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Maximum time to wait for safety operations to complete
          </div>
        </div>

        {/* Safety Status */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <div className="font-medium mb-1 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Safety Status
            </div>
            <div className="text-muted-foreground space-y-1">
              <div>Temperature: ≤ {settings.temperatureLimit}°C</div>
              <div>Wind Speed: ≤ {settings.windSpeedLimit} km/h</div>
              <div>Cloud Coverage: ≤ {settings.cloudLimit}%</div>
              <div>Humidity: ≤ {settings.humidityLimit}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
