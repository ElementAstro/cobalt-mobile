"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Aperture } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import SwipeNavigation from "../../swipe-navigation";
import { useCamera } from "../hooks/use-camera";
import { useCameraCapture } from "../hooks/use-camera-capture";
import CameraStatus from "./camera-status";
import ExposureSettings from "./exposure-settings";
import CameraSettings from "./camera-settings";
import LiveView from "./live-view";

interface CameraDetailPageProps {
  onBack: () => void;
}

export default function CameraDetailPage({ onBack }: CameraDetailPageProps) {
  const { currentPage, setCurrentPage } = useAppStore();
  const { cameraStatus, isReadyForCapture } = useCamera();
  const { 
    isCapturing, 
    captureProgress, 
    startCapture, 
    abortCapture, 
    progressPercentage 
  } = useCameraCapture();
  const { t } = useTranslation();

  // const handleDownload = () => {
  //   // Implement download functionality
  //   console.log("Download requested");
  // };

  const handleSaveFrame = () => {
    // Implement save frame functionality
    console.log("Save frame requested");
  };

  const handleFullscreen = () => {
    // Implement fullscreen functionality
    console.log("Fullscreen requested");
  };

  return (
    <div className="space-y-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{t("cameraControl")}</h2>
          <p className="text-sm text-muted-foreground">
            ZWO ASI2600MC Pro • {t("swipeToNavigate")}
          </p>
        </div>
      </div>

      <SwipeNavigation currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Camera Status */}
      <CameraStatus />

      {/* Quick Capture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Aperture className="h-5 w-5" />
            {t("quickCapture")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCapturing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("capturing")}...</span>
                <span>{progressPercentage}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${captureProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => startCapture()}
              disabled={!isReadyForCapture}
              className="flex items-center gap-2"
            >
              <Aperture className="h-4 w-4" />
              {t("capture")}
            </Button>
            <Button
              onClick={() => abortCapture()}
              disabled={!isCapturing}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("abort")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exposure Settings */}
      <ExposureSettings layout="stack" />

      {/* Camera Settings */}
      <CameraSettings />

      {/* Live View */}
      {cameraStatus.liveViewActive && (
        <LiveView 
          onFullscreen={handleFullscreen}
          onSaveFrame={handleSaveFrame}
        />
      )}
    </div>
  );
}
