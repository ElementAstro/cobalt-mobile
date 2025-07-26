/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CameraControl from '../components/camera/components/camera-control';

// Mock the entire camera module ecosystem
const mockCameraState = {
  connected: false,
  liveViewActive: false,
  cameraTemp: 20.0,
  targetTemp: -10,
  coolingPower: 50,
  isCapturing: false,
  captureProgress: 0,
  settings: {
    exposure: 300,
    iso: 800,
    gain: 100,
    offset: 10,
    binning: '1x1',
    frameType: 'Light',
    imageFormat: 'FITS',
  },
};

const mockCameraActions = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  startCapture: jest.fn(),
  abortCapture: jest.fn(),
  toggleLiveView: jest.fn(),
  updateSettings: jest.fn(),
};

// Mock camera hooks
jest.mock('../components/camera/hooks/use-camera', () => ({
  useCamera: () => ({
    cameraStatus: mockCameraState,
    cameraSettings: {
      exposure: 300,
      iso: 800,
      binning: '1x1',
      gain: 100,
      offset: 10,
      temperature: -10,
      coolingEnabled: true,
      frameType: 'Light',
      imageFormat: 'FITS',
    },
    isCoolingEffective: false,
    isReadyForCapture: mockCameraState.connected && !mockCameraState.capturing,
    connectionStatus: mockCameraState.connected ? 'connected' : 'disconnected',
    ...mockCameraActions,
  }),
}));

jest.mock('../components/camera/hooks/use-camera-capture', () => ({
  useCameraCapture: () => ({
    isCapturing: mockCameraState.capturing,
    captureProgress: mockCameraState.exposureProgress,
    canStartCapture: mockCameraState.connected && !mockCameraState.capturing,
    isReadyForCapture: mockCameraState.connected,
    startCapture: mockCameraActions.startCapture,
    abortCapture: mockCameraActions.abortCapture,
    captureInfo: {
      formattedExposureTime: '300s',
      formattedRemainingTime: '150s',
    },
  }),
}));

jest.mock('../components/camera/hooks/use-camera-settings', () => ({
  useCameraSettings: () => ({
    settings: mockCameraState.settings,
    updateExposure: jest.fn(),
    updateISO: jest.fn(),
    updateGain: jest.fn(),
    updateOffset: jest.fn(),
    updateBinning: jest.fn(),
    updateFrameType: jest.fn(),
    updateImageFormat: jest.fn(),
    updateCooling: jest.fn(),
    updateTemperature: jest.fn(),
    updateSettings: mockCameraActions.updateSettings,
    resetToDefaults: jest.fn(),
    validationLimits: {
      exposure: { min: 0.001, max: 3600 },
      gain: { min: 0, max: 1000 },
      offset: { min: 0, max: 100 },
      temperature: { min: -50, max: 50 },
    },
    availableOptions: {
      binning: ['1x1', '2x2', '3x3', '4x4'],
      frameTypes: ['Light', 'Dark', 'Bias', 'Flat'],
      imageFormats: ['FITS', 'RAW', 'TIFF', 'JPEG'],
      isoValues: [100, 200, 400, 800, 1600, 3200],
    },
    validateExposure: jest.fn(() => true),
    validateGain: jest.fn(() => true),
    validateOffset: jest.fn(() => true),
    validateTemperature: jest.fn(() => true),
  }),
}));

// Mock translation
jest.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock UI components with realistic behavior
jest.mock('../components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => <div className={className} {...props} data-testid={props['data-testid'] || "card"}>{children}</div>,
  CardContent: ({ children, className, ...props }: any) => <div className={className} {...props} data-testid={props['data-testid'] || "card-content"}>{children}</div>,
  CardHeader: ({ children, className, ...props }: any) => <div className={className} {...props} data-testid={props['data-testid'] || "card-header"}>{children}</div>,
  CardTitle: ({ children, className, ...props }: any) => <h3 className={className} {...props} data-testid={props['data-testid'] || "card-title"}>{children}</h3>,
}));

