"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbPresets } from "@/components/ui/breadcrumb";
import {
  ArrowLeft,
  Activity,
  Settings,
  BarChart3,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Thermometer,
  Zap,
  Info,
  History,
  Wrench,
  Eye
} from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import { useAppStore, CurrentPage } from "@/lib/store";
import { cn } from "@/lib/utils";
import DeviceActions from "./device-actions";
import DeviceMetricsChart from "./device-metrics-chart";

// Device types and their configurations
export interface DeviceConfig {
  id: string;
  name: string;
  model: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  temperature?: number;
  lastUpdated: Date;
  capabilities: string[];
  connectionInfo: {
    type: 'USB' | 'Network' | 'Serial';
    address?: string;
    port?: number;
  };
}

export interface DeviceDetailProps {
  deviceType: 'camera' | 'mount' | 'focuser' | 'filter';
  onBack: () => void;
  onSwipeNavigate?: (page: CurrentPage) => void;
  currentPage?: CurrentPage;
  children?: React.ReactNode;
  className?: string;
}

export interface DeviceMetrics {
  uptime: number;
  commandsExecuted: number;
  errorsCount: number;
  averageResponseTime: number;
  lastError?: string;
  lastErrorTime?: Date;
}

export interface DeviceLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  category: 'connection' | 'command' | 'status' | 'error';
}

export default function EnhancedDeviceDetail({
  deviceType,
  onBack,
  onSwipeNavigate,
  currentPage,
  children,
  className
}: DeviceDetailProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [deviceMetrics, setDeviceMetrics] = useState<DeviceMetrics | null>(null);
  const [deviceLogs, setDeviceLogs] = useState<DeviceLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock device configurations
  const deviceConfigs: Record<string, DeviceConfig> = {
    camera: {
      id: 'camera-001',
      name: 'Main Camera',
      model: 'ZWO ASI2600MC Pro',
      icon: Activity,
      status: 'connected',
      temperature: -10.5,
      lastUpdated: new Date(),
      capabilities: ['Cooling', 'High Resolution', 'Color', 'USB 3.0'],
      connectionInfo: { type: 'USB', address: 'USB3.0' }
    },
    mount: {
      id: 'mount-001',
      name: 'Telescope Mount',
      model: 'Sky-Watcher EQ6-R Pro',
      icon: Activity,
      status: 'connected',
      lastUpdated: new Date(),
      capabilities: ['GoTo', 'Tracking', 'Autoguiding', 'WiFi'],
      connectionInfo: { type: 'Network', address: '192.168.1.100', port: 11111 }
    },
    focuser: {
      id: 'focuser-001',
      name: 'Electronic Focuser',
      model: 'ZWO EAF',
      icon: Activity,
      status: 'connected',
      temperature: 15.2,
      lastUpdated: new Date(),
      capabilities: ['Motorized', 'Temperature Compensation', 'Backlash Compensation'],
      connectionInfo: { type: 'USB', address: 'USB2.0' }
    },
    filter: {
      id: 'filter-001',
      name: 'Filter Wheel',
      model: 'ZWO EFW 8x1.25"',
      icon: Activity,
      status: 'connected',
      temperature: 12.8,
      lastUpdated: new Date(),
      capabilities: ['8 Position', 'Motorized', 'Position Sensing'],
      connectionInfo: { type: 'USB', address: 'USB2.0' }
    }
  };

  // Mock metrics
  const mockMetrics: DeviceMetrics = {
    uptime: 3600000, // 1 hour in ms
    commandsExecuted: 156,
    errorsCount: 2,
    averageResponseTime: 45,
    lastError: 'Temporary communication timeout',
    lastErrorTime: new Date(Date.now() - 300000) // 5 minutes ago
  };

  // Mock logs
  const mockLogs: DeviceLogEntry[] = [
    {
      id: '1',
      timestamp: new Date(),
      level: 'info',
      message: 'Device connected successfully',
      category: 'connection'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 60000),
      level: 'info',
      message: 'Temperature stabilized at target',
      category: 'status'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 300000),
      level: 'warning',
      message: 'Communication timeout, retrying...',
      category: 'error'
    }
  ];

  useEffect(() => {
    // Simulate loading device data
    const timer = setTimeout(() => {
      setDeviceConfig(deviceConfigs[deviceType]);
      setDeviceMetrics(mockMetrics);
      setDeviceLogs(mockLogs);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [deviceType]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      case 'connecting':
        return <Activity className="h-4 w-4 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString();
  };

  if (isLoading || !deviceConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        {...BreadcrumbPresets.deviceDetail(deviceConfig.name, onBack)}
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{deviceConfig.name}</h1>
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", getStatusColor(deviceConfig.status))} />
              {getStatusIcon(deviceConfig.status)}
              <Badge variant={deviceConfig.status === 'connected' ? 'default' : 'secondary'}>
                {deviceConfig.status}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            {deviceConfig.model} • Last updated: {formatTimestamp(deviceConfig.lastUpdated)}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="font-semibold">{formatUptime(deviceMetrics?.uptime || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Commands</p>
                <p className="font-semibold">{deviceMetrics?.commandsExecuted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {deviceConfig.temperature !== undefined && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="font-semibold">{deviceConfig.temperature.toFixed(1)}°C</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Response</p>
                <p className="font-semibold">{deviceMetrics?.averageResponseTime || 0}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Controls
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{deviceConfig.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connection</p>
                  <p className="font-medium">
                    {deviceConfig.connectionInfo.type}
                    {deviceConfig.connectionInfo.address && ` - ${deviceConfig.connectionInfo.address}`}
                    {deviceConfig.connectionInfo.port && `:${deviceConfig.connectionInfo.port}`}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {deviceConfig.capabilities.map((capability, index) => (
                    <Badge key={index} variant="outline">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device-specific content */}
          {children}
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          {/* Device-specific actions and controls */}
          <DeviceActions deviceType={deviceType} />

          {/* Additional device-specific controls from children */}
          {children}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {/* Historical Metrics Chart */}
          <DeviceMetricsChart
            deviceId={deviceConfig.id}
            deviceType={deviceType}
          />

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Commands</p>
                    <p className="text-2xl font-bold">{deviceMetrics?.commandsExecuted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Error Count</p>
                    <p className="text-2xl font-bold text-red-500">{deviceMetrics?.errorsCount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-xl font-semibold">{deviceMetrics?.averageResponseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Connection Stability</p>
                    <p className="text-xl font-semibold">{deviceMetrics?.connectionStability}%</p>
                  </div>
                </div>

                {deviceMetrics?.lastError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Last Error</p>
                    <p className="text-sm text-red-600">{deviceMetrics.lastError}</p>
                    <p className="text-xs text-red-500 mt-1">
                      {deviceMetrics.lastErrorTime && formatTimestamp(deviceMetrics.lastErrorTime)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Device Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {deviceLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2",
                        log.level === 'error' ? 'bg-red-500' :
                        log.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{log.message}</p>
                          <Badge variant="outline" className="text-xs">
                            {log.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
