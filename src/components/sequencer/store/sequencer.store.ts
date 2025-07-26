import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Sequence,
  SequenceStep,
  SequenceStepType,
  SequenceExecutionState,
  SequenceLibrary,
  SequenceTemplate,
  Workspace,
  Target,
  TargetLibrary,
  SerializationOptions,
  SerializationResult,
  DeserializationResult,
  BulkEditOptions,
  BulkEditResult,
  StepEditOperation,
  // SequenceStatus, // Unused for now
  StepStatus,
  SequenceError,
  SequenceWarning,
  SequenceLogEntry,
  SequenceStatistics
} from '../types/sequencer.types';
import { generateId } from '../utils/sequencer.utils';
import { TemplateService } from '../services/template.service';
import { SerializationService } from '../services/serialization.service';
import { StepEditorService } from '../services/step-editor.service';

interface SequencerStore {
  // Current execution state
  executionState: SequenceExecutionState;

  // Library management
  library: SequenceLibrary;

  // Workspace management
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;

  // Target library
  targetLibrary: TargetLibrary;

  // Active sequence
  activeSequence: Sequence | null;

  // Statistics
  statistics: SequenceStatistics;

  // UI state
  selectedStepId: string | null;
  isEditing: boolean;
  showAdvanced: boolean;
  
  // Actions - Execution Control
  startSequence: (sequenceId: string) => Promise<void>;
  pauseSequence: () => void;
  resumeSequence: () => void;
  stopSequence: () => void;
  abortSequence: () => void;
  skipCurrentStep: () => void;
  retryCurrentStep: () => void;
  
  // Actions - Sequence Management
  createSequence: (name: string, description?: string) => Sequence;
  updateSequence: (sequenceId: string, updates: Partial<Sequence>) => void;
  deleteSequence: (sequenceId: string) => void;
  duplicateSequence: (sequenceId: string, newName?: string) => Sequence;
  setActiveSequence: (sequenceId: string | null) => void;
  
  // Actions - Step Management (Enhanced)
  addStep: (sequenceId: string, step: Omit<SequenceStep, 'id'>) => void;
  updateStep: (sequenceId: string, stepId: string, updates: Partial<SequenceStep>) => void;
  deleteStep: (sequenceId: string, stepId: string) => void;
  moveStep: (sequenceId: string, stepId: string, newIndex: number) => void;
  duplicateStep: (sequenceId: string, stepId: string) => void;

  // Enhanced step editing
  bulkUpdateSteps: (sequenceId: string, options: BulkEditOptions) => Promise<BulkEditResult>;
  bulkDeleteSteps: (sequenceId: string, stepIds: string[]) => void;
  bulkDuplicateSteps: (sequenceId: string, stepIds: string[]) => void;
  bulkMoveSteps: (sequenceId: string, stepIds: string[], targetIndex: number) => void;

  // Clipboard operations
  copySteps: (stepIds: string[]) => void;
  cutSteps: (sequenceId: string, stepIds: string[]) => void;
  pasteSteps: (sequenceId: string, targetIndex?: number) => void;
  hasClipboardData: () => boolean;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearEditHistory: () => void;
  
  // Actions - Template Management
  createTemplate: (sequence: Sequence, name: string, description: string) => SequenceTemplate;
  deleteTemplate: (templateId: string) => void;
  applyTemplate: (templateId: string, sequenceId: string) => void;
  
  // Actions - Import/Export (Enhanced)
  exportSequences: (sequenceIds: string[], options?: SerializationOptions) => Promise<SerializationResult>;
  importSequences: (data: string | File) => Promise<DeserializationResult>;
  exportWorkspace: (workspaceId: string, options?: SerializationOptions) => Promise<SerializationResult>;
  importWorkspace: (data: string | File) => Promise<DeserializationResult>;

  // Actions - Workspace Management
  createWorkspace: (name: string, description?: string) => Workspace;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (workspaceId: string) => void;
  setActiveWorkspace: (workspaceId: string | null) => void;
  addSequenceToWorkspace: (workspaceId: string, sequenceId: string) => void;
  removeSequenceFromWorkspace: (workspaceId: string, sequenceId: string) => void;

  // Actions - Target Management
  createTarget: (target: Omit<Target, 'id' | 'created' | 'modified'>) => Target;
  updateTarget: (targetId: string, updates: Partial<Target>) => void;
  deleteTarget: (targetId: string) => void;
  importTargets: (targets: Target[]) => void;
  searchTargets: (query: string) => Target[];
  
  // Actions - Logging and Errors
  addError: (error: Omit<SequenceError, 'id' | 'timestamp'>) => void;
  addWarning: (warning: Omit<SequenceWarning, 'id' | 'timestamp'>) => void;
  addLogEntry: (entry: Omit<SequenceLogEntry, 'id' | 'timestamp'>) => void;
  clearErrors: () => void;
  clearWarnings: () => void;
  clearLogs: () => void;
  
