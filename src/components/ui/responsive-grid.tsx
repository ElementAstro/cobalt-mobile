"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { mobileSpacing, isMobileViewport, getViewportSize } from '@/lib/mobile-utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'compact' | 'standard' | 'generous';
  autoFit?: boolean; // Auto-fit columns based on min width
  minItemWidth?: string; // Minimum width for auto-fit
}

export function ResponsiveGrid({
  children,
  className,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = 'standard',
  autoFit = false,
  minItemWidth = '280px',
}: ResponsiveGridProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [viewportSize, setViewportSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(isMobileViewport());
      setViewportSize(getViewportSize());
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const gapClasses = mobileSpacing[gap].gap;

  const getColumnClasses = () => {
    if (autoFit) {
      // Adaptive minimum width based on viewport
      const adaptiveMinWidth = isMobile ?
        (viewportSize === 'xs' ? '250px' : '280px') :
        minItemWidth;
      return `grid-cols-[repeat(auto-fit,minmax(${adaptiveMinWidth},1fr))]`;
    }

    // Enhanced responsive columns with better mobile handling
    const classes = [];
    if (columns.xs) {
      // Force single column on very small screens for better UX
      const xsCols = viewportSize === 'xs' ? Math.min(columns.xs, 1) : columns.xs;
      classes.push(`grid-cols-${xsCols}`);
    }
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);

    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        'grid',
        getColumnClasses(),
        gapClasses,
        // Enhanced mobile optimizations
        isMobile && [
          'touch-pan-y', // Better touch scrolling
          'overscroll-behavior-contain', // Prevent overscroll
        ],
        // Adaptive item sizing
        autoFit && 'auto-rows-max',
        className
      )}
      style={{
        // CSS Grid enhancements for mobile
        gridAutoRows: isMobile ? 'minmax(min-content, max-content)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

interface ResponsiveCardGridProps {
  children: React.ReactNode;
  className?: string;
  cardMinWidth?: string;
  gap?: 'compact' | 'standard' | 'generous';
}

export function ResponsiveCardGrid({
  children,
  className,
  cardMinWidth = '320px',
  gap = 'standard',
}: ResponsiveCardGridProps) {
  return (
    <ResponsiveGrid
      autoFit
      minItemWidth={cardMinWidth}
      gap={gap}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  );
}

interface MasonryGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'compact' | 'standard' | 'generous';
}

export function MasonryGrid({
  children,
  className,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'standard',
}: MasonryGridProps) {
  const gapClasses = mobileSpacing[gap].gap;

  const getColumnClasses = () => {
    const classes = [];
    if (columns.xs) classes.push(`columns-${columns.xs}`);
    if (columns.sm) classes.push(`sm:columns-${columns.sm}`);
    if (columns.md) classes.push(`md:columns-${columns.md}`);
    if (columns.lg) classes.push(`lg:columns-${columns.lg}`);
    if (columns.xl) classes.push(`xl:columns-${columns.xl}`);
    
    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        getColumnClasses(),
        gapClasses,
        'space-y-4', // Fallback spacing for browsers that don't support column-gap
        className
      )}
      style={{
        columnGap: gap === 'compact' ? '0.5rem' : gap === 'generous' ? '1.5rem' : '1rem',
      }}
    >
      {children}
    </div>
  );
}

interface FlexGridProps {
  children: React.ReactNode;
  className?: string;
  minItemWidth?: string;
  gap?: 'compact' | 'standard' | 'generous';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export function FlexGrid({
  children,
  className,
  minItemWidth = '280px',
  gap = 'standard',
  justify = 'start',
  align = 'stretch',
}: FlexGridProps) {
  const gapClasses = mobileSpacing[gap].gap;

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div
      className={cn(
        'flex flex-wrap',
        gapClasses,
        justifyClasses[justify],
        alignClasses[align],
        className
      )}
    >
      {React.Children.map(children, (child) => (
        <div
          className="flex-1"
          style={{ minWidth: minItemWidth }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

interface GridItemProps {
  children: React.ReactNode;
  className?: string;
  span?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  start?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function GridItem({
  children,
  className,
  span,
  start,
}: GridItemProps) {
  const getSpanClasses = () => {
    if (!span) return '';
    
    const classes = [];
    if (span.xs) classes.push(`col-span-${span.xs}`);
    if (span.sm) classes.push(`sm:col-span-${span.sm}`);
    if (span.md) classes.push(`md:col-span-${span.md}`);
    if (span.lg) classes.push(`lg:col-span-${span.lg}`);
    if (span.xl) classes.push(`xl:col-span-${span.xl}`);
    
    return classes.join(' ');
  };

  const getStartClasses = () => {
    if (!start) return '';
    
    const classes = [];
    if (start.xs) classes.push(`col-start-${start.xs}`);
    if (start.sm) classes.push(`sm:col-start-${start.sm}`);
    if (start.md) classes.push(`md:col-start-${start.md}`);
    if (start.lg) classes.push(`lg:col-start-${start.lg}`);
    if (start.xl) classes.push(`xl:col-start-${start.xl}`);
    
    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        getSpanClasses(),
        getStartClasses(),
        className
      )}
    >
      {children}
    </div>
  );
}

// Preset grid layouts for common use cases
export const GridLayouts = {
  // Equipment dashboard grid
  equipment: {
    columns: { xs: 1, sm: 2, lg: 3, xl: 4 },
    gap: 'standard' as const,
  },
  
  // Status cards grid
  status: {
    columns: { xs: 2, sm: 3, md: 4, lg: 6 },
    gap: 'compact' as const,
  },
  
  // Feature cards grid
  features: {
    columns: { xs: 1, md: 2, xl: 3 },
    gap: 'generous' as const,
  },
  
  // Settings grid
  settings: {
    columns: { xs: 1, lg: 2 },
    gap: 'standard' as const,
  },
  
  // Metrics grid
  metrics: {
    columns: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
    gap: 'compact' as const,
  },
} as const;
