"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Compass,
  Filter,
  Focus,
  Smartphone,
} from "lucide-react";
import { CurrentPage } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

interface EnhancedSwipeNavigationProps {
  currentPage: CurrentPage;
  onNavigate: (page: CurrentPage) => void;
}

export default function EnhancedSwipeNavigation({
  currentPage,
  onNavigate,
}: EnhancedSwipeNavigationProps) {
  const { t } = useTranslation();
  const [showSwipeHint, setShowSwipeHint] = useState(true);

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

  // Hide swipe hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeHint(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentPage]);

  const handlePrevious = () => {
    if (canGoPrevious) {
      onNavigate(devices[currentIndex - 1].id);
      setShowSwipeHint(true); // Show hint again when navigating
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onNavigate(devices[currentIndex + 1].id);
      setShowSwipeHint(true); // Show hint again when navigating
    }
  };

  return (
    <div className="space-y-3">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className="flex items-center gap-2"
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
              <button
                key={device.id}
                onClick={() => onNavigate(device.id)}
                className={`flex items-center gap-1 px-3 py-2 rounded-full transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-xs font-medium">{device.name}</span>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          disabled={!canGoNext}
          className="flex items-center gap-2"
        >
          {canGoNext && (
            <span className="hidden sm:inline">
              {devices[currentIndex + 1].name}
            </span>
          )}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Swipe Hint */}
      {showSwipeHint && (
        <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-700 dark:text-blue-300">
            Swipe left or right to navigate between devices
          </span>
        </div>
      )}
    </div>
  );
}
