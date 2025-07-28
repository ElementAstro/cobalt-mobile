import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DiscoveryAssistant } from '../../components/targets/discovery-assistant';
import { TargetRecommendationEngine } from '../../lib/targets/recommendation-engine';
import { TargetOptimizer } from '../../lib/targets/target-optimizer';
import { EquipmentProfile } from '../../lib/stores/equipment-store';
import { Target } from '../../lib/target-planning/target-database';

// Mock the engines
jest.mock('../../lib/targets/recommendation-engine');
jest.mock('../../lib/targets/target-optimizer');

const MockedRecommendationEngine = TargetRecommendationEngine as jest.MockedClass<typeof TargetRecommendationEngine>;
const MockedTargetOptimizer = TargetOptimizer as jest.MockedClass<typeof TargetOptimizer>;

// Mock data
const mockEquipment: EquipmentProfile[] = [
  {
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
  }
];

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

const mockRecommendations = [
  {
    target: mockTargets[0],
    score: 85,
    reasons: ['High in sky', 'Good weather conditions', 'Matches preferences'],
    suitability: {
      overall: 90,
      telescope: 85,
      camera: 95,
      mount: 88,
      details: {
        focalLength: 'Excellent match for target size',
        resolution: 'High resolution suitable for detail',
        tracking: 'Mount capable of required precision'
      }
    },
    sessionPlan: {
      startTime: '2024-03-15T21:00:00Z',
      endTime: '2024-03-16T02:00:00Z',
      exposureSettings: {
        exposureTime: 300,
        gain: 100,
        binning: 1,
        filterSequence: ['L', 'R', 'G', 'B']
      },
      estimatedFrames: 60,
      totalIntegration: 300
    },
    learningOpportunities: [
      {
        type: 'technique',
        description: 'Practice galaxy processing techniques',
        difficulty: 'intermediate',
        estimatedTime: 120
      }
    ]
  }
];

const mockOptimizedSession = {
  targets: [
    {
      target: mockTargets[0],
      startTime: '2024-03-15T21:00:00Z',
      endTime: '2024-03-16T02:00:00Z',
      priority: 1,
      altitude: 65,
      airmass: 1.2,
      exposureSettings: {
        exposureTime: 300,
        gain: 100,
        binning: 1,
        filterSequence: ['L', 'R', 'G', 'B']
      },
      estimatedFrames: 60
    }
  ],
  timeline: [
    {
      time: '2024-03-15T21:00:00Z',
      event: 'Start imaging M31',
      target: 'M31'
    }
  ],
  totalDuration: 300,
  efficiency: 85,
  weatherImpact: 'minimal'
};

