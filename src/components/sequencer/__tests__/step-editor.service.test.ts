/**
 * Tests for the enhanced step editor service
 * @jest-environment node
 */

import { StepEditorService } from '../services/step-editor.service';
import { SequenceStep, SequenceStepType } from '../types/sequencer.types';
import { generateId } from '../utils/sequencer.utils';

describe('StepEditorService', () => {
  let testSteps: SequenceStep[];

  beforeEach(() => {
    // Reset service state
    StepEditorService.clearHistory();
    StepEditorService.clearClipboard();

    // Create test steps
    testSteps = [
      {
        id: generateId(),
        name: 'Slew to Target',
        type: 'slew' as SequenceStepType,
        description: 'Slew to target coordinates',
        settings: { ra: '00h 42m 44s', dec: '+41° 16\' 09"', targetName: 'M31' },
        duration: 30,
        status: 'pending',
        progress: 0,
        enabled: true,
        estimatedCompletion: new Date(),
      },
      {
        id: generateId(),
        name: 'Focus',
        type: 'focus' as SequenceStepType,
        description: 'Auto focus',
        settings: { type: 'auto', tolerance: 0.5, maxAttempts: 5 },
        duration: 60,
        status: 'pending',
        progress: 0,
        enabled: true,
        estimatedCompletion: new Date(),
      },
      {
        id: generateId(),
        name: 'Capture',
        type: 'capture' as SequenceStepType,
        description: 'Capture image',
        settings: { exposure: 300, count: 10, binning: '1x1', frameType: 'light' },
        duration: 3000,
        status: 'pending',
        progress: 0,
        enabled: true,
        estimatedCompletion: new Date(),
      },
    ];
  });

  describe('Undo/Redo Functionality', () => {
    test('tracks operations correctly', () => {
      expect(StepEditorService.canUndo()).toBe(false);
      expect(StepEditorService.canRedo()).toBe(false);

      const operation = {
        id: generateId(),
        type: 'create' as const,
        timestamp: new Date(),
        data: { step: testSteps[0] },
      };

      StepEditorService.addOperation(operation);

      expect(StepEditorService.canUndo()).toBe(true);
      expect(StepEditorService.canRedo()).toBe(false);
    });

    test('provides correct undo operation', () => {
      const operation = {
        id: generateId(),
        type: 'create' as const,
        timestamp: new Date(),
        data: { step: testSteps[0] },
      };

      StepEditorService.addOperation(operation);

      const undoOp = StepEditorService.getUndoOperation();
      expect(undoOp).toEqual(operation);
    });

    test('handles undo execution', () => {
      const operation = {
        id: generateId(),
        type: 'create' as const,
        timestamp: new Date(),
        data: { step: testSteps[0] },
      };

      StepEditorService.addOperation(operation);
      expect(StepEditorService.canUndo()).toBe(true);

      StepEditorService.markUndoExecuted();
      expect(StepEditorService.canUndo()).toBe(false);
      expect(StepEditorService.canRedo()).toBe(true);
    });

    test('handles redo execution', () => {
      const operation = {
        id: generateId(),
        type: 'create' as const,
        timestamp: new Date(),
        data: { step: testSteps[0] },
      };

      StepEditorService.addOperation(operation);
      StepEditorService.markUndoExecuted();

      expect(StepEditorService.canRedo()).toBe(true);

      StepEditorService.markRedoExecuted();
      expect(StepEditorService.canRedo()).toBe(false);
      expect(StepEditorService.canUndo()).toBe(true);
    });

    test('limits operation history', () => {
      // Add more than max operations
      for (let i = 0; i < 60; i++) {
        const operation = {
          id: generateId(),
          type: 'create' as const,
          timestamp: new Date(),
          data: { step: testSteps[0] },
        };
        StepEditorService.addOperation(operation);
      }

      // Should still be able to undo (limited to 50)
      expect(StepEditorService.canUndo()).toBe(true);
    });

    test('clears history correctly', () => {
      const operation = {
        id: generateId(),
        type: 'create' as const,
        timestamp: new Date(),
        data: { step: testSteps[0] },
      };

      StepEditorService.addOperation(operation);
      expect(StepEditorService.canUndo()).toBe(true);

      StepEditorService.clearHistory();
      expect(StepEditorService.canUndo()).toBe(false);
      expect(StepEditorService.canRedo()).toBe(false);
    });
  });

  describe('Clipboard Operations', () => {
    test('copies steps to clipboard', () => {
      expect(StepEditorService.hasClipboardData()).toBe(false);

      StepEditorService.copySteps([testSteps[0], testSteps[1]]);

      expect(StepEditorService.hasClipboardData()).toBe(true);

      const clipboardData = StepEditorService.getClipboardData();
      expect(clipboardData).toBeDefined();
      expect(clipboardData?.steps).toHaveLength(2);
      expect(clipboardData?.type).toBe('steps');
    });

    test('pastes steps with new IDs', () => {
      StepEditorService.copySteps([testSteps[0]]);

      const pastedSteps = StepEditorService.pasteSteps();

      expect(pastedSteps).toHaveLength(1);
      expect(pastedSteps[0].id).not.toBe(testSteps[0].id);
      expect(pastedSteps[0].name).toBe(`${testSteps[0].name} (Copy)`);
      expect(pastedSteps[0].type).toBe(testSteps[0].type);
    });

    test('returns empty array when no clipboard data', () => {
      const pastedSteps = StepEditorService.pasteSteps();
      expect(pastedSteps).toHaveLength(0);
    });

    test('clears clipboard correctly', () => {
      StepEditorService.copySteps([testSteps[0]]);
      expect(StepEditorService.hasClipboardData()).toBe(true);

      StepEditorService.clearClipboard();
      expect(StepEditorService.hasClipboardData()).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    test('bulk updates steps successfully', async () => {
      const stepIds = [testSteps[0].id, testSteps[1].id];
      const updates = { duration: 120 };

      const result = await StepEditorService.bulkUpdateSteps(testSteps, {
        stepIds,
        updates,
        validateEach: false,
      });

      expect(result.success).toBe(true);
      expect(result.updatedSteps).toEqual(stepIds);
      expect(result.failedSteps).toHaveLength(0);
    });

    test('handles validation during bulk update', async () => {
      const stepIds = [testSteps[0].id];
      const invalidUpdates = { duration: -100 }; // Invalid duration

      const result = await StepEditorService.bulkUpdateSteps(testSteps, {
        stepIds,
        updates: invalidUpdates,
        validateEach: true,
        skipInvalid: true,
      });

      expect(result.success).toBe(true);
      expect(result.updatedSteps).toHaveLength(0);
      expect(result.failedSteps).toHaveLength(1);
    });

    test('fails fast when skipInvalid is false', async () => {
      const stepIds = [testSteps[0].id];
      const invalidUpdates = { duration: -100 };

      const result = await StepEditorService.bulkUpdateSteps(testSteps, {
        stepIds,
        updates: invalidUpdates,
        validateEach: true,
        skipInvalid: false,
      });

      expect(result.success).toBe(false);
      expect(result.failedSteps).toHaveLength(1);
    });

    test('bulk deletes steps', () => {
      const stepIds = [testSteps[0].id, testSteps[2].id];
      const remainingSteps = StepEditorService.bulkDeleteSteps(testSteps, stepIds);

      expect(remainingSteps).toHaveLength(1);
      expect(remainingSteps[0].id).toBe(testSteps[1].id);
    });

    test('bulk duplicates steps', () => {
      const stepIds = [testSteps[0].id];
      const duplicatedSteps = StepEditorService.bulkDuplicateSteps(testSteps, stepIds);

      expect(duplicatedSteps).toHaveLength(4); // 3 original + 1 duplicate
      expect(duplicatedSteps[3].name).toBe(`${testSteps[0].name} (Copy)`);
      expect(duplicatedSteps[3].id).not.toBe(testSteps[0].id);
    });

    test('bulk moves steps to new position', () => {
      const stepIds = [testSteps[2].id]; // Move last step to beginning
      const reorderedSteps = StepEditorService.bulkMoveSteps(testSteps, stepIds, 0);

      expect(reorderedSteps).toHaveLength(3);
      expect(reorderedSteps[0].id).toBe(testSteps[2].id);
      expect(reorderedSteps[1].id).toBe(testSteps[0].id);
      expect(reorderedSteps[2].id).toBe(testSteps[1].id);
    });
  });

  describe('Validation', () => {
    test('validates step sequence for logical issues', () => {
      const sequenceWithIssues: SequenceStep[] = [
        {
          ...testSteps[0],
          type: 'filter' as SequenceStepType,
          name: 'Set Filter 1',
        },
        {
          ...testSteps[1],
          type: 'filter' as SequenceStepType,
          name: 'Set Filter 2',
        },
        {
          ...testSteps[2],
          type: 'capture' as SequenceStepType,
          name: 'Capture',
        },
      ];

      const result = StepEditorService.validateStepSequence(sequenceWithIssues);

      expect(result.isValid).toBe(true); // No errors, just warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === 'REDUNDANT_FILTER_CHANGE')).toBe(true);
    });

    test('warns about missing focus after slew', () => {
      const sequenceWithoutFocus: SequenceStep[] = [
        {
          ...testSteps[0],
          type: 'slew' as SequenceStepType,
          name: 'Slew to Target',
        },
        {
          ...testSteps[1],
          type: 'capture' as SequenceStepType,
          name: 'Capture',
        },
      ];

      const result = StepEditorService.validateStepSequence(sequenceWithoutFocus);

      expect(result.warnings.some(w => w.code === 'MISSING_FOCUS_AFTER_SLEW')).toBe(true);
    });

    test('warns about capture without filter', () => {
      const sequenceWithoutFilter: SequenceStep[] = [
        {
          ...testSteps[0],
          type: 'slew' as SequenceStepType,
          name: 'Slew to Target',
        },
        {
          ...testSteps[1],
          type: 'focus' as SequenceStepType,
          name: 'Focus',
        },
        {
          ...testSteps[2],
          type: 'capture' as SequenceStepType,
          name: 'Capture',
        },
      ];

      const result = StepEditorService.validateStepSequence(sequenceWithoutFilter);

      expect(result.warnings.some(w => w.code === 'CAPTURE_WITHOUT_FILTER')).toBe(true);
    });

    test('warns about missing calibration', () => {
      const sequenceWithoutCalibration: SequenceStep[] = [
        {
          ...testSteps[0],
          type: 'capture' as SequenceStepType,
          name: 'Capture',
        },
      ];

      const result = StepEditorService.validateStepSequence(sequenceWithoutCalibration);

      expect(result.warnings.some(w => w.code === 'MISSING_CALIBRATION')).toBe(true);
    });
  });

  describe('Step Presets', () => {
    test('creates step preset from existing step', () => {
      const preset = StepEditorService.createStepPreset(testSteps[0], 'My Slew Preset');

      expect(preset.name).toBe('My Slew Preset');
      expect(preset.type).toBe(testSteps[0].type);
      expect(preset.settings).toEqual(testSteps[0].settings);
      expect(preset.duration).toBe(testSteps[0].duration);
      expect(preset.id).toBeDefined();
      expect(preset.created).toBeInstanceOf(Date);
    });

    test('applies preset to step', () => {
      const preset = {
        id: generateId(),
        name: 'Test Preset',
        type: 'focus' as SequenceStepType,
        settings: { samples: 10 },
        duration: 90,
        created: new Date(),
      };

      const updatedStep = StepEditorService.applyStepPreset(testSteps[0], preset);

      expect(updatedStep.type).toBe(preset.type);
      expect(updatedStep.settings).toEqual(preset.settings);
      expect(updatedStep.duration).toBe(preset.duration);
      expect(updatedStep.id).toBe(testSteps[0].id); // ID should remain the same
    });
  });

  describe('Smart Suggestions', () => {
    test('suggests initial steps for empty sequence', () => {
      const suggestions = StepEditorService.suggestNextSteps([]);

      expect(suggestions).toContain('slew');
      expect(suggestions).toContain('focus');
    });

    test('suggests appropriate steps after slew', () => {
      const slewStep: SequenceStep = {
        ...testSteps[0],
        type: 'slew' as SequenceStepType,
      };

      const suggestions = StepEditorService.suggestNextSteps([slewStep]);

      expect(suggestions).toContain('focus');
      expect(suggestions).toContain('filter');
    });

    test('suggests appropriate steps after focus', () => {
      const focusStep: SequenceStep = {
        ...testSteps[0],
        type: 'focus' as SequenceStepType,
      };

      const suggestions = StepEditorService.suggestNextSteps([focusStep]);

      expect(suggestions).toContain('filter');
      expect(suggestions).toContain('capture');
    });

    test('suggests appropriate steps after capture', () => {
      const captureStep: SequenceStep = {
        ...testSteps[0],
        type: 'capture' as SequenceStepType,
      };

      const suggestions = StepEditorService.suggestNextSteps([captureStep]);

      expect(suggestions).toContain('filter');
      expect(suggestions).toContain('dither');
      expect(suggestions).toContain('wait');
    });
  });
});
