"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDesktopResponsive } from '@/hooks/use-desktop-responsive';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Maximize2, 
  Minimize2,
  Grid3X3,
  List,
  LayoutGrid,
} from 'lucide-react';

// Desktop-only wrapper component
interface DesktopOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function DesktopOnly({ children, fallback, className }: DesktopOnlyProps) {
  const { isDesktop } = useDesktopResponsive();

  if (!isDesktop) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <div className={className}>{children}</div>;
}

// Mobile-only wrapper component
interface MobileOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileOnly({ children, className }: MobileOnlyProps) {
  const { isMobile } = useDesktopResponsive();

  if (!isMobile) {
    return null;
  }

  return <div className={className}>{children}</div>;
}

// Responsive breakpoint indicator (for development)
export function BreakpointIndicator() {
  const { breakpoint, width } = useDesktopResponsive();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (breakpoint) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getColor = () => {
    switch (breakpoint) {
      case 'mobile': return 'bg-red-500';
      case 'tablet': return 'bg-yellow-500';
      case 'desktop': return 'bg-green-500';
      case 'wide': return 'bg-blue-500';
      case 'ultrawide': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm">
            {getIcon()}
            <span className="font-medium">{breakpoint}</span>
            <div className={cn("w-2 h-2 rounded-full", getColor())} />
            <span className="text-muted-foreground">{width}px</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Desktop view mode switcher
interface ViewMode {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface DesktopViewSwitcherProps {
  currentView: string;
  onViewChange: (viewId: string) => void;
  className?: string;
}

export function DesktopViewSwitcher({
  currentView,
  onViewChange,
  className,
}: DesktopViewSwitcherProps) {
  const viewModes: ViewMode[] = [
    {
      id: 'grid',
      label: 'Grid',
      icon: Grid3X3,
      description: 'Grid view with cards',
    },
    {
      id: 'list',
      label: 'List',
      icon: List,
      description: 'Detailed list view',
    },
    {
      id: 'masonry',
      label: 'Masonry',
      icon: LayoutGrid,
      description: 'Masonry layout',
    },
  ];

  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      {viewModes.map((mode) => (
        <Button
          key={mode.id}
          variant={currentView === mode.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(mode.id)}
          className="h-8 px-3"
          title={mode.description}
        >
          <mode.icon className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">{mode.label}</span>
        </Button>
      ))}
    </div>
  );
}

// Desktop density control
interface DesktopDensityControlProps {
  density: 'compact' | 'comfortable' | 'spacious';
  onDensityChange: (density: 'compact' | 'comfortable' | 'spacious') => void;
  className?: string;
}

export function DesktopDensityControl({
  density,
  onDensityChange,
  className,
}: DesktopDensityControlProps) {
  const densityOptions = [
    { id: 'compact', label: 'Compact', description: 'More content, less spacing' },
    { id: 'comfortable', label: 'Comfortable', description: 'Balanced spacing' },
    { id: 'spacious', label: 'Spacious', description: 'More spacing, easier reading' },
  ] as const;

  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      {densityOptions.map((option) => (
        <Button
          key={option.id}
          variant={density === option.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onDensityChange(option.id)}
          className="h-8 px-3"
          title={option.description}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

// Desktop panel resizer
interface DesktopPanelResizerProps {
  onResize: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export function DesktopPanelResizer({
  onResize,
  minWidth = 200,
  maxWidth = 600,
  className,
}: DesktopPanelResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(300);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartWidth(300); // You might want to get this from props
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, startWidth, minWidth, maxWidth, onResize]);

  return (
    <div
      className={cn(
        "w-1 bg-border hover:bg-primary cursor-col-resize transition-colors",
        isDragging && "bg-primary",
        className
      )}
      onMouseDown={handleMouseDown}
    />
  );
}

// Desktop fullscreen toggle
interface DesktopFullscreenToggleProps {
  onToggle: (isFullscreen: boolean) => void;
  className?: string;
}

export function DesktopFullscreenToggle({
  onToggle,
  className,
}: DesktopFullscreenToggleProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      onToggle(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
      onToggle(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      onToggle(isNowFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onToggle]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleFullscreen}
      className={className}
      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullscreen ? (
        <Minimize2 className="h-4 w-4" />
      ) : (
        <Maximize2 className="h-4 w-4" />
      )}
    </Button>
  );
}

// Desktop responsive container
interface DesktopResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function DesktopResponsiveContainer({
  children,
  maxWidth = 'xl',
  padding = 'md',
  className,
}: DesktopResponsiveContainerProps) {
  const { isDesktop } = useDesktopResponsive();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-[1400px]',
    full: 'max-w-none',
  };

  const paddingClasses = {
    none: '',
    sm: isDesktop ? 'px-6 py-4' : 'px-4 py-3',
    md: isDesktop ? 'px-8 py-6' : 'px-4 py-4',
    lg: isDesktop ? 'px-12 py-8' : 'px-6 py-6',
  };

  return (
    <div className={cn(
      "mx-auto w-full",
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

// Desktop animation wrapper
interface DesktopAnimationWrapperProps {
  children: React.ReactNode;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  duration?: number;
  delay?: number;
  className?: string;
}

export function DesktopAnimationWrapper({
  children,
  animation = 'fade',
  duration = 0.3,
  delay = 0,
  className,
}: DesktopAnimationWrapperProps) {
  const { isDesktop } = useDesktopResponsive();

  // Disable animations on mobile for better performance
  if (!isDesktop || animation === 'none') {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
  };

  return (
    <motion.div
      variants={variants[animation]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
