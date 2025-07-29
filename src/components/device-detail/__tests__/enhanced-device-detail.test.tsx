import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedDeviceDetail } from '../enhanced-device-detail';
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
  ArrowLeft: ({ className }: any) => <span className={className} data-testid="arrow-left">←</span>,
  Activity: ({ className }: any) => <span className={className} data-testid="activity">⚡</span>,
  Settings: ({ className }: any) => <span className={className} data-testid="settings">⚙️</span>,
  BarChart3: ({ className }: any) => <span className={className} data-testid="bar-chart">📊</span>,
  Clock: ({ className }: any) => <span className={className} data-testid="clock">🕐</span>,
  Wifi: ({ className }: any) => <span className={className} data-testid="wifi">📶</span>,
  WifiOff: ({ className }: any) => <span className={className} data-testid="wifi-off">📵</span>,
  AlertTriangle: ({ className }: any) => <span className={className} data-testid="alert">⚠️</span>,
  CheckCircle: ({ className }: any) => <span className={className} data-testid="check">✅</span>,
  Thermometer: ({ className }: any) => <span className={className} data-testid="thermometer">🌡️</span>,
  Zap: ({ className }: any) => <span className={className} data-testid="zap">⚡</span>,
  Info: ({ className }: any) => <span className={className} data-testid="info">ℹ️</span>,
  History: ({ className }: any) => <span className={className} data-testid="history">📜</span>,
  Wrench: ({ className }: any) => <span className={className} data-testid="wrench">🔧</span>,
  Eye: ({ className }: any) => <span className={className} data-testid="eye">👁️</span>,
  ChevronRight: ({ className }: any) => <span className={className} data-testid="chevron-right">→</span>,
  Home: ({ className }: any) => <span className={className} data-testid="home">🏠</span>,
}));

// Mock UI components
jest.mock('@/components/ui/breadcrumb', () => ({
  Breadcrumb: ({ items }: any) => (
    <nav data-testid="breadcrumb">
      {items.map((item: any, index: number) => (
        <span key={index} onClick={item.onClick}>
          {item.label}
        </span>
      ))}
    </nav>
  ),
  BreadcrumbPresets: {
    deviceDetail: (deviceName: string, onBack: () => void) => ({
      items: [
        { label: 'Equipment', onClick: onBack },
        { label: deviceName, current: true }
      ]
    })
  }
}));

const mockStoreState = {
  devices: {
    'camera-001': {
      info: {
        id: 'camera-001',
        name: 'Test Camera',
        model: 'ZWO ASI2600MC Pro',
        manufacturer: 'ZWO',
        firmwareVersion: '1.2.3',
        serialNumber: 'ASI2600MC-12345',
        connectionType: 'USB' as const,
        connectionAddress: 'USB3.0',
        lastConnected: new Date(),
        capabilities: ['Cooling', 'High Resolution', 'Color', 'USB 3.0']
      },
      metrics: {
        uptime: 3600000,
        commandsExecuted: 156,
        errorsCount: 2,
        averageResponseTime: 45,
        lastError: 'Test error',
        lastErrorTime: new Date(),
        dataTransferred: 1024000,
        connectionStability: 95
      },
      logs: [
        {
          id: '1',
          timestamp: new Date(),
          level: 'info' as const,
          message: 'Device connected',
          category: 'connection' as const,
          deviceId: 'camera-001'
        }
      ],
      historicalData: [],
      isOnline: true,
      lastUpdate: new Date()
    }
  },
  getDevice: jest.fn(),
  getDeviceHistoricalData: jest.fn(() => []),
};

describe('EnhancedDeviceDetail', () => {
  const mockOnBack = jest.fn();
  const mockOnSwipeNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as jest.Mock).mockReturnValue(mockStoreState);
  });

  it('renders device detail page with correct information', async () => {
    render(
      <EnhancedDeviceDetail
        deviceType="camera"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="camera-detail"
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Check if device name is displayed
    expect(screen.getByText('Main Camera')).toBeInTheDocument();
    
    // Check if model is displayed
    expect(screen.getByText(/ZWO ASI2600MC Pro/)).toBeInTheDocument();
    
    // Check if status badge is displayed
    expect(screen.getByText('connected')).toBeInTheDocument();
  });

  it('displays breadcrumb navigation', async () => {
    render(
      <EnhancedDeviceDetail
        deviceType="camera"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="camera-detail"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
    });

    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Main Camera')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    render(
      <EnhancedDeviceDetail
        deviceType="camera"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="camera-detail"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('arrow-left')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('arrow-left').closest('button')!);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('displays quick stats correctly', async () => {
    render(
      <EnhancedDeviceDetail
        deviceType="camera"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="camera-detail"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Uptime')).toBeInTheDocument();
    });

    expect(screen.getByText('Commands')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Response')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(
      <EnhancedDeviceDetail
        deviceType="camera"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="camera-detail"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Check if all tabs are present
    expect(screen.getByText('Controls')).toBeInTheDocument();
    expect(screen.getByText('Metrics')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();

    // Click on Controls tab
    fireEvent.click(screen.getByText('Controls'));
    
    // Click on Metrics tab
    fireEvent.click(screen.getByText('Metrics'));
    
    // Click on Logs tab
    fireEvent.click(screen.getByText('Logs'));
  });

  it('displays device capabilities', async () => {
    render(
      <EnhancedDeviceDetail
        deviceType="camera"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="camera-detail"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Capabilities')).toBeInTheDocument();
    });

    expect(screen.getByText('Cooling')).toBeInTheDocument();
    expect(screen.getByText('High Resolution')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('USB 3.0')).toBeInTheDocument();
  });

  it('displays connection information', async () => {
    render(
      <EnhancedDeviceDetail
        deviceType="camera"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="camera-detail"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Connection')).toBeInTheDocument();
    });

    expect(screen.getByText('USB - USB3.0')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(
      <EnhancedDeviceDetail
        deviceType="camera"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="camera-detail"
      />
    );

    // Should show loading spinner initially
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('handles different device types correctly', async () => {
    const { rerender } = render(
      <EnhancedDeviceDetail
        deviceType="mount"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="mount-detail"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Telescope Mount')).toBeInTheDocument();
    });

    // Test focuser
    rerender(
      <EnhancedDeviceDetail
        deviceType="focuser"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="focuser-detail"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Electronic Focuser')).toBeInTheDocument();
    });

    // Test filter wheel
    rerender(
      <EnhancedDeviceDetail
        deviceType="filter"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="filter-detail"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Filter Wheel')).toBeInTheDocument();
    });
  });

  it('displays error information when present', async () => {
    render(
      <EnhancedDeviceDetail
        deviceType="camera"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="camera-detail"
      />
    );

    // Switch to metrics tab to see error information
    await waitFor(() => {
      expect(screen.getByText('Metrics')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Metrics'));

    await waitFor(() => {
      expect(screen.getByText('Last Error')).toBeInTheDocument();
    });
  });

  it('renders device logs in logs tab', async () => {
    render(
      <EnhancedDeviceDetail
        deviceType="camera"
        onBack={mockOnBack}
        onSwipeNavigate={mockOnSwipeNavigate}
        currentPage="camera-detail"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Logs')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Logs'));

    await waitFor(() => {
      expect(screen.getByText('Device Logs')).toBeInTheDocument();
    });

    expect(screen.getByText('Device connected')).toBeInTheDocument();
  });
});
