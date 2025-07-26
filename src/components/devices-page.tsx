"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveGrid, GridLayouts } from "@/components/ui/responsive-grid";
import { PullToRefreshContainer } from "@/components/ui/pull-to-refresh";
import { EquipmentStatusWidget } from "@/components/ui/status-widget";
import { HelpTooltip } from "@/components/ui/tooltip";
import {
  Camera,
  Compass,
  Filter,
  Focus,
  ChevronRight,
  Thermometer,
  Zap,
  Target,
  RotateCw,
  HelpCircle,
} from "lucide-react";
import { CurrentPage, useAppStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { getMobileInteractiveClasses } from "@/lib/mobile-utils";

interface DevicesPageProps {
  onDeviceClick: (page: CurrentPage) => void;
}

export default function DevicesPage({
  onDeviceClick,
}: DevicesPageProps) {
  const {
    equipmentStatus,
    cameraSettings,
    mountStatus,
    filterWheelStatus,
    focuserStatus,
    cameraTemp,
    autoFocus,
    refreshEquipmentStatus,
  } = useAppStore();

  const { t } = useTranslation();

  const handleRefresh = async () => {
    // Simulate equipment status refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (refreshEquipmentStatus) {
      refreshEquipmentStatus();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "disconnected":
        return "bg-gray-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return t("connected");
      case "disconnected":
        return t("disconnected");
      case "error":
        return t("error");
      default:
        return t("disconnected");
    }
  };
  const devices: Array<{
    id: string;
    name: string;
    model: string;
    icon: React.ComponentType<{ className?: string }>;
    status: "connected" | "disconnected" | "error" | "connecting";
    details: Record<string, string>;
    page: CurrentPage;
  }> = [
    {
      id: "camera",
      name: t("camera"),
      model: "ZWO ASI2600MC Pro",
      icon: Camera,
      status: equipmentStatus.camera,
      details: {
        [t("temperature")]: `${cameraTemp.toFixed(1)}${t("celsius")}`,
        [t("exposure")]: `${cameraSettings.exposure}${t("seconds")}`,
        [t("gain")]: cameraSettings.gain.toString(),
        [t("coolingPower")]: "65%",
      },
      page: "camera-detail",
    },
    {
      id: "mount",
      name: t("mount"),
      model: "Sky-Watcher EQ6-R Pro",
      icon: Compass,
      status: equipmentStatus.mount,
      details: {
        [t("rightAscension")]: mountStatus.ra,
        [t("declination")]: mountStatus.dec,
        [t("tracking")]: mountStatus.tracking ? t("active") : t("inactive"),
        [t("guiding")]: mountStatus.guiding ? t("active") : t("inactive"),
      },
      page: "mount-detail",
    },
    {
      id: "filterWheel",
      name: t("filterWheel"),
      model: 'ZWO EFW 8x1.25"',
      icon: Filter,
      status: equipmentStatus.filterWheel,
      details: {
        [t("position")]: `${filterWheelStatus.currentPosition} - Luminance`,
        [t("temperature")]: `${filterWheelStatus.temperature.toFixed(1)}${t("celsius")}`,
        [t("installedFilters")]: "7 installed",
        [t("moving")]: filterWheelStatus.moving ? t("yes") : t("no"),
      },
      page: "filter-detail",
    },
    {
      id: "focuser",
      name: t("focuser"),
      model: "ZWO EAF",
      icon: Focus,
      status: equipmentStatus.focuser,
      details: {
        [t("position")]: focuserStatus.position.toLocaleString(),
        [t("temperature")]: `${focuserStatus.temperature.toFixed(1)}${t("celsius")}`,
        [t("bestHFR")]: `${autoFocus.hfr.toFixed(2)} ${t("pixels")}`,
        [t("moving")]: focuserStatus.moving ? t("yes") : t("no"),
      },
      page: "focuser-detail",
    },
  ];

  return (
    <PullToRefreshContainer onRefresh={handleRefresh} className="min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{t("equipmentControl")}</h2>
          <p className="text-muted-foreground">
            Pull down to refresh • Tap any device to access detailed controls
          </p>
        </div>

      {/* Quick Status Overview */}
      <ResponsiveGrid columns={{ xs: 2, sm: 4 }} gap="compact">
        <EquipmentStatusWidget
          name="Camera"
          status={equipmentStatus.camera}
          icon={Camera}
          temperature={cameraTemp}
          details={{
            exposure: `${cameraSettings.exposure}s`,
            gain: cameraSettings.gain.toString(),
            binning: cameraSettings.binning,
          }}
          lastUpdated={new Date()}
          onClick={() => onDeviceClick("camera-detail")}
        />

        <EquipmentStatusWidget
          name="Mount"
          status={equipmentStatus.mount}
          icon={Compass}
          details={{
            ra: mountStatus.ra,
            dec: mountStatus.dec,
            tracking: mountStatus.tracking ? "On" : "Off",
          }}
          lastUpdated={new Date()}
          onClick={() => onDeviceClick("mount-detail")}
        />

        <EquipmentStatusWidget
          name="Filter Wheel"
          status={equipmentStatus.filterWheel}
          icon={Filter}
          temperature={filterWheelStatus.temperature}
          details={{
            position: filterWheelStatus.currentPosition.toString(),
            filter: "Luminance",
          }}
          lastUpdated={new Date()}
          onClick={() => onDeviceClick("filter-detail")}
        />

        <EquipmentStatusWidget
          name="Focuser"
          status={equipmentStatus.focuser}
          icon={Focus}
          temperature={focuserStatus.temperature}
          details={{
            position: focuserStatus.position.toLocaleString(),
            hfr: `${autoFocus.hfr.toFixed(2)}px`,
          }}
          lastUpdated={new Date()}
          onClick={() => onDeviceClick("focuser-detail")}
        />
      </ResponsiveGrid>

      {/* Device Cards - Responsive Grid */}
      <ResponsiveGrid {...GridLayouts.equipment}>
        {devices.map((device) => {
          const IconComponent = device.icon;
          return (
            <Card
              key={device.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] ${getMobileInteractiveClasses({ feedback: true, focus: true })}`}
              onClick={() => onDeviceClick(device.page)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDeviceClick(device.page);
                }
              }}
              aria-label={`Open ${device.name} controls`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base">
                          {device.name}
                        </h3>
                        <Badge
                          className={`${getStatusColor(
                            device.status
                          )} text-white text-xs`}
                        >
                          {getStatusText(device.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {device.model}
                      </p>

                      {/* Key Information Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(device.details).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-1">
                            {key === "temperature" && (
                              <Thermometer className="h-3 w-3 text-muted-foreground" />
                            )}
                            {key === "coolingPower" && (
                              <Zap className="h-3 w-3 text-muted-foreground" />
                            )}
                            {key === "tracking" && (
                              <Target className="h-3 w-3 text-muted-foreground" />
                            )}
                            {key === "moving" && value === "Yes" && (
                              <RotateCw className="h-3 w-3 text-muted-foreground animate-spin" />
                            )}
                            <span className="text-muted-foreground capitalize">
                              {key}:
                            </span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </ResponsiveGrid>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {t("quickActions")}
            </div>
            <HelpTooltip
              title="Quick Actions"
              description="Perform common operations on all equipment at once. Use these for quick setup or emergency situations."
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            </HelpTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveGrid columns={{ xs: 2, md: 4 }} gap="compact">
            <Button
              variant="outline"
              size="touch"
              className="flex items-center gap-2 bg-transparent"
            >
              <Target className="h-4 w-4" />
              {t("connectAll")}
            </Button>
            <Button
              variant="outline"
              size="touch"
              className="flex items-center gap-2 bg-transparent"
            >
              <Zap className="h-4 w-4" />
              {t("disconnectAll")}
            </Button>
            <Button
              variant="outline"
              size="touch"
              className="flex items-center gap-2 bg-transparent"
            >
              <RotateCw className="h-4 w-4" />
              {t("refreshStatus")}
            </Button>
            <Button
              variant="outline"
              size="touch"
              className="flex items-center gap-2 bg-transparent"
            >
              <Camera className="h-4 w-4" />
              {t("testAll")}
            </Button>
          </ResponsiveGrid>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>{t("connectionSettings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">ASCOM Platform</span>
              <Badge variant="default">{t("connected")}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Network Connection</span>
              <Badge variant="default">Wi-Fi Strong</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Equipment Hub</span>
              <Badge variant="default">192.168.1.100:11111</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </PullToRefreshContainer>
  );
}
