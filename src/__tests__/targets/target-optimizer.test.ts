import { TargetOptimizer, OptimizationParameters, OptimizedSession } from '../../lib/targets/target-optimizer';
import { Target } from '../../lib/target-planning/target-database';
import { EquipmentProfile } from '../../lib/stores/equipment-store';

// Mock data
const mockEquipment: EquipmentProfile = {
  id: 'eq1',
  name: 'Test Setup',
  telescope: {
    model: 'Celestron EdgeHD 8',
    aperture: 203,
    focalLength: 2032,
    focalRatio: 10
  },
  camera: {
    model: 'ZWO ASI2600MC',
    pixelSize: 3.76,
    resolution: { width: 6248, height: 4176 },
    cooled: true
  },
  mount: {
    model: 'Celestron CGX',
    payload: 25,
    goto: true,
    tracking: true
  },
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    elevation: 10,
    timezone: 'America/New_York'
  }
};

const mockTargets: Target[] = [
  {
    id: 'M31',
    name: 'Andromeda Galaxy',
    type: 'galaxy',
    coordinates: { ra: 10.6847, dec: 41.2687 },
    magnitude: 3.4,
    size: { width: 190, height: 60 },
    constellation: 'Andromeda',
    season: 'autumn',
    difficulty: 'beginner',
    description: 'Large spiral galaxy',
    imagingTips: ['Use wide field', 'Long exposures'],
    bestMonths: [9, 10, 11, 12]
  },
  {
    id: 'M42',
    name: 'Orion Nebula',
    type: 'nebula',
    coordinates: { ra: 83.8221, dec: -5.3911 },
    magnitude: 4.0,
    size: { width: 85, height: 60 },
    constellation: 'Orion',
    season: 'winter',
    difficulty: 'beginner',
    description: 'Bright emission nebula',
    imagingTips: ['Watch for overexposure', 'HDR recommended'],
    bestMonths: [11, 12, 1, 2, 3]
  }
];

const mockOptimizationParams: OptimizationParameters = {
  sessionStart: new Date('2024-03-15T20:00:00Z'),
  sessionEnd: new Date('2024-03-16T04:00:00Z'),
  minAltitude: 30,
  maxAirmass: 2.5,
  prioritizeTransit: true,
  allowTargetSwitching: true,
  minTargetDuration: 60, // 1 hour
  setupTime: 30, // 30 minutes
  weather: {
    cloudCover: 20,
    seeing: 3.5,
    transparency: 7,
    humidity: 45,
    temperature: 15,
    windSpeed: 8,
    forecast: 'clear'
  }
};

