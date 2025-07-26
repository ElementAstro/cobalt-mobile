/**
 * @jest-environment jsdom
 */

import { apiClient, ApiClient, ApiCache, RequestQueue } from '../client';

// Mock fetch
global.fetch = jest.fn();

// Mock environment variable
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3001/api';

describe('ApiClient', () => {
  let client: ApiClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = apiClient; // Use the singleton instance
  });

  describe('Constructor', () => {
    it('should initialize client instance', () => {
      expect(client).toBeInstanceOf(ApiClient);
    });
  });

  describe('GET Requests', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: expect.any(AbortSignal),
      });
      expect(result).toEqual({
        success: true,
        data: mockResponse,
        message: undefined,
        errors: undefined,
        meta: undefined
      });
    });

    it('should handle GET request with custom timeout', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await client.get('/test', { timeout: 5000 });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'GET',
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should handle GET request with custom headers', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await client.get('/test', { 
        headers: { 'Authorization': 'Bearer token123' } 
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123',
        },
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('POST Requests', () => {
    it('should make POST request successfully', async () => {
      const mockResponse = { id: 1, created: true };
      const requestData = { name: 'test', value: 123 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await client.post('/test', requestData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: expect.any(AbortSignal),
      });
      expect(result).toEqual({
        success: true,
        data: mockResponse,
        message: undefined,
        errors: undefined,
        meta: undefined
      });
    });

    it('should handle POST request with custom config', async () => {
      const mockResponse = { success: true };
      const requestData = { name: 'test' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await client.post('/test', requestData, {
        timeout: 5000,
        headers: { 'X-Custom': 'value' }
      });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom': 'value',
        },
        body: JSON.stringify(requestData),
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('PUT Requests', () => {
    it('should make PUT request successfully', async () => {
      const mockResponse = { id: 1, updated: true };
      const requestData = { name: 'updated', value: 456 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await client.put('/test/1', requestData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/test/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: expect.any(AbortSignal),
      });
      expect(result).toEqual({
        success: true,
        data: mockResponse,
        message: undefined,
        errors: undefined,
        meta: undefined
      });
    });
  });

  describe('DELETE Requests', () => {
    it('should make DELETE request successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
        headers: new Headers(),
      } as Response);

      const result = await client.delete('/test/1');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/test/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: expect.any(AbortSignal),
      });
      expect(result).toEqual({ success: true, data: {} });
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error responses', async () => {
      const errorResponse = { message: 'Not found', code: 'NOT_FOUND' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => errorResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(client.get('/nonexistent')).rejects.toThrow('Not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AbortError')), 100)
        )
      );

      await expect(client.get('/test', { timeout: 50 })).rejects.toThrow();
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        redirected: false,
        type: 'basic',
        url: 'http://localhost/test',
        json: async () => { throw new Error('Invalid JSON'); },
        text: async () => 'Invalid response',
        headers: new Headers({ 'content-type': 'application/json' }),
        body: null,
        bodyUsed: false,
        clone: () => ({} as Response),
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
      } as Response);

      await expect(client.get('/test')).rejects.toThrow();
    });
  });

});
