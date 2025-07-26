/**
 * Tests for the target service
 * @jest-environment node
 */

import { TargetService } from '../services/target.service';
import { Target, TargetImportData } from '../types/sequencer.types';

describe('TargetService', () => {
  let testTarget: Target;
  let testTargets: Target[];

  beforeEach(() => {
    testTarget = TargetService.createTarget({
      name: 'M31 - Andromeda Galaxy',
      ra: '00h 42m 44s',
      dec: '+41° 16\' 09"',
      type: 'dso',
      magnitude: 3.4,
      commonNames: ['Andromeda Galaxy', 'NGC 224'],
      catalogIds: ['M31', 'NGC 224'],
      constellation: 'Andromeda',
    });

    testTargets = [
      testTarget,
      TargetService.createTarget({
        name: 'M42 - Orion Nebula',
        ra: '05h 35m 17s',
        dec: '-05° 23\' 14"',
        type: 'dso',
        magnitude: 4.0,
        constellation: 'Orion',
      }),
      TargetService.createTarget({
        name: 'Jupiter',
        ra: 12.5, // 12.5 hours
        dec: 15.0, // 15 degrees
        type: 'planet',
        magnitude: -2.5,
      }),
    ];
  });

  describe('Target Creation', () => {
    test('creates target with string coordinates', () => {
      const target = TargetService.createTarget({
        name: 'Test Target',
        ra: '12h 30m 45s',
        dec: '+45° 30\' 15"',
        type: 'dso',
      });

      expect(target.name).toBe('Test Target');
      expect(target.type).toBe('dso');
      expect(target.coordinates.ra).toBeCloseTo(12.5125, 3); // 12h 30m 45s
      expect(target.coordinates.dec).toBeCloseTo(45.5042, 3); // +45° 30' 15"
      expect(target.id).toBeDefined();
      expect(target.created).toBeInstanceOf(Date);
      expect(target.modified).toBeInstanceOf(Date);
    });

    test('creates target with numeric coordinates', () => {
      const target = TargetService.createTarget({
        name: 'Test Target',
        ra: 12.5,
        dec: 45.5,
        type: 'planet',
      });

      expect(target.coordinates.ra).toBe(12.5);
      expect(target.coordinates.dec).toBe(45.5);
      expect(target.coordinates.epoch).toBe(2000.0);
    });

    test('includes optional metadata', () => {
      const target = TargetService.createTarget({
        name: 'Test Target',
        ra: 12.0,
        dec: 45.0,
        type: 'dso',
        magnitude: 8.5,
        size: { major: 10, minor: 8, angle: 45 },
        commonNames: ['Test Object'],
        catalogIds: ['TEST 1'],
        constellation: 'Test',
        notes: 'Test notes',
      });

      expect(target.metadata.magnitude).toBe(8.5);
      expect(target.metadata.size).toEqual({ major: 10, minor: 8, angle: 45 });
      expect(target.metadata.commonNames).toEqual(['Test Object']);
      expect(target.metadata.catalogIds).toEqual(['TEST 1']);
      expect(target.metadata.constellation).toBe('Test');
      expect(target.metadata.notes).toBe('Test notes');
    });
  });

  describe('Coordinate Parsing', () => {
    test('parses RA in HMS format', () => {
      const coords = TargetService.parseCoordinates('12h 30m 45s', '+45° 30\' 15"');
      expect(coords.ra).toBeCloseTo(12.5125, 3);
    });

    test('parses Dec in DMS format', () => {
      const coords = TargetService.parseCoordinates('12h 00m 00s', '+45° 30\' 15"');
      expect(coords.dec).toBeCloseTo(45.5042, 3);
    });

    test('handles negative declination', () => {
      const coords = TargetService.parseCoordinates('12h 00m 00s', '-45° 30\' 15"');
      expect(coords.dec).toBeCloseTo(-45.5042, 3);
    });

    test('handles numeric coordinates', () => {
      const coords = TargetService.parseCoordinates(12.5, -45.5);
      expect(coords.ra).toBe(12.5);
      expect(coords.dec).toBe(-45.5);
    });
  });

  describe('Coordinate Formatting', () => {
    test('formats coordinates to HMS/DMS', () => {
      const coords = { ra: 12.5125, dec: 45.5042, epoch: 2000.0 };
      const formatted = TargetService.formatCoordinates(coords);

      expect(formatted.ra).toBe('12h 30m 45.0s');
      expect(formatted.dec).toBe('+45° 30\' 15.1"');
    });

    test('formats negative declination correctly', () => {
      const coords = { ra: 12.0, dec: -45.5, epoch: 2000.0 };
      const formatted = TargetService.formatCoordinates(coords);

      expect(formatted.dec).toBe('-45° 30\' 00.0"');
    });
  });

  describe('Target Search', () => {
    test('searches by name', () => {
      const results = TargetService.searchTargets(testTargets, {
        query: 'andromeda',
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toContain('Andromeda');
    });

    test('searches by common names', () => {
      const results = TargetService.searchTargets(testTargets, {
        query: 'NGC 224',
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata.catalogIds).toContain('NGC 224');
    });

    test('searches by catalog IDs', () => {
      const results = TargetService.searchTargets(testTargets, {
        query: 'M31',
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata.catalogIds).toContain('M31');
    });

    test('filters by type', () => {
      const results = TargetService.searchTargets(testTargets, {
        type: 'planet',
      });

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('planet');
    });

    test('filters by constellation', () => {
      const results = TargetService.searchTargets(testTargets, {
        constellation: 'Andromeda',
      });

      expect(results).toHaveLength(1);
      expect(results[0].metadata.constellation).toBe('Andromeda');
    });

    test('filters by magnitude range', () => {
      const results = TargetService.searchTargets(testTargets, {
        magnitude: { min: 3.0, max: 4.0 },
      });

      expect(results).toHaveLength(2); // M31 (3.4) and M42 (4.0)
    });

    test('combines multiple filters', () => {
      const results = TargetService.searchTargets(testTargets, {
        type: 'dso',
        magnitude: { max: 3.5 },
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toContain('Andromeda');
    });
  });

  describe('Observability Calculations', () => {
    test('calculates altitude and azimuth', () => {
      const observability = TargetService.calculateObservability(testTarget, {
        latitude: 40.0, // 40° N
        longitude: -74.0, // 74° W
        date: new Date('2024-01-01T00:00:00Z'),
      });

      expect(observability.altitude).toBeDefined();
      expect(observability.azimuth).toBeDefined();
      expect(observability.airmass).toBeDefined();
      expect(observability.visibility).toBeDefined();

      expect(typeof observability.altitude).toBe('number');
      expect(typeof observability.azimuth).toBe('number');
      expect(observability.azimuth).toBeGreaterThanOrEqual(0);
      expect(observability.azimuth).toBeLessThan(360);
    });

    test('determines visibility based on altitude', () => {
      // Mock a high altitude target
      const highTarget = TargetService.createTarget({
        name: 'High Target',
        ra: 12.0,
        dec: 89.0, // Near zenith
        type: 'star',
      });

      const observability = TargetService.calculateObservability(highTarget, {
        latitude: 40.0,
        longitude: -74.0,
        date: new Date('2024-06-21T12:00:00Z'), // Summer solstice, noon
      });

      // At high declination and appropriate time, should have good visibility
      expect(['excellent', 'good', 'fair']).toContain(observability.visibility);
    });

    test('calculates airmass correctly', () => {
      const observability = TargetService.calculateObservability(testTarget, {
        latitude: 40.0,
        longitude: -74.0,
        date: new Date('2024-01-01T00:00:00Z'),
      });

      if (observability.altitude && observability.altitude > 0) {
        expect(observability.airmass).toBeGreaterThan(1.0);
      } else {
        expect(observability.airmass).toBe(Infinity);
      }
    });
  });

  describe('Target Validation', () => {
    test('validates correct target', () => {
      const result = TargetService.validateTarget(testTarget);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects missing name', () => {
      const invalidTarget = { ...testTarget, name: '' };
      const result = TargetService.validateTarget(invalidTarget);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Target name is required');
    });

    test('detects invalid RA range', () => {
      const invalidTarget = {
        ...testTarget,
        coordinates: { ...testTarget.coordinates, ra: 25.0 },
      };
      const result = TargetService.validateTarget(invalidTarget);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('RA must be between 0 and 24 hours');
    });

    test('detects invalid Dec range', () => {
      const invalidTarget = {
        ...testTarget,
        coordinates: { ...testTarget.coordinates, dec: 95.0 },
      };
      const result = TargetService.validateTarget(invalidTarget);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dec must be between -90 and +90 degrees');
    });

    test('detects extreme magnitude values', () => {
      const invalidTarget = {
        ...testTarget,
        metadata: { ...testTarget.metadata, magnitude: 50.0 },
      };
      const result = TargetService.validateTarget(invalidTarget);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Magnitude must be between -30 and +30');
    });
  });

  describe('Distance Calculations', () => {
    test('calculates distance between targets', () => {
      const target1 = TargetService.createTarget({
        name: 'Target 1',
        ra: 0.0,
        dec: 0.0,
        type: 'star',
      });

      const target2 = TargetService.createTarget({
        name: 'Target 2',
        ra: 1.0, // 1 hour = 15 degrees
        dec: 0.0,
        type: 'star',
      });

      const distance = TargetService.calculateDistance(target1, target2);

      expect(distance).toBeCloseTo(15.0, 1); // Should be approximately 15 degrees
    });

    test('finds nearby targets', () => {
      const centerTarget = testTargets[0]; // M31
      const nearbyTargets = TargetService.findNearbyTargets(
        centerTarget,
        testTargets,
        10.0 // 10 degree radius
      );

      // Should not include the center target itself
      expect(nearbyTargets.every(t => t.id !== centerTarget.id)).toBe(true);
    });
  });

  describe('Target Sorting', () => {
    test('sorts by name', () => {
      const sorted = TargetService.sortTargets(testTargets, 'name');

      expect(sorted[0].name).toBe('Jupiter');
      expect(sorted[1].name).toContain('Andromeda');
      expect(sorted[2].name).toContain('Orion');
    });

    test('sorts by type', () => {
      const sorted = TargetService.sortTargets(testTargets, 'type');

      // 'dso' comes before 'planet' alphabetically
      expect(sorted[0].type).toBe('dso');
      expect(sorted[1].type).toBe('dso');
      expect(sorted[2].type).toBe('planet');
    });

    test('sorts by magnitude', () => {
      const sorted = TargetService.sortTargets(testTargets, 'magnitude');

      // Jupiter (-2.5), M31 (3.4), M42 (4.0)
      expect(sorted[0].metadata.magnitude).toBe(-2.5);
      expect(sorted[1].metadata.magnitude).toBe(3.4);
      expect(sorted[2].metadata.magnitude).toBe(4.0);
    });

    test('sorts by RA', () => {
      const sorted = TargetService.sortTargets(testTargets, 'ra');

      // M31 (0.71), M42 (5.59), Jupiter (12.5)
      expect(sorted[0].coordinates.ra).toBeLessThan(sorted[1].coordinates.ra);
      expect(sorted[1].coordinates.ra).toBeLessThan(sorted[2].coordinates.ra);
    });
  });

  describe('CSV Import/Export', () => {
    test('exports targets to CSV', () => {
      const csv = TargetService.exportTargetsToCSV([testTarget]);

      expect(csv).toContain('Name,RA,Dec,Type,Magnitude,Constellation');
      expect(csv).toContain('M31 - Andromeda Galaxy');
      expect(csv).toContain('dso');
      expect(csv).toContain('3.4');
      expect(csv).toContain('Andromeda');
    });

    test('imports targets from CSV', () => {
      const csvData = `Name,RA,Dec,Type,Magnitude,Constellation,Notes
Test Target,12h 30m 00s,+45° 00' 00",dso,8.5,Test,Test notes
Another Target,06h 15m 30s,-20° 30' 15",star,6.2,Orion,Another test`;

      const imported = TargetService.importTargetsFromCSV(csvData);

      expect(imported).toHaveLength(2);
      expect(imported[0].name).toBe('Test Target');
      expect(imported[0].type).toBe('dso');
      expect(imported[0].metadata.magnitude).toBe(8.5);
      expect(imported[0].metadata.constellation).toBe('Test');
      expect(imported[0].metadata.notes).toBe('Test notes');
    });

    test('handles malformed CSV gracefully', () => {
      const malformedCSV = `Name,RA,Dec
Incomplete Target,12h 30m 00s
Another Line,invalid,coordinates,extra,fields`;

      const imported = TargetService.importTargetsFromCSV(malformedCSV);

      // Should skip malformed entries
      expect(imported).toHaveLength(0);
    });
  });

  describe('Built-in Targets', () => {
    test('provides built-in target catalog', () => {
      const builtInTargets = TargetService.getBuiltInTargets();

      expect(builtInTargets.length).toBeGreaterThan(0);
      expect(builtInTargets.every(t => t.id)).toBe(true);
      expect(builtInTargets.every(t => t.name)).toBe(true);
      expect(builtInTargets.every(t => t.coordinates)).toBe(true);
    });

    test('built-in targets have valid coordinates', () => {
      const builtInTargets = TargetService.getBuiltInTargets();

      builtInTargets.forEach(target => {
        const validation = TargetService.validateTarget(target);
        expect(validation.isValid).toBe(true);
      });
    });
  });

  describe('Target Statistics', () => {
    test('calculates target statistics', () => {
      const stats = TargetService.getTargetStatistics(testTargets);

      expect(stats.totalTargets).toBe(3);
      expect(stats.byType.dso).toBe(2);
      expect(stats.byType.planet).toBe(1);
      expect(stats.byConstellation.Andromeda).toBe(1);
      expect(stats.byConstellation.Orion).toBe(1);
      expect(stats.magnitudeRange.min).toBe(-2.5);
      expect(stats.magnitudeRange.max).toBe(4.0);
      expect(stats.averageMagnitude).toBeCloseTo(1.63, 1);
    });

    test('handles empty target list', () => {
      const stats = TargetService.getTargetStatistics([]);

      expect(stats.totalTargets).toBe(0);
      expect(Object.keys(stats.byType)).toHaveLength(0);
      expect(Object.keys(stats.byConstellation)).toHaveLength(0);
      expect(stats.magnitudeRange.min).toBe(0);
      expect(stats.magnitudeRange.max).toBe(0);
      expect(stats.averageMagnitude).toBe(0);
    });
  });
});
