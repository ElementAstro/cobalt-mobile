"use client";

import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePerformance } from '@/hooks/use-performance';

interface PerformanceOptimizedProps {
  children: React.ReactNode;
  className?: string;
  enableVirtualization?: boolean;
  lazyLoad?: boolean;
  memoize?: boolean;
  debounceMs?: number;
  componentName?: string;
}

/**
 * Performance-optimized wrapper component
 * Provides automatic memoization, virtualization, and lazy loading
 */
export const PerformanceOptimized = memo(function PerformanceOptimized({
  children,
  className,
  enableVirtualization = false,
  lazyLoad = false,
  memoize = true,
  debounceMs = 0,
  componentName = 'PerformanceOptimized'
}: PerformanceOptimizedProps) {
  const { metrics, measureRender } = usePerformance(componentName, {
    trackMemory: true,
    logToConsole: process.env.NODE_ENV === 'development',
    threshold: 16
  });

  const [isVisible, setIsVisible] = React.useState(!lazyLoad);
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lazyLoad]);

  // Debounced render function
  const debouncedRender = useCallback(() => {
    if (debounceMs > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        setIsVisible(true);
      }, debounceMs);
    } else {
      setIsVisible(true);
    }
  }, [debounceMs]);

  // Memoized children
  const memoizedChildren = useMemo(() => {
    if (!memoize) return children;
    return children;
  }, [children, memoize]);

  // Performance measurement
  useEffect(() => {
    measureRender();
  });

  // Virtualization placeholder
  const VirtualizedContent = useCallback(() => {
    if (!enableVirtualization) return memoizedChildren;
    
    // Simple virtualization - in production would use react-window or similar
    return (
      <div className="virtualized-content">
        {memoizedChildren}
      </div>
    );
  }, [enableVirtualization, memoizedChildren]);

  if (lazyLoad && !isVisible) {
    return (
      <div 
        ref={containerRef}
        className={cn("min-h-[100px] flex items-center justify-center", className)}
      >
        <div className="animate-pulse bg-muted rounded h-20 w-full" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn("performance-optimized", className)}
      data-performance-metrics={JSON.stringify(metrics)}
    >
      <VirtualizedContent />
    </div>
  );
});

/**
 * Higher-order component for automatic performance optimization
 */
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<PerformanceOptimizedProps> = {}
) {
  const OptimizedComponent = memo((props: P) => {
    return (
      <PerformanceOptimized {...options}>
        <Component {...props} />
      </PerformanceOptimized>
    );
  });

  OptimizedComponent.displayName = `withPerformanceOptimization(${Component.displayName || Component.name})`;
  return OptimizedComponent;
}

/**
 * Hook for performance-aware rendering
 */
export function usePerformanceAwareRender(
  renderFn: () => React.ReactNode,
  deps: React.DependencyList,
  options: { threshold?: number; fallback?: React.ReactNode } = {}
) {
  const { threshold = 16, fallback = null } = options;
  const [isSlowDevice, setIsSlowDevice] = React.useState(false);
  const renderTimeRef = useRef<number[]>([]);

  const memoizedRender = useMemo(() => {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Track render times
    renderTimeRef.current.push(renderTime);
    if (renderTimeRef.current.length > 10) {
      renderTimeRef.current.shift();
    }

    // Calculate average render time
    const avgRenderTime = renderTimeRef.current.reduce((a, b) => a + b, 0) / renderTimeRef.current.length;
    
    // Detect slow device
    if (avgRenderTime > threshold) {
      setIsSlowDevice(true);
    }

    return result;
  }, deps);

  return isSlowDevice && fallback ? fallback : memoizedRender;
}

/**
 * Optimized list component with virtualization
 */
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
  overscan?: number;
}

export function OptimizedList<T>({
  items,
  renderItem,
  itemHeight = 50,
  containerHeight = 400,
  className,
  overscan = 5
}: OptimizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    return { start: Math.max(0, start - overscan), end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Memory-efficient image component
 */
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazy?: boolean;
  placeholder?: React.ReactNode;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  lazy = true,
  placeholder
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  if (!isInView) {
    return (
      <div 
        ref={imgRef}
        className={cn("bg-muted animate-pulse", className)}
        style={{ width, height }}
      >
        {placeholder}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ width, height }}
        >
          {placeholder}
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn("transition-opacity duration-300", {
          "opacity-0": !isLoaded,
          "opacity-100": isLoaded
        })}
        onLoad={handleLoad}
        loading={lazy ? "lazy" : "eager"}
      />
    </div>
  );
});

export default {
  PerformanceOptimized,
  withPerformanceOptimization,
  usePerformanceAwareRender,
  OptimizedList,
  OptimizedImage
};
