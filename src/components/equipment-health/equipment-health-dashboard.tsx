"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useEquipmentHealthStore } from '@/lib/stores/equipment-health-store';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Download,
  Eye,
  EyeOff,
  Heart,
  RefreshCw,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wrench,
  Zap,
  XCircle
} from 'lucide-react';

interface EquipmentHealthDashboardProps {
  className?: string;
  compact?: boolean;
}

export function EquipmentHealthDashboard({ className, compact = false }: EquipmentHealthDashboardProps) {
  const {
    components,
    selectedComponentId,
    healthStatuses,
    lastHealthUpdate,
    monitoringEnabled,
    updateInterval,
    activeAlerts,
    alertSettings,
    upcomingMaintenance,
    systemOverview,
    viewMode,
    selectedTimeRange,
    showOfflineComponents,
    selectComponent,
    updateComponentHealth,
    updateAllComponentsHealth,
    setMonitoringEnabled,
    setUpdateInterval,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    updateAlertSettings,
    setViewMode,
    setSelectedTimeRange,
    setShowOfflineComponents,
    getComponentHealth,
    getHealthyComponents,
    getComponentsNeedingAttention,
    getCriticalAlerts,
    getOverdueMaintenance,
    exportHealthData
  } = useEquipmentHealthStore();

  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    // Initial health update if monitoring is enabled
    if (monitoringEnabled && components.length > 0) {
      updateAllComponentsHealth();
    }
  }, [monitoringEnabled, components.length]);

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent': return CheckCircle;
      case 'good': return Shield;
      case 'warning': return AlertTriangle;
      case 'critical': return ShieldAlert;
      case 'offline': return XCircle;
      default: return Activity;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      case 'offline': return 'text-gray-500';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'warning': return 'outline';
      case 'critical': return 'destructive';
      case 'offline': return 'secondary';
      default: return 'outline';
    }
  };

  const handleRefreshHealth = async () => {
    await updateAllComponentsHealth();
  };

  const handleExportData = () => {
    const data = exportHealthData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment-health-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Equipment Health
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={systemOverview.overallScore >= 80 ? 'default' : 'destructive'} className="text-xs">
                {systemOverview.overallScore}%
              </Badge>
              {monitoringEnabled && (
                <Activity className="h-3 w-3 text-green-500 animate-pulse" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{systemOverview.healthyComponents} Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>{systemOverview.warningComponents} Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span>{systemOverview.criticalComponents} Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-gray-500" />
              <span>{systemOverview.offlineComponents} Offline</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">System Health</span>
            <div className="flex items-center gap-2">
              <Progress value={systemOverview.overallScore} className="w-16 h-2" />
              <span className="text-xs font-medium">{systemOverview.overallScore}%</span>
            </div>
          </div>

          {activeAlerts.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{activeAlerts.length} active alert(s)</span>
            </div>
          )}

          {(upcomingMaintenance || []).length > 0 && (
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Wrench className="h-3 w-3" />
              <span>{(upcomingMaintenance || []).length} maintenance due</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshHealth}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonitoringEnabled(!monitoringEnabled)}
              className="flex-1"
            >
              {monitoringEnabled ? (
                <Eye className="h-3 w-3 mr-2" />
              ) : (
                <EyeOff className="h-3 w-3 mr-2" />
              )}
              {monitoringEnabled ? 'On' : 'Off'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Equipment Health</h2>
          <p className="text-muted-foreground">
            Monitor equipment performance and predict maintenance needs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshHealth}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">System Health</p>
                <p className="text-2xl font-bold">{systemOverview.overallScore}%</p>
                <p className="text-xs text-muted-foreground">Overall Score</p>
              </div>
              <div className="flex flex-col items-center">
                <Heart className="h-8 w-8 text-muted-foreground" />
                {monitoringEnabled && (
                  <Activity className="h-4 w-4 mt-1 text-green-500 animate-pulse" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Alerts</p>
                <p className="text-2xl font-bold">{systemOverview.activeAlerts}</p>
                <p className="text-xs text-muted-foreground">
                  {getCriticalAlerts().length} critical
                </p>
              </div>
              <AlertTriangle className={cn(
                "h-8 w-8",
                systemOverview.activeAlerts > 0 ? "text-orange-500" : "text-muted-foreground"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Components</p>
                <p className="text-2xl font-bold">{systemOverview.totalComponents}</p>
                <p className="text-xs text-muted-foreground">
                  {systemOverview.healthyComponents} healthy
                </p>
              </div>
              <Cpu className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Maintenance</p>
                <p className="text-2xl font-bold">{systemOverview.upcomingMaintenance}</p>
                <p className="text-xs text-muted-foreground">
                  {getOverdueMaintenance().length} overdue
                </p>
              </div>
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Active Alerts ({activeAlerts.length})
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={acknowledgeAllAlerts}
              >
                Acknowledge All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeAlerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                      {alert.severity}
                    </Badge>
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {alert.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => acknowledgeAlert('', alert.timestamp)}
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
              {activeAlerts.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  And {activeAlerts.length - 5} more alerts...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Components</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label>Show offline components</Label>
              <Switch
                checked={showOfflineComponents}
                onCheckedChange={setShowOfflineComponents}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Last updated: {lastHealthUpdate?.toLocaleTimeString() || 'Never'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {components
              .filter(component => {
                if (!showOfflineComponents) {
                  const health = getComponentHealth(component.id);
                  return health?.overall !== 'offline';
                }
                return true;
              })
              .map((component) => {
                const health = getComponentHealth(component.id);
                const HealthIcon = getHealthIcon(health?.overall || 'offline');
                
                return (
                  <Card 
                    key={component.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedComponentId === component.id && "ring-2 ring-primary"
                    )}
                    onClick={() => selectComponent(component.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          <HealthIcon className={cn("h-5 w-5", getHealthColor(health?.overall || 'offline'))} />
                          <span>{component.name}</span>
                        </div>
                        <Badge variant={getHealthBadgeVariant(health?.overall || 'offline')}>
                          {health?.overall || 'offline'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Health Score</span>
                          <div className="flex items-center gap-2">
                            <Progress value={health?.score || 0} className="w-16 h-2" />
                            <span className="text-sm font-medium">{health?.score || 0}%</span>
                          </div>
                        </div>

                        {health && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Thermometer className="h-3 w-3 text-muted-foreground" />
                              <span>{health.metrics.temperature.toFixed(1)}°C</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Zap className="h-3 w-3 text-muted-foreground" />
                              <span>{health.metrics.power.toFixed(1)}W</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{health.metrics.operatingTime.toFixed(1)}h</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="h-3 w-3 text-muted-foreground" />
                              <span>{health.metrics.responseTime}ms</span>
                            </div>
                          </div>
                        )}

                        {health?.alerts && health.alerts.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-orange-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{health.alerts.length} alert(s)</span>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateComponentHealth(component.id);
                          }}
                          className="w-full"
                        >
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Update Health
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for equipment alerts
                    </p>
                  </div>
                  <Switch
                    checked={alertSettings.enableNotifications}
                    onCheckedChange={(checked) => updateAlertSettings({ enableNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Critical Alerts Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Only show critical severity alerts
                    </p>
                  </div>
                  <Switch
                    checked={alertSettings.criticalAlertsOnly}
                    onCheckedChange={(checked) => updateAlertSettings({ criticalAlertsOnly: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sound Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sound for new alerts
                    </p>
                  </div>
                  <Switch
                    checked={alertSettings.soundAlerts}
                    onCheckedChange={(checked) => updateAlertSettings({ soundAlerts: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active alerts</p>
                  <p className="text-sm">All equipment is operating normally</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map((alert, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                          {alert.severity}
                        </Badge>
                        <div>
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.type} • {alert.timestamp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeAlert('', alert.timestamp)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              {(upcomingMaintenance || []).length === 0 ? (
                <div className="text-center text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming maintenance</p>
                  <p className="text-sm">All equipment is up to date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(upcomingMaintenance || []).slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{item.component.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.type} maintenance • Due: {item.dueDate.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant={item.dueDate < new Date() ? 'destructive' : 'outline'}>
                        {item.dueDate < new Date() ? 'Overdue' : 'Scheduled'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Monitoring</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically monitor equipment health
                  </p>
                </div>
                <Switch
                  checked={monitoringEnabled}
                  onCheckedChange={setMonitoringEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Update Interval (seconds)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[updateInterval]}
                    onValueChange={([value]) => setUpdateInterval(value)}
                    min={10}
                    max={300}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">{updateInterval}s</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  How often to check equipment health
                </p>
              </div>

              <div className="space-y-2">
                <Label>Time Range</Label>
                <div className="flex gap-2">
                  {(['1h', '6h', '24h', '7d', '30d'] as const).map((range) => (
                    <Button
                      key={range}
                      variant={selectedTimeRange === range ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimeRange(range)}
                    >
                      {range}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
