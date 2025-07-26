"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Zap, Square, CheckCircle, AlertCircle } from "lucide-react";
import { useAutoFocus } from "../hooks/use-autofocus";
import { useFocuser } from "../hooks/use-focuser";
import { useTranslation } from "@/lib/i18n";

export default function AutoFocusControls() {
  const {
    autoFocus,
    isRunning,
    progress,
    samples,
    bestPosition,
    bestHfr,
    curve,
    startAutoFocus,
    abortAutoFocus,
    getStatistics,
  } = useAutoFocus();

  const { status } = useFocuser();
  const { t } = useTranslation();

  const statistics = getStatistics();

  const handleStartAutoFocus = () => {
    startAutoFocus().catch(console.error);
  };

  const handleAbortAutoFocus = () => {
    abortAutoFocus().catch(console.error);
  };

  const getAutoFocusStatusBadge = () => {
    if (isRunning) {
      return (
        <Badge variant="default" className="animate-pulse">
          <Zap className="h-3 w-3 mr-1" />
          {t("running")}
        </Badge>
      );
    }

    if (autoFocus.error) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          {t("failed" as any)}
        </Badge>
      );
    }

    if (samples.length > 0 && !isRunning) {
      return (
        <Badge variant="secondary">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t("completed" as any)}
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        {t("idle")}
      </Badge>
    );
  };

  const canStartAutoFocus = !isRunning && !status.moving && status.connected;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t("autoFocus")}
          </div>
          {getAutoFocusStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Display */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("autoFocus")} {t("progress")}...</span>
              <span>{progress.toFixed(0)}{t("percent")}</span>
            </div>
            <Progress value={progress} />
            <div className="text-xs text-muted-foreground text-center">
              {t("samples")}: {samples.length}
            </div>
          </div>
        )}

        {/* Error Display */}
        {autoFocus.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{t("error")}</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">
              {autoFocus.error}
            </p>
          </div>
        )}

        {/* Results Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold">
              {bestPosition.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("bestPosition")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {bestHfr.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("bestHFR")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {samples.length}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("samples")}
            </div>
          </div>
        </div>

        {/* Curve Quality Indicator */}
        {curve && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{t("curveQuality")}</span>
              <Badge variant={curve.isValid ? "default" : "destructive"}>
                {curve.isValid ? t("good") : t("poor")}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">R²:</span>
                <span className="ml-2 font-mono">{curve.r2.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("confidence")}:</span>
                <span className="ml-2 font-mono">{(curve.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {samples.length > 0 && (
          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">{t("minHFR")}:</span>
                <span className="ml-2">{statistics.minHfr.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">{t("maxHFR")}:</span>
                <span className="ml-2">{statistics.maxHfr.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">{t("range")}:</span>
                <span className="ml-2">{statistics.range.toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium">{t("samples")}:</span>
                <span className="ml-2">{statistics.sampleCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleStartAutoFocus}
            disabled={!canStartAutoFocus}
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-2" />
            {t("startAutoFocus")}
          </Button>
          <Button
            onClick={handleAbortAutoFocus}
            disabled={!isRunning}
            variant="destructive"
          >
            <Square className="h-4 w-4 mr-2" />
            {t("abort")}
          </Button>
        </div>

        {/* Timing Information */}
        {(autoFocus.startTime || autoFocus.endTime) && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            {autoFocus.startTime && (
              <div>
                {t("started")}: {autoFocus.startTime.toLocaleTimeString()}
              </div>
            )}
            {autoFocus.endTime && (
              <div>
                {t("completed")}: {autoFocus.endTime.toLocaleTimeString()}
              </div>
            )}
            {autoFocus.startTime && autoFocus.endTime && (
              <div>
                {t("duration")}: {Math.round((autoFocus.endTime.getTime() - autoFocus.startTime.getTime()) / 1000)}s
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
