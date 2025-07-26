"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

import { Sequence, SequenceStep, CaptureSettings, FilterSettings, FocusSettings, SlewSettings, WaitSettings } from "../types/sequencer.types";
import { useSequencer } from "../hooks/use-sequencer";
import { getStepTypeName } from "../utils/sequencer.utils";

interface StepEditorProps {
  sequence: Sequence | null;
  stepId: string;
  onClose: () => void;
}

export function StepEditor({ sequence, stepId, onClose }: StepEditorProps) {
  const { updateStep } = useSequencer();
  
  const step = sequence?.steps.find(s => s.id === stepId);
  
  const [editedStep, setEditedStep] = useState<SequenceStep | null>(null);

  useEffect(() => {
    if (step) {
      setEditedStep({ ...step });
    }
  }, [step]);

  if (!sequence || !step || !editedStep) {
    return null;
  }

  const handleSave = () => {
    updateStep(stepId, editedStep);
    onClose();
  };

  const updateStepField = (field: keyof SequenceStep, value: unknown) => {
    setEditedStep(prev => prev ? { ...prev, [field]: value } : null);
  };

  const updateSettings = (settings: SequenceStep['settings']) => {
    setEditedStep(prev => prev ? { ...prev, settings } : null);
  };

  const renderStepTypeSettings = () => {
    switch (editedStep.type) {
      case 'capture':
        return <CaptureSettingsEditor settings={editedStep.settings as CaptureSettings} onChange={updateSettings} />;
      case 'filter':
        return <FilterSettingsEditor settings={editedStep.settings as FilterSettings} onChange={updateSettings} />;
      case 'focus':
        return <FocusSettingsEditor settings={editedStep.settings as FocusSettings} onChange={updateSettings} />;
      case 'slew':
        return <SlewSettingsEditor settings={editedStep.settings as SlewSettings} onChange={updateSettings} />;
      case 'wait':
        return <WaitSettingsEditor settings={editedStep.settings as WaitSettings} onChange={updateSettings} />;
      default:
        return <div className="text-muted-foreground">No settings available for this step type.</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Edit Step: {getStepTypeName(editedStep.type)}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Step Properties */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="step-name">Step Name</Label>
            <Input
              id="step-name"
              value={editedStep.name}
              onChange={(e) => updateStepField('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="step-duration">Duration (seconds)</Label>
            <Input
              id="step-duration"
              type="number"
              value={editedStep.duration}
              onChange={(e) => updateStepField('duration', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="step-description">Description (optional)</Label>
          <Input
            id="step-description"
            value={editedStep.description || ''}
            onChange={(e) => updateStepField('description', e.target.value)}
            placeholder="Optional description for this step"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="step-enabled"
            checked={editedStep.enabled}
            onCheckedChange={(checked) => updateStepField('enabled', checked)}
          />
          <Label htmlFor="step-enabled">Enabled</Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max-retries">Max Retries</Label>
            <Input
              id="max-retries"
              type="number"
              value={editedStep.maxRetries || 3}
              onChange={(e) => updateStepField('maxRetries', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Step Type Specific Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Step Settings</h4>
          {renderStepTypeSettings()}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Settings Editors for different step types
function CaptureSettingsEditor({ settings, onChange }: { settings: CaptureSettings; onChange: (settings: CaptureSettings) => void }) {
  const updateSetting = (field: keyof CaptureSettings, value: CaptureSettings[keyof CaptureSettings]) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Exposure (seconds)</Label>
        <Input
          type="number"
          value={settings.exposure}
          onChange={(e) => updateSetting('exposure', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="space-y-2">
        <Label>Frame Count</Label>
        <Input
          type="number"
          value={settings.count}
          onChange={(e) => updateSetting('count', parseInt(e.target.value) || 0)}
        />
      </div>
      <div className="space-y-2">
        <Label>Binning</Label>
        <Select value={settings.binning} onValueChange={(value: string) => updateSetting('binning', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1x1">1x1</SelectItem>
            <SelectItem value="2x2">2x2</SelectItem>
            <SelectItem value="3x3">3x3</SelectItem>
            <SelectItem value="4x4">4x4</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Frame Type</Label>
        <Select value={settings.frameType} onValueChange={(value: string) => updateSetting('frameType', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="flat">Flat</SelectItem>
            <SelectItem value="bias">Bias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Gain (optional)</Label>
        <Input
          type="number"
          value={settings.gain || ''}
          onChange={(e) => updateSetting('gain', e.target.value ? parseInt(e.target.value) : undefined)}
        />
      </div>
      <div className="space-y-2">
        <Label>Offset (optional)</Label>
        <Input
          type="number"
          value={settings.offset || ''}
          onChange={(e) => updateSetting('offset', e.target.value ? parseInt(e.target.value) : undefined)}
        />
      </div>
      <div className="col-span-2 flex items-center space-x-2">
        <Switch
          checked={settings.dither || false}
          onCheckedChange={(checked) => updateSetting('dither', checked)}
        />
        <Label>Enable Dithering</Label>
      </div>
    </div>
  );
}

function FilterSettingsEditor({ settings, onChange }: { settings: FilterSettings; onChange: (settings: FilterSettings) => void }) {
  const updateSetting = (field: keyof FilterSettings, value: FilterSettings[keyof FilterSettings]) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Filter Position</Label>
        <Input
          type="number"
          min="1"
          max="8"
          value={settings.position}
          onChange={(e) => updateSetting('position', parseInt(e.target.value) || 1)}
        />
      </div>
      <div className="space-y-2">
        <Label>Filter Name (optional)</Label>
        <Input
          value={settings.name || ''}
          onChange={(e) => updateSetting('name', e.target.value)}
          placeholder="e.g., Luminance, Red, etc."
        />
      </div>
      <div className="space-y-2">
        <Label>Wait Time (seconds)</Label>
        <Input
          type="number"
          value={settings.waitTime || 5}
          onChange={(e) => updateSetting('waitTime', parseInt(e.target.value) || 5)}
        />
      </div>
    </div>
  );
}

function FocusSettingsEditor({ settings, onChange }: { settings: FocusSettings; onChange: (settings: FocusSettings) => void }) {
  const updateSetting = (field: keyof FocusSettings, value: FocusSettings[keyof FocusSettings]) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Focus Type</Label>
        <Select value={settings.type} onValueChange={(value: any) => updateSetting('type', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto Focus</SelectItem>
            <SelectItem value="manual">Manual Position</SelectItem>
            <SelectItem value="relative">Relative Move</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {settings.type !== 'auto' && (
        <div className="space-y-2">
          <Label>Position</Label>
          <Input
            type="number"
            value={settings.position || ''}
            onChange={(e) => updateSetting('position', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>
      )}
      
      {settings.type === 'auto' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tolerance</Label>
            <Input
              type="number"
              step="0.1"
              value={settings.tolerance || 0.5}
              onChange={(e) => updateSetting('tolerance', parseFloat(e.target.value) || 0.5)}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Attempts</Label>
            <Input
              type="number"
              value={settings.maxAttempts || 5}
              onChange={(e) => updateSetting('maxAttempts', parseInt(e.target.value) || 5)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SlewSettingsEditor({ settings, onChange }: { settings: SlewSettings; onChange: (settings: SlewSettings) => void }) {
  const updateSetting = (field: keyof SlewSettings, value: SlewSettings[keyof SlewSettings]) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Right Ascension</Label>
          <Input
            value={settings.ra}
            onChange={(e) => updateSetting('ra', e.target.value)}
            placeholder="00h 00m 00s"
          />
        </div>
        <div className="space-y-2">
          <Label>Declination</Label>
          <Input
            value={settings.dec}
            onChange={(e) => updateSetting('dec', e.target.value)}
            placeholder="+00° 00' 00&quot;"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Target Name (optional)</Label>
        <Input
          value={settings.targetName || ''}
          onChange={(e) => updateSetting('targetName', e.target.value)}
          placeholder="e.g., M31, NGC 7000"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            checked={settings.platesolve || false}
            onCheckedChange={(checked) => updateSetting('platesolve', checked)}
          />
          <Label>Plate Solve</Label>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            checked={settings.centerTarget || false}
            onCheckedChange={(checked) => updateSetting('centerTarget', checked)}
          />
          <Label>Center Target</Label>
        </div>
      </div>
    </div>
  );
}

function WaitSettingsEditor({ settings, onChange }: { settings: WaitSettings; onChange: (settings: WaitSettings) => void }) {
  const updateSetting = (field: keyof WaitSettings, value: WaitSettings[keyof WaitSettings]) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wait Duration (seconds)</Label>
        <Input
          type="number"
          value={settings.duration}
          onChange={(e) => updateSetting('duration', parseInt(e.target.value) || 0)}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Reason (optional)</Label>
        <Input
          value={settings.reason || ''}
          onChange={(e) => updateSetting('reason', e.target.value)}
          placeholder="e.g., Settling time, Cool down"
        />
      </div>
    </div>
  );
}
