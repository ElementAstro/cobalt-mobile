import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Base store configuration
export interface BaseStoreConfig {
  name: string;
  version: number;
  persist?: boolean;
  persistKeys?: string[];
}

// Storage adapter for different environments
const createStorage = () => {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  // Try to use localStorage, fallback to memory storage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return localStorage;
  } catch {
    // Fallback to memory storage
    const memoryStorage = new Map<string, string>();
    return {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => memoryStorage.set(key, value),
      removeItem: (key: string) => memoryStorage.delete(key),
    };
  }
};

// Enhanced store creator with automatic persistence and optimization
export function createEnhancedStore<T extends object>(
  config: BaseStoreConfig,
  storeCreator: any
) {
  const storage = createStorage();

  if (config.persist) {
    return create<T>()(
      subscribeWithSelector(
        immer(
          persist(
            storeCreator,
            {
              name: config.name,
              version: config.version,
              storage: createJSONStorage(() => storage),
              partialize: config.persistKeys 
                ? (state) => {
                    const persistedState: Partial<T> = {};
                    config.persistKeys!.forEach(key => {
                      if (key in state) {
                        (persistedState as Record<string, unknown>)[key] = (state as Record<string, unknown>)[key];
                      }
                    });
                    return persistedState;
                  }
                : undefined,
              onRehydrateStorage: () => (state) => {
                console.log(`Store ${config.name} rehydrated:`, state);
              },
              migrate: (persistedState: unknown, version: number) => {
                console.log(`Migrating store ${config.name} from version ${version} to ${config.version}`);
                // Add migration logic here if needed
                return persistedState;
              },
            }
          )
        )
      )
    );
  }

  return create<T>()(
    subscribeWithSelector(
      immer(storeCreator)
    )
  );
}

// Store subscription utilities
export function createStoreSubscription<T, U>(
  store: { subscribe: (selector: (state: T) => U, callback: (value: U, previousValue: U) => void, options?: { equalityFn?: (a: U, b: U) => boolean }) => () => void },
  selector: (state: T) => U,
  callback: (value: U, previousValue: U) => void
) {
  return store.subscribe(selector, callback, {
    equalityFn: (a: U, b: U) => {
      // Deep equality check for objects
      if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
        return JSON.stringify(a) === JSON.stringify(b);
      }
      return a === b;
    },
  });
}

// Batch update utility
export function createBatchUpdater<T>(store: { setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void }) {
  let updateQueue: Array<(state: T) => void> = [];
  let isUpdating = false;

  const flushUpdates = () => {
    if (updateQueue.length === 0 || isUpdating) return;
    
    isUpdating = true;
    const updates = [...updateQueue];
    updateQueue = [];
    
    store.setState((state: T) => {
      updates.forEach(update => update(state));
      return state;
    });
    
    isUpdating = false;
  };

  const batchUpdate = (updater: (state: T) => void) => {
    updateQueue.push(updater);
    
    // Use requestAnimationFrame for batching
    requestAnimationFrame(flushUpdates);
  };

  return { batchUpdate };
}

// Store performance monitoring
export function createStoreMonitor<T>(store: { subscribe: (callback: (state: T) => void) => () => void }, storeName: string) {
  let updateCount = 0;
  let lastUpdateTime = Date.now();
  
  const unsubscribe = store.subscribe(() => {
    updateCount++;
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Store ${storeName} update #${updateCount} (${timeSinceLastUpdate}ms since last)`);
      
      // Warn about frequent updates
      if (timeSinceLastUpdate < 16) { // Less than one frame
        console.warn(`Store ${storeName} updating very frequently. Consider batching updates.`);
      }
    }
    
    lastUpdateTime = now;
  });

  return {
    getUpdateCount: () => updateCount,
    unsubscribe,
  };
}

// Computed values utility
export function createComputedValue<T, U>(
  store: { getState: () => T },
  selector: (state: T) => U,
  dependencies: Array<(state: T) => unknown> = []
) {
  let cachedValue: U;
  let cachedDeps: unknown[] = [];
  let isInitialized = false;

  return () => {
    const state = store.getState();
    
    if (!isInitialized) {
      cachedValue = selector(state);
      cachedDeps = dependencies.map(dep => dep(state));
      isInitialized = true;
      return cachedValue;
    }

    // Check if dependencies changed
    const newDeps = dependencies.map(dep => dep(state));
    const depsChanged = newDeps.some((dep, index) => dep !== cachedDeps[index]);

    if (depsChanged) {
      cachedValue = selector(state);
      cachedDeps = newDeps;
    }

    return cachedValue;
  };
}

// Store reset utility
export function createStoreReset<T>(store: { setState: (state: T, replace?: boolean) => void }, initialState: T) {
  return () => {
    store.setState(initialState, true); // Replace entire state
  };
}

// Store validation utility
export function createStoreValidator<T>(
  validators: Record<string, (value: unknown) => boolean | string>
) {
  return (state: T): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.entries(validators).forEach(([key, validator]) => {
      const value = (state as Record<string, unknown>)[key];
      const result = validator(value);
      
      if (typeof result === 'string') {
        errors[key] = result;
        isValid = false;
      } else if (!result) {
        errors[key] = `Invalid value for ${key}`;
        isValid = false;
      }
    });

    return { isValid, errors };
  };
}

// Async action wrapper
export function createAsyncAction<T, Args extends unknown[], Return>(
  store: { setState: (updater: (state: T) => void) => void; getState: () => T },
  action: (...args: Args) => Promise<Return>,
  options: {
    loadingKey?: string;
    errorKey?: string;
    onSuccess?: (result: Return, state: T) => void;
    onError?: (error: Error, state: T) => void;
  } = {}
) {
  return async (...args: Args): Promise<Return> => {
    const { loadingKey, errorKey, onSuccess, onError } = options;

    // Set loading state
    if (loadingKey) {
      store.setState((state: T) => {
        (state as Record<string, unknown>)[loadingKey] = true;
      });
    }

    // Clear previous error
    if (errorKey) {
      store.setState((state: T) => {
        (state as Record<string, unknown>)[errorKey] = null;
      });
    }

    try {
      const result = await action(...args);

      // Handle success
      if (onSuccess) {
        store.setState((state: T) => {
          onSuccess(result, state);
        });
      }

      return result;
    } catch (error) {
      // Handle error
      if (errorKey) {
        store.setState((state: T) => {
          (state as Record<string, unknown>)[errorKey] = error instanceof Error ? error.message : 'Unknown error';
        });
      }

      if (onError) {
        store.setState((state: T) => {
          onError(error as Error, state);
        });
      }

      throw error;
    } finally {
      // Clear loading state
      if (loadingKey) {
        store.setState((state: T) => {
          (state as Record<string, unknown>)[loadingKey] = false;
        });
      }
    }
  };
}
