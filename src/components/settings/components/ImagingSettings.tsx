/**
 * Imaging Settings Component
 * Manages image capture and processing settings
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
  Camera, 
  FolderOpen, 
  FileImage, 
  Settings2,
  Info,
  AlertCircle
} from "lucide-react";
import { useSettingsCategory } from "../hooks/use-settings";
import { 
  IMAGE_FORMAT_OPTIONS,
  VALIDATION_RULES,
  DEFAULT_FILENAME_TEMPLATES,
  FILENAME_TEMPLATE_VARIABLES
} from "../constants/settings.constants";

export function ImagingSettings() {
  const {
    settings,
    updateSetting,
    validateSetting,
  } = useSettingsCategory("imaging");

  const [showTemplateHelp, setShowTemplateHelp] = useState(false);

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

  const handleBrowseFolder = () => {
    // In a real implementation, this would open a folder picker
    console.log("Opening folder picker...");
  };

  const handleTemplateSelect = (template: string) => {
    updateSetting("filenameTemplate", template);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Imaging Settings
        </CardTitle>
        <CardDescription>
          Configure image capture and processing settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            File Settings
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Save</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically save captured images
                </div>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting("autoSave", checked)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="saveFormat">Save Format</Label>
                <Select
                  value={settings.saveFormat}
                  onValueChange={(value) => validateAndUpdate("saveFormat", value)}
                >
                  <SelectTrigger id="saveFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => validateAndUpdate("maxFileSize", Number(e.target.value))}
                  min={VALIDATION_RULES.imaging.maxFileSize.min}
                  max={VALIDATION_RULES.imaging.maxFileSize.max}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saveLocation">Save Location</Label>
              <div className="flex gap-2">
                <Input
                  id="saveLocation"
                  value={settings.saveLocation}
                  onChange={(e) => validateAndUpdate("saveLocation", e.target.value)}
                  placeholder="/storage/astrophotography"
                  className="flex-1"
                />
                <Button
                  onClick={handleBrowseFolder}
                  variant="outline"
                  size="icon"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filename Template */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Filename Template</h4>
            <Button
              onClick={() => setShowTemplateHelp(!showTemplateHelp)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              {showTemplateHelp ? "Hide" : "Show"} Help
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="filenameTemplate">Template</Label>
            <Input
              id="filenameTemplate"
              value={settings.filenameTemplate}
              onChange={(e) => validateAndUpdate("filenameTemplate", e.target.value)}
              placeholder="{target}_{filter}_{timestamp}"
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <div className="grid grid-cols-1 gap-2">
              {DEFAULT_FILENAME_TEMPLATES.map((template, index) => (
                <Button
                  key={index}
                  onClick={() => handleTemplateSelect(template)}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left"
                >
                  {template}
                </Button>
              ))}
            </div>
          </div>

          {showTemplateHelp && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <div className="font-medium mb-2">Available Variables</div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  {FILENAME_TEMPLATE_VARIABLES.map((variable) => (
                    <div key={variable} className="font-mono">
                      {variable}
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-muted-foreground">
                  Example: {settings.filenameTemplate} → M31_Ha_2024-01-15_22-30-45.fits
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compression Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Compression</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Compression</Label>
                <div className="text-sm text-muted-foreground">
                  Compress images to save storage space
                </div>
              </div>
              <Switch
                checked={settings.compression}
                onCheckedChange={(checked) => updateSetting("compression", checked)}
              />
            </div>

            {settings.compression && (
              <div className="space-y-2">
                <Label htmlFor="compressionQuality">
                  Compression Quality: {settings.compressionQuality}%
                </Label>
                <Slider
                  id="compressionQuality"
                  value={[settings.compressionQuality]}
                  onValueChange={(value) => updateSetting("compressionQuality", value[0])}
                  min={VALIDATION_RULES.imaging.compressionQuality.min}
                  max={VALIDATION_RULES.imaging.compressionQuality.max}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low Quality</span>
                  <span>High Quality</span>
                </div>
              </div>
            )}

            {settings.compression && settings.saveFormat === "fits" && (
              <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <div className="text-sm text-orange-600">
                  FITS compression may not be compatible with all applications
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Processing */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Image Processing
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Stretch</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically stretch histogram for preview
                </div>
              </div>
              <Switch
                checked={settings.autoStretch}
                onCheckedChange={(checked) => updateSetting("autoStretch", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Histogram Equalization</Label>
                <div className="text-sm text-muted-foreground">
                  Apply histogram equalization for better contrast
                </div>
              </div>
              <Switch
                checked={settings.histogramEqualization}
                onCheckedChange={(checked) => updateSetting("histogramEqualization", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Frame Subtraction</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically subtract dark frames
                </div>
              </div>
              <Switch
                checked={settings.darkFrameSubtraction}
                onCheckedChange={(checked) => updateSetting("darkFrameSubtraction", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Flat Field Correction</Label>
                <div className="text-sm text-muted-foreground">
                  Apply flat field correction
                </div>
              </div>
              <Switch
                checked={settings.flatFieldCorrection}
                onCheckedChange={(checked) => updateSetting("flatFieldCorrection", checked)}
              />
            </div>
          </div>
        </div>

        {/* Backup Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Backup</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Create Backups</Label>
              <div className="text-sm text-muted-foreground">
                Create backup copies of important images
              </div>
            </div>
            <Switch
              checked={settings.createBackups}
              onCheckedChange={(checked) => updateSetting("createBackups", checked)}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm">
            <div className="font-medium mb-1">Current Configuration</div>
            <div className="text-muted-foreground space-y-1">
              <div>Format: {settings.saveFormat.toUpperCase()}</div>
              <div>Location: {settings.saveLocation}</div>
              <div>Template: {settings.filenameTemplate}</div>
              <div>Compression: {settings.compression ? `${settings.compressionQuality}%` : "Disabled"}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
