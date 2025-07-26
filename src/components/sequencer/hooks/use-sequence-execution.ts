import { useEffect, useRef, useCallback } from 'react';
import { useSequencerStore } from '../store/sequencer.store';
import { executionService, ExecutionContext } from '../services/execution.service';
import { Sequence, SequenceStep } from '../types/sequencer.types';

export interface UseSequenceExecutionReturn {
  isExecuting: boolean;
  currentStep: SequenceStep | null;
  progress: number;
  errors: Array<{ message: string; timestamp: Date; stepId?: string }>;
  warnings: Array<{ message: string; timestamp: Date; stepId?: string }>;
  logs: Array<{ message: string; timestamp: Date; level: 'info' | 'warn' | 'error' | 'debug'; stepId?: string }>;
  
  // Manual control during execution
  skipCurrentStep: () => void;
  retryCurrentStep: () => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  abortExecution: () => void;
}

export function useSequenceExecution(): UseSequenceExecutionReturn {
  const {
    executionState,
    // activeSequence, // Unused for now
    updateExecutionState,
    updateStepStatus,
    addError,
    // addWarning, // Unused for now
    addLogEntry,
    // stopSequence, // Unused for now
    pauseSequence,
    resumeSequence,
    abortSequence,
    skipCurrentStep: storeSkipCurrentStep,
    retryCurrentStep: storeRetryCurrentStep,
  } = useSequencerStore();

  const abortControllerRef = useRef<AbortController | null>(null);
  const executionPromiseRef = useRef<Promise<void> | null>(null);

  // Start execution when sequence starts
  useEffect(() => {
    if (executionState.isRunning && executionState.sequence && !executionPromiseRef.current) {
      startExecution(executionState.sequence);
    }
  }, [executionState.isRunning, executionState.sequence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const startExecution = useCallback(async (sequence: Sequence) => {
    // Create abort controller for this execution
    abortControllerRef.current = new AbortController();
    
    const context: ExecutionContext = {
      sequence,
      currentStepIndex: executionState.currentStepIndex,
      isRunning: executionState.isRunning,
      isPaused: executionState.isPaused,
      abortSignal: abortControllerRef.current.signal,
      
      onStepStart: (step: SequenceStep) => {
        const stepIndex = sequence.steps.findIndex(s => s.id === step.id);
        updateExecutionState({
          currentStep: step,
          currentStepIndex: stepIndex,
        });
        updateStepStatus(step.id, 'running', 0);
        addLogEntry({
          level: 'info',
          message: `Starting step: ${step.name}`,
          stepId: step.id,
        });
      },
      
      onStepProgress: (stepId: string, progress: number) => {
        updateStepStatus(stepId, 'running', progress);
        
        // Calculate overall sequence progress
        const completedSteps = sequence.steps.slice(0, executionState.currentStepIndex);
        const completedDuration = completedSteps.reduce((total, step) => total + step.duration, 0);
        const currentStepDuration = executionState.currentStep?.duration || 0;
        const currentProgress = (currentStepDuration * progress) / 100;
        const totalDuration = sequence.estimatedDuration;
        
        const overallProgress = totalDuration > 0 
          ? ((completedDuration + currentProgress) / totalDuration) * 100 
          : 0;
        
        updateExecutionState({
          progress: Math.min(overallProgress, 100),
          elapsedTime: executionState.startTime 
            ? Math.floor((Date.now() - executionState.startTime.getTime()) / 1000)
            : 0,
        });
      },
      
      onStepComplete: (stepId: string, success: boolean, error?: string) => {
        const status = success ? 'completed' : 'failed';
        updateStepStatus(stepId, status, 100);
        
        if (success) {
          updateExecutionState({
            completedSteps: executionState.completedSteps + 1,
          });
          addLogEntry({
            level: 'info',
            message: `Step completed: ${executionState.currentStep?.name}`,
            stepId,
          });
        } else {
          updateExecutionState({
            failedSteps: executionState.failedSteps + 1,
          });
          addError({
            stepId,
            level: 'error',
            message: error || 'Step failed',
            recoverable: true,
          });
        }
      },
      
      onSequenceComplete: (success: boolean) => {
        const endTime = new Date();
        const actualDuration = executionState.startTime 
          ? Math.floor((endTime.getTime() - executionState.startTime.getTime()) / 1000)
          : 0;
        
        updateExecutionState({
          isRunning: false,
          isPaused: false,
          progress: 100,
          elapsedTime: actualDuration,
          remainingTime: 0,
        });
        
        if (success) {
          addLogEntry({
            level: 'info',
            message: 'Sequence completed successfully',
          });
        } else {
          addLogEntry({
            level: 'error',
            message: 'Sequence failed',
          });
        }
        
        // Clean up
        abortControllerRef.current = null;
        executionPromiseRef.current = null;
      },
      
      onLog: (message: string, level: 'info' | 'warn' | 'error') => {
        addLogEntry({
          level,
          message,
          stepId: executionState.currentStep?.id,
        });
      },
    };

    try {
      // Update context with current state
      context.isRunning = executionState.isRunning;
      context.isPaused = executionState.isPaused;
      
      executionPromiseRef.current = executionService.executeSequence(context);
      await executionPromiseRef.current;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addError({
        level: 'critical',
        message: `Sequence execution failed: ${errorMessage}`,
        recoverable: false,
      });
      
      updateExecutionState({
        isRunning: false,
        isPaused: false,
      });
    } finally {
      abortControllerRef.current = null;
      executionPromiseRef.current = null;
    }
  }, [
    executionState,
    updateExecutionState,
    updateStepStatus,
    addError,
    addLogEntry,
  ]);

  // Manual control functions
  const skipCurrentStep = useCallback(() => {
    storeSkipCurrentStep();
    executionService.stopCurrentStep();
  }, [storeSkipCurrentStep]);

  const retryCurrentStep = useCallback(() => {
    storeRetryCurrentStep();
    executionService.stopCurrentStep();
  }, [storeRetryCurrentStep]);

  const pauseExecution = useCallback(() => {
    pauseSequence();
  }, [pauseSequence]);

  const resumeExecution = useCallback(() => {
    resumeSequence();
  }, [resumeSequence]);

  const abortExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortSequence();
  }, [abortSequence]);

  // Update execution context when state changes
  useEffect(() => {
    if (executionPromiseRef.current && abortControllerRef.current) {
      // The execution service will check these values in its loop
      // No need to restart execution, just update the context
    }
  }, [executionState.isPaused]);

  return {
    isExecuting: executionState.isRunning,
    currentStep: executionState.currentStep,
    progress: executionState.progress,
    errors: executionState.errors,
    warnings: executionState.warnings,
    logs: executionState.logs.filter(log => log.level !== 'debug'),
    
    skipCurrentStep,
    retryCurrentStep,
    pauseExecution,
    resumeExecution,
    abortExecution,
  };
}
