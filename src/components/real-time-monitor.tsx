"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress'; // Unused for now
import { cn } from '@/lib/utils';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  // Clock, // Unused for now
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Camera,
  Target,
  // Zap, // Unused for now
  // Wifi, // Unused for now
  Battery,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, EnvironmentalData } from '@/lib/store';
import { simulationEngine, EquipmentHealth } from '@/lib/simulation-engine';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface MetricHistory {
  temperature: DataPoint[];
  humidity: DataPoint[];
  seeing: DataPoint[];
  windSpeed: DataPoint[];
  batteryLevel: DataPoint[];
  trackingError: DataPoint[];
  focusPosition: DataPoint[];
  guideError: DataPoint[];
}

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export function RealTimeMonitor() {
  const {
    environmentalData,
    batteryLevel,
    // sequenceStatus, // Unused for now
    // equipmentStatus, // Unused for now
  } = useAppStore();

  const [isMonitoring, setIsMonitoring] = useState(true);
  const [metricHistory, setMetricHistory] = useState<MetricHistory>({
    temperature: [],
    humidity: [],
    seeing: [],
    windSpeed: [],
    batteryLevel: [],
    trackingError: [],
    focusPosition: [],
    guideError: [],
  });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<keyof MetricHistory>('temperature');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Data collection
  useEffect(() => {
    if (!isMonitoring) return;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const environmentalConditions = simulationEngine.getEnvironmentalConditions();
      const equipmentHealth = simulationEngine.getEquipmentHealth();

      setMetricHistory(prev => {
        const maxPoints = 100; // Keep last 100 data points
        
        const addDataPoint = (array: DataPoint[], value: number) => {
          const newArray = [...array, { timestamp: now, value }];
          return newArray.slice(-maxPoints);
        };

        return {
          temperature: addDataPoint(prev.temperature, environmentalData.temperature),
          humidity: addDataPoint(prev.humidity, environmentalData.humidity),
          seeing: addDataPoint(prev.seeing, environmentalConditions.seeing),
          windSpeed: addDataPoint(prev.windSpeed, environmentalConditions.windSpeed),
          batteryLevel: addDataPoint(prev.batteryLevel, batteryLevel),
          trackingError: addDataPoint(prev.trackingError, equipmentHealth.mount.trackingAccuracy + (Math.random() - 0.5) * 0.5),
          focusPosition: addDataPoint(prev.focusPosition, 15000 + (Math.random() - 0.5) * 100),
          guideError: addDataPoint(prev.guideError, Math.random() * 2),
        };
      });

      // Check for alerts
      checkForAlerts(environmentalConditions, equipmentHealth);
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, environmentalData, batteryLevel]);

  const checkForAlerts = useCallback((envConditions: EnvironmentalData, equipmentHealth: EquipmentHealth) => {
    const newAlerts: AlertItem[] = [];

    // Environmental alerts
    // Wind speed check removed as property doesn't exist in EnvironmentalData

    if (environmentalData.humidity > 90) {
      newAlerts.push({
        id: `humidity-${Date.now()}`,
        type: 'warning',
        message: `High humidity: ${environmentalData.humidity.toFixed(0)}% - Risk of condensation`,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    // Seeing check removed as property doesn't exist in EnvironmentalData

    // Equipment alerts
    if (batteryLevel < 15) {
      newAlerts.push({
        id: `battery-${Date.now()}`,
        type: 'error',
        message: `Critical battery level: ${batteryLevel.toFixed(0)}%`,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    if (equipmentHealth.mount.trackingAccuracy > 3) {
      newAlerts.push({
        id: `tracking-${Date.now()}`,
        type: 'warning',
        message: `Poor tracking accuracy: ${equipmentHealth.mount.trackingAccuracy.toFixed(1)}"`,
        timestamp: new Date(),
        acknowledged: false,
      });
    }

    // Add new alerts
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev.slice(-20), ...newAlerts]); // Keep last 20 alerts
    }
  }, [environmentalData.humidity, batteryLevel]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const getMetricTrend = (metric: keyof MetricHistory) => {
    const data = metricHistory[metric];
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-5);
    const avg1 = recent.slice(0, 2).reduce((sum, p) => sum + p.value, 0) / 2;
    const avg2 = recent.slice(-2).reduce((sum, p) => sum + p.value, 0) / 2;
    
    const change = ((avg2 - avg1) / avg1) * 100;
    if (Math.abs(change) < 1) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-blue-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCurrentValue = (metric: keyof MetricHistory) => {
    const data = metricHistory[metric];
    return data.length > 0 ? data[data.length - 1].value : 0;
  };

  const getMetricUnit = (metric: keyof MetricHistory) => {
    switch (metric) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'seeing': return '"';
      case 'windSpeed': return 'km/h';
      case 'batteryLevel': return '%';
      case 'trackingError': return '"';
      case 'focusPosition': return 'steps';
      case 'guideError': return '"';
      default: return '';
    }
  };

  const getMetricIcon = (metric: keyof MetricHistory) => {
    switch (metric) {
      case 'temperature': return Thermometer;
      case 'humidity': return Droplets;
      case 'seeing': return Eye;
      case 'windSpeed': return Wind;
      case 'batteryLevel': return Battery;
      case 'trackingError': return Target;
      case 'focusPosition': return Camera;
      case 'guideError': return Activity;
      default: return Activity;
    }
  };

  const metrics = [
    { key: 'temperature' as const, name: 'Temperature', color: 'text-orange-500' },
    { key: 'humidity' as const, name: 'Humidity', color: 'text-blue-500' },
    { key: 'seeing' as const, name: 'Seeing', color: 'text-purple-500' },
    { key: 'windSpeed' as const, name: 'Wind Speed', color: 'text-green-500' },
    { key: 'batteryLevel' as const, name: 'Battery', color: 'text-yellow-500' },
    { key: 'trackingError' as const, name: 'Tracking', color: 'text-red-500' },
    { key: 'focusPosition' as const, name: 'Focus', color: 'text-indigo-500' },
    { key: 'guideError' as const, name: 'Guiding', color: 'text-pink-500' },
  ];

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Real-Time Monitor</h2>
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? (
              <>
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Live
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Paused
              </>
            )}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isMonitoring ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setMetricHistory({
              temperature: [],
              humidity: [],
              seeing: [],
              windSpeed: [],
              batteryLevel: [],
              trackingError: [],
              focusPosition: [],
              guideError: [],
            })}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Data
          </Button>
        </div>
      </div>

      {/* Alerts Panel */}
      <AnimatePresence>
        {unacknowledgedAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="h-5 w-5" />
                    Active Alerts ({unacknowledgedAlerts.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={clearAllAlerts}>
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unacknowledgedAlerts.slice(-3).map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-2 rounded bg-white/50 dark:bg-black/20"
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          alert.type === 'error' ? 'bg-red-500' :
                          alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        )} />
                        <span className="text-sm">{alert.message}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = getMetricIcon(metric.key);
          const trend = getMetricTrend(metric.key);
          const value = getCurrentValue(metric.key);
          const unit = getMetricUnit(metric.key);

          return (
            <motion.div
              key={metric.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all",
                  selectedMetric === metric.key && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedMetric(metric.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={cn("h-5 w-5", metric.color)} />
                    {getTrendIcon(trend)}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {value.toFixed(metric.key === 'focusPosition' ? 0 : 1)}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {unit}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">{metric.name}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {metrics.find(m => m.key === selectedMetric)?.name} History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Real-time chart for {metrics.find(m => m.key === selectedMetric)?.name}</p>
              <p className="text-sm">Chart component would be implemented here</p>
              <p className="text-xs mt-2">
                Data points: {metricHistory[selectedMetric].length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RealTimeMonitor;
