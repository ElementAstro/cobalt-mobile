"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useCamera } from "../hooks/use-camera";
import { formatTemperature } from "../utils/camera.utils";

interface CameraStatusProps {
  className?: string;
  compact?: boolean;
}

export default function CameraStatus({ className, compact = false }: CameraStatusProps) {
  const { cameraStatus, cameraSettings, isCoolingEffective } = useCamera();
  const { t } = useTranslation();

  const { cameraTemp, targetTemp, coolingPower } = cameraStatus;

  if (compact) {
    return (
      <div className={`grid grid-cols-2 gap-4 ${className}`}>
        <div className="text-center">
          <div className="text-lg font-bold">
            {formatTemperature(cameraTemp)}
          </div>
          <div className="text-xs text-muted-foreground">{t("currentTemp")}</div>
        </div>
        <div className="text-center">
          <Badge
            variant={cameraSettings.coolingEnabled ? "default" : "secondary"}
          >
            {cameraSettings.coolingEnabled ? `${t("cooling")} ${t("on")}` : `${t("cooling")} ${t("off")}`}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {t("cameraStatus")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatTemperature(cameraTemp)}
            </div>
            <div className="text-sm text-muted-foreground">{t("currentTemp")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatTemperature(targetTemp)}
            </div>
            <div className="text-sm text-muted-foreground">{t("targetTemp")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{coolingPower}%</div>
            <div className="text-sm text-muted-foreground">{t("coolingPower")}</div>
          </div>
          <div className="text-center">
            <Badge
              variant={cameraSettings.coolingEnabled ? "default" : "secondary"}
              className={isCoolingEffective ? "bg-green-600" : ""}
            >
              {cameraSettings.coolingEnabled ? `${t("cooling")} ${t("on")}` : `${t("cooling")} ${t("off")}`}
            </Badge>
            {cameraSettings.coolingEnabled && (
              <div className="text-xs text-muted-foreground mt-1">
                {isCoolingEffective ? "Effective" : "Stabilizing"}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
