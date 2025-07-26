/**
 * Connection Settings Component
 * Manages connection-related settings
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
import { Wifi, Bluetooth, Usb, Settings, AlertCircle } from "lucide-react";
import { useSettingsCategory } from "../hooks/use-settings";
import { 
  PROTOCOL_OPTIONS, 
  CONNECTION_INTERFACE_OPTIONS,
  VALIDATION_RULES 
} from "../constants/settings.constants";

export function ConnectionSettings() {
  const {
    settings,
    updateSetting,
    validateSetting,
    // resetCategory, // Unused for now
  } = useSettingsCategory("connection");

  const getInterfaceIcon = (interfaceType: string) => {
    switch (interfaceType) {
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      case "bluetooth":
        return <Bluetooth className="h-4 w-4" />;
      case "usb":
        return <Usb className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

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
          <Wifi className="h-5 w-5" />
          Connection Settings
        </CardTitle>
        <CardDescription>
          Configure how the app connects to your equipment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Protocol and Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="protocol">Protocol</Label>
            <Select
              value={settings.protocol}
              onValueChange={(value) => validateAndUpdate("protocol", value)}
            >
              <SelectTrigger id="protocol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROTOCOL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interface">Interface</Label>
            <Select
              value={settings.interface}
              onValueChange={(value) => validateAndUpdate("interface", value)}
            >
              <SelectTrigger id="interface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONNECTION_INTERFACE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {getInterfaceIcon(option.value)}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Host and Port */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="host">Host Address</Label>
            <Input
              id="host"
              value={settings.host}
              onChange={(e) => validateAndUpdate("host", e.target.value)}
              placeholder="192.168.1.100"
              className={
                validateSetting("host", settings.host) !== true
                  ? "border-red-500"
                  : ""
              }
            />
            {validateSetting("host", settings.host) !== true && (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <AlertCircle className="h-3 w-3" />
                {validateSetting("host", settings.host)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              value={settings.port}
              onChange={(e) => validateAndUpdate("port", Number(e.target.value))}
              min={VALIDATION_RULES.connection.port.min}
              max={VALIDATION_RULES.connection.port.max}
              className={
                validateSetting("port", settings.port) !== true
                  ? "border-red-500"
                  : ""
              }
            />
            {validateSetting("port", settings.port) !== true && (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <AlertCircle className="h-3 w-3" />
                {validateSetting("port", settings.port)}
              </div>
            )}
          </div>
        </div>

        {/* Timeout */}
        <div className="space-y-2">
          <Label htmlFor="timeout">
            Connection Timeout: {settings.timeout} seconds
          </Label>
          <Slider
            id="timeout"
            value={[settings.timeout]}
            onValueChange={(value) => validateAndUpdate("timeout", value[0])}
            min={VALIDATION_RULES.connection.timeout.min}
            max={VALIDATION_RULES.connection.timeout.max}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{VALIDATION_RULES.connection.timeout.min}s</span>
            <span>{VALIDATION_RULES.connection.timeout.max}s</span>
          </div>
        </div>

        {/* Advanced Connection Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Advanced Settings</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Reconnect</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically reconnect when connection is lost
                </div>
              </div>
              <Switch
                checked={settings.autoReconnect}
                onCheckedChange={(checked) => updateSetting("autoReconnect", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Keep Alive</Label>
                <div className="text-sm text-muted-foreground">
                  Send periodic keep-alive messages
                </div>
              </div>
              <Switch
                checked={settings.keepAlive}
                onCheckedChange={(checked) => updateSetting("keepAlive", checked)}
              />
            </div>

            {settings.autoReconnect && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxRetries">Max Retries</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={settings.maxRetries}
                    onChange={(e) => validateAndUpdate("maxRetries", Number(e.target.value))}
                    min={VALIDATION_RULES.connection.maxRetries.min}
                    max={VALIDATION_RULES.connection.maxRetries.max}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retryDelay">Retry Delay (seconds)</Label>
                  <Input
                    id="retryDelay"
                    type="number"
                    value={settings.retryDelay}
                    onChange={(e) => validateAndUpdate("retryDelay", Number(e.target.value))}
                    min={VALIDATION_RULES.connection.retryDelay.min}
                    max={VALIDATION_RULES.connection.retryDelay.max}
                  />
                </div>
              </div>
            )}

            {settings.keepAlive && (
              <div className="space-y-2">
                <Label htmlFor="keepAliveInterval">
                  Keep Alive Interval: {settings.keepAliveInterval} seconds
                </Label>
                <Slider
                  id="keepAliveInterval"
                  value={[settings.keepAliveInterval]}
                  onValueChange={(value) => updateSetting("keepAliveInterval", value[0])}
                  min={VALIDATION_RULES.connection.keepAliveInterval.min}
                  max={VALIDATION_RULES.connection.keepAliveInterval.max}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{VALIDATION_RULES.connection.keepAliveInterval.min}s</span>
                  <span>{VALIDATION_RULES.connection.keepAliveInterval.max}s</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <div className="font-medium mb-1">Current Configuration</div>
            <div className="text-muted-foreground">
              {settings.protocol.toUpperCase()} via {settings.interface.toUpperCase()} 
              {settings.interface !== "usb" && ` at ${settings.host}:${settings.port}`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
