"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  PanelLeftOpen,
  PanelLeftClose,
  MoreHorizontal,
  Settings
} from 'lucide-react';

// Desktop-specific breakpoints and constants
export const DESKTOP_BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultrawide: 1536,
} as const;

export const DESKTOP_SIDEBAR_WIDTHS = {
  collapsed: 64,
  normal: 280,
  wide: 320,
} as const;

export const DESKTOP_SPACING = {
  compact: {
    padding: 'p-4',
    gap: 'gap-4',
    margin: 'm-4',
  },
  standard: {
    padding: 'p-6',
    gap: 'gap-6',
    margin: 'm-6',
  },
  generous: {
    padding: 'p-8',
    gap: 'gap-8',
    margin: 'm-8',
  },
} as const;

interface DesktopLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  rightPanel?: React.ReactNode;
  className?: string;
  sidebarWidth?: keyof typeof DESKTOP_SIDEBAR_WIDTHS;
  sidebarCollapsible?: boolean;
  sidebarDefaultCollapsed?: boolean;
  rightPanelWidth?: number;
  rightPanelCollapsible?: boolean;
  spacing?: keyof typeof DESKTOP_SPACING;
  maxWidth?: 'none' | 'container' | 'wide' | 'ultrawide';
  enableAnimations?: boolean;
}

interface DesktopLayoutState {
  sidebarCollapsed: boolean;
  rightPanelCollapsed: boolean;
  isDesktop: boolean;
  isWideScreen: boolean;
  isUltraWide: boolean;
}

