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
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Home,
  Crosshair,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useSlewControl } from "../hooks/use-slew-control";
import { SLEW_RATES, SLEW_RATE_DESCRIPTIONS } from "../utils/telescope.constants";
import { Direction } from "../types/telescope.types";

interface ManualControlProps {
  className?: string;
  showSlewRate?: boolean;
}

export default function ManualControl({ 
  className, 
  showSlewRate = true 
}: ManualControlProps) {
  const {
    slewRate,
    canMove,
    setSlewRate,
    moveDirection,
  } = useSlewControl();

  const { t } = useTranslation();

  const handleDirectionalMove = (direction: Direction) => {
    moveDirection(direction);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crosshair className="h-5 w-5" />
          {t("manualControl")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSlewRate && (
          <div className="space-y-2">
            <Label htmlFor="slew-rate">{t("slewRate")}</Label>
            <Select value={slewRate} onValueChange={setSlewRate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SLEW_RATES.map((rate) => (
                  <SelectItem key={rate} value={rate}>
                    {SLEW_RATE_DESCRIPTIONS[rate]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          <div></div>
          <Button
            variant="outline"
            size="icon"
            onMouseDown={() => handleDirectionalMove("North")}
            disabled={!canMove}
            className="h-12 w-12"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
          <div></div>
          
          <Button
            variant="outline"
            size="icon"
            onMouseDown={() => handleDirectionalMove("West")}
            disabled={!canMove}
            className="h-12 w-12"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            disabled={!canMove}
            className="h-12 w-12 bg-transparent"
          >
            <Home className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onMouseDown={() => handleDirectionalMove("East")}
            disabled={!canMove}
            className="h-12 w-12"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          
          <div></div>
          <Button
            variant="outline"
            size="icon"
            onMouseDown={() => handleDirectionalMove("South")}
            disabled={!canMove}
            className="h-12 w-12"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
          <div></div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Current rate: {SLEW_RATE_DESCRIPTIONS[slewRate as keyof typeof SLEW_RATE_DESCRIPTIONS]}
        </div>
      </CardContent>
    </Card>
  );
}
