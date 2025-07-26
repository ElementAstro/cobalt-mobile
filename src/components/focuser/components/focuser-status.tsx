"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Focus, Thermometer } from "lucide-react";
import { useFocuser } from "../hooks/use-focuser";
import { useTranslation } from "@/lib/i18n";

export default function FocuserStatus() {
  const { status, moveProgress } = useFocuser();
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Focus className="h-5 w-5" />
          {t("focuserStatus")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Current Position */}
          <div className="text-center">
            <div className="text-2xl font-bold">
              {status.position.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("currentPosition")}
            </div>
          </div>

          {/* Temperature */}
          <div className="text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Thermometer className="h-5 w-5" />
              {status.temperature.toFixed(1)}{t("celsius")}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("temperature")}
            </div>
          </div>

          {/* Max Position */}
          <div className="text-center">
            <div className="text-2xl font-bold">
              {status.maxPosition.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("maxPosition" as any)}
            </div>
          </div>

          {/* Connection Status */}
          <div className="text-center">
            <Badge variant={status.connected ? "default" : "destructive"}>
              {status.connected ? t("connected") : t("disconnected")}
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">
              {t("status" as any)}
            </div>
          </div>
        </div>

        {/* Movement Progress */}
        {status.moving && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {t("moving" as any)} {t("to" as any)} {t("position" as any)} {status.targetPosition.toLocaleString()}
              </span>
              <span>
                {moveProgress.progress.toFixed(0)}% {t("complete")}
              </span>
            </div>
            <Progress value={moveProgress.progress} />
            {moveProgress.estimatedTimeRemaining && (
              <div className="text-xs text-muted-foreground text-center">
                {t("estimatedTime")}: {moveProgress.estimatedTimeRemaining.toFixed(1)}s
              </div>
            )}
          </div>
        )}

        {/* Additional Status Information */}
        {status.model && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">{t("model")}:</span>
                <span className="ml-2">{status.model}</span>
              </div>
              {status.serialNumber && (
                <div>
                  <span className="font-medium">{t("serial")}:</span>
                  <span className="ml-2">{status.serialNumber}</span>
                </div>
              )}
              {status.firmwareVersion && (
                <div>
                  <span className="font-medium">{t("firmware")}:</span>
                  <span className="ml-2">{status.firmwareVersion}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
