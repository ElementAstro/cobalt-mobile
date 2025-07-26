"use client";

import FocuserStatus from "./focuser-status";
import ManualControls from "./manual-controls";
import AutoFocusControls from "./autofocus-controls";
import FocusCurve from "./focus-curve";

export default function FocuserControl() {
  return (
    <div className="space-y-4">
      <FocuserStatus />
      <ManualControls />
      <AutoFocusControls />
      <FocusCurve />
    </div>
  );
}
