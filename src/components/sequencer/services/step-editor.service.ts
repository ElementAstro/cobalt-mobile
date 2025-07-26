import {
  SequenceStep,
  SequenceStepType,
  StepSettings,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  StepEditOperation,
  BulkEditOptions,
  BulkEditResult,
  ClipboardData,
  UndoRedoState
} from '../types/sequencer.types';
import { generateId, validateStep } from '../utils/sequencer.utils';



export class StepEditorService {
  private static undoRedoState: UndoRedoState = {
    operations: [],
    currentIndex: -1,
    maxOperations: 50,
  };

  private static clipboard: ClipboardData | null = null;

  // Undo/Redo functionality
  static addOperation(operation: StepEditOperation): void {
    const { operations, currentIndex, maxOperations } = this.undoRedoState;
    
    // Remove any operations after current index (when undoing then doing new operation)
    const newOperations = operations.slice(0, currentIndex + 1);
    
    // Add new operation
    newOperations.push(operation);
    
    // Limit operations to maxOperations
    if (newOperations.length > maxOperations) {
      newOperations.shift();
    }
    
    this.undoRedoState = {
      ...this.undoRedoState,
      operations: newOperations,
      currentIndex: newOperations.length - 1,
    };
  }

  static canUndo(): boolean {
    return this.undoRedoState.currentIndex >= 0;
  }

  static canRedo(): boolean {
    return this.undoRedoState.currentIndex < this.undoRedoState.operations.length - 1;
  }

  static getUndoOperation(): StepEditOperation | null {
    if (!this.canUndo()) return null;
    return this.undoRedoState.operations[this.undoRedoState.currentIndex];
  }

  static getRedoOperation(): StepEditOperation | null {
    if (!this.canRedo()) return null;
    return this.undoRedoState.operations[this.undoRedoState.currentIndex + 1];
  }

  static markUndoExecuted(): void {
    if (this.canUndo()) {
      this.undoRedoState.currentIndex--;
    }
  }

  static markRedoExecuted(): void {
    if (this.canRedo()) {
      this.undoRedoState.currentIndex++;
    }
  }

  static clearHistory(): void {
    this.undoRedoState = {
      operations: [],
      currentIndex: -1,
      maxOperations: 50,
    };
  }

  // Clipboard functionality
  static copySteps(steps: SequenceStep[]): void {
    this.clipboard = {
      type: 'steps',
      steps: steps.map(step => ({ ...step })), // Deep copy
      timestamp: new Date(),
      source: 'step-editor',
    };
  }

  static cutSteps(steps: SequenceStep[]): void {
    this.copySteps(steps);
  }

  static getClipboardData(): ClipboardData | null {
    return this.clipboard;
  }

  static hasClipboardData(): boolean {
    return this.clipboard !== null;
  }

  static pasteSteps(): SequenceStep[] {
    if (!this.clipboard) return [];
    
    return this.clipboard.steps.map(step => ({
      ...step,
      id: generateId(),
      name: `${step.name} (Copy)`,
    }));
  }

  static clearClipboard(): void {
    this.clipboard = null;
  }

  // Bulk operations
  static async bulkUpdateSteps(
    steps: SequenceStep[],
    options: BulkEditOptions
  ): Promise<BulkEditResult> {
    const { stepIds, updates, validateEach = true, skipInvalid = true } = options;
    const updatedSteps: string[] = [];
    const failedSteps: { stepId: string; error: string }[] = [];
    const warnings: string[] = [];

    for (const stepId of stepIds) {
      const step = steps.find(s => s.id === stepId);
      if (!step) {
        failedSteps.push({ stepId, error: 'Step not found' });
        continue;
      }

      const updatedStep = { ...step, ...updates };

      if (validateEach) {
        const validation = validateStep(updatedStep);
        if (!validation.isValid) {
          if (skipInvalid) {
            failedSteps.push({ 
              stepId, 
              error: validation.errors.map(e => e.message).join(', ') 
            });
            continue;
          } else {
            return {
              success: false,
              updatedSteps: [],
              failedSteps: [{ 
                stepId, 
                error: validation.errors.map(e => e.message).join(', ') 
              }],
              warnings: [],
            };
          }
        }

        if (validation.warnings.length > 0) {
          warnings.push(
            `Step ${step.name}: ${validation.warnings.map(w => w.message).join(', ')}`
          );
        }
      }

      updatedSteps.push(stepId);
    }

    return {
      success: true,
      updatedSteps,
      failedSteps,
      warnings,
    };
  }

