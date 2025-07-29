"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  BarChart3, 
  Cloud, 
  Camera, 
  Target, 
  Heart,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';

// Import our new desktop layout components
import { AdaptiveLayout, LayoutProvider } from '@/components/layout/adaptive-layout';
import { DesktopDashboardLayout } from '@/components/layout/desktop-page-layouts';
import { DesktopGrid, DesktopGridPresets } from '@/components/layout/desktop-grid';
import { DesktopOnly, MobileOnly, BreakpointIndicator } from '@/components/ui/desktop-utilities';
import { useDesktopResponsive } from '@/hooks/use-desktop-responsive';
import { CurrentPage } from '@/lib/store';

// Example dashboard implementation using desktop layouts
export function DesktopIntegratedDashboard() {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('dashboard');
  const { isDesktop, breakpoint } = useDesktopResponsive();

  // Sample metrics data
  const metrics = [
    {
      title: 'Connected Devices',
      value: '4',
      change: '+2',
      trend: 'up',
      icon: Activity,
      color: 'text-green-500',
    },
    {
      title: 'Active Sequences',
      value: '2',
      change: '0',
      trend: 'stable',
      icon: BarChart3,
      color: 'text-blue-500',
    },
    {
      title: 'Weather Score',
      value: '8.5',
      change: '+0.3',
      trend: 'up',
      icon: Cloud,
      color: 'text-yellow-500',
    },
    {
      title: 'Images Captured',
      value: '127',
      change: '+15',
      trend: 'up',
      icon: Camera,
      color: 'text-purple-500',
    },
  ];

  // Sample content cards
  const contentCards = [
    {
      title: 'Equipment Status',
      description: 'Monitor your astrophotography equipment health and performance',
      icon: Heart,
      status: 'All systems operational',
      statusColor: 'text-green-500',
    },
    {
      title: 'Target Planning',
      description: 'Plan your imaging sessions with optimal target selection',
      icon: Target,
      status: '3 targets visible tonight',
      statusColor: 'text-blue-500',
    },
    {
      title: 'Weather Forecast',
      description: 'Current and predicted weather conditions for imaging',
      icon: Cloud,
      status: 'Clear skies expected',
      statusColor: 'text-green-500',
    },
  ];

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-3">
      <DesktopOnly>
        <Button variant="outline" size="sm">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </DesktopOnly>
      <Button variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
      <Button size="sm">
        <Download className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Export</span>
      </Button>
    </div>
  );

  // Right panel content (desktop only)
  const rightPanelContent = (
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

      <div>
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">CPU Usage</span>
            <Badge variant="secondary">23%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Memory</span>
            <Badge variant="secondary">1.2GB</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Storage</span>
            <Badge variant="secondary">45GB</Badge>
          </div>
        </div>
      </div>
    </div>
  );

  // Render metrics cards
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

  // Render content cards
  const contentCardsElements = contentCards.map((card, index) => (
    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <card.icon className="h-5 w-5" />
          {card.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-3">{card.description}</p>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-current ${card.statusColor}`} />
          <span className={`text-sm font-medium ${card.statusColor}`}>
            {card.status}
          </span>
        </div>
      </CardContent>
    </Card>
  ));

  // Main dashboard content
  const dashboardContent = (
    <>
      {/* Desktop uses sophisticated dashboard layout */}
      <DesktopOnly>
        <DesktopDashboardLayout
          title="Cobalt Mobile Dashboard"
          subtitle="Astrophotography Control Center"
          actions={headerActions}
          metrics={metricsCards}
          primaryContent={
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Equipment Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <DesktopGridPresets.CardGrid>
                    {contentCardsElements}
                  </DesktopGridPresets.CardGrid>
                </CardContent>
              </Card>
            </div>
          }
          secondaryContent={
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">M31 Andromeda Galaxy</div>
                      <div className="text-sm text-muted-foreground">
                        120 x 300s • Ha, OIII, SII
                      </div>
                    </div>
                    <Badge>Completed</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">NGC 7000 North America</div>
                      <div className="text-sm text-muted-foreground">
                        80 x 240s • RGB
                      </div>
                    </div>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          }
        />
      </DesktopOnly>

      {/* Mobile uses simpler vertical layout */}
      <MobileOnly>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Button size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile metrics in 2-column grid */}
          <div className="grid grid-cols-2 gap-4">
            {metricsCards}
          </div>

          {/* Mobile content cards in single column */}
          <div className="space-y-4">
            {contentCardsElements}
          </div>
        </div>
      </MobileOnly>
    </>
  );

  return (
    <LayoutProvider>
      <AdaptiveLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        rightPanel={isDesktop ? rightPanelContent : undefined}
        enableDesktopSidebar={true}
        enableDesktopHeader={true}
        enableRightPanel={true}
        enableMobileNavigation={true}
      >
        {dashboardContent}
      </AdaptiveLayout>
      
      {/* Development helper */}
      <BreakpointIndicator />
    </LayoutProvider>
  );
}

// Example of how to use desktop-specific components in existing pages
export function EnhancedWeatherDashboard() {
  const { isDesktop } = useDesktopResponsive();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weather Conditions</h1>
        <div className="flex items-center gap-3">
          <DesktopOnly>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </DesktopOnly>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Update
          </Button>
        </div>
      </div>

      {/* Use desktop grid for larger screens, mobile stack for smaller */}
      <DesktopGrid
        columns={{
          desktop: 2,
          wide: 3,
          ultrawide: 4,
        }}
        gap="lg"
      >
        <Card>
          <CardHeader>
            <CardTitle>Current Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">Clear</div>
              <div className="text-muted-foreground">
                Perfect conditions for imaging
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tonight</span>
                <span className="text-green-500">Clear</span>
              </div>
              <div className="flex justify-between">
                <span>Tomorrow</span>
                <span className="text-yellow-500">Partly Cloudy</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isDesktop && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Humidity</span>
                  <span>45%</span>
                </div>
                <div className="flex justify-between">
                  <span>Wind Speed</span>
                  <span>5 mph</span>
                </div>
                <div className="flex justify-between">
                  <span>Pressure</span>
                  <span>30.15 inHg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DesktopGrid>
    </div>
  );
}
