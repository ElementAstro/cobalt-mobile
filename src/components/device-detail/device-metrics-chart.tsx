"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Clock,
  Thermometer,
  Zap,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from "@/lib/store";

export interface MetricsChartProps {
  deviceId: string;
  deviceType: 'camera' | 'mount' | 'focuser' | 'filter';
  className?: string;
}

interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label: string;
}

interface MetricSummary {
  current: number;
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

export default function DeviceMetricsChart({ deviceId, deviceType, className }: MetricsChartProps) {
  const { getDeviceHistoricalData, getDevice } = useAppStore();
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeRange, setTimeRange] = useState('1h');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [metricSummary, setMetricSummary] = useState<MetricSummary | null>(null);

  // Generate mock historical data
  const generateMockData = (metric: string, hours: number): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const now = new Date();
    const interval = (hours * 60) / 50; // 50 data points

    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now.getTime() - (49 - i) * interval * 60 * 1000);
      let value: number;

      switch (metric) {
        case 'temperature':
          value = -10 + Math.sin(i * 0.1) * 2 + Math.random() * 0.5;
          break;
        case 'performance':
          value = 95 + Math.sin(i * 0.05) * 3 + Math.random() * 2;
          break;
        case 'responseTime':
          value = 45 + Math.sin(i * 0.08) * 10 + Math.random() * 5;
          break;
        case 'position':
          value = 15420 + Math.sin(i * 0.03) * 100 + Math.random() * 20;
          break;
        default:
          value = Math.random() * 100;
      }

      data.push({
        timestamp,
        value,
        label: timestamp.toLocaleTimeString()
      });
    }

    return data;
  };

  // Calculate metric summary
  const calculateSummary = (data: ChartDataPoint[], unit: string): MetricSummary => {
    if (data.length === 0) {
      return {
        current: 0,
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
        unit
      };
    }

    const values = data.map(d => d.value);
    const current = values[values.length - 1];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend based on last 10 data points
    const recentValues = values.slice(-10);
    const firstHalf = recentValues.slice(0, 5).reduce((sum, val) => sum + val, 0) / 5;
    const secondHalf = recentValues.slice(5).reduce((sum, val) => sum + val, 0) / 5;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    const change = Math.abs(secondHalf - firstHalf);
    if (change > average * 0.02) { // 2% change threshold
      trend = secondHalf > firstHalf ? 'up' : 'down';
    }

    return {
      current,
      average,
      min,
      max,
      trend,
      unit
    };
  };

  // Get available metrics for device type
  const getAvailableMetrics = () => {
    const common = [
      { id: 'performance', name: 'Performance', unit: '%', icon: Activity },
      { id: 'responseTime', name: 'Response Time', unit: 'ms', icon: Clock }
    ];

    switch (deviceType) {
      case 'camera':
        return [
          { id: 'temperature', name: 'Temperature', unit: '°C', icon: Thermometer },
          ...common
        ];
      case 'mount':
        return [
          ...common,
          { id: 'position', name: 'Position Accuracy', unit: 'arcsec', icon: Activity }
        ];
      case 'focuser':
        return [
          { id: 'temperature', name: 'Temperature', unit: '°C', icon: Thermometer },
          { id: 'position', name: 'Position', unit: 'steps', icon: Activity },
          ...common
        ];
      case 'filter':
        return [
          { id: 'temperature', name: 'Temperature', unit: '°C', icon: Thermometer },
          ...common
        ];
      default:
        return common;
    }
  };

  const availableMetrics = getAvailableMetrics();

  useEffect(() => {
    const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24;
    const data = generateMockData(selectedMetric, hours);
    setChartData(data);

    const metric = availableMetrics.find(m => m.id === selectedMetric);
    const summary = calculateSummary(data, metric?.unit || '');
    setMetricSummary(summary);
  }, [selectedMetric, timeRange, deviceType]);

  const renderSimpleChart = (data: ChartDataPoint[]) => {
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
      <div className="h-32 flex items-end justify-between gap-1 p-4 bg-muted/20 rounded-lg">
        {data.map((point, index) => {
          const height = ((point.value - minValue) / range) * 100;
          return (
            <div
              key={index}
              className="bg-primary rounded-sm flex-1 min-w-0 transition-all hover:bg-primary/80"
              style={{ height: `${Math.max(height, 2)}%` }}
              title={`${point.label}: ${point.value.toFixed(2)}${metricSummary?.unit || ''}`}
            />
          );
        })}
      </div>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '°C') {
      return `${value.toFixed(1)}${unit}`;
    } else if (unit === 'ms') {
      return `${Math.round(value)}${unit}`;
    } else if (unit === '%') {
      return `${Math.round(value)}${unit}`;
    } else {
      return `${value.toFixed(0)}${unit}`;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metric Selection */}
          <div className="flex flex-wrap gap-2">
            {availableMetrics.map(metric => {
              const IconComponent = metric.icon;
              return (
                <Button
                  key={metric.id}
                  variant={selectedMetric === metric.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMetric(metric.id)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {metric.name}
                </Button>
              );
            })}
          </div>

          {/* Time Range Selection */}
          <div className="flex gap-2">
            {['1h', '6h', '24h'].map(range => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Metric Summary */}
          {metricSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Current</div>
                <div className="font-semibold flex items-center justify-center gap-1">
                  {formatValue(metricSummary.current, metricSummary.unit)}
                  {getTrendIcon(metricSummary.trend)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Average</div>
                <div className="font-semibold">
                  {formatValue(metricSummary.average, metricSummary.unit)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Min</div>
                <div className="font-semibold">
                  {formatValue(metricSummary.min, metricSummary.unit)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Max</div>
                <div className="font-semibold">
                  {formatValue(metricSummary.max, metricSummary.unit)}
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {renderSimpleChart(chartData)}

          {/* Chart Legend */}
          <div className="text-xs text-muted-foreground text-center">
            {chartData.length > 0 && (
              <>
                {chartData[0].label} - {chartData[chartData.length - 1].label}
                <span className="ml-2">({chartData.length} data points)</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
