"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  EquipmentHealthData,
  MaintenanceRecommendation,
  PredictiveModel,
  EquipmentLifecycle,
  Anomaly,
  PredictiveMaintenanceAnalyzer 
} from '@/lib/maintenance/predictive-analyzer';
import { EquipmentProfile } from '@/lib/stores/equipment-store';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  TrendingUp,
  TrendingDown,
  Thermometer,
  Zap,
  Settings,
  Calendar,
  DollarSign,
  Target,
  BarChart3,
  LineChart,
  PieChart,
  AlertCircle,
  Info,
  Lightbulb,
  Shield,
  Timer,
  Gauge
} from 'lucide-react';

interface MaintenanceDashboardProps {
  equipment: EquipmentProfile[];
  analyzer: PredictiveMaintenanceAnalyzer;
  className?: string;
}

export function MaintenanceDashboard({ equipment, analyzer, className }: MaintenanceDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<Map<string, EquipmentHealthData>>(new Map());
  const [recommendations, setRecommendations] = useState<Map<string, MaintenanceRecommendation[]>>(new Map());
  const [models, setModels] = useState<Map<string, PredictiveModel>>(new Map());
  const [lifecycles, setLifecycles] = useState<Map<string, EquipmentLifecycle>>(new Map());

  useEffect(() => {
    // Load data for all equipment
    equipment.forEach(eq => {
      const health = analyzer.getEquipmentHealth(eq.id);
      const recs = analyzer.getMaintenanceRecommendations(eq.id);
      const model = analyzer.getPredictiveModel(eq.id);
      const lifecycle = analyzer.getEquipmentLifecycle(eq.id);

      if (health) setHealthData(prev => new Map(prev.set(eq.id, health)));
      if (recs) setRecommendations(prev => new Map(prev.set(eq.id, recs)));
      if (model) setModels(prev => new Map(prev.set(eq.id, model)));
      if (lifecycle) setLifecycles(prev => new Map(prev.set(eq.id, lifecycle)));
    });
  }, [equipment, analyzer]);

  const overallStats = useMemo(() => {
    const totalEquipment = equipment.length;
    const healthyCount = Array.from(healthData.values()).filter(h => h.performanceIndicators.overallHealth > 80).length;
    const criticalCount = Array.from(recommendations.values()).flat().filter(r => r.priority === 'urgent').length;
    const totalRecommendations = Array.from(recommendations.values()).flat().length;
    const avgHealth = Array.from(healthData.values()).reduce((sum, h) => sum + h.performanceIndicators.overallHealth, 0) / Math.max(1, healthData.size);

    return {
      totalEquipment,
      healthyCount,
      criticalCount,
      totalRecommendations,
      avgHealth: Math.round(avgHealth)
    };
  }, [equipment, healthData, recommendations]);

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    if (health >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBadgeColor = (health: number) => {
    if (health >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (health >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (health >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'temperature_spike': return <Thermometer className="h-4 w-4 text-red-500" />;
      case 'vibration_increase': return <Activity className="h-4 w-4 text-orange-500" />;
      case 'tracking_drift': return <Target className="h-4 w-4 text-yellow-500" />;
      case 'focus_instability': return <Settings className="h-4 w-4 text-blue-500" />;
      case 'power_fluctuation': return <Zap className="h-4 w-4 text-purple-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipment Maintenance</h1>
          <p className="text-muted-foreground">
            Predictive maintenance and equipment health monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </Button>
          <Button>
            <Wrench className="h-4 w-4 mr-2" />
            New Maintenance
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Equipment</p>
                <p className="text-2xl font-bold">{overallStats.totalEquipment}</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Healthy Equipment</p>
                <p className="text-2xl font-bold text-green-600">{overallStats.healthyCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{overallStats.criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recommendations</p>
                <p className="text-2xl font-bold">{overallStats.totalRecommendations}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Health</p>
                <p className={cn("text-2xl font-bold", getHealthColor(overallStats.avgHealth))}>
                  {overallStats.avgHealth}%
                </p>
              </div>
              <Gauge className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health Status</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Equipment Health Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Equipment Health Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {equipment.map(eq => {
                  const health = healthData.get(eq.id);
                  const recs = recommendations.get(eq.id) || [];
                  const urgentRecs = recs.filter(r => r.priority === 'urgent').length;
                  
                  return (
                    <div key={eq.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded">
                          <Settings className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{eq.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {health ? `Last updated ${formatTimeAgo(health.timestamp)}` : 'No data'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {urgentRecs > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            {urgentRecs} urgent
                          </Badge>
                        )}
                        {health && (
                          <Badge className={getHealthBadgeColor(health.performanceIndicators.overallHealth)}>
                            {health.performanceIndicators.overallHealth}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Anomalies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {Array.from(healthData.values()).flatMap(health => 
                    health.anomalies.map(anomaly => (
                      <div key={anomaly.id} className="flex items-start gap-3 p-3 border-b last:border-b-0">
                        <div className="p-1 bg-muted rounded">
                          {getAnomalyIcon(anomaly.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{anomaly.description}</p>
                            <Badge className={getPriorityColor(anomaly.severity)}>
                              {anomaly.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(anomaly.detectedAt)} • {anomaly.confidence}% confidence
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(recommendations.values()).flat()
                  .filter(rec => rec.dueDate && rec.dueDate > new Date())
                  .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))
                  .slice(0, 5)
                  .map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{rec.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Due {rec.dueDate?.toLocaleDateString()} • {rec.estimatedDuration}min • ${rec.estimatedCost}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Schedule
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {equipment.map(eq => {
              const health = healthData.get(eq.id);
              if (!health) return null;

              return (
                <Card key={eq.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{eq.name}</CardTitle>
                      <Badge className={getHealthBadgeColor(health.performanceIndicators.overallHealth)}>
                        {health.performanceIndicators.overallHealth}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Temperature</span>
                          <span>{health.metrics.temperature}°C</span>
                        </div>
                        <Progress value={Math.min(100, (health.metrics.temperature / 50) * 100)} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Tracking Accuracy</span>
                          <span>{health.metrics.mechanical.tracking}"</span>
                        </div>
                        <Progress value={Math.max(0, 100 - health.metrics.mechanical.tracking * 10)} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Focus Quality</span>
                          <span>{health.metrics.optical.focus} px</span>
                        </div>
                        <Progress value={Math.max(0, 100 - health.metrics.optical.focus * 20)} />
                      </div>
                    </div>

                    <Separator />

                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Operating Time:</span>
                        <span>{health.operatingConditions.totalOperatingTime}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span>{formatTimeAgo(health.timestamp)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {Array.from(recommendations.entries()).map(([equipmentId, recs]) => {
              const eq = equipment.find(e => e.id === equipmentId);
              if (!eq || recs.length === 0) return null;

              return (
                <Card key={equipmentId}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      {eq.name} Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recs.map(rec => (
                      <div key={rec.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                          </div>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <div className="font-medium">{rec.estimatedDuration}min</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost:</span>
                            <div className="font-medium">${rec.estimatedCost}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Skill Level:</span>
                            <div className="font-medium capitalize">{rec.skillLevel}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due Date:</span>
                            <div className="font-medium">
                              {rec.dueDate ? rec.dueDate.toLocaleDateString() : 'Not set'}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                          <div className="text-sm text-muted-foreground">
                            Confidence: {rec.confidence}%
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            <Button size="sm">
                              Schedule
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from(models.entries()).map(([equipmentId, model]) => {
              const eq = equipment.find(e => e.id === equipmentId);
              if (!eq) return null;

              return (
                <Card key={equipmentId}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {eq.name} Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {model.predictions.failureProbability}%
                        </div>
                        <div className="text-sm text-muted-foreground">Failure Risk</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">
                          {model.predictions.timeToFailure}
                        </div>
                        <div className="text-sm text-muted-foreground">Days to Failure</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Risk Factors</h4>
                      <div className="space-y-2">
                        {model.predictions.factors.map((factor, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{factor.factor}</span>
                            <div className="flex items-center gap-2">
                              <span className={factor.impact > 0 ? 'text-red-600' : 'text-green-600'}>
                                {factor.impact > 0 ? '+' : ''}{factor.impact}%
                              </span>
                              {factor.trend === 'degrading' ? (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              ) : factor.trend === 'improving' ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : (
                                <div className="h-3 w-3 bg-gray-400 rounded-full" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Model accuracy: {model.accuracy}% • Confidence: {model.predictions.confidence}%
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="lifecycle" className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Equipment lifecycle management will be displayed here</p>
            <p className="text-sm">Including depreciation, replacement planning, and cost analysis</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
