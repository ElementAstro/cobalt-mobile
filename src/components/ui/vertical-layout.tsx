/**
 * Enhanced Vertical Layout Component
 * Optimized for mobile devices with better space utilization
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { mobilePerformance, mobileSpacing } from '@/lib/mobile-utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface VerticalSection {
  id: string;
  title?: string;
  content: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  priority?: 'high' | 'medium' | 'low';
  minHeight?: number;
  maxHeight?: number;
  sticky?: boolean;
}

interface VerticalLayoutProps {
  sections: VerticalSection[];
  className?: string;
  spacing?: 'compact' | 'standard' | 'generous';
  adaptiveHeight?: boolean;
  enableVirtualization?: boolean;
  onSectionToggle?: (sectionId: string, collapsed: boolean) => void;
}

export function VerticalLayout({
  sections,
  className,
  spacing = 'standard',
  adaptiveHeight = true,
  enableVirtualization = false,
  onSectionToggle,
}: VerticalLayoutProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(sections.filter(s => s.defaultCollapsed).map(s => s.id))
  );
  const [viewportHeight, setViewportHeight] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const spacingClasses = mobileSpacing[spacing];
  const animationDuration = mobilePerformance.getAnimationDuration(200);

  // Track viewport height changes
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  // Intersection observer for virtualization
  useEffect(() => {
    if (!enableVirtualization || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const newVisibleSections = new Set(visibleSections);
        
        entries.forEach((entry) => {
          const sectionId = entry.target.getAttribute('data-section-id');
          if (sectionId) {
            if (entry.isIntersecting) {
              newVisibleSections.add(sectionId);
            } else {
              newVisibleSections.delete(sectionId);
            }
          }
        });

        setVisibleSections(newVisibleSections);
      },
      {
        root: containerRef.current,
        rootMargin: '50px 0px',
        threshold: 0.1,
      }
    );

    sectionRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [enableVirtualization, visibleSections]);

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    const isCurrentlyCollapsed = collapsedSections.has(sectionId);
    
    if (isCurrentlyCollapsed) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    
    setCollapsedSections(newCollapsed);
    onSectionToggle?.(sectionId, !isCurrentlyCollapsed);
  };

  const getSectionHeight = (section: VerticalSection) => {
    if (adaptiveHeight && viewportHeight > 0) {
      const availableHeight = viewportHeight - 200; // Account for header/nav
      const totalSections = sections.filter(s => !collapsedSections.has(s.id)).length;
      
      if (section.priority === 'high') {
        return Math.max(section.minHeight || 200, availableHeight * 0.4);
      } else if (section.priority === 'medium') {
        return Math.max(section.minHeight || 150, availableHeight * 0.3);
      } else {
        return Math.max(section.minHeight || 100, availableHeight / totalSections);
      }
    }
    
    return section.minHeight || 'auto';
  };

  const shouldRenderSection = (sectionId: string) => {
    if (!enableVirtualization) return true;
    return visibleSections.has(sectionId) || collapsedSections.has(sectionId);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col h-full overflow-auto",
        spacingClasses.gap,
        "overscroll-behavior-contain",
        "scroll-smooth",
        className
      )}
      style={{
        scrollBehavior: mobilePerformance.reduceMotion() ? 'auto' : 'smooth',
      }}
    >
      {sections.map((section, index) => {
        const isCollapsed = collapsedSections.has(section.id);
        const sectionHeight = getSectionHeight(section);
        const shouldRender = shouldRenderSection(section.id);

        return (
          <motion.div
            key={section.id}
            ref={(el) => {
              if (el) {
                sectionRefs.current.set(section.id, el);
              }
            }}
            data-section-id={section.id}
            layout={!mobilePerformance.reduceMotion()}
            className={cn(
              "flex flex-col",
              section.sticky && "sticky top-0 z-10",
              spacingClasses.padding,
              "bg-background border border-border rounded-lg shadow-sm"
            )}
            style={{
              minHeight: typeof sectionHeight === 'number' ? `${sectionHeight}px` : sectionHeight,
              maxHeight: section.maxHeight ? `${section.maxHeight}px` : undefined,
            }}
            initial={false}
            animate={{
              opacity: shouldRender ? 1 : 0,
              scale: shouldRender ? 1 : 0.95,
            }}
            transition={{
              duration: animationDuration / 1000,
              ease: "easeInOut",
            }}
          >
            {/* Section Header */}
            {(section.title || section.collapsible) && (
              <div className="flex items-center justify-between mb-3">
                {section.title && (
                  <h3 className="text-lg font-semibold text-foreground">
                    {section.title}
                  </h3>
                )}
                
                {section.collapsible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(section.id)}
                    className="h-8 w-8 p-0"
                    aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
                  >
                    <motion.div
                      animate={{ rotate: isCollapsed ? 0 : 180 }}
                      transition={{ duration: animationDuration / 1000 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  </Button>
                )}
              </div>
            )}

            {/* Section Content */}
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: animationDuration / 1000,
                    ease: "easeInOut",
                  }}
                  className="flex-1 overflow-hidden"
                >
                  <div className="h-full overflow-auto">
                    {shouldRender ? section.content : (
                      <div className="h-32 bg-muted/50 rounded animate-pulse" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed State Indicator */}
            {isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-2 text-center text-sm text-muted-foreground"
              >
                Section collapsed
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// Preset configurations for common layouts
export const VerticalLayoutPresets = {
  dashboard: (content: {
    overview: React.ReactNode;
    details: React.ReactNode;
    controls: React.ReactNode;
  }): VerticalSection[] => [
    {
      id: 'overview',
      title: 'Overview',
      content: content.overview,
      priority: 'high',
      sticky: true,
      minHeight: 200,
    },
    {
      id: 'details',
      title: 'Details',
      content: content.details,
      priority: 'medium',
      collapsible: true,
      minHeight: 300,
    },
    {
      id: 'controls',
      title: 'Controls',
      content: content.controls,
      priority: 'high',
      minHeight: 150,
    },
  ],

  settings: (content: {
    general: React.ReactNode;
    advanced: React.ReactNode;
    about: React.ReactNode;
  }): VerticalSection[] => [
    {
      id: 'general',
      title: 'General Settings',
      content: content.general,
      priority: 'high',
      minHeight: 250,
    },
    {
      id: 'advanced',
      title: 'Advanced Settings',
      content: content.advanced,
      priority: 'medium',
      collapsible: true,
      defaultCollapsed: true,
      minHeight: 200,
    },
    {
      id: 'about',
      title: 'About',
      content: content.about,
      priority: 'low',
      collapsible: true,
      minHeight: 100,
    },
  ],

  deviceControl: (content: {
    status: React.ReactNode;
    controls: React.ReactNode;
    settings: React.ReactNode;
    logs: React.ReactNode;
  }): VerticalSection[] => [
    {
      id: 'status',
      title: 'Status',
      content: content.status,
      priority: 'high',
      sticky: true,
      minHeight: 150,
    },
    {
      id: 'controls',
      title: 'Controls',
      content: content.controls,
      priority: 'high',
      minHeight: 200,
    },
    {
      id: 'settings',
      title: 'Settings',
      content: content.settings,
      priority: 'medium',
      collapsible: true,
      minHeight: 180,
    },
    {
      id: 'logs',
      title: 'Logs',
      content: content.logs,
      priority: 'low',
      collapsible: true,
      defaultCollapsed: true,
      minHeight: 150,
    },
  ],
} as const;