export function DesktopLayout({
  children,
  sidebar,
  header,
  footer,
  rightPanel,
  className,
  sidebarWidth = 'normal',
  sidebarCollapsible = true,
  sidebarDefaultCollapsed = false,
  rightPanelWidth = 320,
  rightPanelCollapsible = true,
  spacing = 'standard',
  maxWidth = 'container',
  enableAnimations = true,
}: DesktopLayoutProps) {
  const [layoutState, setLayoutState] = useState<DesktopLayoutState>({
    sidebarCollapsed: sidebarDefaultCollapsed,
    rightPanelCollapsed: false,
    isDesktop: false,
    isWideScreen: false,
    isUltraWide: false,
  });

  // Responsive breakpoint detection
  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      setLayoutState(prev => ({
        ...prev,
        isDesktop: width >= DESKTOP_BREAKPOINTS.desktop,
        isWideScreen: width >= DESKTOP_BREAKPOINTS.wide,
        isUltraWide: width >= DESKTOP_BREAKPOINTS.ultrawide,
      }));
    };

    updateBreakpoints();
    window.addEventListener('resize', updateBreakpoints);
    return () => window.removeEventListener('resize', updateBreakpoints);
  }, []);

  // Auto-collapse sidebar on smaller screens
  useEffect(() => {
    if (!layoutState.isDesktop && !layoutState.sidebarCollapsed) {
      setLayoutState(prev => ({ ...prev, sidebarCollapsed: true }));
    }
  }, [layoutState.isDesktop]);

  const toggleSidebar = useCallback(() => {
    setLayoutState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setLayoutState(prev => ({ ...prev, rightPanelCollapsed: !prev.rightPanelCollapsed }));
  }, []);

  // Calculate layout dimensions
  const getSidebarWidth = () => {
    if (!sidebar) return 0;
    if (layoutState.sidebarCollapsed) return DESKTOP_SIDEBAR_WIDTHS.collapsed;
    return DESKTOP_SIDEBAR_WIDTHS[sidebarWidth];
  };

  const getRightPanelWidth = () => {
    if (!rightPanel || layoutState.rightPanelCollapsed) return 0;
    return rightPanelWidth;
  };

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'none': return 'max-w-none';
      case 'container': return 'max-w-7xl';
      case 'wide': return 'max-w-[1400px]';
      case 'ultrawide': return 'max-w-[1600px]';
      default: return 'max-w-7xl';
    }
  };

  const spacingClasses = DESKTOP_SPACING[spacing];

  // Animation variants
  const sidebarVariants = {
    collapsed: { width: DESKTOP_SIDEBAR_WIDTHS.collapsed },
    expanded: { width: getSidebarWidth() },
  };

  const rightPanelVariants = {
    collapsed: { width: 0, opacity: 0 },
    expanded: { width: rightPanelWidth, opacity: 1 },
  };

  const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  // Don't render desktop layout on mobile
  if (!layoutState.isDesktop) {
    return (
      <div className={cn("min-h-screen", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn(
      "desktop-layout-container min-h-screen bg-background",
      "desktop-text-rendering",
      className
    )}>
      {/* Left Sidebar - Fixed/Sticky */}
      {sidebar && (
        <motion.aside
          variants={enableAnimations ? sidebarVariants : undefined}
          animate={layoutState.sidebarCollapsed ? 'collapsed' : 'expanded'}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={cn(
            "desktop-sidebar desktop-scrollbar",
            "fixed left-0 top-0 h-screen z-40",
            "flex-shrink-0 border-r border-border bg-card/95 backdrop-blur-sm",
            "flex flex-col"
          )}
          style={{ width: getSidebarWidth() }}
        >
          {/* Sidebar Header */}
          <div className={cn(
            "flex items-center justify-between border-b border-border",
            spacingClasses.padding
          )}>
            {!layoutState.sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold truncate">Navigation</h2>
              </div>
            )}
            {sidebarCollapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="flex-shrink-0"
              >
                {layoutState.sidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-auto">
            <div className={cn(
              layoutState.sidebarCollapsed ? 'p-2' : spacingClasses.padding
            )}>
              {sidebar}
            </div>
          </div>
        </motion.aside>
      )}

      {/* Main Content Area - Offset by sidebar width */}
      <div
        className="flex-1 flex flex-col min-w-0 min-h-screen"
        style={{ marginLeft: getSidebarWidth() }}
      >
        {/* Header - Fixed/Sticky */}
        {header && (
          <header className={cn(
            "desktop-header",
            "fixed top-0 right-0 z-30",
            "flex-shrink-0 border-b border-border bg-card/95",
            spacingClasses.padding
          )}
          style={{
            left: getSidebarWidth(),
            width: `calc(100% - ${getSidebarWidth()}px)`
          }}>
            {header}
          </header>
        )}

        {/* Content with Right Panel */}
        <div
          className="flex-1 flex min-h-0"
          style={{
            marginTop: header ? '80px' : '0', // Offset for fixed header
            minHeight: header ? 'calc(100vh - 80px)' : '100vh'
          }}
        >
          {/* Main Content - Scrollable */}
          <main
            className={cn(
              "desktop-main-content desktop-scrollbar desktop-layout-transition",
              "flex-1 min-w-0"
            )}
            style={{
              marginRight: !layoutState.rightPanelCollapsed && rightPanel ? `${getRightPanelWidth()}px` : '0'
            }}
          >
            <div className={cn(
              "desktop-content-wrapper desktop-dashboard-content desktop-content-safe-area",
              "mx-auto",
              getMaxWidthClass()
            )}>
              <AnimatePresence mode="wait">
                <motion.div
                  variants={enableAnimations ? contentVariants : undefined}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="desktop-layout-gpu-accelerated"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Right Panel - Fixed/Sticky */}
          {rightPanel && !layoutState.rightPanelCollapsed && (
            <motion.aside
              variants={enableAnimations ? rightPanelVariants : undefined}
              animate={layoutState.rightPanelCollapsed ? 'collapsed' : 'expanded'}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={cn(
                "desktop-right-panel desktop-scrollbar",
                "fixed right-0 z-30",
                "flex-shrink-0 border-l border-border bg-card/95 backdrop-blur-sm",
                "flex flex-col"
              )}
              style={{
                width: getRightPanelWidth(),
                top: header ? '80px' : '0',
                height: header ? 'calc(100vh - 80px)' : '100vh'
              }}
            >
              {/* Right Panel Header */}
              <div className={cn(
                "flex items-center justify-between border-b border-border",
                spacingClasses.padding
              )}>
                <h3 className="text-sm font-medium">Panel</h3>
                {rightPanelCollapsible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRightPanel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Right Panel Content */}
              <div className="flex-1 overflow-auto">
                <div className={spacingClasses.padding}>
                  {rightPanel}
                </div>
              </div>
            </motion.aside>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        {footer && (
          <footer className={cn(
            "fixed bottom-0 z-30",
            "flex-shrink-0 border-t border-border bg-card/95 backdrop-blur-sm",
            spacingClasses.padding
          )}
          style={{
            left: getSidebarWidth(),
            right: !layoutState.rightPanelCollapsed && rightPanel ? `${getRightPanelWidth()}px` : '0'
          }}>
            {footer}
          </footer>
        )}
      </div>

      {/* Right Panel Toggle Button (when collapsed) */}
      {rightPanel && layoutState.rightPanelCollapsed && rightPanelCollapsible && (
        <div className="fixed top-1/2 right-4 -translate-y-1/2 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleRightPanel}
            className="shadow-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
