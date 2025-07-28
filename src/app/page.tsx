"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { ResponsiveLayout } from '@/components/responsive-layout';
import { EnhancedDashboard } from '@/components/enhanced-dashboard';
import { EnhancedGestureNavigation } from '@/components/enhanced-gesture-navigation';
import SwipeGestureHandler from '@/components/swipe-gesture-handler';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { EnhancedNavigation } from '@/components/ui/enhanced-navigation';
import { WeatherDashboard } from '@/components/weather/weather-dashboard';
import { ImageAnalysisDashboard } from '@/components/image-analysis/image-analysis-dashboard';
import { EquipmentHealthDashboard } from '@/components/equipment-health/equipment-health-dashboard';
import { GuidingDashboard } from '@/components/guiding/guiding-dashboard';
import { VerticalLayout, VerticalLayoutPresets } from '@/components/ui/vertical-layout';
import { OptimizedMotion } from '@/components/ui/optimized-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore, CurrentPage } from '@/lib/store';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { useAccessibility } from '@/hooks/use-accessibility';
import { useEnhancedInteractions } from '@/hooks/use-enhanced-interactions';
import { cn } from '@/lib/utils';
import {
  Camera,
  Target,
  Settings,
  Activity,
  Star,
  Share,
  RefreshCw,
  Telescope,
  Compass,
  Filter,
  Focus,
  HelpCircle,
  Zap,
} from 'lucide-react';

