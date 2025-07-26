"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/mobile-utils';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      dismissible: true,
      ...toast,
    };

    setToasts(prev => {
      const updated = [newToast, ...prev].slice(0, maxToasts);
      return updated;
    });

    // Haptic feedback based on toast type
    switch (toast.type) {
      case 'success':
        hapticFeedback.success();
        break;
      case 'error':
        hapticFeedback.error();
        break;
      case 'warning':
        hapticFeedback.medium();
        break;
      default:
        hapticFeedback.light();
    }

    // Auto-dismiss if duration is set and not loading
    if (newToast.duration && newToast.type !== 'loading') {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, [maxToasts, removeToast]);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      updateToast,
      clearAll,
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    loading: {
      icon: Loader2,
      bgColor: 'bg-background',
      borderColor: 'border-border',
      textColor: 'text-foreground',
      iconColor: 'text-primary',
    },
  };

  const config = typeConfig[toast.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'p-4 rounded-lg border shadow-lg backdrop-blur-sm',
        config.bgColor,
        config.borderColor,
        'max-w-sm w-full'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {toast.type === 'loading' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </motion.div>
          ) : (
            <Icon className={cn('h-5 w-5', config.iconColor)} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className={cn('font-medium text-sm', config.textColor)}>
            {toast.title}
          </div>
          {toast.description && (
            <div className={cn('text-sm mt-1 opacity-90', config.textColor)}>
              {toast.description}
            </div>
          )}
          {toast.action && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={toast.action.onClick}
            >
              {toast.action.label}
            </Button>
          )}
        </div>

        {toast.dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Convenience hooks for different toast types
export function useToastHelpers() {
  const { addToast, updateToast } = useToast();

  const success = useCallback((title: string, description?: string) => {
    return addToast({ type: 'success', title, description });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    return addToast({ type: 'error', title, description });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    return addToast({ type: 'warning', title, description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    return addToast({ type: 'info', title, description });
  }, [addToast]);

  const loading = useCallback((title: string, description?: string) => {
    return addToast({ 
      type: 'loading', 
      title, 
      description, 
      duration: 0, // Don't auto-dismiss loading toasts
      dismissible: false 
    });
  }, [addToast]);

  const promise = useCallback(async <T,>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ): Promise<T> => {
    const toastId = loading(loadingMessage);

    try {
      const result = await promise;
      const message = typeof successMessage === 'function' 
        ? successMessage(result) 
        : successMessage;
      
      updateToast(toastId, {
        type: 'success',
        title: message,
        duration: 5000,
        dismissible: true,
      });
      
      return result;
    } catch (err) {
      const message = typeof errorMessage === 'function' 
        ? errorMessage(err) 
        : errorMessage;
      
      updateToast(toastId, {
        type: 'error',
        title: message,
        duration: 5000,
        dismissible: true,
      });
      
      throw err;
    }
  }, [loading, updateToast]);

  return {
    success,
    error,
    warning,
    info,
    loading,
    promise,
  };
}
