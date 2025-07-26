"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Settings, Maximize, Download } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useCamera } from "../hooks/use-camera";

interface LiveViewProps {
  className?: string;
  showControls?: boolean;
  aspectRatio?: "video" | "square" | "auto";
  onFullscreen?: () => void;
  onSaveFrame?: () => void;
}

export default function LiveView({ 
  className,
  showControls = true,
  aspectRatio = "video",
  onFullscreen,
  onSaveFrame
}: LiveViewProps) {
  const { cameraStatus, toggleLiveView } = useCamera();
  const { t } = useTranslation();

  const aspectClass = {
    video: "aspect-video",
    square: "aspect-square", 
    auto: "aspect-auto"
  }[aspectRatio];

  return (
    <Card
      className={className}
      data-testid="live-view"
      data-aspect-ratio={aspectRatio}
      data-show-controls={showControls.toString()}
    >
      {!cameraStatus.liveViewActive ? (
        <CardContent>
          <div className={`${aspectClass} bg-gray-100 rounded-lg flex items-center justify-center text-gray-500`}>
            <div data-testid="live-view-placeholder" className="text-center">
              <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Live view not active</p>
            </div>
          </div>
        </CardContent>
      ) : (
        <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t("liveView")}
          </CardTitle>
          {showControls && (
            <div className="flex gap-2">
              {onSaveFrame && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveFrame}
                  className="flex items-center gap-1"
                  data-testid="save-frame-button"
                >
                  <Download className="h-3 w-3" />
                  {t("save")}
                </Button>
              )}
              {onFullscreen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFullscreen}
                  className="flex items-center gap-1"
                  data-testid="fullscreen-button"
                >
                  <Maximize className="h-3 w-3" />
                  Fullscreen
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Settings className="h-3 w-3" />
                {t("settings")}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          data-testid="live-view-display"
          className={`${aspectClass} bg-black rounded-lg flex items-center justify-center text-white relative overflow-hidden`}
        >
          {/* Simulated live view content */}
          <div data-testid="video-feed" className="text-center">
            <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm opacity-75">
              {t("liveView")} feed would appear here
            </p>
            <p className="text-xs opacity-50 mt-1">
              Simulated camera preview
            </p>
          </div>
          
          {/* Live view overlay information */}
          <div className="absolute top-2 left-2 bg-black/50 rounded px-2 py-1 text-xs">
            <div>Temp: {cameraStatus.cameraTemp.toFixed(1)}°C</div>
          </div>
          
          <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-1 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              LIVE
            </div>
          </div>
          
          {/* Crosshair overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              <div className="absolute w-8 h-0.5 bg-red-500/50 -translate-x-4"></div>
              <div className="absolute h-8 w-0.5 bg-red-500/50 -translate-y-4"></div>
            </div>
          </div>
        </div>
        
        {showControls && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={toggleLiveView}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Stop Live View
            </Button>
          </div>
        )}
      </CardContent>
        </>
      )}
    </Card>
  );
}