export default function Home() {
  const { currentPage, setCurrentPage } = useAppStore();
  const { metrics, measureInteraction, shouldRenderEffect } = usePerformanceMonitor();
  const { announce } = useAccessibility();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<CurrentPage>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the app and announce to screen readers
  useEffect(() => {
    const initializeApp = async () => {
      await measureInteraction('app-initialization', async () => {
        // Simulate app initialization
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      setIsInitialized(true);
      announce('Cobalt Mobile astrophotography control application loaded and ready');
    };

    initializeApp();
  }, [announce, measureInteraction]);

  // Enhanced interactions for gesture handling
  const { ref: gestureRef } = useEnhancedInteractions({
    onSwipe: useCallback((gesture: any) => {
      if (gesture.direction === 'left') {
        const views: CurrentPage[] = ['dashboard', 'devices', 'sequence'];
        const currentIndex = views.indexOf(selectedView);
        const nextIndex = (currentIndex + 1) % views.length;
        setSelectedView(views[nextIndex]);
        announce(`Switched to ${views[nextIndex]} view`);
      } else if (gesture.direction === 'right') {
        const views: CurrentPage[] = ['dashboard', 'devices', 'sequence'];
        const currentIndex = views.indexOf(selectedView);
        const prevIndex = (currentIndex - 1 + views.length) % views.length;
        setSelectedView(views[prevIndex]);
        announce(`Switched to ${views[prevIndex]} view`);
      }
    }, [selectedView, announce]),
  });

  // Handle refresh action
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    announce('Refreshing data...');

    await measureInteraction('refresh-data', async () => {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1500));
    });

    setIsRefreshing(false);
    announce('Data refreshed successfully');
  }, [announce, measureInteraction]);

  // Quick actions for floating action button
  const quickActions = [
    {
      id: 'capture',
      label: 'Quick Capture',
      icon: Camera,
      onClick: () => {
        announce('Starting quick capture');
        measureInteraction('quick-capture', () => {
          // Handle quick capture
        });
      },
    },
    {
      id: 'target',
      label: 'Target Selection',
      icon: Target,
      onClick: () => {
        announce('Opening target selection');
        setCurrentPage('sequence');
      },
    },
    {
      id: 'settings',
      label: 'Quick Settings',
      icon: Settings,
      onClick: () => {
        announce('Opening quick settings');
      },
    },
  ];

  // Welcome content for new users
  const WelcomeContent = () => (
    <OptimizedMotion
      animation="slide"
      direction="up"
      className="space-y-6"
    >
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Telescope className="h-6 w-6 text-primary" />
            Welcome to Cobalt Mobile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your advanced astrophotography control platform is ready.
            Connect your equipment and start capturing the cosmos.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setSelectedView('devices')}
            >
              <Activity className="h-4 w-4" />
              Connect Devices
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setSelectedView('sequence')}
            >
              <Target className="h-4 w-4" />
              Plan Sequence
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              System Status: Ready
            </div>
            <Badge variant="outline" className="text-xs">
              v1.0.0
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div>
                <strong>Connect Equipment:</strong> Use the devices page to connect your camera, mount, and accessories.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <div>
                <strong>Plan Your Session:</strong> Create imaging sequences with target selection and automation.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div>
                <strong>Monitor Progress:</strong> Track your session with real-time status updates and controls.
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </OptimizedMotion>
  );

  // Create vertical layout sections based on current view
  const getDashboardSections = () => {
    if (selectedView === 'dashboard') {
      return VerticalLayoutPresets.dashboard({
        overview: <WelcomeContent />,
        details: (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your astrophotography equipment status and environmental conditions.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">4</div>
                    <div className="text-xs text-muted-foreground">Connected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">Ready</div>
                    <div className="text-xs text-muted-foreground">Status</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
              {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </Button>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedView === 'dashboard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('dashboard')}
              >
                <Activity className="h-4 w-4" />
              </Button>
              <Button
                variant={(selectedView as CurrentPage) === 'devices' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('devices')}
              >
                <Compass className="h-4 w-4" />
              </Button>
              <Button
                variant={(selectedView as CurrentPage) === 'sequence' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('sequence')}
              >
                <Target className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-2">
              Swipe left/right to navigate • Pull down to refresh
            </div>
          </div>
        ),
      });
    }

    // Handle feature-specific pages
    if (selectedView === 'weather') {
      return [
        {
          id: 'weather-page',
          title: 'Weather & Conditions',
          content: <WeatherDashboard />,
          priority: 'high' as const,
        },
      ];
    }

    if (selectedView === 'analysis') {
      return [
        {
          id: 'analysis-page',
          title: 'Image Analysis',
          content: <ImageAnalysisDashboard />,
          priority: 'high' as const,
        },
      ];
    }

    if (selectedView === 'health') {
      return [
        {
          id: 'health-page',
          title: 'Equipment Health',
          content: <EquipmentHealthDashboard />,
          priority: 'high' as const,
        },
      ];
    }

    if (selectedView === 'guiding') {
      return [
        {
          id: 'guiding-page',
          title: 'Guiding & Polar Alignment',
          content: <GuidingDashboard />,
          priority: 'high' as const,
        },
      ];
    }

    // For other views, show simplified content
    return [
      {
        id: 'main-content',
        title: selectedView === 'devices' ? 'Equipment Status' :
               selectedView === 'targets' ? 'Target Planning' :
               'Sequence Planning',
        content: (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedView === 'devices' ? (
                  <>
                    <Compass className="h-5 w-5" />
                    Equipment Management
                  </>
                ) : selectedView === 'targets' ? (
                  <>
                    <Target className="h-5 w-5" />
                    Target Planning
                  </>
                ) : (
                  <>
                    <Activity className="h-5 w-5" />
                    Imaging Sequences
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {selectedView === 'devices'
                  ? 'Connect and manage your astrophotography equipment.'
                  : selectedView === 'targets'
                  ? 'Plan optimal imaging targets and sessions.'
                  : 'Plan and execute automated imaging sequences.'
                }
              </p>
              <Button className="w-full">
                {selectedView === 'devices' ? 'Scan for Devices' :
                 selectedView === 'targets' ? 'Browse Targets' :
                 'Create New Sequence'}
              </Button>
            </CardContent>
          </Card>
        ),
        priority: 'high' as const,
      },
    ];
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <OptimizedMotion animation="fade" className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="text-lg font-medium">Initializing Cobalt Mobile...</div>
          <div className="text-sm text-muted-foreground">Setting up your astrophotography control center</div>
        </OptimizedMotion>
      </div>
    );
  }

  return (
    <ResponsiveLayout
      className="min-h-screen"
      navigation={
        <EnhancedNavigation
          onPageChange={(page) => {
            setSelectedView(page);
            setCurrentPage(page);
            announce(`Navigated to ${page} page`);
          }}
        />
      }
    >
      <div ref={gestureRef as React.RefObject<HTMLDivElement>} className="relative min-h-screen">
        <EnhancedGestureNavigation
          onSwipeLeft={() => {
            const views: CurrentPage[] = ['dashboard', 'weather', 'analysis', 'health', 'guiding', 'devices', 'sequence', 'targets'];
            const currentIndex = views.indexOf(selectedView);
            if (currentIndex !== -1) {
              const nextIndex = (currentIndex + 1) % views.length;
              setSelectedView(views[nextIndex]);
            }
          }}
          onSwipeRight={() => {
            const views: CurrentPage[] = ['dashboard', 'weather', 'analysis', 'health', 'guiding', 'devices', 'sequence', 'targets'];
            const currentIndex = views.indexOf(selectedView);
            if (currentIndex !== -1) {
              const prevIndex = (currentIndex - 1 + views.length) % views.length;
              setSelectedView(views[prevIndex]);
            }
          }}
          showVisualFeedback={true}
          className="h-full"
        >
          <SwipeGestureHandler
            enableEnhancedGestures={true}
            showVisualFeedback={true}
          >
            <PullToRefreshContainer
              onRefresh={handleRefresh}
              enabled={true}
              showIndicator={true}
            >
              <div className="container mx-auto px-4 py-6 max-w-4xl">
                <main
                  role="main"
                  aria-label={`${selectedView} page content`}
                  className={cn(
                    "transition-opacity duration-300",
                    shouldRenderEffect('smooth-transitions') ? 'ease-in-out' : ''
                  )}
                >
                  <VerticalLayout
                    sections={getDashboardSections()}
                    spacing="standard"
                    adaptiveHeight={true}
                    enableVirtualization={shouldRenderEffect('virtualization')}
                  />
                </main>
              </div>
            </PullToRefreshContainer>
          </SwipeGestureHandler>
        </EnhancedGestureNavigation>

        {/* Floating Action Button - only render if performance allows */}
        {shouldRenderEffect('floating-elements') && (
          <FloatingActionButton
            actions={quickActions}
            position="bottom-right"
            size="md"
          />
        )}

        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>

        {/* Performance indicator (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 right-4 bg-background/80 backdrop-blur-sm border rounded-lg p-2 text-xs">
            <div>FPS: {Math.round(metrics.fps || 0)}</div>
            <div>Memory: {Math.round(((performance as any).memory?.usedJSHeapSize || 0) / 1024 / 1024)}MB</div>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}
