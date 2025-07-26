import { useCallback, useEffect } from 'react';
import { useSequencerStore } from '../store/sequencer.store';
import { useAppStore } from '@/lib/store';
import {
  Sequence,
  SequenceStep,
  SequenceStepType,
  ValidationResult,
  SequenceExecutionState,
  SequenceLibrary,
  SequenceStatistics,
  SerializationResult
} from '../types/sequencer.types';
import { validateSequence, createStepTemplate } from '../utils/sequencer.utils';

export interface UseSequencerReturn {
  // State
  activeSequence: Sequence | null;
  executionState: SequenceExecutionState;
  library: SequenceLibrary;
  statistics: SequenceStatistics & { totalExposureTime: number };
  selectedStepId: string | null;
  isEditing: boolean;
  showAdvanced: boolean;
  
  // Sequence Management
  createSequence: (name: string, description?: string) => Sequence;
  updateSequence: (sequenceId: string, updates: Partial<Sequence>) => void;
  deleteSequence: (sequenceId: string) => void;
  duplicateSequence: (sequenceId: string, newName?: string) => Sequence;
  setActiveSequence: (sequenceId: string | null) => void;
  validateActiveSequence: () => ValidationResult;
  
  // Step Management
  addStep: (type: SequenceStepType) => void;
  updateStep: (stepId: string, updates: Partial<SequenceStep>) => void;
  deleteStep: (stepId: string) => void;
  moveStep: (stepId: string, newIndex: number) => void;
  duplicateStep: (stepId: string) => void;
  
  // Execution Control
  canStart: boolean;
  canPause: boolean;
  canStop: boolean;
  startSequence: () => Promise<void>;
  pauseSequence: () => void;
  resumeSequence: () => void;
  stopSequence: () => void;
  abortSequence: () => void;
  skipCurrentStep: () => void;
  retryCurrentStep: () => void;
  
  // UI State
  setSelectedStep: (stepId: string | null) => void;
  setIsEditing: (editing: boolean) => void;
  setShowAdvanced: (show: boolean) => void;
  
  // Import/Export
  exportSequences: (sequenceIds: string[]) => Promise<SerializationResult>;
  importSequences: (data: string) => Promise<void>;
}

