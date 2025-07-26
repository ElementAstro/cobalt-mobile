"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useCameraSettings } from "../hooks/use-camera-settings";
import { formatTemperature } from "../utils/camera.utils";

interface CameraSettingsProps {
  className?: string;
  showTemperatureControl?: boolean;
}

export default function CameraSettings({ 
  className, 
  showTemperatureControl = true 
}: CameraSettingsProps) {
  const { 
    settings, 
    updateBinning, 
    updateFrameType, 
    updateImageFormat,
    updateCooling,
    updateTemperature,
    validationLimits,
    availableOptions 
  } = useCameraSettings();
  const { t } = useTranslation();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t("cameraSettings")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="binning">{t("binning")}</Label>
            <Select
              value={settings.binning}
              onValueChange={updateBinning}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.binning.map((binning) => (
                  <SelectItem key={binning} value={binning}>
                    {binning}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frameType">{t("frameType")}</Label>
            <Select
              value={settings.frameType}
              onValueChange={updateFrameType}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.frameTypes.map((frameType) => (
                  <SelectItem key={frameType} value={frameType}>
                    {frameType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageFormat">{t("imageFormat")}</Label>
            <Select
              value={settings.imageFormat}
              onValueChange={updateImageFormat}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.imageFormats.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="cooling"
            checked={settings.coolingEnabled}
            onCheckedChange={(checked) => updateCooling(checked)}
          />
          <Label htmlFor="cooling">{t("coolingEnabled")}</Label>
        </div>

        {settings.coolingEnabled && showTemperatureControl && (
          <div className="space-y-2">
            <Label>
              {t("targetTemp")}: {formatTemperature(settings.temperature)}
            </Label>
            <Slider
              value={[settings.temperature]}
              onValueChange={(value) => updateTemperature(value[0])}
              max={validationLimits.temperature.max}
              min={validationLimits.temperature.min}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTemperature(validationLimits.temperature.min)}</span>
              <span>{formatTemperature(validationLimits.temperature.max)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
