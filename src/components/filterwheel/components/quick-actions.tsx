"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Filter } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { QuickActionsProps } from "../types/filterwheel.types";
import { QUICK_ACTION_FILTERS, GRID_LAYOUTS } from "../utils/filterwheel.constants";

export default function QuickActions({
  onHome,
  onFilterSelect,
  currentPosition,
  isMoving,
  disabled = false,
  className = "",
}: QuickActionsProps) {
  const { t } = useTranslation();

  const isDisabled = disabled || isMoving;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t("quickActions")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid ${GRID_LAYOUTS.normal.quickActions} gap-2`}>
          {/* Home Button */}
          <Button
            onClick={onHome}
            disabled={isDisabled}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <Home className="h-4 w-4" />
            {t("home")}
          </Button>

          {/* Quick Filter Buttons */}
          {QUICK_ACTION_FILTERS.map((filter) => {
            const isCurrentFilter = currentPosition === filter.position;
            const isFilterDisabled = isDisabled || isCurrentFilter;

            return (
              <Button
                key={filter.position}
                onClick={() => onFilterSelect(filter.position)}
                disabled={isFilterDisabled}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {filter.name}
              </Button>
            );
          })}
        </div>

        {/* Additional Quick Actions */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => onFilterSelect(1)}
              disabled={isDisabled || currentPosition === 1}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Go to L
            </Button>
            <Button
              onClick={() => onFilterSelect(5)}
              disabled={isDisabled || currentPosition === 5}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Go to Hα
            </Button>
          </div>
        </div>

        {/* Status Information */}
        {isMoving && (
          <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-950 rounded text-center">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {t("filterWheelMoving")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