jest.mock('../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${className} ${variant}`}
      data-variant={variant}
      data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`}
      {...props}
    >
      {children}
    </button>
  ),
}));

describe('Camera Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset camera state
    mockCameraState.connected = false;
    mockCameraState.liveViewActive = false;
    mockCameraState.capturing = false;
    mockCameraState.exposureProgress = 0;
    mockCameraState.cameraTemp = 20.0;
  });

  describe('Camera Connection Workflow', () => {
    it('should handle complete camera connection workflow', async () => {
      const { rerender } = render(<CameraControl />);

      // Initially disconnected - capture should be disabled
      const captureButton = screen.getByTestId('button-capture');
      expect(captureButton).toBeDisabled();

      // Simulate camera connection
      mockCameraState.connected = true;

      // Re-render to reflect state change
      rerender(<CameraControl />);

      // Now capture should be enabled
      expect(screen.getByTestId('button-capture')).not.toBeDisabled();
    });

    it('should handle camera disconnection during operation', async () => {
      // Start with connected camera
      mockCameraState.connected = true;
      mockCameraState.capturing = true;

      const { rerender } = render(<CameraControl />);

      // Abort button should be enabled during capture
      expect(screen.getByTestId('button-abort')).not.toBeDisabled();

      // Simulate disconnection
      mockCameraState.connected = false;
      mockCameraState.capturing = false;

      rerender(<CameraControl />);

      // Both buttons should be disabled
      expect(screen.getByTestId('button-capture')).toBeDisabled();
      expect(screen.getByTestId('button-abort')).toBeDisabled();
    });
  });

  describe('Capture Workflow Integration', () => {
    beforeEach(() => {
      mockCameraState.connected = true;
    });

    it('should handle complete capture workflow', async () => {
      const { rerender } = render(<CameraControl />);

      // Start capture
      const captureButton = screen.getByTestId('button-capture');
      fireEvent.click(captureButton);

      expect(mockCameraActions.startCapture).toHaveBeenCalledTimes(1);

      // Simulate capture in progress
      mockCameraState.capturing = true;
      mockCameraState.exposureProgress = 50;
      
      rerender(<CameraControl />);

      // Capture button should be disabled, abort enabled
      expect(screen.getByTestId('button-capture')).toBeDisabled();
      expect(screen.getByTestId('button-abort')).not.toBeDisabled();

      // Abort capture
      const abortButton = screen.getByTestId('button-abort');
      fireEvent.click(abortButton);

      expect(mockCameraActions.abortCapture).toHaveBeenCalledTimes(1);

      // Simulate capture completed
      mockCameraState.capturing = false;
      mockCameraState.exposureProgress = 0;
      
      rerender(<CameraControl />);

      // Should return to initial state
      expect(screen.getByTestId('button-capture')).not.toBeDisabled();
      expect(screen.getByTestId('button-abort')).toBeDisabled();
    });

    it('should handle capture progress updates', async () => {
      mockCameraState.capturing = true;
      
      const { rerender } = render(<CameraControl />);

      // Simulate progress updates
      const progressValues = [25, 50, 75, 100];
      
      for (const progress of progressValues) {
        mockCameraState.exposureProgress = progress;
        rerender(<CameraControl />);
        
        // Progress should be reflected in UI
        // Note: This would need actual progress component to test properly
      }
    });
  });

  describe('Live View Integration', () => {
    beforeEach(() => {
      mockCameraState.connected = true;
    });

    it('should handle live view activation workflow', async () => {
      const { rerender } = render(<CameraControl />);

      // Initially no live view
      expect(screen.queryByTestId('live-view')).not.toBeInTheDocument();

      // Activate live view
      mockCameraState.liveViewActive = true;
      rerender(<CameraControl />);

      // Live view should now be visible
      expect(screen.getByTestId('live-view')).toBeInTheDocument();

      // Deactivate live view
      mockCameraState.liveViewActive = false;
      rerender(<CameraControl />);

      // Live view should be hidden
      expect(screen.queryByTestId('live-view')).not.toBeInTheDocument();
    });

    it('should handle live view with capture interaction', async () => {
      mockCameraState.liveViewActive = true;
      
      const { rerender } = render(<CameraControl />);

      // Live view should be visible
      expect(screen.getByTestId('live-view')).toBeInTheDocument();

      // Start capture while live view is active
      mockCameraState.capturing = true;
      rerender(<CameraControl />);

      // Live view should still be visible during capture
      expect(screen.getByTestId('live-view')).toBeInTheDocument();
    });
  });

  describe('Layout Responsiveness Integration', () => {
    it('should adapt layout based on props', () => {
      const { rerender } = render(<CameraControl layout="full" />);

      // Full layout should show all components
      expect(screen.getAllByTestId('card').length).toBeGreaterThan(0);

      // Switch to compact layout
      rerender(<CameraControl layout="compact" />);

      // Should still render but with different structure
      expect(screen.getAllByTestId('card').length).toBeGreaterThan(0);
    });

    it('should handle responsive features in compact mode', () => {
      mockCameraState.connected = true;
      mockCameraState.liveViewActive = true;
      
      render(<CameraControl layout="compact" />);

      // Compact mode should still show essential features
      expect(screen.getByTestId('button-capture')).toBeInTheDocument();
      expect(screen.getByTestId('button-abort')).toBeInTheDocument();
      expect(screen.getByTestId('live-view')).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle camera errors gracefully', () => {
      // Simulate error state
      mockCameraState.connected = false;
      
      expect(() => {
        render(<CameraControl />);
      }).not.toThrow();

      // UI should still be functional
      expect(screen.getByTestId('button-capture')).toBeInTheDocument();
      expect(screen.getByTestId('button-abort')).toBeInTheDocument();
    });

    it('should handle missing hook data', () => {
      // Mock hooks returning minimal data
      jest.doMock('../components/camera/hooks/use-camera', () => ({
        useCamera: () => ({
          cameraStatus: {
            connected: false,
            liveViewActive: false,
            cameraTemp: 0,
            capturing: false,
            exposureProgress: 0,
          },
        }),
      }));

      expect(() => {
        render(<CameraControl />);
      }).not.toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid state changes', async () => {
      const { rerender } = render(<CameraControl />);

      // Simulate rapid state changes
      for (let i = 0; i < 10; i++) {
        mockCameraState.connected = i % 2 === 0;
        mockCameraState.capturing = i % 3 === 0;
        mockCameraState.liveViewActive = i % 4 === 0;
        
        expect(() => {
          rerender(<CameraControl />);
        }).not.toThrow();
      }
    });

    it('should handle concurrent operations', async () => {
      mockCameraState.connected = true;
      mockCameraState.capturing = true;
      mockCameraState.liveViewActive = true;
      
      expect(() => {
        render(<CameraControl />);
      }).not.toThrow();

      // All features should be accessible
      expect(screen.getByTestId('button-capture')).toBeInTheDocument();
      expect(screen.getByTestId('button-abort')).toBeInTheDocument();
      expect(screen.getByTestId('live-view')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility during state changes', () => {
      const { rerender } = render(<CameraControl />);

      // Check initial accessibility
      expect(screen.getByTestId('button-capture')).toHaveAttribute('disabled');

      // Connect camera
      mockCameraState.connected = true;
      rerender(<CameraControl />);

      // Button should be accessible
      expect(screen.getByTestId('button-capture')).not.toHaveAttribute('disabled');
    });

    it('should provide proper ARIA states', () => {
      mockCameraState.connected = true;
      mockCameraState.capturing = true;
      
      render(<CameraControl />);

      // Buttons should have proper states
      const captureButton = screen.getByTestId('button-capture');
      const abortButton = screen.getByTestId('button-abort');

      expect(captureButton).toBeDisabled();
      expect(abortButton).not.toBeDisabled();
    });
  });
});
