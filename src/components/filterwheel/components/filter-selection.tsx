"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw, Palette } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { FilterSelectionProps } from "../types/filterwheel.types";
import { GRID_LAYOUTS } from "../utils/filterwheel.constants";

export default function FilterSelection({
  filters,
  currentPosition,
  targetPosition,
  isMoving,
  onFilterSelect,
  disabled = false,
  compactMode = false,
  className = "",
}: FilterSelectionProps) {
  const { t } = useTranslation();

  const gridLayout = compactMode 
    ? GRID_LAYOUTS.compact.filterSelection 
    : GRID_LAYOUTS.normal.filterSelection;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {t("filterSelection")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid ${gridLayout} gap-3`}>
          {filters.map((filter) => {
            const isCurrentPosition = currentPosition === filter.position;
            const isTargetPosition = targetPosition === filter.position;
            const isDisabled = disabled || isMoving || !filter.installed;

            return (
              <Button
                key={filter.position}
                variant={isCurrentPosition ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2 relative"
                onClick={() => onFilterSelect(filter.position)}
                disabled={isDisabled}
              >
                {/* Filter Color Indicator */}
                <div
                  className="w-8 h-8 rounded-full border-2 border-current"
                  style={{ backgroundColor: filter.color }}
                />
                
                {/* Filter Information */}
                <div className="text-center">
                  <div className="font-medium">{filter.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("position")} {filter.position}
                  </div>
                  {filter.type && filter.type !== filter.name && (
                    <div className="text-xs text-muted-foreground">
                      {filter.type}
                    </div>
                  )}
                </div>

                {/* Movement Indicator */}
                {isMoving && isTargetPosition && (
                  <RotateCw className="h-4 w-4 animate-spin absolute top-2 right-2" />
                )}

                {/* Installation Status */}
                {!filter.installed && (
                  <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-white bg-black/60 px-2 py-1 rounded">
                      Empty
                    </span>
                  </div>
                )}

                {/* Wavelength Information */}
                {filter.wavelength && filter.installed && (
                  <div className="text-xs text-muted-foreground">
                    {filter.wavelength}nm
                    {filter.bandwidth && ` (±${filter.bandwidth/2}nm)`}
                  </div>
                )}
              </Button>
            );
          })}
        </div>

        {/* Filter Count Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {t("installedFilters")}: {filters.filter(f => f.installed).length}
            </span>
            <span>
              Empty Slots: {filters.filter(f => !f.installed).length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
