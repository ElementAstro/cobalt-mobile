import { apiClient } from '@/lib/api/client';
import { offlineStorage } from '@/lib/storage/offline-storage';
import { syncManager } from '@/lib/storage/sync-manager';
import { createNotification } from '@/lib/stores/notification-store';

// Cloud sync types
export interface SyncableData {
  id: string;
  type: 'profile' | 'equipment' | 'sequence' | 'settings' | 'preferences';
  data: any;
  lastModified: Date;
  version: number;
  deviceId: string;
  userId: string;
}

export interface SyncConflict {
  id: string;
  type: string;
  localData: SyncableData;
  remoteData: SyncableData;
  conflictType: 'version' | 'concurrent' | 'deleted';
  resolution?: 'local' | 'remote' | 'merge' | 'manual';
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingUploads: number;
  pendingDownloads: number;
  conflicts: SyncConflict[];
  syncProgress: number; // 0-100
}

export interface CloudSyncConfig {
  autoSync: boolean;
  syncInterval: number; // milliseconds
  conflictResolution: 'auto' | 'manual';
  syncTypes: string[];
  maxRetries: number;
  batchSize: number;
}

class CloudSyncManager {
  private config: CloudSyncConfig = {
    autoSync: true,
    syncInterval: 5 * 60 * 1000, // 5 minutes
    conflictResolution: 'auto',
    syncTypes: ['profile', 'equipment', 'sequence', 'settings', 'preferences'],
    maxRetries: 3,
    batchSize: 10,
  };

