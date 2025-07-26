"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Filter } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { FilterWheelStatusProps } from "../types/filterwheel.types";
import { formatTemperature, getStatusColor } from "../utils/filterwheel.utils";

export default function FilterWheelStatus({
  status,
  currentFilter,
  targetFilter,
  moveProgress,
  showTemperature = true,
  showConnection = true,
  className = "",
}: FilterWheelStatusProps) {
  const { t } = useTranslation();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t("filterWheelStatus")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Current Position */}
          <div className="text-center">
            <div className="text-2xl font-bold">
              {t("position")} {status.currentPosition}
            </div>
            <div className="text-sm text-muted-foreground">{t("current")}</div>
            {currentFilter && (
              <Badge
                className="mt-1"
                style={{
                  backgroundColor: currentFilter.color,
                  color: "#000",
                }}
              >
                {currentFilter.name}
              </Badge>
            )}
          </div>

          {/* Temperature */}
          {showTemperature && (
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatTemperature(status.temperature)}
              </div>
              <div className="text-sm text-muted-foreground">{t("temperature")}</div>
            </div>
          )}

          {/* Connection Status */}
          {showConnection && (
            <div className="text-center">
              <Badge 
                variant={status.connected ? "default" : "destructive"}
                style={{
                  backgroundColor: getStatusColor(status.connected ? 'connected' : 'disconnected'),
                }}
              >
                {status.connected ? t("connected") : t("disconnected")}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Status</div>
            </div>
          )}
        </div>

        {/* Movement Progress */}
        {status.moving && moveProgress && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {t("moving")} to {t("position")} {status.targetPosition}
                {targetFilter && ` (${targetFilter.name})`}
              </span>
              <span>{moveProgress.progress.toFixed(0)}{t("percent")}</span>
            </div>
            <Progress value={moveProgress.progress} />
            {moveProgress.estimatedTimeRemaining && (
              <div className="text-xs text-muted-foreground text-center">
                Estimated Time: {moveProgress.estimatedTimeRemaining.toFixed(1)}s
              </div>
            )}
          </div>
        )}

        {/* Additional Status Information */}
        {status.model && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Model:</span>
                <span>{status.model}</span>
              </div>
              {status.serialNumber && (
                <div className="flex justify-between mt-1">
                  <span>Serial:</span>
                  <span>{status.serialNumber}</span>
                </div>
              )}
              {status.firmwareVersion && (
                <div className="flex justify-between mt-1">
                  <span>Firmware:</span>
                  <span>{status.firmwareVersion}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
