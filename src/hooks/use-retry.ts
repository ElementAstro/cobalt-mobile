"use client";

import { useState, useCallback, useRef } from 'react';
import { hapticFeedback } from '@/lib/mobile-utils';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error, attempt: number) => void;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  canRetry: boolean;
}

export function useRetry(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    onRetry,
    onMaxRetriesReached,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    canRetry: true,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      canRetry: true,
    });
  }, []);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> => {
    const opts = { ...options, ...customOptions };
    const maxAttempts = opts.maxRetries || maxRetries;
    
    let attempt = 0;
    let lastError: Error;

    while (attempt <= maxAttempts) {
      try {
        setState(prev => ({
          ...prev,
          isRetrying: attempt > 0,
          retryCount: attempt,
          canRetry: attempt < maxAttempts,
        }));

        if (attempt > 0) {
          onRetry?.(attempt);
          hapticFeedback.light();
        }

        const result = await operation();
        
        // Success
        setState(prev => ({
          ...prev,
          isRetrying: false,
          lastError: null,
        }));
        
        onSuccess?.();
        if (attempt > 0) {
          hapticFeedback.success();
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({
          ...prev,
          lastError,
          isRetrying: false,
        }));

        onError?.(lastError, attempt);

        if (attempt >= maxAttempts) {
          // Max retries reached
          setState(prev => ({
            ...prev,
            canRetry: false,
          }));
          
          onMaxRetriesReached?.();
          hapticFeedback.error();
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = (opts.initialDelay || initialDelay) * Math.pow(
          opts.backoffFactor || backoffFactor, 
          attempt
        );

        // Wait before retrying
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, delay);
        });

        attempt++;
      }
    }

    throw lastError!;
  }, [maxRetries, initialDelay, backoffFactor, onRetry, onMaxRetriesReached, onSuccess, onError, options]);

  const retry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    if (!state.canRetry) {
      throw new Error('Maximum retry attempts reached');
    }
    
    return executeWithRetry(operation);
  }, [state.canRetry, executeWithRetry]);

  return {
    ...state,
    executeWithRetry,
    retry,
    reset,
  };
}

// Hook for simple retry with exponential backoff
export function useSimpleRetry(maxRetries: number = 3) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    delay: number = 1000
  ): Promise<T> => {
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        setIsRetrying(attempt > 0);
        setRetryCount(attempt);
        
        const result = await operation();
        setIsRetrying(false);
        return result;
      } catch (error) {
        if (attempt >= maxRetries) {
          setIsRetrying(false);
          throw error;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        attempt++;
      }
    }
    
    throw new Error('Max retries exceeded');
  }, [maxRetries]);

  return {
    isRetrying,
    retryCount,
    retryWithBackoff,
  };
}

// Hook for network requests with retry
export function useNetworkRetry() {
  const retry = useRetry({
    maxRetries: 3,
    initialDelay: 1000,
    backoffFactor: 2,
  });

  const fetchWithRetry = useCallback(async (
    url: string,
    options?: RequestInit
  ): Promise<Response> => {
    return retry.executeWithRetry(async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    });
  }, [retry]);

  return {
    ...retry,
    fetchWithRetry,
  };
}

// Hook for equipment operations with retry
export function useEquipmentRetry() {
  const retry = useRetry({
    maxRetries: 2,
    initialDelay: 500,
    backoffFactor: 1.5,
    onRetry: (attempt) => {
      console.log(`Retrying equipment operation (attempt ${attempt})`);
    },
    onMaxRetriesReached: () => {
      console.error('Equipment operation failed after maximum retries');
    },
  });

  const connectWithRetry = useCallback(async (
    connectFn: () => Promise<void>
  ): Promise<void> => {
    return retry.executeWithRetry(connectFn);
  }, [retry]);

  const commandWithRetry = useCallback(async <T>(
    commandFn: () => Promise<T>
  ): Promise<T> => {
    return retry.executeWithRetry(commandFn);
  }, [retry]);

  return {
    ...retry,
    connectWithRetry,
    commandWithRetry,
  };
}

// Error recovery strategies
export const errorRecoveryStrategies = {
  // Network errors
  network: {
    maxRetries: 3,
    initialDelay: 1000,
    backoffFactor: 2,
  },
  
  // Equipment connection errors
  equipment: {
    maxRetries: 2,
    initialDelay: 500,
    backoffFactor: 1.5,
  },
  
  // File operations
  file: {
    maxRetries: 2,
    initialDelay: 200,
    backoffFactor: 1.2,
  },
  
  // User interface errors
  ui: {
    maxRetries: 1,
    initialDelay: 100,
    backoffFactor: 1,
  },
} as const;
