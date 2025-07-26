"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Target,
  Activity,
  SkipForward,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

import { Sequence, SequenceStep, SequenceExecutionState } from "../types/sequencer.types";
import { formatDuration, formatTime, getStepTypeIcon, getStepDescription } from "../utils/sequencer.utils";

interface SequenceStatusProps {
  sequence: Sequence | null;
  executionState: SequenceExecutionState;
  currentStep: SequenceStep | null;
  progress: number;
  onSkipStep?: () => void;
  onRetryStep?: () => void;
}

export function SequenceStatus({
  sequence,
  executionState,
  currentStep,
  progress,
  onSkipStep,
  onRetryStep,
}: SequenceStatusProps) {
  if (!sequence) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            No Sequence Selected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select a sequence from the library to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isRunning = executionState.isRunning;
  const isPaused = executionState.isPaused;

  return (
    <div className="space-y-4">
      {/* Sequence Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {sequence.name}
            </div>
            <Badge variant={isRunning ? (isPaused ? "secondary" : "default") : "outline"}>
              {isRunning ? (isPaused ? "Paused" : "Running") : "Ready"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sequence.description && (
              <p className="text-sm text-muted-foreground">
                {sequence.description}
              </p>
            )}

            {sequence.target && (
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4" />
                <span className="font-medium">Target:</span>
                <span>{sequence.target}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Steps:</span>
                <span className="ml-2">{sequence.steps.length}</span>
              </div>
              <div>
                <span className="font-medium">Estimated Duration:</span>
                <span className="ml-2">{formatDuration(sequence.estimatedDuration)}</span>
              </div>
            </div>

            {sequence.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {sequence.metadata.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Execution Progress */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Execution Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    Step {executionState.currentStepIndex + 1} of {executionState.totalSteps}
                  </span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Elapsed:</span>
                  <span className="ml-2">
                    {executionState.startTime
                      ? formatDuration(
                          Math.floor((Date.now() - executionState.startTime.getTime()) / 1000)
                        )
                      : "--"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Remaining:</span>
                  <span className="ml-2">
                    {executionState.estimatedEndTime
                      ? formatDuration(
                          Math.max(0, Math.floor((executionState.estimatedEndTime.getTime() - Date.now()) / 1000))
                        )
                      : "--"}
                  </span>
                </div>
              </div>

              {executionState.startTime && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Started:</span>
                    <span className="ml-2">{formatTime(executionState.startTime)}</span>
                  </div>
                  <div>
                    <span className="font-medium">ETA:</span>
                    <span className="ml-2">
                      {executionState.estimatedEndTime
                        ? formatTime(executionState.estimatedEndTime)
                        : "--"}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Completed:</span>
                  <span className="ml-2 text-green-600">{executionState.completedSteps}</span>
                </div>
                <div>
                  <span className="font-medium">Failed:</span>
                  <span className="ml-2 text-red-600">{executionState.failedSteps}</span>
                </div>
                <div>
                  <span className="font-medium">Skipped:</span>
                  <span className="ml-2 text-yellow-600">{executionState.skippedSteps}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Step */}
      {currentStep && isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Step
              </div>
              <div className="flex gap-2">
                {onRetryStep && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetryStep}
                    disabled={isPaused}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
                {onSkipStep && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onSkipStep}
                    disabled={isPaused}
                  >
                    <SkipForward className="h-3 w-3 mr-1" />
                    Skip
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                  <span className="text-xs">{getStepTypeIcon(currentStep.type)}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{currentStep.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {getStepDescription(currentStep)}
                  </div>
                </div>
                <Badge variant={currentStep.status === 'running' ? 'default' : 'outline'}>
                  {currentStep.status}
                </Badge>
              </div>

              {currentStep.progress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Step Progress</span>
                    <span>{currentStep.progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={currentStep.progress} className="h-2" />
                </div>
              )}

              {currentStep.error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-destructive">Error</div>
                    <div className="text-xs text-destructive/80">{currentStep.error}</div>
                  </div>
                </div>
              )}

              {currentStep.retryCount && currentStep.retryCount > 0 && (
                <div className="text-xs text-muted-foreground">
                  Retry attempt: {currentStep.retryCount} / {currentStep.maxRetries || 3}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sequence Statistics */}
      {!isRunning && sequence.status !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Last Run Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {sequence.startTime && (
                <div>
                  <span className="font-medium">Started:</span>
                  <span className="ml-2">{formatTime(sequence.startTime)}</span>
                </div>
              )}
              {sequence.endTime && (
                <div>
                  <span className="font-medium">Completed:</span>
                  <span className="ml-2">{formatTime(sequence.endTime)}</span>
                </div>
              )}
              {sequence.actualDuration && (
                <div>
                  <span className="font-medium">Duration:</span>
                  <span className="ml-2">{formatDuration(sequence.actualDuration)}</span>
                </div>
              )}
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2">
                  <Badge variant={sequence.status === 'completed' ? 'default' : 'destructive'}>
                    {sequence.status}
                  </Badge>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
