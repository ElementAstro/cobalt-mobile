import { PredictiveMaintenanceAnalyzer as PredictiveAnalyzer, EquipmentHealthData as EquipmentData, MaintenanceRecommendation, HealthMetrics, AnomalyDetection } from '../../lib/maintenance/predictive-analyzer';

// Mock data
const mockEquipmentData: EquipmentData[] = [
  {
    id: 'eq1',
    name: 'Main Telescope',
    type: 'telescope',
    installDate: new Date('2020-01-01T00:00:00Z'),
    lastMaintenance: new Date('2024-01-01T00:00:00Z'),
    usageHours: 2500,
    metrics: {
      temperature: 15.5,
      humidity: 45,
      vibration: 0.02,
      power: 120,
      efficiency: 95.2,
      errorRate: 0.001
    },
    history: [
      {
        timestamp: new Date('2024-03-01T00:00:00Z'),
        metrics: {
          temperature: 15.0,
          humidity: 42,
          vibration: 0.018,
          power: 118,
          efficiency: 95.5,
          errorRate: 0.0008
        },
        events: []
      },
      {
        timestamp: new Date('2024-02-01T00:00:00Z'),
        metrics: {
          temperature: 14.8,
          humidity: 40,
          vibration: 0.015,
          power: 115,
          efficiency: 96.0,
          errorRate: 0.0005
        },
        events: []
      }
    ],
    specifications: {
      operatingTempRange: [-10, 40],
      maxHumidity: 80,
      maxVibration: 0.1,
      ratedPower: 150,
      expectedLifespan: 15 // years
    },
    maintenanceSchedule: {
      daily: ['visual_inspection'],
      weekly: ['cleaning'],
      monthly: ['calibration'],
      yearly: ['deep_maintenance']
    }
  },
  {
    id: 'eq2',
    name: 'Primary Camera',
    type: 'camera',
    installDate: new Date('2021-06-01T00:00:00Z'),
    lastMaintenance: new Date('2024-02-15T00:00:00Z'),
    usageHours: 1800,
    metrics: {
      temperature: -10.2,
      humidity: 35,
      vibration: 0.005,
      power: 45,
      efficiency: 92.8,
      errorRate: 0.002
    },
    history: [
      {
        timestamp: new Date('2024-03-01T00:00:00Z'),
        metrics: {
          temperature: -10.5,
          humidity: 33,
          vibration: 0.004,
          power: 44,
          efficiency: 93.2,
          errorRate: 0.0015
        },
        events: ['cooling_cycle_completed']
      }
    ],
    specifications: {
      operatingTempRange: [-20, 5],
      maxHumidity: 60,
      maxVibration: 0.02,
      ratedPower: 50,
      expectedLifespan: 10
    },
    maintenanceSchedule: {
      daily: ['temperature_check'],
      weekly: ['sensor_cleaning'],
      monthly: ['calibration', 'dark_frame_update'],
      yearly: ['sensor_inspection']
    }
  }
];

