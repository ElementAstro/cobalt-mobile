"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import SwipeNavigation from "../../swipe-navigation";
import { TelescopeDetailPageProps } from "../types/telescope.types";
import MountStatus from "./mount-status";
import SlewControl from "./slew-control";
import ManualControl from "./manual-control";
import MountControl from "./mount-control";

export default function TelescopeDetailPage({
  onBack,
  onSwipeNavigate,
  currentPage,
}: TelescopeDetailPageProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{t("mountControl")}</h2>
          <p className="text-sm text-muted-foreground">
            Sky-Watcher EQ6-R Pro • {t("swipeToNavigate")}
          </p>
        </div>
      </div>

      {/* Swipe Navigation */}
      {onSwipeNavigate && currentPage && (
        <SwipeNavigation 
          currentPage={currentPage}
          onNavigate={onSwipeNavigate}
        />
      )}

      {/* Mount Status - Compact for detail page */}
      <MountStatus compact />

      {/* Quick Slew Targets */}
      <SlewControl />

      {/* Manual Control */}
      <ManualControl />

      {/* Mount Control */}
      <MountControl />
    </div>
  );
}