export function useSequencer(): UseSequencerReturn {
  const {
    activeSequence,
    executionState,
    library,
    statistics,
    selectedStepId,
    isEditing,
    showAdvanced,
    
    // Store actions
    createSequence: storeCreateSequence,
    updateSequence: storeUpdateSequence,
    deleteSequence: storeDeleteSequence,
    duplicateSequence: storeDuplicateSequence,
    setActiveSequence: storeSetActiveSequence,
    
    addStep: storeAddStep,
    updateStep: storeUpdateStep,
    deleteStep: storeDeleteStep,
    moveStep: storeMoveStep,
    duplicateStep: storeDuplicateStep,
    
    startSequence: storeStartSequence,
    pauseSequence: storePauseSequence,
    resumeSequence: storeResumeSequence,
    stopSequence: storeStopSequence,
    abortSequence: storeAbortSequence,
    skipCurrentStep: storeSkipCurrentStep,
    retryCurrentStep: storeRetryCurrentStep,
    
    setSelectedStep: storeSetSelectedStep,
    setIsEditing: storeSetIsEditing,
    setShowAdvanced: storeSetShowAdvanced,
    
    exportSequences: storeExportSequences,
    importSequences: storeImportSequences,
    
    updateStatistics,
  } = useSequencerStore();

  // Integration with main app store
  const { setSequenceStatus } = useAppStore();

  // Sync execution state with main app store
  useEffect(() => {
    setSequenceStatus({
      running: executionState.isRunning,
      paused: executionState.isPaused,
      currentStep: executionState.currentStepIndex,
      totalSteps: executionState.totalSteps,
      progress: executionState.progress,
      startTime: executionState.startTime,
      estimatedEndTime: executionState.estimatedEndTime,
    });
  }, [
    executionState.isRunning,
    executionState.isPaused,
    executionState.currentStepIndex,
    executionState.totalSteps,
    executionState.progress,
    executionState.startTime,
    executionState.estimatedEndTime,
    setSequenceStatus,
  ]);

  // Sequence Management
  const createSequence = useCallback((name: string, description?: string) => {
    return storeCreateSequence(name, description);
  }, [storeCreateSequence]);

  const updateSequence = useCallback((sequenceId: string, updates: Partial<Sequence>) => {
    storeUpdateSequence(sequenceId, updates);
  }, [storeUpdateSequence]);

  const deleteSequence = useCallback((sequenceId: string) => {
    storeDeleteSequence(sequenceId);
  }, [storeDeleteSequence]);

  const duplicateSequence = useCallback((sequenceId: string, newName?: string) => {
    return storeDuplicateSequence(sequenceId, newName);
  }, [storeDuplicateSequence]);

  const setActiveSequence = useCallback((sequenceId: string | null) => {
    storeSetActiveSequence(sequenceId);
  }, [storeSetActiveSequence]);

  const validateActiveSequence = useCallback((): ValidationResult => {
    if (!activeSequence) {
      return {
        isValid: false,
        errors: [{ field: 'sequence', message: 'No active sequence', code: 'NO_SEQUENCE' }],
        warnings: [],
      };
    }
    return validateSequence(activeSequence);
  }, [activeSequence]);

  // Step Management
  const addStep = useCallback((type: SequenceStepType) => {
    if (!activeSequence) return;
    
    const stepTemplate = createStepTemplate(type);
    storeAddStep(activeSequence.id, stepTemplate);
  }, [activeSequence, storeAddStep]);

  const updateStep = useCallback((stepId: string, updates: Partial<SequenceStep>) => {
    if (!activeSequence) return;
    storeUpdateStep(activeSequence.id, stepId, updates);
  }, [activeSequence, storeUpdateStep]);

  const deleteStep = useCallback((stepId: string) => {
    if (!activeSequence) return;
    storeDeleteStep(activeSequence.id, stepId);
  }, [activeSequence, storeDeleteStep]);

  const moveStep = useCallback((stepId: string, newIndex: number) => {
    if (!activeSequence) return;
    storeMoveStep(activeSequence.id, stepId, newIndex);
  }, [activeSequence, storeMoveStep]);

  const duplicateStep = useCallback((stepId: string) => {
    if (!activeSequence) return;
    storeDuplicateStep(activeSequence.id, stepId);
  }, [activeSequence, storeDuplicateStep]);

  // Execution Control
  const canStart = Boolean(!executionState.isRunning && activeSequence && activeSequence.steps.length > 0);
  const canPause = executionState.isRunning && !executionState.isPaused;
  const canStop = executionState.isRunning;

  const startSequence = useCallback(async () => {
    if (!activeSequence || !canStart) return;
    
    const validation = validateActiveSequence();
    if (!validation.isValid) {
      throw new Error(`Cannot start sequence: ${validation.errors[0]?.message}`);
    }
    
    await storeStartSequence(activeSequence.id);
  }, [activeSequence, canStart, validateActiveSequence, storeStartSequence]);

  const pauseSequence = useCallback(() => {
    if (canPause) {
      storePauseSequence();
    }
  }, [canPause, storePauseSequence]);

  const resumeSequence = useCallback(() => {
    if (executionState.isRunning && executionState.isPaused) {
      storeResumeSequence();
    }
  }, [executionState.isRunning, executionState.isPaused, storeResumeSequence]);

  const stopSequence = useCallback(() => {
    if (canStop) {
      storeStopSequence();
    }
  }, [canStop, storeStopSequence]);

  const abortSequence = useCallback(() => {
    storeAbortSequence();
  }, [storeAbortSequence]);

  const skipCurrentStep = useCallback(() => {
    storeSkipCurrentStep();
  }, [storeSkipCurrentStep]);

  const retryCurrentStep = useCallback(() => {
    storeRetryCurrentStep();
  }, [storeRetryCurrentStep]);

  // UI State
  const setSelectedStep = useCallback((stepId: string | null) => {
    storeSetSelectedStep(stepId);
  }, [storeSetSelectedStep]);

  const setIsEditing = useCallback((editing: boolean) => {
    storeSetIsEditing(editing);
  }, [storeSetIsEditing]);

  const setShowAdvanced = useCallback((show: boolean) => {
    storeSetShowAdvanced(show);
  }, [storeSetShowAdvanced]);

  // Import/Export
  const exportSequences = useCallback((sequenceIds: string[]) => {
    return storeExportSequences(sequenceIds);
  }, [storeExportSequences]);

  const importSequences = useCallback(async (data: string) => {
    await storeImportSequences(data);
    updateStatistics();
  }, [storeImportSequences, updateStatistics]);

  return {
    // State
    activeSequence,
    executionState,
    library,
    statistics,
    selectedStepId,
    isEditing,
    showAdvanced,
    
    // Sequence Management
    createSequence,
    updateSequence,
    deleteSequence,
    duplicateSequence,
    setActiveSequence,
    validateActiveSequence,
    
    // Step Management
    addStep,
    updateStep,
    deleteStep,
    moveStep,
    duplicateStep,
    
    // Execution Control
    canStart,
    canPause,
    canStop,
    startSequence,
    pauseSequence,
    resumeSequence,
    stopSequence,
    abortSequence,
    skipCurrentStep,
    retryCurrentStep,
    
    // UI State
    setSelectedStep,
    setIsEditing,
    setShowAdvanced,
    
    // Import/Export
    exportSequences,
    importSequences,
  };
}
