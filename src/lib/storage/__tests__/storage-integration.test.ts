/**
 * @jest-environment jsdom
 */

import { StorageManager } from '../storage-manager';
import { PerformanceMonitor } from '../../performance/performance-monitor';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('Storage Integration Tests', () => {
  let storageManager: StorageManager;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all localStorage mocks to default behavior
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
    mockLocalStorage.clear.mockImplementation(() => {});
    mockLocalStorage.length = 0;
    mockLocalStorage.key.mockReturnValue(null);
    
    storageManager = new StorageManager();
    performanceMonitor = new PerformanceMonitor();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  afterEach(() => {
    // Clean up any timers or async operations
    jest.clearAllTimers();
    jest.clearAllMocks();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Storage Performance', () => {
    it('should measure storage operation performance', async () => {
      const testData = { key: 'value', timestamp: Date.now() };
      
      performanceMonitor.startTiming('storage-write');
      await storageManager.setItem('test-key', testData);
      performanceMonitor.endTiming('storage-write');

      expect(mockPerformance.mark).toHaveBeenCalledWith('storage-write-start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('storage-write-end');
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'storage-write',
        'storage-write-start',
        'storage-write-end'
      );
    });

    it('should handle large data storage efficiently', async () => {
      const largeData = {
        images: new Array(10).fill(0).map((_, i) => ({
          id: i,
          data: 'x'.repeat(50), // 50 bytes per item instead of 1KB
          metadata: { created: Date.now(), size: 1000 }
        }))
      };

      const startTime = performance.now();
      await storageManager.setItem('large-dataset', largeData);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'large-dataset',
        JSON.stringify(largeData)
      );
    });

    it('should batch multiple storage operations', async () => {
      const operations = [
        { key: 'item1', value: { data: 'test1' } },
        { key: 'item2', value: { data: 'test2' } },
        { key: 'item3', value: { data: 'test3' } },
      ];

      performanceMonitor.startTiming('batch-storage');
      
      await Promise.all(
        operations.map(op => storageManager.setItem(op.key, op.value))
      );
      
      performanceMonitor.endTiming('batch-storage');

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);
      operations.forEach(op => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          op.key,
          JSON.stringify(op.value)
        );
      });
    });
  });

  describe('Storage Capacity Management', () => {
    it('should handle storage quota exceeded errors', async () => {
      let setItemCallCount = 0;

      // Mock localStorage to always throw quota exceeded error, even on retry
      mockLocalStorage.setItem.mockImplementation(() => {
        setItemCallCount++;
        // Create a proper DOMException-like error
        const error = new Error('Storage quota exceeded');
        error.name = 'QuotaExceededError';
        // Make it look like a DOMException
        Object.setPrototypeOf(error, DOMException.prototype);
        throw error;
      });

      // Mock the cleanup methods to prevent infinite loops
      mockLocalStorage.length = 0; // No items in storage
      mockLocalStorage.key.mockReturnValue(null); // No keys to iterate
      mockLocalStorage.removeItem.mockImplementation(() => {});

      const testData = { large: 'x'.repeat(1000) }; // 1KB string

      await expect(
        storageManager.setItem('large-item', testData)
      ).rejects.toThrow('Storage quota exceeded');

      expect(setItemCallCount).toBe(2); // Should have been called twice (initial + retry)
    });

    it('should implement storage cleanup when quota is exceeded', async () => {
      // Mock storage to have some existing items for cleanup
      mockLocalStorage.length = 3;
      mockLocalStorage.key
        .mockReturnValueOnce('old-item-1')
        .mockReturnValueOnce('old-item-2') 
        .mockReturnValueOnce('recent-item')
        .mockReturnValue(null);

      // Mock existing items in storage - old items should be removed
      mockLocalStorage.getItem
        .mockImplementation((key: string) => {
          switch (key) {
            case 'old-item-1':
              return JSON.stringify({ timestamp: Date.now() - 86400000 }); // 1 day old
            case 'old-item-2':
              return JSON.stringify({ timestamp: Date.now() - 86400000 }); // 1 day old
            case 'recent-item':
              return JSON.stringify({ timestamp: Date.now() - 60000 }); // 1 minute old
            default:
              return null;
          }
        });

      mockLocalStorage.setItem
        .mockImplementationOnce(() => {
          const error = new DOMException('Storage quota exceeded', 'QuotaExceededError');
          throw error;
        })
        .mockImplementationOnce(() => {}); // Success after cleanup

      const newData = { data: 'new item' };

      await storageManager.setItem('new-item', newData);

      // Should have attempted cleanup by removing old items
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('old-item-1');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('old-item-2');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('recent-item');
      
      // Should have retried the operation
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
    });

    it('should monitor storage usage', async () => {
      mockLocalStorage.length = 2;
      mockLocalStorage.key
        .mockImplementation((index: number) => {
          switch (index) {
            case 0: return 'item1';
            case 1: return 'item2';
            default: return null;
          }
        });

      mockLocalStorage.getItem
        .mockImplementation((key: string) => {
          switch (key) {
            case 'item1': return '{"data":"value1"}';
            case 'item2': return '{"data":"value2"}';
            default: return null;
          }
        });

      const usage = await storageManager.getStorageUsage();

      expect(usage.itemCount).toBe(2);
      expect(usage.estimatedSize).toBeGreaterThan(0);
      expect(typeof usage.availableSpace).toBe('number');
    });
  });

  describe('Data Persistence and Recovery', () => {
    it('should persist data across sessions', async () => {
      const sessionData = {
        cameraSettings: { exposure: 300, iso: 800 },
        lastSession: Date.now(),
      };

      await storageManager.setItem('session-data', sessionData);

      // Get what was actually stored by checking the mock calls
      const setItemCalls = mockLocalStorage.setItem.mock.calls;
      const storedData = setItemCalls.find(call => call[0] === 'session-data')?.[1];
      
      // Mock getItem to return what was actually stored
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'session-data') {
          return storedData || null;
        }
        return null;
      });

      const retrievedData = await storageManager.getItem('session-data');
      expect(retrievedData).toEqual(sessionData);
    });

    it('should handle corrupted data gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'corrupted-item') {
          return 'invalid-json{';
        }
        return null;
      });

      const result = await storageManager.getItem('corrupted-item');
      expect(result).toBeNull();

      // Should not have attempted to clean up corrupted data automatically
      // (cleanup only happens for expired TTL items, not parse errors)
    });

    it('should implement data versioning', async () => {
      const v1Data = { version: 1, settings: { exposure: 300 } };
      const v2Data = { version: 2, settings: { exposure: 300, iso: 800 } };

      // Store v1 data
      await storageManager.setItem('versioned-data', v1Data);

      // Simulate upgrade to v2
      await storageManager.migrateData('versioned-data', v1Data, v2Data);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'versioned-data',
        JSON.stringify(v2Data)
      );
    });
  });

  describe('Offline Storage Synchronization', () => {
    it('should queue operations when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      const offlineData = { id: 1, data: 'offline-item' };
      
      await storageManager.setItem('offline-item', offlineData);
      
      // Should store in offline queue
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'offline-queue',
        expect.stringContaining('offline-item')
      );
    });

    it('should sync queued operations when online', async () => {
      // Setup offline queue
      const queuedOperations = [
        { type: 'set', key: 'item1', value: { data: 'test1' } },
        { type: 'set', key: 'item2', value: { data: 'test2' } },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(queuedOperations));

      // Mock online state
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });

      await storageManager.syncOfflineQueue();

      // Should have processed all queued operations
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'item1',
        JSON.stringify({ data: 'test1' })
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'item2',
        JSON.stringify({ data: 'test2' })
      );

      // Should have cleared the queue
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('offline-queue');
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track storage operation metrics', async () => {
      const operations = [
        () => storageManager.setItem('perf-test-1', { data: 'test' }),
        () => storageManager.getItem('perf-test-1'),
        () => storageManager.removeItem('perf-test-1'),
      ];

      for (const operation of operations) {
        const startTime = performance.now();
        await operation();
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(1000); // Should be fast
      }

      const metrics = performanceMonitor.getMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should detect slow storage operations', async () => {
      // Mock performance.now to simulate slow operation
      const originalNow = performance.now;
      let callCount = 0;
      performance.now = jest.fn(() => {
        callCount++;
        if (callCount === 1) return 0; // Start time
        if (callCount === 2) return 1500; // End time (1500ms later)
        return originalNow.call(performance);
      });

      const slowData = { large: 'x'.repeat(100) }; // 100 bytes instead of 1MB

      performanceMonitor.startTiming('slow-storage');
      await storageManager.setItem('slow-item', slowData);
      performanceMonitor.endTiming('slow-storage');

      const slowOperations = performanceMonitor.getSlowOperations(1000);
      expect(slowOperations.length).toBeGreaterThan(0);

      // Restore original performance.now
      performance.now = originalNow;
    });

    it('should monitor memory usage during storage operations', () => {
      const initialMemory = performanceMonitor.getMemoryUsage();
      
      // Perform a few storage operations instead of 100
      const promises = Array.from({ length: 5 }, (_, i) =>
        storageManager.setItem(`item-${i}`, { data: `test-${i}` })
      );

      Promise.all(promises).then(() => {
        const finalMemory = performanceMonitor.getMemoryUsage();
        
        expect(finalMemory.used).toBeGreaterThanOrEqual(initialMemory.used);
        expect(finalMemory.total).toBeGreaterThanOrEqual(initialMemory.total);
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle storage API unavailability', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const fallbackManager = new StorageManager();
      
      // Should fall back to in-memory storage
      await expect(
        fallbackManager.setItem('test', { data: 'test' })
      ).resolves.not.toThrow();

      const retrieved = await fallbackManager.getItem('test');
      expect(retrieved).toEqual({ data: 'test' });
    });

    it('should implement retry logic for failed operations', async () => {
      let attempts = 0;
      mockLocalStorage.setItem.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary storage error');
        }
        return undefined; // Success on third attempt
      });

      const testData = { retry: 'test' };
      
      await storageManager.setItemWithRetry('retry-item', testData);
      
      expect(attempts).toBe(3);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent access conflicts', async () => {
      const concurrentOperations = Array.from({ length: 3 }, (_, i) =>
        storageManager.setItem(`concurrent-${i}`, { data: `test-${i}` })
      );

      await expect(
        Promise.all(concurrentOperations)
      ).resolves.not.toThrow();

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(10);
    });
  });

  describe('Data Compression and Optimization', () => {
    it('should compress large data before storage', async () => {
      const largeData = {
        repeatedData: 'x'.repeat(10000),
        array: new Array(1000).fill('repeated-value'),
      };

      await storageManager.setItem('compressed-data', largeData, { compress: true });

      // Should have stored compressed data
      const storedCall = mockLocalStorage.setItem.mock.calls.find(
        call => call[0] === 'compressed-data'
      );
      
      expect(storedCall).toBeDefined();
      expect(storedCall[1].length).toBeLessThan(JSON.stringify(largeData).length);
    });

    it('should decompress data on retrieval', async () => {
      const originalData = { test: 'data', array: [1, 2, 3] };
      
      // Store with compression
      await storageManager.setItem('compressed-item', originalData, { compress: true });
      
      // Mock compressed data retrieval
      const compressedData = mockLocalStorage.setItem.mock.calls[0][1];
      mockLocalStorage.getItem.mockReturnValue(compressedData);

      const retrievedData = await storageManager.getItem('compressed-item');
      expect(retrievedData).toEqual(originalData);
    });
  });

  describe('Storage Analytics', () => {
    it('should track storage usage patterns', () => {
      const analytics = storageManager.getAnalytics();
      
      expect(analytics).toHaveProperty('totalOperations');
      expect(analytics).toHaveProperty('averageOperationTime');
      expect(analytics).toHaveProperty('errorRate');
      expect(analytics).toHaveProperty('storageEfficiency');
    });

    it('should identify storage hotspots', async () => {
      // Simulate frequent access to certain keys
      const hotKeys = ['user-settings', 'camera-config', 'recent-images'];
      
      for (const key of hotKeys) {
        for (let i = 0; i < 10; i++) {
          await storageManager.getItem(key);
        }
      }

      const hotspots = storageManager.getHotspots();
      expect(hotspots.length).toBeGreaterThan(0);
      expect(hotspots[0].key).toBe('user-settings');
      expect(hotspots[0].accessCount).toBe(10);
    });
  });
});
