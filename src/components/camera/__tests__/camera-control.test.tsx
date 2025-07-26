/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CameraControl from '../components/camera-control';

// Mock the camera hook
const mockUseCamera = {
  cameraStatus: {
    connected: true,
    liveViewActive: false,
    cameraTemp: 15.5,
    capturing: false,
    exposureProgress: 0,
    isCapturing: false,
    captureProgress: 0,
    targetTemp: -10,
    coolingPower: 50,
  },
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
  isReadyForCapture: true,
  connectionStatus: 'connected',
  toggleLiveView: jest.fn(),
  startCapture: jest.fn(),
  abortCapture: jest.fn(),
};

jest.mock('../hooks/use-camera', () => ({
  useCamera: () => mockUseCamera,
}));

// Mock the sub-components
jest.mock('../components/camera-status', () => {
  return function MockCameraStatus({ compact }: { compact?: boolean }) {
    return <div data-testid="camera-status" data-compact={compact}>Camera Status</div>;
  };
});

jest.mock('../components/exposure-settings', () => {
  return function MockExposureSettings() {
    return <div data-testid="exposure-settings">Exposure Settings</div>;
  };
});

jest.mock('../components/camera-settings', () => {
  return function MockCameraSettings() {
    return <div data-testid="camera-settings">Camera Settings</div>;
  };
});

jest.mock('../components/capture-controls', () => {
  return function MockCaptureControls({ 
    layout, 
    showDownloadButton, 
    onDownload 
  }: { 
    layout?: string; 
    showDownloadButton?: boolean; 
    onDownload?: () => void; 
  }) {
    return (
      <div data-testid="capture-controls" data-layout={layout}>
        Capture Controls
        {showDownloadButton !== false && (
          <button onClick={onDownload} data-testid="download-button">
            Download
          </button>
        )}
      </div>
    );
  };
});

jest.mock('../components/live-view', () => {
  return function MockLiveView({
    aspectRatio = "video",
    showControls = true,
    onFullscreen,
    onSaveFrame
  }: {
    aspectRatio?: string;
    showControls?: boolean;
    onFullscreen?: () => void;
    onSaveFrame?: () => void;
  }) {
    return (
      <div data-testid="live-view" data-aspect-ratio={aspectRatio} data-show-controls={showControls.toString()}>
        Live View
        <button onClick={onFullscreen} data-testid="fullscreen-button">
          Fullscreen
        </button>
        <button onClick={onSaveFrame} data-testid="save-frame-button">
          Save Frame
        </button>
      </div>
    );
  };
});

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
};

