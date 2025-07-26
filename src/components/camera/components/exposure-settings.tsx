"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Timer } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useCameraSettings } from "../hooks/use-camera-settings";

interface ExposureSettingsProps {
  className?: string;
  layout?: "grid" | "stack";
}

export default function ExposureSettings({ 
  className, 
  layout = "grid" 
}: ExposureSettingsProps) {
  const { 
    settings, 
    updateExposure, 
    updateISO, 
    updateGain, 
    updateOffset,
    validationLimits,
    availableOptions 
  } = useCameraSettings();
  const { t } = useTranslation();

  const containerClass = layout === "grid" 
    ? "grid grid-cols-1 lg:grid-cols-2 gap-4" 
    : "space-y-4";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          {t("exposureSettings")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={containerClass}>
          <div className="space-y-2">
            <Label htmlFor="exposure">
              {t("exposureTime")} ({t("seconds")})
            </Label>
            <Input
              id="exposure"
              type="number"
              value={settings.exposure}
              onChange={(e) => updateExposure(Number(e.target.value))}
              min={validationLimits.exposure.min}
              max={validationLimits.exposure.max}
              step={0.1}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="iso">{t("iso")}</Label>
            <Select
              value={settings.iso.toString()}
              onValueChange={(value) => updateISO(Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.isoValues.map((iso) => (
                  <SelectItem key={iso} value={iso.toString()}>
                    {iso}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={containerClass}>
          <div className="space-y-2">
            <Label>
              {t("gain")}: {settings.gain}
            </Label>
            <Slider
              value={[settings.gain]}
              onValueChange={(value) => updateGain(value[0])}
              max={validationLimits.gain.max}
              min={validationLimits.gain.min}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{validationLimits.gain.min}</span>
              <span>{validationLimits.gain.max}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>
              {t("offset")}: {settings.offset}
            </Label>
            <Slider
              value={[settings.offset]}
              onValueChange={(value) => updateOffset(value[0])}
              max={validationLimits.offset.max}
              min={validationLimits.offset.min}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{validationLimits.offset.min}</span>
              <span>{validationLimits.offset.max}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
