"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, Navigation, Square } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useSlewControl } from "../hooks/use-slew-control";

interface SlewControlProps {
  className?: string;
  showQuickTargets?: boolean;
}

export default function SlewControl({ 
  className, 
  showQuickTargets = true 
}: SlewControlProps) {
  const {
    slewTarget,
    canSlew,
    isSlewing,
    selectCommonTarget,
    setCustomTarget,
    startSlew,
    abortSlew,
    getCommonTargets,
    isTargetValid,
  } = useSlewControl();

  const { t } = useTranslation();
  const commonTargets = getCommonTargets();

  const handleRAChange = (value: string) => {
    setCustomTarget(value, slewTarget.dec, slewTarget.name);
  };

  const handleDecChange = (value: string) => {
    setCustomTarget(slewTarget.ra, value, slewTarget.name);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t("slewControl")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showQuickTargets && (
          <div className="space-y-2">
            <Label htmlFor="target-select">{t("quickTargets")}</Label>
            <Select onValueChange={selectCommonTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Select a target" />
              </SelectTrigger>
              <SelectContent>
                {commonTargets.map((target) => (
                  <SelectItem key={target.name} value={target.name}>
                    {target.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="target-ra">{t("rightAscension")}</Label>
            <Input
              id="target-ra"
              value={slewTarget.ra}
              onChange={(e) => handleRAChange(e.target.value)}
              placeholder="HH:MM:SS"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-dec">{t("declination")}</Label>
            <Input
              id="target-dec"
              value={slewTarget.dec}
              onChange={(e) => handleDecChange(e.target.value)}
              placeholder="±DD:MM:SS"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={startSlew}
            disabled={!canSlew || !isTargetValid()}
            className="flex-1"
          >
            <Navigation className="h-4 w-4 mr-2" />
            {t("slewToTarget")}
          </Button>
          <Button
            onClick={abortSlew}
            disabled={!isSlewing}
            variant="destructive"
          >
            <Square className="h-4 w-4 mr-2" />
            {t("abort")}
          </Button>
        </div>

        {slewTarget.name && (
          <div className="text-sm text-muted-foreground">
            Current target: {slewTarget.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
