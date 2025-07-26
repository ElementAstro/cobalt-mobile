import { createNotification } from '@/lib/stores/notification-store';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Request/Response Types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: any;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  offline?: boolean;
}

// Cache Management
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Request Queue for Offline Support
class RequestQueue {
  private queue: Array<{
    id: string;
    url: string;
    config: RequestConfig;
    timestamp: number;
    retries: number;
  }> = [];

  add(url: string, config: RequestConfig): string {
    const id = Math.random().toString(36).substr(2, 9);
    this.queue.push({
      id,
      url,
      config,
      timestamp: Date.now(),
      retries: 0,
    });
    return id;
  }

  remove(id: string): void {
    this.queue = this.queue.filter(item => item.id !== id);
  }

  getAll(): typeof this.queue {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }
}

// Main API Client Class
class ApiClient {
  private cache = new ApiCache();
  private requestQueue = new RequestQueue();
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private authToken: string | null = null;

  constructor() {
    // Set up online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processOfflineQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      // Cleanup cache periodically
      setInterval(() => this.cache.cleanup(), 5 * 60 * 1000); // Every 5 minutes
    }
  }

  // Set authentication token
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  // Get authentication headers
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Create cache key
  private createCacheKey(url: string, config: RequestConfig): string {
    const method = config.method || 'GET';
    const body = config.body ? JSON.stringify(config.body) : '';
    return `${method}:${url}:${body}`;
  }

  // Sleep utility for retries
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Process offline request queue
  private async processOfflineQueue(): Promise<void> {
    const queuedRequests = this.requestQueue.getAll();
    
    for (const request of queuedRequests) {
      try {
        await this.request(request.url, request.config);
        this.requestQueue.remove(request.id);
        
        createNotification.success(
          'Sync Complete',
          'Offline requests have been synchronized',
          { category: 'system' }
        );
      } catch (error) {
        console.error('Failed to process queued request:', error);
        
        // Remove request if it's too old (24 hours)
        if (Date.now() - request.timestamp > 24 * 60 * 60 * 1000) {
          this.requestQueue.remove(request.id);
        }
      }
    }
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_TIMEOUT,
      retries = MAX_RETRIES,
      cache = method === 'GET',
      offline = true,
    } = config;

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const cacheKey = this.createCacheKey(url, config);

    // Check cache for GET requests
    if (cache && method === 'GET') {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Handle offline scenarios
    if (!this.isOnline) {
      if (offline && method !== 'GET') {
        // Queue non-GET requests for later
        this.requestQueue.add(url, config);
        
        createNotification.info(
          'Request Queued',
          'Request will be sent when connection is restored',
          { category: 'system' }
        );

        return {
          success: true,
          data: null as T,
          message: 'Request queued for offline processing',
        };
      } else {
        throw new ApiError('No internet connection', 'OFFLINE', 0);
      }
    }

    // Prepare request
    const requestHeaders = {
      ...this.getAuthHeaders(),
      ...headers,
    };

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout),
    };

    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body);
    }

    // Retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestConfig);
        
        // Handle different response types
        let responseData: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // Handle HTTP errors
        if (!response.ok) {
          const error = new ApiError(
            responseData.message || `HTTP ${response.status}`,
            responseData.code || 'HTTP_ERROR',
            response.status,
            responseData
          );

          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }

          // Retry server errors (5xx)
          if (attempt < retries) {
            await this.sleep(RETRY_DELAY * Math.pow(2, attempt));
            continue;
          }

          throw error;
        }

        // Ensure response has expected structure
        const apiResponse: ApiResponse<T> = {
          success: true,
          data: responseData.data || responseData,
          message: responseData.message,
          errors: responseData.errors,
          meta: responseData.meta,
        };

        // Cache successful GET requests
        if (cache && method === 'GET') {
          this.cache.set(cacheKey, apiResponse);
        }

        return apiResponse;

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort or network errors on last attempt
        if (attempt === retries) {
          break;
        }

        // Wait before retry
        await this.sleep(RETRY_DELAY * Math.pow(2, attempt));
      }
    }

    // Handle final error
    if (lastError) {
      if (lastError.name === 'AbortError') {
        throw new ApiError('Request timeout', 'TIMEOUT', 408);
      }
      
      if (lastError instanceof ApiError) {
        throw lastError;
      }

      throw new ApiError(
        lastError.message || 'Network error',
        'NETWORK_ERROR',
        0
      );
    }

    throw new ApiError('Unknown error', 'UNKNOWN', 0);
  }

  // Convenience methods
  async get<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T = any>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  deleteCacheKey(key: string): void {
    this.cache.delete(key);
  }

  // Queue management
  getQueuedRequests(): Array<any> {
    return this.requestQueue.getAll();
  }

  clearQueue(): void {
    this.requestQueue.clear();
  }
}

// Custom Error Class
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export utilities
export { ApiClient, ApiCache, RequestQueue };
