"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getMobileInteractiveClasses, hapticFeedback } from '@/lib/mobile-utils';
import { InfoTooltip } from '@/components/ui/tooltip';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from 'lucide-react';

export type StatusLevel = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type TrendDirection = 'up' | 'down' | 'stable';

interface StatusWidgetProps {
  title: string;
  value: string | number;
  unit?: string;
  status: StatusLevel;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    direction: TrendDirection;
    value?: number;
    label?: string;
  };
  progress?: {
    value: number;
    max?: number;
    showPercentage?: boolean;
  };
  lastUpdated?: Date;
  onClick?: () => void;
  onRefresh?: () => void;
  className?: string;
  compact?: boolean;
  animated?: boolean;
  children?: React.ReactNode;
}

const statusConfig = {
  success: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: CheckCircle,
  },
  warning: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    icon: AlertTriangle,
  },
  error: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: AlertTriangle,
  },
  info: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: Activity,
  },
  neutral: {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    borderColor: 'border-border',
    icon: Minus,
  },
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

export function StatusWidget({
  title,
  value,
  unit,
  status,
  icon: CustomIcon,
  trend,
  progress,
  lastUpdated,
  onClick,
  onRefresh,
  className,
  compact = false,
  animated = true,
  children,
}: StatusWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  const config = statusConfig[status];
  const StatusIcon = CustomIcon || config.icon;
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  // Animate value changes
  useEffect(() => {
    if (animated && typeof value === 'number' && typeof displayValue === 'number') {
      const startValue = displayValue;
      const endValue = value;
      const duration = 1000; // 1 second
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);
        
        const currentValue = startValue + (endValue - startValue) * easedProgress;
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated, displayValue]);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    hapticFeedback.light();
    
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleClick = () => {
    if (onClick) {
      hapticFeedback.light();
      onClick();
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toFixed(1);
    }
    return val;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <motion.div
      layout
      initial={animated ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      className={className}
    >
      <Card
        className={cn(
          'transition-all duration-200',
          config.borderColor,
          onClick && 'cursor-pointer hover:shadow-md',
          onClick && getMobileInteractiveClasses({ feedback: true }),
          className
        )}
        onClick={handleClick}
      >
        <CardHeader className={cn('pb-2', compact && 'pb-1')}>
          <div className="flex items-center justify-between">
            <CardTitle className={cn('text-sm font-medium', compact && 'text-xs')}>
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh();
                  }}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
                </Button>
              )}
              <InfoTooltip
                info={`Status: ${status} • Last updated: ${lastUpdated ? getTimeAgo(lastUpdated) : 'Never'}`}
                variant={status === 'success' ? 'success' : status === 'warning' ? 'warning' : status === 'error' ? 'error' : 'default'}
              >
                <StatusIcon className={cn('h-4 w-4', config.color)} />
              </InfoTooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn('pt-0', compact && 'pb-3')}>
          <div className="space-y-2">
            {/* Main Value */}
            <div className="flex items-baseline gap-1">
              <motion.span
                key={displayValue}
                initial={animated ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'text-2xl font-bold',
                  compact && 'text-xl',
                  config.color
                )}
              >
                {formatValue(displayValue)}
              </motion.span>
              {unit && (
                <span className={cn('text-sm text-muted-foreground', compact && 'text-xs')}>
                  {unit}
                </span>
              )}
              {trend && TrendIcon && (
                <div className="flex items-center gap-1 ml-2">
                  <TrendIcon className={cn(
                    'h-3 w-3',
                    trend.direction === 'up' ? 'text-green-500' :
                    trend.direction === 'down' ? 'text-red-500' :
                    'text-muted-foreground'
                  )} />
                  {trend.value && (
                    <span className={cn(
                      'text-xs',
                      trend.direction === 'up' ? 'text-green-500' :
                      trend.direction === 'down' ? 'text-red-500' :
                      'text-muted-foreground'
                    )}>
                      {trend.value}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {progress && (
              <div className="space-y-1">
                <Progress 
                  value={progress.value} 
                  max={progress.max || 100}
                  className="h-2"
                />
                {progress.showPercentage && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.value.toFixed(0)}%</span>
                    <span>{progress.max || 100}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Additional Content */}
            {children}

            {/* Last Updated */}
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{getTimeAgo(lastUpdated)}</span>
              </div>
            )}

            {/* Trend Label */}
            {trend?.label && (
              <div className="text-xs text-muted-foreground">
                {trend.label}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Specialized Equipment Status Widget
interface EquipmentStatusWidgetProps {
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  icon: React.ComponentType<{ className?: string }>;
  details?: Record<string, string | number>;
  temperature?: number;
  lastUpdated?: Date;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefresh?: () => void;
  onClick?: () => void;
  className?: string;
}

export function EquipmentStatusWidget({
  name,
  status,
  icon: Icon,
  details,
  temperature,
  lastUpdated,
  onConnect,
  onDisconnect,
  onRefresh,
  onClick,
  className,
}: EquipmentStatusWidgetProps) {
  const getStatusLevel = (): StatusLevel => {
    switch (status) {
      case 'connected': return 'success';
      case 'disconnected': return 'warning';
      case 'connecting': return 'info';
      case 'error': return 'error';
      default: return 'neutral';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <StatusWidget
      title={name}
      value={getStatusText()}
      status={getStatusLevel()}
      icon={Icon}
      lastUpdated={lastUpdated}
      onClick={onClick}
      onRefresh={onRefresh}
      className={className}
    >
      {/* Temperature Display */}
      {temperature !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Temp:</span>
          <span className={cn(
            'font-medium',
            temperature < -5 ? 'text-blue-500' :
            temperature > 25 ? 'text-red-500' :
            'text-green-500'
          )}>
            {temperature.toFixed(1)}°C
          </span>
        </div>
      )}

      {/* Equipment Details */}
      {details && Object.keys(details).length > 0 && (
        <div className="space-y-1">
          {Object.entries(details).slice(0, 3).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-muted-foreground capitalize">{key}:</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-2">
        {status === 'disconnected' && onConnect && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onConnect();
            }}
            className="flex-1 text-xs"
          >
            Connect
          </Button>
        )}
        {status === 'connected' && onDisconnect && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDisconnect();
            }}
            className="flex-1 text-xs"
          >
            Disconnect
          </Button>
        )}
      </div>
    </StatusWidget>
  );
}
