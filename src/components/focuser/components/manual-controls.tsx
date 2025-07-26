"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Target, Minus, Plus, Home, Square } from "lucide-react";
import { useFocuserControls } from "../hooks/use-focuser-controls";
import { useTranslation } from "@/lib/i18n";

export default function ManualControls() {
  const {
    status,
    stepSize,
    targetPosition,
    controlsEnabled,
    availableStepSizes,
    moveIn,
    moveOut,
    moveToTargetPosition,
    homeFocuser,
    stopMovement,
    updateStepSize,
    updateTargetPosition,
    isValidPosition,
    canMoveInDirection,
  } = useFocuserControls();

  const { t } = useTranslation();

  const handleStepSizeChange = (value: number[]) => {
    updateStepSize(value[0]);
  };

  const handleTargetPositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value)) {
      updateTargetPosition(value);
    }
  };

  const handleMoveIn = () => {
    moveIn().catch(console.error);
  };

  const handleMoveOut = () => {
    moveOut().catch(console.error);
  };

  const handleMoveInLarge = () => {
    moveIn(stepSize * 10).catch(console.error);
  };

  const handleMoveOutLarge = () => {
    moveOut(stepSize * 10).catch(console.error);
  };

  const handleMoveToPosition = () => {
    moveToTargetPosition().catch(console.error);
  };

  const handleHome = () => {
    homeFocuser().catch(console.error);
  };

  const handleStop = () => {
    stopMovement().catch(console.error);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t("manualFocusControl")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step Size Control */}
        <div className="space-y-2">
          <Label>{t("stepSize")}: {stepSize}</Label>
          <Slider
            value={[stepSize]}
            onValueChange={handleStepSizeChange}
            max={Math.max(...availableStepSizes)}
            min={Math.min(...availableStepSizes)}
            step={1}
            disabled={!controlsEnabled}
          />
          <div className="flex gap-1 flex-wrap">
            {availableStepSizes.map((size) => (
              <Button
                key={size}
                variant={stepSize === size ? "default" : "outline"}
                size="sm"
                onClick={() => updateStepSize(size)}
                disabled={!controlsEnabled}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>

        {/* Movement Controls */}
        <div className="grid grid-cols-5 gap-2">
          <Button
            variant="outline"
            onClick={handleMoveInLarge}
            disabled={!controlsEnabled || !canMoveInDirection('in', stepSize * 10)}
            title={`${t("moveIn")} ${stepSize * 10} ${t("steps")}`}
          >
            <Minus className="h-4 w-4" />
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleMoveIn}
            disabled={!controlsEnabled || !canMoveInDirection('in', stepSize)}
            title={`${t("moveIn")} ${stepSize} ${t("steps")}`}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleHome}
            disabled={!controlsEnabled}
            title={t("home")}
          >
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleMoveOut}
            disabled={!controlsEnabled || !canMoveInDirection('out', stepSize)}
            title={`${t("moveOut")} ${stepSize} ${t("steps")}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleMoveOutLarge}
            disabled={!controlsEnabled || !canMoveInDirection('out', stepSize * 10)}
            title={`${t("moveOut")} ${stepSize * 10} ${t("steps")}`}
          >
            <Plus className="h-4 w-4" />
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Position Control */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <div className="space-y-2">
            <Label htmlFor="target-position">{t("targetPosition")}</Label>
            <Input
              id="target-position"
              type="number"
              value={targetPosition}
              onChange={handleTargetPositionChange}
              max={status.maxPosition}
              min={0}
              disabled={!controlsEnabled}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleMoveToPosition}
              disabled={
                !controlsEnabled || 
                !isValidPosition(targetPosition) || 
                targetPosition === status.position
              }
              className="w-full"
            >
              {t("moveToPosition")}
            </Button>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={handleHome}
              disabled={!controlsEnabled}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              {t("home")}
            </Button>
          </div>
        </div>

        {/* Stop Button */}
        {status.moving && (
          <div className="pt-2">
            <Button
              variant="destructive"
              onClick={handleStop}
              className="w-full"
            >
              <Square className="h-4 w-4 mr-2" />
              {t("stop")}
            </Button>
          </div>
        )}

        {/* Current Position Display */}
        <div className="pt-2 border-t">
          <div className="text-sm text-muted-foreground text-center">
            {t("currentPosition")}: {status.position.toLocaleString()} / {status.maxPosition.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
