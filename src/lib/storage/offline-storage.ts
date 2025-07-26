// IndexedDB wrapper for offline storage
export interface StorageItem<T = any> {
  id: string;
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  version: number;
  metadata?: Record<string, any>;
}

export interface SyncQueueItem {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[]; // IDs of items that must sync first
}

export interface StorageConfig {
  dbName: string;
  version: number;
  stores: {
    name: string;
    keyPath: string;
    indexes?: Array<{ name: string; keyPath: string; unique?: boolean }>;
  }[];
}

// Default storage configuration
const DEFAULT_CONFIG: StorageConfig = {
  dbName: 'CobaltMobileDB',
  version: 1,
  stores: [
    {
      name: 'cache',
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'ttl', keyPath: 'ttl' },
      ],
    },
    {
      name: 'syncQueue',
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'priority', keyPath: 'priority' },
        { name: 'retryCount', keyPath: 'retryCount' },
      ],
    },
    {
      name: 'userData',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'type', keyPath: 'type' },
      ],
    },
    {
      name: 'equipment',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'type', keyPath: 'type' },
        { name: 'status', keyPath: 'status' },
      ],
    },
    {
      name: 'sequences',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'status', keyPath: 'status' },
        { name: 'targetId', keyPath: 'targetId' },
      ],
    },
  ],
};

export class OfflineStorage {
  private db: IDBDatabase | null = null;
  private config: StorageConfig;
  private initPromise: Promise<void> | null = null;

  constructor(config: StorageConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.setupErrorHandling();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });

    return this.initPromise;
  }

  /**
   * Store data in cache
   */
  async setCache<T>(key: string, data: T, ttl?: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const item: StorageItem<T> = {
      id: key,
      data,
      timestamp: Date.now(),
      ttl,
      version: 1,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get data from cache
   */
  async getCache<T>(key: string): Promise<T | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result as StorageItem<T> | undefined;
        
        if (!item) {
          resolve(null);
          return;
        }

        // Check if item has expired
        if (item.ttl && Date.now() - item.timestamp > item.ttl) {
          this.deleteCache(key); // Clean up expired item
          resolve(null);
          return;
        }

        resolve(item.data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete data from cache
   */
  async deleteCache(key: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cache data
   */
  async clearCache(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clean up expired cache items
   */
  async cleanupExpiredCache(): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.openCursor();
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          const item = cursor.value as StorageItem;
          
          // Delete expired items
          if (item.ttl && Date.now() - item.timestamp > item.ttl) {
            cursor.delete();
            deletedCount++;
          }
          
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const queueItem: SyncQueueItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.add(queueItem);

      request.onsuccess = () => resolve(queueItem.id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get sync queue items
   */
  async getSyncQueue(priority?: SyncQueueItem['priority']): Promise<SyncQueueItem[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      
      let request: IDBRequest;
      if (priority) {
        const index = store.index('priority');
        request = index.getAll(priority);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const items = request.result as SyncQueueItem[];
        // Sort by priority and timestamp
        items.sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          const aPriority = priorityOrder[a.priority];
          const bPriority = priorityOrder[b.priority];
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          return a.timestamp - b.timestamp;
        });
        
        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update sync queue item retry count
   */
  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          const updatedItem = { ...item, ...updates };
          const putRequest = store.put(updatedItem);
          
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Item not found'));
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store user data
   */
  async setUserData<T>(key: string, data: T, userId: string, type: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const item = {
      id: key,
      data,
      userId,
      type,
      timestamp: Date.now(),
      version: 1,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readwrite');
      const store = transaction.objectStore('userData');
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get user data
   */
  async getUserData<T>(key: string): Promise<T | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readonly');
      const store = transaction.objectStore('userData');
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result;
        resolve(item ? item.data : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all user data by type
   */
  async getUserDataByType<T>(type: string, userId?: string): Promise<T[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readonly');
      const store = transaction.objectStore('userData');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => {
        let items = request.result;
        
        // Filter by userId if provided
        if (userId) {
          items = items.filter(item => item.userId === userId);
        }
        
        resolve(items.map(item => item.data));
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete user data
   */
  async deleteUserData(key: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userData'], 'readwrite');
      const store = transaction.objectStore('userData');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get database size information
   */
  async getDatabaseSize(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    
    return { used: 0, quota: 0 };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  // Private methods
  private createStores(db: IDBDatabase): void {
    this.config.stores.forEach(storeConfig => {
      if (!db.objectStoreNames.contains(storeConfig.name)) {
        const store = db.createObjectStore(storeConfig.name, {
          keyPath: storeConfig.keyPath,
        });

        // Create indexes
        storeConfig.indexes?.forEach(indexConfig => {
          store.createIndex(indexConfig.name, indexConfig.keyPath, {
            unique: indexConfig.unique || false,
          });
        });
      }
    });
  }

  private setupErrorHandling(): void {
    if (this.db) {
      this.db.onerror = (event) => {
        console.error('Database error:', event);
      };

      this.db.onversionchange = () => {
        this.db?.close();
        console.warn('Database version changed, please reload the page');
      };
    }
  }
}

// Create singleton instance
export const offlineStorage = new OfflineStorage();

// Initialize on module load
if (typeof window !== 'undefined') {
  offlineStorage.init().catch(error => {
    console.error('Failed to initialize offline storage:', error);
  });
}