  private status: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingUploads: 0,
    pendingDownloads: 0,
    conflicts: [],
    syncProgress: 0,
  };

  private syncTimer: NodeJS.Timeout | null = null;
  private listeners = new Set<(status: SyncStatus) => void>();
  private deviceId: string;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.setupNetworkListeners();
    this.startAutoSync();
  }

  /**
   * Start full synchronization
   */
  async startSync(): Promise<void> {
    if (this.status.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    this.updateStatus({ isSyncing: true, syncProgress: 0 });

    try {
      // Step 1: Upload local changes
      await this.uploadLocalChanges();
      this.updateStatus({ syncProgress: 30 });

      // Step 2: Download remote changes
      await this.downloadRemoteChanges();
      this.updateStatus({ syncProgress: 60 });

      // Step 3: Resolve conflicts
      await this.resolveConflicts();
      this.updateStatus({ syncProgress: 90 });

      // Step 4: Cleanup
      await this.cleanup();
      this.updateStatus({ 
        syncProgress: 100, 
        lastSync: new Date(),
        pendingUploads: 0,
        pendingDownloads: 0,
      });

      createNotification.success(
        'Sync Complete',
        'All data has been synchronized successfully',
        { category: 'system' }
      );

    } catch (error) {
      console.error('Sync failed:', error);
      createNotification.error(
        'Sync Failed',
        error instanceof Error ? error.message : 'Unknown sync error',
        { category: 'system' }
      );
    } finally {
      this.updateStatus({ isSyncing: false, syncProgress: 0 });
    }
  }

  /**
   * Upload local changes to cloud
   */
  private async uploadLocalChanges(): Promise<void> {
    const localChanges = await this.getLocalChanges();
    
    for (const batch of this.createBatches(localChanges, this.config.batchSize)) {
      try {
        const response = await apiClient.post('/sync/upload', {
          data: batch,
          deviceId: this.deviceId,
        });

        if (response.success) {
          // Mark items as synced
          for (const item of batch) {
            await this.markAsSynced(item.id, item.type);
          }
        }
      } catch (error) {
        console.error('Failed to upload batch:', error);
        // Queue for retry
        for (const item of batch) {
          await syncManager.queueForSync('POST', '/sync/upload', item, {
            priority: 'medium',
          });
        }
      }
    }
  }

  /**
   * Download remote changes from cloud
   */
  private async downloadRemoteChanges(): Promise<void> {
    try {
      const lastSync = this.status.lastSync?.toISOString();
      const response = await apiClient.get(`/sync/download?since=${lastSync}&deviceId=${this.deviceId}`);

      if (response.success && response.data) {
        const remoteChanges = response.data as SyncableData[];
        
        for (const remoteItem of remoteChanges) {
          await this.processRemoteChange(remoteItem);
        }
      }
    } catch (error) {
      console.error('Failed to download remote changes:', error);
      throw error;
    }
  }

  /**
   * Process a remote change
   */
  private async processRemoteChange(remoteItem: SyncableData): Promise<void> {
    const localItem = await this.getLocalItem(remoteItem.id, remoteItem.type);

    if (!localItem) {
      // New item from remote
      await this.storeLocalItem(remoteItem);
    } else if (localItem.version < remoteItem.version) {
      // Remote is newer
      if (localItem.lastModified > remoteItem.lastModified) {
        // Conflict: local is modified but remote has higher version
        this.addConflict({
          id: remoteItem.id,
          type: remoteItem.type,
          localData: localItem,
          remoteData: remoteItem,
          conflictType: 'concurrent',
        });
      } else {
        // Safe to update
        await this.storeLocalItem(remoteItem);
      }
    } else if (localItem.version > remoteItem.version) {
      // Local is newer - should have been uploaded already
      console.warn('Local version newer than remote, possible sync issue');
    }
    // If versions are equal, no action needed
  }

  /**
   * Resolve synchronization conflicts
   */
  private async resolveConflicts(): Promise<void> {
    const conflicts = [...this.status.conflicts];
    
    for (const conflict of conflicts) {
      try {
        if (this.config.conflictResolution === 'auto') {
          await this.autoResolveConflict(conflict);
        } else {
          // Manual resolution - notify user
          createNotification.warning(
            'Sync Conflict',
            `Conflict detected for ${conflict.type} ${conflict.id}. Manual resolution required.`,
            { category: 'system', persistent: true }
          );
        }
      } catch (error) {
        console.error('Failed to resolve conflict:', error);
      }
    }
  }

  /**
   * Auto-resolve conflict using strategy
   */
  private async autoResolveConflict(conflict: SyncConflict): Promise<void> {
    let resolution: SyncableData;

    switch (conflict.conflictType) {
      case 'concurrent':
        // Use most recent modification
        resolution = conflict.localData.lastModified > conflict.remoteData.lastModified
          ? conflict.localData
          : conflict.remoteData;
        break;
      
      case 'version':
        // Use higher version
        resolution = conflict.localData.version > conflict.remoteData.version
          ? conflict.localData
          : conflict.remoteData;
        break;
      
      case 'deleted':
        // Keep deletion
        await this.deleteLocalItem(conflict.id, conflict.type);
        this.removeConflict(conflict.id);
        return;
      
      default:
        // Default to remote
        resolution = conflict.remoteData;
    }

    // Apply resolution
    await this.storeLocalItem(resolution);
    
    // Upload if local was chosen
    if (resolution === conflict.localData) {
      await syncManager.queueForSync('PUT', `/sync/item/${conflict.id}`, resolution);
    }

    this.removeConflict(conflict.id);
  }

  /**
   * Get local changes that need to be synced
   */
  private async getLocalChanges(): Promise<SyncableData[]> {
    const changes: SyncableData[] = [];
    
    for (const type of this.config.syncTypes) {
      const items = await offlineStorage.getUserDataByType(type);
      for (const item of items) {
        if (this.needsSync(item)) {
          changes.push(this.createSyncableData(item, type));
        }
      }
    }
    
    return changes;
  }

  /**
   * Check if item needs synchronization
   */
  private needsSync(item: any): boolean {
    // Check if item has been modified since last sync
    const lastSync = this.status.lastSync;
    if (!lastSync) return true;
    
    return new Date(item.updatedAt || item.timestamp) > lastSync;
  }

  /**
   * Create syncable data object
   */
  private createSyncableData(item: any, type: string): SyncableData {
    return {
      id: item.id,
      type: type as SyncableData['type'],
      data: item,
      lastModified: new Date(item.updatedAt || item.timestamp || Date.now()),
      version: item.version || 1,
      deviceId: this.deviceId,
      userId: item.userId || 'current-user',
    };
  }

  /**
   * Create batches for processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Get local item by ID and type
   */
  private async getLocalItem(id: string, type: string): Promise<SyncableData | null> {
    const item = await offlineStorage.getUserData(`${type}:${id}`);
    return item ? this.createSyncableData(item, type) : null;
  }

  /**
   * Store item locally
   */
  private async storeLocalItem(item: SyncableData): Promise<void> {
    await offlineStorage.setUserData(
      `${item.type}:${item.id}`,
      item.data,
      item.userId,
      item.type
    );
  }

  /**
   * Delete local item
   */
  private async deleteLocalItem(id: string, type: string): Promise<void> {
    await offlineStorage.deleteUserData(`${type}:${id}`);
  }

  /**
   * Mark item as synced
   */
  private async markAsSynced(id: string, type: string): Promise<void> {
    // Implementation would mark the item as synced in local storage
    // This prevents it from being uploaded again
  }

  /**
   * Add conflict to list
   */
  private addConflict(conflict: SyncConflict): void {
    this.status.conflicts.push(conflict);
    this.notifyListeners();
  }

  /**
   * Remove conflict from list
   */
  private removeConflict(id: string): void {
    this.status.conflicts = this.status.conflicts.filter(c => c.id !== id);
    this.notifyListeners();
  }

  /**
   * Cleanup after sync
   */
  private async cleanup(): Promise<void> {
    // Clean up old sync metadata, temporary files, etc.
    await offlineStorage.cleanupExpiredCache();
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /**
   * Setup network event listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true });
      if (this.config.autoSync) {
        setTimeout(() => this.startSync(), 1000);
      }
    });

    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false });
    });
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.config.autoSync) {
      this.syncTimer = setInterval(() => {
        if (this.status.isOnline && !this.status.isSyncing) {
          this.startSync();
        }
      }, this.config.syncInterval);
    }
  }

  /**
   * Update sync status
   */
  private updateStatus(updates: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  /**
   * Notify status listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }

  // Public API
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  getConfig(): CloudSyncConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<CloudSyncConfig>): void {
    this.config = { ...this.config, ...updates };
    if (updates.autoSync !== undefined || updates.syncInterval !== undefined) {
      this.startAutoSync();
    }
  }

  addStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async forceSync(): Promise<void> {
    return this.startSync();
  }

  async resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    const conflict = this.status.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    conflict.resolution = resolution;
    await this.autoResolveConflict(conflict);
  }
}

// Create singleton instance
export const cloudSyncManager = new CloudSyncManager();
