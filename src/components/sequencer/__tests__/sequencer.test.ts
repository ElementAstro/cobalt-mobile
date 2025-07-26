/**
 * Basic tests for the sequencer functionality
 * These tests verify the core functionality without requiring a full React environment
 */

import { generateId, formatDuration, validateSequence, createStepTemplate } from '../utils/sequencer.utils';
import { TemplateService } from '../services/template.service';
import { notificationService, SequenceNotification } from '../services/notification.service';
import { Sequence, SequenceStep } from '../types/sequencer.types';

describe('Sequencer Utils', () => {
  test('generateId creates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(10);
  });

  test('formatDuration formats time correctly', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(60)).toBe('01:00');
    expect(formatDuration(3661)).toBe('01:01:01');
    expect(formatDuration(7200)).toBe('02:00:00');
  });

  test('createStepTemplate creates valid step templates', () => {
    const captureStep = createStepTemplate('capture');
    expect(captureStep.type).toBe('capture');
    expect(captureStep.name).toBe('Capture Frames');
    expect(captureStep.duration).toBeGreaterThan(0);
    expect(captureStep.enabled).toBe(true);

    const slewStep = createStepTemplate('slew');
    expect(slewStep.type).toBe('slew');
    expect(slewStep.name).toBe('Slew to Target');
    expect(slewStep.settings).toHaveProperty('ra');
    expect(slewStep.settings).toHaveProperty('dec');
  });
});

describe('Sequence Validation', () => {
  test('validates empty sequence', () => {
    const emptySequence: Sequence = {
      id: 'test-1',
      name: '',
      steps: [],
      status: 'idle',
      progress: 0,
      currentStepIndex: -1,
      estimatedDuration: 0,
      conditions: [],
      metadata: {
        tags: [],
      },
      created: new Date(),
      modified: new Date(),
      version: '1.0.0',
    };

    const result = validateSequence(emptySequence);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2); // name and steps
    expect(result.errors[0].field).toBe('name');
    expect(result.errors[1].field).toBe('steps');
  });

  test('validates valid sequence', () => {
    const validSequence: Sequence = {
      id: 'test-2',
      name: 'Test Sequence',
      steps: [
        {
          id: 'step-1',
          type: 'capture',
          name: 'Test Capture',
          duration: 300,
          status: 'pending',
          progress: 0,
          enabled: true,
          retryCount: 0,
          maxRetries: 3,
          settings: {
            exposure: 300,
            count: 1,
            binning: '1x1',
            frameType: 'light',
          },
        },
      ],
      status: 'idle',
      progress: 0,
      currentStepIndex: -1,
      estimatedDuration: 300,
      conditions: [],
      metadata: {
        tags: ['test'],
      },
      created: new Date(),
      modified: new Date(),
      version: '1.0.0',
    };

    const result = validateSequence(validSequence);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Template Service', () => {
  test('provides built-in templates', () => {
    const templates = TemplateService.getBuiltInTemplates();
    
    expect(templates).toBeDefined();
    expect(templates.length).toBeGreaterThan(0);
    
    const lrgbTemplate = templates.find(t => t.id === 'template-dso-lrgb');
    expect(lrgbTemplate).toBeDefined();
    expect(lrgbTemplate?.name).toBe('Deep Sky LRGB');
    expect(lrgbTemplate?.isBuiltIn).toBe(true);
    expect(lrgbTemplate?.steps.length).toBeGreaterThan(0);
  });

  test('creates sample sequence', () => {
    const sample = TemplateService.createSampleSequence();
    
    expect(sample).toBeDefined();
    expect(sample.name).toBe('M31 Deep Sky Sample');
    expect(sample.steps.length).toBeGreaterThan(0);
    expect(sample.status).toBe('idle');
    
    // Verify all steps have required properties
    sample.steps.forEach((step: SequenceStep) => {
      expect(step.id).toBeDefined();
      expect(step.type).toBeDefined();
      expect(step.name).toBeDefined();
      expect(step.duration).toBeGreaterThan(0);
      expect(step.settings).toBeDefined();
    });
  });
});

describe('Notification Service', () => {
  beforeEach(() => {
    notificationService.clear();
  });

  test('adds and removes notifications', () => {
    let notifications: SequenceNotification[] = [];
    const unsubscribe = notificationService.subscribe((notifs) => {
      notifications = notifs;
    });

    // Initially empty
    expect(notifications).toHaveLength(0);

    // Add notification
    const id = notificationService.info('Test', 'Test message');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe('Test');
    expect(notifications[0].message).toBe('Test message');
    expect(notifications[0].type).toBe('info');

    // Remove notification
    notificationService.remove(id);
    expect(notifications).toHaveLength(0);

    unsubscribe();
  });

  test('creates sequence-specific notifications', () => {
    let notifications: SequenceNotification[] = [];
    const unsubscribe = notificationService.subscribe((notifs) => {
      notifications = notifs;
    });

    notificationService.sequenceStarted('Test Sequence', 'seq-1');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe('Sequence Started');
    expect(notifications[0].sequenceId).toBe('seq-1');

    notificationService.sequenceCompleted('Test Sequence', 'seq-1', 3600);
    expect(notifications).toHaveLength(2);
    expect(notifications[0].title).toBe('Sequence Completed');

    unsubscribe();
  });

  test('handles error notifications with actions', () => {
    let notifications: SequenceNotification[] = [];
    const unsubscribe = notificationService.subscribe((notifs) => {
      notifications = notifs;
    });

    let retryClicked = false;
    const retryAction = () => { retryClicked = true; };

    notificationService.stepFailed('Test Step', 'Test error', 'seq-1', 'step-1', retryAction);
    
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('error');
    expect(notifications[0].actions).toHaveLength(1);
    expect(notifications[0].actions?.[0]?.label).toBe('Retry');

    // Simulate clicking the retry action
    notifications[0].actions?.[0]?.action();
    expect(retryClicked).toBe(true);

    unsubscribe();
  });
});

describe('Integration Tests', () => {
  test('complete workflow simulation', () => {
    // Clear notifications before starting the test
    notificationService.clear();

    // Create a sample sequence
    const sequence = TemplateService.createSampleSequence();
    expect(sequence).toBeDefined();

    // Validate the sequence
    const validation = validateSequence(sequence);
    expect(validation.isValid).toBe(true);

    // Test notification for sequence start
    let notifications: SequenceNotification[] = [];
    const unsubscribe = notificationService.subscribe((notifs) => {
      notifications = notifs;
    });

    notificationService.sequenceStarted(sequence.name, sequence.id);
    expect(notifications).toHaveLength(1);

    // Simulate step completion
    sequence.steps.forEach((step) => {
      notificationService.stepCompleted(step.name, sequence.id, step.id);
    });

    expect(notifications.length).toBeGreaterThan(sequence.steps.length);

    // Complete sequence
    notificationService.sequenceCompleted(sequence.name, sequence.id, 3600);
    
    const completionNotification = notifications.find(n => n.title === 'Sequence Completed');
    expect(completionNotification).toBeDefined();
    expect(completionNotification?.type).toBe('success');

    unsubscribe();
  });
});

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
