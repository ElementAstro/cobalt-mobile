"use client";

import React from 'react';
import { cn, safeToFixed } from '@/lib/utils';
import { Loader2, Camera, Target, Activity, Settings, CheckCircle, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Loader2
        className={cn(
          'text-primary',
          sizeClasses[size],
          className
        )}
      />
    </motion.div>
  );
}

// Enhanced loading spinner with pulsing effect
interface PulseSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export function PulseSpinner({ size = 'md', className, color = 'primary' }: PulseSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const colorClasses = {
    primary: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  };

  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Loader2
          className={cn(
            colorClasses[color],
            sizeClasses[size],
            className
          )}
        />
      </motion.div>
    </motion.div>
  );
}

// Progress loading with steps
interface ProgressLoadingProps {
  steps: string[];
  currentStep: number;
  progress?: number;
  className?: string;
  showStepDetails?: boolean;
}

export function ProgressLoading({
  steps,
  currentStep,
  progress,
  className,
  showStepDetails = true,
}: ProgressLoadingProps) {
  const progressValue = progress ?? ((currentStep + 1) / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-4', className)}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {currentStep < steps.length ? steps[currentStep] : 'Complete'}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progressValue)}%
          </span>
        </div>

        <Progress value={progressValue} className="h-2" />

        {showStepDetails && (
          <div className="text-xs text-muted-foreground">
            Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
          </div>
        )}
      </div>

      {showStepDetails && (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-2 text-sm',
                index < currentStep && 'text-green-600 dark:text-green-400',
                index === currentStep && 'text-primary font-medium',
                index > currentStep && 'text-muted-foreground'
              )}
            >
              {index < currentStep ? (
                <CheckCircle className="h-4 w-4" />
              ) : index === currentStep ? (
                <PulseSpinner size="sm" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span>{step}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Equipment connection loading
interface EquipmentLoadingProps {
  equipment: Array<{
    name: string;
    status: 'pending' | 'connecting' | 'connected' | 'error';
    icon: React.ComponentType<{ className?: string }>;
  }>;
  className?: string;
}

export function EquipmentLoading({ equipment, className }: EquipmentLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('space-y-3', className)}
    >
      <div className="text-center space-y-2">
        <h3 className="font-medium">Connecting Equipment</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we establish connections...
        </p>
      </div>

      <div className="space-y-2">
        {equipment.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border',
              item.status === 'connected' && 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
              item.status === 'error' && 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
              item.status === 'connecting' && 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
              item.status === 'pending' && 'bg-muted/30'
            )}
          >
            <item.icon className={cn(
              'h-5 w-5',
              item.status === 'connected' && 'text-green-600 dark:text-green-400',
              item.status === 'error' && 'text-red-600 dark:text-red-400',
              item.status === 'connecting' && 'text-blue-600 dark:text-blue-400',
              item.status === 'pending' && 'text-muted-foreground'
            )} />

            <div className="flex-1">
              <div className="font-medium text-sm">{item.name}</div>
              <div className={cn(
                'text-xs',
                item.status === 'connected' && 'text-green-600 dark:text-green-400',
                item.status === 'error' && 'text-red-600 dark:text-red-400',
                item.status === 'connecting' && 'text-blue-600 dark:text-blue-400',
                item.status === 'pending' && 'text-muted-foreground'
              )}>
                {item.status === 'pending' && 'Waiting...'}
                {item.status === 'connecting' && 'Connecting...'}
                {item.status === 'connected' && 'Connected'}
                {item.status === 'error' && 'Connection failed'}
              </div>
            </div>

            <div className="flex-shrink-0">
              {item.status === 'connecting' && <PulseSpinner size="sm" color="primary" />}
              {item.status === 'connected' && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
              {item.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className, children }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardSkeletonProps {
  showHeader?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({ showHeader = true, lines = 3, className }: CardSkeletonProps) {
  return (
    <div className={cn('p-6 border rounded-lg', className)}>
      {showHeader && (
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'h-3',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )} 
          />
        ))}
      </div>
    </div>
  );
}

interface SingleEquipmentLoadingProps {
  type: 'camera' | 'mount' | 'focuser' | 'filterwheel';
  message?: string;
}

export function SingleEquipmentLoading({ type, message }: SingleEquipmentLoadingProps) {
  const icons = {
    camera: Camera,
    mount: Target,
    focuser: Activity,
    filterwheel: Settings,
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="relative mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
        <div className="absolute -bottom-1 -right-1">
          <LoadingSpinner size="sm" />
        </div>
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        {message || `Connecting to ${type}...`}
      </p>
    </motion.div>
  );
}

interface SequenceLoadingProps {
  currentStep?: string;
  progress?: number;
  totalSteps?: number;
  currentStepIndex?: number;
}

export function SequenceLoading({ 
  currentStep, 
  progress = 0, 
  totalSteps, 
  currentStepIndex 
}: SequenceLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 text-center space-y-4"
    >
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-muted flex items-center justify-center">
          <Activity className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <div 
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
          style={{
            background: `conic-gradient(from 0deg, transparent ${360 - (progress * 3.6)}deg, rgb(var(--primary)) ${360 - (progress * 3.6)}deg)`
          }}
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-lg font-semibold">
          {currentStep || 'Executing sequence...'}
        </p>
        {totalSteps && currentStepIndex !== undefined && (
          <p className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {totalSteps}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {progress.toFixed(1)}% complete
        </p>
      </div>
    </motion.div>
  );
}

interface DataLoadingProps {
  type: 'environmental' | 'equipment' | 'sequence' | 'logs';
  message?: string;
}

export function DataLoading({ type, message }: DataLoadingProps) {
  const messages = {
    environmental: 'Loading environmental data...',
    equipment: 'Updating equipment status...',
    sequence: 'Loading sequence information...',
    logs: 'Fetching logs...',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center space-x-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-muted-foreground">
          {message || messages[type]}
        </span>
      </div>
    </div>
  );
}

interface PageLoadingProps {
  title?: string;
  description?: string;
}

export function PageLoading({ title, description }: PageLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4"
    >
      <LoadingSpinner size="lg" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {title || 'Loading...'}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  className, 
  showPercentage = true,
  animated = true 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animated ? 0.5 : 0 }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{value}</span>
          <span>{percentage.toFixed(1)}%</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

interface PulsingDotProps {
  color?: 'primary' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulsingDot({ color = 'primary', size = 'md', className }: PulsingDotProps) {
  const colorClasses = {
    primary: 'bg-primary',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <div className={cn('relative', className)}>
      <div 
        className={cn(
          'rounded-full animate-pulse',
          colorClasses[color],
          sizeClasses[size]
        )} 
      />
      <div 
        className={cn(
          'absolute inset-0 rounded-full animate-ping',
          colorClasses[color],
          sizeClasses[size]
        )} 
      />
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  loadingComponent,
  className 
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
        >
          {loadingComponent || <LoadingSpinner size="lg" />}
        </motion.div>
      )}
    </div>
  );
}

// Enhanced Async State Component for better error handling
interface AsyncStateProps {
  loading?: boolean;
  error?: Error | string | null;
  data?: any;
  onRetry?: () => void;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
}

export function AsyncState({
  loading,
  error,
  data,
  onRetry,
  loadingComponent,
  errorComponent,
  children,
  className,
  loadingText = "Loading..."
}: AsyncStateProps) {
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        {loadingComponent || (
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">{loadingText}</p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : error.message;

    return (
      <div className={cn("flex flex-col items-center justify-center p-8 space-y-4", className)}>
        {errorComponent || (
          <>
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Something went wrong</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {errorMessage}
              </p>
            </div>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

// Enhanced Loading Card with progress support
interface LoadingCardProps {
  title?: string;
  description?: string;
  progress?: number;
  className?: string;
  icon?: React.ReactNode;
}

export function LoadingCard({ title, description, progress, className, icon }: LoadingCardProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {icon || <LoadingSpinner size="sm" />}
          {title || 'Loading...'}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {progress !== undefined ? (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground text-center">
              {safeToFixed(progress, 0)}% complete
            </p>
          </div>
        ) : (
          <Skeleton lines={2} />
        )}
      </CardContent>
    </Card>
  );
}

const LoadingStates = {
  LoadingSpinner,
  Skeleton,
  CardSkeleton,
  EquipmentLoading,
  SingleEquipmentLoading,
  SequenceLoading,
  DataLoading,
  PageLoading,
  ProgressBar,
  PulsingDot,
  LoadingOverlay,
  AsyncState,
  LoadingCard,
};

export default LoadingStates;
