"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DESKTOP_BREAKPOINTS } from './desktop-layout';

// Desktop-optimized grid configurations
export const DESKTOP_GRID_CONFIGS = {
  dashboard: {
    columns: { desktop: 3, wide: 4, ultrawide: 5 },
    gap: 'lg',
    minItemWidth: '320px',
  },
  content: {
    columns: { desktop: 2, wide: 3, ultrawide: 4 },
    gap: 'xl',
    minItemWidth: '400px',
  },
  cards: {
    columns: { desktop: 4, wide: 5, ultrawide: 6 },
    gap: 'md',
    minItemWidth: '280px',
  },
  metrics: {
    columns: { desktop: 6, wide: 8, ultrawide: 10 },
    gap: 'sm',
    minItemWidth: '200px',
  },
  sidebar: {
    columns: { desktop: 1, wide: 1, ultrawide: 1 },
    gap: 'md',
    minItemWidth: '100%',
  },
} as const;

export const DESKTOP_GRID_GAPS = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-3',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
  '2xl': 'gap-16',
} as const;

interface DesktopGridProps {
  children: React.ReactNode;
  className?: string;
  preset?: keyof typeof DESKTOP_GRID_CONFIGS;
  columns?: {
    desktop?: number;
    wide?: number;
    ultrawide?: number;
  };
  gap?: keyof typeof DESKTOP_GRID_GAPS;
  minItemWidth?: string;
  autoFit?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
}

export function DesktopGrid({
  children,
  className,
  preset,
  columns,
  gap = 'md',
  minItemWidth,
  autoFit = false,
  aspectRatio = 'auto',
  alignItems = 'stretch',
  justifyItems = 'stretch',
}: DesktopGridProps) {
  const [breakpoint, setBreakpoint] = useState<'desktop' | 'wide' | 'ultrawide'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= DESKTOP_BREAKPOINTS.ultrawide) {
        setBreakpoint('ultrawide');
      } else if (width >= DESKTOP_BREAKPOINTS.wide) {
        setBreakpoint('wide');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  // Get configuration from preset or props
  const config = preset ? DESKTOP_GRID_CONFIGS[preset] : { columns, gap, minItemWidth };
  const finalColumns = config.columns || columns || { desktop: 3, wide: 4, ultrawide: 5 };
  const finalGap = (config.gap as keyof typeof DESKTOP_GRID_GAPS) || gap;
  const finalMinWidth = config.minItemWidth || minItemWidth || '280px';

  // Generate grid classes
  const getGridClasses = () => {
    const classes = ['grid'];

    if (autoFit) {
      // Use CSS Grid auto-fit for responsive columns
      classes.push(`grid-cols-[repeat(auto-fit,minmax(${finalMinWidth},1fr))]`);
    } else {
      // Use responsive column classes
      const currentColumns = finalColumns[breakpoint] || finalColumns.desktop || 3;
      classes.push(`grid-cols-${currentColumns}`);
      
      // Add responsive classes for different breakpoints
      if (finalColumns.desktop) {
        classes.push(`lg:grid-cols-${finalColumns.desktop}`);
      }
      if (finalColumns.wide) {
        classes.push(`xl:grid-cols-${finalColumns.wide}`);
      }
      if (finalColumns.ultrawide) {
        classes.push(`2xl:grid-cols-${finalColumns.ultrawide}`);
      }
    }

    // Add gap
    classes.push(DESKTOP_GRID_GAPS[finalGap]);

    // Add alignment
    if (alignItems !== 'stretch') {
      classes.push(`items-${alignItems}`);
    }
    if (justifyItems !== 'stretch') {
      classes.push(`justify-items-${justifyItems}`);
    }

    // Add aspect ratio for grid items
    if (aspectRatio !== 'auto') {
      switch (aspectRatio) {
        case 'square':
          classes.push('[&>*]:aspect-square');
          break;
        case 'video':
          classes.push('[&>*]:aspect-video');
          break;
        case 'portrait':
          classes.push('[&>*]:aspect-[3/4]');
          break;
      }
    }

    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        getGridClasses(),
        // Desktop-specific optimizations
        'w-full',
        // Smooth transitions for responsive changes
        'transition-all duration-300 ease-in-out',
        className
      )}
    >
      {children}
    </div>
  );
}

// Multi-column layout component for desktop
interface DesktopColumnsProps {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
  gap?: keyof typeof DESKTOP_GRID_GAPS;
  breakAt?: keyof typeof DESKTOP_BREAKPOINTS;
}

export function DesktopColumns({
  children,
  className,
  columns = 2,
  gap = 'lg',
  breakAt = 'desktop',
}: DesktopColumnsProps) {
  const [shouldUseColumns, setShouldUseColumns] = useState(false);

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      setShouldUseColumns(width >= DESKTOP_BREAKPOINTS[breakAt]);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [breakAt]);

  if (!shouldUseColumns) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        `columns-${columns}`,
        DESKTOP_GRID_GAPS[gap],
        'break-inside-avoid-column',
        className
      )}
    >
      {children}
    </div>
  );
}

// Masonry-style grid for desktop
interface DesktopMasonryProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    desktop?: number;
    wide?: number;
    ultrawide?: number;
  };
  gap?: keyof typeof DESKTOP_GRID_GAPS;
}

export function DesktopMasonry({
  children,
  className,
  columns = { desktop: 3, wide: 4, ultrawide: 5 },
  gap = 'md',
}: DesktopMasonryProps) {
  const [breakpoint, setBreakpoint] = useState<'desktop' | 'wide' | 'ultrawide'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= DESKTOP_BREAKPOINTS.ultrawide) {
        setBreakpoint('ultrawide');
      } else if (width >= DESKTOP_BREAKPOINTS.wide) {
        setBreakpoint('wide');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  const currentColumns = columns[breakpoint] || columns.desktop || 3;

  return (
    <div
      className={cn(
        `columns-${currentColumns}`,
        DESKTOP_GRID_GAPS[gap],
        '[&>*]:break-inside-avoid [&>*]:mb-4',
        className
      )}
    >
      {children}
    </div>
  );
}

// Preset grid layouts for common desktop patterns
export const DesktopGridPresets = {
  Dashboard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <DesktopGrid preset="dashboard" className={className}>
      {children}
    </DesktopGrid>
  ),
  
  ContentGrid: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <DesktopGrid preset="content" className={className}>
      {children}
    </DesktopGrid>
  ),
  
  CardGrid: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <DesktopGrid preset="cards" className={className}>
      {children}
    </DesktopGrid>
  ),
  
  MetricsGrid: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <DesktopGrid preset="metrics" className={className}>
      {children}
    </DesktopGrid>
  ),
  
  TwoColumn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <DesktopColumns columns={2} className={className}>
      {children}
    </DesktopColumns>
  ),
  
  ThreeColumn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <DesktopColumns columns={3} className={className}>
      {children}
    </DesktopColumns>
  ),
} as const;
