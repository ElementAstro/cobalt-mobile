"use client";

import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResponsiveGrid, GridLayouts } from '@/components/ui/responsive-grid';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { StatusWidget } from '@/components/ui/status-widget';
import { HelpTooltip } from '@/components/ui/tooltip';
import { HelpOverlay, useHelpOverlay } from '@/components/ui/help-overlay';
import { useComponentMemoryOptimization } from '@/hooks/use-memory-optimization';
import { useDebouncedCallback } from '@/hooks/use-render-optimization';
import { useEnhancedInteractions } from '@/hooks/use-enhanced-interactions';
import { useAccessibility } from '@/hooks/use-accessibility';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { OptimizedMotion, OptimizedAnimatePresence } from '@/components/ui/optimized-motion';
import { cn } from '@/lib/utils';
import {
  Camera,
  Compass,
  Filter,
  Focus,
  Target,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,

  Play,
  Pause,
  Square,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { EquipmentStatus, EnvironmentalData, SequenceStatus } from '@/lib/store';
import { simulationEngine } from '@/lib/simulation-engine';

interface EnhancedDashboardProps {
  equipmentStatus: EquipmentStatus;
  environmentalData: EnvironmentalData;
  sequenceStatus: SequenceStatus;
  startSequence: () => void;
  pauseSequence: () => void;
  stopSequence: () => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

interface EquipmentMetric {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: string;
  value?: string;
  trend?: 'up' | 'down' | 'stable';
  warning?: boolean;
}

export const EnhancedDashboard = memo(function EnhancedDashboard({
  equipmentStatus,
  environmentalData,
  sequenceStatus,
  startSequence,
  pauseSequence,
  stopSequence,

  getStatusText,
}: EnhancedDashboardProps) {
  const [equipmentHealth, setEquipmentHealth] = useState(simulationEngine.getEquipmentHealth());
  const [environmentalConditions, setEnvironmentalConditions] = useState(simulationEngine.getEnvironmentalConditions());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Performance optimizations
  useComponentMemoryOptimization('EnhancedDashboard');

  // Enhanced mobile features
  const { announce } = useAccessibility();
  const { measureInteraction, getOptimizedAnimationConfig } = usePerformanceMonitor();

  // Help system
  const { isOpen: isHelpOpen, openHelp, closeHelp, helpData } = useHelpOverlay();

  // Debounced refresh to prevent excessive API calls
  const handleRefresh = useDebouncedCallback(async () => {
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setEquipmentHealth(simulationEngine.getEquipmentHealth());
    setEnvironmentalConditions(simulationEngine.getEnvironmentalConditions());
    setLastUpdate(new Date());
  }, 1000);

  // Update equipment health and environmental data
  useEffect(() => {
    const interval = setInterval(() => {
      setEquipmentHealth(simulationEngine.getEquipmentHealth());
      setEnvironmentalConditions(simulationEngine.getEnvironmentalConditions());
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const equipmentMetrics: EquipmentMetric[] = [
    {
      name: 'Camera',
      icon: Camera,
      status: equipmentStatus.camera,
      value: `${equipmentHealth.camera.sensorTemp.toFixed(1)}°C`,
      warning: equipmentHealth.camera.sensorTemp > -5,
    },
    {
      name: 'Mount',
      icon: Compass,
      status: equipmentStatus.mount,
      value: `±${equipmentHealth.mount.trackingAccuracy.toFixed(1)}"`,
      warning: equipmentHealth.mount.trackingAccuracy > 2,
    },
    {
      name: 'Filter Wheel',
      icon: Filter,
      status: equipmentStatus.filterWheel,
      value: `${(equipmentHealth.filterWheel.positionAccuracy * 100).toFixed(1)}%`,
      warning: equipmentHealth.filterWheel.positionAccuracy < 0.95,
    },
    {
      name: 'Focuser',
      icon: Focus,
      status: equipmentStatus.focuser,
      value: `±${equipmentHealth.focuser.backlash.toFixed(0)} steps`,
      warning: equipmentHealth.focuser.backlash > 25,
    },
  ];

  const environmentalMetrics = [
    {
      name: 'Temperature',
      icon: Thermometer,
      value: environmentalData.temperature.toFixed(1),
      unit: '°C',
      trend: environmentalConditions.temperature > environmentalData.temperature ? 'up' : 'down',
      warning: environmentalData.temperature < -20 || environmentalData.temperature > 35,
    },
    {
      name: 'Humidity',
      icon: Droplets,
      value: environmentalData.humidity.toFixed(0),
      unit: '%',
      warning: environmentalData.humidity > 85,
    },
    {
      name: 'Seeing',
      icon: Eye,
      value: environmentalConditions.seeing.toFixed(1),
      unit: '"',
      warning: environmentalConditions.seeing > 4,
    },
    {
      name: 'Wind',
      icon: Wind,
      value: environmentalConditions.windSpeed.toFixed(1),
      unit: 'km/h',
      warning: environmentalConditions.windSpeed > 20,
    },
  ];

  const getSequenceStatusColor = () => {
    if (sequenceStatus.running) return 'bg-green-500';
    if (sequenceStatus.paused) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getSequenceStatusText = () => {
    if (sequenceStatus.running) return 'Running';
    if (sequenceStatus.paused) return 'Paused';
    return 'Stopped';
  };

  return (
    <PullToRefreshContainer onRefresh={handleRefresh} className="min-h-screen">
      <div className="space-y-6 pb-6" data-tour="dashboard">
      {/* Quick Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                System Status
                <HelpTooltip
                  title="System Status"
                  description="Monitor the connection status and health of all your astrophotography equipment. Green indicates ready, yellow means disconnected, red shows errors."
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => openHelp('dashboard')}
                  >
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </HelpTooltip>
              </div>
              <Badge variant="outline" className="text-xs">
                Updated {lastUpdate.toLocaleTimeString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveGrid {...GridLayouts.metrics} data-tour="equipment-status">
              {equipmentMetrics.map((metric) => (
                <StatusWidget
                  key={metric.name}
                  title={metric.name}
                  value={getStatusText(metric.status)}
                  status={metric.status === 'connected' ? 'success' :
                          metric.status === 'disconnected' ? 'warning' : 'error'}
                  icon={metric.icon}
                  lastUpdated={lastUpdate}
                  onRefresh={handleRefresh}
                  animated={true}
                  compact={true}
                >
                  {metric.value && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {metric.value}
                    </div>
                  )}
                </StatusWidget>
              ))}
            </ResponsiveGrid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Environmental Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-primary" />
              Environmental Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveGrid columns={{ xs: 2, md: 4 }} gap="compact">
              <StatusWidget
                title="Temperature"
                value={environmentalConditions.temperature}
                unit="°C"
                status={environmentalConditions.temperature > 25 ? 'warning' :
                        environmentalConditions.temperature < -10 ? 'error' : 'success'}
                icon={Thermometer}
                trend={{
                  direction: environmentalConditions.temperature > 20 ? 'up' : 'down',
                  value: Math.abs(environmentalConditions.temperature - 15),
                }}
                lastUpdated={lastUpdate}
                compact={true}
              />

              <StatusWidget
                title="Humidity"
                value={environmentalConditions.humidity}
                unit="%"
                status={environmentalConditions.humidity > 80 ? 'warning' : 'success'}
                icon={Droplets}
                progress={{
                  value: environmentalConditions.humidity,
                  max: 100,
                  showPercentage: false,
                }}
                lastUpdated={lastUpdate}
                compact={true}
              />

              <StatusWidget
                title="Wind Speed"
                value={environmentalConditions.windSpeed}
                unit="km/h"
                status={environmentalConditions.windSpeed > 20 ? 'warning' : 'success'}
                icon={Wind}
                trend={{
                  direction: environmentalConditions.windSpeed > 10 ? 'up' : 'stable',
                }}
                lastUpdated={lastUpdate}
                compact={true}
              />

              <StatusWidget
                title="Sky Quality"
                value={environmentalConditions.skyQuality}
                unit="mag/arcsec²"
                status={environmentalConditions.skyQuality < 18 ? 'warning' : 'success'}
                icon={Eye}
                trend={{
                  direction: environmentalConditions.skyQuality > 20 ? 'up' : 'down',
                  label: environmentalConditions.skyQuality > 20 ? 'Excellent' : 'Good',
                }}
                lastUpdated={lastUpdate}
                compact={true}
              />
            </ResponsiveGrid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Equipment Health Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Environmental Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {environmentalMetrics.map((metric, index) => (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    metric.warning ? "bg-yellow-50 dark:bg-yellow-950" : "bg-muted/50"
                  )}
                >
                  <metric.icon className={cn(
                    "h-5 w-5",
                    metric.warning ? "text-yellow-600" : "text-muted-foreground"
                  )} />
                  <div>
                    <p className="text-sm font-medium">{metric.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold">
                        {metric.value}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {metric.unit}
                      </span>
                      {metric.trend && (
                        <div className="ml-1">
                          {metric.trend === 'up' ? (
                            <TrendingUp className="h-3 w-3 text-red-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sequence Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Sequence Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Display */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-3 w-3 rounded-full",
                    getSequenceStatusColor(),
                    sequenceStatus.running && "animate-pulse"
                  )} />
                  <span className="font-medium">
                    {getSequenceStatusText()}
                  </span>
                  {sequenceStatus.running && (
                    <Badge variant="outline">
                      Step {sequenceStatus.currentStep + 1} of {sequenceStatus.totalSteps}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Progress: {sequenceStatus.progress.toFixed(1)}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress 
                  value={sequenceStatus.progress} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {sequenceStatus.running ? 'Running...' : 'Ready'}
                  </span>
                  <span>
                    {sequenceStatus.totalSteps} steps total
                  </span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={startSequence}
                  disabled={sequenceStatus.running}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
                <Button
                  onClick={pauseSequence}
                  disabled={!sequenceStatus.running}
                  variant="outline"
                  className="flex-1"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={stopSequence}
                  disabled={!sequenceStatus.running && !sequenceStatus.paused}
                  variant="destructive"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>

      {/* Help Overlay */}
      <HelpOverlay
        isOpen={isHelpOpen}
        onClose={closeHelp}
        title={helpData.title}
        items={helpData.items}
      />
    </PullToRefreshContainer>
  );
});

export default EnhancedDashboard;
