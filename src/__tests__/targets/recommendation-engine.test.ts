import { TargetRecommendationEngine, UserPreferences, RecommendationContext } from '../../lib/targets/recommendation-engine';
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

const mockUserPreferences: UserPreferences = {
  experienceLevel: 'intermediate',
  preferredTargets: ['galaxies', 'nebulae'],
  imagingGoals: ['deep_sky', 'color'],
  timeConstraints: {
    maxSessionDuration: 480, // 8 hours
    preferredStartTime: '20:00',
    availableNights: ['friday', 'saturday']
  },
  equipmentLimitations: {
    minAltitude: 30,
    maxMagnitude: 12,
    requiresGuiding: true
  },
  learningObjectives: ['improve_processing', 'learn_narrowband']
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
  },
  {
    id: 'M51',
    name: 'Whirlpool Galaxy',
    type: 'galaxy',
    coordinates: { ra: 202.4696, dec: 47.1951 },
    magnitude: 8.4,
    size: { width: 11, height: 7 },
    constellation: 'Canes Venatici',
    season: 'spring',
    difficulty: 'intermediate',
    description: 'Interacting spiral galaxies',
    imagingTips: ['Requires dark skies', 'Long exposures needed'],
    bestMonths: [3, 4, 5, 6, 7]
  }
];

const mockContext: RecommendationContext = {
  currentDate: new Date('2024-03-15T20:00:00Z'),
  location: mockEquipment.location,
  weather: {
    cloudCover: 20,
    seeing: 3.5,
    transparency: 7,
    humidity: 45,
    temperature: 15,
    windSpeed: 8,
    forecast: 'clear'
  },
  moonPhase: {
    phase: 0.25,
    illumination: 50,
    rise: new Date('2024-03-15T23:30:00Z'),
    set: new Date('2024-03-16T11:15:00Z')
  },
  sessionHistory: []
};

