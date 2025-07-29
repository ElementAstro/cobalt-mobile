"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { ResponsiveLayout } from '@/components/responsive-layout';
import { EnhancedDashboard } from '@/components/enhanced-dashboard';
import { EnhancedGestureNavigation } from '@/components/enhanced-gesture-navigation';
import SwipeGestureHandler from '@/components/swipe-gesture-handler';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { EnhancedNavigation } from '@/components/ui/enhanced-navigation';
import { AsyncState, LoadingCard } from '@/components/ui/loading-states';
import { WeatherDashboard } from '@/components/weather/weather-dashboard';
import { ImageAnalysisDashboard } from '@/components/image-analysis/image-analysis-dashboard';
import { EquipmentHealthDashboard } from '@/components/equipment-health/equipment-health-dashboard';
import { GuidingDashboard } from '@/components/guiding/guiding-dashboard';
import { EquipmentPage, EquipmentForm } from '@/components/equipment';
import { VerticalLayout, VerticalLayoutPresets } from '@/components/ui/vertical-layout';
import { OptimizedMotion } from '@/components/ui/optimized-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore, CurrentPage } from '@/lib/store';
import { usePerformanceMonitor } from '@/lib/performance-monitor';

// Import new desktop layout system
import {
  AdaptiveLayout,
  LayoutProvider,
  DesktopDashboardLayout,
  DesktopGrid,
  DesktopOnly,
  MobileOnly,
  BreakpointIndicator,
  useDesktopResponsive
} from '@/components/layout';
import { DesktopLayoutTest } from '@/components/layout/desktop-layout-test';
import { useAccessibility } from '@/hooks/use-accessibility';
import { useEnhancedInteractions } from '@/hooks/use-enhanced-interactions';
import { cn } from '@/lib/utils';

// Import device detail components
import CameraDetailPage from '@/components/camera/components/camera-detail-page';
import TelescopeDetailPage from '@/components/telescope/components/telescope-detail-page';
import FocuserDetailPage from '@/components/focuser/components/focuser-detail-page';
import FilterWheelDetailPage from '@/components/filterwheel/components/filterwheel-detail-page';
import DevicesPage from '@/components/devices-page';
import { EnhancedDeviceDetail } from '@/components/device-detail';
import { navigationManager, useNavigation } from '@/lib/navigation';
import { navigationManager, useNavigation } from '@/lib/navigation';
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
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  Wind,
  Eye,
  Cloud,
  Heart,
  Crosshair,
  ArrowLeft,
  Wifi,
} from 'lucide-react';

