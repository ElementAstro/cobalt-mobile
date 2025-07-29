import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MaintenanceDashboard } from '../../components/maintenance/maintenance-dashboard';
import { PredictiveMaintenanceAnalyzer as PredictiveAnalyzer, EquipmentHealthData as EquipmentData, MaintenanceRecommendation } from '../../lib/maintenance/predictive-analyzer';

// Mock the predictive analyzer
jest.mock('../../lib/maintenance/predictive-analyzer');

const MockedPredictiveAnalyzer = PredictiveAnalyzer as jest.MockedClass<typeof PredictiveAnalyzer>;

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  ),
  Doughnut: ({ data }: any) => (
    <div data-testid="doughnut-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  )
}));

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
    history: [],
    specifications: {
      operatingTempRange: [-10, 40],
      maxHumidity: 80,
      maxVibration: 0.1,
      ratedPower: 150,
      expectedLifespan: 15
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
    history: [],
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
      monthly: ['calibration'],
      yearly: ['sensor_inspection']
    }
  }
];

const mockRecommendations: MaintenanceRecommendation[] = [
  {
    id: 'rec1',
    equipmentId: 'eq1',
    type: 'preventive',
    priority: 'medium',
    title: 'Routine Calibration',
    description: 'Perform monthly calibration to maintain accuracy',
    estimatedDuration: 120,
    estimatedCost: 150,
    dueDate: new Date('2024-04-01T00:00:00Z'),
    parts: ['calibration_kit'],
    skills: ['calibration'],
    created: new Date('2024-03-01T00:00:00Z')
  },
  {
    id: 'rec2',
    equipmentId: 'eq2',
    type: 'corrective',
    priority: 'high',
    title: 'Temperature Sensor Check',
    description: 'Investigate temperature sensor anomaly',
    estimatedDuration: 60,
    estimatedCost: 75,
    dueDate: new Date('2024-03-20T00:00:00Z'),
    parts: ['temperature_sensor'],
    skills: ['electronics'],
    created: new Date('2024-03-15T00:00:00Z')
  }
];

const mockFleetAnalysis = {
  overallHealth: 87.5,
  riskDistribution: {
    low: 1,
    medium: 1,
    high: 0,
    critical: 0
  },
  maintenanceBacklog: mockRecommendations,
  costProjections: {
    monthly: 500,
    yearly: 6000
  }
};

