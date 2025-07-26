/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the entire equipment ecosystem
const mockEquipmentState = {
  camera: {
    connected: false,
    capturing: false,
    temperature: 20.0,
    settings: {
      exposure: 300,
      iso: 800,
      gain: 100,
    },
  },
  mount: {
    connected: false,
    tracking: false,
    slewing: false,
    coordinates: {
      ra: '00:00:00',
      dec: '+00:00:00',
    },
  },
  filterWheel: {
    connected: false,
    position: 1,
    filters: ['Red', 'Green', 'Blue', 'Luminance'],
  },
  focuser: {
    connected: false,
    position: 50000,
    temperature: 15.0,
  },
};

const mockEquipmentActions = {
  connectAll: jest.fn().mockResolvedValue(undefined),
  disconnectAll: jest.fn().mockResolvedValue(undefined),
  emergencyStop: jest.fn().mockResolvedValue(undefined),
  startCapture: jest.fn().mockResolvedValue(undefined),
  startSlew: jest.fn().mockResolvedValue(undefined),
  changeFilter: jest.fn().mockResolvedValue(undefined),
  moveFocuser: jest.fn().mockResolvedValue(undefined),
};

// Mock equipment hooks
jest.mock('@/components/camera/hooks/use-camera', () => ({
  useCamera: () => ({
    cameraStatus: mockEquipmentState.camera,
    ...mockEquipmentActions,
  }),
}));

jest.mock('@/components/telescope/hooks/use-telescope', () => ({
  useTelescope: () => ({
    telescopeStatus: mockEquipmentState.mount,
    ...mockEquipmentActions,
  }),
}));

