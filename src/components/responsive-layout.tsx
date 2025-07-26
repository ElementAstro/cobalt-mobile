"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  // X, // Unused for now
  ChevronLeft,
  // ChevronRight, // Unused for now
  Maximize2,
  Minimize2,
  RotateCcw,
  // Settings, // Unused for now
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  navigation?: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  actions?: React.ReactNode;
}

export function ResponsiveLayout({
  children,
  header,
  navigation,
  sidebar,
  className,
  showBackButton = false,
  onBack,
  title,
  actions,
}: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Enhanced orientation and viewport detection
  useEffect(() => {
    const handleOrientationChange = () => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      setOrientation(newOrientation);

      // Update CSS custom properties for dynamic viewport units
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      document.documentElement.style.setProperty('--vw', `${window.innerWidth * 0.01}px`);

      // Handle safe area insets
      if ('CSS' in window && 'supports' in window.CSS) {
        const supportsEnv = window.CSS.supports('padding-top', 'env(safe-area-inset-top)');
        if (supportsEnv) {
          document.documentElement.classList.add('supports-safe-area');
        }
      }
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle screen rotation
  const handleRotateScreen = () => {
    if ('screen' in window && 'orientation' in window.screen) {
      const screen = window.screen as Screen & {
        orientation?: {
          type: string;
          lock: (orientation: string) => Promise<void>;
        };
      };
      if (screen.orientation && screen.orientation.lock) {
        const currentOrientation = screen.orientation.type;
        const newOrientation = currentOrientation.includes('portrait') 
          ? 'landscape-primary' 
          : 'portrait-primary';
        screen.orientation.lock(newOrientation).catch(() => {
          // Fallback: just toggle a CSS class for visual feedback
          document.body.classList.toggle('rotate-90');
        });
      }
    }
  };

  const headerContent = (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "sticky top-0 z-40",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-b border-border"
      )}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          {isMobile && sidebar && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                {sidebar}
              </SheetContent>
            </Sheet>
          )}

          {title && (
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          
          {/* Mobile-specific controls */}
          {isMobile && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotateScreen}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {header}
    </motion.div>
  );

  if (isMobile) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col relative",
        // Enhanced viewport handling with fallback
        "min-h-[calc(var(--vh,1vh)*100)]",
        // Orientation-specific optimizations
        orientation === 'landscape' && [
          "landscape-layout",
          "max-h-screen overflow-hidden" // Prevent scrolling in landscape
        ],
        orientation === 'portrait' && [
          "portrait-layout",
          // Better vertical space utilization in portrait
          "pb-safe-bottom" // Account for home indicator
        ],
        // Safe area support
        "supports-safe-area:pt-safe-top supports-safe-area:pb-safe-bottom",
        className
      )}>
        {headerContent}

        <main className={cn(
          "flex-1 overflow-auto relative",
          // Optimized scrolling behavior
          "overscroll-behavior-y-contain",
          // Better performance on mobile
          "transform-gpu will-change-scroll",
          // Orientation-specific adjustments
          orientation === 'landscape' && [
            "overflow-y-auto overflow-x-hidden",
            "max-h-[calc(100vh-theme(spacing.16))]" // Account for header/nav
          ],
          orientation === 'portrait' && [
            "pb-4", // Extra bottom padding for better thumb reach
          ]
        )}>
          <div className={cn(
            "container mx-auto",
            // Adaptive padding based on orientation and content
            orientation === 'landscape' ? [
              "px-6 py-2", // Compact padding in landscape
              "max-w-none" // Use full width in landscape
            ] : [
              "px-4 py-4", // Standard padding in portrait
              "max-w-md mx-auto" // Constrain width for better readability
            ],
            // Content density optimization
            "space-y-3 md:space-y-4"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={title || 'content'}
                initial={{
                  opacity: 0,
                  x: orientation === 'landscape' ? 10 : 20,
                  y: orientation === 'portrait' ? 10 : 0
                }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{
                  opacity: 0,
                  x: orientation === 'landscape' ? -10 : -20,
                  y: orientation === 'portrait' ? -10 : 0
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut"
                }}
                className={cn(
                  // Ensure content doesn't get cut off
                  "min-h-0 flex-1",
                  // Better touch scrolling
                  "touch-pan-y"
                )}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {navigation}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={cn("min-h-screen flex", className)}>
      {/* Desktop Sidebar */}
      {sidebar && (
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          className="w-80 border-r border-border bg-muted/30"
        >
          <div className="sticky top-0 h-screen overflow-auto">
            {sidebar}
          </div>
        </motion.aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {headerContent}
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={title || 'content'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {navigation}
      </div>
    </div>
  );
}

// Hook for responsive breakpoints
export function useResponsiveBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1024) setBreakpoint('lg');
      else setBreakpoint('xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// Hook for adaptive grid columns
export function useAdaptiveGrid(baseColumns: number = 1) {
  const breakpoint = useResponsiveBreakpoint();
  const isMobile = useIsMobile();

  const getColumns = () => {
    if (isMobile) return Math.min(baseColumns, 2);
    
    switch (breakpoint) {
      case 'sm': return Math.min(baseColumns, 1);
      case 'md': return Math.min(baseColumns, 2);
      case 'lg': return Math.min(baseColumns, 3);
      case 'xl': return baseColumns;
      default: return baseColumns;
    }
  };

  return getColumns();
}

export default ResponsiveLayout;
