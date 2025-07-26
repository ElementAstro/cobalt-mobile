"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deviceDetector, getDeviceInfo, isMobile, isTablet, isDesktop } from '@/lib/utils/device-detection';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
} from 'lucide-react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  sidebarCollapsible?: boolean;
  adaptiveNavigation?: boolean;
}

interface LayoutState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  orientation: 'portrait' | 'landscape';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isFullscreen: boolean;
}

export function ResponsiveLayout({
  children,
  sidebar,
  header,
  footer,
  className,
  sidebarCollapsible = true,
  adaptiveNavigation = true,
}: ResponsiveLayoutProps) {
  const [layoutState, setLayoutState] = useState<LayoutState>({
    sidebarOpen: false,
    sidebarCollapsed: false,
    orientation: 'portrait',
    deviceType: 'mobile',
    isFullscreen: false,
  });

  // Update layout state based on device info
  const updateLayoutState = useCallback(() => {
    const deviceInfo = getDeviceInfo();
    if (!deviceInfo) return;

    setLayoutState(prev => ({
      ...prev,
      orientation: deviceInfo.screen.orientation,
      deviceType: deviceInfo.type,
      // Auto-open sidebar on desktop, auto-close on mobile
      sidebarOpen: deviceInfo.type === 'desktop' ? true : prev.sidebarOpen,
      sidebarCollapsed: deviceInfo.type === 'mobile' ? true : prev.sidebarCollapsed,
    }));
  }, []);

  // Listen for device changes
  useEffect(() => {
    updateLayoutState();
    
    const unsubscribe = deviceDetector.addListener(updateLayoutState);
    return unsubscribe;
  }, [updateLayoutState]);

  // Handle orientation change
  useEffect(() => {
    const handleOrientationChange = () => {
      // Small delay to ensure screen dimensions are updated
      setTimeout(updateLayoutState, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [updateLayoutState]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen,
    }));
  }, []);

  // Toggle sidebar collapse
  const toggleSidebarCollapse = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed,
    }));
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setLayoutState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen?.();
      setLayoutState(prev => ({ ...prev, isFullscreen: false }));
    }
  }, []);

  // Close sidebar when clicking outside (mobile only)
  const handleBackdropClick = useCallback(() => {
    if (layoutState.deviceType === 'mobile' && layoutState.sidebarOpen) {
      setLayoutState(prev => ({ ...prev, sidebarOpen: false }));
    }
  }, [layoutState.deviceType, layoutState.sidebarOpen]);

  // Determine layout classes based on device and state
  const getLayoutClasses = () => {
    const { deviceType, orientation, sidebarOpen, sidebarCollapsed } = layoutState;
    
    return {
      container: cn(
        "min-h-screen bg-background transition-all duration-300",
        deviceType === 'mobile' && "overflow-hidden",
        className
      ),
      main: cn(
        "flex flex-col min-h-screen transition-all duration-300",
        deviceType === 'desktop' && sidebarOpen && !sidebarCollapsed && "ml-64",
        deviceType === 'desktop' && sidebarOpen && sidebarCollapsed && "ml-16",
        deviceType === 'tablet' && orientation === 'landscape' && sidebarOpen && "ml-64"
      ),
      sidebar: cn(
        "fixed top-0 left-0 z-40 h-full bg-card border-r transition-all duration-300",
        deviceType === 'mobile' && "w-64",
        deviceType === 'tablet' && "w-64",
        deviceType === 'desktop' && !sidebarCollapsed && "w-64",
        deviceType === 'desktop' && sidebarCollapsed && "w-16",
        // Transform based on state
        deviceType === 'mobile' && !sidebarOpen && "-translate-x-full",
        deviceType === 'tablet' && !sidebarOpen && "-translate-x-full",
        deviceType === 'desktop' && "translate-x-0"
      ),
      backdrop: cn(
        "fixed inset-0 z-30 bg-black/50 transition-opacity duration-300",
        (deviceType === 'mobile' || deviceType === 'tablet') && sidebarOpen 
          ? "opacity-100" 
          : "opacity-0 pointer-events-none"
      ),
      content: cn(
        "flex-1 flex flex-col transition-all duration-300",
        deviceType === 'mobile' && orientation === 'landscape' && "min-h-screen"
      ),
      header: cn(
        "sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b",
        deviceType === 'mobile' && "px-4 py-2",
        deviceType === 'tablet' && "px-6 py-3",
        deviceType === 'desktop' && "px-6 py-4"
      ),
      footer: cn(
        "border-t bg-background/50",
        deviceType === 'mobile' && "px-4 py-2",
        deviceType === 'tablet' && "px-6 py-3",
        deviceType === 'desktop' && "px-6 py-4"
      ),
    };
  };

  const classes = getLayoutClasses();

  return (
    <div className={classes.container}>
      {/* Backdrop for mobile/tablet */}
      <AnimatePresence>
        {((layoutState.deviceType === 'mobile' || layoutState.deviceType === 'tablet') && 
          layoutState.sidebarOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={classes.backdrop}
            onClick={handleBackdropClick}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      {sidebar && (
        <motion.aside
          className={classes.sidebar}
          initial={false}
          animate={{
            x: layoutState.sidebarOpen || layoutState.deviceType === 'desktop' ? 0 : -280,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar header */}
            <div className="flex items-center justify-between p-4 border-b">
              {!layoutState.sidebarCollapsed && (
                <h2 className="font-semibold">Navigation</h2>
              )}
              
              <div className="flex items-center gap-2">
                {/* Collapse button (desktop only) */}
                {layoutState.deviceType === 'desktop' && sidebarCollapsible && (
                  <button
                    onClick={toggleSidebarCollapse}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title={layoutState.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {layoutState.sidebarCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </button>
                )}
                
                {/* Close button (mobile/tablet only) */}
                {(layoutState.deviceType === 'mobile' || layoutState.deviceType === 'tablet') && (
                  <button
                    onClick={toggleSidebar}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Close sidebar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-y-auto">
              {sidebar}
            </div>
          </div>
        </motion.aside>
      )}

      {/* Main content area */}
      <div className={classes.main}>
        {/* Header */}
        {header && (
          <header className={classes.header}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Menu button for mobile/tablet */}
                {sidebar && (layoutState.deviceType === 'mobile' || layoutState.deviceType === 'tablet') && (
                  <button
                    onClick={toggleSidebar}
                    className="p-2 rounded hover:bg-muted transition-colors"
                    title="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                )}
                
                {/* Header content */}
                <div className="flex-1">
                  {header}
                </div>
              </div>

              {/* Header actions */}
              <div className="flex items-center gap-2">
                {/* Fullscreen toggle (desktop only) */}
                {layoutState.deviceType === 'desktop' && (
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded hover:bg-muted transition-colors"
                    title={layoutState.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {layoutState.isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </button>
                )}

                {/* More options */}
                <button
                  className="p-2 rounded hover:bg-muted transition-colors"
                  title="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Main content */}
        <main className={classes.content}>
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        {footer && (
          <footer className={classes.footer}>
            {footer}
          </footer>
        )}
      </div>

      {/* Device info overlay (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50 p-2 bg-black/80 text-white text-xs rounded">
          <div>Device: {layoutState.deviceType}</div>
          <div>Orientation: {layoutState.orientation}</div>
          <div>Sidebar: {layoutState.sidebarOpen ? 'Open' : 'Closed'}</div>
        </div>
      )}
    </div>
  );
}

// Responsive container component
export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'full',
  padding = 'responsive',
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'responsive';
}) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    responsive: 'p-4 md:p-6 lg:p-8',
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

// Responsive grid component
export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
}: {
  children: React.ReactNode;
  className?: string;
  cols?: { mobile: number; tablet: number; desktop: number };
  gap?: 'sm' | 'md' | 'lg';
}) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const gridClasses = cn(
    'grid',
    `grid-cols-${cols.mobile}`,
    `md:grid-cols-${cols.tablet}`,
    `lg:grid-cols-${cols.desktop}`,
    gapClasses[gap],
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}
