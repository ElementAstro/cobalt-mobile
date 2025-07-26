"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  GripVertical,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { Sequence, SequenceStep } from "../types/sequencer.types";
import { 
  formatDuration, 
  getStepTypeIcon, 
  getStepTypeColor, 
  getStepDescription 
} from "../utils/sequencer.utils";
import { useSequencer } from "../hooks/use-sequencer";
import { StepTemplateSelector } from "./StepTemplateSelector";

interface StepListProps {
  sequence: Sequence | null;
  selectedStepId: string | null;
  isExecuting: boolean;
  currentStepIndex: number;
  onSelectStep: (stepId: string | null) => void;
  onEditStep: (stepId: string) => void;
}

export function StepList({
  sequence,
  selectedStepId,
  isExecuting,
  currentStepIndex,
  onSelectStep,
  onEditStep,
}: StepListProps) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const {
    // addStep, // Unused for now
    deleteStep,
    duplicateStep,
    // moveStep, // Unused for now
  } = useSequencer();

  if (!sequence) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Sequence Selected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select a sequence from the library to view and edit steps.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStepStatusIcon = (step: SequenceStep, index: number) => {
    if (isExecuting && index === currentStepIndex) {
      return <Play className="h-4 w-4 text-blue-500" />;
    }
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStepStatusColor = (step: SequenceStep, index: number) => {
    if (isExecuting && index === currentStepIndex) {
      return "border-blue-500 bg-blue-50 dark:bg-blue-950";
    }
    
    switch (step.status) {
      case 'completed':
        return "border-green-500 bg-green-50 dark:bg-green-950";
      case 'failed':
        return "border-red-500 bg-red-50 dark:bg-red-950";
      case 'running':
        return "border-blue-500 bg-blue-50 dark:bg-blue-950";
      case 'skipped':
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950";
      default:
        return selectedStepId === step.id 
          ? "border-primary bg-primary/5" 
          : "border-border";
    }
  };

  const handleAddStep = () => {
    setShowTemplateSelector(true);
  };

  const handleDeleteStep = (stepId: string) => {
    if (confirm('Are you sure you want to delete this step?')) {
      deleteStep(stepId);
      if (selectedStepId === stepId) {
        onSelectStep(null);
      }
    }
  };

  const handleDuplicateStep = (stepId: string) => {
    duplicateStep(stepId);
  };

  return (
    <div className="space-y-4">
      {showTemplateSelector && (
        <StepTemplateSelector onClose={() => setShowTemplateSelector(false)} />
      )}

      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GripVertical className="h-5 w-5" />
            Sequence Steps
          </CardTitle>
          <Button 
            onClick={handleAddStep} 
            size="sm" 
            variant="outline"
            disabled={isExecuting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sequence.steps.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No steps in this sequence yet.
            </p>
            <Button onClick={handleAddStep} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add First Step
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sequence.steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${getStepStatusColor(step, index)}`}
                onClick={() => onSelectStep(step.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Step Number and Icon */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white ${getStepTypeColor(step.type)}`}>
                        <span className="text-xs">{getStepTypeIcon(step.type)}</span>
                      </div>
                    </div>

                    {/* Step Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate">{step.name}</div>
                        {!step.enabled && (
                          <Badge variant="outline" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                        {step.error && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {getStepDescription(step)}
                      </div>
                      
                      {/* Progress bar for running steps */}
                      {step.status === 'running' && step.progress > 0 && (
                        <div className="mt-2">
                          <Progress value={step.progress} className="h-1" />
                        </div>
                      )}
                    </div>

                    {/* Status and Duration */}
                    <div className="flex items-center gap-2">
                      {getStepStatusIcon(step, index)}
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(step.duration)}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStep(step.id);
                      }}
                      disabled={isExecuting}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateStep(step.id);
                      }}
                      disabled={isExecuting}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStep(step.id);
                      }}
                      disabled={isExecuting}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Error Message */}
                {step.error && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                    {step.error}
                  </div>
                )}

                {/* Retry Information */}
                {step.retryCount && step.retryCount > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Retry attempt: {step.retryCount} / {step.maxRetries || 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sequence Summary */}
        {sequence.steps.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Steps:</span>
                <span className="ml-2">{sequence.steps.length}</span>
              </div>
              <div>
                <span className="font-medium">Total Duration:</span>
                <span className="ml-2">{formatDuration(sequence.estimatedDuration)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
