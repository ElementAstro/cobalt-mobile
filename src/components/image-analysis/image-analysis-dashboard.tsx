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
import { useImageAnalysisStore, startAutoAnalysis } from '@/lib/stores/image-analysis-store';
import { cn } from '@/lib/utils';
import {
  Camera,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Eye,
  Star,
  Activity,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  Focus,
  Zap
} from 'lucide-react';

// Import desktop layout components
import {
  DesktopGrid,
  DesktopOnly,
  MobileOnly,
  useDesktopResponsive
} from '@/components/layout';

interface ImageAnalysisDashboardProps {
  className?: string;
  compact?: boolean;
}

export function ImageAnalysisDashboard({ className, compact = false }: ImageAnalysisDashboardProps) {
  const {
    currentAnalysis,
    analysisHistory,
    isAnalyzing,
    autoAnalysis,
    analysisInterval,
    focusTarget,
    focusDirection,
    qualityTrend,
    alerts,
    analysisSettings,
    analyzeImage,
    setAutoAnalysis,
    setAnalysisInterval,
    setFocusTarget,
    updateAnalysisSettings,
    clearHistory,
    exportAnalysisData,
    getCurrentHFR,
    getCurrentSNR,
    getFocusScore,
    getStarCount,
    isInFocus,
    getQualityScore,
    getActiveAlerts
  } = useImageAnalysisStore();

  const { isDesktop } = useDesktopResponsive();
  const [selectedTab, setSelectedTab] = useState('current');

  useEffect(() => {
    // Start auto-analysis when component mounts
    if (autoAnalysis) {
      startAutoAnalysis();
    }
  }, [autoAnalysis]);

  const handleTestAnalysis = async () => {
    // Generate test image data for demonstration
    const testImageData = new Uint16Array(1024 * 1024);
    await analyzeImage(testImageData.buffer);
  };

  const getTrendIcon = (trend: 'improving' | 'degrading' | 'stable') => {
    switch (trend) {
      case 'improving': return TrendingUp;
      case 'degrading': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (trend: 'improving' | 'degrading' | 'stable') => {
    switch (trend) {
      case 'improving': return 'text-green-500';
      case 'degrading': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getQualityBadgeVariant = (score: number) => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    if (score >= 50) return 'outline';
    return 'destructive';
  };

  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Image Analysis
            </div>
            {isInFocus() && (
              <Badge variant="default" className="text-xs">
                In Focus
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentAnalysis && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Focus className="h-4 w-4 text-muted-foreground" />
                <span>HFR: {getCurrentHFR().toFixed(2)}"</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>SNR: {getCurrentSNR().toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span>{getStarCount()} stars</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>{getFocusScore()}% focus</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Quality</span>
            <div className="flex items-center gap-2">
              <Progress value={getQualityScore()} className="w-16 h-2" />
              <span className={cn("text-xs font-medium", getQualityColor(getQualityScore()))}>
                {getQualityScore()}%
              </span>
            </div>
          </div>

          {getActiveAlerts().length > 0 && (
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{getActiveAlerts().length} alert(s)</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleTestAnalysis}
            disabled={isAnalyzing}
            className="w-full"
          >
            <RefreshCw className={cn("h-3 w-3 mr-2", isAnalyzing && "animate-spin")} />
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Image Analysis</h2>
          <p className="text-muted-foreground">
            Real-time image quality assessment and focus monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTestAnalysis}
            disabled={isAnalyzing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isAnalyzing && "animate-spin")} />
            Analyze Current Image
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const data = exportAnalysisData();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `image-analysis-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {getActiveAlerts().length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getActiveAlerts().map((alert, index) => (
                <div key={index} className="p-3 bg-orange-50 rounded-lg">
                  <div className="font-medium">{alert}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current Analysis</TabsTrigger>
          <TabsTrigger value="focus">Focus Tracking</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentAnalysis ? (
            <>
              {/* Quality Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Image Quality</span>
                    <Badge variant={getQualityBadgeVariant(getQualityScore())}>
                      {currentAnalysis.qualityAssessment.overall.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={getQualityScore()} className="w-full" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Score:</span> {getQualityScore()}/100
                      </div>
                      <div>
                        <span className="font-medium">Issues:</span> {currentAnalysis.qualityAssessment.issues.length}
                      </div>
                      <div>
                        <span className="font-medium">Stars:</span> {getStarCount()}
                      </div>
                      <div>
                        <span className="font-medium">Focus:</span> {isInFocus() ? 'Good' : 'Poor'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metrics Grid */}
              <DesktopGrid
                columns={{ desktop: 4, wide: 5, ultrawide: 6 }}
                gap="md"
                className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">HFR</p>
                        <p className="text-2xl font-bold">{getCurrentHFR().toFixed(2)}"</p>
                        <p className="text-xs text-muted-foreground">Target: {focusTarget.toFixed(1)}"</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Focus className="h-8 w-8 text-muted-foreground" />
                        {React.createElement(getTrendIcon(qualityTrend.hfr), {
                          className: cn("h-4 w-4 mt-1", getTrendColor(qualityTrend.hfr))
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">SNR</p>
                        <p className="text-2xl font-bold">{getCurrentSNR().toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Signal/Noise</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Zap className="h-8 w-8 text-muted-foreground" />
                        {React.createElement(getTrendIcon(qualityTrend.snr), {
                          className: cn("h-4 w-4 mt-1", getTrendColor(qualityTrend.snr))
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Stars</p>
                        <p className="text-2xl font-bold">{getStarCount()}</p>
                        <p className="text-xs text-muted-foreground">Detected</p>
                      </div>
                      <Star className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Focus Score</p>
                        <p className="text-2xl font-bold">{getFocusScore()}%</p>
                        <p className="text-xs text-muted-foreground">Quality</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Target className="h-8 w-8 text-muted-foreground" />
                        {React.createElement(getTrendIcon(qualityTrend.focus), {
                          className: cn("h-4 w-4 mt-1", getTrendColor(qualityTrend.focus))
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DesktopGrid>

              {/* Detailed Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>FWHM:</span>
                      <span className="font-mono">{currentAnalysis.metrics.fwhm.toFixed(2)}"</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Eccentricity:</span>
                      <span className="font-mono">{currentAnalysis.metrics.eccentricity.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Background:</span>
                      <span className="font-mono">{Math.round(currentAnalysis.metrics.backgroundLevel)} ADU</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peak:</span>
                      <span className="font-mono">{Math.round(currentAnalysis.metrics.peakValue)} ADU</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Noise:</span>
                      <span className="font-mono">{currentAnalysis.metrics.noise.toFixed(1)} ADU</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturation:</span>
                      <span className="font-mono">{currentAnalysis.metrics.saturation.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No image analysis data available</p>
                  <p className="text-sm">Capture an image or run a test analysis to begin</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="focus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Focus Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Focus Status:</span>
                  <div className="flex items-center gap-2">
                    {isInFocus() ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                    <span className={isInFocus() ? 'text-green-600' : 'text-orange-600'}>
                      {isInFocus() ? 'In Focus' : 'Needs Attention'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Direction:</span>
                  <Badge variant="outline">
                    {focusDirection === 'optimal' ? 'Optimal' : 
                     focusDirection === 'in' ? 'Focus In' : 'Focus Out'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Focus Target (HFR)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[focusTarget]}
                      onValueChange={([value]) => setFocusTarget(value)}
                      min={0.5}
                      max={10}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12">{focusTarget.toFixed(1)}"</span>
                  </div>
                </div>

                {currentAnalysis?.focusAnalysis && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{currentAnalysis.focusAnalysis.recommendation}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confidence: {currentAnalysis.focusAnalysis.confidence.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Analysis History</span>
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  Clear History
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisHistory.length > 0 ? (
                <div className="space-y-2">
                  {analysisHistory.slice(-10).reverse().map((analysis, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          {analysis.metrics.timestamp.toLocaleTimeString()}
                        </div>
                        <Badge variant={getQualityBadgeVariant(analysis.qualityAssessment.score)}>
                          {analysis.qualityAssessment.overall}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>HFR: {analysis.metrics.hfr.toFixed(2)}"</span>
                        <span>SNR: {analysis.metrics.snr.toFixed(1)}</span>
                        <span>Stars: {analysis.metrics.starCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No analysis history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Analysis</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically analyze new images
                  </p>
                </div>
                <Switch
                  checked={autoAnalysis}
                  onCheckedChange={setAutoAnalysis}
                />
              </div>

              <div className="space-y-2">
                <Label>Analysis Interval (seconds)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[analysisInterval]}
                    onValueChange={([value]) => setAnalysisInterval(value)}
                    min={5}
                    max={300}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">{analysisInterval}s</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Star Detection Threshold</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[analysisSettings.starDetectionThreshold]}
                    onValueChange={([value]) => updateAnalysisSettings({ starDetectionThreshold: value })}
                    min={1}
                    max={10}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">{analysisSettings.starDetectionThreshold.toFixed(1)}σ</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Star Size</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[analysisSettings.minStarSize]}
                      onValueChange={([value]) => updateAnalysisSettings({ minStarSize: value })}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-8">{analysisSettings.minStarSize}px</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Max Star Size</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[analysisSettings.maxStarSize]}
                      onValueChange={([value]) => updateAnalysisSettings({ maxStarSize: value })}
                      min={10}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-8">{analysisSettings.maxStarSize}px</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Sub-pixel Accuracy</Label>
                  <p className="text-sm text-muted-foreground">
                    More precise star measurements
                  </p>
                </div>
                <Switch
                  checked={analysisSettings.enableSubPixelAccuracy}
                  onCheckedChange={(checked) => updateAnalysisSettings({ enableSubPixelAccuracy: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Noise Filtering</Label>
                  <p className="text-sm text-muted-foreground">
                    Filter noise before analysis
                  </p>
                </div>
                <Switch
                  checked={analysisSettings.filterNoise}
                  onCheckedChange={(checked) => updateAnalysisSettings({ filterNoise: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
