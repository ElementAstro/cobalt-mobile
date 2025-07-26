"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Compass,
  Filter,
  Focus,
} from "lucide-react";
import { CurrentPage } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface SwipeNavigationProps {
  currentPage: CurrentPage;
  onNavigate: (page: CurrentPage) => void;
}

export default function SwipeNavigation({
  currentPage,
  onNavigate,
}: SwipeNavigationProps) {
  const { t } = useTranslation();
  const devices: Array<{
    id: CurrentPage;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }> = [
    {
      id: "camera-detail",
      name: t("camera"),
      icon: Camera,
      color: "bg-purple-500",
    },
    { id: "mount-detail", name: t("mount"), icon: Compass, color: "bg-blue-500" },
    {
      id: "filter-detail",
      name: t("filterWheel"),
      icon: Filter,
      color: "bg-green-500",
    },
    {
      id: "focuser-detail",
      name: t("focuser"),
      icon: Focus,
      color: "bg-orange-500",
    },
  ];

  const currentIndex = devices.findIndex((device) => device.id === currentPage);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < devices.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onNavigate(devices[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onNavigate(devices[currentIndex + 1].id);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrevious}
        disabled={!canGoPrevious}
        className="flex items-center gap-2"
        data-testid={canGoPrevious ? "nav-button-enabled" : "nav-button-disabled"}
      >
        <ChevronLeft className="h-4 w-4" />
        {canGoPrevious && (
          <span className="hidden sm:inline">
            {devices[currentIndex - 1].name}
          </span>
        )}
      </Button>

      <div className="flex items-center gap-2">
        {devices.map((device) => {
          const IconComponent = device.icon;
          const isActive = device.id === currentPage;
          return (
            <div
              key={device.id}
              className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${
                isActive ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              <IconComponent className="h-3 w-3" />
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  isActive ? "bg-primary-foreground" : "bg-muted-foreground"
                }`}
              />
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleNext}
        disabled={!canGoNext}
        className="flex items-center gap-2"
        data-testid={canGoNext ? "nav-button-enabled" : "nav-button-disabled"}
      >
        {canGoNext && (
          <span className="hidden sm:inline">
            {devices[currentIndex + 1].name}
          </span>
        )}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
