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
import { Input } from '@/components/ui/input';
import { useGuidingStore } from '@/lib/stores/guiding-store';
import { cn, safeToFixed } from '@/lib/utils';
import {
  Activity,
  Crosshair,
  Download,
  Eye,
  EyeOff,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Square,
  Target,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';

// Import desktop layout components
import {
  DesktopGrid,
  DesktopOnly,
  MobileOnly,
  useDesktopResponsive
} from '@/components/layout';

interface GuidingDashboardProps {
  className?: string;
  compact?: boolean;
}

export function GuidingDashboard({ className, compact = false }: GuidingDashboardProps) {
  const {
    isConnected,
    connectionStatus,
    guidingState,
    guidingParameters,
    currentCalibration,
    isCalibrating,
    calibrationProgress,
    currentSession,
    isGuiding,
    currentPolarAlignment,
    isPolarAligning,
    polarAlignmentMethod,
    isDithering,
    ditherSettings,
    selectedTab,
    showAdvancedSettings,
    chartTimeRange,
    sessionStats,
    connect,
    disconnect,
    startCalibration,
    clearCalibration,
    selectGuideStar,
    startGuiding,
    stopGuiding,
    pauseGuiding,
    resumeGuiding,
    dither,
    updateDitherSettings,
    startPolarAlignment,
    setPolarAlignmentMethod,
    updateGuidingParameters,
    resetParametersToDefault,
    setSelectedTab,
    setShowAdvancedSettings,
    setChartTimeRange,
    exportGuidingData,
    clearHistory,
    getGuidingQuality,
    getCurrentRMS,
    getCalibrationQuality,
    getPolarAlignmentQuality,
    getRecentGuidingData
  } = useGuidingStore();

  const { isDesktop } = useDesktopResponsive();
  const [selectedStarPosition, setSelectedStarPosition] = useState<{ x: number; y: number } | null>(null);

  const handleConnect = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  const handleStartCalibration = async () => {
    try {
      await startCalibration();
    } catch (error) {
      console.error('Calibration failed:', error);
    }
  };

  const handleStartGuiding = async () => {
    if (!guidingState.currentStar) {
      alert('Please select a guide star first');
      return;
    }
    
    try {
      await startGuiding();
    } catch (error) {
      console.error('Failed to start guiding:', error);
    }
  };

  const handleStopGuiding = async () => {
    try {
      await stopGuiding();
    } catch (error) {
      console.error('Failed to stop guiding:', error);
    }
  };

  const handleDither = async () => {
    try {
      await dither();
    } catch (error) {
      console.error('Dither failed:', error);
    }
  };

  const handleStartPolarAlignment = async () => {
    try {
      await startPolarAlignment(polarAlignmentMethod);
    } catch (error) {
      console.error('Polar alignment failed:', error);
    }
  };

  const handleExportData = () => {
    const data = exportGuidingData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guiding-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'guiding': return 'text-green-500';
      case 'calibrating': return 'text-blue-500';
      case 'dithering': return 'text-yellow-500';
      case 'settling': return 'text-orange-500';
      case 'error': return 'text-red-500';
      case 'lost': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const currentRMS = getCurrentRMS();
  const guidingQuality = getGuidingQuality();
  const calibrationQuality = getCalibrationQuality();
  const polarAlignmentQuality = getPolarAlignmentQuality();

  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Guiding
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
              <Badge variant={isGuiding ? 'default' : 'secondary'} className="text-xs">
                {guidingState.status}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isGuiding && currentSession && currentRMS && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>RMS Error</span>
                <span className={cn("font-medium", getQualityColor(guidingQuality))}>
                  {safeToFixed(currentRMS?.total, 2)}"
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>RA: {safeToFixed(currentRMS?.ra, 2)}"</div>
                <div>Dec: {safeToFixed(currentRMS?.dec, 2)}"</div>
              </div>
              <Progress value={Math.min(100, (2.0 - (currentRMS.total || 0)) / 2.0 * 100)} className="h-2" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", 
                calibrationQuality === 'excellent' || calibrationQuality === 'good' ? 'bg-green-500' : 
                calibrationQuality === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
              )} />
              <span>Calibrated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full",
                polarAlignmentQuality === 'excellent' || polarAlignmentQuality === 'good' ? 'bg-green-500' :
                polarAlignmentQuality === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
              )} />
              <span>Polar Aligned</span>
            </div>
          </div>

          {guidingState.currentStar && (
            <div className="text-xs text-muted-foreground">
              Guide star: SNR {guidingState.currentStar.snr?.toFixed(1) || 'N/A'}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnect}
              className="flex-1"
            >
              {isConnected ? (
                <WifiOff className="h-3 w-3 mr-2" />
              ) : (
                <Wifi className="h-3 w-3 mr-2" />
              )}
              {isConnected ? 'Disconnect' : 'Connect'}
            </Button>
            
            {isConnected && (
              <Button
                variant={isGuiding ? "destructive" : "default"}
                size="sm"
                onClick={isGuiding ? handleStopGuiding : handleStartGuiding}
                disabled={!guidingState.isCalibrated || !guidingState.currentStar}
                className="flex-1"
              >
                {isGuiding ? (
                  <Square className="h-3 w-3 mr-2" />
                ) : (
                  <Play className="h-3 w-3 mr-2" />
                )}
                {isGuiding ? 'Stop' : 'Guide'}
              </Button>
            )}
          </div>

          {isGuiding && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDither}
              disabled={isDithering}
              className="w-full"
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              {isDithering ? 'Dithering...' : 'Dither'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Guiding & Polar Alignment</h2>
          <p className="text-muted-foreground">
            Advanced autoguiding and mount alignment tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleConnect}
          >
            {isConnected ? (
              <WifiOff className="h-4 w-4 mr-2" />
            ) : (
              <Wifi className="h-4 w-4 mr-2" />
            )}
            {isConnected ? 'Disconnect' : 'Connect'}
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

      {/* Status Overview */}
      <DesktopGrid
        columns={{ desktop: 4, wide: 5, ultrawide: 6 }}
        gap="md"
        className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Connection</p>
                <p className="text-2xl font-bold">{isConnected ? 'Online' : 'Offline'}</p>
                <p className="text-xs text-muted-foreground">{connectionStatus}</p>
              </div>
              {isConnected ? (
                <Wifi className="h-8 w-8 text-green-500" />
              ) : (
                <WifiOff className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Guiding Status</p>
                <p className={cn("text-2xl font-bold capitalize", getStatusColor(guidingState.status))}>
                  {guidingState.status}
                </p>
                <p className="text-xs text-muted-foreground">{guidingState.statusMessage}</p>
              </div>
              <Target className={cn("h-8 w-8", getStatusColor(guidingState.status))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">RMS Error</p>
                <p className={cn("text-2xl font-bold", getQualityColor(guidingQuality))}>
                  {currentRMS.total.toFixed(2)}"
                </p>
                <p className="text-xs text-muted-foreground">
                  RA: {currentRMS.ra.toFixed(2)}" Dec: {currentRMS.dec.toFixed(2)}"
                </p>
              </div>
              <TrendingUp className={cn("h-8 w-8", getQualityColor(guidingQuality))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Session Stats</p>
                <p className="text-2xl font-bold">{sessionStats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">
                  Avg RMS: {sessionStats.averageRMS.toFixed(2)}"
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </DesktopGrid>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="guiding">Guiding</TabsTrigger>
          <TabsTrigger value="calibration">Calibration</TabsTrigger>
          <TabsTrigger value="polar">Polar Alignment</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="guiding" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Guiding Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Guiding Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Guide Star Selected</Label>
                  <Badge variant={guidingState.currentStar ? 'default' : 'secondary'}>
                    {guidingState.currentStar ? 
                      `SNR: ${guidingState.currentStar.snr.toFixed(1)}` : 
                      'None'
                    }
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Calibration Status</Label>
                  <Badge variant={guidingState.isCalibrated ? 'default' : 'secondary'}>
                    {calibrationQuality !== 'none' ? calibrationQuality : 'Not calibrated'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleStartCalibration}
                    disabled={!isConnected || !guidingState.currentStar || isCalibrating}
                    className="w-full"
                  >
                    <Crosshair className="h-4 w-4 mr-2" />
                    {isCalibrating ? `Calibrating... ${calibrationProgress.toFixed(0)}%` : 'Start Calibration'}
                  </Button>

                  {isCalibrating && (
                    <Progress value={calibrationProgress} className="w-full" />
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={isGuiding ? handleStopGuiding : handleStartGuiding}
                    disabled={!isConnected || !guidingState.isCalibrated || !guidingState.currentStar}
                    variant={isGuiding ? "destructive" : "default"}
                    className="flex-1"
                  >
                    {isGuiding ? (
                      <Square className="h-4 w-4 mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isGuiding ? 'Stop Guiding' : 'Start Guiding'}
                  </Button>

                  {isGuiding && (
                    <Button
                      onClick={handleDither}
                      disabled={isDithering}
                      variant="outline"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {isDithering ? 'Dithering...' : 'Dither'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Current Session</CardTitle>
              </CardHeader>
              <CardContent>
                {currentSession ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Session Duration</Label>
                        <p className="text-lg font-medium">
                          {Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000)} min
                        </p>
                      </div>
                      <div>
                        <Label>Total Frames</Label>
                        <p className="text-lg font-medium">{currentSession.totalFrames}</p>
                      </div>
                      <div>
                        <Label>RMS RA</Label>
                        <p className="text-lg font-medium">{currentSession.rmsRA.toFixed(2)}"</p>
                      </div>
                      <div>
                        <Label>RMS Dec</Label>
                        <p className="text-lg font-medium">{currentSession.rmsDec.toFixed(2)}"</p>
                      </div>
                      <div>
                        <Label>Peak RA</Label>
                        <p className="text-lg font-medium">{currentSession.peakRA.toFixed(2)}"</p>
                      </div>
                      <div>
                        <Label>Peak Dec</Label>
                        <p className="text-lg font-medium">{currentSession.peakDec.toFixed(2)}"</p>
                      </div>
                    </div>

                    <div>
                      <Label>Guiding Quality</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={guidingQuality === 'excellent' || guidingQuality === 'good' ? 'default' : 'destructive'}>
                          {guidingQuality}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Total RMS: {currentSession.rmsTotal.toFixed(2)}"
                        </span>
                      </div>
                    </div>

                    {currentSession.ditherEvents.length > 0 && (
                      <div>
                        <Label>Dither Events</Label>
                        <p className="text-sm text-muted-foreground">
                          {currentSession.ditherEvents.length} dithers performed
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active guiding session</p>
                    <p className="text-sm">Start guiding to see session statistics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dithering Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Dithering Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Auto-Dither</Label>
                  <Switch
                    checked={ditherSettings.enabled}
                    onCheckedChange={(checked) => updateDitherSettings({ enabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dither Amount (pixels)</Label>
                  <Slider
                    value={[ditherSettings.amount]}
                    onValueChange={([value]) => updateDitherSettings({ amount: value })}
                    min={1}
                    max={10}
                    step={0.5}
                  />
                  <div className="text-sm text-muted-foreground">{ditherSettings.amount} px</div>
                </div>

                <div className="space-y-2">
                  <Label>Settle Time (seconds)</Label>
                  <Slider
                    value={[ditherSettings.settleTime]}
                    onValueChange={([value]) => updateDitherSettings({ settleTime: value })}
                    min={5}
                    max={60}
                    step={5}
                  />
                  <div className="text-sm text-muted-foreground">{ditherSettings.settleTime}s</div>
                </div>

                <div className="space-y-2">
                  <Label>Frequency (frames)</Label>
                  <Slider
                    value={[ditherSettings.frequency]}
                    onValueChange={([value]) => updateDitherSettings({ frequency: value })}
                    min={1}
                    max={20}
                    step={1}
                  />
                  <div className="text-sm text-muted-foreground">Every {ditherSettings.frequency} frames</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calibration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mount Calibration</CardTitle>
            </CardHeader>
            <CardContent>
              {currentCalibration ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Calibration Quality</Label>
                    <Badge variant={currentCalibration.calibrationQuality === 'excellent' || currentCalibration.calibrationQuality === 'good' ? 'default' : 'destructive'}>
                      {currentCalibration.calibrationQuality}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>RA Rate</Label>
                      <p className="text-lg font-medium">{currentCalibration.raStepsPerArcsec.toFixed(2)} steps/"</p>
                    </div>
                    <div>
                      <Label>Dec Rate</Label>
                      <p className="text-lg font-medium">{currentCalibration.decStepsPerArcsec.toFixed(2)} steps/"</p>
                    </div>
                    <div>
                      <Label>RA Angle</Label>
                      <p className="text-lg font-medium">{currentCalibration.raAngle.toFixed(1)}°</p>
                    </div>
                    <div>
                      <Label>Dec Angle</Label>
                      <p className="text-lg font-medium">{currentCalibration.decAngle.toFixed(1)}°</p>
                    </div>
                    <div>
                      <Label>Orthogonal Error</Label>
                      <p className="text-lg font-medium">{currentCalibration.orthogonalError.toFixed(1)}°</p>
                    </div>
                    <div>
                      <Label>Calibrated</Label>
                      <p className="text-lg font-medium">{currentCalibration.timestamp.toLocaleString()}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={clearCalibration}
                  >
                    Clear Calibration
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Crosshair className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No calibration data</p>
                  <p className="text-sm">Perform mount calibration to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="polar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Polar Alignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label>Alignment Method</Label>
                <div className="flex gap-2">
                  <Button
                    variant={polarAlignmentMethod === 'drift' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPolarAlignmentMethod('drift')}
                  >
                    Drift Alignment
                  </Button>
                  <Button
                    variant={polarAlignmentMethod === 'platesolve' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPolarAlignmentMethod('platesolve')}
                  >
                    Plate Solving
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleStartPolarAlignment}
                disabled={!isConnected || isPolarAligning}
                className="w-full"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {isPolarAligning ? 'Aligning...' : `Start ${polarAlignmentMethod} Alignment`}
              </Button>

              {currentPolarAlignment && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <Label>Alignment Quality</Label>
                    <Badge variant={currentPolarAlignment.quality === 'excellent' || currentPolarAlignment.quality === 'good' ? 'default' : 'destructive'}>
                      {currentPolarAlignment.quality}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Azimuth Error</Label>
                      <p className="text-lg font-medium">{currentPolarAlignment.azimuthError.toFixed(1)}'</p>
                    </div>
                    <div>
                      <Label>Altitude Error</Label>
                      <p className="text-lg font-medium">{currentPolarAlignment.altitudeError.toFixed(1)}'</p>
                    </div>
                    <div>
                      <Label>Total Error</Label>
                      <p className="text-lg font-medium">{currentPolarAlignment.totalError.toFixed(1)}'</p>
                    </div>
                    <div>
                      <Label>Method</Label>
                      <p className="text-lg font-medium capitalize">{currentPolarAlignment.method}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Corrections Needed</Label>
                    <div className="text-sm space-y-1">
                      <p>Azimuth: {currentPolarAlignment.azimuthCorrection > 0 ? 'East' : 'West'} {Math.abs(currentPolarAlignment.azimuthCorrection).toFixed(1)}'</p>
                      <p>Altitude: {currentPolarAlignment.altitudeCorrection > 0 ? 'Up' : 'Down'} {Math.abs(currentPolarAlignment.altitudeCorrection).toFixed(1)}'</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Guiding Parameters
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {showAdvancedSettings ? 'Basic' : 'Advanced'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetParametersToDefault}
                  >
                    Reset to Default
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Aggressiveness (%)</Label>
                    <Slider
                      value={[guidingParameters.aggressiveness]}
                      onValueChange={([value]) => updateGuidingParameters({ aggressiveness: value })}
                      min={0}
                      max={100}
                      step={5}
                    />
                    <div className="text-sm text-muted-foreground">{guidingParameters.aggressiveness}%</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Min Move (arcsec)</Label>
                    <Slider
                      value={[guidingParameters.minMove]}
                      onValueChange={([value]) => updateGuidingParameters({ minMove: value })}
                      min={0.05}
                      max={1.0}
                      step={0.05}
                    />
                    <div className="text-sm text-muted-foreground">{guidingParameters.minMove.toFixed(2)}"</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Move (arcsec)</Label>
                    <Slider
                      value={[guidingParameters.maxMove]}
                      onValueChange={([value]) => updateGuidingParameters({ maxMove: value })}
                      min={1.0}
                      max={10.0}
                      step={0.5}
                    />
                    <div className="text-sm text-muted-foreground">{guidingParameters.maxMove.toFixed(1)}"</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable RA Guiding</Label>
                    <Switch
                      checked={guidingParameters.enableRAGuiding}
                      onCheckedChange={(checked) => updateGuidingParameters({ enableRAGuiding: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Enable Dec Guiding</Label>
                    <Switch
                      checked={guidingParameters.enableDecGuiding}
                      onCheckedChange={(checked) => updateGuidingParameters({ enableDecGuiding: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Settle Time (seconds)</Label>
                    <Slider
                      value={[guidingParameters.settleTime]}
                      onValueChange={([value]) => updateGuidingParameters({ settleTime: value })}
                      min={5}
                      max={30}
                      step={1}
                    />
                    <div className="text-sm text-muted-foreground">{guidingParameters.settleTime}s</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Settle Pixels</Label>
                    <Slider
                      value={[guidingParameters.settlePixels]}
                      onValueChange={([value]) => updateGuidingParameters({ settlePixels: value })}
                      min={0.5}
                      max={5.0}
                      step={0.1}
                    />
                    <div className="text-sm text-muted-foreground">{guidingParameters.settlePixels.toFixed(1)} px</div>
                  </div>
                </div>
              </div>

              {showAdvancedSettings && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium mb-4">Advanced Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Hysteresis (%)</Label>
                        <Slider
                          value={[guidingParameters.hysteresis]}
                          onValueChange={([value]) => updateGuidingParameters({ hysteresis: value })}
                          min={0}
                          max={50}
                          step={5}
                        />
                        <div className="text-sm text-muted-foreground">{guidingParameters.hysteresis}%</div>
                      </div>

                      <div className="space-y-2">
                        <Label>Low-pass Filter (%)</Label>
                        <Slider
                          value={[guidingParameters.lowpassFilter]}
                          onValueChange={([value]) => updateGuidingParameters({ lowpassFilter: value })}
                          min={0}
                          max={100}
                          step={5}
                        />
                        <div className="text-sm text-muted-foreground">{guidingParameters.lowpassFilter}%</div>
                      </div>

                      <div className="space-y-2">
                        <Label>Calibration Steps</Label>
                        <Slider
                          value={[guidingParameters.calibrationSteps]}
                          onValueChange={([value]) => updateGuidingParameters({ calibrationSteps: value })}
                          min={4}
                          max={16}
                          step={1}
                        />
                        <div className="text-sm text-muted-foreground">{guidingParameters.calibrationSteps} steps</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Resist Switch</Label>
                        <Switch
                          checked={guidingParameters.resistSwitch}
                          onCheckedChange={(checked) => updateGuidingParameters({ resistSwitch: checked })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Resist Switch Threshold (arcsec)</Label>
                        <Slider
                          value={[guidingParameters.resistSwitchThreshold]}
                          onValueChange={([value]) => updateGuidingParameters({ resistSwitchThreshold: value })}
                          min={0.5}
                          max={5.0}
                          step={0.1}
                          disabled={!guidingParameters.resistSwitch}
                        />
                        <div className="text-sm text-muted-foreground">{guidingParameters.resistSwitchThreshold.toFixed(1)}"</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Session History
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearHistory}
                >
                  Clear History
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label>Total Sessions</Label>
                    <p className="text-2xl font-bold">{sessionStats.totalSessions}</p>
                  </div>
                  <div>
                    <Label>Average RMS</Label>
                    <p className="text-2xl font-bold">{sessionStats.averageRMS.toFixed(2)}"</p>
                  </div>
                  <div>
                    <Label>Best RMS</Label>
                    <p className="text-2xl font-bold">{sessionStats.bestRMS.toFixed(2)}"</p>
                  </div>
                  <div>
                    <Label>Success Rate</Label>
                    <p className="text-2xl font-bold">{sessionStats.successRate.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Session history will appear here</p>
                  <p className="text-sm">Complete guiding sessions to build history</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
