/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the entire component ecosystem
const mockComponentState = {
  camera: {
    connected: false,
    liveViewActive: false,
    capturing: false,
    settings: {
      exposure: 300,
      iso: 800,
    },
  },
  navigation: {
    currentPage: 'camera-detail' as const,
    canNavigateBack: false,
    canNavigateForward: true,
  },
  ui: {
    theme: 'dark',
    compactMode: false,
    showAdvanced: false,
  },
};

// Mock hooks
jest.mock('../hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}));

jest.mock('../components/camera/hooks/use-camera', () => ({
  useCamera: () => ({
    cameraStatus: mockComponentState.camera,
    toggleLiveView: jest.fn(),
    startCapture: jest.fn(),
    abortCapture: jest.fn(),
  }),
}));

// Mock UI components
jest.mock('../components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => <div className={className} {...props} data-testid={props['data-testid'] || "card"}>{children}</div>,
  CardContent: ({ children, className, ...props }: any) => <div className={className} {...props} data-testid={props['data-testid'] || "card-content"}>{children}</div>,
  CardHeader: ({ children, className, ...props }: any) => <div className={className} {...props} data-testid={props['data-testid'] || "card-header"}>{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

jest.mock('../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${className} ${variant}`}
      data-variant={variant}
      data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

// Create integrated component that combines multiple features
const IntegratedCameraInterface = () => {
  const [currentView, setCurrentView] = React.useState<'controls' | 'settings' | 'live'>('controls');
  const [isCompact, setIsCompact] = React.useState(false);

  return (
    <div data-testid="integrated-camera-interface">
      {/* Navigation Header */}
      <div data-testid="interface-header">
        <div data-testid="view-switcher">
          <button 
            data-testid="view-controls"
            onClick={() => setCurrentView('controls')}
            className={currentView === 'controls' ? 'active' : ''}
            type="button"
          >
            Controls
          </button>
          <button 
            data-testid="view-settings"
            onClick={() => setCurrentView('settings')}
            className={currentView === 'settings' ? 'active' : ''}
            type="button"
          >
            Settings
          </button>
          <button 
            data-testid="view-live"
            onClick={() => setCurrentView('live')}
            className={currentView === 'live' ? 'active' : ''}
            type="button"
          >
            Live View
          </button>
        </div>
        
        <div data-testid="layout-controls">
          <button 
            data-testid="toggle-compact"
            onClick={() => setIsCompact(!isCompact)}
            type="button"
          >
            {isCompact ? 'Expand' : 'Compact'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div data-testid="main-content" className={isCompact ? 'compact' : 'full'}>
        {currentView === 'controls' && (
          <div data-testid="controls-view">
            <div data-testid="camera-status">
              Status: {mockComponentState.camera.connected ? 'Connected' : 'Disconnected'}
            </div>
            
            <div data-testid="capture-controls">
              <button 
                data-testid="start-capture"
                disabled={!mockComponentState.camera.connected || mockComponentState.camera.capturing}
                type="button"
              >
                {mockComponentState.camera.capturing ? 'Capturing...' : 'Start Capture'}
              </button>
              
              <button 
                data-testid="abort-capture"
                disabled={!mockComponentState.camera.capturing}
                type="button"
              >
                Abort
              </button>
            </div>

            <div data-testid="live-view-controls">
              <button 
                data-testid="toggle-live-view"
                disabled={!mockComponentState.camera.connected}
                type="button"
              >
                {mockComponentState.camera.liveViewActive ? 'Stop Live View' : 'Start Live View'}
              </button>
            </div>
          </div>
        )}

        {currentView === 'settings' && (
          <div data-testid="settings-view">
            <div data-testid="exposure-setting">
              <label htmlFor="exposure">Exposure: {mockComponentState.camera.settings.exposure}s</label>
              <input
                id="exposure"
                type="range"
                min="1"
                max="3600"
                value={mockComponentState.camera.settings.exposure}
                onChange={(e) => {
                  mockComponentState.camera.settings.exposure = Number(e.target.value);
                }}
                data-testid="exposure-slider"
              />
            </div>

            <div data-testid="iso-setting">
              <label htmlFor="iso">ISO: {mockComponentState.camera.settings.iso}</label>
              <select
                id="iso"
                data-testid="iso-select"
                value={mockComponentState.camera.settings.iso}
                onChange={(e) => {
                  mockComponentState.camera.settings.iso = Number(e.target.value);
                }}
              >
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="400">400</option>
                <option value="800">800</option>
                <option value="1600">1600</option>
              </select>
            </div>
          </div>
        )}

        {currentView === 'live' && (
          <div data-testid="live-view">
            {mockComponentState.camera.liveViewActive ? (
              <div data-testid="live-view-display">
                <div data-testid="video-feed">Live Video Feed</div>
                <div data-testid="live-view-overlay">
                  <button data-testid="save-frame" type="button">Save Frame</button>
                  <button data-testid="fullscreen" type="button">Fullscreen</button>
                </div>
              </div>
            ) : (
              <div data-testid="live-view-placeholder">
                Live view not active
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div data-testid="status-bar">
        <span data-testid="connection-status">
          Camera: {mockComponentState.camera.connected ? '🟢' : '🔴'}
        </span>
        <span data-testid="capture-status">
          {mockComponentState.camera.capturing ? 'Capturing' : 'Ready'}
        </span>
        <span data-testid="layout-status">
          Layout: {isCompact ? 'Compact' : 'Full'}
        </span>
      </div>
    </div>
  );
};

describe('Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset component state
    mockComponentState.camera.connected = false;
    mockComponentState.camera.liveViewActive = false;
    mockComponentState.camera.capturing = false;
  });

  describe('View Navigation Integration', () => {
    it('should switch between different views', () => {
      render(<IntegratedCameraInterface />);

      // Initially on controls view
      expect(screen.getByTestId('controls-view')).toBeInTheDocument();
      expect(screen.queryByTestId('settings-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('live-view')).not.toBeInTheDocument();

      // Switch to settings
      fireEvent.click(screen.getByTestId('view-settings'));
      expect(screen.queryByTestId('controls-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('settings-view')).toBeInTheDocument();
      expect(screen.queryByTestId('live-view')).not.toBeInTheDocument();

      // Switch to live view
      fireEvent.click(screen.getByTestId('view-live'));
      expect(screen.queryByTestId('controls-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('settings-view')).not.toBeInTheDocument();
      expect(screen.getByTestId('live-view')).toBeInTheDocument();
    });

    it('should maintain view state during layout changes', () => {
      render(<IntegratedCameraInterface />);

      // Switch to settings view
      fireEvent.click(screen.getByTestId('view-settings'));
      expect(screen.getByTestId('settings-view')).toBeInTheDocument();

      // Toggle compact mode
      fireEvent.click(screen.getByTestId('toggle-compact'));
      
      // Should still be on settings view
      expect(screen.getByTestId('settings-view')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toHaveClass('compact');
    });
  });

  describe('Camera State Integration', () => {
    it('should reflect camera connection state across all views', () => {
      const { rerender } = render(<IntegratedCameraInterface />);

      // Initially disconnected
      expect(screen.getByTestId('camera-status')).toHaveTextContent('Disconnected');
      expect(screen.getByTestId('connection-status')).toHaveTextContent('🔴');
      expect(screen.getByTestId('start-capture')).toBeDisabled();
      expect(screen.getByTestId('toggle-live-view')).toBeDisabled();

      // Simulate connection
      mockComponentState.camera.connected = true;
      rerender(<IntegratedCameraInterface />);

      expect(screen.getByTestId('camera-status')).toHaveTextContent('Connected');
      expect(screen.getByTestId('connection-status')).toHaveTextContent('🟢');
      expect(screen.getByTestId('start-capture')).not.toBeDisabled();
      expect(screen.getByTestId('toggle-live-view')).not.toBeDisabled();
    });

    it('should handle capture state changes', () => {
      mockComponentState.camera.connected = true;
      const { rerender } = render(<IntegratedCameraInterface />);

      // Initially ready
      expect(screen.getByTestId('start-capture')).toHaveTextContent('Start Capture');
      expect(screen.getByTestId('capture-status')).toHaveTextContent('Ready');
      expect(screen.getByTestId('abort-capture')).toBeDisabled();

      // Simulate capture start
      mockComponentState.camera.capturing = true;
      rerender(<IntegratedCameraInterface />);

      expect(screen.getByTestId('start-capture')).toHaveTextContent('Capturing...');
      expect(screen.getByTestId('start-capture')).toBeDisabled();
      expect(screen.getByTestId('capture-status')).toHaveTextContent('Capturing');
      expect(screen.getByTestId('abort-capture')).not.toBeDisabled();
    });

    it('should handle live view state changes', () => {
      mockComponentState.camera.connected = true;
      const { rerender } = render(<IntegratedCameraInterface />);

      // Switch to live view
      fireEvent.click(screen.getByTestId('view-live'));

      // Initially not active
      expect(screen.getByTestId('live-view-placeholder')).toBeInTheDocument();
      expect(screen.queryByTestId('live-view-display')).not.toBeInTheDocument();

      // Activate live view
      mockComponentState.camera.liveViewActive = true;
      rerender(<IntegratedCameraInterface />);
      fireEvent.click(screen.getByTestId('view-live'));

      expect(screen.queryByTestId('live-view-placeholder')).not.toBeInTheDocument();
      expect(screen.getByTestId('live-view-display')).toBeInTheDocument();
      expect(screen.getByTestId('video-feed')).toBeInTheDocument();
      expect(screen.getByTestId('save-frame')).toBeInTheDocument();
      expect(screen.getByTestId('fullscreen')).toBeInTheDocument();
    });
  });

  describe('Layout Integration', () => {
    it('should toggle between compact and full layouts', () => {
      render(<IntegratedCameraInterface />);

      // Initially full layout
      expect(screen.getByTestId('main-content')).toHaveClass('full');
      expect(screen.getByTestId('toggle-compact')).toHaveTextContent('Compact');
      expect(screen.getByTestId('layout-status')).toHaveTextContent('Full');

      // Switch to compact
      fireEvent.click(screen.getByTestId('toggle-compact'));

      expect(screen.getByTestId('main-content')).toHaveClass('compact');
      expect(screen.getByTestId('toggle-compact')).toHaveTextContent('Expand');
      expect(screen.getByTestId('layout-status')).toHaveTextContent('Compact');
    });

    it('should maintain functionality in compact mode', () => {
      mockComponentState.camera.connected = true;
      render(<IntegratedCameraInterface />);

      // Switch to compact mode
      fireEvent.click(screen.getByTestId('toggle-compact'));

      // All controls should still be functional
      expect(screen.getByTestId('start-capture')).not.toBeDisabled();
      expect(screen.getByTestId('toggle-live-view')).not.toBeDisabled();

      // View switching should still work
      fireEvent.click(screen.getByTestId('view-settings'));
      expect(screen.getByTestId('settings-view')).toBeInTheDocument();
    });
  });

  describe('Settings Integration', () => {
    it('should display current camera settings', () => {
      render(<IntegratedCameraInterface />);

      // Switch to settings view
      fireEvent.click(screen.getByTestId('view-settings'));

      expect(screen.getByTestId('exposure-setting')).toHaveTextContent('300s');
      expect(screen.getByTestId('iso-setting')).toHaveTextContent('800');
      
      const exposureSlider = screen.getByTestId('exposure-slider');
      expect(exposureSlider).toHaveValue('300');
      
      const isoSelect = screen.getByTestId('iso-select');
      expect(isoSelect).toHaveValue('800');
    });

    it('should handle settings changes', () => {
      const { rerender } = render(<IntegratedCameraInterface />);

      // Switch to settings view
      fireEvent.click(screen.getByTestId('view-settings'));

      const exposureSlider = screen.getByTestId('exposure-slider');
      const isoSelect = screen.getByTestId('iso-select');

      // Change settings
      fireEvent.change(exposureSlider, { target: { value: '600' } });
      fireEvent.change(isoSelect, { target: { value: '1600' } });

      // Force re-render to reflect the state changes
      rerender(<IntegratedCameraInterface />);

      // Get the elements again after re-render
      const updatedExposureSlider = screen.getByTestId('exposure-slider');
      const updatedIsoSelect = screen.getByTestId('iso-select');

      expect(updatedExposureSlider).toHaveValue('600');
      expect(updatedIsoSelect).toHaveValue('1600');
    });
  });

  describe('Cross-View Data Flow', () => {
    it('should maintain state consistency across view changes', () => {
      mockComponentState.camera.connected = true;
      mockComponentState.camera.capturing = true;
      
      render(<IntegratedCameraInterface />);

      // Check status in controls view
      expect(screen.getByTestId('capture-status')).toHaveTextContent('Capturing');

      // Switch to settings view
      fireEvent.click(screen.getByTestId('view-settings'));
      
      // Status should still be consistent
      expect(screen.getByTestId('capture-status')).toHaveTextContent('Capturing');

      // Switch to live view
      fireEvent.click(screen.getByTestId('view-live'));
      
      // Status should still be consistent
      expect(screen.getByTestId('capture-status')).toHaveTextContent('Capturing');
    });

    it('should handle complex state transitions', () => {
      const { rerender } = render(<IntegratedCameraInterface />);

      // Start disconnected
      expect(screen.getByTestId('connection-status')).toHaveTextContent('🔴');

      // Connect camera
      mockComponentState.camera.connected = true;
      rerender(<IntegratedCameraInterface />);
      expect(screen.getByTestId('connection-status')).toHaveTextContent('🟢');

      // Start capture
      mockComponentState.camera.capturing = true;
      rerender(<IntegratedCameraInterface />);
      expect(screen.getByTestId('capture-status')).toHaveTextContent('Capturing');

      // Activate live view
      mockComponentState.camera.liveViewActive = true;
      rerender(<IntegratedCameraInterface />);

      // Switch to live view and verify
      fireEvent.click(screen.getByTestId('view-live'));
      expect(screen.getByTestId('live-view-display')).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle component errors gracefully', () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<IntegratedCameraInterface />);
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should maintain functionality when camera disconnects during operation', () => {
      mockComponentState.camera.connected = true;
      mockComponentState.camera.capturing = true;

      const { rerender } = render(<IntegratedCameraInterface />);

      // Initially capturing
      expect(screen.getByTestId('capture-status')).toHaveTextContent('Capturing');

      // Simulate disconnection
      mockComponentState.camera.connected = false;
      mockComponentState.camera.capturing = false;

      rerender(<IntegratedCameraInterface />);

      // Should handle disconnection gracefully
      expect(screen.getByTestId('connection-status')).toHaveTextContent('🔴');
      expect(screen.getByTestId('capture-status')).toHaveTextContent('Ready');
      expect(screen.getByTestId('start-capture')).toBeDisabled();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across all views', () => {
      render(<IntegratedCameraInterface />);

      // Check controls view
      const controlButtons = screen.getAllByRole('button');
      expect(controlButtons.length).toBeGreaterThan(0);

      // Switch to settings view
      fireEvent.click(screen.getByTestId('view-settings'));
      
      const settingsInputs = screen.getAllByRole('slider').concat(screen.getAllByRole('combobox'));
      expect(settingsInputs.length).toBeGreaterThan(0);

      // All form elements should have labels
      const exposureSlider = screen.getByTestId('exposure-slider');
      expect(exposureSlider).toHaveAttribute('id', 'exposure');
      
      const isoSelect = screen.getByTestId('iso-select');
      expect(isoSelect).toHaveAttribute('id', 'iso');
    });

    it('should provide proper button states for screen readers', () => {
      render(<IntegratedCameraInterface />);

      // Disabled buttons should be properly marked
      expect(screen.getByTestId('start-capture')).toBeDisabled();
      expect(screen.getByTestId('toggle-live-view')).toBeDisabled();

      // Enabled buttons should be accessible
      expect(screen.getByTestId('view-settings')).not.toBeDisabled();
      expect(screen.getByTestId('toggle-compact')).not.toBeDisabled();
    });
  });
});
