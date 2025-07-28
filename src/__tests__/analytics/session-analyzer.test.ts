import { SessionAnalyzer, ImagingSession, SessionInsight, AnalyticsMetrics } from '../../lib/analytics/session-analyzer';
import { EquipmentProfile } from '../../lib/stores/equipment-store';

// Mock data
const mockEquipment: EquipmentProfile = {
  id: 'eq1',
  name: 'Test Setup',
  description: 'Test equipment profile',
  equipmentIds: ['camera1', 'mount1', 'telescope1'],
  settings: {
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
  },
  isDefault: false,
  userId: 'test-user',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockSessions: ImagingSession[] = [
  {
    id: 'session1',
    date: new Date('2024-03-01T20:00:00Z'),
    duration: 240, // 4 hours
    target: {
      id: 'M31',
      name: 'Andromeda Galaxy',
      type: 'galaxy',
      coordinates: { ra: 10.6847, dec: 41.2687 },
      magnitude: 3.4
    },
    equipment: mockEquipment,
    conditions: {
      temperature: 15,
      humidity: 45,
      windSpeed: 8,
      cloudCover: 10,
      seeing: 3.5,
      transparency: 8,
      moonPhase: 0.25
    },
    images: [
      {
        filename: 'M31_001.fits',
        timestamp: new Date('2024-03-01T20:30:00Z'),
        exposureTime: 300,
        gain: 100,
        temperature: -10,
        filter: 'L',
        quality: {
          hfr: 2.1,
          snr: 45,
          stars: 1250,
          background: 1200,
          noise: 15
        }
      },
      {
        filename: 'M31_002.fits',
        timestamp: new Date('2024-03-01T20:35:00Z'),
        exposureTime: 300,
        gain: 100,
        temperature: -10,
        filter: 'L',
        quality: {
          hfr: 2.3,
          snr: 42,
          stars: 1180,
          background: 1250,
          noise: 16
        }
      }
    ],
    statistics: {
      totalFrames: 48,
      acceptedFrames: 45,
      rejectedFrames: 3,
      totalIntegration: 225, // minutes
      averageHFR: 2.2,
      averageSNR: 43.5,
      guideRMS: 0.8,
      driftRate: 0.2
    },
    issues: [
      {
        type: 'tracking',
        severity: 'low',
        description: 'Minor tracking drift detected',
        timestamp: new Date('2024-03-01T22:15:00Z'),
        resolved: true
      }
    ],
    notes: 'Good session overall, slight tracking issues in the middle'
  },
  {
    id: 'session2',
    date: new Date('2024-03-05T21:00:00Z'),
    duration: 180, // 3 hours
    target: {
      id: 'M42',
      name: 'Orion Nebula',
      type: 'nebula',
      coordinates: { ra: 83.8221, dec: -5.3911 },
      magnitude: 4.0
    },
    equipment: mockEquipment,
    conditions: {
      temperature: 8,
      humidity: 60,
      windSpeed: 12,
      cloudCover: 30,
      seeing: 4.2,
      transparency: 6,
      moonPhase: 0.75
    },
    images: [
      {
        filename: 'M42_001.fits',
        timestamp: new Date('2024-03-05T21:30:00Z'),
        exposureTime: 180,
        gain: 120,
        temperature: -15,
        filter: 'Ha',
        quality: {
          hfr: 2.8,
          snr: 38,
          stars: 890,
          background: 1800,
          noise: 22
        }
      }
    ],
    statistics: {
      totalFrames: 36,
      acceptedFrames: 28,
      rejectedFrames: 8,
      totalIntegration: 84, // minutes
      averageHFR: 2.8,
      averageSNR: 38,
      guideRMS: 1.2,
      driftRate: 0.5
    },
    issues: [
      {
        type: 'weather',
        severity: 'medium',
        description: 'Clouds caused frame rejection',
        timestamp: new Date('2024-03-05T22:30:00Z'),
        resolved: false
      }
    ],
    notes: 'Challenging conditions, many frames rejected due to clouds'
  }
];

describe('SessionAnalyzer', () => {
  let analyzer: SessionAnalyzer;

  beforeEach(() => {
    analyzer = new SessionAnalyzer();
  });

  describe('analyzeSession', () => {
    it('should analyze a single session correctly', () => {
      const analysis = analyzer.analyzeSession(mockSessions[0]);

      expect(analysis).toHaveProperty('sessionId', 'session1');
      expect(analysis).toHaveProperty('overallScore');
      expect(analysis).toHaveProperty('metrics');
      expect(analysis).toHaveProperty('insights');
      expect(analysis).toHaveProperty('recommendations');

      expect(analysis.overallScore).toBeGreaterThan(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
      expect(analysis.insights.length).toBeGreaterThan(0);
    });

    it('should calculate correct efficiency metrics', () => {
      const analysis = analyzer.analyzeSession(mockSessions[0]);

      expect(analysis.metrics.efficiency).toBeCloseTo(93.75, 1); // 45/48 * 100
      expect(analysis.metrics.integrationTime).toBe(225);
      expect(analysis.metrics.frameAcceptanceRate).toBeCloseTo(93.75, 1);
    });

    it('should identify quality issues', () => {
      const poorSession = {
        ...mockSessions[0],
        statistics: {
          ...mockSessions[0].statistics,
          averageHFR: 4.5, // Poor focus
          averageSNR: 20,  // Low SNR
          guideRMS: 2.5    // Poor guiding
        }
      };

      const analysis = analyzer.analyzeSession(poorSession);

      expect(analysis.overallScore).toBeLessThan(60);
      expect(analysis.insights.some((i: any) => i.type === 'quality')).toBe(true);
    });

    it('should handle sessions with no images', () => {
      const emptySession = {
        ...mockSessions[0],
        images: [],
        statistics: {
          ...mockSessions[0].statistics,
          totalFrames: 0,
          acceptedFrames: 0
        }
      };

      const analysis = analyzer.analyzeSession(emptySession);

      expect(analysis.overallScore).toBe(0);
      expect(analysis.metrics.efficiency).toBe(0);
    });
  });

  describe('analyzeTrends', () => {
    it('should identify improvement trends', () => {
      const improvingSessions = [
        {
          ...mockSessions[0],
          statistics: {
            totalFrames: mockSessions[0].statistics!.totalFrames,
            acceptedFrames: mockSessions[0].statistics!.acceptedFrames,
            rejectedFrames: mockSessions[0].statistics!.rejectedFrames,
            totalIntegration: mockSessions[0].statistics!.totalIntegration,
            averageHFR: 3.0,
            averageSNR: 30,
            guideRMS: mockSessions[0].statistics!.guideRMS,
            driftRate: mockSessions[0].statistics!.driftRate
          }
        },
        {
          ...mockSessions[1],
          statistics: {
            totalFrames: mockSessions[1].statistics!.totalFrames,
            acceptedFrames: mockSessions[1].statistics!.acceptedFrames,
            rejectedFrames: mockSessions[1].statistics!.rejectedFrames,
            totalIntegration: mockSessions[1].statistics!.totalIntegration,
            averageHFR: 2.5,
            averageSNR: 35,
            guideRMS: mockSessions[1].statistics!.guideRMS,
            driftRate: mockSessions[1].statistics!.driftRate
          }
        },
        {
          ...mockSessions[0],
          id: 'session3',
          date: new Date('2024-03-10T20:00:00Z'),
          statistics: {
            totalFrames: mockSessions[0].statistics!.totalFrames,
            acceptedFrames: mockSessions[0].statistics!.acceptedFrames,
            rejectedFrames: mockSessions[0].statistics!.rejectedFrames,
            totalIntegration: mockSessions[0].statistics!.totalIntegration,
            averageHFR: 2.0,
            averageSNR: 40,
            guideRMS: mockSessions[0].statistics!.guideRMS,
            driftRate: mockSessions[0].statistics!.driftRate
          }
        }
      ];

      const trends = analyzer.analyzeTrends(improvingSessions);

      expect(trends.hfrTrend).toBe('improving');
      expect(trends.snrTrend).toBe('improving');
      expect(trends.overallTrend).toBe('improving');
    });

    it('should identify declining trends', () => {
      const decliningSession = [
        {
          ...mockSessions[0],
          statistics: {
            totalFrames: mockSessions[0].statistics!.totalFrames,
            acceptedFrames: mockSessions[0].statistics!.acceptedFrames,
            rejectedFrames: mockSessions[0].statistics!.rejectedFrames,
            totalIntegration: mockSessions[0].statistics!.totalIntegration,
            averageHFR: 2.0,
            averageSNR: 50,
            guideRMS: mockSessions[0].statistics!.guideRMS,
            driftRate: mockSessions[0].statistics!.driftRate
          }
        },
        {
          ...mockSessions[1],
          statistics: {
            totalFrames: mockSessions[1].statistics!.totalFrames,
            acceptedFrames: mockSessions[1].statistics!.acceptedFrames,
            rejectedFrames: mockSessions[1].statistics!.rejectedFrames,
            totalIntegration: mockSessions[1].statistics!.totalIntegration,
            averageHFR: 2.5,
            averageSNR: 45,
            guideRMS: mockSessions[1].statistics!.guideRMS,
            driftRate: mockSessions[1].statistics!.driftRate
          }
        },
        {
          ...mockSessions[0],
          id: 'session3',
          date: new Date('2024-03-10T20:00:00Z'),
          statistics: {
            totalFrames: mockSessions[0].statistics!.totalFrames,
            acceptedFrames: mockSessions[0].statistics!.acceptedFrames,
            rejectedFrames: mockSessions[0].statistics!.rejectedFrames,
            totalIntegration: mockSessions[0].statistics!.totalIntegration,
            averageHFR: 3.0,
            averageSNR: 40,
            guideRMS: mockSessions[0].statistics!.guideRMS,
            driftRate: mockSessions[0].statistics!.driftRate
          }
        }
      ];

      const trends = analyzer.analyzeTrends(decliningSession);

      expect(trends.hfrTrend).toBe('declining');
      expect(trends.snrTrend).toBe('declining');
    });

    it('should handle insufficient data for trends', () => {
      const trends = analyzer.analyzeTrends([mockSessions[0]]);

      expect(trends.hfrTrend).toBe('stable');
      expect(trends.snrTrend).toBe('stable');
      expect(trends.overallTrend).toBe('stable');
    });
  });

  describe('generateInsights', () => {
    it('should generate equipment performance insights', () => {
      const insights = analyzer.generateInsights(mockSessions);

      const equipmentInsight = insights.find(i => i.type === 'equipment');
      expect(equipmentInsight).toBeDefined();
      expect(equipmentInsight?.title).toContain('Equipment Performance');
    });

    it('should generate weather correlation insights', () => {
      const insights = analyzer.generateInsights(mockSessions);

      const weatherInsight = insights.find(i => i.type === 'weather');
      expect(weatherInsight).toBeDefined();
      expect(weatherInsight?.description).toContain('weather');
    });

    it('should generate target-specific insights', () => {
      const insights = analyzer.generateInsights(mockSessions);

      const targetInsight = insights.find(i => i.type === 'target');
      expect(targetInsight).toBeDefined();
    });

    it('should prioritize insights by impact', () => {
      const insights = analyzer.generateInsights(mockSessions);

      // Should be sorted by impact (high to low)
      for (let i = 1; i < insights.length; i++) {
        const prevImpact = insights[i - 1].impact === 'high' ? 3 : insights[i - 1].impact === 'medium' ? 2 : 1;
        const currImpact = insights[i].impact === 'high' ? 3 : insights[i].impact === 'medium' ? 2 : 1;
        expect(prevImpact).toBeGreaterThanOrEqual(currImpact);
      }
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate comprehensive metrics', () => {
      const metrics = analyzer.calculateMetrics(mockSessions);

      expect(metrics).toHaveProperty('totalSessions', 2);
      expect(metrics).toHaveProperty('totalImagingTime');
      expect(metrics).toHaveProperty('averageSessionDuration');
      expect(metrics).toHaveProperty('totalFrames');
      expect(metrics).toHaveProperty('averageHFR');
      expect(metrics).toHaveProperty('averageSNR');
      expect(metrics).toHaveProperty('equipmentUsage');
      expect(metrics).toHaveProperty('targetTypes');
    });

    it('should calculate correct averages', () => {
      const metrics = analyzer.calculateMetrics(mockSessions);

      expect(metrics.averageSessionDuration).toBe(210); // (240 + 180) / 2
      expect(metrics.totalFrames).toBe(84); // 48 + 36
      expect(metrics.averageHFR).toBeCloseTo(2.5, 1); // (2.2 + 2.8) / 2
    });

    it('should track equipment usage', () => {
      const metrics = analyzer.calculateMetrics(mockSessions);

      expect(metrics.equipmentUsage).toHaveProperty('Test Setup', 2);
    });

    it('should categorize target types', () => {
      const metrics = analyzer.calculateMetrics(mockSessions);

      expect(metrics.targetTypes).toHaveProperty('galaxy', 1);
      expect(metrics.targetTypes).toHaveProperty('nebula', 1);
    });
  });

  describe('identifyPatterns', () => {
    it('should identify seasonal patterns', () => {
      const winterSessions = [
        { ...mockSessions[0], date: new Date('2024-01-15T20:00:00Z') },
        { ...mockSessions[1], date: new Date('2024-01-20T20:00:00Z') },
        { ...mockSessions[0], date: new Date('2024-02-10T20:00:00Z') }
      ];

      const patterns = analyzer.identifyPatterns(winterSessions);

      expect(patterns.seasonal).toHaveProperty('winter');
      expect(patterns.seasonal.winter.sessions).toBe(3);
    });

    it('should identify weather impact patterns', () => {
      const patterns = analyzer.identifyPatterns(mockSessions);

      expect(patterns.weather).toHaveProperty('cloudCover');
      expect(patterns.weather).toHaveProperty('seeing');
      expect(patterns.weather).toHaveProperty('transparency');
    });

    it('should identify equipment performance patterns', () => {
      const patterns = analyzer.identifyPatterns(mockSessions);

      expect(patterns.equipment).toHaveProperty('Test Setup');
      expect(patterns.equipment['Test Setup']).toHaveProperty('averageHFR');
      expect(patterns.equipment['Test Setup']).toHaveProperty('averageSNR');
    });

    it('should identify time-based patterns', () => {
      const patterns = analyzer.identifyPatterns(mockSessions);

      expect(patterns.temporal).toHaveProperty('hourly');
      expect(patterns.temporal).toHaveProperty('monthly');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate equipment recommendations', () => {
      const poorFocusSession = {
        ...mockSessions[0],
        statistics: { ...mockSessions[0].statistics, averageHFR: 4.0 }
      };

      const recommendations = analyzer.generateRecommendations([poorFocusSession]);

      const focusRec = recommendations.find(r => r.category === 'equipment' && r.title.includes('focus'));
      expect(focusRec).toBeDefined();
      expect(focusRec?.priority).toBe('high');
    });

    it('should generate technique recommendations', () => {
      const lowSNRSession = {
        ...mockSessions[0],
        statistics: { ...mockSessions[0].statistics, averageSNR: 25 }
      };

      const recommendations = analyzer.generateRecommendations([lowSNRSession]);

      const snrRec = recommendations.find(r => r.category === 'technique');
      expect(snrRec).toBeDefined();
    });

    it('should generate weather-based recommendations', () => {
      const recommendations = analyzer.generateRecommendations(mockSessions);

      const weatherRec = recommendations.find(r => r.category === 'planning');
      expect(weatherRec).toBeDefined();
    });

    it('should prioritize recommendations correctly', () => {
      const recommendations = analyzer.generateRecommendations(mockSessions);

      // Should be sorted by priority (high to low)
      const priorities = recommendations.map(r => r.priority);
      const priorityValues = priorities.map(p => p === 'high' ? 3 : p === 'medium' ? 2 : 1);
      
      for (let i = 1; i < priorityValues.length; i++) {
        expect(priorityValues[i - 1]).toBeGreaterThanOrEqual(priorityValues[i]);
      }
    });
  });

  describe('compareEquipment', () => {
    it('should compare equipment performance', () => {
      const equipment1Sessions = [mockSessions[0]];
      const equipment2Sessions = [
        {
          ...mockSessions[1],
          equipment: {
            ...mockEquipment,
            id: 'eq2',
            name: 'Setup 2'
          }
        }
      ];

      const comparison = analyzer.compareEquipment(
        'Test Setup',
        equipment1Sessions,
        'Setup 2',
        equipment2Sessions
      );

      expect(comparison).toHaveProperty('equipment1', 'Test Setup');
      expect(comparison).toHaveProperty('equipment2', 'Setup 2');
      expect(comparison).toHaveProperty('metrics');
      expect(comparison).toHaveProperty('winner');
    });

    it('should identify performance differences', () => {
      const betterEquipmentSessions = [
        {
          ...mockSessions[0],
          statistics: { ...mockSessions[0].statistics, averageHFR: 1.8, averageSNR: 55 }
        }
      ];

      const comparison = analyzer.compareEquipment(
        'Better Setup',
        betterEquipmentSessions,
        'Test Setup',
        [mockSessions[1]]
      );

      expect(comparison.winner).toBe('Better Setup');
      expect(comparison.metrics.hfr.better).toBe('Better Setup');
      expect(comparison.metrics.snr.better).toBe('Better Setup');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty session list', () => {
      const metrics = analyzer.calculateMetrics([]);
      const insights = analyzer.generateInsights([]);
      const patterns = analyzer.identifyPatterns([]);

      expect(metrics.totalSessions).toBe(0);
      expect(insights).toHaveLength(0);
      expect(patterns.seasonal).toEqual({});
    });

    it('should handle sessions with missing data', () => {
      const incompleteSession = {
        ...mockSessions[0],
        images: [],
        statistics: {
          totalFrames: 0,
          acceptedFrames: 0,
          rejectedFrames: 0,
          totalIntegration: 0,
          averageHFR: 0,
          averageSNR: 0,
          guideRMS: 0,
          driftRate: 0
        }
      };

      const analysis = analyzer.analyzeSession(incompleteSession);

      expect(analysis.overallScore).toBe(0);
      expect(analysis.metrics.efficiency).toBe(0);
    });

    it('should handle invalid numeric values', () => {
      const invalidSession = {
        ...mockSessions[0],
        statistics: {
          ...mockSessions[0].statistics,
          averageHFR: NaN,
          averageSNR: Infinity,
          guideRMS: -1
        }
      };

      const analysis = analyzer.analyzeSession(invalidSession);

      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle extreme date ranges', () => {
      const futureSessions = [
        {
          ...mockSessions[0],
          date: new Date('2030-01-01T00:00:00Z')
        }
      ];

      const patterns = analyzer.identifyPatterns(futureSessions);

      expect(patterns).toHaveProperty('seasonal');
      expect(patterns).toHaveProperty('temporal');
    });

    it('should handle very large datasets efficiently', () => {
      const largeSessions = Array.from({ length: 1000 }, (_, i) => ({
        ...mockSessions[0],
        id: `session${i}`,
        date: new Date(2024, 0, 1 + i)
      }));

      const startTime = Date.now();
      const metrics = analyzer.calculateMetrics(largeSessions);
      const endTime = Date.now();

      expect(metrics.totalSessions).toBe(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
