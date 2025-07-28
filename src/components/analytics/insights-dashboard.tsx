"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  SessionAnalyzer, 
  SessionInsight, 
  AnalyticsMetrics,
  ImagingSession 
} from '@/lib/analytics/session-analyzer';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Calendar,
  Thermometer,
  Eye,
  Camera,
  Telescope,
  Filter,
  Zap
} from 'lucide-react';

interface InsightsDashboardProps {
  sessions: ImagingSession[];
  className?: string;
}

export function InsightsDashboard({ sessions, className }: InsightsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  // Initialize session analyzer
  const sessionAnalyzer = useMemo(() => new SessionAnalyzer(sessions), [sessions]);
  const metrics = useMemo(() => sessionAnalyzer.getAnalyticsMetrics(), [sessionAnalyzer]);
  const insights = useMemo(() => sessionAnalyzer.getInsights(), [sessionAnalyzer]);

  // Filter sessions by time range
  const filteredSessions = useMemo(() => {
    if (selectedTimeRange === 'all') return sessions;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedTimeRange) {
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return sessions;
    }
    
    return sessions.filter(session => session.date >= cutoffDate);
  }, [sessions, selectedTimeRange]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'improvement': return TrendingUp;
      case 'warning': return AlertTriangle;
      case 'tip': return Lightbulb;
      default: return Activity;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'improvement': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'warning': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'tip': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const InsightCard = ({ insight }: { insight: SessionInsight }) => {
    const Icon = getInsightIcon(insight.type);
    const colorClass = getInsightColor(insight.type);

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", colorClass)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{insight.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {insight.category}
                  </Badge>
                  <Badge 
                    variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {insight.impact} impact
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {insight.description}
              </p>
            </div>
          </div>
        </CardHeader>
        
        {insight.recommendations.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recommendations:</h4>
              <ul className="space-y-1">
                {insight.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="text-xs text-muted-foreground">
                Confidence: {insight.confidence}%
              </div>
              {insight.actionable && (
                <Button size="sm" variant="outline">
                  Take Action
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    trendValue 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'improving' | 'stable' | 'declining';
    trendValue?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Icon className="h-8 w-8 text-muted-foreground" />
            {trend && (
              <div className="flex items-center gap-1">
                {getTrendIcon(trend)}
                {trendValue && (
                  <span className="text-xs text-muted-foreground">{trendValue}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Session Analytics & Insights</h2>
          <p className="text-muted-foreground">
            AI-powered analysis of your imaging sessions and performance trends
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Sessions"
              value={metrics.totalSessions}
              subtitle={`${Math.round(metrics.totalImagingTime)} hours total`}
              icon={Calendar}
            />
            <MetricCard
              title="Success Rate"
              value={`${Math.round(metrics.successRate)}%`}
              subtitle="Average session rating"
              icon={Award}
              trend={metrics.improvementTrends.successRate}
            />
            <MetricCard
              title="Avg Session"
              value={`${Math.round(metrics.averageSessionDuration * 10) / 10}h`}
              subtitle="Duration per session"
              icon={Clock}
            />
            <MetricCard
              title="Best Targets"
              value={metrics.mostSuccessfulTargetTypes.length}
              subtitle={metrics.mostSuccessfulTargetTypes[0] || 'None yet'}
              icon={Target}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Optimal Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Temperature</Label>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(metrics.bestImagingConditions.temperature.min)}° - {Math.round(metrics.bestImagingConditions.temperature.max)}°C
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Humidity</Label>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(metrics.bestImagingConditions.humidity.min)} - {Math.round(metrics.bestImagingConditions.humidity.max)}%
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Seeing</Label>
                    <p className="text-sm text-muted-foreground">
                      {metrics.bestImagingConditions.seeing.min.toFixed(1)}" - {metrics.bestImagingConditions.seeing.max.toFixed(1)}"
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Moon Phase</Label>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(metrics.bestImagingConditions.moonPhase.min * 100)} - {Math.round(metrics.bestImagingConditions.moonPhase.max * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Focus Quality (HFR)</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metrics.improvementTrends.hfr)}
                      <span className="text-sm text-muted-foreground capitalize">
                        {metrics.improvementTrends.hfr}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Signal Quality (SNR)</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metrics.improvementTrends.snr)}
                      <span className="text-sm text-muted-foreground capitalize">
                        {metrics.improvementTrends.snr}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Success Rate</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metrics.improvementTrends.successRate)}
                      <span className="text-sm text-muted-foreground capitalize">
                        {metrics.improvementTrends.successRate}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Most Successful Target Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {metrics.mostSuccessfulTargetTypes.map((type, index) => (
                  <Badge key={type} variant={index === 0 ? 'default' : 'secondary'} className="capitalize">
                    {type}
                  </Badge>
                ))}
                {metrics.mostSuccessfulTargetTypes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Complete more sessions to see target type analysis
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.length > 0 ? (
            <ScrollArea className="h-[600px]">
              {insights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No insights available yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete more imaging sessions to generate personalized insights
                  </p>
                  <Button variant="outline">
                    Learn About Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Equipment Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(metrics.equipmentPerformance).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(metrics.equipmentPerformance).map(([equipment, performance]) => (
                      <div key={equipment} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{equipment}</span>
                          <Badge variant="outline">
                            {Math.round(performance.successRate)}% success
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>HFR: {performance.averageHFR.toFixed(2)}"</div>
                          <div>SNR: {performance.averageSNR.toFixed(1)}</div>
                          <div>Reliability: {Math.round(performance.reliability * 100)}%</div>
                        </div>
                        <Progress value={performance.successRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No equipment performance data available yet
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Session Quality Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Quality distribution chart will be implemented with a charting library
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Trend charts will be implemented with a charting library like Chart.js or Recharts
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for labels
const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("text-sm font-medium", className)}>{children}</div>
);