describe('TargetOptimizer', () => {
  let optimizer: TargetOptimizer;
  const mockLocation = {
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York'
  };

  beforeEach(() => {
    optimizer = new TargetOptimizer(mockLocation);
  });

  describe('optimizeSession', () => {
    it('should create an optimized session with valid inputs', () => {
      const session = optimizer.optimizeSession(
        mockTargets,
        mockEquipment,
        mockOptimizationParams
      );

      expect(session).toHaveProperty('targets');
      expect(session).toHaveProperty('timeline');
      expect(session).toHaveProperty('totalDuration');
      expect(session).toHaveProperty('efficiency');
      expect(session.targets.length).toBeGreaterThan(0);
      expect(session.totalDuration).toBeGreaterThan(0);
      expect(session.efficiency).toBeGreaterThanOrEqual(0);
      expect(session.efficiency).toBeLessThanOrEqual(100);
    });

    it('should respect minimum altitude constraints', () => {
      const highAltitudeParams = {
        ...mockOptimizationParams,
        minAltitude: 60
      };

      const session = optimizer.optimizeSession(
        mockTargets,
        mockEquipment,
        highAltitudeParams
      );

      // Check that all targets in the session meet altitude requirements
      session.targets.forEach(target => {
        const altitude = optimizer.calculateAltitude(
          target.target.coordinates,
          mockEquipment.location,
          new Date(target.startTime)
        );
        expect(altitude).toBeGreaterThanOrEqual(60);
      });
    });

    it('should handle empty target list', () => {
      const session = optimizer.optimizeSession(
        [],
        mockEquipment,
        mockOptimizationParams
      );

      expect(session.targets).toHaveLength(0);
      expect(session.totalDuration).toBe(0);
      expect(session.efficiency).toBe(0);
    });

    it('should respect session time constraints', () => {
      const session = optimizer.optimizeSession(
        mockTargets,
        mockEquipment,
        mockOptimizationParams
      );

      const sessionStart = mockOptimizationParams.sessionStart.getTime();
      const sessionEnd = mockOptimizationParams.sessionEnd.getTime();

      session.targets.forEach(target => {
        expect(new Date(target.startTime).getTime()).toBeGreaterThanOrEqual(sessionStart);
        expect(new Date(target.endTime).getTime()).toBeLessThanOrEqual(sessionEnd);
      });
    });

    it('should prioritize targets near transit when enabled', () => {
      const transitParams = {
        ...mockOptimizationParams,
        prioritizeTransit: true
      };

      const session = optimizer.optimizeSession(
        mockTargets,
        mockEquipment,
        transitParams
      );

      // First target should be scheduled closer to its transit time
      if (session.targets.length > 0) {
        const firstTarget = session.targets[0];
        const transitTime = optimizer.calculateTransitTime(
          firstTarget.target.coordinates,
          mockEquipment.location,
          mockOptimizationParams.sessionStart
        );
        
        const scheduledTime = new Date(firstTarget.startTime);
        const timeDiff = Math.abs(scheduledTime.getTime() - transitTime.getTime());
        
        // Should be scheduled within reasonable time of transit
        expect(timeDiff).toBeLessThan(4 * 60 * 60 * 1000); // 4 hours
      }
    });
  });

  describe('calculateAltitude', () => {
    it('should calculate correct altitude for known coordinates', () => {
      const coordinates = { ra: 83.8221, dec: -5.3911 }; // Orion Nebula
      const date = new Date('2024-01-15T22:00:00Z'); // Winter evening
      
      const altitude = optimizer.calculateAltitude(
        coordinates,
        mockEquipment.location,
        date
      );

      expect(altitude).toBeGreaterThan(0);
      expect(altitude).toBeLessThan(90);
    });

    it('should handle extreme coordinates', () => {
      const northPole = { ra: 0, dec: 90 };
      const southPole = { ra: 0, dec: -90 };
      const date = new Date();

      const northAlt = optimizer.calculateAltitude(northPole, mockEquipment.location, date);
      const southAlt = optimizer.calculateAltitude(southPole, mockEquipment.location, date);

      expect(northAlt).toBeGreaterThanOrEqual(-90);
      expect(northAlt).toBeLessThanOrEqual(90);
      expect(southAlt).toBeGreaterThanOrEqual(-90);
      expect(southAlt).toBeLessThanOrEqual(90);
    });

    it('should return different altitudes for different times', () => {
      const coordinates = mockTargets[0].coordinates;
      const time1 = new Date('2024-03-15T20:00:00Z');
      const time2 = new Date('2024-03-15T23:00:00Z');

      const alt1 = optimizer.calculateAltitude(coordinates, mockEquipment.location, time1);
      const alt2 = optimizer.calculateAltitude(coordinates, mockEquipment.location, time2);

      expect(alt1).not.toBe(alt2);
    });
  });

  describe('calculateAirmass', () => {
    it('should calculate airmass correctly for various altitudes', () => {
      const highAltitude = 80; // degrees
      const mediumAltitude = 45;
      const lowAltitude = 20;

      const highAirmass = optimizer.calculateAirmass(highAltitude);
      const mediumAirmass = optimizer.calculateAirmass(mediumAltitude);
      const lowAirmass = optimizer.calculateAirmass(lowAltitude);

      expect(highAirmass).toBeLessThan(mediumAirmass);
      expect(mediumAirmass).toBeLessThan(lowAirmass);
      expect(highAirmass).toBeCloseTo(1.0, 1);
    });

    it('should handle edge cases', () => {
      const zenithAirmass = optimizer.calculateAirmass(90);
      const horizonAirmass = optimizer.calculateAirmass(0);
      const negativeAirmass = optimizer.calculateAirmass(-10);

      expect(zenithAirmass).toBeCloseTo(1.0, 1);
      expect(horizonAirmass).toBeGreaterThan(10);
      expect(negativeAirmass).toBeGreaterThan(10); // Should handle gracefully
    });
  });

  describe('calculateTransitTime', () => {
    it('should calculate transit time for given coordinates', () => {
      const coordinates = mockTargets[0].coordinates;
      const date = new Date('2024-03-15T12:00:00Z');

      const transitTime = optimizer.calculateTransitTime(
        coordinates,
        mockEquipment.location,
        date
      );

      expect(transitTime).toBeInstanceOf(Date);
      expect(transitTime.getTime()).toBeGreaterThan(date.getTime() - 24 * 60 * 60 * 1000);
      expect(transitTime.getTime()).toBeLessThan(date.getTime() + 24 * 60 * 60 * 1000);
    });

    it('should return different transit times for different coordinates', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      
      const transit1 = optimizer.calculateTransitTime(
        mockTargets[0].coordinates,
        mockEquipment.location,
        date
      );
      
      const transit2 = optimizer.calculateTransitTime(
        mockTargets[1].coordinates,
        mockEquipment.location,
        date
      );

      expect(transit1.getTime()).not.toBe(transit2.getTime());
    });
  });

  describe('optimizeExposureSettings', () => {
    it('should generate appropriate exposure settings for different target types', () => {
      const galaxyTarget = mockTargets.find(t => t.type === 'galaxy')!;
      const nebulaTarget = mockTargets.find(t => t.type === 'nebula')!;

      const galaxySettings = optimizer.optimizeExposureSettings(
        galaxyTarget,
        mockEquipment,
        mockOptimizationParams.weather
      );

      const nebulaSettings = optimizer.optimizeExposureSettings(
        nebulaTarget,
        mockEquipment,
        mockOptimizationParams.weather
      );

      expect(galaxySettings).toHaveProperty('exposureTime');
      expect(galaxySettings).toHaveProperty('gain');
      expect(galaxySettings).toHaveProperty('binning');
      expect(galaxySettings).toHaveProperty('filterSequence');

      expect(nebulaSettings).toHaveProperty('exposureTime');
      expect(nebulaSettings).toHaveProperty('gain');
      expect(nebulaSettings).toHaveProperty('binning');
      expect(nebulaSettings).toHaveProperty('filterSequence');

      // Exposure times should be reasonable
      expect(galaxySettings.exposureTime).toBeGreaterThan(60);
      expect(galaxySettings.exposureTime).toBeLessThan(1200);
      expect(nebulaSettings.exposureTime).toBeGreaterThan(60);
      expect(nebulaSettings.exposureTime).toBeLessThan(1200);
    });

    it('should adjust settings based on weather conditions', () => {
      const target = mockTargets[0];
      
      const goodWeather = {
        ...mockOptimizationParams.weather,
        seeing: 2.0,
        transparency: 9
      };

      const poorWeather = {
        ...mockOptimizationParams.weather,
        seeing: 5.0,
        transparency: 4
      };

      const goodSettings = optimizer.optimizeExposureSettings(target, mockEquipment, goodWeather);
      const poorSettings = optimizer.optimizeExposureSettings(target, mockEquipment, poorWeather);

      // Poor weather might suggest shorter exposures or different binning
      expect(goodSettings.exposureTime).toBeGreaterThan(0);
      expect(poorSettings.exposureTime).toBeGreaterThan(0);
    });

    it('should handle missing equipment information', () => {
      const minimalEquipment = {
        ...mockEquipment,
        camera: undefined
      };

      const settings = optimizer.optimizeExposureSettings(
        mockTargets[0],
        minimalEquipment,
        mockOptimizationParams.weather
      );

      expect(settings).toHaveProperty('exposureTime');
      expect(settings.exposureTime).toBeGreaterThan(0);
    });
  });

  describe('calculateImageScale', () => {
    it('should calculate correct image scale for given equipment', () => {
      const imageScale = optimizer.calculateImageScale(mockEquipment);

      expect(imageScale).toBeGreaterThan(0);
      expect(imageScale).toBeLessThan(10); // Reasonable range for typical setups
    });

    it('should handle missing telescope or camera data', () => {
      const noTelescope = { ...mockEquipment, telescope: undefined };
      const noCamera = { ...mockEquipment, camera: undefined };

      const scale1 = optimizer.calculateImageScale(noTelescope);
      const scale2 = optimizer.calculateImageScale(noCamera);

      expect(scale1).toBe(0);
      expect(scale2).toBe(0);
    });
  });

  describe('calculateFieldOfView', () => {
    it('should calculate field of view correctly', () => {
      const fov = optimizer.calculateFieldOfView(mockEquipment);

      expect(fov).toHaveProperty('width');
      expect(fov).toHaveProperty('height');
      expect(fov.width).toBeGreaterThan(0);
      expect(fov.height).toBeGreaterThan(0);
    });

    it('should return proportional dimensions', () => {
      const fov = optimizer.calculateFieldOfView(mockEquipment);
      const camera = mockEquipment.camera!;
      
      const expectedRatio = camera.resolution.width / camera.resolution.height;
      const actualRatio = fov.width / fov.height;

      expect(actualRatio).toBeCloseTo(expectedRatio, 2);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => {
        optimizer.optimizeSession(null as any, mockEquipment, mockOptimizationParams);
      }).toThrow();

      expect(() => {
        optimizer.optimizeSession(mockTargets, null as any, mockOptimizationParams);
      }).toThrow();

      expect(() => {
        optimizer.optimizeSession(mockTargets, mockEquipment, null as any);
      }).toThrow();
    });

    it('should handle invalid date ranges', () => {
      const invalidParams = {
        ...mockOptimizationParams,
        sessionStart: new Date('2024-03-16T04:00:00Z'),
        sessionEnd: new Date('2024-03-15T20:00:00Z') // End before start
      };

      const session = optimizer.optimizeSession(
        mockTargets,
        mockEquipment,
        invalidParams
      );

      expect(session.targets).toHaveLength(0);
      expect(session.efficiency).toBe(0);
    });

    it('should handle extreme parameter values', () => {
      const extremeParams = {
        ...mockOptimizationParams,
        minAltitude: 89, // Nearly impossible
        maxAirmass: 1.01 // Very restrictive
      };

      const session = optimizer.optimizeSession(
        mockTargets,
        mockEquipment,
        extremeParams
      );

      // Should handle gracefully, possibly with no targets
      expect(session).toHaveProperty('targets');
      expect(session).toHaveProperty('efficiency');
    });

    it('should handle targets with invalid coordinates', () => {
      const invalidTargets = [
        {
          ...mockTargets[0],
          coordinates: { ra: -1, dec: 91 }
        }
      ];

      const session = optimizer.optimizeSession(
        invalidTargets,
        mockEquipment,
        mockOptimizationParams
      );

      expect(session).toHaveProperty('targets');
      expect(session).toHaveProperty('efficiency');
    });

    it('should handle very short session durations', () => {
      const shortParams = {
        ...mockOptimizationParams,
        sessionStart: new Date('2024-03-15T20:00:00Z'),
        sessionEnd: new Date('2024-03-15T20:30:00Z') // 30 minutes
      };

      const session = optimizer.optimizeSession(
        mockTargets,
        mockEquipment,
        shortParams
      );

      expect(session.totalDuration).toBeLessThanOrEqual(30);
    });
  });
});
