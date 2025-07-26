"use client";

// import { useTranslation } from "@/lib/i18n"; // Unused for now
import { useCamera } from "../hooks/use-camera";
import CameraStatus from "./camera-status";
import ExposureSettings from "./exposure-settings";
import CameraSettings from "./camera-settings";
import CaptureControls from "./capture-controls";
import LiveView from "./live-view";

interface CameraControlProps {
  className?: string;
  layout?: "compact" | "full";
}

export default function CameraControl({ className, layout = "full" }: CameraControlProps) {
  const { cameraStatus } = useCamera();
  // const { t } = useTranslation(); // Unused for now

  const handleDownload = () => {
    // Implement download functionality
    console.log("Download requested");
  };

  const handleSaveFrame = () => {
    // Implement save frame functionality
    console.log("Save frame requested");
  };

  const handleFullscreen = () => {
    // Implement fullscreen functionality
    console.log("Fullscreen requested");
  };

  if (layout === "compact") {
    return (
      <div className={`space-y-4 ${className}`}>
        <CameraStatus compact />
        <CaptureControls 
          layout="stack" 
          showDownloadButton={false}
          onDownload={handleDownload}
        />
        {cameraStatus.liveViewActive && (
          <LiveView 
            aspectRatio="square"
            showControls={false}
            onFullscreen={handleFullscreen}
            onSaveFrame={handleSaveFrame}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Camera Status */}
      <CameraStatus />

      {/* Exposure Settings */}
      <ExposureSettings />

      {/* Camera Settings */}
      <CameraSettings />

      {/* Capture Control */}
      <CaptureControls 
        onDownload={handleDownload}
      />

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
