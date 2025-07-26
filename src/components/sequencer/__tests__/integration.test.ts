/**
 * Integration tests for the enhanced sequencer functionality
 * @jest-environment node
 */

import { TargetService } from '../services/target.service';
import { SerializationService } from '../services/serialization.service';
import { StepEditorService } from '../services/step-editor.service';
import { WorkspaceService } from '../services/workspace.service';
import { EquipmentProfileService } from '../services/equipment-profile.service';

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

describe('Sequencer Integration Tests', () => {
  describe('Target Management Integration', () => {
    test('creates, validates, and searches targets', () => {
      // Create a target
      const target = TargetService.createTarget({
        name: 'M31 - Andromeda Galaxy',
        ra: '00h 42m 44s',
        dec: '+41° 16\' 09"',
        type: 'dso',
        magnitude: 3.4,
        commonNames: ['Andromeda Galaxy'],
        catalogIds: ['M31', 'NGC 224'],
        constellation: 'Andromeda',
      });

      // Validate the target
      const validation = TargetService.validateTarget(target);
      expect(validation.isValid).toBe(true);

      // Search for the target
      const searchResults = TargetService.searchTargets([target], {
        query: 'andromeda',
      });
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].id).toBe(target.id);
    });

    test('calculates observability correctly', () => {
      const target = TargetService.createTarget({
        name: 'Test Target',
        ra: 12.0, // 12 hours
        dec: 45.0, // 45 degrees
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

    test('imports and exports targets via CSV', () => {
      const target = TargetService.createTarget({
        name: 'Test Target',
        ra: 12.0,
        dec: 45.0,
        type: 'dso',
        magnitude: 8.5,
        constellation: 'Test',
      });

      // Export to CSV
      const csv = TargetService.exportTargetsToCSV([target]);
      expect(csv).toContain('Test Target');
      expect(csv).toContain('dso');
      expect(csv).toContain('8.5');

      // Import from CSV
      const csvData = `Name,RA,Dec,Type,Magnitude,Constellation
Import Test,06h 15m 30s,-20° 30' 15",star,6.2,Orion`;

      const imported = TargetService.importTargetsFromCSV(csvData);
      expect(imported).toHaveLength(1);
      expect(imported[0].name).toBe('Import Test');
      expect(imported[0].type).toBe('star');
    });
  });

  describe('Serialization Integration', () => {
    test('serializes and deserializes complex data', async () => {
      const complexData = {
        sequences: [
          {
            id: 'seq-1',
            name: 'Test Sequence',
            steps: [
              { id: 'step-1', name: 'Slew', type: 'slew', duration: 30 },
              { id: 'step-2', name: 'Focus', type: 'focus', duration: 60 },
            ],
          },
        ],
        targets: [
          {
            id: 'target-1',
            name: 'M31',
            coordinates: { ra: 0.71, dec: 41.27 },
          },
        ],
        metadata: {
          version: '1.0.0',
          created: new Date(),
        },
      };

      // Serialize with compression
      const serializeResult = await SerializationService.serialize(complexData, {
        compress: true,
        includeMetadata: true,
      });

      expect(serializeResult.success).toBe(true);
      expect(serializeResult.data).toBeDefined();
      expect(serializeResult.performance).toBeDefined();

      // Deserialize
      const deserializeResult = await SerializationService.deserialize(serializeResult.data!);

      expect(deserializeResult.success).toBe(true);
      // Note: Dates are serialized as strings, so we need to check the structure without exact date matching
      expect(deserializeResult.data).toMatchObject({
        sequences: complexData.sequences,
        targets: complexData.targets,
        metadata: {
          version: complexData.metadata.version,
          // created will be a string after serialization
        },
      });
    });

    test('handles version migration', async () => {
      const legacyData = {
        version: '1.0.0',
        format: 'json' as const,
        compressed: false,
        timestamp: new Date(),
        size: 100,
        data: JSON.stringify({ sequences: [], version: '1.0.0' }),
      };

      const result = await SerializationService.deserialize(legacyData);

      expect(result.success).toBe(true);
      expect(result.migration).toBeDefined();
      expect(result.migration?.fromVersion).toBe('1.0.0');
      expect(result.migration?.toVersion).toBe('1.2.0');
    });
  });

  describe('Step Editor Integration', () => {
    test('performs bulk operations with undo/redo', () => {
      const steps = [
        {
          id: 'step-1',
          name: 'Step 1',
          type: 'slew' as const,
          description: 'Test step',
          settings: { ra: '00h 00m 00s', dec: '+00° 00\' 00"', targetName: 'Test' },
          duration: 30,
          status: 'pending' as const,
          progress: 0,
          enabled: true,
          estimatedCompletion: new Date(),
        },
        {
          id: 'step-2',
          name: 'Step 2',
          type: 'focus' as const,
          description: 'Test step',
          settings: { type: 'auto' as const, tolerance: 0.5, maxAttempts: 5 },
          duration: 60,
          status: 'pending' as const,
          progress: 0,
          enabled: true,
          estimatedCompletion: new Date(),
        },
      ];

      // Clear any existing history
      StepEditorService.clearHistory();

      // Test clipboard operations
      StepEditorService.copySteps([steps[0]]);
      expect(StepEditorService.hasClipboardData()).toBe(true);

      const pastedSteps = StepEditorService.pasteSteps();
      expect(pastedSteps).toHaveLength(1);
      expect(pastedSteps[0].name).toBe('Step 1 (Copy)');

      // Test undo/redo
      expect(StepEditorService.canUndo()).toBe(false);

      const operation = {
        id: 'op-1',
        type: 'create' as const,
        timestamp: new Date(),
        data: { step: steps[0] },
      };

      StepEditorService.addOperation(operation);
      expect(StepEditorService.canUndo()).toBe(true);
      expect(StepEditorService.canRedo()).toBe(false);

      StepEditorService.markUndoExecuted();
      expect(StepEditorService.canUndo()).toBe(false);
      expect(StepEditorService.canRedo()).toBe(true);
    });

    test('validates step sequences', () => {
      const problematicSequence = [
        {
          id: 'step-1',
          name: 'Filter 1',
          type: 'filter' as const,
          description: 'Set filter',
          settings: { position: 1, name: 'L', waitTime: 5 },
          duration: 5,
          status: 'pending' as const,
          progress: 0,
          enabled: true,
          estimatedCompletion: new Date(),
        },
        {
          id: 'step-2',
          name: 'Filter 2',
          type: 'filter' as const,
          description: 'Set another filter',
          settings: { position: 2, name: 'R', waitTime: 5 },
          duration: 5,
          status: 'pending' as const,
          progress: 0,
          enabled: true,
          estimatedCompletion: new Date(),
        },
      ];

      const validation = StepEditorService.validateStepSequence(problematicSequence);
      expect(validation.isValid).toBe(true); // No errors, just warnings
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings.some(w => w.code === 'REDUNDANT_FILTER_CHANGE')).toBe(true);
    });
  });

  describe('Workspace Integration', () => {
    test('creates and manages workspaces', () => {
      const workspace = WorkspaceService.createWorkspace(
        'Test Workspace',
        'A test workspace for integration testing'
      );

      expect(workspace.id).toBeDefined();
      expect(workspace.name).toBe('Test Workspace');
      expect(workspace.description).toBe('A test workspace for integration testing');
      expect(workspace.sequences).toEqual([]);
      expect(workspace.templates).toEqual([]);

      // Test workspace validation
      const validation = WorkspaceService.validateWorkspace(workspace);
      expect(validation.isValid).toBe(true);

      // Test workspace cloning
      const cloned = WorkspaceService.cloneWorkspace(workspace, 'Cloned Workspace');
      expect(cloned).toBeDefined();
      expect(cloned!.name).toBe('Cloned Workspace');
      expect(cloned!.id).not.toBe(workspace.id);
    });

    test('filters and searches workspaces', () => {
      const workspaces = [
        WorkspaceService.createWorkspace('DSO Workspace', 'Deep sky objects', {}, { category: 'Deep Sky', tags: ['DSO', 'Imaging'] }),
        WorkspaceService.createWorkspace('Planetary Workspace', 'Planetary imaging', {}, { category: 'Planetary', tags: ['Planetary', 'High-res'] }),
        WorkspaceService.createWorkspace('Solar Workspace', 'Solar observation', {}, { category: 'Solar', tags: ['Solar', 'Safety'] }),
      ];

      // Filter by category
      const dsoWorkspaces = WorkspaceService.filterWorkspaces(workspaces, {
        category: 'Deep Sky',
      });
      expect(dsoWorkspaces).toHaveLength(1);
      expect(dsoWorkspaces[0].name).toBe('DSO Workspace');

      // Search by name
      const searchResult = WorkspaceService.searchWorkspaces(workspaces, 'planetary');
      expect(searchResult.workspaces).toHaveLength(1);
      expect(searchResult.workspaces[0].name).toBe('Planetary Workspace');
    });
  });

  describe('Equipment Profile Integration', () => {
    test('creates and validates equipment profiles', () => {
      const profile = EquipmentProfileService.createProfile(
        'Test Profile',
        'A test equipment profile',
        {
          camera: {
            name: 'Test Camera',
            model: 'TC-1000',
            pixelSize: 5.4,
            resolution: { width: 1920, height: 1080 },
            cooled: true,
            binningModes: ['1x1', '2x2'],
            frameTypes: ['light', 'dark', 'flat'],
          },
          mount: {
            name: 'Test Mount',
            model: 'TM-2000',
            type: 'equatorial',
            maxSlewRate: 5.0,
            trackingAccuracy: 1.0,
            payloadCapacity: 20,
            hasGPS: true,
            hasPEC: true,
          },
        },
        {
          camera: {
            defaultGain: 100,
            defaultOffset: 10,
            defaultBinning: '1x1',
            coolingTarget: -20,
            downloadTimeout: 30,
            imageFormat: 'FITS',
          },
          mount: {
            slewRate: 4.0,
            trackingRate: 1.0,
            guidingRate: 0.5,
            flipHourAngle: 6,
            parkPosition: { ra: 0, dec: 90 },
            limits: {
              eastLimit: 90,
              westLimit: -90,
              horizonLimit: 20,
            },
          },
          safety: {
            enableWeatherMonitoring: true,
            enableEquipmentMonitoring: true,
            autoAbortOnError: true,
            maxConsecutiveErrors: 3,
            emergencyStopConditions: ['high_wind', 'rain'],
          },
        }
      );

      expect(profile.id).toBeDefined();
      expect(profile.name).toBe('Test Profile');

      // Validate the profile
      const validation = EquipmentProfileService.validateProfile(profile);
      expect(validation.isValid).toBe(true);
      expect(validation.compatibility.overall).toBe(true);
    });

    test('compares equipment profiles', () => {
      const profiles = EquipmentProfileService.getBuiltInProfiles();
      expect(profiles.length).toBeGreaterThan(0);

      if (profiles.length >= 2) {
        const comparison = EquipmentProfileService.compareProfiles(profiles[0], profiles[1]);
        expect(comparison.profile1).toBe(profiles[0]);
        expect(comparison.profile2).toBe(profiles[1]);
        expect(comparison.compatibility).toBeGreaterThanOrEqual(0);
        expect(comparison.compatibility).toBeLessThanOrEqual(100);
        expect(Array.isArray(comparison.differences)).toBe(true);
        expect(Array.isArray(comparison.recommendations)).toBe(true);
      }
    });
  });

  describe('End-to-End Workflow', () => {
    test('complete astrophotography workflow', async () => {
      // 1. Create a workspace
      const workspace = WorkspaceService.createWorkspace(
        'M31 Project',
        'Andromeda Galaxy imaging project'
      );

      // 2. Create targets
      const target = TargetService.createTarget({
        name: 'M31 - Andromeda Galaxy',
        ra: '00h 42m 44s',
        dec: '+41° 16\' 09"',
        type: 'dso',
        magnitude: 3.4,
      });

      // 3. Create equipment profile
      const profile = EquipmentProfileService.createProfile(
        'DSO Setup',
        'Deep sky imaging setup',
        {
          camera: {
            name: 'ASI2600MC',
            model: 'ASI2600MC',
            pixelSize: 3.76,
            resolution: { width: 6248, height: 4176 },
            cooled: true,
            binningModes: ['1x1'],
            frameTypes: ['light', 'dark', 'flat'],
          },
          mount: {
            name: 'EQ6-R Pro',
            model: 'EQ6-R Pro',
            type: 'equatorial',
            maxSlewRate: 4.0,
            trackingAccuracy: 1.5,
            payloadCapacity: 20,
            hasGPS: true,
            hasPEC: true,
          },
        },
        {
          camera: {
            defaultGain: 100,
            defaultOffset: 50,
            defaultBinning: '1x1',
            coolingTarget: -10,
            downloadTimeout: 60,
            imageFormat: 'FITS',
          },
          mount: {
            slewRate: 3.0,
            trackingRate: 1.0,
            guidingRate: 0.5,
            flipHourAngle: 6,
            parkPosition: { ra: 0, dec: 90 },
            limits: {
              eastLimit: 90,
              westLimit: -90,
              horizonLimit: 25,
            },
          },
          safety: {
            enableWeatherMonitoring: true,
            enableEquipmentMonitoring: true,
            autoAbortOnError: true,
            maxConsecutiveErrors: 2,
            emergencyStopConditions: ['high_wind', 'rain', 'clouds'],
          },
        }
      );

      // 4. Serialize the complete project
      const projectData = {
        workspace,
        targets: [target],
        equipmentProfile: profile,
        metadata: {
          created: new Date(),
          version: '1.0.0',
        },
      };

      const serializeResult = await SerializationService.serialize(projectData, {
        compress: true,
        includeMetadata: true,
      });

      expect(serializeResult.success).toBe(true);

      // 5. Deserialize and verify
      const deserializeResult = await SerializationService.deserialize(serializeResult.data!);
      expect(deserializeResult.success).toBe(true);
      // Check structure without exact date matching (dates become strings after serialization)
      expect(deserializeResult.data).toMatchObject({
        workspace: {
          name: projectData.workspace.name,
          description: projectData.workspace.description,
          sequences: projectData.workspace.sequences,
        },
        targets: [{
          name: projectData.targets[0].name,
          type: projectData.targets[0].type,
          coordinates: projectData.targets[0].coordinates,
        }],
        equipmentProfile: {
          name: projectData.equipmentProfile.name,
          description: projectData.equipmentProfile.description,
        },
        metadata: {
          version: projectData.metadata.version,
        },
      });

      // 6. Validate all components
      const workspaceValidation = WorkspaceService.validateWorkspace(workspace);
      const targetValidation = TargetService.validateTarget(target);
      const profileValidation = EquipmentProfileService.validateProfile(profile);

      expect(workspaceValidation.isValid).toBe(true);
      expect(targetValidation.isValid).toBe(true);
      expect(profileValidation.isValid).toBe(true);
    });
  });
});