describe('PredictiveAnalyzer', () => {
  let analyzer: PredictiveAnalyzer;

  beforeEach(() => {
    analyzer = new PredictiveAnalyzer();
  });

  describe('Health Assessment', () => {
    it('should calculate equipment health metrics', () => {
      const health = analyzer.assessEquipmentHealth(mockEquipmentData[0]);

      expect(health.overallScore).toBeGreaterThan(0);
      expect(health.overallScore).toBeLessThanOrEqual(100);
      expect(health.components).toHaveProperty('temperature');
      expect(health.components).toHaveProperty('power');
      expect(health.components).toHaveProperty('efficiency');
      expect(health.riskLevel).toMatch(/^(low|medium|high|critical)$/);
    });

    it('should identify healthy equipment', () => {
      const health = analyzer.assessEquipmentHealth(mockEquipmentData[0]);

      expect(health.overallScore).toBeGreaterThan(80);
      expect(health.riskLevel).toBe('low');
      expect(health.issues).toHaveLength(0);
    });

    it('should detect equipment issues', () => {
      const problematicEquipment = {
        ...mockEquipmentData[0],
        metrics: {
          ...mockEquipmentData[0].metrics,
          temperature: 45, // Above operating range
          efficiency: 70,  // Low efficiency
          errorRate: 0.05  // High error rate
        }
      };

      const health = analyzer.assessEquipmentHealth(problematicEquipment);

      expect(health.overallScore).toBeLessThan(60);
      expect(health.riskLevel).toMatch(/^(medium|high|critical)$/);
      expect(health.issues.length).toBeGreaterThan(0);
    });

    it('should handle missing specifications gracefully', () => {
      const equipmentWithoutSpecs = {
        ...mockEquipmentData[0],
        specifications: {}
      };

      const health = analyzer.assessEquipmentHealth(equipmentWithoutSpecs);

      expect(health.overallScore).toBeGreaterThan(0);
      expect(health.components).toBeDefined();
    });

    it('should calculate component-specific scores', () => {
      const health = analyzer.assessEquipmentHealth(mockEquipmentData[0]);

      expect(health.components.temperature).toBeGreaterThan(0);
      expect(health.components.temperature).toBeLessThanOrEqual(100);
      expect(health.components.power).toBeGreaterThan(0);
      expect(health.components.efficiency).toBeGreaterThan(0);
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect temperature anomalies', () => {
      const anomalies = analyzer.detectAnomalies(mockEquipmentData[0]);

      // Normal equipment should have no anomalies
      expect(anomalies.filter(a => a.type === 'temperature')).toHaveLength(0);
    });

    it('should detect power consumption anomalies', () => {
      const highPowerEquipment = {
        ...mockEquipmentData[0],
        metrics: {
          ...mockEquipmentData[0].metrics,
          power: 200 // Significantly above rated power
        }
      };

      const anomalies = analyzer.detectAnomalies(highPowerEquipment);

      const powerAnomalies = anomalies.filter(a => a.type === 'power');
      expect(powerAnomalies.length).toBeGreaterThan(0);
      expect(powerAnomalies[0].severity).toMatch(/^(low|medium|high|critical)$/);
    });

    it('should detect efficiency degradation', () => {
      const degradedEquipment = {
        ...mockEquipmentData[0],
        history: [
          {
            timestamp: new Date('2024-03-01T00:00:00Z'),
            metrics: { ...mockEquipmentData[0].metrics, efficiency: 85 },
            events: []
          },
          {
            timestamp: new Date('2024-02-01T00:00:00Z'),
            metrics: { ...mockEquipmentData[0].metrics, efficiency: 90 },
            events: []
          },
          {
            timestamp: new Date('2024-01-01T00:00:00Z'),
            metrics: { ...mockEquipmentData[0].metrics, efficiency: 95 },
            events: []
          }
        ]
      };

      const anomalies = analyzer.detectAnomalies(degradedEquipment);

      const efficiencyAnomalies = anomalies.filter(a => a.type === 'efficiency');
      expect(efficiencyAnomalies.length).toBeGreaterThan(0);
    });

    it('should detect vibration anomalies', () => {
      const vibrationEquipment = {
        ...mockEquipmentData[0],
        metrics: {
          ...mockEquipmentData[0].metrics,
          vibration: 0.08 // Close to maximum
        }
      };

      const anomalies = analyzer.detectAnomalies(vibrationEquipment);

      const vibrationAnomalies = anomalies.filter(a => a.type === 'vibration');
      expect(vibrationAnomalies.length).toBeGreaterThan(0);
      expect(vibrationAnomalies[0].severity).toBe('medium');
    });

    it('should calculate anomaly confidence scores', () => {
      const criticalEquipment = {
        ...mockEquipmentData[0],
        metrics: {
          ...mockEquipmentData[0].metrics,
          temperature: 50, // Way above range
          errorRate: 0.1   // Very high error rate
        }
      };

      const anomalies = analyzer.detectAnomalies(criticalEquipment);

      anomalies.forEach(anomaly => {
        expect(anomaly.confidence).toBeGreaterThan(0);
        expect(anomaly.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Predictive Modeling', () => {
    it('should predict equipment lifespan', () => {
      const prediction = analyzer.predictLifespan(mockEquipmentData[0]);

      expect(prediction.remainingYears).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
      expect(prediction.factors).toBeDefined();
    });

    it('should predict failure probability', () => {
      const failurePrediction = analyzer.predictFailureProbability(mockEquipmentData[0], 30); // 30 days

      expect(failurePrediction.probability).toBeGreaterThanOrEqual(0);
      expect(failurePrediction.probability).toBeLessThanOrEqual(1);
      expect(failurePrediction.riskFactors).toBeDefined();
    });

    it('should identify high-risk equipment', () => {
      const oldEquipment = {
        ...mockEquipmentData[0],
        installDate: new Date('2010-01-01T00:00:00Z'), // 14 years old
        usageHours: 12000, // High usage
        metrics: {
          ...mockEquipmentData[0].metrics,
          efficiency: 75, // Degraded efficiency
          errorRate: 0.01 // Higher error rate
        }
      };

      const failurePrediction = analyzer.predictFailureProbability(oldEquipment, 90);

      expect(failurePrediction.probability).toBeGreaterThan(0.1);
      expect(failurePrediction.riskFactors.length).toBeGreaterThan(0);
    });

    it('should consider usage patterns in predictions', () => {
      const heavyUsageEquipment = {
        ...mockEquipmentData[0],
        usageHours: 8000 // Very high usage
      };

      const normalPrediction = analyzer.predictLifespan(mockEquipmentData[0]);
      const heavyUsagePrediction = analyzer.predictLifespan(heavyUsageEquipment);

      expect(heavyUsagePrediction.remainingYears).toBeLessThan(normalPrediction.remainingYears);
    });

    it('should factor in maintenance history', () => {
      const wellMaintainedEquipment = {
        ...mockEquipmentData[0],
        lastMaintenance: new Date('2024-03-01T00:00:00Z') // Recent maintenance
      };

      const poorlyMaintainedEquipment = {
        ...mockEquipmentData[0],
        lastMaintenance: new Date('2022-01-01T00:00:00Z') // Old maintenance
      };

      const wellMaintainedPrediction = analyzer.predictLifespan(wellMaintainedEquipment);
      const poorlyMaintainedPrediction = analyzer.predictLifespan(poorlyMaintainedEquipment);

      expect(wellMaintainedPrediction.remainingYears).toBeGreaterThan(poorlyMaintainedPrediction.remainingYears);
    });
  });

  describe('Maintenance Recommendations', () => {
    it('should generate maintenance recommendations', () => {
      const recommendations = analyzer.generateMaintenanceRecommendations(mockEquipmentData[0]);

      expect(recommendations).toBeInstanceOf(Array);
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('equipmentId');
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('estimatedDuration');
      });
    });

    it('should prioritize critical maintenance', () => {
      const criticalEquipment = {
        ...mockEquipmentData[0],
        metrics: {
          ...mockEquipmentData[0].metrics,
          temperature: 45, // Critical temperature
          errorRate: 0.05  // High error rate
        }
      };

      const recommendations = analyzer.generateMaintenanceRecommendations(criticalEquipment);

      const criticalRecs = recommendations.filter(r => r.priority === 'critical');
      expect(criticalRecs.length).toBeGreaterThan(0);
    });

    it('should suggest preventive maintenance', () => {
      const recommendations = analyzer.generateMaintenanceRecommendations(mockEquipmentData[0]);

      const preventiveRecs = recommendations.filter(r => r.type === 'preventive');
      expect(preventiveRecs.length).toBeGreaterThan(0);
    });

    it('should include cost estimates', () => {
      const recommendations = analyzer.generateMaintenanceRecommendations(mockEquipmentData[0]);

      recommendations.forEach(rec => {
        expect(rec.estimatedCost).toBeGreaterThan(0);
      });
    });

    it('should consider equipment age in recommendations', () => {
      const newEquipment = {
        ...mockEquipmentData[0],
        installDate: new Date('2023-01-01T00:00:00Z') // 1 year old
      };

      const oldEquipment = {
        ...mockEquipmentData[0],
        installDate: new Date('2015-01-01T00:00:00Z') // 9 years old
      };

      const newRecs = analyzer.generateMaintenanceRecommendations(newEquipment);
      const oldRecs = analyzer.generateMaintenanceRecommendations(oldEquipment);

      // Old equipment should have more recommendations
      expect(oldRecs.length).toBeGreaterThanOrEqual(newRecs.length);
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze performance trends', () => {
      const trends = analyzer.analyzeTrends(mockEquipmentData[0]);

      expect(trends).toHaveProperty('efficiency');
      expect(trends).toHaveProperty('temperature');
      expect(trends).toHaveProperty('power');
      expect(trends).toHaveProperty('errorRate');

      Object.values(trends).forEach(trend => {
        expect(trend).toMatch(/^(improving|stable|declining)$/);
      });
    });

    it('should detect declining trends', () => {
      const decliningEquipment = {
        ...mockEquipmentData[0],
        history: [
          {
            timestamp: new Date('2024-03-01T00:00:00Z'),
            metrics: { ...mockEquipmentData[0].metrics, efficiency: 85 },
            events: []
          },
          {
            timestamp: new Date('2024-02-01T00:00:00Z'),
            metrics: { ...mockEquipmentData[0].metrics, efficiency: 90 },
            events: []
          },
          {
            timestamp: new Date('2024-01-01T00:00:00Z'),
            metrics: { ...mockEquipmentData[0].metrics, efficiency: 95 },
            events: []
          }
        ]
      };

      const trends = analyzer.analyzeTrends(decliningEquipment);

      expect(trends.efficiency).toBe('declining');
    });

    it('should detect improving trends', () => {
      const improvingEquipment = {
        ...mockEquipmentData[0],
        history: [
          {
            timestamp: new Date('2024-03-01T00:00:00Z'),
            metrics: { ...mockEquipmentData[0].metrics, efficiency: 95 },
            events: []
          },
          {
            timestamp: new Date('2024-02-01T00:00:00Z'),
            metrics: { ...mockEquipmentData[0].metrics, efficiency: 90 },
            events: []
          },
          {
            timestamp: new Date('2024-01-01T00:00:00Z'),
            metrics: { ...mockEquipmentData[0].metrics, efficiency: 85 },
            events: []
          }
        ]
      };

      const trends = analyzer.analyzeTrends(improvingEquipment);

      expect(trends.efficiency).toBe('improving');
    });

    it('should handle insufficient data for trends', () => {
      const limitedHistoryEquipment = {
        ...mockEquipmentData[0],
        history: [
          {
            timestamp: new Date('2024-03-01T00:00:00Z'),
            metrics: mockEquipmentData[0].metrics,
            events: []
          }
        ]
      };

      const trends = analyzer.analyzeTrends(limitedHistoryEquipment);

      Object.values(trends).forEach(trend => {
        expect(trend).toBe('stable');
      });
    });
  });

  describe('Fleet Analysis', () => {
    it('should analyze entire equipment fleet', () => {
      const fleetAnalysis = analyzer.analyzeFleet(mockEquipmentData);

      expect(fleetAnalysis).toHaveProperty('overallHealth');
      expect(fleetAnalysis).toHaveProperty('riskDistribution');
      expect(fleetAnalysis).toHaveProperty('maintenanceBacklog');
      expect(fleetAnalysis).toHaveProperty('costProjections');
    });

    it('should identify fleet-wide issues', () => {
      const problematicFleet = mockEquipmentData.map(eq => ({
        ...eq,
        metrics: {
          ...eq.metrics,
          efficiency: 70 // All equipment has low efficiency
        }
      }));

      const fleetAnalysis = analyzer.analyzeFleet(problematicFleet);

      expect(fleetAnalysis.overallHealth).toBeLessThan(80);
      expect(fleetAnalysis.riskDistribution.high).toBeGreaterThan(0);
    });

    it('should calculate maintenance costs', () => {
      const fleetAnalysis = analyzer.analyzeFleet(mockEquipmentData);

      expect(fleetAnalysis.costProjections.monthly).toBeGreaterThan(0);
      expect(fleetAnalysis.costProjections.yearly).toBeGreaterThan(fleetAnalysis.costProjections.monthly);
    });

    it('should prioritize fleet maintenance', () => {
      const fleetAnalysis = analyzer.analyzeFleet(mockEquipmentData);

      expect(fleetAnalysis.maintenanceBacklog).toBeInstanceOf(Array);
      
      // Should be sorted by priority
      for (let i = 1; i < fleetAnalysis.maintenanceBacklog.length; i++) {
        const prevPriority = fleetAnalysis.maintenanceBacklog[i - 1].priority;
        const currPriority = fleetAnalysis.maintenanceBacklog[i].priority;
        
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        expect(priorityOrder[prevPriority]).toBeGreaterThanOrEqual(priorityOrder[currPriority]);
      }
    });
  });

  describe('Machine Learning Integration', () => {
    it('should learn from historical data', () => {
      const learningResult = analyzer.trainModel(mockEquipmentData);

      expect(learningResult.accuracy).toBeGreaterThan(0);
      expect(learningResult.accuracy).toBeLessThanOrEqual(1);
      expect(learningResult.features).toBeInstanceOf(Array);
    });

    it('should improve predictions with more data', () => {
      const limitedData = [mockEquipmentData[0]];
      const fullData = mockEquipmentData;

      const limitedAccuracy = analyzer.trainModel(limitedData).accuracy;
      const fullAccuracy = analyzer.trainModel(fullData).accuracy;

      expect(fullAccuracy).toBeGreaterThanOrEqual(limitedAccuracy);
    });

    it('should identify important features', () => {
      const learningResult = analyzer.trainModel(mockEquipmentData);

      expect(learningResult.features).toContain('efficiency');
      expect(learningResult.features).toContain('temperature');
      expect(learningResult.features).toContain('usageHours');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle equipment with no history', () => {
      const noHistoryEquipment = {
        ...mockEquipmentData[0],
        history: []
      };

      const health = analyzer.assessEquipmentHealth(noHistoryEquipment);
      const anomalies = analyzer.detectAnomalies(noHistoryEquipment);

      expect(health.overallScore).toBeGreaterThan(0);
      expect(anomalies).toBeInstanceOf(Array);
    });

    it('should handle invalid metric values', () => {
      const invalidEquipment = {
        ...mockEquipmentData[0],
        metrics: {
          temperature: NaN,
          humidity: -1,
          vibration: Infinity,
          power: null,
          efficiency: 150, // > 100%
          errorRate: -0.1
        }
      };

      const health = analyzer.assessEquipmentHealth(invalidEquipment);

      expect(health.overallScore).toBeGreaterThanOrEqual(0);
      expect(health.overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle empty equipment list', () => {
      const fleetAnalysis = analyzer.analyzeFleet([]);

      expect(fleetAnalysis.overallHealth).toBe(0);
      expect(fleetAnalysis.riskDistribution.low).toBe(0);
      expect(fleetAnalysis.maintenanceBacklog).toHaveLength(0);
    });

    it('should handle future dates gracefully', () => {
      const futureEquipment = {
        ...mockEquipmentData[0],
        installDate: new Date('2030-01-01T00:00:00Z'),
        lastMaintenance: new Date('2030-01-01T00:00:00Z')
      };

      const health = analyzer.assessEquipmentHealth(futureEquipment);
      const prediction = analyzer.predictLifespan(futureEquipment);

      expect(health.overallScore).toBeGreaterThanOrEqual(0);
      expect(prediction.remainingYears).toBeGreaterThan(0);
    });

    it('should handle extremely old equipment', () => {
      const ancientEquipment = {
        ...mockEquipmentData[0],
        installDate: new Date('1990-01-01T00:00:00Z'),
        usageHours: 50000
      };

      const health = analyzer.assessEquipmentHealth(ancientEquipment);
      const prediction = analyzer.predictLifespan(ancientEquipment);

      expect(health.riskLevel).toMatch(/^(high|critical)$/);
      expect(prediction.remainingYears).toBeLessThan(5);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large equipment fleets efficiently', () => {
      const largeFleet = Array.from({ length: 100 }, (_, i) => ({
        ...mockEquipmentData[0],
        id: `eq${i}`,
        name: `Equipment ${i}`
      }));

      const startTime = Date.now();
      const fleetAnalysis = analyzer.analyzeFleet(largeFleet);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(fleetAnalysis.overallHealth).toBeGreaterThan(0);
    });

    it('should process historical data efficiently', () => {
      const equipmentWithLongHistory = {
        ...mockEquipmentData[0],
        history: Array.from({ length: 1000 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Daily data for ~3 years
          metrics: mockEquipmentData[0].metrics,
          events: []
        }))
      };

      const startTime = Date.now();
      const trends = analyzer.analyzeTrends(equipmentWithLongHistory);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(trends.efficiency).toMatch(/^(improving|stable|declining)$/);
    });
  });
});