  static bulkDeleteSteps(steps: SequenceStep[], stepIds: string[]): SequenceStep[] {
    return steps.filter(step => !stepIds.includes(step.id));
  }

  static bulkDuplicateSteps(steps: SequenceStep[], stepIds: string[]): SequenceStep[] {
    const stepsToClone = steps.filter(step => stepIds.includes(step.id));
    const duplicatedSteps = stepsToClone.map(step => ({
      ...step,
      id: generateId(),
      name: `${step.name} (Copy)`,
    }));

    return [...steps, ...duplicatedSteps];
  }

  static bulkMoveSteps(
    steps: SequenceStep[], 
    stepIds: string[], 
    targetIndex: number
  ): SequenceStep[] {
    const stepsToMove = steps.filter(step => stepIds.includes(step.id));
    const remainingSteps = steps.filter(step => !stepIds.includes(step.id));

    const result = [...remainingSteps];
    result.splice(targetIndex, 0, ...stepsToMove);

    return result;
  }

  // Advanced validation
  static validateStepSequence(steps: SequenceStep[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for logical sequence issues
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const nextStep = steps[i + 1];

      // Check for redundant filter changes
      if (step.type === 'filter' && nextStep?.type === 'filter') {
        warnings.push({
          field: `steps[${i + 1}]`,
          message: 'Consecutive filter changes detected',
          code: 'REDUNDANT_FILTER_CHANGE',
        });
      }

      // Check for focus after slew
      if (step.type === 'slew' && nextStep && nextStep.type !== 'focus') {
        warnings.push({
          field: `steps[${i + 1}]`,
          message: 'Consider adding focus step after slew',
          code: 'MISSING_FOCUS_AFTER_SLEW',
        });
      }

      // Check for capture without filter setup
      if (step.type === 'capture' && i > 0) {
        const hasRecentFilter = steps.slice(Math.max(0, i - 3), i)
          .some(s => s.type === 'filter');
        if (!hasRecentFilter) {
          warnings.push({
            field: `steps[${i}]`,
            message: 'Capture step without recent filter change',
            code: 'CAPTURE_WITHOUT_FILTER',
          });
        }
      }
    }

    // Check for missing calibration
    const hasCapture = steps.some(s => s.type === 'capture');
    const hasCalibration = steps.some(s => s.type === 'calibration');
    if (hasCapture && !hasCalibration) {
      warnings.push({
        field: 'sequence',
        message: 'Consider adding calibration frames',
        code: 'MISSING_CALIBRATION',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Template and preset management
  static createStepPreset(step: SequenceStep, name: string): any {
    return {
      id: generateId(),
      name,
      type: step.type,
      settings: { ...step.settings },
      duration: step.duration,
      created: new Date(),
    };
  }

  static applyStepPreset(step: SequenceStep, preset: any): SequenceStep {
    return {
      ...step,
      type: preset.type,
      settings: { ...preset.settings },
      duration: preset.duration,
    };
  }

  // Smart suggestions
  static suggestNextSteps(currentSteps: SequenceStep[]): SequenceStepType[] {
    if (currentSteps.length === 0) {
      return ['slew', 'focus'];
    }

    const lastStep = currentSteps[currentSteps.length - 1];
    const suggestions: SequenceStepType[] = [];

    switch (lastStep.type) {
      case 'slew':
        suggestions.push('focus', 'filter');
        break;
      case 'focus':
        suggestions.push('filter', 'capture');
        break;
      case 'filter':
        suggestions.push('capture', 'focus');
        break;
      case 'capture':
        suggestions.push('filter', 'dither', 'wait');
        break;
      case 'wait':
        suggestions.push('capture', 'focus');
        break;
      default:
        suggestions.push('capture', 'wait');
    }

    return suggestions;
  }
}
