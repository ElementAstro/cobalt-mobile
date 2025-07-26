/**
 * Basic functionality tests to verify all imports and core features work
 * @jest-environment node
 */

// Mock globals for Node.js environment
beforeAll(() => {
  global.crypto = {
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  } as any;

  global.performance = {
    now: jest.fn(() => Date.now()),
  } as any;

  global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));
  global.atob = jest.fn((str) => Buffer.from(str, 'base64').toString());
});

describe('Basic Functionality Tests', () => {
  test('all services can be imported without errors', () => {
    expect(() => {
      require('../services/target.service');
      require('../services/serialization.service');
      require('../services/step-editor.service');
      require('../services/workspace.service');
      require('../services/equipment-profile.service');
      require('../services/scheduler.service');
    }).not.toThrow();
  });

  test('target service basic functionality', () => {
    const { TargetService } = require('../services/target.service');
    
    const target = TargetService.createTarget({
      name: 'Test Target',
      ra: 12.0,
      dec: 45.0,
      type: 'star',
    });

    expect(target.name).toBe('Test Target');
    expect(target.coordinates.ra).toBe(12.0);
    expect(target.coordinates.dec).toBe(45.0);
    expect(target.type).toBe('star');
    expect(target.id).toBeDefined();
  });

  test('serialization service basic functionality', async () => {
    const { SerializationService } = require('../services/serialization.service');
    
    const testData = { test: 'data', number: 42 };
    const result = await SerializationService.serialize(testData);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.version).toBe('1.2.0');
  });

  test('step editor service basic functionality', () => {
    const { StepEditorService } = require('../services/step-editor.service');
    
    const testStep = {
      id: 'test-1',
      name: 'Test Step',
      type: 'capture',
      description: 'Test',
      settings: {},
      duration: 300,
      status: 'pending',
      progress: 0,
      estimatedCompletion: new Date(),
      logs: [],
      errors: [],
      warnings: [],
    };

    StepEditorService.copySteps([testStep]);
    expect(StepEditorService.hasClipboardData()).toBe(true);

    const pastedSteps = StepEditorService.pasteSteps();
    expect(pastedSteps).toHaveLength(1);
    expect(pastedSteps[0].name).toBe('Test Step (Copy)');
  });

  test('workspace service basic functionality', () => {
    const { WorkspaceService } = require('../services/workspace.service');
    
    const workspace = WorkspaceService.createWorkspace(
      'Test Workspace',
      'A test workspace'
    );

    expect(workspace.name).toBe('Test Workspace');
    expect(workspace.description).toBe('A test workspace');
    expect(workspace.id).toBeDefined();
    expect(workspace.sequences).toEqual([]);
    expect(workspace.templates).toEqual([]);
  });

  test('equipment profile service basic functionality', () => {
    const { EquipmentProfileService } = require('../services/equipment-profile.service');
    
    const profiles = EquipmentProfileService.getBuiltInProfiles();
    expect(profiles.length).toBeGreaterThan(0);
    
    const profile = profiles[0];
    expect(profile.name).toBeDefined();
    expect(profile.equipment).toBeDefined();
    expect(profile.settings).toBeDefined();
  });

  test('scheduler service basic functionality', () => {
    const { SchedulerService } = require('../services/scheduler.service');
    
    const rule = SchedulerService.addRule({
      name: 'Test Rule',
      type: 'time',
      enabled: true,
      priority: 1,
      conditions: [],
      actions: [],
    });

    expect(rule.name).toBe('Test Rule');
    expect(rule.id).toBeDefined();
    expect(rule.created).toBeInstanceOf(Date);
  });

  test('all types are properly exported', () => {
    const types = require('../types/sequencer.types');
    
    // Check that the module exports exist (they should be undefined since they're types)
    // But the import should not throw an error
    expect(typeof types).toBe('object');
  });

  test('store can be imported and initialized', () => {
    expect(() => {
      require('../store/sequencer.store');
    }).not.toThrow();
  });

  test('utils can be imported and used', () => {
    const { generateId, validateStep } = require('../utils/sequencer.utils');
    
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);

    const testStep = {
      id: 'test-1',
      name: 'Test Step',
      type: 'capture',
      description: 'Test',
      settings: { exposure: 300 },
      duration: 300,
      status: 'pending',
      progress: 0,
      estimatedCompletion: new Date(),
      logs: [],
      errors: [],
      warnings: [],
    };

    const validation = validateStep(testStep);
    expect(validation.isValid).toBe(true);
  });

  test('coordinate parsing works correctly', () => {
    const { parseRA, parseDec, formatRA, formatDec } = require('../utils/sequencer.utils');
    
    // Test RA parsing
    const ra = parseRA('12h 30m 45s');
    expect(ra).toBeCloseTo(12.5125, 3);
    
    // Test Dec parsing
    const dec = parseDec('+45° 30\' 15"');
    expect(dec).toBeCloseTo(45.5042, 3);
    
    // Test formatting
    const formattedRA = formatRA(12.5);
    expect(formattedRA).toBe('12h 30m 00.0s');

    const formattedDec = formatDec(45.5);
    expect(formattedDec).toBe('+45° 30\' 00.0"');
  });

  test('observability calculations work', () => {
    const { TargetService } = require('../services/target.service');
    
    const target = TargetService.createTarget({
      name: 'Test Target',
      ra: 12.0,
      dec: 45.0,
      type: 'star',
    });

    const observability = TargetService.calculateObservability(target, {
      latitude: 40.0,
      longitude: -74.0,
      date: new Date('2024-06-21T12:00:00Z'),
    });

    expect(observability.altitude).toBeDefined();
    expect(observability.azimuth).toBeDefined();
    expect(observability.airmass).toBeDefined();
    expect(observability.visibility).toBeDefined();
  });

  test('end-to-end workflow integration', async () => {
    const { TargetService } = require('../services/target.service');
    const { WorkspaceService } = require('../services/workspace.service');
    const { SerializationService } = require('../services/serialization.service');
    
    // Create a target
    const target = TargetService.createTarget({
      name: 'M31',
      ra: '00h 42m 44s',
      dec: '+41° 16\' 09"',
      type: 'dso',
    });

    // Create a workspace
    const workspace = WorkspaceService.createWorkspace('M31 Project');

    // Create project data
    const projectData = {
      workspace,
      targets: [target],
      created: new Date(),
    };

    // Serialize the project
    const serializeResult = await SerializationService.serialize(projectData);
    expect(serializeResult.success).toBe(true);

    // Deserialize the project
    const deserializeResult = await SerializationService.deserialize(serializeResult.data!);
    expect(deserializeResult.success).toBe(true);
    // Check structure without exact date matching (dates become strings after serialization)
    expect(deserializeResult.data).toMatchObject({
      workspace: {
        name: projectData.workspace.name,
        sequences: projectData.workspace.sequences,
      },
      targets: [{
        name: projectData.targets[0].name,
        type: projectData.targets[0].type,
        coordinates: projectData.targets[0].coordinates,
      }],
    });
  });
});