  // Actions - UI State
  setSelectedStep: (stepId: string | null) => void;
  setIsEditing: (editing: boolean) => void;
  setShowAdvanced: (show: boolean) => void;
  
  // Actions - Statistics
  updateStatistics: () => void;
  
  // Internal actions
  updateExecutionState: (updates: Partial<SequenceExecutionState>) => void;
  updateStepStatus: (stepId: string, status: StepStatus, progress?: number) => void;
}

const initialExecutionState: SequenceExecutionState = {
  sequence: null,
  isRunning: false,
  isPaused: false,
  currentStep: null,
  currentStepIndex: -1,
  totalSteps: 0,
  completedSteps: 0,
  failedSteps: 0,
  skippedSteps: 0,
  progress: 0,
  startTime: null,
  pausedTime: null,
  estimatedEndTime: null,
  elapsedTime: 0,
  remainingTime: 0,
  errors: [],
  warnings: [],
  logs: [],
};

const initialLibrary: SequenceLibrary = {
  sequences: [TemplateService.createSampleSequence()],
  templates: TemplateService.getBuiltInTemplates(),
  categories: ['Deep Sky', 'Planetary', 'Solar', 'Lunar', 'Calibration', 'Testing'],
  tags: ['LRGB', 'Narrowband', 'Planetary', 'Solar', 'Lunar', 'Calibration', 'Sample'],
};

const initialTargetLibrary: TargetLibrary = {
  targets: [],
  categories: ['Deep Sky Objects', 'Planets', 'Stars', 'Solar System', 'Custom'],
  catalogs: ['Messier', 'NGC', 'IC', 'Caldwell', 'Sharpless', 'Barnard'],
  tags: ['Galaxy', 'Nebula', 'Star Cluster', 'Planetary Nebula', 'Supernova Remnant'],
};

const initialStatistics: SequenceStatistics = {
  totalSequences: 0,
  completedSequences: 0,
  totalRuntime: 0,
  averageRuntime: 0,
  successRate: 0,
  totalExposureTime: 0,
  mostUsedStepTypes: [],
  recentActivity: [],
};

