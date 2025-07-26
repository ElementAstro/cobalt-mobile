"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/mobile-utils';
import {
  X,
  HelpCircle,
  Lightbulb,
  Info,
  AlertTriangle,
  CheckCircle,
  Book,
  ExternalLink,
  Play,
} from 'lucide-react';

export interface HelpItem {
  id: string;
  title: string;
  description: string;
  type?: 'tip' | 'warning' | 'info' | 'success';
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  link?: {
    label: string;
    url: string;
    external?: boolean;
  };
}

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: HelpItem[];
  className?: string;
}

export function HelpOverlay({
  isOpen,
  onClose,
  title,
  items,
  className,
}: HelpOverlayProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const typeConfig = {
    tip: {
      icon: Lightbulb,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    info: {
      icon: Info,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-950',
      borderColor: 'border-gray-200 dark:border-gray-800',
    },
    success: {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
    },
  };

  const handleClose = () => {
    hapticFeedback.light();
    onClose();
  };

  const handleItemClick = (itemId: string) => {
    hapticFeedback.light();
    setSelectedItem(selectedItem === itemId ? null : itemId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={cn(
            "w-full max-w-2xl max-h-[90vh] overflow-hidden",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="shadow-2xl border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  {title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
              {items.map((item) => {
                const config = typeConfig[item.type || 'info'];
                const Icon = item.icon || config.icon;
                const isExpanded = selectedItem === item.id;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    className={cn(
                      "border rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
                      config.borderColor,
                      isExpanded ? config.bgColor : 'hover:bg-muted/50'
                    )}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.color)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-foreground">
                              {item.title}
                            </h4>
                            {item.type && (
                              <Badge variant="outline" className="text-xs">
                                {item.type}
                              </Badge>
                            )}
                          </div>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-2 space-y-3"
                              >
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {item.description}
                                </p>

                                {(item.action || item.link) && (
                                  <div className="flex gap-2">
                                    {item.action && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          item.action!.onClick();
                                        }}
                                        className="flex items-center gap-2"
                                      >
                                        <Play className="h-3 w-3" />
                                        {item.action.label}
                                      </Button>
                                    )}

                                    {item.link && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (item.link!.external) {
                                            window.open(item.link!.url, '_blank');
                                          } else {
                                            window.location.href = item.link!.url;
                                          }
                                        }}
                                        className="flex items-center gap-2"
                                      >
                                        {item.link.external ? (
                                          <ExternalLink className="h-3 w-3" />
                                        ) : (
                                          <Book className="h-3 w-3" />
                                        )}
                                        {item.link.label}
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Context-specific help overlays
export const helpContent = {
  dashboard: {
    title: 'Dashboard Help',
    items: [
      {
        id: 'equipment-status',
        title: 'Equipment Status Widgets',
        description: 'These widgets show real-time status of your astrophotography equipment. Green indicates connected and ready, yellow means disconnected, and red indicates an error. Tap any widget to access detailed controls.',
        type: 'tip' as 'tip',
      },
      {
        id: 'environmental-data',
        title: 'Environmental Conditions',
        description: 'Monitor temperature, humidity, wind speed, and sky quality. These conditions affect your imaging quality. Ideal conditions are low humidity, minimal wind, and high sky quality values.',
        type: 'info' as 'info',
      },
      {
        id: 'sequence-control',
        title: 'Sequence Control',
        description: 'Start, pause, or stop your imaging sequences from the dashboard. The progress bar shows current sequence completion.',
        type: 'tip' as const,
      },
    ],
  },
  devices: {
    title: 'Device Controls Help',
    items: [
      {
        id: 'device-connection',
        title: 'Connecting Equipment',
        description: 'Tap the Connect button to establish communication with your equipment. Ensure all devices are powered on and properly connected before attempting to connect.',
        type: 'tip' as 'tip',
      },
      {
        id: 'temperature-monitoring',
        title: 'Temperature Monitoring',
        description: 'Camera cooling is essential for low-noise imaging. Target temperatures are typically -10°C to -20°C below ambient temperature.',
        type: 'warning' as 'warning',
      },
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        description: 'Use the floating action button for quick access to emergency stop, quick capture, and auto focus functions.',
        type: 'info' as 'info',
      },
    ],
  },
  sequence: {
    title: 'Sequencer Help',
    items: [
      {
        id: 'sequence-planning',
        title: 'Planning Your Sequence',
        description: 'Create imaging sequences by specifying target objects, exposure times, filter selections, and frame counts. The sequencer will automatically manage your entire imaging session.',
        type: 'tip' as 'tip',
      },
      {
        id: 'dithering',
        title: 'Dithering',
        description: 'Enable dithering to slightly move the telescope between exposures. This helps reduce noise and hot pixels in your final stacked image.',
        type: 'info' as 'info',
      },
      {
        id: 'auto-focus',
        title: 'Auto Focus',
        description: 'Run auto focus periodically during long sequences to maintain sharp stars as temperature changes throughout the night.',
        type: 'warning' as 'warning',
      },
    ],
  },
};

// Hook for managing help overlay state
export function useHelpOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState<keyof typeof helpContent>('dashboard');

  const openHelp = (context?: keyof typeof helpContent) => {
    if (context) {
      setCurrentContext(context);
    }
    setIsOpen(true);
    hapticFeedback.light();
  };

  const closeHelp = () => {
    setIsOpen(false);
    hapticFeedback.light();
  };

  return {
    isOpen,
    currentContext,
    openHelp,
    closeHelp,
    helpData: helpContent[currentContext],
  };
}