describe('MaintenanceDashboard', () => {
  let mockAnalyzer: jest.Mocked<PredictiveAnalyzer>;

  beforeEach(() => {
    mockAnalyzer = {
      analyzeFleet: jest.fn().mockReturnValue(mockFleetAnalysis),
      assessEquipmentHealth: jest.fn().mockReturnValue({
        overallScore: 85,
        components: {
          temperature: 90,
          power: 85,
          efficiency: 80,
          vibration: 95
        },
        riskLevel: 'low',
        issues: [],
        lastAssessment: new Date()
      }),
      generateMaintenanceRecommendations: jest.fn().mockReturnValue(mockRecommendations),
      detectAnomalies: jest.fn().mockReturnValue([]),
      predictLifespan: jest.fn().mockReturnValue({
        remainingYears: 8.5,
        confidence: 0.85,
        factors: ['usage', 'maintenance_history']
      }),
      analyzeTrends: jest.fn().mockReturnValue({
        efficiency: 'stable',
        temperature: 'stable',
        power: 'improving',
        errorRate: 'declining'
      }),
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
      generateRecommendations: jest.fn().mockReturnValue(mockRecommendations),
      buildPredictiveModel: jest.fn().mockReturnValue({
        accuracy: 0.85,
        features: ['temperature', 'usage', 'age'],
        lastTrained: new Date()
      }),
      analyzeLifecycle: jest.fn().mockReturnValue({
        currentPhase: 'mature',
        remainingLife: 0.65,
        nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }),
      getMaintenanceRecommendations: jest.fn().mockReturnValue(mockRecommendations),
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

    MockedPredictiveAnalyzer.mockImplementation(() => mockAnalyzer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the maintenance dashboard', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Maintenance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Fleet Overview')).toBeInTheDocument();
      expect(screen.getByText('Equipment Health')).toBeInTheDocument();
      expect(screen.getByText('Maintenance Recommendations')).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      mockAnalyzer.analyzeFleet.mockImplementation(() => {
        // Simulate slow analysis
        return new Promise(() => {}) as any;
      });

      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText(/analyzing equipment/i)).toBeInTheDocument();
    });

    it('should handle empty equipment data', () => {
      render(<MaintenanceDashboard equipment={[]} analyzer={mockAnalyzer} />);

      expect(screen.getByText(/no equipment data/i)).toBeInTheDocument();
    });
  });

  describe('Fleet Overview', () => {
    it('should display fleet health metrics', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('87.5%')).toBeInTheDocument(); // Overall health
      expect(screen.getByText('Fleet Health Score')).toBeInTheDocument();
    });

    it('should show risk distribution', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Risk Distribution')).toBeInTheDocument();
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    });

    it('should display cost projections', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Cost Projections')).toBeInTheDocument();
      expect(screen.getByText('$500')).toBeInTheDocument(); // Monthly cost
      expect(screen.getByText('$6,000')).toBeInTheDocument(); // Yearly cost
    });

    it('should show equipment count by status', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('2')).toBeInTheDocument(); // Total equipment
      expect(screen.getByText('Equipment Count')).toBeInTheDocument();
    });
  });

  describe('Equipment Health Display', () => {
    it('should list all equipment with health scores', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Main Telescope')).toBeInTheDocument();
      expect(screen.getByText('Primary Camera')).toBeInTheDocument();
      expect(screen.getAllByText('85%')).toHaveLength(2); // Health scores
    });

    it('should show equipment status indicators', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const healthIndicators = screen.getAllByTestId('health-indicator');
      expect(healthIndicators).toHaveLength(2);
    });

    it('should display equipment details on click', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const telescopeCard = screen.getByText('Main Telescope');
      await user.click(telescopeCard);

      expect(screen.getByText('Equipment Details')).toBeInTheDocument();
      expect(screen.getByText('Temperature: 15.5°C')).toBeInTheDocument();
      expect(screen.getByText('Efficiency: 95.2%')).toBeInTheDocument();
    });

    it('should show component health breakdown', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      await user.click(screen.getByText('Main Telescope'));

      expect(screen.getByText('Component Health')).toBeInTheDocument();
      expect(screen.getByText('Temperature: 90%')).toBeInTheDocument();
      expect(screen.getByText('Power: 85%')).toBeInTheDocument();
      expect(screen.getByText('Efficiency: 80%')).toBeInTheDocument();
    });

    it('should filter equipment by health status', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const filterSelect = screen.getByRole('combobox', { name: /filter by health/i });
      await user.click(filterSelect);
      await user.click(screen.getByText('Good (80-100%)'));

      // Should show both equipment items since they're both healthy
      expect(screen.getByText('Main Telescope')).toBeInTheDocument();
      expect(screen.getByText('Primary Camera')).toBeInTheDocument();
    });

    it('should sort equipment by different criteria', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      await user.click(sortSelect);
      await user.click(screen.getByText('Health Score'));

      // Equipment should be sorted by health score
      const equipmentCards = screen.getAllByTestId('equipment-card');
      expect(equipmentCards).toHaveLength(2);
    });
  });

  describe('Maintenance Recommendations', () => {
    it('should display maintenance recommendations', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Routine Calibration')).toBeInTheDocument();
      expect(screen.getByText('Temperature Sensor Check')).toBeInTheDocument();
    });

    it('should show recommendation priorities', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Medium Priority')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
    });

    it('should display cost and time estimates', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('$150')).toBeInTheDocument(); // Cost estimate
      expect(screen.getByText('2h')).toBeInTheDocument(); // Duration estimate
      expect(screen.getByText('$75')).toBeInTheDocument();
      expect(screen.getByText('1h')).toBeInTheDocument();
    });

    it('should allow marking recommendations as completed', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const completeButton = screen.getAllByRole('button', { name: /mark complete/i })[0];
      await user.click(completeButton);

      expect(screen.getByText(/recommendation completed/i)).toBeInTheDocument();
    });

    it('should allow scheduling maintenance', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const scheduleButton = screen.getAllByRole('button', { name: /schedule/i })[0];
      await user.click(scheduleButton);

      expect(screen.getByText('Schedule Maintenance')).toBeInTheDocument();
      expect(screen.getByLabelText(/scheduled date/i)).toBeInTheDocument();
    });

    it('should filter recommendations by priority', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const priorityFilter = screen.getByRole('combobox', { name: /filter by priority/i });
      await user.click(priorityFilter);
      await user.click(screen.getByText('High'));

      expect(screen.getByText('Temperature Sensor Check')).toBeInTheDocument();
      expect(screen.queryByText('Routine Calibration')).not.toBeInTheDocument();
    });
  });

  describe('Analytics and Charts', () => {
    it('should display health trend charts', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const predictionsTab = screen.getByRole('tab', { name: /predictions/i });
      fireEvent.click(predictionsTab);

      expect(screen.getByText('Predictive Models')).toBeInTheDocument();
    });

    it('should show maintenance cost trends', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      await user.click(screen.getByRole('tab', { name: /predictions/i }));

      expect(screen.getByText('Cost Predictions')).toBeInTheDocument();
    });

    it('should display equipment utilization metrics', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      await user.click(screen.getByRole('tab', { name: /lifecycle/i }));

      expect(screen.getByText('Equipment Lifecycle')).toBeInTheDocument();
    });

    it('should show predictive analytics', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      await user.click(screen.getByRole('tab', { name: /predictions/i }));

      expect(screen.getByText('Predictive Models')).toBeInTheDocument();
    });
  });

  describe('Alerts and Notifications', () => {
    it('should display critical alerts', () => {
      const criticalRecommendation = {
        ...mockRecommendations[0],
        priority: 'critical' as const,
        title: 'Critical System Failure'
      };

      mockAnalyzer.generateMaintenanceRecommendations.mockReturnValue([criticalRecommendation]);

      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Critical Alerts')).toBeInTheDocument();
      expect(screen.getByText('Critical System Failure')).toBeInTheDocument();
    });

    it('should show overdue maintenance warnings', () => {
      const overdueRecommendation = {
        ...mockRecommendations[0],
        dueDate: new Date('2024-02-01T00:00:00Z') // Past due
      };

      mockAnalyzer.generateMaintenanceRecommendations.mockReturnValue([overdueRecommendation]);

      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    });

    it('should highlight equipment requiring immediate attention', () => {
      mockAnalyzer.assessEquipmentHealth.mockReturnValue({
        overallScore: 25, // Critical health
        components: { temperature: 20, power: 30, efficiency: 25, vibration: 30 },
        riskLevel: 'critical',
        issues: ['High temperature', 'Low efficiency'],
        lastAssessment: new Date()
      });

      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Immediate Attention Required')).toBeInTheDocument();
    });
  });

  describe('Export and Reporting', () => {
    it('should allow exporting maintenance reports', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const exportButton = screen.getByRole('button', { name: /export report/i });
      await user.click(exportButton);

      expect(screen.getByText('Export Options')).toBeInTheDocument();
      expect(screen.getByText('PDF Report')).toBeInTheDocument();
      expect(screen.getByText('CSV Data')).toBeInTheDocument();
    });

    it('should generate maintenance schedules', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const scheduleButton = screen.getByRole('button', { name: /generate schedule/i });
      await user.click(scheduleButton);

      expect(screen.getByText('Maintenance Schedule')).toBeInTheDocument();
    });

    it('should allow printing dashboard', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const printButton = screen.getByRole('button', { name: /print/i });
      await user.click(printButton);

      // Should trigger print dialog (mocked)
      expect(window.print).toHaveBeenCalled();
    });
  });

  describe('Settings and Configuration', () => {
    it('should allow customizing dashboard layout', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const settingsButton = screen.getByRole('button', { name: /dashboard settings/i });
      await user.click(settingsButton);

      expect(screen.getByText('Dashboard Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText(/show fleet overview/i)).toBeInTheDocument();
    });

    it('should save user preferences', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      await user.click(screen.getByRole('button', { name: /dashboard settings/i }));

      const autoRefreshToggle = screen.getByLabelText(/auto refresh/i);
      await user.click(autoRefreshToggle);

      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      await user.click(saveButton);

      expect(screen.getByText(/preferences saved/i)).toBeInTheDocument();
    });

    it('should allow setting alert thresholds', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      await user.click(screen.getByRole('button', { name: /dashboard settings/i }));

      const thresholdInput = screen.getByLabelText(/critical health threshold/i);
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '30');

      expect(thresholdInput).toHaveValue(30);
    });
  });

  describe('Real-time Updates', () => {
    it('should refresh data automatically', async () => {
      jest.useFakeTimers();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      // Fast-forward time to trigger auto-refresh
      jest.advanceTimersByTime(60000); // 1 minute

      await waitFor(() => {
        expect(mockAnalyzer.analyzeFleet).toHaveBeenCalledTimes(2); // Initial + refresh
      });

      jest.useRealTimers();
    });

    it('should show last updated timestamp', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText(/last updated/i)).toBeInTheDocument();
    });

    it('should allow manual refresh', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(mockAnalyzer.analyzeFleet).toHaveBeenCalledTimes(2); // Initial + manual refresh
    });
  });

  describe('Error Handling', () => {
    it('should handle analyzer errors gracefully', () => {
      mockAnalyzer.analyzeFleet.mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText(/error analyzing equipment/i)).toBeInTheDocument();
    });

    it('should show retry option on errors', async () => {
      const user = userEvent.setup();
      
      mockAnalyzer.analyzeFleet.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByText(/error analyzing equipment/i)).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      // Mock successful retry
      mockAnalyzer.analyzeFleet.mockReturnValue(mockFleetAnalysis);
      
      await user.click(retryButton);

      expect(screen.getByText('Fleet Overview')).toBeInTheDocument();
    });

    it('should handle partial data gracefully', () => {
      const incompleteEquipment = [{
        ...mockEquipmentData[0],
        metrics: {
          temperature: 15.5,
          // Missing other metrics
        } as any
      }];

      render(<MaintenanceDashboard equipment={incompleteEquipment} analyzer={mockAnalyzer} />);

      expect(screen.getByText('Maintenance Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Maintenance dashboard');
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      // Should be able to navigate between tabs
      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      const analyticsTab = screen.getByRole('tab', { name: /analytics/i });

      overviewTab.focus();
      await user.keyboard('{ArrowRight}');
      
      expect(analyticsTab).toHaveFocus();
    });

    it('should announce important updates', async () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      // Should have live region for announcements
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have sufficient color contrast', () => {
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      // Health indicators should have proper contrast
      const healthIndicators = screen.getAllByTestId('health-indicator');
      healthIndicators.forEach(indicator => {
        expect(indicator).toHaveStyle('color: rgb(0, 0, 0)'); // High contrast text
      });
    });
  });

  describe('Performance', () => {
    it('should handle large equipment datasets efficiently', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockEquipmentData[0],
        id: `eq${i}`,
        name: `Equipment ${i}`
      }));

      const startTime = Date.now();
      
      render(<MaintenanceDashboard equipment={largeDataset} analyzer={mockAnalyzer} />);

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000); // Should render within 3 seconds
    });

    it('should virtualize large equipment lists', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockEquipmentData[0],
        id: `eq${i}`,
        name: `Equipment ${i}`
      }));

      render(<MaintenanceDashboard equipment={largeDataset} analyzer={mockAnalyzer} />);

      // Should only render visible items
      const equipmentCards = screen.getAllByTestId('equipment-card');
      expect(equipmentCards.length).toBeLessThan(50); // Should be virtualized
    });

    it('should debounce filter operations', async () => {
      const user = userEvent.setup();
      
      render(<MaintenanceDashboard equipment={mockEquipmentData} analyzer={mockAnalyzer} />);

      const searchInput = screen.getByPlaceholderText(/search equipment/i);
      
      // Type quickly
      await user.type(searchInput, 'telescope');

      // Should debounce the search
      await waitFor(() => {
        expect(mockAnalyzer.analyzeFleet).toHaveBeenCalledTimes(1); // Only initial call
      }, { timeout: 1000 });
    });
  });
});
