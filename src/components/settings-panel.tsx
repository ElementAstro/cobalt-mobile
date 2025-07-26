"use client";

import { SettingsPanel as NewSettingsPanel, SettingsProvider } from "./settings";

export default function SettingsPanel() {
  return (
    <SettingsProvider autoSave={true} autoSaveDelay={3000}>
      <NewSettingsPanel />
    </SettingsProvider>
  );
}
