"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Filter, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { FilterListProps } from "../types/filterwheel.types";
// import { formatTemperature } from "../utils/filterwheel.utils"; // Unused for now

export default function FilterList({
  filters,
  currentPosition,
  onFilterSelect,
  showActions = false,
  className = "",
}: FilterListProps) {
  const { t } = useTranslation();

  const installedFilters = filters.filter(f => f.installed);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t("installedFilters")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {installedFilters.map((filter) => {
            const isCurrent = filter.position === currentPosition;

            return (
              <div
                key={filter.position}
                className={`flex items-center justify-between p-3 rounded border transition-colors ${
                  isCurrent ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                }`}
              >
                {/* Filter Information */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: filter.color }}
                  />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {filter.name}
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("position")} {filter.position}
                      {filter.type && filter.type !== filter.name && (
                        <span> • {filter.type}</span>
                      )}
                    </div>
                    {filter.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {filter.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Filter Details */}
                <div className="text-right">
                  <div className="text-sm font-medium">{filter.type}</div>
                  <div className="text-xs text-muted-foreground">
                    {isCurrent ? t("current") : t("available")}
                  </div>
                  
                  {/* Wavelength Information */}
                  {filter.wavelength && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {filter.wavelength}nm
                      {filter.bandwidth && (
                        <span className="ml-1">
                          (±{filter.bandwidth/2}nm)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Manufacturer Information */}
                  {filter.manufacturer && (
                    <div className="text-xs text-muted-foreground">
                      {filter.manufacturer}
                      {filter.model && ` ${filter.model}`}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {showActions && onFilterSelect && !isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterSelect(filter.position)}
                    className="ml-2"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Information */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Total Filters</div>
              <div className="text-muted-foreground">
                {installedFilters.length} / {filters.length}
              </div>
            </div>
            <div>
              <div className="font-medium">Filter Types</div>
              <div className="text-muted-foreground">
                {new Set(installedFilters.map(f => f.type)).size} types
              </div>
            </div>
          </div>

          {/* Filter Type Breakdown */}
          <div className="mt-3">
            <div className="text-sm font-medium mb-2">Filter Breakdown</div>
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(installedFilters.map(f => f.type))).map(type => {
                const count = installedFilters.filter(f => f.type === type).length;
                return (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type} ({count})
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        {/* Empty Slots Information */}
        {filters.some(f => !f.installed) && (
          <div className="mt-4 p-3 bg-muted/30 rounded">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {filters.filter(f => !f.installed).length} empty slot(s) available
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Positions: {filters.filter(f => !f.installed).map(f => f.position).join(', ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
