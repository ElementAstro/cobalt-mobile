/**
 * Tests for the Enhanced Simulation Engine
 */

import { SimulationEngine } from '../lib/simulation-engine';

describe('SimulationEngine', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = new SimulationEngine({
      realism: 'basic',
      errorRate: 0,
      weatherEffects: false,
      equipmentAging: false,
      networkLatency: 0,
      testMode: true,
    });
  });

  afterEach(() => {
    engine.cleanup();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultEngine = new SimulationEngine();
      const config = defaultEngine.getConfig();
      
      expect(config.realism).toBe('realistic');
      expect(config.errorRate).toBe(0.05);
      expect(config.weatherEffects).toBe(true);
      expect(config.equipmentAging).toBe(true);
      expect(config.networkLatency).toBe(100);
    });

    test('should initialize with custom configuration', () => {
      const config = engine.getConfig();

      expect(config.realism).toBe('basic');
      expect(config.errorRate).toBe(0);
      expect(config.weatherEffects).toBe(false);
      expect(config.equipmentAging).toBe(false);
      expect(config.networkLatency).toBe(0);
      expect(config.testMode).toBe(true);
    });

    test('should initialize environmental conditions', () => {
      const conditions = engine.getEnvironmentalConditions();

      expect(conditions.temperature).toBeGreaterThan(-15);
      expect(conditions.temperature).toBeLessThan(35);
      expect(conditions.humidity).toBeGreaterThanOrEqual(30);
      expect(conditions.humidity).toBeLessThanOrEqual(70);
      expect(conditions.pressure).toBeGreaterThan(1003);
      expect(conditions.pressure).toBeLessThan(1023);
      expect(conditions.seeing).toBeGreaterThan(1.5);
      expect(conditions.seeing).toBeLessThan(3.5);
      expect(conditions.lightPollution).toBeGreaterThan(18);
      expect(conditions.lightPollution).toBeLessThan(22);
      expect(conditions.windSpeed).toBeGreaterThanOrEqual(0);
      expect(conditions.windSpeed).toBeLessThan(15);
    });

    test('should initialize equipment health', () => {
      const health = engine.getEquipmentHealth();
      
      expect(health.camera).toBeDefined();
      expect(health.mount).toBeDefined();
      expect(health.focuser).toBeDefined();
      expect(health.filterWheel).toBeDefined();
      
      expect(health.camera.sensorTemp).toBeLessThan(20);
      expect(health.camera.coolingEfficiency).toBeGreaterThan(0);
      expect(health.camera.coolingEfficiency).toBeLessThanOrEqual(1);
      expect(health.mount.trackingAccuracy).toBeGreaterThan(0);
      expect(health.focuser.backlash).toBeGreaterThan(0);
      expect(health.filterWheel.positionAccuracy).toBeGreaterThan(0.9);
    });
  });

  describe('Camera Simulation', () => {
    test('should simulate capture successfully', async () => {
      const mockProgress = jest.fn();
      const result = await engine.simulateCapture(10, mockProgress);

      expect(result.success).toBe(true);
      expect(mockProgress).toHaveBeenCalled();

      if (result.metadata) {
        expect(result.metadata.fwhm).toBeGreaterThan(0);
        expect(result.metadata.snr).toBeGreaterThan(0);
        expect(result.metadata.temperature).toBeDefined();
        expect(result.metadata.seeing).toBeGreaterThan(0);
      }
    });

    test('should handle capture abort', async () => {
      const controller = new AbortController();
      const mockProgress = jest.fn();
      
      // Abort immediately
      controller.abort();
      
      const result = await engine.simulateCapture(10, mockProgress, controller.signal);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('aborted');
    });

    test('should simulate capture with varying exposure times', async () => {
      const shortExposure = await engine.simulateCapture(1, () => {});
      const longExposure = await engine.simulateCapture(300, () => {});

      expect(shortExposure.success).toBe(true);
      expect(longExposure.success).toBe(true);
      
      // Longer exposures should generally have better SNR
      if (shortExposure.metadata && longExposure.metadata) {
        expect(longExposure.metadata.snr as number).toBeGreaterThan(shortExposure.metadata.snr as number);
      }
    });
  });

  describe('Mount Simulation', () => {
    test('should simulate slew successfully', async () => {
      const mockProgress = jest.fn();
      const result = await engine.simulateSlew(0, 0, 10, 20, mockProgress);

      expect(result.success).toBe(true);
      expect(result.finalRA).toBeDefined();
      expect(result.finalDec).toBeDefined();
      expect(mockProgress).toHaveBeenCalled();

      // Final position should be close to target (within pointing accuracy)
      if (result.finalRA && result.finalDec) {
        expect(Math.abs(result.finalRA - 10)).toBeLessThan(1);
        expect(Math.abs(result.finalDec - 20)).toBeLessThan(1);
      }
    });

    test('should handle slew abort', async () => {
      const controller = new AbortController();
      const mockProgress = jest.fn();
      
      controller.abort();
      
      const result = await engine.simulateSlew(0, 0, 10, 20, mockProgress, controller.signal);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('aborted');
    });

    test('should simulate realistic slew times', async () => {
      const result = await engine.simulateSlew(0, 0, 90, 45, () => {}); // Large slew
      expect(result.success).toBe(true);
    });
  });

  describe('Focuser Simulation', () => {
    test('should simulate focuser move successfully', async () => {
      const mockProgress = jest.fn();
      const result = await engine.simulateFocuserMove(10000, 15000, mockProgress);

      expect(result.success).toBe(true);
      expect(result.finalPosition).toBeDefined();
      expect(mockProgress).toHaveBeenCalled();

      // Final position should be close to target
      if (result.finalPosition) {
        expect(Math.abs(result.finalPosition - 15000)).toBeLessThan(50);
      }
    });

    test('should handle focuser abort', async () => {
      const controller = new AbortController();
      const mockProgress = jest.fn();
      
      controller.abort();
      
      const result = await engine.simulateFocuserMove(10000, 15000, mockProgress, controller.signal);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('aborted');
    });

    test('should simulate backlash compensation', async () => {
      // Move in one direction
      const result1 = await engine.simulateFocuserMove(15000, 10000, () => {});

      // Move back (should include backlash)
      const result2 = await engine.simulateFocuserMove(10000, 15000, () => {});

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Both moves should complete successfully
      expect(result1.finalPosition).toBeDefined();
      expect(result2.finalPosition).toBeDefined();
    });
  });

  describe('Environmental Updates', () => {
    test('should update environmental conditions', () => {
      // const initial = engine.getEnvironmentalConditions(); // Unused for now
      
      // Update conditions
      const updated = engine.updateEnvironmentalConditions();
      
      expect(updated).toBeDefined();
      expect(updated.temperature).toBeDefined();
      expect(updated.humidity).toBeDefined();
      expect(updated.pressure).toBeDefined();
      expect(updated.seeing).toBeDefined();
      expect(updated.windSpeed).toBeDefined();
      
      // Values should be within realistic ranges
      expect(updated.temperature).toBeGreaterThan(-30);
      expect(updated.temperature).toBeLessThan(40);
      expect(updated.humidity).toBeGreaterThanOrEqual(0);
      expect(updated.humidity).toBeLessThanOrEqual(100);
      expect(updated.seeing).toBeGreaterThan(0.8);
      expect(updated.seeing).toBeLessThan(8);
    });

    test('should maintain environmental continuity', () => {
      const initial = engine.getEnvironmentalConditions();
      const updated = engine.updateEnvironmentalConditions();
      
      // Changes should be gradual, not dramatic
      expect(Math.abs(updated.temperature - initial.temperature)).toBeLessThan(5);
      expect(Math.abs(updated.humidity - initial.humidity)).toBeLessThan(20);
      expect(Math.abs(updated.pressure - initial.pressure)).toBeLessThan(10);
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration', () => {
      const newConfig = {
        realism: 'expert' as const,
        errorRate: 0.2,
        weatherEffects: false,
      };
      
      engine.updateConfig(newConfig);
      const config = engine.getConfig();
      
      expect(config.realism).toBe('expert');
      expect(config.errorRate).toBe(0.2);
      expect(config.weatherEffects).toBe(false);
      expect(config.equipmentAging).toBe(false); // Should preserve existing values
    });
  });

  describe('Error Simulation', () => {
    test('should occasionally simulate errors based on error rate', async () => {
      // Set high error rate for testing
      engine.updateConfig({ errorRate: 1.0 });
      
      let errorCount = 0;
      const attempts = 10;
      
      for (let i = 0; i < attempts; i++) {
        const result = await engine.simulateCapture(1, () => {});
        if (!result.success) {
          errorCount++;
        }
      }
      
      // With 100% error rate, we should see some errors
      expect(errorCount).toBeGreaterThan(0);
    });

    test('should not simulate errors when error rate is zero', async () => {
      engine.updateConfig({ errorRate: 0 });
      
      const attempts = 5;
      for (let i = 0; i < attempts; i++) {
        const result = await engine.simulateCapture(1, () => {});
        expect(result.success).toBe(true);
      }
    });
  });
});

describe('SimulationEngine Integration', () => {
  test('should handle multiple concurrent operations', async () => {
    const engine = new SimulationEngine({ testMode: true });

    const operations = [
      engine.simulateCapture(5, () => {}),
      engine.simulateSlew(0, 0, 10, 10, () => {}),
      engine.simulateFocuserMove(10000, 15000, () => {}),
    ];

    const results = await Promise.all(operations);

    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    engine.cleanup();
  });

  test('should maintain performance under load', async () => {
    const engine = new SimulationEngine({ testMode: true });
    const startTime = Date.now();

    // Simulate multiple rapid operations
    const operations = Array.from({ length: 20 }, () =>
      engine.simulateCapture(0.1, () => {})
    );

    await Promise.all(operations);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // Should complete within 1 second in test mode

    engine.cleanup();
  });
});
