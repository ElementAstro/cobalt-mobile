/**
 * Complete Mobile Integration Example
 * Demonstrates how to integrate all mobile enhancements together
 */

"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedMotion, OptimizedAnimatePresence, OptimizedInteractive } from '@/components/ui/optimized-motion';
import { VerticalLayout, VerticalLayoutPresets } from '@/components/ui/vertical-layout';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { FloatingActionButton, QuickActionPresets } from '@/components/ui/floating-action-button';
import { EnhancedGestureNavigation } from '@/components/enhanced-gesture-navigation';
import SwipeGestureHandler from '@/components/swipe-gesture-handler';
import { useEnhancedInteractions } from '@/hooks/use-enhanced-interactions';
import { GestureState } from '@/lib/interaction-manager';
import { useAccessibility, useAccessibleInteractive } from '@/hooks/use-accessibility';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { cn } from '@/lib/utils';
import {
  Smartphone,
  Camera,
  Settings,
  Activity,
  Zap,
  Eye,
  Hand,
  Layers,
  RefreshCw,
  Plus,
  Star,
  Heart,
  Share
} from 'lucide-react';

interface DeviceData {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function CompleteMobileIntegration() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'camera' | 'settings'>('dashboard');
  const [devices, setDevices] = useState<DeviceData[]>([
    { id: 'camera', name: 'Main Camera', status: 'connected', value: '12MP', icon: Camera },
    { id: 'mount', name: 'Mount', status: 'connected', value: 'Tracking', icon: Activity },
    { id: 'focuser', name: 'Focuser', status: 'disconnected', value: 'Offline', icon: Zap },
    { id: 'filter', name: 'Filter Wheel', status: 'error', value: 'Error', icon: Settings },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const { announce } = useAccessibility();
  const { measureInteraction, metrics, settings } = usePerformanceMonitor();

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    announce('Refreshing device data...');
    
    await measureInteraction('refresh-devices', async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update device statuses
      setDevices(prev => prev.map(device => ({
        ...device,
        status: Math.random() > 0.3 ? 'connected' : 'disconnected',
      })));
    });
    
    setIsRefreshing(false);
    announce('Device data refreshed');
  }, [measureInteraction, announce]);

  // Enhanced gesture handling for device cards
  const { ref: deviceGridRef } = useEnhancedInteractions({
    onSwipe: useCallback((gesture: GestureState) => {
      if (gesture.direction === 'left' || gesture.direction === 'right') {
        const views = ['dashboard', 'camera', 'settings'] as const;
        const currentIndex = views.indexOf(currentView);
        const nextIndex = gesture.direction === 'left' 
          ? (currentIndex + 1) % views.length
          : (currentIndex - 1 + views.length) % views.length;
        setCurrentView(views[nextIndex]);
        announce(`Switched to ${views[nextIndex]} view`);
      }
    }, [currentView, announce]),
    
    onLongPress: useCallback(() => {
      announce('Long press detected - opening quick actions');
    }, [announce]),
  });

  // Accessible device card interaction
  const { getAccessibleProps } = useAccessibleInteractive({
    onActivate: useCallback(() => {
      if (selectedDevice) {
        announce(`Opening ${selectedDevice} details`);
      }
    }, [selectedDevice, announce]),
    ariaLabel: selectedDevice ? `Open ${selectedDevice} details` : 'Select device',
  });

  // Quick actions for FAB
  const quickActions = [
    {
      id: 'capture',
      label: 'Quick Capture',
      icon: Camera,
      onClick: () => {
        announce('Starting quick capture');
        measureInteraction('quick-capture', () => {
          // Simulate capture
        });
      },
    },
    {
      id: 'favorite',
      label: 'Add to Favorites',
      icon: Star,
      onClick: () => announce('Added to favorites'),
    },
    {
      id: 'share',
      label: 'Share',
      icon: Share,
      onClick: () => announce('Opening share options'),
    },
  ];

  // Vertical layout sections
  const dashboardSections = VerticalLayoutPresets.dashboard({
    overview: (
      <div className="space-y-4">
        {/* Performance metrics */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{metrics.fps}</div>
              <div className="text-xs text-muted-foreground">FPS</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Memory</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{metrics.batteryLevel.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Battery</div>
            </CardContent>
          </Card>
        </div>

        {/* View navigation */}
        <div className="flex gap-2">
          {(['dashboard', 'camera', 'settings'] as const).map((view) => (
            <OptimizedInteractive key={view}>
              <Button
                variant={currentView === view ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCurrentView(view);
                  announce(`Switched to ${view} view`);
                }}
                className="capitalize flex-1"
              >
                {view}
              </Button>
            </OptimizedInteractive>
          ))}
        </div>
      </div>
    ),
    
    details: (
      <OptimizedAnimatePresence>
        <OptimizedMotion key={currentView} animation="slide" direction="left">
          {currentView === 'dashboard' && (
            <div ref={deviceGridRef as React.RefObject<HTMLDivElement>}>
              <ResponsiveGrid columns={{ xs: 1, sm: 2 }} gap="standard">
                {devices.map((device) => {
                  const IconComponent = device.icon;
                  return (
                    <OptimizedInteractive key={device.id}>
                      <Card
                        className={cn(
                          "cursor-pointer transition-all duration-200",
                          selectedDevice === device.id && "ring-2 ring-primary"
                        )}
                        onClick={() => {
                          setSelectedDevice(device.id);
                          announce(`Selected ${device.name}`);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-8 w-8 text-primary" />
                            <div className="flex-1">
                              <div className="font-medium">{device.name}</div>
                              <div className="text-sm text-muted-foreground">{device.value}</div>
                            </div>
                            <Badge
                              variant={
                                device.status === 'connected' ? 'default' :
                                device.status === 'error' ? 'destructive' : 'secondary'
                              }
                            >
                              {device.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </OptimizedInteractive>
                  );
                })}
              </ResponsiveGrid>
            </div>
          )}
          
          {currentView === 'camera' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Camera Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-48 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <Camera className="h-12 w-12 mx-auto mb-2" />
                      <div>Camera Preview</div>
                      <div className="text-sm opacity-75">Tap to focus • Pinch to zoom</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button>
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {currentView === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Application Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Animation Quality</span>
                    <Badge>{settings.animationQuality}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Touch Target Size</span>
                    <Badge>Adaptive</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Performance Mode</span>
                    <Badge variant={settings.enableAnimations ? 'default' : 'secondary'}>
                      {settings.enableAnimations ? 'High' : 'Battery Saver'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </OptimizedMotion>
      </OptimizedAnimatePresence>
    ),
    
    controls: (
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Devices'}
        </Button>
        
        {selectedDevice && (
          <Button
            {...(() => {
              const { ref, ...props } = getAccessibleProps();
              return props;
            })()}
            className="w-full"
          >
            Open {devices.find(d => d.id === selectedDevice)?.name}
          </Button>
        )}
        
        <div className="text-xs text-muted-foreground text-center">
          Swipe left/right to change views • Long press for quick actions
        </div>
      </div>
    ),
  });

  return (
    <div className="h-full relative">
      {/* Enhanced gesture navigation wrapper */}
      <EnhancedGestureNavigation
        onSwipeLeft={() => {
          const views = ['dashboard', 'camera', 'settings'] as const;
          const currentIndex = views.indexOf(currentView);
          const nextIndex = (currentIndex + 1) % views.length;
          setCurrentView(views[nextIndex]);
        }}
        onSwipeRight={() => {
          const views = ['dashboard', 'camera', 'settings'] as const;
          const currentIndex = views.indexOf(currentView);
          const nextIndex = (currentIndex - 1 + views.length) % views.length;
          setCurrentView(views[nextIndex]);
        }}
        showVisualFeedback={true}
        enabledGestures={{
          swipe: true,
          pinch: false,
          rotate: false,
          pan: false,
        }}
      >
        {/* Swipe gesture handler for additional feedback */}
        <SwipeGestureHandler
          enableEnhancedGestures={true}
          showVisualFeedback={true}
        >
          {/* Pull to refresh container */}
          <PullToRefreshContainer
            onRefresh={handleRefresh}
            enabled={currentView === 'dashboard'}
            showIndicator={true}
          >
            {/* Main content with vertical layout */}
            <VerticalLayout
              sections={dashboardSections}
              spacing="standard"
              adaptiveHeight={true}
              enableVirtualization={false}
            />
          </PullToRefreshContainer>
        </SwipeGestureHandler>
      </EnhancedGestureNavigation>

      {/* Floating Action Button */}
      <FloatingActionButton
        actions={quickActions}
        position="bottom-right"
        size="md"
      />
    </div>
  );
}
