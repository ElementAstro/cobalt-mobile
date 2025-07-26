"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  Square,
  // Settings, // Unused for now
  // Library, // Unused for now
  Activity,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { useSequencer } from "../hooks/use-sequencer";
import { useSequenceExecution } from "../hooks/use-sequence-execution";
import { SequenceStatus } from "./SequenceStatus";
import { StepList } from "./StepList";
import { SequenceLibrary } from "./SequenceLibrary";
import { StepEditor } from "./StepEditor";
import { ExecutionLogs } from "./ExecutionLogs";
import { NotificationCenter } from "./NotificationCenter";

export default function SequencerControl() {
  const [activeTab, setActiveTab] = useState("status");
  
  const {
    activeSequence,
    executionState,
    selectedStepId,
    isEditing,
    canStart,
    // canPause, // Unused for now
    canStop,
    startSequence,
    pauseSequence,
    resumeSequence,
    stopSequence,
    // abortSequence, // Unused for now
    setActiveSequence,
    setSelectedStep,
    setIsEditing,
    validateActiveSequence,
  } = useSequencer();

  const {
    isExecuting,
    currentStep,
    progress,
    errors,
    warnings,
    logs,
    skipCurrentStep,
    retryCurrentStep,
    // pauseExecution, // Unused for now
    // resumeExecution, // Unused for now
    // abortExecution, // Unused for now
  } = useSequenceExecution();

  const handleStartSequence = async () => {
    if (!activeSequence) return;
    
    try {
      const validation = validateActiveSequence();
      if (!validation.isValid) {
        // Show validation errors
        console.error("Validation errors:", validation.errors);
        return;
      }
      
      await startSequence();
    } catch (error) {
      console.error("Failed to start sequence:", error);
    }
  };

  const handlePauseResume = () => {
    if (executionState.isPaused) {
      resumeSequence();
    } else {
      pauseSequence();
    }
  };

  const getStatusBadgeVariant = () => {
    if (!activeSequence) return "outline";
    
    if (isExecuting) {
      return executionState.isPaused ? "secondary" : "default";
    }
    
    switch (activeSequence.status) {
      case "completed":
        return "success";
      case "error":
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = () => {
    if (!activeSequence) return "No Sequence";
    
    if (isExecuting) {
      return executionState.isPaused ? "Paused" : "Running";
    }
    
    switch (activeSequence.status) {
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      case "cancelled":
        return "Cancelled";
      case "idle":
        return "Ready";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = () => {
    if (!activeSequence) return <AlertCircle className="h-4 w-4" />;
    
    if (isExecuting) {
      return executionState.isPaused ? 
        <Pause className="h-4 w-4" /> : 
        <Activity className="h-4 w-4" />;
    }
    
    switch (activeSequence.status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Notification Center */}
      <div className="flex justify-end">
        <NotificationCenter />
      </div>

      {/* Header with Status and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Sequencer Control
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant() as any}>
                {getStatusText()}
              </Badge>
              {errors.length > 0 && (
                <Badge variant="destructive">
                  {errors.length} Error{errors.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {warnings.length > 0 && (
                <Badge variant="secondary">
                  {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={handleStartSequence}
              disabled={!canStart || isExecuting}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
            <Button
              onClick={handlePauseResume}
              disabled={!isExecuting}
              variant="outline"
            >
              {executionState.isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button
              onClick={stopSequence}
              disabled={!canStop}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <SequenceStatus
            sequence={activeSequence}
            executionState={executionState}
            currentStep={currentStep}
            progress={progress}
            onSkipStep={skipCurrentStep}
            onRetryStep={retryCurrentStep}
          />
        </TabsContent>

        <TabsContent value="steps" className="space-y-4">
          <StepList
            sequence={activeSequence}
            selectedStepId={selectedStepId}
            isExecuting={isExecuting}
            currentStepIndex={executionState.currentStepIndex}
            onSelectStep={setSelectedStep}
            onEditStep={(stepId) => {
              setSelectedStep(stepId);
              setIsEditing(true);
            }}
          />
          
          {isEditing && selectedStepId && (
            <StepEditor
              sequence={activeSequence}
              stepId={selectedStepId}
              onClose={() => {
                setIsEditing(false);
                setSelectedStep(null);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <SequenceLibrary
            activeSequenceId={activeSequence?.id}
            onSelectSequence={setActiveSequence}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <ExecutionLogs
            logs={logs.map((log, index) => ({
              id: `log-${index}`,
              timestamp: log.timestamp,
              level: log.level,
              message: log.message,
              stepId: log.stepId,
            }))}
            errors={errors.map((error, index) => ({
              id: `error-${index}`,
              timestamp: error.timestamp,
              level: 'error' as const,
              message: error.message,
              stepId: error.stepId,
              recoverable: true,
            }))}
            warnings={warnings.map((warning, index) => ({
              id: `warning-${index}`,
              timestamp: warning.timestamp,
              message: warning.message,
              stepId: warning.stepId,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
