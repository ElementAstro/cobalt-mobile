import { apiClient } from '@/lib/api/client';
import { offlineStorage, SyncQueueItem } from './offline-storage';
import { createNotification } from '@/lib/stores/notification-store';

// Sync Strategy Types
export interface SyncStrategy {
  name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  batchSize: number;
  retryDelay: number;
  maxRetries: number;
  conflictResolution: 'client' | 'server' | 'merge' | 'prompt';
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  conflicts: number;
  errors: string[];
  duration: number;
}

export interface ConflictResolution {
  itemId: string;
  clientData: any;
  serverData: any;
  resolution: 'client' | 'server' | 'merge';
  mergedData?: any;
}

// Default sync strategies
const SYNC_STRATEGIES: Record<string, SyncStrategy> = {
  immediate: {
    name: 'immediate',
    priority: 'critical',
    batchSize: 1,
    retryDelay: 1000,
    maxRetries: 3,
    conflictResolution: 'server',
  },
  batch: {
    name: 'batch',
    priority: 'medium',
    batchSize: 10,
    retryDelay: 5000,
    maxRetries: 5,
    conflictResolution: 'merge',
  },
  background: {
    name: 'background',
    priority: 'low',
    batchSize: 50,
    retryDelay: 30000,
    maxRetries: 10,
    conflictResolution: 'client',
  },
};

export class SyncManager {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private conflictHandlers = new Map<string, (conflict: ConflictResolution) => Promise<any>>();
  private syncListeners = new Set<(result: SyncResult) => void>();

  constructor() {
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  /**
   * Add item to sync queue
   */
  async queueForSync(
    method: SyncQueueItem['method'],
    url: string,
    data?: any,
    options?: {
      priority?: SyncQueueItem['priority'];
      strategy?: string;
      dependencies?: string[];
    }
  ): Promise<string> {
    const strategy = SYNC_STRATEGIES[options?.strategy || 'batch'];
    
    const itemId = await offlineStorage.addToSyncQueue({
      method,
      url,
      data,
      priority: options?.priority || strategy.priority,
      maxRetries: strategy.maxRetries,
      dependencies: options?.dependencies,
    });

    // If online and high priority, sync immediately
    if (this.isOnline && (options?.priority === 'critical' || options?.priority === 'high')) {
      this.syncImmediate();
    }

    return itemId;
  }

  /**
   * Perform immediate sync
   */
  async syncImmediate(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: false, syncedItems: 0, failedItems: 0, conflicts: 0, errors: ['Sync in progress'], duration: 0 };
    }

