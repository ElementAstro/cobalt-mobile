"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useEnhancedAccessibility } from '@/hooks/use-accessibility';
import { useOrientation, useOrientationBehavior } from '@/hooks/use-orientation';
import { deviceDetector, getDeviceInfo, getPerformanceTier } from '@/lib/utils/device-detection';
import { deviceOptimizer } from '@/lib/performance/device-optimization';
import { osCompatibilityChecker, getOSCompatibility } from '@/lib/utils/os-compatibility';
import { cn } from '@/lib/utils';
import {
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  WifiOff,
  Battery,
  Cpu,
  HardDrive,
  Eye,
  Volume2,
  RotateCcw,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Zap,
  Shield,
  Accessibility,
} from 'lucide-react';

interface DeviceCompatibilityDashboardProps {
  className?: string;
  showDetails?: boolean;
}

export function DeviceCompatibilityDashboard({ 
  className, 
  showDetails = false 
}: DeviceCompatibilityDashboardProps) {
  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo());
  const [osCompatibility, setOSCompatibility] = useState(getOSCompatibility());
  const [performanceConfig, setPerformanceConfig] = useState(deviceOptimizer.getCurrentConfig());
  const [showAdvanced, setShowAdvanced] = useState(showDetails);

  const { deviceCapabilities, announceForDevice } = useEnhancedAccessibility();
  const orientation = useOrientation();
  const orientationBehavior = useOrientationBehavior();

  // Update device info when it changes
  useEffect(() => {
    const unsubscribe = deviceDetector.addListener((info) => {
      setDeviceInfo(info);
      announceForDevice('Device information updated');
    });

    const unsubscribePerf = deviceOptimizer.addObserver((config) => {
      setPerformanceConfig(config);
    });

    return () => {
      unsubscribe();
      unsubscribePerf();
    };
  }, [announceForDevice]);

  // Get device type icon
  const getDeviceIcon = () => {
    if (!deviceInfo) return Monitor;
    
    switch (deviceInfo.type) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Monitor;
    }
  };

  // Get support level color
  const getSupportLevelColor = (level: string) => {
    switch (level) {
      case 'full': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'limited': return 'text-orange-600 bg-orange-100';
      case 'unsupported': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get performance tier color
  const getPerformanceTierColor = (tier: string) => {
    switch (tier) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const DeviceIcon = getDeviceIcon();
  const performanceTier = getPerformanceTier();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Device Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <DeviceIcon className="h-6 w-6" />
            Device Compatibility Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deviceInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Device Type */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Device Type</div>
                <Badge variant="outline" className="capitalize">
                  {deviceInfo.type}
                </Badge>
              </div>

              {/* Operating System */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Operating System</div>
                <Badge variant="outline" className="capitalize">
                  {deviceInfo.os} {deviceInfo.version.os}
                </Badge>
              </div>

              {/* Support Level */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Support Level</div>
                <Badge className={getSupportLevelColor(osCompatibility?.supportLevel || 'unknown')}>
                  {osCompatibility?.supportLevel || 'Unknown'}
                </Badge>
              </div>
            </div>
          )}

          {/* Performance Tier */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Performance Tier</div>
              <Badge className={getPerformanceTierColor(performanceTier)}>
                <Zap className="h-3 w-3 mr-1" />
                {performanceTier.toUpperCase()}
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Screen & Orientation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Screen & Orientation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Resolution</div>
                    <div className="text-sm">
                      {deviceInfo?.screen.width} × {deviceInfo?.screen.height}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Pixel Ratio</div>
                    <div className="text-sm">{deviceInfo?.screen.pixelRatio}x</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Orientation</div>
                    <Badge variant="outline" className="capitalize">
                      {orientation.type}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Angle</div>
                    <div className="text-sm">{orientation.angle}°</div>
                  </div>
                </div>

                {orientation.canLock && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => orientation.lock('portrait')}
                    >
                      Lock Portrait
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => orientation.lock('landscape')}
                    >
                      Lock Landscape
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => orientation.unlock()}
                    >
                      Unlock
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance & Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Performance & Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Memory */}
                  {deviceInfo?.performance.memory && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        <span className="text-sm font-medium">Memory</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {deviceInfo.performance.memory.toFixed(1)} GB
                      </div>
                    </div>
                  )}

                  {/* CPU Cores */}
                  {deviceInfo?.performance.cores && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        <span className="text-sm font-medium">CPU Cores</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {deviceInfo.performance.cores}
                      </div>
                    </div>
                  )}

                  {/* Connection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {deviceInfo?.performance.connectionType === 'wifi' ? (
                        <Wifi className="h-4 w-4" />
                      ) : (
                        <WifiOff className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">Connection</span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {deviceInfo?.performance.connectionType || 'Unknown'}
                    </Badge>
                  </div>
                </div>

                {/* Performance Configuration */}
                {performanceConfig && (
                  <div className="space-y-3">
                    <Separator />
                    <div className="text-sm font-medium">Current Configuration</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Image Quality:</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {performanceConfig.imageQuality}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Animations:</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {performanceConfig.animationLevel}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cache:</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {performanceConfig.cacheStrategy}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Updates:</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {performanceConfig.updateFrequency}ms
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accessibility Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Accessibility className="h-5 w-5" />
                  Accessibility Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(deviceCapabilities).map(([feature, supported]) => (
                    <div key={feature} className="flex items-center gap-2">
                      {supported ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm capitalize">
                        {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Feature Support */}
            {osCompatibility && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Feature Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(osCompatibility.features).map(([feature, supported]) => (
                      <div key={feature} className="flex items-center gap-2">
                        {supported ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">
                          {feature.replace(/([A-Z])/g, ' $1')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {osCompatibility?.recommendations && osCompatibility.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {osCompatibility.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