describe('TargetRecommendationEngine', () => {
  let engine: TargetRecommendationEngine;

  beforeEach(() => {
    engine = new TargetRecommendationEngine();
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for valid inputs', async () => {
      const recommendations = await engine.generateRecommendations(
        mockTargets,
        mockUserPreferences,
        mockEquipment,
        mockContext
      );

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0]).toHaveProperty('target');
      expect(recommendations[0]).toHaveProperty('score');
      expect(recommendations[0]).toHaveProperty('reasons');
      expect(recommendations[0]).toHaveProperty('suitability');
      expect(recommendations[0]).toHaveProperty('sessionPlan');
    });

    it('should sort recommendations by score in descending order', async () => {
      const recommendations = await engine.generateRecommendations(
        mockTargets,
        mockUserPreferences,
        mockEquipment,
        mockContext
      );

      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].score).toBeGreaterThanOrEqual(recommendations[i].score);
      }
    });

    it('should filter out targets below minimum altitude', async () => {
      const lowAltitudeContext = {
        ...mockContext,
        currentDate: new Date('2024-06-15T20:00:00Z') // Summer, M31 will be low
      };

      const recommendations = await engine.generateRecommendations(
        mockTargets,
        mockUserPreferences,
        mockEquipment,
        lowAltitudeContext
      );

      // M31 should have lower score or be filtered out due to low altitude
      const m31Rec = recommendations.find(r => r.target.id === 'M31');
      if (m31Rec) {
        expect(m31Rec.score).toBeLessThan(70); // Should be penalized for low altitude
      }
    });

    it('should handle empty target list', async () => {
      const recommendations = await engine.generateRecommendations(
        [],
        mockUserPreferences,
        mockEquipment,
        mockContext
      );

      expect(recommendations).toHaveLength(0);
    });

    it('should handle invalid coordinates gracefully', async () => {
      const invalidTarget = {
        ...mockTargets[0],
        coordinates: { ra: -1, dec: 91 } // Invalid coordinates
      };

      const recommendations = await engine.generateRecommendations(
        [invalidTarget],
        mockUserPreferences,
        mockEquipment,
        mockContext
      );

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].score).toBeLessThan(50); // Should be penalized
    });
  });

  describe('calculateTargetScore', () => {
    it('should calculate higher scores for preferred target types', () => {
      const galaxyTarget = mockTargets.find(t => t.type === 'galaxy')!;
      const score = engine.calculateTargetScore(
        galaxyTarget,
        mockUserPreferences,
        mockEquipment,
        mockContext
      );

      expect(score).toBeGreaterThan(50);
    });

    it('should penalize targets that are too difficult for user experience', () => {
      const beginnerPrefs = {
        ...mockUserPreferences,
        experienceLevel: 'beginner' as const
      };

      const difficultTarget = {
        ...mockTargets[2],
        difficulty: 'advanced' as const
      };

      const score = engine.calculateTargetScore(
        difficultTarget,
        beginnerPrefs,
        mockEquipment,
        mockContext
      );

      expect(score).toBeLessThan(60); // Should be penalized for difficulty mismatch
    });

    it('should boost scores for targets in season', () => {
      const springContext = {
        ...mockContext,
        currentDate: new Date('2024-04-15T20:00:00Z')
      };

      const springTarget = mockTargets.find(t => t.season === 'spring')!;
      const score = engine.calculateTargetScore(
        springTarget,
        mockUserPreferences,
        mockEquipment,
        springContext
      );

      expect(score).toBeGreaterThan(60); // Should get seasonal boost
    });
  });

  describe('calculateEquipmentSuitability', () => {
    it('should return high suitability for appropriate targets', () => {
      const suitability = engine.calculateEquipmentSuitability(
        mockTargets[0], // M31 - large target
        mockEquipment
      );

      expect(suitability.overall).toBeGreaterThan(70);
      expect(suitability.telescope).toBeGreaterThan(70);
      expect(suitability.camera).toBeGreaterThan(70);
      expect(suitability.mount).toBeGreaterThan(70);
    });

    it('should return lower suitability for mismatched equipment', () => {
      const smallTarget = {
        ...mockTargets[2], // M51 - small target
        size: { width: 2, height: 2 } // Very small
      };

      const wideFocalLengthEquipment = {
        ...mockEquipment,
        telescope: {
          ...mockEquipment.telescope!,
          focalLength: 400 // Very wide field
        }
      };

      const suitability = engine.calculateEquipmentSuitability(
        smallTarget,
        wideFocalLengthEquipment
      );

      expect(suitability.telescope).toBeLessThan(50); // Should be penalized for focal length mismatch
    });

    it('should handle missing equipment gracefully', () => {
      const minimalEquipment = {
        ...mockEquipment,
        telescope: undefined,
        camera: undefined
      };

      const suitability = engine.calculateEquipmentSuitability(
        mockTargets[0],
        minimalEquipment
      );

      expect(suitability.overall).toBeLessThan(30);
      expect(suitability.telescope).toBe(0);
      expect(suitability.camera).toBe(0);
    });
  });

  describe('calculateSeasonalScore', () => {
    it('should return high scores for targets in their best season', () => {
      const springContext = {
        ...mockContext,
        currentDate: new Date('2024-04-15T20:00:00Z')
      };

      const springTarget = mockTargets.find(t => t.season === 'spring')!;
      const score = engine.calculateSeasonalScore(springTarget, springContext);

      expect(score).toBeGreaterThan(80);
    });

    it('should return lower scores for out-of-season targets', () => {
      const summerContext = {
        ...mockContext,
        currentDate: new Date('2024-07-15T20:00:00Z')
      };

      const winterTarget = mockTargets.find(t => t.season === 'winter')!;
      const score = engine.calculateSeasonalScore(winterTarget, summerContext);

      expect(score).toBeLessThan(40);
    });

    it('should handle targets without seasonal information', () => {
      const targetWithoutSeason = {
        ...mockTargets[0],
        season: undefined,
        bestMonths: undefined
      };

      const score = engine.calculateSeasonalScore(targetWithoutSeason, mockContext);

      expect(score).toBe(50); // Should return neutral score
    });
  });

  describe('analyzeWeatherConditions', () => {
    it('should return high scores for excellent weather', () => {
      const excellentWeather = {
        ...mockContext.weather,
        cloudCover: 0,
        seeing: 2.0,
        transparency: 9,
        humidity: 30
      };

      const context = { ...mockContext, weather: excellentWeather };
      const score = engine.analyzeWeatherConditions(mockTargets[0], context);

      expect(score).toBeGreaterThan(90);
    });

    it('should return low scores for poor weather', () => {
      const poorWeather = {
        ...mockContext.weather,
        cloudCover: 90,
        seeing: 6.0,
        transparency: 3,
        humidity: 90
      };

      const context = { ...mockContext, weather: poorWeather };
      const score = engine.analyzeWeatherConditions(mockTargets[0], context);

      expect(score).toBeLessThan(30);
    });

    it('should penalize faint targets more in poor seeing', () => {
      const poorSeeing = {
        ...mockContext.weather,
        seeing: 5.0
      };

      const context = { ...mockContext, weather: poorSeeing };
      
      const brightTarget = mockTargets.find(t => t.magnitude < 5)!;
      const faintTarget = mockTargets.find(t => t.magnitude > 8)!;

      const brightScore = engine.analyzeWeatherConditions(brightTarget, context);
      const faintScore = engine.analyzeWeatherConditions(faintTarget, context);

      expect(brightScore).toBeGreaterThan(faintScore);
    });
  });

  describe('identifyLearningOpportunities', () => {
    it('should identify relevant learning opportunities', () => {
      const opportunities = engine.identifyLearningOpportunities(
        mockTargets[0],
        mockUserPreferences,
        mockEquipment
      );

      expect(opportunities).toBeInstanceOf(Array);
      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0]).toHaveProperty('type');
      expect(opportunities[0]).toHaveProperty('description');
      expect(opportunities[0]).toHaveProperty('difficulty');
    });

    it('should suggest processing techniques for appropriate targets', () => {
      const nebulaTarget = mockTargets.find(t => t.type === 'nebula')!;
      const opportunities = engine.identifyLearningOpportunities(
        nebulaTarget,
        mockUserPreferences,
        mockEquipment
      );

      const processingOpportunity = opportunities.find(o => o.type === 'processing');
      expect(processingOpportunity).toBeDefined();
    });

    it('should suggest equipment upgrades when appropriate', () => {
      const basicEquipment = {
        ...mockEquipment,
        camera: {
          ...mockEquipment.camera!,
          cooled: false
        }
      };

      const faintTarget = mockTargets.find(t => t.magnitude > 8)!;
      const opportunities = engine.identifyLearningOpportunities(
        faintTarget,
        mockUserPreferences,
        basicEquipment
      );

      const equipmentOpportunity = opportunities.find(o => o.type === 'equipment');
      expect(equipmentOpportunity).toBeDefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      await expect(
        engine.generateRecommendations(null as any, mockUserPreferences, mockEquipment, mockContext)
      ).rejects.toThrow();

      await expect(
        engine.generateRecommendations(mockTargets, null as any, mockEquipment, mockContext)
      ).rejects.toThrow();
    });

    it('should handle extreme coordinate values', () => {
      const extremeTarget = {
        ...mockTargets[0],
        coordinates: { ra: 360, dec: 90 }
      };

      const score = engine.calculateTargetScore(
        extremeTarget,
        mockUserPreferences,
        mockEquipment,
        mockContext
      );

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle very large or very small target sizes', () => {
      const tinyTarget = {
        ...mockTargets[0],
        size: { width: 0.1, height: 0.1 }
      };

      const hugeTarget = {
        ...mockTargets[0],
        size: { width: 1000, height: 1000 }
      };

      const tinySuitability = engine.calculateEquipmentSuitability(tinyTarget, mockEquipment);
      const hugeSuitability = engine.calculateEquipmentSuitability(hugeTarget, mockEquipment);

      expect(tinySuitability.overall).toBeGreaterThanOrEqual(0);
      expect(hugeSuitability.overall).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing optional properties', () => {
      const minimalTarget = {
        id: 'test',
        name: 'Test Target',
        type: 'galaxy' as const,
        coordinates: { ra: 100, dec: 45 },
        magnitude: 10,
        size: { width: 10, height: 10 },
        constellation: 'Test',
        difficulty: 'intermediate' as const,
        description: 'Test target'
      };

      const score = engine.calculateTargetScore(
        minimalTarget,
        mockUserPreferences,
        mockEquipment,
        mockContext
      );

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
