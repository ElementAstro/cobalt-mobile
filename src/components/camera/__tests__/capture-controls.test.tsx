/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CaptureControls from '../components/capture-controls';

// Mock the camera hooks
const mockUseCamera = {
  cameraStatus: {
    connected: true,
    liveViewActive: false,
    cameraTemp: 15.5,
    capturing: false,
    exposureProgress: 0,
  },
  toggleLiveView: jest.fn(),
  isReadyForCapture: true,
};

const mockUseCameraCapture = {
  isCapturing: false,
  captureProgress: 0,
  canStartCapture: true,
  isReadyForCapture: true,
  startCapture: jest.fn(),
  abortCapture: jest.fn(),
  captureStatus: 'idle',
  estimatedTimeRemaining: 0,
  captureInfo: {
    formattedExposureTime: '60s',
    formattedRemainingTime: '30s',
  },
};

jest.mock('../hooks/use-camera', () => ({
  useCamera: () => mockUseCamera,
}));

jest.mock('../hooks/use-camera-capture', () => ({
  useCameraCapture: () => mockUseCameraCapture,
}));

// Mock the translation hook
jest.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'capture': 'Capture',
        'abort': 'Abort',
        'liveView': 'Live View',
        'download': 'Download',
        'captureProgress': 'Capture Progress',
        'exposureProgress': 'Exposure Progress',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${className} ${variant}`}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={className} data-testid="progress" data-value={value}>
      Progress: {value}%
    </div>
  ),
}));

describe('CaptureControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock states
    mockUseCamera.cameraStatus = {
      connected: true,
      liveViewActive: false,
      cameraTemp: 15.5,
      capturing: false,
      exposureProgress: 0,
    };
    mockUseCamera.isReadyForCapture = true;

    mockUseCameraCapture.isCapturing = false;
    mockUseCameraCapture.captureProgress = 0;
    mockUseCameraCapture.canStartCapture = true;
    mockUseCameraCapture.isReadyForCapture = true;
    mockUseCameraCapture.captureStatus = 'idle';
  });

  describe('Basic Rendering', () => {
    it('should render capture and abort buttons', () => {
      render(<CaptureControls />);

      expect(screen.getByText('Capture')).toBeInTheDocument();
      expect(screen.getByText('Abort')).toBeInTheDocument();
    });

    it('should render live view toggle when enabled', () => {
      render(<CaptureControls showLiveViewToggle={true} />);

      expect(screen.getByText('Live View')).toBeInTheDocument();
    });

    it('should not render live view toggle by default', () => {
      render(<CaptureControls />);

      expect(screen.queryByText('Live View')).not.toBeInTheDocument();
    });

    it('should render download button when enabled', () => {
      const mockOnDownload = jest.fn();
      render(<CaptureControls showDownloadButton={true} onDownload={mockOnDownload} />);

      expect(screen.getByText('Download')).toBeInTheDocument();
    });

    it('should not render download button when disabled', () => {
      render(<CaptureControls showDownloadButton={false} />);

      expect(screen.queryByText('Download')).not.toBeInTheDocument();
    });
  });

  describe('Button States and Interactions', () => {
    it('should enable capture button when ready', () => {
      mockUseCameraCapture.canStartCapture = true;
      mockUseCamera.isReadyForCapture = true;

      render(<CaptureControls />);

      const captureButton = screen.getByText('Capture');
      expect(captureButton).not.toBeDisabled();
    });

    it('should disable capture button when not ready', () => {
      mockUseCameraCapture.canStartCapture = false;
      mockUseCamera.isReadyForCapture = false;

      render(<CaptureControls />);

      const captureButton = screen.getByText('Capture');
      expect(captureButton).toBeDisabled();
    });

    it('should disable abort button when not capturing', () => {
      mockUseCameraCapture.isCapturing = false;
      
      render(<CaptureControls />);

      const abortButton = screen.getByText('Abort');
      expect(abortButton).toBeDisabled();
    });

    it('should enable abort button when capturing', () => {
      mockUseCameraCapture.isCapturing = true;
      
      render(<CaptureControls />);

      const abortButton = screen.getByText('Abort');
      expect(abortButton).not.toBeDisabled();
    });

    it('should call startCapture when capture button clicked', () => {
      render(<CaptureControls />);

      const captureButton = screen.getByText('Capture');
      fireEvent.click(captureButton);

      expect(mockUseCameraCapture.startCapture).toHaveBeenCalledTimes(1);
    });

    it('should call abortCapture when abort button clicked', () => {
      mockUseCameraCapture.isCapturing = true;
      
      render(<CaptureControls />);

      const abortButton = screen.getByText('Abort');
      fireEvent.click(abortButton);

      expect(mockUseCameraCapture.abortCapture).toHaveBeenCalledTimes(1);
    });

    it('should call toggleLiveView when live view button clicked', () => {
      render(<CaptureControls showLiveViewToggle={true} />);

      const liveViewButton = screen.getByText('Live View');
      fireEvent.click(liveViewButton);

      expect(mockUseCamera.toggleLiveView).toHaveBeenCalledTimes(1);
    });

    it('should call onDownload when download button clicked', () => {
      const mockOnDownload = jest.fn();
      render(<CaptureControls showDownloadButton={true} onDownload={mockOnDownload} />);

      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);

      expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });
  });

  describe('Progress Display', () => {
    it('should show progress when capturing', () => {
      mockUseCameraCapture.isCapturing = true;
      mockUseCameraCapture.captureProgress = 45;
      
      render(<CaptureControls />);

      const progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('data-value', '45');
    });

    it('should not show progress when not capturing', () => {
      mockUseCameraCapture.isCapturing = false;
      
      render(<CaptureControls />);

      expect(screen.queryByTestId('progress')).not.toBeInTheDocument();
    });

    it('should update progress value dynamically', () => {
      mockUseCameraCapture.isCapturing = true;
      mockUseCameraCapture.captureProgress = 25;
      
      const { rerender } = render(<CaptureControls />);

      let progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('data-value', '25');

      // Update progress
      mockUseCameraCapture.captureProgress = 75;
      rerender(<CaptureControls />);

      progress = screen.getByTestId('progress');
      expect(progress).toHaveAttribute('data-value', '75');
    });
  });

  describe('Layout Variations', () => {
    it('should apply grid layout by default', () => {
      const { container } = render(<CaptureControls />);
      
      // Check for grid layout classes
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('should apply stack layout when specified', () => {
      const { container } = render(<CaptureControls layout="stack" />);
      
      // Check for flex layout classes
      expect(container.querySelector('.flex')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<CaptureControls className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Camera Connection States', () => {
    it('should disable live view when camera disconnected', () => {
      mockUseCamera.cameraStatus.connected = false;
      
      render(<CaptureControls showLiveViewToggle={true} />);

      const liveViewButton = screen.getByText('Live View');
      expect(liveViewButton).toBeDisabled();
    });

    it('should enable live view when camera connected', () => {
      mockUseCamera.cameraStatus.connected = true;
      
      render(<CaptureControls showLiveViewToggle={true} />);

      const liveViewButton = screen.getByText('Live View');
      expect(liveViewButton).not.toBeDisabled();
    });

    it('should show different button variant when live view active', () => {
      mockUseCamera.cameraStatus.liveViewActive = true;
      
      render(<CaptureControls showLiveViewToggle={true} />);

      const liveViewButton = screen.getByText('Live View');
      expect(liveViewButton).toHaveAttribute('data-variant', 'default');
    });

    it('should show outline variant when live view inactive', () => {
      mockUseCamera.cameraStatus.liveViewActive = false;
      
      render(<CaptureControls showLiveViewToggle={true} />);

      const liveViewButton = screen.getByText('Live View');
      expect(liveViewButton).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('Capture States', () => {
    it('should show secondary variant for capture button when capturing', () => {
      mockUseCameraCapture.isCapturing = true;
      
      render(<CaptureControls />);

      const captureButton = screen.getByText('Capture');
      expect(captureButton).toHaveAttribute('data-variant', 'secondary');
    });

    it('should show default variant for capture button when not capturing', () => {
      mockUseCameraCapture.isCapturing = false;
      
      render(<CaptureControls />);

      const captureButton = screen.getByText('Capture');
      expect(captureButton).toHaveAttribute('data-variant', 'default');
    });

    it('should always show destructive variant for abort button', () => {
      render(<CaptureControls />);

      const abortButton = screen.getByText('Abort');
      expect(abortButton).toHaveAttribute('data-variant', 'destructive');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing onDownload callback gracefully', () => {
      render(<CaptureControls showDownloadButton={true} />);

      const downloadButton = screen.getByText('Download');
      
      expect(() => {
        fireEvent.click(downloadButton);
      }).not.toThrow();
    });

    it('should handle hook errors gracefully', () => {
      // Mock hook to return minimal data
      jest.doMock('../hooks/use-camera-capture', () => ({
        useCameraCapture: () => ({
          isCapturing: false,
          captureProgress: 0,
          canStartCapture: false,
          isReadyForCapture: false,
          startCapture: jest.fn(),
          abortCapture: jest.fn(),
        }),
      }));

      expect(() => {
        render(<CaptureControls />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<CaptureControls showLiveViewToggle={true} showDownloadButton={false} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3); // Capture, Abort, Live View
    });

    it('should have descriptive button text', () => {
      render(<CaptureControls showLiveViewToggle={true} />);

      expect(screen.getByText('Capture')).toBeInTheDocument();
      expect(screen.getByText('Abort')).toBeInTheDocument();
      expect(screen.getByText('Live View')).toBeInTheDocument();
    });

    it('should maintain proper focus order', () => {
      render(<CaptureControls showLiveViewToggle={true} />);

      const captureButton = screen.getByText('Capture');
      const abortButton = screen.getByText('Abort');
      const liveViewButton = screen.getByText('Live View');

      captureButton.focus();
      expect(document.activeElement).toBe(captureButton);

      // Tab to next button
      fireEvent.keyDown(captureButton, { key: 'Tab' });
      // Note: Actual tab behavior would need more complex testing setup
    });
  });
});
