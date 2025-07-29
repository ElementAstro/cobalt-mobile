import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeviceActions from '../device-actions';
import { useAppStore } from '@/lib/store';

// Mock the store
jest.mock('@/lib/store', () => ({
  useAppStore: jest.fn(),
}));

// Mock the translation hook
jest.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Power: ({ className }: any) => <span className={className} data-testid="power">🔌</span>,
  Settings: ({ className }: any) => <span className={className} data-testid="settings">⚙️</span>,
  Calibrate: ({ className }: any) => <span className={className} data-testid="calibrate">🎯</span>,
  RotateCw: ({ className }: any) => <span className={className} data-testid="rotate">🔄</span>,
  Thermometer: ({ className }: any) => <span className={className} data-testid="thermometer">🌡️</span>,
  Zap: ({ className }: any) => <span className={className} data-testid="zap">⚡</span>,
  Camera: ({ className }: any) => <span className={className} data-testid="camera">📷</span>,
  Compass: ({ className }: any) => <span className={className} data-testid="compass">🧭</span>,
  Filter: ({ className }: any) => <span className={className} data-testid="filter">🔍</span>,
  Focus: ({ className }: any) => <span className={className} data-testid="focus">🎯</span>,
  Play: ({ className }: any) => <span className={className} data-testid="play">▶️</span>,
  Pause: ({ className }: any) => <span className={className} data-testid="pause">⏸️</span>,
  Square: ({ className }: any) => <span className={className} data-testid="square">⏹️</span>,
  Home: ({ className }: any) => <span className={className} data-testid="home">🏠</span>,
  Target: ({ className }: any) => <span className={className} data-testid="target">🎯</span>,
  RefreshCw: ({ className }: any) => <span className={className} data-testid="refresh">🔄</span>,
  Download: ({ className }: any) => <span className={className} data-testid="download">⬇️</span>,
  Upload: ({ className }: any) => <span className={className} data-testid="upload">⬆️</span>,
  Wrench: ({ className }: any) => <span className={className} data-testid="wrench">🔧</span>,
  AlertTriangle: ({ className }: any) => <span className={className} data-testid="alert">⚠️</span>,
}));

const mockStoreState = {};

