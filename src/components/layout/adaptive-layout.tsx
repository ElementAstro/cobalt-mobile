"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDesktopResponsive, useDesktopLayoutPreferences } from '@/hooks/use-desktop-responsive';
import { DesktopLayout } from './desktop-layout';
import { DesktopSidebarNavigation, DesktopHeader } from './desktop-navigation';
import { ResponsiveLayout } from '@/components/responsive-layout';
import { EnhancedNavigation } from '@/components/ui/enhanced-navigation';
import { CurrentPage } from '@/lib/store';

// Adaptive layout that switches between mobile and desktop layouts
interface AdaptiveLayoutProps {
  children: React.ReactNode;
  currentPage: CurrentPage;
  onPageChange: (page: CurrentPage) => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  rightPanel?: React.ReactNode;
  className?: string;
  // Desktop-specific props
  enableDesktopSidebar?: boolean;
  enableDesktopHeader?: boolean;
  enableRightPanel?: boolean;
  // Mobile-specific props
  enableMobileNavigation?: boolean;
  enableMobileGestures?: boolean;
}

export function AdaptiveLayout({
  children,
  currentPage,
  onPageChange,
  title,
  subtitle,
  actions,
  rightPanel,
  className,
  enableDesktopSidebar = true,
  enableDesktopHeader = true,
  enableRightPanel = true,
  enableMobileNavigation = true,
  enableMobileGestures = true,
}: AdaptiveLayoutProps) {
  const { isDesktop, isMobile, breakpoint } = useDesktopResponsive();
  const {
    sidebarCollapsed,
    rightPanelCollapsed,
    animationsEnabled,
    toggleSidebar,
    toggleRightPanel,
  } = useDesktopLayoutPreferences();

  // Desktop layout
  if (isDesktop) {
    const sidebar = enableDesktopSidebar ? (
      <DesktopSidebarNavigation
        currentPage={currentPage}
        onPageChange={onPageChange}
        collapsed={sidebarCollapsed}
      />
    ) : undefined;

    const header = enableDesktopHeader ? (
      <DesktopHeader
        title={title}
        breadcrumbs={[
          { label: 'Home', onClick: () => onPageChange('dashboard') },
          { label: getPageLabel(currentPage) },
        ]}
        actions={actions}
      />
    ) : undefined;

    const finalRightPanel = enableRightPanel && rightPanel && !rightPanelCollapsed ? rightPanel : undefined;

    return (
      <DesktopLayout
        sidebar={sidebar}
        header={header}
        rightPanel={finalRightPanel}
        className={className}
        sidebarCollapsible={true}
        sidebarDefaultCollapsed={sidebarCollapsed}
        rightPanelCollapsible={true}
        enableAnimations={animationsEnabled}
        spacing="standard"
        maxWidth="container"
      >
        <AdaptiveContent breakpoint={breakpoint}>
          {children}
        </AdaptiveContent>
      </DesktopLayout>
    );
  }

  // Mobile layout
  return (
    <ResponsiveLayout
      className={className}
      title={title}
      actions={actions}
      navigation={
        enableMobileNavigation ? (
          <EnhancedNavigation onPageChange={onPageChange} />
        ) : undefined
      }
    >
      <AdaptiveContent breakpoint={breakpoint}>
        {children}
      </AdaptiveContent>
    </ResponsiveLayout>
  );
}

// Content wrapper that adapts styling based on breakpoint
interface AdaptiveContentProps {
  children: React.ReactNode;
  breakpoint: string;
  className?: string;
}

function AdaptiveContent({ children, breakpoint, className }: AdaptiveContentProps) {
  const getContentClasses = () => {
    switch (breakpoint) {
      case 'mobile':
        return 'space-y-4 text-sm';
      case 'tablet':
        return 'space-y-5 text-base';
      case 'desktop':
        return 'space-y-6 text-base';
      case 'wide':
        return 'space-y-8 text-lg';
      case 'ultrawide':
        return 'space-y-10 text-lg';
      default:
        return 'space-y-6 text-base';
    }
  };

  return (
    <div className={cn(getContentClasses(), className)}>
      {children}
    </div>
  );
}

// Enhanced responsive wrapper that provides layout context
interface ResponsiveWrapperProps {
  children: React.ReactNode;
  fallbackToMobile?: boolean;
  className?: string;
}

export function ResponsiveWrapper({
  children,
  fallbackToMobile = true,
  className,
}: ResponsiveWrapperProps) {
  const { isDesktop, isMobile, isTablet, breakpoint } = useDesktopResponsive();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn("min-h-screen bg-background", className)}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-background transition-all duration-300",
        className
      )}
      data-breakpoint={breakpoint}
      data-is-desktop={isDesktop}
      data-is-mobile={isMobile}
      data-is-tablet={isTablet}
    >
      {children}
    </div>
  );
}

// Layout transition component for smooth switching between layouts
interface LayoutTransitionProps {
  children: React.ReactNode;
  layoutKey: string;
  className?: string;
}

export function LayoutTransition({
  children,
  layoutKey,
  className,
}: LayoutTransitionProps) {
  const { animationsEnabled } = useDesktopLayoutPreferences();

  if (!animationsEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={layoutKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Adaptive grid that switches between mobile and desktop configurations
interface AdaptiveGridProps {
  children: React.ReactNode;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  wideColumns?: number;
  ultrawideColumns?: number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AdaptiveGrid({
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  wideColumns = 4,
  ultrawideColumns = 5,
  gap = 'md',
  className,
}: AdaptiveGridProps) {
  const { breakpoint } = useDesktopResponsive();

  const getColumns = () => {
    switch (breakpoint) {
      case 'mobile': return mobileColumns;
      case 'tablet': return tabletColumns;
      case 'desktop': return desktopColumns;
      case 'wide': return wideColumns;
      case 'ultrawide': return ultrawideColumns;
      default: return desktopColumns;
    }
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
  };

  return (
    <div
      className={cn(
        'grid transition-all duration-300',
        `grid-cols-${getColumns()}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

// Utility function to get page labels
function getPageLabel(page: CurrentPage): string {
  const labels: Record<CurrentPage, string> = {
    dashboard: 'Dashboard',
    devices: 'Equipment',
    sequence: 'Sequencer',
    weather: 'Weather',
    analysis: 'Analysis',
    targets: 'Targets',
    health: 'Health',
    guiding: 'Guiding',
  };
  return labels[page] || page;
}

// Context for layout information
export const LayoutContext = React.createContext<{
  isDesktop: boolean;
  isMobile: boolean;
  isTablet: boolean;
  breakpoint: string;
  sidebarCollapsed: boolean;
  rightPanelCollapsed: boolean;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
} | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const responsive = useDesktopResponsive();
  const preferences = useDesktopLayoutPreferences();

  return (
    <LayoutContext.Provider
      value={{
        ...responsive,
        ...preferences,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  const context = React.useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return context;
}
