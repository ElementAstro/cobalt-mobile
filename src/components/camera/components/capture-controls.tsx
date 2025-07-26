"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  Square,
  Eye,
  Download,
  Aperture,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useCamera } from "../hooks/use-camera";
import { useCameraCapture } from "../hooks/use-camera-capture";

interface CaptureControlsProps {
  className?: string;
  layout?: "grid" | "stack";
  showLiveViewToggle?: boolean;
  showDownloadButton?: boolean;
  onDownload?: () => void;
}

export default function CaptureControls({
  className,
  layout = "grid",
  showLiveViewToggle = false,
  showDownloadButton = true,
  onDownload
}: CaptureControlsProps) {
  const { toggleLiveView, cameraStatus, isReadyForCapture } = useCamera();
  const { 
    isCapturing, 
    captureProgress, 
    startCapture, 
    abortCapture, 
    canStartCapture,
    progressPercentage,
    captureInfo 
  } = useCameraCapture();
  const { t } = useTranslation();

  const buttonGridClass = layout === "grid" 
    ? "grid grid-cols-2 lg:grid-cols-4 gap-2" 
    : "flex flex-col gap-2";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Aperture className="h-5 w-5" />
          {t("cameraControl")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCapturing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("capturing")}...</span>
              <span>{progressPercentage}</span>
            </div>
            <Progress value={captureProgress} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("exposureTime")}: {captureInfo.formattedExposureTime}</span>
              <span>{t("remaining")}: {captureInfo.formattedRemainingTime}</span>
            </div>
          </div>
        )}

        <div className={buttonGridClass}>
          <Button
            onClick={() => startCapture()}
            disabled={!canStartCapture || !isReadyForCapture}
            className="flex items-center gap-2"
            variant={isCapturing ? "secondary" : "default"}
            data-testid="button-capture"
          >
            <Camera className="h-4 w-4" />
            {t("capture")}
          </Button>

          <Button
            onClick={() => abortCapture()}
            disabled={!isCapturing}
            variant="destructive"
            className="flex items-center gap-2"
            data-testid="button-abort"
          >
            <Square className="h-4 w-4" />
            {t("abort")}
          </Button>
          
          {showLiveViewToggle && (
            <Button
              onClick={toggleLiveView}
              variant={cameraStatus.liveViewActive ? "default" : "outline"}
              className="flex items-center gap-2"
              disabled={!cameraStatus.connected}
            >
              <Eye className="h-4 w-4" />
              {t("liveView")}
            </Button>
          )}
          
          {showDownloadButton && (
            <Button
              onClick={onDownload}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              disabled={isCapturing}
            >
              <Download className="h-4 w-4" />
              {t("download")}
            </Button>
          )}
        </div>

        {!cameraStatus.connected && (
          <div className="text-center text-sm text-muted-foreground">
            Camera not connected
          </div>
        )}
      </CardContent>
    </Card>
  );
}