describe('DiscoveryAssistant', () => {
  let mockRecommendationEngine: jest.Mocked<TargetRecommendationEngine>;
  let mockOptimizer: jest.Mocked<TargetOptimizer>;

  beforeEach(() => {
    mockRecommendationEngine = {
      generateRecommendations: jest.fn().mockResolvedValue(mockRecommendations),
      calculateTargetScore: jest.fn().mockReturnValue(85),
      calculateEquipmentSuitability: jest.fn().mockReturnValue(mockRecommendations[0].suitability),
      calculateSeasonalScore: jest.fn().mockReturnValue(80),
      analyzeWeatherConditions: jest.fn().mockReturnValue(75),
      identifyLearningOpportunities: jest.fn().mockReturnValue(mockRecommendations[0].learningOpportunities)
    } as any;

    mockOptimizer = {
      optimizeSession: jest.fn().mockReturnValue(mockOptimizedSession),
      calculateAltitude: jest.fn().mockReturnValue(65),
      calculateAirmass: jest.fn().mockReturnValue(1.2),
      calculateTransitTime: jest.fn().mockReturnValue(new Date('2024-03-15T23:30:00Z')),
      optimizeExposureSettings: jest.fn().mockReturnValue(mockOptimizedSession.targets[0].exposureSettings),
      calculateImageScale: jest.fn().mockReturnValue(1.85),
      calculateFieldOfView: jest.fn().mockReturnValue({ width: 2.1, height: 1.4 })
    } as any;

    MockedRecommendationEngine.mockImplementation(() => mockRecommendationEngine);
    MockedTargetOptimizer.mockImplementation(() => mockOptimizer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the discovery assistant with all tabs', () => {
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      expect(screen.getByText('Target Discovery Assistant')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /recommendations/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /session planning/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /preferences/i })).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      expect(screen.getByText(/generating recommendations/i)).toBeInTheDocument();
    });

    it('should display recommendations after loading', async () => {
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
      });

      expect(screen.getByText('85')).toBeInTheDocument(); // Score
      expect(screen.getByText(/high in sky/i)).toBeInTheDocument(); // Reason
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
      });

      // Switch to session planning tab
      await user.click(screen.getByRole('tab', { name: /session planning/i }));
      
      expect(screen.getByText(/session timeline/i)).toBeInTheDocument();

      // Switch to preferences tab
      await user.click(screen.getByRole('tab', { name: /preferences/i }));
      
      expect(screen.getByText(/experience level/i)).toBeInTheDocument();
    });

    it('should maintain state when switching tabs', async () => {
      const user = userEvent.setup();
      
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
      });

      // Switch to preferences and make a change
      await user.click(screen.getByRole('tab', { name: /preferences/i }));
      
      const beginnerButton = screen.getByRole('button', { name: /beginner/i });
      await user.click(beginnerButton);

      // Switch back to recommendations
      await user.click(screen.getByRole('tab', { name: /recommendations/i }));
      
      // Should still show recommendations
      expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
    });
  });

  describe('Recommendations Tab', () => {
    it('should display recommendation cards with correct information', async () => {
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
      });

      // Check recommendation details
      expect(screen.getByText('85')).toBeInTheDocument(); // Score
      expect(screen.getByText(/galaxy/i)).toBeInTheDocument(); // Type
      expect(screen.getByText(/andromeda/i)).toBeInTheDocument(); // Constellation
      expect(screen.getByText(/beginner/i)).toBeInTheDocument(); // Difficulty
    });

    it('should show equipment suitability information', async () => {
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
      });

      // Look for suitability indicators
      expect(screen.getByText('90%')).toBeInTheDocument(); // Overall suitability
    });

    it('should handle empty recommendations', async () => {
      mockRecommendationEngine.generateRecommendations.mockResolvedValue([]);

      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/no recommendations/i)).toBeInTheDocument();
      });
    });

    it('should handle recommendation loading errors', async () => {
      mockRecommendationEngine.generateRecommendations.mockRejectedValue(
        new Error('Failed to generate recommendations')
      );

      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/error generating recommendations/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Planning Tab', () => {
    it('should display session timeline', async () => {
      const user = userEvent.setup();
      
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /session planning/i }));

      expect(screen.getByText(/session timeline/i)).toBeInTheDocument();
      expect(screen.getByText(/total duration/i)).toBeInTheDocument();
      expect(screen.getByText(/efficiency/i)).toBeInTheDocument();
    });

    it('should allow session parameter adjustment', async () => {
      const user = userEvent.setup();
      
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /session planning/i }));

      // Look for session controls
      const startTimeInput = screen.getByLabelText(/start time/i);
      expect(startTimeInput).toBeInTheDocument();

      // Change start time
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '21:00');

      // Should trigger re-optimization
      await waitFor(() => {
        expect(mockOptimizer.optimizeSession).toHaveBeenCalledTimes(2);
      });
    });

    it('should show session statistics', async () => {
      const user = userEvent.setup();
      
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /session planning/i }));

      expect(screen.getByText('85%')).toBeInTheDocument(); // Efficiency
      expect(screen.getByText(/300/)).toBeInTheDocument(); // Duration
    });
  });

  describe('Preferences Tab', () => {
    it('should display preference controls', async () => {
      const user = userEvent.setup();
      
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await user.click(screen.getByRole('tab', { name: /preferences/i }));

      expect(screen.getByText(/experience level/i)).toBeInTheDocument();
      expect(screen.getByText(/preferred targets/i)).toBeInTheDocument();
      expect(screen.getByText(/imaging goals/i)).toBeInTheDocument();
    });

    it('should update preferences and regenerate recommendations', async () => {
      const user = userEvent.setup();
      
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await user.click(screen.getByRole('tab', { name: /preferences/i }));

      // Change experience level
      const advancedButton = screen.getByRole('button', { name: /advanced/i });
      await user.click(advancedButton);

      // Should trigger recommendation regeneration
      await waitFor(() => {
        expect(mockRecommendationEngine.generateRecommendations).toHaveBeenCalledTimes(2);
      });
    });

    it('should validate preference inputs', async () => {
      const user = userEvent.setup();
      
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await user.click(screen.getByRole('tab', { name: /preferences/i }));

      // Try to set invalid session duration
      const durationInput = screen.getByLabelText(/max session duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '-1');

      // Should show validation error
      expect(screen.getByText(/duration must be positive/i)).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should update recommendations when equipment changes', async () => {
      const { rerender } = render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(mockRecommendationEngine.generateRecommendations).toHaveBeenCalledTimes(1);
      });

      // Change equipment
      const newEquipment = [
        {
          ...mockEquipment[0],
          telescope: {
            ...mockEquipment[0].telescope!,
            aperture: 300
          }
        }
      ];

      rerender(
        <DiscoveryAssistant
          equipment={newEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(mockRecommendationEngine.generateRecommendations).toHaveBeenCalledTimes(2);
      });
    });

    it('should update when available targets change', async () => {
      const { rerender } = render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      await waitFor(() => {
        expect(mockRecommendationEngine.generateRecommendations).toHaveBeenCalledTimes(1);
      });

      // Add new target
      const newTargets = [
        ...mockTargets,
        {
          id: 'M51',
          name: 'Whirlpool Galaxy',
          type: 'galaxy' as const,
          coordinates: { ra: 202.4696, dec: 47.1951 },
          magnitude: 8.4,
          size: { width: 11, height: 7 },
          constellation: 'Canes Venatici',
          season: 'spring' as const,
          difficulty: 'intermediate' as const,
          description: 'Interacting spiral galaxies'
        }
      ];

      rerender(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={newTargets}
        />
      );

      await waitFor(() => {
        expect(mockRecommendationEngine.generateRecommendations).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing equipment gracefully', () => {
      render(
        <DiscoveryAssistant
          equipment={[]}
          availableTargets={mockTargets}
        />
      );

      expect(screen.getByText(/no equipment configured/i)).toBeInTheDocument();
    });

    it('should handle missing targets gracefully', () => {
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={[]}
        />
      );

      expect(screen.getByText(/no targets available/i)).toBeInTheDocument();
    });

    it('should recover from engine errors', async () => {
      mockRecommendationEngine.generateRecommendations
        .mockRejectedValueOnce(new Error('Engine error'))
        .mockResolvedValueOnce(mockRecommendations);

      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText(/error generating recommendations/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Should recover and show recommendations
      await waitFor(() => {
        expect(screen.getByText('Andromeda Galaxy')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /recommendations/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      const recommendationsTab = screen.getByRole('tab', { name: /recommendations/i });
      const sessionTab = screen.getByRole('tab', { name: /session planning/i });

      // Navigate with keyboard
      recommendationsTab.focus();
      await user.keyboard('{ArrowRight}');
      
      expect(sessionTab).toHaveFocus();
    });

    it('should announce loading states to screen readers', () => {
      render(
        <DiscoveryAssistant
          equipment={mockEquipment}
          availableTargets={mockTargets}
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent(/generating recommendations/i);
    });
  });
});
