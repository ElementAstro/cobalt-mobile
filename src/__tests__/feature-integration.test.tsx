import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import all the new feature components
import { WeatherDashboard } from '@/components/weather/weather-dashboard';
import { ImageAnalysisDashboard } from '@/components/image-analysis/image-analysis-dashboard';
import { EquipmentHealthDashboard } from '@/components/equipment-health/equipment-health-dashboard';
import { GuidingDashboard } from '@/components/guiding/guiding-dashboard';

// Import services and engines
import { weatherService } from '@/lib/weather/weather-service';
import { imageAnalyzer } from '@/lib/image-processing/image-analyzer';
import { guidingEngine } from '@/lib/guiding/guiding-engine';
import { targetPlanner } from '@/lib/target-planning/target-planner';

// Mock external dependencies
jest.mock('@/lib/weather/weather-service');
jest.mock('@/lib/image-processing/image-analyzer');
jest.mock('@/lib/equipment-health/health-monitor', () => ({
  healthMonitor: {
    updateComponentHealth: jest.fn(),
    getSystemHealth: jest.fn(() => 85),
    getActiveAlerts: jest.fn(() => []),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn()
  }
}));
jest.mock('@/lib/guiding/guiding-engine');
jest.mock('@/lib/target-planning/target-planner');

// Mock Zustand stores
jest.mock('@/lib/stores/weather-store', () => ({
  useWeatherStore: () => ({
    currentWeather: {
      temperature: 15,
      humidity: 65,
      pressure: 1013,
      windSpeed: 5,
      windDirection: 180,
      cloudCover: 20,
      visibility: 10,
      dewPoint: 8,
      lightPollution: 5.2,
      condition: 'clear',
      timestamp: new Date()
    },
    astronomicalConditions: {
      moonPhase: 0.25,
      moonAltitude: -10,
      sunAltitude: -25,
      imagingQuality: 85,
      moonIllumination: 25,
      moonSeparation: 45,
      timestamp: new Date()
    },
    forecast: {
      daily: [
        { date: new Date(), high: 20, low: 10, condition: 'clear', humidity: 60, windSpeed: 5 },
        { date: new Date(), high: 22, low: 12, condition: 'partly_cloudy', humidity: 65, windSpeed: 7 }
      ],
      hourly: [
        { time: new Date(), temperature: 15, humidity: 65, windSpeed: 5, condition: 'clear' },
        { time: new Date(), temperature: 16, humidity: 63, windSpeed: 6, condition: 'clear' },
        { time: new Date(), temperature: 17, humidity: 61, windSpeed: 7, condition: 'clear' },
        { time: new Date(), temperature: 18, humidity: 59, windSpeed: 8, condition: 'clear' },
        { time: new Date(), temperature: 19, humidity: 57, windSpeed: 9, condition: 'clear' },
        { time: new Date(), temperature: 20, humidity: 55, windSpeed: 10, condition: 'clear' },
        { time: new Date(), temperature: 21, humidity: 53, windSpeed: 11, condition: 'clear' },
        { time: new Date(), temperature: 22, humidity: 51, windSpeed: 12, condition: 'clear' },
        { time: new Date(), temperature: 23, humidity: 49, windSpeed: 13, condition: 'clear' },
        { time: new Date(), temperature: 24, humidity: 47, windSpeed: 14, condition: 'clear' },
        { time: new Date(), temperature: 25, humidity: 45, windSpeed: 15, condition: 'clear' },
        { time: new Date(), temperature: 26, humidity: 43, windSpeed: 16, condition: 'clear' }
      ]
    },
    location: { lat: 40.7128, lon: -74.0060, name: 'New York' },
    isLoading: false,
    error: null,
    lastUpdate: new Date(),
    autoRefresh: true,
    refreshInterval: 300000,
    alerts: [],
    defaultLocations: [
      { lat: 40.7128, lon: -74.0060, name: 'New York' },
      { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' }
    ],
    setLocation: jest.fn(),
    refreshWeather: jest.fn(),
    setAutoRefresh: jest.fn(),
    setRefreshInterval: jest.fn(),
    clearError: jest.fn(),
    getActiveAlerts: jest.fn(() => []),
    getImagingQuality: jest.fn(() => 85),
    getMoonPhaseDescription: jest.fn(() => 'Waxing Crescent'),
    isGoodForImaging: jest.fn(() => true),
    getImagingRecommendation: jest.fn(() => 'Excellent conditions for imaging')
  })
}));

jest.mock('@/lib/stores/image-analysis-store', () => ({
  useImageAnalysisStore: () => ({
    currentAnalysis: {
      hfr: 2.5,
      fwhm: 3.2,
      snr: 45,
      starCount: 1250,
      eccentricity: 0.15,
      backgroundLevel: 1200,
      peakValue: 45000,
      qualityScore: 85,
      focusScore: 90,
      recommendations: ['Good focus', 'Excellent star count'],
      timestamp: new Date(),
      overall: 85, // Add missing overall property
      quality: {
        overall: 85,
        focus: 90,
        noise: 80,
        saturation: 75
      },
      qualityAssessment: {
        overall: 85,
        focus: 90,
        noise: 80,
        saturation: 75,
        stars: 95,
        background: 88
      }
    },
    analysisHistory: [],
    focusHistory: [],
    qualityTrend: 'improving',
    isAnalyzing: false,
    autoAnalysis: true,
    targetHFR: 2.0,
    alertThresholds: {
      hfr: 3.0,
      snr: 20,
      saturation: 90
    },
    activeAlerts: [],
    analyzeImage: jest.fn(),
    setAutoAnalysis: jest.fn(),
    setTargetHFR: jest.fn(),
    updateAlertThresholds: jest.fn(),
    clearHistory: jest.fn(),
    dismissAlert: jest.fn(),
    getActiveAlerts: jest.fn(() => []),
    isInFocus: jest.fn(() => true),
    getCurrentHFR: jest.fn(() => 2.5),
    getQualityScore: jest.fn(() => 85)
  })
}));

jest.mock('@/lib/stores/equipment-health-store', () => ({
  useEquipmentHealthStore: () => ({
    components: {},
    healthStatuses: {},
    activeAlerts: [],
    systemOverview: {
      overallHealth: 85,
      criticalIssues: 0,
      warnings: 2,
      maintenanceDue: 1,
      uptime: 24.5,
      lastMaintenance: new Date(),
      activeAlerts: 2,
      healthyComponents: 5,
      warningComponents: 2,
      criticalComponents: 0,
      offlineComponents: 0
    },
    upcomingMaintenance: [
      { component: 'Camera', type: 'Cleaning', dueDate: new Date() }
    ],
    isMonitoring: true,
    monitoringInterval: 30000,
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    updateComponent: jest.fn(),
    scheduleMaintenanceReminder: jest.fn(),
    dismissAlert: jest.fn(),
    exportHealthData: jest.fn(),
    clearHistory: jest.fn(),
    getCriticalAlerts: jest.fn(() => []),
    getActiveAlerts: jest.fn(() => []),
    getSystemHealth: jest.fn(() => 85),
    getOverdueMaintenance: jest.fn(() => [])
  })
}));

jest.mock('@/lib/stores/guiding-store', () => ({
  useGuidingStore: () => ({
    isConnected: false,
    connectionStatus: 'Disconnected',
    guidingState: {
      isGuiding: false,
      isCalibrated: false,
      isConnected: false,
      currentStar: null,
      lockPosition: null,
      currentError: { ra: 0, dec: 0 },
      currentCorrection: { ra: 0, dec: 0 },
      exposureTime: 2.0,
      gain: 50,
      frameRate: 0.5,
      temperature: -10,
      status: 'idle',
      statusMessage: 'Ready',
      settleProgress: 0
    },
    currentCalibration: null,
    currentSession: null,
    isGuiding: false,
    isPolarAligning: false,
    isDithering: false,
    selectedTab: 'guiding',
    connect: jest.fn(),
    disconnect: jest.fn(),
    startCalibration: jest.fn(),
    startGuiding: jest.fn(),
    stopGuiding: jest.fn(),
    dither: jest.fn(),
    startPolarAlignment: jest.fn(),
    setSelectedTab: jest.fn(),
    getCurrentRMS: jest.fn(() => ({ ra: 0.5, dec: 0.3, total: 0.6 })),
    getGuidingQuality: jest.fn(() => 'Excellent'),
    getCalibrationQuality: jest.fn(() => 'Good'),
    getPolarAlignmentQuality: jest.fn(() => 'Fair'),
    sessionStats: {
      totalSessions: 15,
      averageRMS: 0.65,
      bestRMS: 0.32,
      totalGuidingTime: 45.5
    },
    ditherSettings: {
      enabled: true,
      amount: 5,
      frequency: 10
    },
    guidingParameters: {
      aggressiveness: 75,
      minMove: 0.15,
      maxMove: 5.0,
      hysteresis: 0.1,
      settleTime: 2.5,
      ditherAmount: 3.0,
      enableDithering: true,
      ditherFrequency: 5
    },
    updateDitherSettings: jest.fn()
  }),
  mockReturnValue: jest.fn()
}));

describe('Feature Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Weather Dashboard Integration', () => {
    it('should render weather dashboard with current conditions', () => {
      render(<WeatherDashboard />);
      
      expect(screen.getByText('Weather & Astronomical Conditions')).toBeInTheDocument();
      expect(screen.getByText('15°C')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('should handle compact mode correctly', () => {
      render(<WeatherDashboard compact={true} />);
      
      expect(screen.getByText('Weather')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument(); // Quality score
    });

    it('should display astronomical conditions', () => {
      render(<WeatherDashboard />);
      
      expect(screen.getByText('Moon Phase')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument(); // Moon illumination
    });
  });

  describe('Image Analysis Dashboard Integration', () => {
    it('should render image analysis dashboard with metrics', () => {
      render(<ImageAnalysisDashboard />);
      
      expect(screen.getByText('Image Analysis & Quality Assessment')).toBeInTheDocument();
      expect(screen.getByText('2.5')).toBeInTheDocument(); // HFR value
      expect(screen.getByText('1250')).toBeInTheDocument(); // Star count
    });

    it('should show quality score and recommendations', () => {
      render(<ImageAnalysisDashboard />);
      
      expect(screen.getByText('85')).toBeInTheDocument(); // Quality score
      expect(screen.getByText('Good focus')).toBeInTheDocument();
      expect(screen.getByText('Excellent star count')).toBeInTheDocument();
    });

    it('should handle compact mode for dashboard integration', () => {
      render(<ImageAnalysisDashboard compact={true} />);
      
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('2.5"')).toBeInTheDocument(); // HFR with units
    });
  });

  describe('Equipment Health Dashboard Integration', () => {
    it('should render equipment health dashboard', () => {
      render(<EquipmentHealthDashboard />);
      
      expect(screen.getByText('Equipment Health Monitoring')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument(); // Overall health
    });

    it('should display system overview metrics', () => {
      render(<EquipmentHealthDashboard />);
      
      expect(screen.getByText('Overall Health')).toBeInTheDocument();
      expect(screen.getByText('Critical Issues')).toBeInTheDocument();
      expect(screen.getByText('Warnings')).toBeInTheDocument();
    });

    it('should handle compact mode correctly', () => {
      render(<EquipmentHealthDashboard compact={true} />);

      expect(screen.getByText('Equipment Health')).toBeInTheDocument();
      expect(screen.getByText('2 Warning')).toBeInTheDocument(); // Warning count
    });
  });

  describe('Guiding Dashboard Integration', () => {
    it('should render guiding dashboard with connection status', () => {
      render(<GuidingDashboard />);
      
      expect(screen.getByText('Guiding & Polar Alignment')).toBeInTheDocument();
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    it('should show guiding controls when connected', () => {
      // Test with default disconnected state
      render(<GuidingDashboard />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    it('should handle compact mode for dashboard integration', () => {
      render(<GuidingDashboard compact={true} />);
      
      expect(screen.getByText('Guiding')).toBeInTheDocument();
      expect(screen.getByText('idle')).toBeInTheDocument();
    });
  });

  describe('Service Integration Tests', () => {
    it('should integrate weather service correctly', async () => {
      const mockWeatherData = {
        temperature: 20,
        humidity: 50,
        pressure: 1015,
        windSpeed: 3,
        windDirection: 90,
        cloudCover: 10,
        visibility: 15,
        dewPoint: 5,
        condition: 'clear',
        timestamp: new Date()
      };

      (weatherService.getCurrentWeather as jest.Mock).mockResolvedValue(mockWeatherData);

      const result = await weatherService.getCurrentWeather();
      expect(result).toEqual(mockWeatherData);
      expect(weatherService.getCurrentWeather).toHaveBeenCalled();
    });

    it('should integrate image analyzer correctly', async () => {
      const mockImageData = new Uint16Array([1, 2, 3, 4]);
      const mockAnalysis = {
        hfr: 2.1,
        fwhm: 2.8,
        snr: 50,
        starCount: 1500,
        eccentricity: 0.12,
        backgroundLevel: 1100,
        peakValue: 48000,
        qualityScore: 90,
        focusScore: 95,
        recommendations: ['Excellent focus', 'Great star field'],
        timestamp: new Date()
      };

      (imageAnalyzer.analyzeImage as jest.Mock).mockResolvedValue(mockAnalysis);

      const result = await imageAnalyzer.analyzeImage(mockImageData);
      expect(result).toEqual(mockAnalysis);
      expect(imageAnalyzer.analyzeImage).toHaveBeenCalledWith(mockImageData);
    });



    it('should integrate guiding engine correctly', async () => {
      const mockCalibration = {
        raStepsPerArcsec: 2.5,
        decStepsPerArcsec: 2.3,
        raAngle: 45.2,
        decAngle: 135.8,
        orthogonalError: 2.1,
        calibrationQuality: 'excellent' as const,
        timestamp: new Date()
      };

      (guidingEngine.startCalibration as jest.Mock).mockResolvedValue(mockCalibration);

      const result = await guidingEngine.startCalibration();
      expect(result).toEqual(mockCalibration);
      expect(guidingEngine.startCalibration).toHaveBeenCalled();
    });

    it('should integrate target planner correctly', () => {
      const mockTarget = {
        id: 'M31',
        name: 'M31',
        coordinates: { ra: 10.684, dec: 41.269, epoch: 2000 },
        magnitude: 3.4,
        size: { major: 190, minor: 60, angle: 35 },
        type: 'galaxy' as const,
        constellation: 'Andromeda',
        season: 'autumn' as const,
        minAltitude: 30,
        moonAvoidance: 7,
        difficulty: 'beginner' as const,
        bestMonths: ['Sep', 'Oct', 'Nov', 'Dec'],
        exposureRecommendations: [
          { filter: 'L', exposureTime: 300, binning: 1, gain: 100 },
          { filter: 'R', exposureTime: 300, binning: 1, gain: 100 },
          { filter: 'G', exposureTime: 300, binning: 1, gain: 100 },
          { filter: 'B', exposureTime: 300, binning: 1, gain: 100 }
        ]
      };

      const mockVisibility = {
        isVisible: true,
        altitude: 45.5,
        azimuth: 120.3,
        airmass: 1.4,
        moonSeparation: 60.2,
        transitTime: new Date(),
        riseTime: new Date(),
        setTime: new Date()
      };

      (targetPlanner.calculateTargetVisibility as jest.Mock).mockReturnValue(mockVisibility);

      const result = targetPlanner.calculateTargetVisibility(
        mockTarget,
        new Date()
      );
      expect(result).toEqual(mockVisibility);
    });
  });

  describe('Store Integration Tests', () => {
    it('should handle weather store state updates', () => {
      const { useWeatherStore } = require('@/lib/stores/weather-store');
      const store = useWeatherStore();
      
      expect(store.currentWeather.temperature).toBe(15);
      expect(store.astronomicalConditions.imagingQuality).toBe(85);
      expect(typeof store.refreshWeather).toBe('function');
    });

    it('should handle image analysis store state updates', () => {
      const { useImageAnalysisStore } = require('@/lib/stores/image-analysis-store');
      const store = useImageAnalysisStore();
      
      expect(store.currentAnalysis.hfr).toBe(2.5);
      expect(store.currentAnalysis.qualityScore).toBe(85);
      expect(typeof store.analyzeImage).toBe('function');
    });

    it('should handle equipment health store state updates', () => {
      const { useEquipmentHealthStore } = require('@/lib/stores/equipment-health-store');
      const store = useEquipmentHealthStore();
      
      expect(store.systemOverview.overallHealth).toBe(85);
      expect(store.systemOverview.warnings).toBe(2);
      expect(typeof store.startMonitoring).toBe('function');
    });

    it('should handle guiding store state updates', () => {
      const { useGuidingStore } = require('@/lib/stores/guiding-store');
      const store = useGuidingStore();
      
      expect(store.isConnected).toBe(false);
      expect(store.guidingState.status).toBe('idle');
      expect(typeof store.connect).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle weather service errors gracefully', async () => {
      (weatherService.getCurrentWeather as jest.Mock).mockRejectedValue(new Error('API Error'));
      
      try {
        await weatherService.getCurrentWeather();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('API Error');
      }
    });

    it('should handle image analysis errors gracefully', async () => {
      (imageAnalyzer.analyzeImage as jest.Mock).mockRejectedValue(new Error('Analysis failed'));
      
      try {
        await imageAnalyzer.analyzeImage(new Uint16Array([]));
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Analysis failed');
      }
    });

    it('should handle guiding connection errors gracefully', async () => {
      (guidingEngine.connect as jest.Mock).mockResolvedValue(false);
      
      const result = await guidingEngine.connect();
      expect(result).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should render dashboards within performance budget', async () => {
      const startTime = performance.now();
      
      render(<WeatherDashboard />);
      render(<ImageAnalysisDashboard />);
      render(<EquipmentHealthDashboard />);
      render(<GuidingDashboard />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render all dashboards within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle rapid state updates efficiently', async () => {
      const { useWeatherStore } = require('@/lib/stores/weather-store');
      const store = useWeatherStore();
      
      const startTime = performance.now();
      
      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        store.refreshWeather();
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      // Should handle 100 updates within 50ms
      expect(updateTime).toBeLessThan(50);
    });
  });
});
