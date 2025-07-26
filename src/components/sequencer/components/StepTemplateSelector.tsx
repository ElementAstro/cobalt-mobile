"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge"; // Unused for now
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Camera,
  Filter,
  Target,
  Clock,
  Focus,
  X,
} from "lucide-react";

import { SequenceStepType } from "../types/sequencer.types";
import { useSequencer } from "../hooks/use-sequencer";
import { getStepTypeName, getStepTypeIcon, getStepTypeColor } from "../utils/sequencer.utils";

interface StepTemplateSelectorProps {
  onClose: () => void;
}

export function StepTemplateSelector({ onClose }: StepTemplateSelectorProps) {
  const [selectedType, setSelectedType] = useState<SequenceStepType>('capture');
  const { addStep } = useSequencer();

  const stepTypes: Array<{ type: SequenceStepType; description: string; icon: React.ComponentType<{ className?: string }> }> = [
    { type: 'capture', description: 'Take images with the camera', icon: Camera },
    { type: 'filter', description: 'Change filter wheel position', icon: Filter },
    { type: 'focus', description: 'Perform focus routine', icon: Focus },
    { type: 'slew', description: 'Move telescope to target', icon: Target },
    { type: 'wait', description: 'Wait for specified duration', icon: Clock },
    { type: 'calibration', description: 'Capture calibration frames', icon: Camera },
    { type: 'dither', description: 'Apply dithering offset', icon: Target },
  ];

  const handleAddStep = () => {
    addStep(selectedType);
    onClose();
  };

  const selectedStepType = stepTypes.find(st => st.type === selectedType);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Add New Step</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Step Type</label>
          <Select value={selectedType} onValueChange={(value: SequenceStepType) => setSelectedType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stepTypes.map((stepType) => (
                <SelectItem key={stepType.type} value={stepType.type}>
                  <div className="flex items-center gap-2">
                    <stepType.icon className="h-4 w-4" />
                    {getStepTypeName(stepType.type)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedStepType && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white ${getStepTypeColor(selectedType)}`}>
                <span className="text-xs">{getStepTypeIcon(selectedType)}</span>
              </div>
              <div>
                <div className="font-medium">{getStepTypeName(selectedType)}</div>
                <div className="text-sm text-muted-foreground">{selectedStepType.description}</div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              This step will be added with default settings that you can customize after creation.
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button onClick={handleAddStep} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