    return this.performSync(SYNC_STRATEGIES.immediate);
  }

  /**
   * Perform batch sync
   */
  async syncBatch(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: false, syncedItems: 0, failedItems: 0, conflicts: 0, errors: ['Sync in progress'], duration: 0 };
    }

    return this.performSync(SYNC_STRATEGIES.batch);
  }

  /**
   * Perform background sync
   */
  async syncBackground(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: false, syncedItems: 0, failedItems: 0, conflicts: 0, errors: ['Sync in progress'], duration: 0 };
    }

    return this.performSync(SYNC_STRATEGIES.background);
  }

  /**
   * Force sync all pending items
   */
  async syncAll(): Promise<SyncResult> {
    if (!this.isOnline) {
      return { success: false, syncedItems: 0, failedItems: 0, conflicts: 0, errors: ['Offline'], duration: 0 };
    }

    const startTime = Date.now();
    let totalSynced = 0;
    let totalFailed = 0;
    let totalConflicts = 0;
    const allErrors: string[] = [];

    // Sync by priority
    for (const priority of ['critical', 'high', 'medium', 'low'] as const) {
      const items = await offlineStorage.getSyncQueue(priority);
      if (items.length === 0) continue;

      const result = await this.syncItems(items, SYNC_STRATEGIES.batch);
      totalSynced += result.syncedItems;
      totalFailed += result.failedItems;
      totalConflicts += result.conflicts;
      allErrors.push(...result.errors);
    }

    const duration = Date.now() - startTime;
    const result: SyncResult = {
      success: totalFailed === 0,
      syncedItems: totalSynced,
      failedItems: totalFailed,
      conflicts: totalConflicts,
      errors: allErrors,
      duration,
    };

    this.notifySyncListeners(result);
    return result;
  }

  /**
   * Get sync queue status
   */
  async getSyncStatus(): Promise<{
    totalItems: number;
    itemsByPriority: Record<string, number>;
    oldestItem?: Date;
    isOnline: boolean;
    isSyncing: boolean;
  }> {
    const allItems = await offlineStorage.getSyncQueue();
    const itemsByPriority = allItems.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const oldestItem = allItems.length > 0 
      ? new Date(Math.min(...allItems.map(item => item.timestamp)))
      : undefined;

    return {
      totalItems: allItems.length,
      itemsByPriority,
      oldestItem,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    await offlineStorage.clearSyncQueue();
    createNotification.info('Sync Queue Cleared', 'All pending sync items have been removed');
  }

  /**
   * Register conflict handler
   */
  registerConflictHandler(
    dataType: string,
    handler: (conflict: ConflictResolution) => Promise<any>
  ): void {
    this.conflictHandlers.set(dataType, handler);
  }

  /**
   * Add sync listener
   */
  addSyncListener(listener: (result: SyncResult) => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  /**
   * Check if online
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Check if currently syncing
   */
  isSyncingStatus(): boolean {
    return this.isSyncing;
  }

  // Private methods
  private async performSync(strategy: SyncStrategy): Promise<SyncResult> {
    if (!this.isOnline) {
      return { success: false, syncedItems: 0, failedItems: 0, conflicts: 0, errors: ['Offline'], duration: 0 };
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      const items = await offlineStorage.getSyncQueue(strategy.priority);
      const batchedItems = items.slice(0, strategy.batchSize);
      
      const result = await this.syncItems(batchedItems, strategy);
      result.duration = Date.now() - startTime;
      
      this.notifySyncListeners(result);
      return result;
    } catch (error) {
      const result: SyncResult = {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        conflicts: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime,
      };
      
      this.notifySyncListeners(result);
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncItems(items: SyncQueueItem[], strategy: SyncStrategy): Promise<SyncResult> {
    let syncedItems = 0;
    let failedItems = 0;
    let conflicts = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        // Check dependencies
        if (item.dependencies && item.dependencies.length > 0) {
          const pendingDeps = await this.checkPendingDependencies(item.dependencies);
          if (pendingDeps.length > 0) {
            continue; // Skip this item for now
          }
        }

        const success = await this.syncSingleItem(item, strategy);
        
        if (success) {
          await offlineStorage.removeFromSyncQueue(item.id);
          syncedItems++;
        } else {
          // Update retry count
          const newRetryCount = item.retryCount + 1;
          
          if (newRetryCount >= item.maxRetries) {
            await offlineStorage.removeFromSyncQueue(item.id);
            failedItems++;
            errors.push(`Max retries exceeded for ${item.method} ${item.url}`);
          } else {
            await offlineStorage.updateSyncQueueItem(item.id, {
              retryCount: newRetryCount,
            });
          }
        }
      } catch (error) {
        failedItems++;
        errors.push(`Error syncing ${item.method} ${item.url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: failedItems === 0,
      syncedItems,
      failedItems,
      conflicts,
      errors,
      duration: 0, // Will be set by caller
    };
  }

  private async syncSingleItem(item: SyncQueueItem, strategy: SyncStrategy): Promise<boolean> {
    try {
      const response = await apiClient.request(item.url, {
        method: item.method,
        body: item.data,
        timeout: 30000,
        retries: 0, // We handle retries at the sync level
      });

      return response.success;
    } catch (error) {
      console.error(`Failed to sync ${item.method} ${item.url}:`, error);
      return false;
    }
  }

  private async checkPendingDependencies(dependencies: string[]): Promise<string[]> {
    const allItems = await offlineStorage.getSyncQueue();
    const pendingIds = allItems.map(item => item.id);
    
    return dependencies.filter(dep => pendingIds.includes(dep));
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network: Online');
      
      createNotification.success(
        'Back Online',
        'Connection restored. Syncing pending changes...',
        { category: 'system' }
      );
      
      // Start syncing immediately when back online
      setTimeout(() => this.syncBatch(), 1000);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network: Offline');
      
      createNotification.warning(
        'Offline Mode',
        'Changes will be synced when connection is restored',
        { category: 'system' }
      );
    });
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncBackground();
      }
    }, 5 * 60 * 1000);
  }

  private notifySyncListeners(result: SyncResult): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.syncListeners.clear();
    this.conflictHandlers.clear();
  }
}

// Create singleton instance
export const syncManager = new SyncManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    syncManager.destroy();
  });
}