export default function Home() {
  const { currentPage, setCurrentPage } = useAppStore();
  const { metrics, measureInteraction, shouldRenderEffect } = usePerformanceMonitor();
  const { announce } = useAccessibility();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<CurrentPage>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Equipment form state
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);

  // Initialize the app and announce to screen readers
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await measureInteraction('app-initialization', async () => {
          // Simulate app initialization with potential failure
          await new Promise((resolve, reject) => {
            setTimeout(() => {
              // Simulate occasional initialization failure for testing
              if (Math.random() > 0.95) {
                reject(new Error('Failed to initialize application services'));
              } else {
                resolve(undefined);
              }
            }, 500);
          });
        });

        setIsInitialized(true);
        setInitError(null);

        // Initialize navigation manager
        const currentRoute = navigationManager.initialize();

        // Set initial page based on URL
        if (currentRoute.page !== selectedView) {
          setSelectedView(currentRoute.page);
          setCurrentPage(currentRoute.page);
        }

        announce('Cobalt Mobile astrophotography control application loaded and ready');
      } catch (error) {
        setInitError(error instanceof Error ? error.message : 'Failed to initialize application');
        console.error('App initialization failed:', error);
      }
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

  // Handle refresh action with error handling
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    announce('Refreshing data...');

    try {
      await measureInteraction('refresh-data', async () => {
        // Simulate data refresh with potential failure
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            // Simulate occasional refresh failure
            if (Math.random() > 0.9) {
              reject(new Error('Failed to refresh data from server'));
            } else {
              resolve(undefined);
            }
          }, 1500);
        });
      });

      announce('Data refreshed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
      announce(`Refresh failed: ${errorMessage}`);
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
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

  // Helper functions for the new adaptive layout
  const getPageTitle = (page: CurrentPage): string => {
    const titles: Record<CurrentPage, string> = {
      dashboard: 'Cobalt Mobile Dashboard',
      weather: 'Weather & Conditions',
      analysis: 'Image Analysis',
      health: 'Equipment Health',
      guiding: 'Guiding & Polar Alignment',
      devices: 'Equipment Management',
      sequence: 'Sequence Planning',
      targets: 'Target Planning',
      'camera-detail': 'Camera Control',
      'mount-detail': 'Mount Control',
      'focuser-detail': 'Focuser Control',
      'filter-detail': 'Filter Wheel Control',
      logs: 'System Logs',
      settings: 'Settings',
      profiles: 'Equipment Profiles',
      monitor: 'Real-time Monitor',
      planner: 'Sequence Planner',
    };
    return titles[page] || 'Cobalt Mobile';
  };

  const getPageActions = (page: CurrentPage): React.ReactNode => {
    const commonActions = (
      <div className="flex items-center gap-3">
        <DesktopOnly>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </DesktopOnly>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button size="sm">
          <Download className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    );

    // Page-specific actions can be added here
    switch (page) {
      case 'sequence':
        return (
          <div className="flex items-center gap-3">
            {commonActions}
            <Button size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Start Sequence
            </Button>
          </div>
        );
      case 'camera-detail':
      case 'mount-detail':
      case 'focuser-detail':
      case 'filter-detail':
        return (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedView('devices');
                setCurrentPage('devices');
                announce('Navigated back to devices page');
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Devices
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        );
      default:
        return commonActions;
    }
  };

  const getDesktopRightPanel = (page: CurrentPage): React.ReactNode => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Activity className="h-4 w-4 mr-2" />
              Start Sequence
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Equipment Setup
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Target className="h-4 w-4 mr-2" />
              Plan Targets
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connected Devices</span>
              <Badge variant="secondary">4</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Sequences</span>
              <Badge variant="secondary">2</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Weather Score</span>
              <Badge variant="default">8.5/10</Badge>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-medium">Sequence completed</div>
              <div className="text-muted-foreground">M31 - 2 hours ago</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Equipment connected</div>
              <div className="text-muted-foreground">Mount - 3 hours ago</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Weather updated</div>
              <div className="text-muted-foreground">Clear skies - 5 min ago</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

    if (selectedView === 'devices') {
      return [
        {
          id: 'equipment-page',
          title: 'Equipment Management',
          content: (
            <DevicesPage
              onDeviceClick={(page) => {
                setSelectedView(page);
                setCurrentPage(page);
                announce(`Navigated to ${page} page`);
              }}
            />
          ),
          priority: 'high' as const,
        },
      ];
    }

    // Handle device detail pages
    if (selectedView === 'camera-detail') {
      return [
        {
          id: 'camera-detail-page',
          title: 'Camera Control',
          content: (
            <CameraDetailPage
              onBack={() => {
                setSelectedView('devices');
                setCurrentPage('devices');
                announce('Navigated back to devices page');
              }}
            />
          ),
          priority: 'high' as const,
        },
      ];
    }

    if (selectedView === 'mount-detail') {
      return [
        {
          id: 'mount-detail-page',
          title: 'Mount Control',
          content: (
            <TelescopeDetailPage
              onBack={() => {
                setSelectedView('devices');
                setCurrentPage('devices');
                announce('Navigated back to devices page');
              }}
              onSwipeNavigate={(page) => {
                setSelectedView(page);
                setCurrentPage(page);
                announce(`Navigated to ${page} page`);
              }}
              currentPage={selectedView}
            />
          ),
          priority: 'high' as const,
        },
      ];
    }

    if (selectedView === 'focuser-detail') {
      return [
        {
          id: 'focuser-detail-page',
          title: 'Focuser Control',
          content: (
            <FocuserDetailPage
              onBack={() => {
                setSelectedView('devices');
                setCurrentPage('devices');
                announce('Navigated back to devices page');
              }}
              onSwipeNavigate={(page) => {
                setSelectedView(page);
                setCurrentPage(page);
                announce(`Navigated to ${page} page`);
              }}
              currentPage={selectedView}
            />
          ),
          priority: 'high' as const,
        },
      ];
    }

    if (selectedView === 'filter-detail') {
      return [
        {
          id: 'filter-detail-page',
          title: 'Filter Wheel Control',
          content: (
            <FilterWheelDetailPage
              onBack={() => {
                setSelectedView('devices');
                setCurrentPage('devices');
                announce('Navigated back to devices page');
              }}
              onSwipeNavigate={(page) => {
                setSelectedView(page);
                setCurrentPage(page);
                announce(`Navigated to ${page} page`);
              }}
              currentPage={selectedView}
            />
          ),
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

  // Handle initialization retry
  const handleInitRetry = useCallback(() => {
    setInitError(null);
    setIsInitialized(false);
    // Re-trigger initialization
    window.location.reload();
  }, []);

  // Show loading/error state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AsyncState
          loading={!initError}
          error={initError}
          onRetry={handleInitRetry}
          loadingComponent={
            <LoadingCard
              title="Initializing Cobalt Mobile"
              description="Setting up your astrophotography control center"
              className="max-w-md"
            />
          }
        >
          {/* This won't render during initialization */}
          <div />
        </AsyncState>
      </div>
    );
  }

  return (
    <LayoutProvider>
      <AdaptiveLayout
        currentPage={selectedView}
        onPageChange={(page) => {
          setSelectedView(page);
          setCurrentPage(page);
          announce(`Navigated to ${page} page`);
        }}
        title={getPageTitle(selectedView)}
        actions={getPageActions(selectedView)}
        rightPanel={getDesktopRightPanel(selectedView)}
        className="min-h-screen"
        enableDesktopSidebar={true}
        enableDesktopHeader={true}
        enableRightPanel={true}
        enableMobileNavigation={true}
        enableMobileGestures={true}
      >
        {/* Mobile-specific gesture navigation */}
        <MobileOnly>
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
        </MobileOnly>

        {/* Desktop and mobile content */}
        <AdaptivePageContent
          selectedView={selectedView}
          onShowEquipmentForm={() => {
            setEditingEquipment(null);
            setShowEquipmentForm(true);
          }}
          onEditEquipment={(equipment) => {
            setEditingEquipment(equipment);
            setShowEquipmentForm(true);
          }}
        />
      </AdaptiveLayout>

      {/* Development helper */}
      <BreakpointIndicator />

      {/* Equipment Form Modal */}
      {showEquipmentForm && (
        <EquipmentForm
          equipment={editingEquipment}
          onClose={() => {
            setShowEquipmentForm(false);
            setEditingEquipment(null);
          }}
          onSave={(equipment) => {
            console.log('Equipment saved:', equipment);
            setShowEquipmentForm(false);
            setEditingEquipment(null);
          }}
        />
      )}
    </LayoutProvider>
  );
}

// Adaptive page content component that renders different layouts for desktop vs mobile
function AdaptivePageContent({
  selectedView,
  onShowEquipmentForm,
  onEditEquipment
}: {
  selectedView: CurrentPage;
  onShowEquipmentForm?: () => void;
  onEditEquipment?: (equipment: any) => void;
}) {
  const { isDesktop } = useDesktopResponsive();

  // Desktop uses enhanced layouts
  if (isDesktop) {
    return <DesktopPageContent
      selectedView={selectedView}
      onShowEquipmentForm={onShowEquipmentForm}
      onEditEquipment={onEditEquipment}
    />;
  }

  // Mobile uses existing vertical layout system
  return <MobilePageContent selectedView={selectedView} />;
}

// Desktop-specific page content with enhanced layouts
function DesktopPageContent({
  selectedView,
  onShowEquipmentForm,
  onEditEquipment
}: {
  selectedView: CurrentPage;
  onShowEquipmentForm?: () => void;
  onEditEquipment?: (equipment: any) => void;
}) {
  switch (selectedView) {
    case 'dashboard':
      return <DesktopDashboardContent />;
    case 'weather':
      return <DesktopWeatherContent />;
    case 'analysis':
      return <DesktopAnalysisContent />;
    case 'health':
      return <DesktopHealthContent />;
    case 'guiding':
      return <DesktopGuidingContent />;
    case 'devices':
      return <DesktopEquipmentContent onShowEquipmentForm={onShowEquipmentForm} onEditEquipment={onEditEquipment} />;
    case 'camera-detail':
      return <DesktopDeviceDetailContent selectedView={selectedView} />;
    case 'mount-detail':
      return <DesktopDeviceDetailContent selectedView={selectedView} />;
    case 'focuser-detail':
      return <DesktopDeviceDetailContent selectedView={selectedView} />;
    case 'filter-detail':
      return <DesktopDeviceDetailContent selectedView={selectedView} />;
    default:
      return <DesktopDefaultContent selectedView={selectedView} />;
  }
}

// Mobile page content using existing system
function MobilePageContent({ selectedView }: { selectedView: CurrentPage }) {
  // This preserves the existing mobile layout logic
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
                    <div className="text-2xl font-bold text-blue-500">2</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>
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

    if (selectedView === 'devices') {
      return [
        {
          id: 'equipment-page',
          title: 'Equipment Management',
          content: (
            <DevicesPage
              onDeviceClick={(page) => {
                setSelectedView(page);
                setCurrentPage(page);
                announce(`Navigated to ${page} page`);
              }}
            />
          ),
          priority: 'high' as const,
        },
      ];
    }

    // Handle device detail pages
    if (selectedView === 'camera-detail') {
      return [
        {
          id: 'camera-detail-page',
          title: 'Camera Control',
          content: (
            <CameraDetailPage
              onBack={() => {
                setSelectedView('devices');
                setCurrentPage('devices');
                announce('Navigated back to devices page');
              }}
            />
          ),
          priority: 'high' as const,
        },
      ];
    }

    if (selectedView === 'mount-detail') {
      return [
        {
          id: 'mount-detail-page',
          title: 'Mount Control',
          content: (
            <TelescopeDetailPage
              onBack={() => {
                setSelectedView('devices');
                setCurrentPage('devices');
                announce('Navigated back to devices page');
              }}
              onSwipeNavigate={(page) => {
                setSelectedView(page);
                setCurrentPage(page);
                announce(`Navigated to ${page} page`);
              }}
              currentPage={selectedView}
            />
          ),
          priority: 'high' as const,
        },
      ];
    }

    if (selectedView === 'focuser-detail') {
      return [
        {
          id: 'focuser-detail-page',
          title: 'Focuser Control',
          content: (
            <FocuserDetailPage
              onBack={() => {
                setSelectedView('devices');
                setCurrentPage('devices');
                announce('Navigated back to devices page');
              }}
              onSwipeNavigate={(page) => {
                setSelectedView(page);
                setCurrentPage(page);
                announce(`Navigated to ${page} page`);
              }}
              currentPage={selectedView}
            />
          ),
          priority: 'high' as const,
        },
      ];
    }

    if (selectedView === 'filter-detail') {
      return [
        {
          id: 'filter-detail-page',
          title: 'Filter Wheel Control',
          content: (
            <FilterWheelDetailPage
              onBack={() => {
                setSelectedView('devices');
                setCurrentPage('devices');
                announce('Navigated back to devices page');
              }}
              onSwipeNavigate={(page) => {
                setSelectedView(page);
                setCurrentPage(page);
                announce(`Navigated to ${page} page`);
              }}
              currentPage={selectedView}
            />
          ),
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
              <p className="text-muted-foreground">
                {selectedView === 'devices'
                  ? 'Manage and monitor your astrophotography equipment.'
                  : selectedView === 'targets'
                  ? 'Plan and select targets for your imaging sessions.'
                  : 'Create and manage automated imaging sequences.'
                }
              </p>
            </CardContent>
          </Card>
        ),
        priority: 'medium' as const,
      },
    ];
  };

  return (
    <VerticalLayout
      sections={getDashboardSections()}
      spacing="standard"
      adaptiveHeight={true}
    />
  );
}

