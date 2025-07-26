"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SwipeNavigation from "../../swipe-navigation";
import { CurrentPage } from "@/lib/store";
import FocuserStatus from "./focuser-status";
import ManualControls from "./manual-controls";
import AutoFocusControls from "./autofocus-controls";
import FocusCurve from "./focus-curve";
import { useFocuser } from "../hooks/use-focuser";
import { useTranslation } from "@/lib/i18n";

interface FocuserDetailPageProps {
  onBack: () => void;
  onSwipeNavigate: (page: CurrentPage) => void;
  currentPage: CurrentPage;
}

export default function FocuserDetailPage({
  onBack,
  onSwipeNavigate,
  currentPage,
}: FocuserDetailPageProps) {
  const { status } = useFocuser();
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{t("focuserControl")}</h2>
          <p className="text-sm text-muted-foreground">
            {status.model || "Focuser"} • {t("swipeToNavigate")}
          </p>
        </div>
      </div>

      <SwipeNavigation currentPage={currentPage} onNavigate={onSwipeNavigate} />

      {/* Focuser Components */}
      <FocuserStatus />
      <ManualControls />
      <AutoFocusControls />
      <FocusCurve />
    </div>
  );
}
