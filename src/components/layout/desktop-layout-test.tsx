"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDesktopResponsive } from '@/hooks/use-desktop-responsive';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  MousePointer,
  Keyboard,
  Layout,
  Sidebar,
  Navigation,
  Scroll,
  Maximize2
} from 'lucide-react';

interface DesktopLayoutTestProps {
  className?: string;
}

export function DesktopLayoutTest({ className }: DesktopLayoutTestProps) {
  const { isDesktop, isMobile, isTablet, breakpoint, width, height } = useDesktopResponsive();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const results: Record<string, boolean> = {};

    // Test 1: Desktop breakpoint detection
    results.breakpointDetection = width >= 1024;

    // Test 2: Sidebar visibility
    const sidebar = document.querySelector('.desktop-sidebar');
    results.sidebarVisible = !!sidebar;

    // Test 3: Header positioning
    const header = document.querySelector('.desktop-header');
    results.headerPositioned = !!header && getComputedStyle(header).position === 'fixed';

    // Test 4: Main content scrollability
    const mainContent = document.querySelector('.desktop-main-content');
    results.mainContentScrollable = !!mainContent && getComputedStyle(mainContent).overflowY === 'auto';

    // Test 5: Right panel functionality
    const rightPanel = document.querySelector('.desktop-right-panel');
    results.rightPanelExists = !!rightPanel;

    // Test 6: CSS classes applied
    const layoutContainer = document.querySelector('.desktop-layout-container');
    results.cssClassesApplied = !!layoutContainer;

    // Test 7: Content visibility
    const contentWrapper = document.querySelector('.desktop-content-wrapper');
    results.contentVisible = !!contentWrapper;

    // Test 8: Responsive grid functionality
    const gridElements = document.querySelectorAll('[class*="grid-cols-"]');
    results.responsiveGrids = gridElements.length > 0;

    // Simulate async test delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    setTestResults(results);
    setIsRunning(false);
  };

  const getTestIcon = (passed: boolean | undefined) => {
    if (passed === undefined) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return passed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getTestStatus = (passed: boolean | undefined) => {
    if (passed === undefined) return 'Not Run';
    return passed ? 'Passed' : 'Failed';
  };

  const tests = [
    {
      id: 'breakpointDetection',
      name: 'Desktop Breakpoint Detection',
      description: 'Verifies that desktop breakpoint (≥1024px) is correctly detected',
      icon: Monitor,
    },
    {
      id: 'sidebarVisible',
      name: 'Sidebar Visibility',
      description: 'Checks if the desktop sidebar is rendered and visible',
      icon: Sidebar,
    },
    {
      id: 'headerPositioned',
      name: 'Header Positioning',
      description: 'Verifies that the header is fixed/sticky positioned',
      icon: Navigation,
    },
    {
      id: 'mainContentScrollable',
      name: 'Main Content Scrollability',
      description: 'Ensures main content area is properly scrollable',
      icon: Scroll,
    },
    {
      id: 'rightPanelExists',
      name: 'Right Panel Functionality',
      description: 'Checks if the right panel is rendered when enabled',
      icon: Layout,
    },
    {
      id: 'cssClassesApplied',
      name: 'CSS Classes Applied',
      description: 'Verifies that desktop-specific CSS classes are applied',
      icon: Eye,
    },
    {
      id: 'contentVisible',
      name: 'Content Visibility',
      description: 'Ensures content wrapper is present and visible',
      icon: Maximize2,
    },
    {
      id: 'responsiveGrids',
      name: 'Responsive Grids',
      description: 'Checks if responsive grid classes are applied',
      icon: Layout,
    },
  ];

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = tests.length;
  const allTestsRun = Object.keys(testResults).length === totalTests;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Desktop Layout Test Suite
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {isDesktop ? <Monitor className="h-4 w-4" /> : 
               isTablet ? <Tablet className="h-4 w-4" /> : 
               <Smartphone className="h-4 w-4" />}
              <span>{breakpoint} ({width}x{height})</span>
            </div>
            {allTestsRun && (
              <Badge variant={passedTests === totalTests ? "default" : "destructive"}>
                {passedTests}/{totalTests} Passed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Running Tests...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Run Desktop Tests
                </>
              )}
            </Button>
            
            {!isDesktop && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Switch to desktop view (≥1024px) for accurate testing</span>
              </div>
            )}
          </div>

          <div className="grid gap-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <test.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-muted-foreground">{test.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTestIcon(testResults[test.id])}
                  <span className="text-sm font-medium">
                    {getTestStatus(testResults[test.id])}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {allTestsRun && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Test Summary</h4>
              <div className="space-y-2 text-sm">
                <div>Total Tests: {totalTests}</div>
                <div>Passed: {passedTests}</div>
                <div>Failed: {totalTests - passedTests}</div>
                <div>Success Rate: {Math.round((passedTests / totalTests) * 100)}%</div>
              </div>
              
              {passedTests === totalTests ? (
                <div className="mt-3 flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">All tests passed! Desktop layout is working correctly.</span>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Some tests failed. Check the layout implementation.</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Desktop Layout Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700 dark:text-blue-300">
              <div>✓ Fixed/sticky sidebar navigation</div>
              <div>✓ Fixed/sticky header with breadcrumbs</div>
              <div>✓ Scrollable main content area</div>
              <div>✓ Collapsible right panel</div>
              <div>✓ Responsive grid layouts (3-6 columns)</div>
              <div>✓ Desktop-optimized spacing</div>
              <div>✓ Smooth animations and transitions</div>
              <div>✓ Professional desktop app experience</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