// Desktop dashboard content with enhanced layout
function DesktopDashboardContent() {
  const metrics = [
    {
      title: 'Connected Devices',
      value: '4',
      change: '+2',
      icon: Activity,
      color: 'text-green-500',
    },
    {
      title: 'Active Sequences',
      value: '2',
      change: '0',
      icon: Star,
      color: 'text-blue-500',
    },
    {
      title: 'Weather Score',
      value: '8.5',
      change: '+0.3',
      icon: Cloud,
      color: 'text-yellow-500',
    },
    {
      title: 'Images Captured',
      value: '127',
      change: '+15',
      icon: Camera,
      color: 'text-purple-500',
    },
  ];

  const metricsCards = metrics.map((metric, index) => (
    <Card key={index}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold">{metric.value}</span>
              {metric.change !== '0' && (
                <Badge variant="secondary" className="text-xs">
                  {metric.change}
                </Badge>
              )}
            </div>
          </div>
          <metric.icon className={`h-8 w-8 ${metric.color}`} />
        </div>
      </CardContent>
    </Card>
  ));

  return (
    <DesktopDashboardLayout
      title="Cobalt Mobile Dashboard"
      subtitle="Astrophotography Control Center"
      metrics={metricsCards}
      primaryContent={
        <div className="space-y-6">
          {/* Desktop Layout Test (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <DesktopLayoutTest />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Equipment Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <DesktopGrid columns={{ desktop: 2, wide: 3, ultrawide: 4 }} gap="lg">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Equipment Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">
                      Monitor your astrophotography equipment health and performance
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-green-500">
                        All systems operational
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Target Planning
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">
                      Plan your imaging sessions with optimal target selection
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium text-blue-500">
                        3 targets visible tonight
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cloud className="h-5 w-5" />
                      Weather Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">
                      Current and predicted weather conditions for imaging
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-green-500">
                        Clear skies expected
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </DesktopGrid>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}

// Desktop weather content
function DesktopWeatherContent() {
  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-300 rounded">
          <p className="text-blue-800 font-medium">Desktop Weather Dashboard</p>
          <p className="text-blue-600 text-sm">Enhanced desktop layout with full WeatherDashboard component</p>
        </div>
      )}
      <WeatherDashboard />
    </div>
  );
}

// Desktop analysis content
function DesktopAnalysisContent() {
  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded">
          <p className="text-green-800 font-medium">Desktop Image Analysis Dashboard</p>
          <p className="text-green-600 text-sm">Enhanced desktop layout with full ImageAnalysisDashboard component</p>
        </div>
      )}
      <ImageAnalysisDashboard />
    </div>
  );
}

// Desktop health content
function DesktopHealthContent() {
  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
          <p className="text-red-800 font-medium">Desktop Equipment Health Dashboard</p>
          <p className="text-red-600 text-sm">Enhanced desktop layout with full EquipmentHealthDashboard component</p>
        </div>
      )}
      <EquipmentHealthDashboard />
    </div>
  );
}

// Desktop guiding content
function DesktopGuidingContent() {
  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-purple-100 border border-purple-300 rounded">
          <p className="text-purple-800 font-medium">Desktop Guiding Dashboard</p>
          <p className="text-purple-600 text-sm">Enhanced desktop layout with full GuidingDashboard component</p>
        </div>
      )}
      <GuidingDashboard />
    </div>
  );
}

// Desktop equipment content
function DesktopEquipmentContent({
  onShowEquipmentForm,
  onEditEquipment
}: {
  onShowEquipmentForm?: () => void;
  onEditEquipment?: (equipment: any) => void;
}) {
  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-orange-100 border border-orange-300 rounded">
          <p className="text-orange-800 font-medium">Desktop Equipment Management</p>
          <p className="text-orange-600 text-sm">Enhanced desktop layout with full Equipment management functionality</p>
        </div>
      )}
      <EquipmentPage
        onAddEquipment={onShowEquipmentForm}
        onEditEquipment={onEditEquipment}
        onEquipmentClick={(equipment) => {
          // Handle equipment detail view if needed
          console.log('Equipment clicked:', equipment);
        }}
      />
    </div>
  );
}

// Desktop device detail content
function DesktopDeviceDetailContent({ selectedView }: { selectedView: CurrentPage }) {
  const { setCurrentPage } = useAppStore();
  const { announce } = useAccessibility();

  const handleBack = () => {
    setCurrentPage('devices');
    announce('Navigated back to devices page');
  };

  const handleSwipeNavigate = (page: CurrentPage) => {
    setCurrentPage(page);
    announce(`Navigated to ${page} page`);
  };

  const getDeviceType = (view: CurrentPage): 'camera' | 'mount' | 'focuser' | 'filter' => {
    switch (view) {
      case 'camera-detail':
        return 'camera';
      case 'mount-detail':
        return 'mount';
      case 'focuser-detail':
        return 'focuser';
      case 'filter-detail':
        return 'filter';
      default:
        return 'camera';
    }
  };

  return (
    <DesktopDashboardLayout
      title={getDeviceDetailTitle(selectedView)}
      subtitle={getDeviceDetailSubtitle(selectedView)}
      spacing="comfortable"
    >
      {/* Two-column layout for desktop */}
      <DesktopGrid columns={2} gap="lg" className="h-full">
        {/* Left column - Enhanced device detail with tabs */}
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <div className="h-full overflow-hidden">
              <EnhancedDeviceDetail
                deviceType={getDeviceType(selectedView)}
                onBack={handleBack}
                onSwipeNavigate={handleSwipeNavigate}
                currentPage={selectedView}
                className="h-full overflow-auto p-6"
              >
                {/* Device-specific controls in the controls tab */}
                {selectedView === 'camera-detail' && (
                  <div className="space-y-4">
                    <CameraDetailPage onBack={handleBack} />
                  </div>
                )}
                {selectedView === 'mount-detail' && (
                  <div className="space-y-4">
                    <TelescopeDetailPage
                      onBack={handleBack}
                      onSwipeNavigate={handleSwipeNavigate}
                      currentPage={selectedView}
                    />
                  </div>
                )}
                {selectedView === 'focuser-detail' && (
                  <div className="space-y-4">
                    <FocuserDetailPage
                      onBack={handleBack}
                      onSwipeNavigate={handleSwipeNavigate}
                      currentPage={selectedView}
                    />
                  </div>
                )}
                {selectedView === 'filter-detail' && (
                  <div className="space-y-4">
                    <FilterWheelDetailPage
                      onBack={handleBack}
                      onSwipeNavigate={handleSwipeNavigate}
                      currentPage={selectedView}
                    />
                  </div>
                )}
              </EnhancedDeviceDetail>
            </div>
          </CardContent>
        </Card>

        {/* Right column - Additional information and quick actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Device Settings
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Activity className="h-4 w-4 mr-2" />
                Run Diagnostics
              </Button>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge variant="default" className="bg-green-500">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Signal Strength</span>
                <span className="text-sm font-medium">Excellent</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Update</span>
                <span className="text-sm font-medium">Just now</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Uptime</span>
                <span className="text-sm font-medium">2h 15m</span>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Performance</span>
                  <span className="font-medium">95%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Stability</span>
                  <span className="font-medium">98%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Response Time</span>
                  <span className="font-medium">45ms</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DesktopGrid>
    </DesktopDashboardLayout>
  );
}

// Helper functions for device detail titles
function getDeviceDetailTitle(selectedView: CurrentPage): string {
  switch (selectedView) {
    case 'camera-detail':
      return 'Camera Control';
    case 'mount-detail':
      return 'Mount Control';
    case 'focuser-detail':
      return 'Focuser Control';
    case 'filter-detail':
      return 'Filter Wheel Control';
    default:
      return 'Device Control';
  }
}

function getDeviceDetailSubtitle(selectedView: CurrentPage): string {
  switch (selectedView) {
    case 'camera-detail':
      return 'Manage camera settings, capture images, and monitor status';
    case 'mount-detail':
      return 'Control telescope mount, tracking, and positioning';
    case 'focuser-detail':
      return 'Adjust focus position and run autofocus routines';
    case 'filter-detail':
      return 'Select filters and manage filter wheel operations';
    default:
      return 'Device management and control';
  }
}

// Desktop default content for other pages
function DesktopDefaultContent({ selectedView }: { selectedView: CurrentPage }) {
  return (
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
        <p className="text-muted-foreground">
          {selectedView === 'devices'
            ? 'Manage and monitor your astrophotography equipment.'
            : selectedView === 'targets'
            ? 'Plan and select targets for your imaging sessions.'
            : 'Create and manage automated imaging sequences.'
          }
        </p>
      </CardContent>
    </Card>
  );
}

// Welcome content component (preserved from original)
const WelcomeContent = () => (
  <OptimizedMotion
    animation="slide"
    direction="up"
    className="space-y-6"
  >
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Welcome to Cobalt Mobile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Your comprehensive astrophotography control center. Monitor equipment,
          plan imaging sessions, and capture stunning deep-sky objects with precision.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">4</div>
            <div className="text-xs text-muted-foreground">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">2</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
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
