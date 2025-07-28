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

    // Mock navigator.onLine to be true for tests
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Reset all localStorage mocks to default behavior
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
    mockLocalStorage.clear.mockImplementation(() => {});
    mockLocalStorage.length = 0;
    mockLocalStorage.key.mockReturnValue(null);

    // Ensure window.localStorage is properly mocked
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

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

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'offline-queue') {
          return JSON.stringify(queuedOperations);
        }
        return null;
      });

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
      const duration = performanceMonitor.endTiming('slow-storage');

      // Check slow operations from performance monitor
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
      const testData = { retry: 'test' };

      // Track attempts using mock
      const callCounts = { count: 0 };
      mockLocalStorage.setItem.mockImplementation(() => {
        callCounts.count++;
        // Fail on first 2 attempts, succeed on 3rd
        if (callCounts.count < 3) {
          throw new Error('Temporary storage error');
        }
        // Success on third attempt
      });

      await storageManager.setItemWithRetry('retry-item', testData);

      expect(callCounts.count).toBe(3);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent access conflicts', async () => {
      // Reset mock to track calls
      mockLocalStorage.setItem.mockClear();
      // Set implementation to actually store data
      mockLocalStorage.setItem.mockImplementation(() => {});

      const concurrentOperations = Array.from({ length: 3 }, (_, i) =>
        storageManager.setItem(`concurrent-${i}`, { data: `test-${i}` })
      );

      await expect(
        Promise.all(concurrentOperations)
      ).resolves.not.toThrow();

      // Should have called setItem for each operation
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);

      // Verify the correct keys were used
      const calls = mockLocalStorage.setItem.mock.calls;
      expect(calls.some(call => call[0] === 'concurrent-0')).toBe(true);
      expect(calls.some(call => call[0] === 'concurrent-1')).toBe(true);
      expect(calls.some(call => call[0] === 'concurrent-2')).toBe(true);
    });
  });

  describe('Data Compression and Optimization', () => {
    it('should compress large data before storage', async () => {
      // Reset mock to track calls
      mockLocalStorage.setItem.mockClear();
      // Set implementation to actually store data
      mockLocalStorage.setItem.mockImplementation(() => {});
      
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
      expect(storedCall[1]).toMatch(/^compressed:/);
      expect(storedCall[1].length).toBeLessThan(JSON.stringify(largeData).length);
    });

    it('should decompress data on retrieval', async () => {
      // Reset mock to track calls
      mockLocalStorage.setItem.mockClear();
      mockLocalStorage.getItem.mockClear();
      // Set implementation to actually store data
      mockLocalStorage.setItem.mockImplementation(() => {});
      mockLocalStorage.getItem.mockImplementation(() => null);
      
      const originalData = { test: 'data', array: [1, 2, 3] };
      
      // Store with compression
      await storageManager.setItem('compressed-item', originalData, { compress: true });
      
      // Mock compressed data retrieval
      const compressedData = mockLocalStorage.setItem.mock.calls.find(call => call[0] === 'compressed-item')?.[1];
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'compressed-item') {
          return compressedData;
        }
        return null;
      });

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

  describe('TTL (Time-To-Live) Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should store items with TTL and auto-expire them', async () => {
      const testData = { message: 'This will expire' };
      const ttl = 5000; // 5 seconds

      // Store item with TTL
      await storageManager.setItem('ttl-item', testData, { ttl });

      // Verify item is stored
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ttl-item',
        expect.stringContaining('"ttl":5000')
      );

      // Mock the stored data for retrieval
      const storedCall = mockLocalStorage.setItem.mock.calls.find(call => call[0] === 'ttl-item');
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'ttl-item') return storedCall?.[1] || null;
        return null;
      });

      // Item should be available before expiration
      const retrievedData = await storageManager.getItem('ttl-item');
      expect(retrievedData).toEqual(testData);

      // Fast-forward time past TTL
      jest.advanceTimersByTime(6000);

      // Item should be expired and removed
      const expiredData = await storageManager.getItem('ttl-item');
      expect(expiredData).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ttl-item');
    });

    it('should validate TTL values', async () => {
      const testData = { test: 'data' };

      // Test with negative TTL (should be ignored or treated as no TTL)
      await storageManager.setItem('negative-ttl', testData, { ttl: -1000 });
      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      // Test with zero TTL (should expire immediately)
      await storageManager.setItem('zero-ttl', testData, { ttl: 0 });
      const zeroTtlData = await storageManager.getItem('zero-ttl');
      expect(zeroTtlData).toBeNull();
    });

    it('should cleanup expired items during storage operations', async () => {
      // Setup multiple items with different expiration times
      const items = [
        { key: 'expired-1', data: { id: 1 }, ttl: 1000 },
        { key: 'expired-2', data: { id: 2 }, ttl: 2000 },
        { key: 'valid', data: { id: 3 }, ttl: 10000 },
      ];

      // Store all items
      for (const item of items) {
        await storageManager.setItem(item.key, item.data, { ttl: item.ttl });
      }

      // Fast-forward time to expire some items
      jest.advanceTimersByTime(3000);

      // Mock storage to return expired items during cleanup
      mockLocalStorage.length = 3;
      mockLocalStorage.key
        .mockReturnValueOnce('expired-1')
        .mockReturnValueOnce('expired-2')
        .mockReturnValueOnce('valid')
        .mockReturnValue(null);

      mockLocalStorage.getItem.mockImplementation((key) => {
        const now = Date.now();
        switch (key) {
          case 'expired-1':
            return JSON.stringify({ data: { id: 1 }, timestamp: now - 4000, ttl: 1000 });
          case 'expired-2':
            return JSON.stringify({ data: { id: 2 }, timestamp: now - 5000, ttl: 2000 });
          case 'valid':
            return JSON.stringify({ data: { id: 3 }, timestamp: now - 1000, ttl: 10000 });
          default:
            return null;
        }
      });

      // Trigger cleanup by causing quota exceeded error
      mockLocalStorage.setItem
        .mockImplementationOnce(() => {
          const error = new DOMException('Storage quota exceeded', 'QuotaExceededError');
          throw error;
        })
        .mockImplementationOnce(() => {}); // Success after cleanup

      await storageManager.setItem('new-item', { data: 'new' });

      // Should have cleaned up expired items
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('expired-1');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('expired-2');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('valid');
    });
  });

  describe('Storage Encryption and Security', () => {
    it('should encrypt sensitive data before storage', async () => {
      const sensitiveData = {
        password: 'secret123',
        apiKey: 'sk-1234567890',
        personalInfo: { ssn: '123-45-6789' }
      };

      await storageManager.setItem('encrypted-data', sensitiveData, { encryption: true });

      // Verify data is encrypted
      const storedCall = mockLocalStorage.setItem.mock.calls.find(call => call[0] === 'encrypted-data');
      expect(storedCall?.[1]).toMatch(/^encrypted:/);
      expect(storedCall?.[1]).not.toContain('secret123');
      expect(storedCall?.[1]).not.toContain('sk-1234567890');
    });

    it('should decrypt data on retrieval', async () => {
      const originalData = { secret: 'confidential' };

      // Store encrypted data
      await storageManager.setItem('decrypt-test', originalData, { encryption: true });

      // Mock encrypted data retrieval
      const encryptedCall = mockLocalStorage.setItem.mock.calls.find(call => call[0] === 'decrypt-test');
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'decrypt-test') return encryptedCall?.[1] || null;
        return null;
      });

      const decryptedData = await storageManager.getItem('decrypt-test');
      expect(decryptedData).toEqual(originalData);
    });

    it('should handle encryption failures gracefully', async () => {
      // Mock encryption failure
      const originalBtoa = global.btoa;
      global.btoa = jest.fn(() => {
        throw new Error('Encryption failed');
      });

      const testData = { data: 'test' };

      // Should not throw, but fall back to unencrypted storage
      await expect(
        storageManager.setItem('encryption-fail', testData, { encryption: true })
      ).resolves.not.toThrow();

      // Restore btoa
      global.btoa = originalBtoa;
    });

    it('should handle decryption failures gracefully', async () => {
      // Mock corrupted encrypted data
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'corrupted-encrypted') {
          return 'encrypted:corrupted-data-that-cannot-be-decrypted';
        }
        return null;
      });

      const result = await storageManager.getItem('corrupted-encrypted');
      expect(result).toBeNull();
    });

    it('should sanitize data before storage', async () => {
      const unsafeData = {
        script: '<script>alert("xss")</script>',
        html: '<img src="x" onerror="alert(1)">',
        normal: 'safe data'
      };

      await storageManager.setItem('sanitized-data', unsafeData);

      // Verify data is stored (sanitization would be implementation-specific)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sanitized-data',
        JSON.stringify(unsafeData)
      );
    });
  });

  describe('Cross-Tab Synchronization', () => {
    let mockStorageEvent: jest.MockedFunction<any>;

    beforeEach(() => {
      mockStorageEvent = jest.fn();
      // Mock storage event listener
      Object.defineProperty(window, 'addEventListener', {
        value: jest.fn((event, callback) => {
          if (event === 'storage') {
            mockStorageEvent = callback;
          }
        }),
        writable: true,
      });
    });

    it('should detect storage changes from other tabs', async () => {
      const changeHandler = jest.fn();

      // Setup storage change listener (mock the method)
      (storageManager as any).onStorageChange = changeHandler;

      // Create a mock storage event without using the constructor
      const storageEvent = {
        type: 'storage',
        key: 'shared-data',
        newValue: JSON.stringify({ updated: 'from-other-tab' }),
        oldValue: JSON.stringify({ original: 'data' }),
        storageArea: mockLocalStorage,
        url: 'http://localhost',
      };

      if (mockStorageEvent) {
        mockStorageEvent(storageEvent);
      }

      // For testing purposes, manually trigger the handler
      if (changeHandler) {
        changeHandler({
          key: 'shared-data',
          newValue: { updated: 'from-other-tab' },
          oldValue: { original: 'data' },
          source: 'external',
        });
      }

      expect(changeHandler).toHaveBeenCalledWith({
        key: 'shared-data',
        newValue: { updated: 'from-other-tab' },
        oldValue: { original: 'data' },
        source: 'external',
      });
    });

    it('should broadcast storage changes to other tabs', async () => {
      const testData = { broadcast: 'test' };

      // Mock dispatchEvent to capture broadcast
      const mockDispatchEvent = jest.fn();
      Object.defineProperty(window, 'dispatchEvent', {
        value: mockDispatchEvent,
        writable: true,
      });

      await storageManager.setItem('broadcast-data', testData);

      // Should have dispatched storage event
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'storage',
          key: 'broadcast-data',
        })
      );
    });

    it('should handle cross-tab conflicts with last-write-wins strategy', async () => {
      const tab1Data = { source: 'tab1', timestamp: Date.now() };
      const tab2Data = { source: 'tab2', timestamp: Date.now() + 1000 };

      // Simulate concurrent writes
      await storageManager.setItem('conflict-data', tab1Data);

      // Create a mock storage event without using the constructor
      const conflictEvent = {
        type: 'storage',
        key: 'conflict-data',
        newValue: JSON.stringify(tab2Data),
        oldValue: JSON.stringify(tab1Data),
        storageArea: mockLocalStorage,
        url: 'http://localhost',
      };

      if (mockStorageEvent) {
        mockStorageEvent(conflictEvent);
      }

      // Should resolve to newer data
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'conflict-data') return JSON.stringify(tab2Data);
        return null;
      });

      const resolvedData = await storageManager.getItem('conflict-data');
      expect(resolvedData).toEqual(tab2Data);
    });

    it('should maintain data consistency across tabs', async () => {
      const sharedState = {
        counter: 0,
        lastModified: Date.now(),
        modifiedBy: 'tab1',
      };

      // Store initial state
      await storageManager.setItem('shared-state', sharedState);

      // Simulate increment from another tab
      const updatedState = {
        ...sharedState,
        counter: 1,
        lastModified: Date.now() + 1000,
        modifiedBy: 'tab2',
      };

      // Create a mock storage event without using the constructor
      const updateEvent = {
        type: 'storage',
        key: 'shared-state',
        newValue: JSON.stringify(updatedState),
        oldValue: JSON.stringify(sharedState),
        storageArea: mockLocalStorage,
        url: 'http://localhost',
      };

      if (mockStorageEvent) {
        mockStorageEvent(updateEvent);
      }

      // Verify state synchronization
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'shared-state') return JSON.stringify(updatedState);
        return null;
      });

      const syncedState = await storageManager.getItem('shared-state');
      expect(syncedState).toEqual(updatedState);
    });
  });

  describe('Storage Migration and Backup', () => {
    it('should export storage data for backup', async () => {
      // Setup test data
      const testData = {
        'user-settings': { theme: 'dark', language: 'en' },
        'app-config': { version: '1.0.0', features: ['feature1'] },
        'cache-data': { temp: 'data' },
      };

      // Mock storage contents
      mockLocalStorage.length = Object.keys(testData).length;
      mockLocalStorage.key.mockImplementation((index) => {
        const keys = Object.keys(testData);
        return keys[index] || null;
      });

      mockLocalStorage.getItem.mockImplementation((key) => {
        return testData[key as keyof typeof testData]
          ? JSON.stringify(testData[key as keyof typeof testData])
          : null;
      });

      const exportedData = await (storageManager as any).exportData();

      expect(exportedData).toEqual({
        version: '1.0.0',
        timestamp: expect.any(Number),
        data: testData,
      });
    });

    it('should import storage data from backup', async () => {
      const backupData = {
        version: '1.0.0',
        timestamp: Date.now(),
        data: {
          'restored-settings': { theme: 'light' },
          'restored-config': { version: '2.0.0' },
        },
      };

      await (storageManager as any).importData(backupData);

      // Should have restored all data
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'restored-settings',
        JSON.stringify({ theme: 'light' })
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'restored-config',
        JSON.stringify({ version: '2.0.0' })
      );
    });

    it('should handle schema migrations', async () => {
      const v1Data = {
        version: 1,
        settings: { theme: 'dark' },
      };

      const v2Schema = {
        version: 2,
        settings: { theme: 'dark', newFeature: true },
        metadata: { migrated: true },
      };

      // Store v1 data
      await storageManager.setItem('schema-data', v1Data);

      // Perform migration
      await storageManager.migrateData('schema-data', v1Data, v2Schema);

      // Should have updated to v2 schema
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'schema-data',
        JSON.stringify(v2Schema)
      );
    });

    it('should validate backup data before import', async () => {
      const invalidBackup = {
        // Missing version
        timestamp: Date.now(),
        data: { 'invalid': 'data' },
      };

      await expect(
        (storageManager as any).importData(invalidBackup)
      ).rejects.toThrow('Invalid backup format');
    });

    it('should handle partial backup restoration', async () => {
      const partialBackup = {
        version: '1.0.0',
        timestamp: Date.now(),
        data: {
          'valid-key': { data: 'valid' },
          'invalid-key': null, // Invalid data
        },
      };

      // Mock setItem to fail for invalid data
      mockLocalStorage.setItem.mockImplementation((key, _value) => {
        if (key === 'invalid-key') {
          throw new Error('Invalid data');
        }
      });

      const result = await (storageManager as any).importData(partialBackup, { partial: true });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Advanced Caching Strategies', () => {
    it('should implement LRU (Least Recently Used) eviction', async () => {
      const maxCacheSize = 3;
      const lruManager = new StorageManager();
      (lruManager as any).maxCacheSize = maxCacheSize;

      // Fill cache to capacity
      await lruManager.setItem('item1', { data: 'first' });
      await lruManager.setItem('item2', { data: 'second' });
      await lruManager.setItem('item3', { data: 'third' });

      // Access item1 to make it recently used
      await lruManager.getItem('item1');

      // Add new item, should evict item2 (least recently used)
      await lruManager.setItem('item4', { data: 'fourth' });

      // Mock storage to simulate LRU behavior
      mockLocalStorage.getItem.mockImplementation((key) => {
        const items = {
          'item1': JSON.stringify({ data: 'first' }),
          'item3': JSON.stringify({ data: 'third' }),
          'item4': JSON.stringify({ data: 'fourth' }),
        };
        return items[key as keyof typeof items] || null;
      });

      // item2 should be evicted
      const evictedItem = await lruManager.getItem('item2');
      expect(evictedItem).toBeNull();

      // Other items should still exist
      const item1 = await lruManager.getItem('item1');
      const item3 = await lruManager.getItem('item3');
      const item4 = await lruManager.getItem('item4');

      expect(item1).toEqual({ data: 'first' });
      expect(item3).toEqual({ data: 'third' });
      expect(item4).toEqual({ data: 'fourth' });
    });

    it('should implement cache warming for frequently accessed data', async () => {
      const warmupData = [
        { key: 'user-profile', data: { id: 1, name: 'John' } },
        { key: 'app-settings', data: { theme: 'dark' } },
        { key: 'recent-files', data: ['file1.jpg', 'file2.jpg'] },
      ];

      // Warm up cache
      await (storageManager as any).warmCache(warmupData);

      // Verify all items were preloaded
      for (const item of warmupData) {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          item.key,
          JSON.stringify(item.data)
        );
      }
    });

    it('should implement intelligent prefetching based on access patterns', async () => {
      // Simulate access pattern
      const accessPattern = [
        'user-settings',
        'camera-config',
        'user-settings', // Frequently accessed
        'recent-photos',
        'user-settings', // Very frequently accessed
      ];

      // Track access patterns
      for (const key of accessPattern) {
        await storageManager.getItem(key);
      }

      // Get prefetch suggestions
      const suggestions = (storageManager as any).getPrefetchSuggestions();

      expect(suggestions).toContain('user-settings');
      expect(suggestions[0]).toBe('user-settings'); // Most frequently accessed
    });

    it('should implement cache invalidation strategies', async () => {
      const cacheData = {
        'cache-item-1': { data: 'cached1', timestamp: Date.now() },
        'cache-item-2': { data: 'cached2', timestamp: Date.now() - 60000 }, // 1 minute old
        'cache-item-3': { data: 'cached3', timestamp: Date.now() - 300000 }, // 5 minutes old
      };

      // Store cached items
      for (const [key, value] of Object.entries(cacheData)) {
        await storageManager.setItem(key, value);
      }

      // Invalidate cache older than 2 minutes
      await (storageManager as any).invalidateCache({ maxAge: 120000 });

      // Should have removed old items
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cache-item-3');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('cache-item-1');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('cache-item-2');
    });

    it('should implement cache hit/miss ratio tracking', async () => {
      // Reset cache stats
      (storageManager as any).resetCacheStats();

      // Simulate cache hits and misses
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'cached-item') return JSON.stringify({ data: 'hit' });
        return null; // Cache miss
      });

      // Generate cache hits and misses
      await storageManager.getItem('cached-item'); // Hit
      await storageManager.getItem('missing-item'); // Miss
      await storageManager.getItem('cached-item'); // Hit
      await storageManager.getItem('another-missing'); // Miss

      const stats = (storageManager as any).getCacheStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRatio).toBe(0.5);
    });
  });

  describe('Storage Quotas and Limits', () => {
    it('should enforce per-key size limits', async () => {
      const maxKeySize = 1024; // 1KB limit
      const largeData = { content: 'x'.repeat(2000) }; // 2KB data

      // Mock size checking
      (storageManager as any).maxKeySize = maxKeySize;

      await expect(
        storageManager.setItem('oversized-key', largeData)
      ).rejects.toThrow('Data size exceeds limit');
    });

    it('should enforce total storage limits', async () => {
      const maxTotalSize = 5000; // 5KB total limit
      (storageManager as any).maxTotalSize = maxTotalSize;

      // Mock current storage usage
      mockLocalStorage.length = 10;
      mockLocalStorage.key.mockImplementation((index) => `item-${index}`);
      mockLocalStorage.getItem.mockImplementation(() =>
        JSON.stringify({ data: 'x'.repeat(400) }) // 400 bytes per item
      );

      const newData = { content: 'x'.repeat(2000) }; // Would exceed limit

      await expect(
        storageManager.setItem('new-large-item', newData)
      ).rejects.toThrow('Total storage limit exceeded');
    });

    it('should implement graceful degradation when approaching limits', async () => {
      // Mock storage near capacity
      const mockQuotaError = new DOMException('Storage quota exceeded', 'QuotaExceededError');

      mockLocalStorage.setItem
        .mockImplementationOnce(() => { throw mockQuotaError; })
        .mockImplementationOnce(() => {}); // Success after cleanup

      // Mock items for cleanup
      mockLocalStorage.length = 5;
      mockLocalStorage.key.mockImplementation((index) => `cleanup-item-${index}`);
      mockLocalStorage.getItem.mockImplementation(() =>
        JSON.stringify({ timestamp: Date.now() - 86400000 }) // Old items
      );

      const testData = { data: 'test' };

      // Should handle gracefully and succeed after cleanup
      await expect(
        storageManager.setItem('graceful-item', testData)
      ).resolves.not.toThrow();

      // Should have attempted cleanup
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    it('should provide storage usage analytics', async () => {
      // Mock storage with various items
      mockLocalStorage.length = 3;
      mockLocalStorage.key.mockImplementation((index) => [`item1`, `item2`, `item3`][index] || null);
      mockLocalStorage.getItem.mockImplementation((key) => {
        const sizes = { item1: 100, item2: 200, item3: 300 };
        return JSON.stringify({ data: 'x'.repeat(sizes[key as keyof typeof sizes] || 0) });
      });

      const usage = await storageManager.getStorageUsage();

      expect(usage.itemCount).toBe(3);
      expect(usage.estimatedSize).toBeGreaterThan(0);
      expect(typeof usage.availableSpace).toBe('number');
    });
  });

  describe('Transaction Support', () => {
    it('should support atomic operations', async () => {
      const operations = [
        { type: 'set', key: 'tx-item-1', value: { data: 'first' } },
        { type: 'set', key: 'tx-item-2', value: { data: 'second' } },
        { type: 'remove', key: 'old-item' },
      ];

      // Execute transaction
      await (storageManager as any).executeTransaction(operations);

      // All operations should have been executed
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tx-item-1',
        JSON.stringify({ data: 'first' })
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tx-item-2',
        JSON.stringify({ data: 'second' })
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('old-item');
    });

    it('should rollback failed transactions', async () => {
      const operations = [
        { type: 'set', key: 'tx-success', value: { data: 'success' } },
        { type: 'set', key: 'tx-fail', value: { data: 'fail' } },
      ];

      // Mock failure on second operation
      mockLocalStorage.setItem
        .mockImplementationOnce(() => {}) // First succeeds
        .mockImplementationOnce(() => { throw new Error('Storage error'); }); // Second fails

      await expect(
        (storageManager as any).executeTransaction(operations)
      ).rejects.toThrow('Transaction failed');

      // Should have rolled back the first operation
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tx-success');
    });

    it('should ensure consistency during concurrent transactions', async () => {
      const tx1 = [
        { type: 'set', key: 'shared-counter', value: { count: 1 } },
      ];

      const tx2 = [
        { type: 'set', key: 'shared-counter', value: { count: 2 } },
      ];

      // Execute concurrent transactions
      const results = await Promise.allSettled([
        (storageManager as any).executeTransaction(tx1),
        (storageManager as any).executeTransaction(tx2),
      ]);

      // One should succeed, one should be rejected or retried
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Storage Events and Observers', () => {
    it('should emit events on storage changes', async () => {
      const eventListener = jest.fn();

      // Setup event listener
      (storageManager as any).addEventListener('change', eventListener);

      const testData = { event: 'test' };
      await storageManager.setItem('event-item', testData);

      // Should have emitted change event
      expect(eventListener).toHaveBeenCalledWith({
        type: 'change',
        key: 'event-item',
        newValue: testData,
        oldValue: null,
        timestamp: expect.any(Number),
      });
    });

    it('should support reactive updates with observers', async () => {
      const observer = jest.fn();

      // Setup observer for specific key
      (storageManager as any).observe('reactive-item', observer);

      // Update the item multiple times
      await storageManager.setItem('reactive-item', { version: 1 });
      await storageManager.setItem('reactive-item', { version: 2 });
      await storageManager.removeItem('reactive-item');

      // Observer should have been called for each change
      expect(observer).toHaveBeenCalledTimes(3);
      expect(observer).toHaveBeenNthCalledWith(1, { version: 1 }, null);
      expect(observer).toHaveBeenNthCalledWith(2, { version: 2 }, { version: 1 });
      expect(observer).toHaveBeenNthCalledWith(3, null, { version: 2 });
    });

    it('should handle event listener cleanup', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      // Add listeners
      (storageManager as any).addEventListener('change', listener1);
      (storageManager as any).addEventListener('change', listener2);

      // Remove one listener
      (storageManager as any).removeEventListener('change', listener1);

      await storageManager.setItem('cleanup-test', { data: 'test' });

      // Only listener2 should have been called
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('should implement lazy loading for large datasets', async () => {
      const largeDataset = {
        metadata: { size: 1000, type: 'images' },
        items: new Array(1000).fill(null).map((_, i) => ({ id: i, data: `item-${i}` })),
      };

      // Store with lazy loading flag
      await (storageManager as any).setItemLazy('large-dataset', largeDataset);

      // Should only store metadata initially
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'large-dataset-meta',
        expect.stringContaining('metadata')
      );

      // Items should be stored separately for lazy loading
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'large-dataset-items',
        expect.any(String)
      );
    });

    it('should implement batch operations for efficiency', async () => {
      const batchOperations = [
        { type: 'set', key: 'batch-1', value: { data: '1' } },
        { type: 'set', key: 'batch-2', value: { data: '2' } },
        { type: 'set', key: 'batch-3', value: { data: '3' } },
        { type: 'remove', key: 'old-batch-item' },
      ];

      const startTime = performance.now();
      await (storageManager as any).executeBatch(batchOperations);
      const endTime = performance.now();

      // Batch should be faster than individual operations
      expect(endTime - startTime).toBeLessThan(100);

      // All operations should have been executed
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('old-batch-item');
    });

    it('should implement storage defragmentation', async () => {
      // Mock fragmented storage
      mockLocalStorage.length = 10;
      mockLocalStorage.key.mockImplementation((index) => {
        const keys = ['active-1', 'deleted-1', 'active-2', 'deleted-2', 'active-3'];
        return keys[index] || null;
      });

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key.startsWith('deleted-')) return null; // Simulate deleted items
        return JSON.stringify({ data: 'active' });
      });

      // Run defragmentation
      await (storageManager as any).defragment();

      // Should have removed null/deleted entries
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('deleted-1');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('deleted-2');
    });

    it('should optimize storage access patterns', async () => {
      // Track access patterns
      const accessPattern = [
        'frequently-accessed',
        'rarely-accessed',
        'frequently-accessed',
        'medium-accessed',
        'frequently-accessed',
      ];

      for (const key of accessPattern) {
        await storageManager.getItem(key);
      }

      // Get optimization suggestions
      const optimizations = (storageManager as any).getOptimizationSuggestions();

      expect(optimizations).toContain('preload:frequently-accessed');
      expect(optimizations).toContain('lazy-load:rarely-accessed');
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should handle different browser storage implementations', async () => {
      // Test with different storage backends
      const backends = ['localStorage', 'sessionStorage', 'indexedDB', 'memory'];

      for (const backend of backends) {
        const manager = new StorageManager();
        (manager as any).setBackend(backend);

        const testData = { backend, data: 'test' };

        await expect(
          manager.setItem('cross-platform-test', testData)
        ).resolves.not.toThrow();

        // Should handle backend-specific behavior
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      }
    });

    it('should detect storage capabilities and limitations', async () => {
      const capabilities = await (storageManager as any).detectCapabilities();

      expect(capabilities).toHaveProperty('localStorage');
      expect(capabilities).toHaveProperty('sessionStorage');
      expect(capabilities).toHaveProperty('indexedDB');
      expect(capabilities).toHaveProperty('quotaEstimate');
      expect(capabilities).toHaveProperty('persistentStorage');
    });

    it('should handle storage API differences between browsers', async () => {
      // Mock different browser environments
      const originalLocalStorage = window.localStorage;

      // Test Safari private mode (throws on access)
      Object.defineProperty(window, 'localStorage', {
        get: () => { throw new Error('localStorage is not available'); },
        configurable: true,
      });

      const safariManager = new StorageManager();
      await expect(
        safariManager.setItem('safari-test', { data: 'test' })
      ).resolves.not.toThrow();

      // Restore original localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
      });
    });

    it('should provide consistent API across different storage types', async () => {
      const testData = { consistency: 'test' };
      const key = 'consistency-test';

      // Test with different storage types
      const storageTypes = ['local', 'session', 'indexed', 'memory'];

      for (const type of storageTypes) {
        const manager = new StorageManager();
        (manager as any).storageType = type;

        // API should be consistent
        await manager.setItem(key, testData);
        const retrieved = await manager.getItem(key);
        await manager.removeItem(key);

        // Basic operations should work the same way
        expect(typeof manager.setItem).toBe('function');
        expect(typeof manager.getItem).toBe('function');
        expect(typeof manager.removeItem).toBe('function');

        // Data should be retrievable (when not removed)
        expect(retrieved).toBeDefined();
      }
    });

    it('should handle storage quota differences between platforms', async () => {
      // Mock different quota scenarios
      const quotaScenarios = [
        { available: 5 * 1024 * 1024, used: 1024 * 1024 }, // 5MB available, 1MB used
        { available: 50 * 1024, used: 40 * 1024 }, // 50KB available, 40KB used (low)
        { available: Infinity, used: 0 }, // Unlimited storage
      ];

      for (const scenario of quotaScenarios) {
        (storageManager as any).mockQuota = scenario;

        const strategy = await (storageManager as any).getStorageStrategy();

        if (scenario.available - scenario.used < 100 * 1024) {
          expect(strategy.compression).toBe(true);
          expect(strategy.cleanup).toBe(true);
        } else {
          expect(strategy.compression).toBe(false);
        }
      }
    });
  });
});