export const useSequencerStore = create<SequencerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      executionState: initialExecutionState,
      library: initialLibrary,
      workspaces: [],
      activeWorkspace: null,
      targetLibrary: initialTargetLibrary,
      activeSequence: null,
      statistics: initialStatistics,
      selectedStepId: null,
      isEditing: false,
      showAdvanced: false,

      // Execution Control
      startSequence: async (sequenceId: string) => {
        const { library } = get();
        const sequence = library.sequences.find(s => s.id === sequenceId);
        
        if (!sequence) {
          throw new Error(`Sequence with id ${sequenceId} not found`);
        }

        // Reset sequence state
        const resetSequence: Sequence = {
          ...sequence,
          status: 'running',
          progress: 0,
          currentStepIndex: 0,
          startTime: new Date(),
          endTime: undefined,
          actualDuration: undefined,
          steps: sequence.steps.map(step => ({
            ...step,
            status: 'pending',
            progress: 0,
            startTime: undefined,
            endTime: undefined,
            error: undefined,
            retryCount: 0,
          })),
        };

        set({
          executionState: {
            ...initialExecutionState,
            sequence: resetSequence,
            isRunning: true,
            currentStepIndex: 0,
            totalSteps: resetSequence.steps.length,
            startTime: new Date(),
            estimatedEndTime: new Date(Date.now() + resetSequence.estimatedDuration * 1000),
          },
          activeSequence: resetSequence,
        });

        // Update sequence in library
        get().updateSequence(sequenceId, resetSequence);
      },

      pauseSequence: () => {
        const { executionState } = get();
        if (executionState.isRunning && !executionState.isPaused) {
          set({
            executionState: {
              ...executionState,
              isPaused: true,
              pausedTime: new Date(),
            },
          });
        }
      },

      resumeSequence: () => {
        const { executionState } = get();
        if (executionState.isRunning && executionState.isPaused) {
          set({
            executionState: {
              ...executionState,
              isPaused: false,
              pausedTime: null,
            },
          });
        }
      },

      stopSequence: () => {
        const { executionState, activeSequence } = get();
        
        if (activeSequence) {
          const updatedSequence: Sequence = {
            ...activeSequence,
            status: 'cancelled',
            endTime: new Date(),
            actualDuration: executionState.startTime 
              ? Math.floor((Date.now() - executionState.startTime.getTime()) / 1000)
              : 0,
          };
          
          get().updateSequence(activeSequence.id, updatedSequence);
        }

        set({
          executionState: initialExecutionState,
          activeSequence: null,
        });
      },

      abortSequence: () => {
        get().stopSequence();
        get().addError({
          level: 'error',
          message: 'Sequence aborted by user',
          recoverable: false,
        });
      },

      skipCurrentStep: () => {
        const { executionState } = get();
        if (executionState.currentStep) {
          get().updateStepStatus(executionState.currentStep.id, 'skipped', 100);
        }
      },

      retryCurrentStep: () => {
        const { executionState } = get();
        if (executionState.currentStep) {
          get().updateStepStatus(executionState.currentStep.id, 'pending', 0);
        }
      },

      // Sequence Management
      createSequence: (name: string, description?: string) => {
        const now = new Date();
        const newSequence: Sequence = {
          id: generateId(),
          name,
          description,
          steps: [],
          status: 'idle',
          progress: 0,
          currentStepIndex: -1,
          estimatedDuration: 0,
          conditions: [],
          metadata: {
            tags: [],
            modified: now,
          },
          created: now,
          modified: now,
          version: '1.0.0',
        };

        set(state => ({
          library: {
            ...state.library,
            sequences: [...state.library.sequences, newSequence],
          },
        }));

        get().updateStatistics();
        return newSequence;
      },

      updateSequence: (sequenceId: string, updates: Partial<Sequence>) => {
        set(state => ({
          library: {
            ...state.library,
            sequences: state.library.sequences.map(seq =>
              seq.id === sequenceId 
                ? { ...seq, ...updates, modified: new Date() }
                : seq
            ),
          },
          activeSequence: state.activeSequence?.id === sequenceId
            ? { ...state.activeSequence, ...updates, modified: new Date() }
            : state.activeSequence,
        }));
      },

      deleteSequence: (sequenceId: string) => {
        set(state => ({
          library: {
            ...state.library,
            sequences: state.library.sequences.filter(seq => seq.id !== sequenceId),
          },
          activeSequence: state.activeSequence?.id === sequenceId ? null : state.activeSequence,
        }));
        get().updateStatistics();
      },

      duplicateSequence: (sequenceId: string, newName?: string) => {
        const { library } = get();
        const sequence = library.sequences.find(s => s.id === sequenceId);
        
        if (!sequence) {
          throw new Error(`Sequence with id ${sequenceId} not found`);
        }

        const duplicated: Sequence = {
          ...sequence,
          id: generateId(),
          name: newName || `${sequence.name} (Copy)`,
          modified: new Date(),
          status: 'idle',
          progress: 0,
          currentStepIndex: -1,
          startTime: undefined,
          endTime: undefined,
          actualDuration: undefined,
          steps: sequence.steps.map(step => ({
            ...step,
            id: generateId(),
            status: 'pending',
            progress: 0,
            startTime: undefined,
            endTime: undefined,
            error: undefined,
            retryCount: 0,
          })),
        };

        set(state => ({
          library: {
            ...state.library,
            sequences: [...state.library.sequences, duplicated],
          },
        }));

        get().updateStatistics();
        return duplicated;
      },

      setActiveSequence: (sequenceId: string | null) => {
        const { library } = get();
        const sequence = sequenceId 
          ? library.sequences.find(s => s.id === sequenceId) || null
          : null;
        
        set({ activeSequence: sequence });
      },

      // Step Management
      addStep: (sequenceId: string, step: Omit<SequenceStep, 'id'>) => {
        const newStep: SequenceStep = {
          ...step,
          id: generateId(),
        };

        // Record operation for undo/redo
        const operation: StepEditOperation = {
          id: generateId(),
          type: 'create',
          timestamp: new Date(),
          data: { sequenceId, step: newStep },
        };
        StepEditorService.addOperation(operation);

        set(state => ({
          library: {
            ...state.library,
            sequences: state.library.sequences.map(seq =>
              seq.id === sequenceId
                ? {
                    ...seq,
                    steps: [...seq.steps, newStep],
                    estimatedDuration: seq.estimatedDuration + step.duration,
                    modified: new Date(),
                  }
                : seq
            ),
          },
        }));

        // Update active sequence if it matches
        const { activeSequence } = get();
        if (activeSequence?.id === sequenceId) {
          set({
            activeSequence: {
              ...activeSequence,
              steps: [...activeSequence.steps, newStep],
              estimatedDuration: activeSequence.estimatedDuration + step.duration,
              modified: new Date(),
            },
          });
        }
      },

      updateStep: (sequenceId: string, stepId: string, updates: Partial<SequenceStep>) => {
        const { library } = get();
        const sequence = library.sequences.find(s => s.id === sequenceId);
        const originalStep = sequence?.steps.find(s => s.id === stepId);

        if (originalStep) {
          // Record operation for undo/redo
          const operation: StepEditOperation = {
            id: generateId(),
            type: 'update',
            timestamp: new Date(),
            data: { sequenceId, stepId, updates },
            previousData: { ...originalStep },
          };
          StepEditorService.addOperation(operation);
        }

        set(state => ({
          library: {
            ...state.library,
            sequences: state.library.sequences.map(seq =>
              seq.id === sequenceId
                ? {
                    ...seq,
                    steps: seq.steps.map(step =>
                      step.id === stepId ? { ...step, ...updates } : step
                    ),
                    modified: new Date(),
                  }
                : seq
            ),
          },
        }));

        // Update active sequence if it matches
        const { activeSequence } = get();
        if (activeSequence?.id === sequenceId) {
          set({
            activeSequence: {
              ...activeSequence,
              steps: activeSequence.steps.map(step =>
                step.id === stepId ? { ...step, ...updates } : step
              ),
              modified: new Date(),
            },
          });
        }
      },

      deleteStep: (sequenceId: string, stepId: string) => {
        set(state => ({
          library: {
            ...state.library,
            sequences: state.library.sequences.map(seq =>
              seq.id === sequenceId
                ? {
                    ...seq,
                    steps: seq.steps.filter(step => step.id !== stepId),
                    modified: new Date(),
                  }
                : seq
            ),
          },
        }));

        // Update active sequence if it matches
        const { activeSequence } = get();
        if (activeSequence?.id === sequenceId) {
          set({
            activeSequence: {
              ...activeSequence,
              steps: activeSequence.steps.filter(step => step.id !== stepId),
              modified: new Date(),
            },
          });
        }
      },

      moveStep: (sequenceId: string, stepId: string, newIndex: number) => {
        set(state => ({
          library: {
            ...state.library,
            sequences: state.library.sequences.map(seq => {
              if (seq.id !== sequenceId) return seq;
              
              const steps = [...seq.steps];
              const stepIndex = steps.findIndex(s => s.id === stepId);
              
              if (stepIndex === -1) return seq;
              
              const [step] = steps.splice(stepIndex, 1);
              steps.splice(newIndex, 0, step);
              
              return {
                ...seq,
                steps,
                modified: new Date(),
              };
            }),
          },
        }));
      },

      duplicateStep: (sequenceId: string, stepId: string) => {
        const { library } = get();
        const sequence = library.sequences.find(s => s.id === sequenceId);
        const step = sequence?.steps.find(s => s.id === stepId);
        
        if (!step) return;
        
        const duplicatedStep: SequenceStep = {
          ...step,
          id: generateId(),
          name: `${step.name} (Copy)`,
        };
        
        get().addStep(sequenceId, duplicatedStep);
      },

      // Enhanced Step Editing
      bulkUpdateSteps: async (sequenceId: string, options: BulkEditOptions) => {
        const { library } = get();
        const sequence = library.sequences.find(s => s.id === sequenceId);

        if (!sequence) {
          return {
            success: false,
            updatedSteps: [],
            failedSteps: [{ stepId: 'sequence', error: 'Sequence not found' }],
            warnings: [],
          };
        }

        const result = await StepEditorService.bulkUpdateSteps(sequence.steps, options);

        if (result.success && result.updatedSteps.length > 0) {
          // Record operation for undo/redo
          const operation: StepEditOperation = {
            id: generateId(),
            type: 'bulk_update',
            timestamp: new Date(),
            data: { sequenceId, options },
            previousData: sequence.steps.filter(s => options.stepIds.includes(s.id)),
          };
          StepEditorService.addOperation(operation);

          // Apply updates
          result.updatedSteps.forEach(stepId => {
            get().updateStep(sequenceId, stepId, options.updates);
          });
        }

        return result;
      },

      bulkDeleteSteps: (sequenceId: string, stepIds: string[]) => {
        const { library } = get();
        const sequence = library.sequences.find(s => s.id === sequenceId);

        if (!sequence) return;

        // Record operation for undo/redo
        const deletedSteps = sequence.steps.filter(s => stepIds.includes(s.id));
        const operation: StepEditOperation = {
          id: generateId(),
          type: 'delete',
          timestamp: new Date(),
          data: { sequenceId, stepIds },
          previousData: deletedSteps,
        };
        StepEditorService.addOperation(operation);

        set(state => ({
          library: {
            ...state.library,
            sequences: state.library.sequences.map(seq =>
              seq.id === sequenceId
                ? {
                    ...seq,
                    steps: seq.steps.filter(step => !stepIds.includes(step.id)),
                    modified: new Date(),
                  }
                : seq
            ),
          },
        }));

        // Update active sequence if it matches
        const { activeSequence } = get();
        if (activeSequence?.id === sequenceId) {
          set({
            activeSequence: {
              ...activeSequence,
              steps: activeSequence.steps.filter(step => !stepIds.includes(step.id)),
              modified: new Date(),
            },
          });
        }
      },

      bulkDuplicateSteps: (sequenceId: string, stepIds: string[]) => {
        const { library } = get();
        const sequence = library.sequences.find(s => s.id === sequenceId);

        if (!sequence) return;

        const stepsToClone = sequence.steps.filter(step => stepIds.includes(step.id));
        const duplicatedSteps = stepsToClone.map(step => ({
          ...step,
          id: generateId(),
          name: `${step.name} (Copy)`,
        }));

        // Record operation for undo/redo
        const operation: StepEditOperation = {
          id: generateId(),
          type: 'duplicate',
          timestamp: new Date(),
          data: { sequenceId, stepIds, duplicatedSteps },
        };
        StepEditorService.addOperation(operation);

        set(state => ({
          library: {
            ...state.library,
            sequences: state.library.sequences.map(seq =>
              seq.id === sequenceId
                ? {
                    ...seq,
                    steps: [...seq.steps, ...duplicatedSteps],
                    modified: new Date(),
                  }
                : seq
            ),
          },
        }));

        // Update active sequence if it matches
        const { activeSequence } = get();
        if (activeSequence?.id === sequenceId) {
          set({
            activeSequence: {
              ...activeSequence,
              steps: [...activeSequence.steps, ...duplicatedSteps],
              modified: new Date(),
            },
          });
        }
      },

      bulkMoveSteps: (sequenceId: string, stepIds: string[], targetIndex: number) => {
        const { library } = get();
        const sequence = library.sequences.find(s => s.id === sequenceId);

        if (!sequence) return;

        const originalSteps = [...sequence.steps];
        const reorderedSteps = StepEditorService.bulkMoveSteps(sequence.steps, stepIds, targetIndex);

        // Record operation for undo/redo
        const operation: StepEditOperation = {
          id: generateId(),
          type: 'move',
          timestamp: new Date(),
          data: { sequenceId, stepIds, targetIndex },
          previousData: originalSteps,
        };
        StepEditorService.addOperation(operation);

        set(state => ({
          library: {
            ...state.library,
            sequences: state.library.sequences.map(seq =>
              seq.id === sequenceId
                ? {
                    ...seq,
                    steps: reorderedSteps,
                    modified: new Date(),
                  }
                : seq
            ),
          },
        }));

        // Update active sequence if it matches
        const { activeSequence } = get();
        if (activeSequence?.id === sequenceId) {
          set({
            activeSequence: {
              ...activeSequence,
              steps: reorderedSteps,
              modified: new Date(),
            },
          });
        }
      },

      // Clipboard Operations
      copySteps: (stepIds: string[]) => {
        const { activeSequence } = get();
        if (!activeSequence) return;

        const stepsToCopy = activeSequence.steps.filter(step => stepIds.includes(step.id));
        StepEditorService.copySteps(stepsToCopy);
      },

      cutSteps: (sequenceId: string, stepIds: string[]) => {
        get().copySteps(stepIds);
        get().bulkDeleteSteps(sequenceId, stepIds);
      },

      pasteSteps: (sequenceId: string, targetIndex?: number) => {
        const pastedSteps = StepEditorService.pasteSteps();

        if (pastedSteps.length === 0) return;

        const { library } = get();
        const sequence = library.sequences.find(s => s.id === sequenceId);

        if (!sequence) return;

        const insertIndex = targetIndex ?? sequence.steps.length;

        // Record operation for undo/redo
        const operation: StepEditOperation = {
          id: generateId(),
          type: 'create',
          timestamp: new Date(),
          data: { sequenceId, steps: pastedSteps, targetIndex: insertIndex },
        };
        StepEditorService.addOperation(operation);

        set(state => ({
          library: {
            ...state.library,
            sequences: state.library.sequences.map(seq =>
              seq.id === sequenceId
                ? {
                    ...seq,
                    steps: [
                      ...seq.steps.slice(0, insertIndex),
                      ...pastedSteps,
                      ...seq.steps.slice(insertIndex),
                    ],
                    modified: new Date(),
                  }
                : seq
            ),
          },
        }));

        // Update active sequence if it matches
        const { activeSequence } = get();
        if (activeSequence?.id === sequenceId) {
          set({
            activeSequence: {
              ...activeSequence,
              steps: [
                ...activeSequence.steps.slice(0, insertIndex),
                ...pastedSteps,
                ...activeSequence.steps.slice(insertIndex),
              ],
              modified: new Date(),
            },
          });
        }
      },

      hasClipboardData: () => {
        return StepEditorService.hasClipboardData();
      },

      // Undo/Redo Operations
      undo: () => {
        const operation = StepEditorService.getUndoOperation();
        if (!operation) return;

        // Apply reverse operation based on type
        switch (operation.type) {
          case 'create':
            if (operation.data.step) {
              get().deleteStep(operation.data.sequenceId, operation.data.step.id);
            } else if (operation.data.steps) {
              const stepIds = operation.data.steps.map((s: SequenceStep) => s.id);
              get().bulkDeleteSteps(operation.data.sequenceId, stepIds);
            }
            break;
          case 'delete':
            // Restore deleted steps
            operation.previousData?.forEach((step: SequenceStep) => {
              get().addStep(operation.data.sequenceId, step);
            });
            break;
          case 'update':
            if (operation.previousData) {
              get().updateStep(
                operation.data.sequenceId,
                operation.data.stepId,
                operation.previousData
              );
            }
            break;
          case 'move':
            if (operation.previousData) {
              const { library } = get();
              const sequence = library.sequences.find(s => s.id === operation.data.sequenceId);
              if (sequence) {
                set(state => ({
                  library: {
                    ...state.library,
                    sequences: state.library.sequences.map(seq =>
                      seq.id === operation.data.sequenceId
                        ? { ...seq, steps: operation.previousData }
                        : seq
                    ),
                  },
                }));
              }
            }
            break;
        }

        StepEditorService.markUndoExecuted();
      },

      redo: () => {
        const operation = StepEditorService.getRedoOperation();
        if (!operation) return;

        // Reapply operation
        switch (operation.type) {
          case 'create':
            if (operation.data.step) {
              get().addStep(operation.data.sequenceId, operation.data.step);
            } else if (operation.data.steps) {
              operation.data.steps.forEach((step: SequenceStep) => {
                get().addStep(operation.data.sequenceId, step);
              });
            }
            break;
          case 'delete':
            get().bulkDeleteSteps(operation.data.sequenceId, operation.data.stepIds);
            break;
          case 'update':
            get().updateStep(
              operation.data.sequenceId,
              operation.data.stepId,
              operation.data.updates
            );
            break;
          case 'move':
            get().bulkMoveSteps(
              operation.data.sequenceId,
              operation.data.stepIds,
              operation.data.targetIndex
            );
            break;
        }

        StepEditorService.markRedoExecuted();
      },

      canUndo: () => {
        return StepEditorService.canUndo();
      },

      canRedo: () => {
        return StepEditorService.canRedo();
      },

      clearEditHistory: () => {
        StepEditorService.clearHistory();
      },

      // Template Management
      createTemplate: (sequence: Sequence, name: string, description: string) => {
        const template: SequenceTemplate = {
          id: generateId(),
          name,
          description,
          category: sequence.metadata.category || 'Custom',
          steps: sequence.steps.map((stepWithMetadata) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, status, progress, startTime, endTime, ...step } = stepWithMetadata;
            return step;
          }),
          metadata: {
            ...sequence.metadata,
            modified: new Date(),
          },
          isBuiltIn: false,
        };

        set(state => ({
          library: {
            ...state.library,
            templates: [...state.library.templates, template],
          },
        }));

        return template;
      },

      deleteTemplate: (templateId: string) => {
        set(state => ({
          library: {
            ...state.library,
            templates: state.library.templates.filter(t => t.id !== templateId),
          },
        }));
      },

      applyTemplate: (templateId: string, sequenceId: string) => {
        const { library } = get();
        const template = library.templates.find(t => t.id === templateId);
        
        if (!template) return;
        
        const steps: SequenceStep[] = template.steps.map(step => ({
          ...step,
          id: generateId(),
          status: 'pending',
          progress: 0,
          enabled: true,
        }));
        
        get().updateSequence(sequenceId, {
          steps,
          estimatedDuration: steps.reduce((total, step) => total + step.duration, 0),
        });
      },

      // Enhanced Import/Export
      exportSequences: async (sequenceIds: string[], options: SerializationOptions = {}) => {
        const { library } = get();
        const sequences = library.sequences.filter(s => sequenceIds.includes(s.id));

        return SerializationService.serializeSequences(sequences, options);
      },

      importSequences: async (data: string | File) => {
        try {
          let result: DeserializationResult;

          if (data instanceof File) {
            result = await SerializationService.loadFromFile(data);
          } else {
            result = await SerializationService.deserializeSequences(data);
          }

          if (!result.success || !result.data) {
            return result;
          }

          const importData = result.data;
          const sequences: Sequence[] = importData.sequences || [];

          // Generate new IDs to avoid conflicts
          const importedSequences = sequences.map(seq => ({
            ...seq,
            id: generateId(),
            created: new Date(),
            modified: new Date(),
            steps: seq.steps.map(step => ({
              ...step,
              id: generateId(),
            })),
          }));

          set(state => ({
            library: {
              ...state.library,
              sequences: [...state.library.sequences, ...importedSequences],
            },
          }));

          get().updateStatistics();
          return result;
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Import failed',
          };
        }
      },

      exportWorkspace: async (workspaceId: string, options: SerializationOptions = {}) => {
        const { workspaces, library } = get();
        const workspace = workspaces.find(w => w.id === workspaceId);

        if (!workspace) {
          return {
            success: false,
            error: 'Workspace not found',
          };
        }

        return SerializationService.serializeWorkspace(
          workspace,
          library.sequences,
          library.templates,
          options
        );
      },

      importWorkspace: async (data: string | File) => {
        try {
          let result: DeserializationResult;

          if (data instanceof File) {
            result = await SerializationService.loadFromFile(data);
          } else {
            result = await SerializationService.deserialize(data);
          }

          if (!result.success || !result.data) {
            return result;
          }

          const workspaceData = result.data;
          const workspace = workspaceData.workspace;
          const sequences = workspaceData.sequences || [];
          const templates = workspaceData.templates || [];

          // Generate new IDs
          const newWorkspace: Workspace = {
            ...workspace,
            id: generateId(),
            created: new Date(),
            modified: new Date(),
            sequences: [],
            templates: [],
          };

          const importedSequences = sequences.map((seq: Sequence) => ({
            ...seq,
            id: generateId(),
            created: new Date(),
            modified: new Date(),
            steps: seq.steps.map((step: SequenceStep) => ({
              ...step,
              id: generateId(),
            })),
          }));

          const importedTemplates = templates.map((tpl: SequenceTemplate) => ({
            ...tpl,
            id: generateId(),
            isBuiltIn: false,
          }));

          // Update workspace with new IDs
          newWorkspace.sequences = importedSequences.map((s: Sequence) => s.id);
          newWorkspace.templates = importedTemplates.map((t: SequenceTemplate) => t.id);

          set(state => ({
            workspaces: [...state.workspaces, newWorkspace],
            library: {
              ...state.library,
              sequences: [...state.library.sequences, ...importedSequences],
              templates: [...state.library.templates, ...importedTemplates],
            },
          }));

          get().updateStatistics();
          return result;
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Workspace import failed',
          };
        }
      },

      // Workspace Management
      createWorkspace: (name: string, description?: string) => {
        const newWorkspace: Workspace = {
          id: generateId(),
          name,
          description,
          sequences: [],
          templates: [],
          settings: {
            autoSave: true,
            notifications: true,
            theme: 'auto',
            units: 'metric',
          },
          metadata: {
            tags: [],
            isShared: false,
            collaborators: [],
          },
          created: new Date(),
          modified: new Date(),
          version: '1.0.0',
        };

        set(state => ({
          workspaces: [...state.workspaces, newWorkspace],
        }));

        return newWorkspace;
      },

      updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => {
        set(state => ({
          workspaces: state.workspaces.map(workspace =>
            workspace.id === workspaceId
              ? { ...workspace, ...updates, modified: new Date() }
              : workspace
          ),
          activeWorkspace: state.activeWorkspace?.id === workspaceId
            ? { ...state.activeWorkspace, ...updates, modified: new Date() }
            : state.activeWorkspace,
        }));
      },

      deleteWorkspace: (workspaceId: string) => {
        set(state => ({
          workspaces: state.workspaces.filter(w => w.id !== workspaceId),
          activeWorkspace: state.activeWorkspace?.id === workspaceId ? null : state.activeWorkspace,
        }));
      },

      setActiveWorkspace: (workspaceId: string | null) => {
        const { workspaces } = get();
        const workspace = workspaceId
          ? workspaces.find(w => w.id === workspaceId) || null
          : null;

        set({ activeWorkspace: workspace });
      },

      addSequenceToWorkspace: (workspaceId: string, sequenceId: string) => {
        set(state => ({
          workspaces: state.workspaces.map(workspace =>
            workspace.id === workspaceId
              ? {
                  ...workspace,
                  sequences: [...workspace.sequences, sequenceId],
                  modified: new Date(),
                }
              : workspace
          ),
        }));
      },

      removeSequenceFromWorkspace: (workspaceId: string, sequenceId: string) => {
        set(state => ({
          workspaces: state.workspaces.map(workspace =>
            workspace.id === workspaceId
              ? {
                  ...workspace,
                  sequences: workspace.sequences.filter(id => id !== sequenceId),
                  modified: new Date(),
                }
              : workspace
          ),
        }));
      },

      // Target Management
      createTarget: (targetData: Omit<Target, 'id' | 'created' | 'modified'>) => {
        const newTarget: Target = {
          ...targetData,
          id: generateId(),
          created: new Date(),
          modified: new Date(),
        };

        set(state => ({
          targetLibrary: {
            ...state.targetLibrary,
            targets: [...state.targetLibrary.targets, newTarget],
          },
        }));

        return newTarget;
      },

      updateTarget: (targetId: string, updates: Partial<Target>) => {
        set(state => ({
          targetLibrary: {
            ...state.targetLibrary,
            targets: state.targetLibrary.targets.map(target =>
              target.id === targetId
                ? { ...target, ...updates, modified: new Date() }
                : target
            ),
          },
        }));
      },

      deleteTarget: (targetId: string) => {
        set(state => ({
          targetLibrary: {
            ...state.targetLibrary,
            targets: state.targetLibrary.targets.filter(t => t.id !== targetId),
          },
        }));
      },

      importTargets: (targets: Target[]) => {
        const importedTargets = targets.map(target => ({
          ...target,
          id: generateId(),
          created: new Date(),
          modified: new Date(),
        }));

        set(state => ({
          targetLibrary: {
            ...state.targetLibrary,
            targets: [...state.targetLibrary.targets, ...importedTargets],
          },
        }));
      },

      searchTargets: (query: string) => {
        const { targetLibrary } = get();
        const lowercaseQuery = query.toLowerCase();

        return targetLibrary.targets.filter(target =>
          target.name.toLowerCase().includes(lowercaseQuery) ||
          target.metadata.commonNames?.some(name =>
            name.toLowerCase().includes(lowercaseQuery)
          ) ||
          target.metadata.catalogIds?.some(id =>
            id.toLowerCase().includes(lowercaseQuery)
          ) ||
          target.metadata.tags.some(tag =>
            tag.toLowerCase().includes(lowercaseQuery)
          )
        );
      },

      // Logging and Errors
      addError: (error: Omit<SequenceError, 'id' | 'timestamp'>) => {
        const newError: SequenceError = {
          ...error,
          id: generateId(),
          timestamp: new Date(),
        };
        
        set(state => ({
          executionState: {
            ...state.executionState,
            errors: [...state.executionState.errors, newError],
          },
        }));
      },

      addWarning: (warning: Omit<SequenceWarning, 'id' | 'timestamp'>) => {
        const newWarning: SequenceWarning = {
          ...warning,
          id: generateId(),
          timestamp: new Date(),
        };
        
        set(state => ({
          executionState: {
            ...state.executionState,
            warnings: [...state.executionState.warnings, newWarning],
          },
        }));
      },

      addLogEntry: (entry: Omit<SequenceLogEntry, 'id' | 'timestamp'>) => {
        const newEntry: SequenceLogEntry = {
          ...entry,
          id: generateId(),
          timestamp: new Date(),
        };
        
        set(state => ({
          executionState: {
            ...state.executionState,
            logs: [...state.executionState.logs, newEntry],
          },
        }));
      },

      clearErrors: () => {
        set(state => ({
          executionState: {
            ...state.executionState,
            errors: [],
          },
        }));
      },

      clearWarnings: () => {
        set(state => ({
          executionState: {
            ...state.executionState,
            warnings: [],
          },
        }));
      },

      clearLogs: () => {
        set(state => ({
          executionState: {
            ...state.executionState,
            logs: [],
          },
        }));
      },

      // UI State
      setSelectedStep: (stepId: string | null) => {
        set({ selectedStepId: stepId });
      },

      setIsEditing: (editing: boolean) => {
        set({ isEditing: editing });
      },

      setShowAdvanced: (show: boolean) => {
        set({ showAdvanced: show });
      },

      // Statistics
      updateStatistics: () => {
        const { library } = get();
        const sequences = library.sequences;

        const completedSequences = sequences.filter(s => s.status === 'completed');
        const totalRuntime = sequences.reduce((total, seq) => total + (seq.actualDuration || 0), 0);

        // Calculate total exposure time from capture steps
        const totalExposureTime = sequences.reduce((total, seq) => {
          return total + seq.steps.reduce((stepTotal, step) => {
            if (step.type === 'capture' && 'exposure' in step.settings && 'count' in step.settings) {
              const settings = step.settings as { exposure: number; count: number };
              return stepTotal + (settings.exposure * settings.count);
            }
            return stepTotal;
          }, 0);
        }, 0);

        const stepTypeCounts = sequences.reduce((counts, seq) => {
          seq.steps.forEach(step => {
            counts[step.type] = (counts[step.type] || 0) + 1;
          });
          return counts;
        }, {} as Record<string, number>);

        const mostUsedStepTypes = Object.entries(stepTypeCounts)
          .map(([type, count]) => ({ type: type as SequenceStepType, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        const recentActivity = sequences
          .filter(s => s.endTime)
          .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0))
          .slice(0, 10)
          .map(s => ({
            date: s.endTime!,
            sequenceId: s.id,
            status: s.status,
          }));

        const statistics: SequenceStatistics = {
          totalSequences: sequences.length,
          completedSequences: completedSequences.length,
          totalRuntime,
          averageRuntime: sequences.length > 0 ? totalRuntime / sequences.length : 0,
          successRate: sequences.length > 0 ? (completedSequences.length / sequences.length) * 100 : 0,
          totalExposureTime,
          mostUsedStepTypes,
          recentActivity,
        };

        set({ statistics });
      },

      // Internal actions
      updateExecutionState: (updates: Partial<SequenceExecutionState>) => {
        set(state => ({
          executionState: {
            ...state.executionState,
            ...updates,
          },
        }));
      },

      updateStepStatus: (stepId: string, status: StepStatus, progress?: number) => {
        const { executionState, activeSequence } = get();
        
        if (!activeSequence) return;
        
        const updatedSteps = activeSequence.steps.map(step =>
          step.id === stepId
            ? {
                ...step,
                status,
                progress: progress !== undefined ? progress : step.progress,
                startTime: status === 'running' && !step.startTime ? new Date() : step.startTime,
                endTime: (status === 'completed' || status === 'failed' || status === 'skipped') ? new Date() : step.endTime,
              }
            : step
        );
        
        const updatedSequence = {
          ...activeSequence,
          steps: updatedSteps,
        };
        
        set({
          activeSequence: updatedSequence,
          executionState: {
            ...executionState,
            currentStep: updatedSteps.find(s => s.id === stepId) || null,
          },
        });
        
        get().updateSequence(activeSequence.id, updatedSequence);
      },
    }),
    {
      name: 'sequencer-storage',
      partialize: (state) => ({
        library: state.library,
        workspaces: state.workspaces,
        targetLibrary: state.targetLibrary,
        statistics: state.statistics,
        showAdvanced: state.showAdvanced,
      }),
    }
  )
);
