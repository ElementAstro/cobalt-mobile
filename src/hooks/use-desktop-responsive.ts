"use client";

import { useState, useEffect, useCallback } from 'react';
import { DESKTOP_BREAKPOINTS } from '@/components/layout/desktop-layout';

// Desktop-specific breakpoint types
export type DesktopBreakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide';

export interface DesktopResponsiveState {
  breakpoint: DesktopBreakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWideScreen: boolean;
  isUltraWide: boolean;
  width: number;
  height: number;
}

// Hook for desktop-specific responsive behavior
export function useDesktopResponsive(): DesktopResponsiveState {
  const [state, setState] = useState<DesktopResponsiveState>({
    breakpoint: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isWideScreen: false,
    isUltraWide: false,
    width: 1024,
    height: 768,
  });

  const updateBreakpoint = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    let breakpoint: DesktopBreakpoint = 'mobile';
    if (width >= DESKTOP_BREAKPOINTS.ultrawide) {
      breakpoint = 'ultrawide';
    } else if (width >= DESKTOP_BREAKPOINTS.wide) {
      breakpoint = 'wide';
    } else if (width >= DESKTOP_BREAKPOINTS.desktop) {
      breakpoint = 'desktop';
    } else if (width >= DESKTOP_BREAKPOINTS.tablet) {
      breakpoint = 'tablet';
    }

    setState({
      breakpoint,
      isMobile: width < DESKTOP_BREAKPOINTS.tablet,
      isTablet: width >= DESKTOP_BREAKPOINTS.tablet && width < DESKTOP_BREAKPOINTS.desktop,
      isDesktop: width >= DESKTOP_BREAKPOINTS.desktop,
      isWideScreen: width >= DESKTOP_BREAKPOINTS.wide,
      isUltraWide: width >= DESKTOP_BREAKPOINTS.ultrawide,
      width,
      height,
    });
  }, []);

  useEffect(() => {
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, [updateBreakpoint]);

  return state;
}

// Hook for desktop-specific layout preferences
export interface DesktopLayoutPreferences {
  sidebarCollapsed: boolean;
  rightPanelCollapsed: boolean;
  gridDensity: 'compact' | 'comfortable' | 'spacious';
  animationsEnabled: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  setGridDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
}

export function useDesktopLayoutPreferences(): DesktopLayoutPreferences {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [gridDensity, setGridDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('desktop-layout-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setSidebarCollapsed(parsed.sidebarCollapsed ?? false);
        setRightPanelCollapsed(parsed.rightPanelCollapsed ?? false);
        setGridDensity(parsed.gridDensity ?? 'comfortable');
        setAnimationsEnabled(parsed.animationsEnabled ?? true);
      } catch (error) {
        console.warn('Failed to parse desktop layout preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    const preferences = {
      sidebarCollapsed,
      rightPanelCollapsed,
      gridDensity,
      animationsEnabled,
    };
    localStorage.setItem('desktop-layout-preferences', JSON.stringify(preferences));
  }, [sidebarCollapsed, rightPanelCollapsed, gridDensity, animationsEnabled]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const toggleRightPanel = useCallback(() => {
    setRightPanelCollapsed(prev => !prev);
  }, []);

  return {
    sidebarCollapsed,
    rightPanelCollapsed,
    gridDensity,
    animationsEnabled,
    setSidebarCollapsed,
    setRightPanelCollapsed,
    setGridDensity,
    setAnimationsEnabled,
    toggleSidebar,
    toggleRightPanel,
  };
}

// Hook for desktop-specific grid calculations
export interface DesktopGridConfig {
  columns: number;
  gap: string;
  itemWidth: number;
  containerWidth: number;
}

export function useDesktopGrid(
  baseColumns: { desktop: number; wide: number; ultrawide: number },
  gap: number = 24
): DesktopGridConfig {
  const { breakpoint, width } = useDesktopResponsive();
  const [config, setConfig] = useState<DesktopGridConfig>({
    columns: baseColumns.desktop,
    gap: `${gap}px`,
    itemWidth: 300,
    containerWidth: width,
  });

  useEffect(() => {
    let columns = baseColumns.desktop;
    if (breakpoint === 'ultrawide') {
      columns = baseColumns.ultrawide;
    } else if (breakpoint === 'wide') {
      columns = baseColumns.wide;
    }

    const totalGap = (columns - 1) * gap;
    const availableWidth = width - totalGap;
    const itemWidth = availableWidth / columns;

    setConfig({
      columns,
      gap: `${gap}px`,
      itemWidth,
      containerWidth: width,
    });
  }, [breakpoint, width, baseColumns, gap]);

  return config;
}

// Hook for desktop keyboard shortcuts
export interface DesktopKeyboardShortcuts {
  registerShortcut: (key: string, callback: () => void, description?: string) => void;
  unregisterShortcut: (key: string) => void;
  shortcuts: Record<string, { callback: () => void; description?: string }>;
}

export function useDesktopKeyboardShortcuts(): DesktopKeyboardShortcuts {
  const [shortcuts, setShortcuts] = useState<Record<string, { callback: () => void; description?: string }>>({});

  const registerShortcut = useCallback((key: string, callback: () => void, description?: string) => {
    setShortcuts(prev => ({
      ...prev,
      [key]: { callback, description },
    }));
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts(prev => {
      const newShortcuts = { ...prev };
      delete newShortcuts[key];
      return newShortcuts;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = `${event.ctrlKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.altKey ? 'alt+' : ''}${event.key.toLowerCase()}`;
      const shortcut = shortcuts[key];
      
      if (shortcut) {
        event.preventDefault();
        shortcut.callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return {
    registerShortcut,
    unregisterShortcut,
    shortcuts,
  };
}

// Hook for desktop mouse interactions
export interface DesktopMouseState {
  isHovering: boolean;
  position: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number } | null;
}

export function useDesktopMouse(elementRef: React.RefObject<HTMLElement>): DesktopMouseState {
  const [state, setState] = useState<DesktopMouseState>({
    isHovering: false,
    position: { x: 0, y: 0 },
    isDragging: false,
    dragStart: null,
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      setState(prev => ({ ...prev, isHovering: true }));
    };

    const handleMouseLeave = () => {
      setState(prev => ({ ...prev, isHovering: false, isDragging: false, dragStart: null }));
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      setState(prev => ({
        ...prev,
        position: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
      }));
    };

    const handleMouseDown = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      setState(prev => ({
        ...prev,
        isDragging: true,
        dragStart: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
      }));
    };

    const handleMouseUp = () => {
      setState(prev => ({ ...prev, isDragging: false, dragStart: null }));
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseup', handleMouseUp);
    };
  }, [elementRef]);

  return state;
}

// Utility function to get desktop-appropriate spacing
export function getDesktopSpacing(breakpoint: DesktopBreakpoint, base: number = 16): number {
  const multipliers = {
    mobile: 0.75,
    tablet: 1,
    desktop: 1.25,
    wide: 1.5,
    ultrawide: 1.75,
  };

  return base * multipliers[breakpoint];
}

// Utility function to get desktop-appropriate font sizes
export function getDesktopFontSize(breakpoint: DesktopBreakpoint, base: number = 16): number {
  const multipliers = {
    mobile: 0.875,
    tablet: 1,
    desktop: 1,
    wide: 1.125,
    ultrawide: 1.25,
  };

  return base * multipliers[breakpoint];
}
