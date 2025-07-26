"use client";

import { TelescopeControlProps } from "../types/telescope.types";
import MountStatus from "./mount-status";
import SlewControl from "./slew-control";
import ManualControl from "./manual-control";
import MountControl from "./mount-control";

export default function TelescopeControl({ 
  className,
  showAdvanced = true,
  compactMode = false 
}: TelescopeControlProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Mount Status */}
      <MountStatus compact={compactMode} />

      {/* Slew Control */}
      <SlewControl showQuickTargets={showAdvanced} />

      {/* Manual Control */}
      <ManualControl showSlewRate={showAdvanced} />

      {/* Mount Control */}
      <MountControl />
    </div>
  );
}
