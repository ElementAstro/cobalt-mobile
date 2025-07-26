"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Home, RotateCcw } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useMount } from "../hooks/use-mount";
import { TRACKING_RATES, TRACKING_RATE_DESCRIPTIONS } from "../utils/telescope.constants";

interface MountControlProps {
  className?: string;
}

export default function MountControl({ className }: MountControlProps) {
  const {
    mountStatus,
    trackingRate,
    togglePark,
    setTrackingRate,
    toggleTracking,
    toggleGuiding,
    goToHome,
    // canTrack, // Unused for now
    // canGuide, // Unused for now
    getTrackingInfo,
    getGuidingInfo,
  } = useMount();

  const { t } = useTranslation();
  const trackingInfo = getTrackingInfo();
  const guidingInfo = getGuidingInfo();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t("mountControl")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tracking-rate">{t("trackingRate")}</Label>
          <Select value={trackingRate} onValueChange={setTrackingRate}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRACKING_RATES.map((rate) => (
                <SelectItem key={rate} value={rate}>
                  {TRACKING_RATE_DESCRIPTIONS[rate]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="tracking"
              checked={trackingInfo.enabled}
              onCheckedChange={toggleTracking}
              disabled={!trackingInfo.canEnable}
            />
            <Label htmlFor="tracking">{t("enableTracking")}</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="guiding"
              checked={guidingInfo.enabled}
              onCheckedChange={toggleGuiding}
              disabled={!guidingInfo.canEnable}
            />
            <Label htmlFor="guiding">{t("enableGuiding")}</Label>
            {guidingInfo.requiresTracking && (
              <span className="text-xs text-muted-foreground">
                (requires tracking)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={togglePark}
            variant={mountStatus.parked ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            {mountStatus.parked ? t("unpark") : t("park")}
          </Button>
          <Button
            onClick={goToHome}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
            disabled={mountStatus.parked || mountStatus.slewing}
          >
            <RotateCcw className="h-4 w-4" />
            {t("homePosition")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