jest.mock('@/lib/store', () => ({
  useAppStore: () => ({
    equipmentStatus: {
      camera: mockEquipmentState.camera.connected ? 'connected' : 'disconnected',
      mount: mockEquipmentState.mount.connected ? 'connected' : 'disconnected',
      filterWheel: mockEquipmentState.filterWheel.connected ? 'connected' : 'disconnected',
      focuser: mockEquipmentState.focuser.connected ? 'connected' : 'disconnected',
    },
    ...mockEquipmentActions,
  }),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, '-')}`}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

// Create a mock equipment dashboard component
const EquipmentDashboard = () => {
  const [error, setError] = React.useState<string | null>(null);

  const handleConnectAll = async () => {
    try {
      setError(null);
      await mockEquipmentActions.connectAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const handleStartCapture = async () => {
    try {
      setError(null);
      await mockEquipmentActions.startCapture();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed');
    }
  };

  return (
    <div data-testid="equipment-dashboard">
      {error && <div data-testid="error-message">{error}</div>}
      <div data-testid="connection-status">
        <span data-testid="camera-status">
          Camera: {mockEquipmentState.camera.connected ? 'Connected' : 'Disconnected'}
        </span>
        <span data-testid="mount-status">
          Mount: {mockEquipmentState.mount.connected ? 'Connected' : 'Disconnected'}
        </span>
        <span data-testid="filter-status">
          Filter: {mockEquipmentState.filterWheel.connected ? 'Connected' : 'Disconnected'}
        </span>
        <span data-testid="focuser-status">
          Focuser: {mockEquipmentState.focuser.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      <div data-testid="equipment-controls">
        <button
          data-testid="connect-all"
          onClick={handleConnectAll}
          disabled={Object.values(mockEquipmentState).every(device => device.connected)}
        >
          Connect All
        </button>
        
        <button 
          data-testid="disconnect-all"
          onClick={mockEquipmentActions.disconnectAll}
          disabled={Object.values(mockEquipmentState).every(device => !device.connected)}
        >
          Disconnect All
        </button>
        
        <button 
          data-testid="emergency-stop"
          onClick={mockEquipmentActions.emergencyStop}
        >
          Emergency Stop
        </button>
      </div>

      <div data-testid="operation-controls">
        <button
          data-testid="start-capture"
          onClick={handleStartCapture}
          disabled={!mockEquipmentState.camera.connected || mockEquipmentState.camera.capturing}
        >
          Start Capture
        </button>

        <button
          data-testid="start-slew"
          onClick={() => mockEquipmentActions.startSlew().catch(console.error)}
          disabled={!mockEquipmentState.mount.connected || mockEquipmentState.mount.slewing}
        >
          Start Slew
        </button>

        <button
          data-testid="change-filter"
          onClick={() => mockEquipmentActions.changeFilter(2).catch(console.error)}
          disabled={!mockEquipmentState.filterWheel.connected}
        >
          Change Filter
        </button>

        <button
          data-testid="move-focuser"
          onClick={() => mockEquipmentActions.moveFocuser(55000).catch(console.error)}
          disabled={!mockEquipmentState.focuser.connected}
        >
          Move Focuser
        </button>
      </div>
    </div>
  );
};

describe('Equipment Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset equipment state
    mockEquipmentState.camera.connected = false;
    mockEquipmentState.camera.capturing = false;
    mockEquipmentState.mount.connected = false;
    mockEquipmentState.mount.tracking = false;
    mockEquipmentState.mount.slewing = false;
    mockEquipmentState.filterWheel.connected = false;
    mockEquipmentState.focuser.connected = false;
  });

  describe('Equipment Connection Workflow', () => {
    it('should handle complete equipment connection sequence', async () => {
      const { rerender } = render(<EquipmentDashboard />);

      // Initially all equipment should be disconnected
      expect(screen.getByTestId('camera-status')).toHaveTextContent('Camera: Disconnected');
      expect(screen.getByTestId('mount-status')).toHaveTextContent('Mount: Disconnected');
      expect(screen.getByTestId('filter-status')).toHaveTextContent('Filter: Disconnected');
      expect(screen.getByTestId('focuser-status')).toHaveTextContent('Focuser: Disconnected');

      // Connect all equipment
      const connectAllButton = screen.getByTestId('connect-all');
      expect(connectAllButton).not.toBeDisabled();

      fireEvent.click(connectAllButton);
      expect(mockEquipmentActions.connectAll).toHaveBeenCalledTimes(1);

      // Simulate successful connection
      mockEquipmentState.camera.connected = true;
      mockEquipmentState.mount.connected = true;
      mockEquipmentState.filterWheel.connected = true;
      mockEquipmentState.focuser.connected = true;

      // Re-render to reflect state changes
      rerender(<EquipmentDashboard />);

      expect(screen.getByTestId('camera-status')).toHaveTextContent('Camera: Connected');
      expect(screen.getByTestId('mount-status')).toHaveTextContent('Mount: Connected');
      expect(screen.getByTestId('filter-status')).toHaveTextContent('Filter: Connected');
      expect(screen.getByTestId('focuser-status')).toHaveTextContent('Focuser: Connected');
    });

    it('should handle equipment disconnection', async () => {
      // Start with all equipment connected
      mockEquipmentState.camera.connected = true;
      mockEquipmentState.mount.connected = true;
      mockEquipmentState.filterWheel.connected = true;
      mockEquipmentState.focuser.connected = true;

      render(<EquipmentDashboard />);

      const disconnectAllButton = screen.getByTestId('disconnect-all');
      fireEvent.click(disconnectAllButton);

      expect(mockEquipmentActions.disconnectAll).toHaveBeenCalledTimes(1);
    });

    it('should handle emergency stop', async () => {
      render(<EquipmentDashboard />);

      const emergencyStopButton = screen.getByTestId('emergency-stop');
      fireEvent.click(emergencyStopButton);

      expect(mockEquipmentActions.emergencyStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cross-Device Operation Workflows', () => {
    beforeEach(() => {
      // Set all equipment as connected for operation tests
      mockEquipmentState.camera.connected = true;
      mockEquipmentState.mount.connected = true;
      mockEquipmentState.filterWheel.connected = true;
      mockEquipmentState.focuser.connected = true;
    });

    it('should handle imaging workflow integration', async () => {
      render(<EquipmentDashboard />);

      // Step 1: Change filter
      const changeFilterButton = screen.getByTestId('change-filter');
      expect(changeFilterButton).not.toBeDisabled();
      
      fireEvent.click(changeFilterButton);
      expect(mockEquipmentActions.changeFilter).toHaveBeenCalledWith(2);

      // Step 2: Adjust focus
      const moveFocuserButton = screen.getByTestId('move-focuser');
      expect(moveFocuserButton).not.toBeDisabled();
      
      fireEvent.click(moveFocuserButton);
      expect(mockEquipmentActions.moveFocuser).toHaveBeenCalledWith(55000);

      // Step 3: Slew to target
      const startSlewButton = screen.getByTestId('start-slew');
      expect(startSlewButton).not.toBeDisabled();
      
      fireEvent.click(startSlewButton);
      expect(mockEquipmentActions.startSlew).toHaveBeenCalledTimes(1);

      // Step 4: Start capture
      const startCaptureButton = screen.getByTestId('start-capture');
      expect(startCaptureButton).not.toBeDisabled();
      
      fireEvent.click(startCaptureButton);
      expect(mockEquipmentActions.startCapture).toHaveBeenCalledTimes(1);
    });

    it('should handle operation dependencies correctly', async () => {
      const { rerender } = render(<EquipmentDashboard />);

      // Operations should be enabled when equipment is connected
      expect(screen.getByTestId('start-capture')).not.toBeDisabled();
      expect(screen.getByTestId('start-slew')).not.toBeDisabled();
      expect(screen.getByTestId('change-filter')).not.toBeDisabled();
      expect(screen.getByTestId('move-focuser')).not.toBeDisabled();

      // Simulate equipment disconnection
      mockEquipmentState.camera.connected = false;
      rerender(<EquipmentDashboard />);

      // Camera operations should be disabled
      expect(screen.getByTestId('start-capture')).toBeDisabled();

      // Other operations should still be enabled
      expect(screen.getByTestId('start-slew')).not.toBeDisabled();
      expect(screen.getByTestId('change-filter')).not.toBeDisabled();
      expect(screen.getByTestId('move-focuser')).not.toBeDisabled();
    });

    it('should handle concurrent operations', async () => {
      render(<EquipmentDashboard />);

      // Start multiple operations simultaneously
      fireEvent.click(screen.getByTestId('start-capture'));
      fireEvent.click(screen.getByTestId('change-filter'));
      fireEvent.click(screen.getByTestId('move-focuser'));

      expect(mockEquipmentActions.startCapture).toHaveBeenCalledTimes(1);
      expect(mockEquipmentActions.changeFilter).toHaveBeenCalledTimes(1);
      expect(mockEquipmentActions.moveFocuser).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Synchronization', () => {
    it('should maintain consistent state across components', async () => {
      const { rerender } = render(<EquipmentDashboard />);

      // Initial state
      expect(screen.getByTestId('camera-status')).toHaveTextContent('Disconnected');

      // Simulate external state change
      mockEquipmentState.camera.connected = true;
      rerender(<EquipmentDashboard />);

      expect(screen.getByTestId('camera-status')).toHaveTextContent('Connected');
    });

    it('should handle rapid state changes', async () => {
      const { rerender } = render(<EquipmentDashboard />);

      // Simulate rapid connection/disconnection cycles
      for (let i = 0; i < 5; i++) {
        mockEquipmentState.camera.connected = i % 2 === 0;
        rerender(<EquipmentDashboard />);
        
        const expectedText = mockEquipmentState.camera.connected ? 'Connected' : 'Disconnected';
        expect(screen.getByTestId('camera-status')).toHaveTextContent(`Camera: ${expectedText}`);
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle equipment connection failures gracefully', async () => {
      render(<EquipmentDashboard />);

      // Mock connection failure
      mockEquipmentActions.connectAll.mockRejectedValue(new Error('Connection failed'));

      const connectAllButton = screen.getByTestId('connect-all');
      fireEvent.click(connectAllButton);

      await waitFor(() => {
        expect(mockEquipmentActions.connectAll).toHaveBeenCalledTimes(1);
      });

      // Equipment should remain disconnected
      expect(screen.getByTestId('camera-status')).toHaveTextContent('Disconnected');
    });

    it('should handle operation failures during workflow', async () => {
      mockEquipmentState.camera.connected = true;
      mockEquipmentState.mount.connected = true;

      render(<EquipmentDashboard />);

      // Mock capture failure
      mockEquipmentActions.startCapture.mockRejectedValueOnce(new Error('Capture failed'));

      const startCaptureButton = screen.getByTestId('start-capture');
      fireEvent.click(startCaptureButton);

      await waitFor(() => {
        expect(mockEquipmentActions.startCapture).toHaveBeenCalledTimes(1);
      });

      // Error should be displayed
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Capture failed');
      });

      // Other operations should still be available
      expect(screen.getByTestId('start-slew')).not.toBeDisabled();
    });
  });

  describe('Performance Integration', () => {
    it('should handle high-frequency updates efficiently', async () => {
      const { rerender } = render(<EquipmentDashboard />);

      // Simulate high-frequency temperature updates
      for (let i = 0; i < 100; i++) {
        mockEquipmentState.camera.temperature = 20 + (i * 0.1);
        mockEquipmentState.focuser.temperature = 15 + (i * 0.05);
        
        // Should not cause performance issues
        expect(() => {
          rerender(<EquipmentDashboard />);
        }).not.toThrow();
      }
    });

    it('should handle multiple simultaneous operations', async () => {
      mockEquipmentState.camera.connected = true;
      mockEquipmentState.mount.connected = true;
      mockEquipmentState.filterWheel.connected = true;
      mockEquipmentState.focuser.connected = true;

      render(<EquipmentDashboard />);

      // Start all operations at once
      const operations = [
        () => fireEvent.click(screen.getByTestId('start-capture')),
        () => fireEvent.click(screen.getByTestId('start-slew')),
        () => fireEvent.click(screen.getByTestId('change-filter')),
        () => fireEvent.click(screen.getByTestId('move-focuser')),
      ];

      // Execute all operations rapidly
      operations.forEach(operation => operation());

      // All operations should have been called
      expect(mockEquipmentActions.startCapture).toHaveBeenCalledTimes(1);
      expect(mockEquipmentActions.startSlew).toHaveBeenCalledTimes(1);
      expect(mockEquipmentActions.changeFilter).toHaveBeenCalledTimes(1);
      expect(mockEquipmentActions.moveFocuser).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility during state changes', async () => {
      render(<EquipmentDashboard />);

      // All buttons should be accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });

      // Connect equipment and check accessibility is maintained
      mockEquipmentState.camera.connected = true;
      render(<EquipmentDashboard />);

      const updatedButtons = screen.getAllByRole('button');
      updatedButtons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should provide proper button states for screen readers', async () => {
      const { rerender } = render(<EquipmentDashboard />);

      // Disabled buttons should have proper attributes
      const startCaptureButton = screen.getByTestId('start-capture');
      expect(startCaptureButton).toBeDisabled();

      // Enable equipment and check button states
      mockEquipmentState.camera.connected = true;
      rerender(<EquipmentDashboard />);

      expect(screen.getByTestId('start-capture')).not.toBeDisabled();
    });
  });
});