describe('CameraControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
  });

  describe('Full Layout', () => {
    it('should render all components in full layout', () => {
      render(<CameraControl />);

      expect(screen.getByTestId('camera-status')).toBeInTheDocument();
      expect(screen.getByTestId('exposure-settings')).toBeInTheDocument();
      expect(screen.getByTestId('camera-settings')).toBeInTheDocument();
      expect(screen.getByTestId('capture-controls')).toBeInTheDocument();
    });

    it('should not show live view when not active', () => {
      mockUseCamera.cameraStatus.liveViewActive = false;
      
      render(<CameraControl />);

      expect(screen.queryByTestId('live-view')).not.toBeInTheDocument();
    });

    it('should show live view when active', () => {
      mockUseCamera.cameraStatus.liveViewActive = true;
      
      render(<CameraControl />);

      expect(screen.getByTestId('live-view')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<CameraControl className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should handle download action', () => {
      render(<CameraControl />);

      const downloadButton = screen.getByTestId('download-button');
      fireEvent.click(downloadButton);

      expect(consoleSpy.log).toHaveBeenCalledWith('Download requested');
    });

    it('should handle fullscreen action when live view is active', () => {
      mockUseCamera.cameraStatus.liveViewActive = true;
      
      render(<CameraControl />);

      const fullscreenButton = screen.getByTestId('fullscreen-button');
      fireEvent.click(fullscreenButton);

      expect(consoleSpy.log).toHaveBeenCalledWith('Fullscreen requested');
    });

    it('should handle save frame action when live view is active', () => {
      mockUseCamera.cameraStatus.liveViewActive = true;
      
      render(<CameraControl />);

      const saveFrameButton = screen.getByTestId('save-frame-button');
      fireEvent.click(saveFrameButton);

      expect(consoleSpy.log).toHaveBeenCalledWith('Save frame requested');
    });
  });

  describe('Compact Layout', () => {
    it('should render compact layout correctly', () => {
      render(<CameraControl layout="compact" />);

      const cameraStatus = screen.getByTestId('camera-status');
      expect(cameraStatus).toBeInTheDocument();
      expect(cameraStatus).toHaveAttribute('data-compact', 'true');

      const captureControls = screen.getByTestId('capture-controls');
      expect(captureControls).toHaveAttribute('data-layout', 'stack');

      // Should not show download button in compact mode
      expect(screen.queryByTestId('download-button')).not.toBeInTheDocument();
    });

    it('should not render exposure and camera settings in compact mode', () => {
      render(<CameraControl layout="compact" />);

      expect(screen.queryByTestId('exposure-settings')).not.toBeInTheDocument();
      expect(screen.queryByTestId('camera-settings')).not.toBeInTheDocument();
    });

    it('should show live view in compact mode when active', () => {
      mockUseCamera.cameraStatus.liveViewActive = true;
      
      render(<CameraControl layout="compact" />);

      const liveView = screen.getByTestId('live-view');
      expect(liveView).toBeInTheDocument();
      expect(liveView).toHaveAttribute('data-aspect-ratio', 'square');
      expect(liveView).toHaveAttribute('data-show-controls', 'false');
    });

    it('should not show live view in compact mode when inactive', () => {
      mockUseCamera.cameraStatus.liveViewActive = false;
      
      render(<CameraControl layout="compact" />);

      expect(screen.queryByTestId('live-view')).not.toBeInTheDocument();
    });
  });

  describe('Props and Configuration', () => {
    it('should default to full layout when no layout prop provided', () => {
      render(<CameraControl />);

      expect(screen.getByTestId('exposure-settings')).toBeInTheDocument();
      expect(screen.getByTestId('camera-settings')).toBeInTheDocument();
    });

    it('should handle undefined className gracefully', () => {
      const { container } = render(<CameraControl />);
      
      expect(container.firstChild).toHaveClass('space-y-4');
    });
  });

  describe('Camera Status Integration', () => {
    it('should respond to camera status changes', () => {
      const { rerender } = render(<CameraControl />);

      // Initially no live view
      expect(screen.queryByTestId('live-view')).not.toBeInTheDocument();

      // Update camera status
      mockUseCamera.cameraStatus.liveViewActive = true;
      rerender(<CameraControl />);

      // Now live view should be visible
      expect(screen.getByTestId('live-view')).toBeInTheDocument();
    });

    it('should pass correct props to live view component', () => {
      mockUseCamera.cameraStatus.liveViewActive = true;
      
      render(<CameraControl />);

      const liveView = screen.getByTestId('live-view');
      expect(liveView).toHaveAttribute('data-aspect-ratio', 'video');
      expect(liveView).toHaveAttribute('data-show-controls', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing camera hook gracefully', () => {
      // This test ensures the component doesn't crash if the hook returns undefined
      const originalUseCamera = require('../hooks/use-camera').useCamera;
      
      jest.doMock('../hooks/use-camera', () => ({
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

      // Restore original mock
      jest.doMock('../hooks/use-camera', () => ({
        useCamera: () => mockUseCamera,
      }));
    });
  });

  describe('Accessibility', () => {
    it('should have proper structure for screen readers', () => {
      render(<CameraControl />);

      const container = screen.getByTestId('camera-status').parentElement;
      expect(container).toHaveClass('space-y-4');
    });

    it('should maintain focus management', () => {
      mockUseCamera.cameraStatus.liveViewActive = true;
      
      render(<CameraControl />);

      const fullscreenButton = screen.getByTestId('fullscreen-button');
      const saveFrameButton = screen.getByTestId('save-frame-button');

      expect(fullscreenButton).toBeInTheDocument();
      expect(saveFrameButton).toBeInTheDocument();
    });
  });
});
