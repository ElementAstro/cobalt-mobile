"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Home,
  Grid3X3,
  Activity,
  FileText,
  Settings,
  User,
  Monitor,
  Calendar,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  AlertTriangle,
  // CheckCircle, // Unused for now
  Clock,
  Target,
  ChevronUp,
  ChevronDown,
  Cloud,
  Camera,
  Heart,
  Crosshair,
} from 'lucide-react';
import { useAppStore, CurrentPage } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibleNavigation, useAccessibility } from '@/hooks/use-accessibility';

interface NavigationItem {
  id: CurrentPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  color?: string;
}

interface EnhancedNavigationProps {
  className?: string;
  compact?: boolean;
  onPageChange?: (page: CurrentPage) => void;
}

export function EnhancedNavigation({ className, compact = false, onPageChange }: EnhancedNavigationProps) {
  const {
    currentPage,
    setCurrentPage,
    equipmentStatus,
    batteryLevel,
    connectionType,
    sequenceStatus,
    environmentalData,
  } = useAppStore();

  const { announceNavigation, getNavItemProps, getNavContainerProps } = useAccessibleNavigation();
  const { getTouchTargetClasses, getFocusIndicatorClasses } = useAccessibility();

  const handlePageChange = onPageChange || setCurrentPage;

  const [isExpanded, setIsExpanded] = useState(!compact);
  const [connectionQuality, setConnectionQuality] = useState(100);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Haptic feedback simulation
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    // For devices that support haptic feedback
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Simulate connection quality based on environmental conditions
  useEffect(() => {
    const quality = Math.max(20, 100 - (environmentalData.humidity / 2) - (environmentalData.lightPollution / 4));
    setConnectionQuality(Math.round(quality));
  }, [environmentalData]);

  // Count equipment issues
  const equipmentIssues = Object.values(equipmentStatus).filter(status => status === 'error').length;
  const equipmentWarnings = Object.values(equipmentStatus).filter(status => status === 'disconnected').length;

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      badge: equipmentIssues > 0 ? equipmentIssues : undefined,
      color: equipmentIssues > 0 ? 'destructive' : undefined,
    },
    {
      id: 'devices',
      label: 'Devices',
      icon: Grid3X3,
      badge: equipmentWarnings > 0 ? equipmentWarnings : undefined,
      color: equipmentWarnings > 0 ? 'secondary' : undefined,
    },
    {
      id: 'sequence',
      label: 'Sequencer',
      icon: Activity,
      badge: sequenceStatus.running ? 'RUNNING' : undefined,
      color: sequenceStatus.running ? 'default' : undefined,
    },
    {
      id: 'weather',
      label: 'Weather',
      icon: Cloud,
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: Camera,
    },
    {
      id: 'targets',
      label: 'Targets',
      icon: Target,
    },
    {
      id: 'health',
      label: 'Health',
      icon: Heart,
    },
    {
      id: 'guiding',
      label: 'Guiding',
      icon: Crosshair,
    },
    {
      id: 'planner',
      label: 'Planner',
      icon: Calendar,
    },
    {
      id: 'monitor',
      label: 'Monitor',
      icon: Monitor,
    },
    {
      id: 'profiles',
      label: 'Profiles',
      icon: User,
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: FileText,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const getConnectionIcon = () => {
    if (connectionType === 'wifi') {
      return connectionQuality > 50 ? Wifi : WifiOff;
    }
    return Signal;
  };

  const getBatteryIcon = () => {
    return batteryLevel < 20 ? BatteryLow : Battery;
  };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'connected': return 'text-green-500';
  //     case 'disconnected': return 'text-yellow-500';
  //     case 'error': return 'text-red-500';
  //     default: return 'text-gray-500';
  //   }
  // };

  return (
    <motion.div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-t border-border shadow-lg",
        "safe-area-inset-bottom", // Support for devices with home indicators
        className
      )}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      {...getNavContainerProps()}
      data-tour="navigation"
    >
      {/* Status Bar */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-2 border-b border-border/50"
          >
            <div className="flex items-center justify-between text-xs">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {React.createElement(getConnectionIcon(), {
                  className: cn(
                    "h-3 w-3",
                    connectionQuality > 70 ? "text-green-500" :
                    connectionQuality > 30 ? "text-yellow-500" : "text-red-500"
                  )
                })}
                <span className="text-muted-foreground">
                  {connectionType.toUpperCase()} {connectionQuality}%
                </span>
              </div>

              {/* Environmental Status */}
              <div className="flex items-center gap-3 text-muted-foreground">
                <span>{environmentalData.temperature.toFixed(1)}°C</span>
                <span>{environmentalData.humidity.toFixed(0)}%</span>
                {environmentalData.humidity > 85 && (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                )}
              </div>

              {/* Battery Status */}
              <div className="flex items-center gap-1">
                {React.createElement(getBatteryIcon(), {
                  className: cn(
                    "h-3 w-3",
                    batteryLevel > 50 ? "text-green-500" :
                    batteryLevel > 20 ? "text-yellow-500" : "text-red-500"
                  )
                })}
                <span className={cn(
                  "text-xs",
                  batteryLevel < 20 ? "text-red-500" : "text-muted-foreground"
                )}>
                  {batteryLevel.toFixed(0)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Navigation */}
      <div className="px-2 py-2">
        <div className="flex items-center justify-between">
          {/* Navigation Items */}
          <div className="flex-1 grid grid-cols-4 lg:grid-cols-8 gap-1">
            {navigationItems.map((item) => {
              const isActive = currentPage === item.id || 
                (item.id === 'devices' && currentPage.includes('detail'));
              
              return (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "flex flex-col items-center gap-1 h-auto py-3 px-2 relative",
                      "transition-all duration-200",
                      "active:scale-95", // Visual feedback on tap
                      getTouchTargetClasses(), // Adaptive touch targets
                      getFocusIndicatorClasses(), // Enhanced focus indicators
                      isActive && "shadow-md bg-primary text-primary-foreground"
                    )}
                    onClick={() => {
                      const now = Date.now();
                      // Prevent double-tap issues
                      if (now - lastTapTime > 300) {
                        triggerHapticFeedback('light');
                        announceNavigation(item.label);
                        handlePageChange(item.id);
                        setLastTapTime(now);
                      }
                    }}
                    onTouchStart={() => triggerHapticFeedback('light')}
                    {...getNavItemProps(item.label, isActive)}
                    data-tour={item.id === 'devices' ? 'devices-nav' : item.id === 'sequence' ? 'sequence-nav' : undefined}
                  >
                    <div className="relative">
                      <item.icon className={cn(
                        "h-5 w-5 transition-all duration-200",
                        isActive ? "text-primary-foreground scale-110" : "text-muted-foreground"
                      )} />
                      {item.badge && (
                        <Badge
                          variant={(item.color as "default" | "secondary" | "destructive" | "outline") || "default"}
                          className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-4"
                        >
                          {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                        </Badge>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium leading-tight text-center transition-all duration-200",
                      isActive ? "text-primary-foreground font-semibold" : "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Expand/Collapse Toggle */}
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="ml-2"
          >
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-10 w-10 p-0 min-h-[48px] min-w-[48px]",
                "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "transition-all duration-200"
              )}
              onClick={() => {
                triggerHapticFeedback('medium');
                setIsExpanded(!isExpanded);
              }}
              aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Sequence Progress Indicator */}
      <AnimatePresence>
        {sequenceStatus.running && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-primary/10 border-t border-primary/20"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                <span className="text-primary font-medium">
                  Sequence Running
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  Step {sequenceStatus.currentStep + 1} of {sequenceStatus.totalSteps}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default EnhancedNavigation;
