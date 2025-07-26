"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/mobile-utils';
import {
  AlertTriangle,
  RefreshCw,
  Bug,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  Home,

} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
  isRetrying: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  componentWillUnmount() {
    // Clean up any pending timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  handleRetry = () => {
    const { retryCount } = this.state;

    if (retryCount >= this.maxRetries) {
      // Max retries reached, show permanent error state
      hapticFeedback.error();
      return;
    }

    this.setState({ isRetrying: true });
    hapticFeedback.medium();

    // Exponential backoff: delay increases with each retry
    const delay = this.retryDelay * Math.pow(2, retryCount);

    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        retryCount: retryCount + 1,
        isRetrying: false,
      });
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  handleReset = () => {
    hapticFeedback.light();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
      isRetrying: false,
    });
  };

  handleCopyError = () => {
    const errorText = `
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      // Could show a toast notification here
      console.log('Error details copied to clipboard');
    });
  };

  getErrorMessage = () => {
    const { retryCount, isRetrying } = this.state;

    if (isRetrying) {
      return "Attempting to recover from the error...";
    }

    if (retryCount >= this.maxRetries) {
      return "Multiple recovery attempts failed. The application may need to be restarted.";
    }

    if (retryCount > 0) {
      return "An error occurred and recovery was attempted. You can try again or restart the application.";
    }

    return "An unexpected error occurred in the application. This has been logged and our team will investigate the issue.";
  };

  handleDownloadError = () => {
    const errorData = {
      timestamp: new Date().toISOString(),
      error: {
        message: this.state.error?.message,
        stack: this.state.error?.stack,
        name: this.state.error?.name,
      },
      errorInfo: this.state.errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    const blob = new Blob([JSON.stringify(errorData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-red-800 dark:text-red-200">
                  <AlertTriangle className="h-6 w-6" />
                  Something went wrong
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {this.getErrorMessage()}
                  </p>

                  {this.state.error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-md">
                      <p className="text-sm font-mono text-red-800 dark:text-red-200">
                        {this.state.error.message}
                      </p>
                    </div>
                  )}

                  {this.state.retryCount > 0 && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      Retry attempt {this.state.retryCount} of {this.maxRetries}
                    </div>
                  )}

                  {this.state.isRetrying && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full"></div>
                      Retrying in a moment...
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying || this.state.retryCount >= this.maxRetries}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", this.state.isRetrying && "animate-spin")} />
                    {this.state.isRetrying ? 'Retrying...' :
                     this.state.retryCount >= this.maxRetries ? 'Max Retries Reached' :
                     this.state.retryCount > 0 ? `Retry (${this.maxRetries - this.state.retryCount} left)` : 'Try Again'}
                  </Button>

                  {this.state.retryCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={this.handleReset}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                    className="flex items-center gap-2"
                  >
                    <Bug className="h-4 w-4" />
                    {this.state.showDetails ? 'Hide' : 'Show'} Details
                    {this.state.showDetails ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <AnimatePresence>
                  {this.state.showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">Error Details</h4>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={this.handleCopyError}
                              className="flex items-center gap-1"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={this.handleDownloadError}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {this.state.error && (
                            <div>
                              <Badge variant="outline" className="mb-2">
                                Error Stack
                              </Badge>
                              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                                {this.state.error.stack}
                              </pre>
                            </div>
                          )}

                          {this.state.errorInfo && (
                            <div>
                              <Badge variant="outline" className="mb-2">
                                Component Stack
                              </Badge>
                              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                                {this.state.errorInfo.componentStack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// Enhanced error display component for non-boundary errors
interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
  description?: string;
  severity?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
  showDetails?: boolean;
  suggestions?: string[];
}

export function ErrorDisplay({
  error,
  title,
  description,
  severity = 'error',
  onRetry,
  onDismiss,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  className,
  showDetails = false,
  suggestions = [],
}: ErrorDisplayProps) {
  const [detailsVisible, setDetailsVisible] = React.useState(showDetails);
  const errorMessage = typeof error === 'string' ? error : error.message;

  const severityConfig = {
    error: {
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: AlertTriangle,
    },
    warning: {
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      icon: AlertTriangle,
    },
    info: {
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400',
      icon: AlertTriangle,
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  const getRetryButtonText = () => {
    if (isRetrying) return 'Retrying...';
    if (retryCount >= maxRetries) return 'Max Retries Reached';
    if (retryCount > 0) return `Retry (${maxRetries - retryCount} left)`;
    return 'Retry';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 border rounded-lg',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        <div className="flex-1 min-w-0 space-y-2">
          {title && (
            <h4 className={cn('font-medium', config.textColor)}>
              {title}
            </h4>
          )}

          <p className={cn('text-sm', config.textColor)}>
            {description || errorMessage}
          </p>

          {retryCount > 0 && (
            <div className={cn('text-xs', config.textColor)}>
              Attempt {retryCount} of {maxRetries}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-1">
              <p className={cn('text-xs font-medium', config.textColor)}>
                Suggestions:
              </p>
              <ul className={cn('text-xs space-y-1', config.textColor)}>
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {typeof error === 'object' && error.stack && (
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailsVisible(!detailsVisible)}
                className={cn('text-xs p-0 h-auto', config.textColor)}
              >
                {detailsVisible ? 'Hide' : 'Show'} Technical Details
                {detailsVisible ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>

              {detailsVisible && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <pre className={cn(
                    'text-xs p-2 rounded border overflow-auto max-h-32',
                    'bg-black/10 dark:bg-white/10',
                    config.textColor
                  )}>
                    {error.stack}
                  </pre>
                </motion.div>
              )}
            </div>
          )}

          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  disabled={isRetrying || retryCount >= maxRetries}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={cn('h-3 w-3', isRetrying && 'animate-spin')} />
                  {getRetryButtonText()}
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className={config.textColor}
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Network error component
interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
}

export function NetworkError({ onRetry, message }: NetworkErrorProps) {
  return (
    <ErrorDisplay
      error={message || 'Network connection failed. Please check your connection and try again.'}
      onRetry={onRetry}
    />
  );
}

export default ErrorBoundary;
