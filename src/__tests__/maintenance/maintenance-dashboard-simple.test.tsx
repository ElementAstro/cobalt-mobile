import React from 'react';
import { render, screen } from '@testing-library/react';
import { MaintenanceDashboard } from '@/components/maintenance/maintenance-dashboard';
import { PredictiveMaintenanceAnalyzer } from '@/lib/maintenance/predictive-analyzer';
import type { EquipmentProfile } from '@/lib/stores/equipment-store';

// Mock the predictive analyzer
jest.mock('@/lib/maintenance/predictive-analyzer');

const mockEquipmentData: EquipmentProfile[] = [
  {
    id: 'profile-1',
    name: 'Main Observatory Setup',
    description: 'Primary telescope configuration',
    equipmentIds: ['eq1', 'eq2'],
    settings: {
      defaultExposure: 300,
      autoGuiding: true,
      dithering: true
    },
    isDefault: true,
    userId: 'user1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-03-01T00:00:00Z')
  },
  {
    id: 'profile-2', 
    name: 'Backup Camera Setup',
    description: 'Secondary camera configuration',
    equipmentIds: ['eq3'],
    settings: {
      defaultExposure: 120,
      autoGuiding: false,
      dithering: false
    },
    isDefault: false,
    userId: 'user1',
    createdAt: new Date('2024-02-01T00:00:00Z'),
    updatedAt: new Date('2024-03-01T00:00:00Z')
  }
];

describe('MaintenanceDashboard', () => {
  let mockAnalyzer: jest.Mocked<PredictiveMaintenanceAnalyzer>;

  beforeEach(() => {
    mockAnalyzer = {
      getEquipmentHealth: jest.fn().mockReturnValue({
        equipmentId: 'test-equipment',
        timestamp: new Date(),
        metrics: {
          temperature: 25,
          humidity: 45,
          vibration: 0.01,
          power: {
            voltage: 12,
            current: 10,
            consumption: 120
          },
          mechanical: {
            tracking: 0.5,
            backlash: 0.1,
            wear: 0.05
          },
          optical: {
            focus: 2.5,
            collimation: 0.95,
            throughput: 0.85
          }
        },
        operatingConditions: {
          ambientTemperature: 20,
          ambientHumidity: 50,
          windSpeed: 2,
          pressure: 1013,
          dewPoint: 10,
          operatingTime: 5,
          totalOperatingTime: 1000,
          cycleCount: 500
        },
        performanceIndicators: {
          imageQuality: 85,
          trackingAccuracy: 0.5,
          focusStability: 90,
          thermalStability: 88,
          mechanicalStability: 92,
          overallHealth: 85
        },
        anomalies: []
      }),
      getMaintenanceRecommendations: jest.fn().mockReturnValue([]),
      getPredictiveModel: jest.fn().mockReturnValue({
        equipmentType: 'camera',
        modelVersion: '1.0',
        accuracy: 85,
        trainingData: {
          samples: 100,
          timeRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
          },
          features: ['temperature', 'usage', 'age']
        },
        predictions: {
          failureProbability: 15,
          timeToFailure: 180,
          confidence: 85,
          factors: [
            {
              factor: 'Temperature',
              impact: 10,
              trend: 'stable',
              description: 'Temperature within normal range'
            }
          ]
        }
      }),
      getEquipmentLifecycle: jest.fn().mockReturnValue({
        currentPhase: 'mature',
        remainingLife: 0.65,
        nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the maintenance dashboard with correct title', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Equipment Maintenance')).toBeInTheDocument();
      expect(screen.getByText('Predictive maintenance and equipment health monitoring')).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByRole('button', { name: /schedule maintenance/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new maintenance/i })).toBeInTheDocument();
    });

    it('should show total equipment count', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Total Equipment')).toBeInTheDocument();
      // Check for the specific card content combination
      const totalEquipmentCard = screen.getByText('Total Equipment').closest('[data-slot="card"]');
      expect(totalEquipmentCard).toContainElement(screen.getAllByText('2')[0]);
    });

    it('should render tabs correctly', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /health status/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /recommendations/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /predictions/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /lifecycle/i })).toBeInTheDocument();
    });

    it('should handle empty equipment data', () => {
      render(<MaintenanceDashboard equipment={[]} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Equipment Maintenance')).toBeInTheDocument();
      // Check for the specific card content combination
      const totalEquipmentCard = screen.getByText('Total Equipment').closest('[data-slot="card"]');
      expect(totalEquipmentCard).toContainElement(screen.getAllByText('0')[0]);
    });
  });
});