describe('DeviceActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as jest.Mock).mockReturnValue(mockStoreState);
  });

  describe('Camera Actions', () => {
    it('renders camera-specific controls', () => {
      render(<DeviceActions deviceType="camera" />);

      expect(screen.getByText('Capture Controls')).toBeInTheDocument();
      expect(screen.getByText('Cooling System')).toBeInTheDocument();
      expect(screen.getByText('Single Shot')).toBeInTheDocument();
      expect(screen.getByText('Start Sequence')).toBeInTheDocument();
    });

    it('handles single shot capture action', async () => {
      render(<DeviceActions deviceType="camera" />);

      const singleShotButton = screen.getByText('Single Shot');
      fireEvent.click(singleShotButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('rotate')).toBeInTheDocument();
      });

      // Wait for action to complete
      await waitFor(() => {
        expect(screen.queryByTestId('rotate')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays cooling controls', () => {
      render(<DeviceActions deviceType="camera" />);

      expect(screen.getByText('Cooling Enabled')).toBeInTheDocument();
      expect(screen.getByText('Target Temperature: -10°C')).toBeInTheDocument();
      expect(screen.getByText('Current:')).toBeInTheDocument();
      expect(screen.getByText('Power:')).toBeInTheDocument();
    });
  });

  describe('Mount Actions', () => {
    it('renders mount-specific controls', () => {
      render(<DeviceActions deviceType="mount" />);

      expect(screen.getByText('Movement Controls')).toBeInTheDocument();
      expect(screen.getByText('Alignment & Calibration')).toBeInTheDocument();
      expect(screen.getByText('GoTo Target')).toBeInTheDocument();
      expect(screen.getByText('Park')).toBeInTheDocument();
    });

    it('handles goto target action', async () => {
      render(<DeviceActions deviceType="mount" />);

      const gotoButton = screen.getByText('GoTo Target');
      fireEvent.click(gotoButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('rotate')).toBeInTheDocument();
      });

      // Wait for action to complete
      await waitFor(() => {
        expect(screen.queryByTestId('rotate')).not.toBeInTheDocument();
      }, { timeout: 4000 });
    });

    it('displays alignment controls', () => {
      render(<DeviceActions deviceType="mount" />);

      expect(screen.getByText('Polar Alignment')).toBeInTheDocument();
      expect(screen.getByText('Star Alignment')).toBeInTheDocument();
      expect(screen.getByText('Sync Position')).toBeInTheDocument();
    });
  });

  describe('Focuser Actions', () => {
    it('renders focuser-specific controls', () => {
      render(<DeviceActions deviceType="focuser" />);

      expect(screen.getByText('Manual Focus')).toBeInTheDocument();
      expect(screen.getByText('Auto Focus')).toBeInTheDocument();
      expect(screen.getByText('Step Size')).toBeInTheDocument();
      expect(screen.getByText('Focus In')).toBeInTheDocument();
      expect(screen.getByText('Focus Out')).toBeInTheDocument();
    });

    it('displays step size options', () => {
      render(<DeviceActions deviceType="focuser" />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    it('handles auto focus action', async () => {
      render(<DeviceActions deviceType="focuser" />);

      const autoFocusButton = screen.getByText('Start Auto Focus');
      fireEvent.click(autoFocusButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('rotate')).toBeInTheDocument();
      });

      // Wait for action to complete
      await waitFor(() => {
        expect(screen.queryByTestId('rotate')).not.toBeInTheDocument();
      }, { timeout: 6000 });
    });

    it('displays focus metrics', () => {
      render(<DeviceActions deviceType="focuser" />);

      expect(screen.getByText('Best HFR:')).toBeInTheDocument();
      expect(screen.getByText('Best Position:')).toBeInTheDocument();
    });
  });

  describe('Filter Wheel Actions', () => {
    it('renders filter wheel-specific controls', () => {
      render(<DeviceActions deviceType="filter" />);

      expect(screen.getByText('Filter Selection')).toBeInTheDocument();
      expect(screen.getByText('Wheel Controls')).toBeInTheDocument();
      expect(screen.getByText('Home Position')).toBeInTheDocument();
    });

    it('displays filter options', () => {
      render(<DeviceActions deviceType="filter" />);

      expect(screen.getByText('Luminance')).toBeInTheDocument();
      expect(screen.getByText('Red')).toBeInTheDocument();
      expect(screen.getByText('Green')).toBeInTheDocument();
      expect(screen.getByText('Blue')).toBeInTheDocument();
      expect(screen.getByText('Ha')).toBeInTheDocument();
      expect(screen.getByText('OIII')).toBeInTheDocument();
      expect(screen.getByText('SII')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('handles home position action', async () => {
      render(<DeviceActions deviceType="filter" />);

      const homeButton = screen.getByText('Home Position');
      fireEvent.click(homeButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('rotate')).toBeInTheDocument();
      });

      // Wait for action to complete
      await waitFor(() => {
        expect(screen.queryByTestId('rotate')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays filter wheel status', () => {
      render(<DeviceActions deviceType="filter" />);

      expect(screen.getByText('Current Position:')).toBeInTheDocument();
      expect(screen.getByText('Temperature:')).toBeInTheDocument();
    });
  });

  describe('Action Execution', () => {
    it('prevents multiple simultaneous actions', async () => {
      render(<DeviceActions deviceType="camera" />);

      const singleShotButton = screen.getByText('Single Shot');
      const sequenceButton = screen.getByText('Start Sequence');

      // Start first action
      fireEvent.click(singleShotButton);

      // Try to start second action while first is running
      fireEvent.click(sequenceButton);

      // Only one action should be executing
      const rotateIcons = screen.getAllByTestId('rotate');
      expect(rotateIcons).toHaveLength(1);
    });

    it('re-enables buttons after action completion', async () => {
      render(<DeviceActions deviceType="camera" />);

      const singleShotButton = screen.getByText('Single Shot');
      
      // Button should be enabled initially
      expect(singleShotButton).not.toBeDisabled();

      fireEvent.click(singleShotButton);

      // Button should be disabled during execution
      expect(singleShotButton).toBeDisabled();

      // Wait for action to complete
      await waitFor(() => {
        expect(singleShotButton).not.toBeDisabled();
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    it('handles action errors gracefully', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<DeviceActions deviceType="camera" />);

      const singleShotButton = screen.getByText('Single Shot');
      fireEvent.click(singleShotButton);

      // Wait for action to complete (even if it errors)
      await waitFor(() => {
        expect(singleShotButton).not.toBeDisabled();
      }, { timeout: 3000 });

      consoleSpy.mockRestore();
    });
  });
});
