/**
 * Tests for the enhanced serialization service
 * @jest-environment node
 */

import { SerializationService } from '../services/serialization.service';
import { TemplateService } from '../services/template.service';
import { Sequence, SequenceExport } from '../types/sequencer.types';

// Mock crypto API for testing
const mockCrypto = {
  subtle: {
    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  },
};

// Mock CompressionStream for testing
const mockCompressionStream = jest.fn().mockImplementation(() => ({
  writable: {
    getWriter: () => ({
      write: jest.fn(),
      close: jest.fn(),
    }),
  },
  readable: {
    getReader: () => ({
      read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
    }),
  },
}));

// Mock DecompressionStream for testing
const mockDecompressionStream = jest.fn().mockImplementation(() => ({
  writable: {
    getWriter: () => ({
      write: jest.fn(),
      close: jest.fn(),
    }),
  },
  readable: {
    getReader: () => ({
      read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
    }),
  },
}));

// Setup global mocks
beforeAll(() => {
  let performanceCounter = 0;
  global.performance = {
    now: jest.fn(() => {
      performanceCounter += 1;
      return performanceCounter;
    }),
  } as any;

  global.crypto = mockCrypto as any;
  global.CompressionStream = mockCompressionStream as any;
  global.DecompressionStream = mockDecompressionStream as any;
  global.TextEncoder = jest.fn().mockImplementation(() => ({
    encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
  }));
  global.TextDecoder = jest.fn().mockImplementation(() => ({
    decode: jest.fn().mockReturnValue('decoded text'),
  }));
  global.btoa = jest.fn().mockReturnValue('base64string');
  global.atob = jest.fn().mockReturnValue('decoded string');
});

describe('SerializationService', () => {
  let testSequence: Sequence;

  beforeEach(() => {
    testSequence = TemplateService.createSampleSequence();
    jest.clearAllMocks();
  });

  describe('Basic Serialization', () => {
    test('serializes simple data successfully', async () => {
      const testData = { test: 'data', number: 42 };
      
      const result = await SerializationService.serialize(testData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.version).toBe('1.2.0');
      expect(result.data?.format).toBe('json');
      expect(result.performance).toBeDefined();
      expect(result.performance?.serializationTime).toBeGreaterThan(0);
    });

    test('handles serialization errors gracefully', async () => {
      // Create circular reference to cause JSON.stringify to fail
      const circularData: any = { test: 'data' };
      circularData.circular = circularData;
      
      const result = await SerializationService.serialize(circularData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    test('includes metadata when requested', async () => {
      const testData = { test: 'data' };
      
      const result = await SerializationService.serialize(testData, {
        includeMetadata: true,
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.metadata?.serializationTime).toBeGreaterThan(0);
    });
  });

  describe('Compression', () => {
    test('applies compression for large data', async () => {
      // Create large data object
      const largeData = {
        sequences: Array(1000).fill(testSequence),
        metadata: 'x'.repeat(10000),
      };
      
      const result = await SerializationService.serialize(largeData, {
        compress: true,
      });
      
      expect(result.success).toBe(true);
      expect(result.performance?.compressionTime).toBeDefined();
    });

    test('skips compression for small data', async () => {
      const smallData = { test: 'small' };
      
      const result = await SerializationService.serialize(smallData, {
        compress: true,
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.compressed).toBe(false);
    });
  });

  describe('Deserialization', () => {
    test('deserializes valid data successfully', async () => {
      const testData = { test: 'data', number: 42 };
      
      // First serialize
      const serializeResult = await SerializationService.serialize(testData);
      expect(serializeResult.success).toBe(true);
      
      // Then deserialize
      const deserializeResult = await SerializationService.deserialize(serializeResult.data!);
      
      expect(deserializeResult.success).toBe(true);
      expect(deserializeResult.data).toEqual(testData);
      expect(deserializeResult.performance).toBeDefined();
    });

    test('handles legacy string format', async () => {
      const legacyData = JSON.stringify({ test: 'legacy' });

      const result = await SerializationService.deserialize(legacyData);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ test: 'legacy' });
    });

    test('handles invalid data gracefully', async () => {
      const invalidData = {
        version: '1.0.0',
        format: 'json' as const,
        compressed: false,
        timestamp: new Date(),
        size: 100,
        data: 'invalid json{',
      };
      
      const result = await SerializationService.deserialize(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Sequence Serialization', () => {
    test('serializes sequences with metadata', async () => {
      const sequences = [testSequence];
      
      const result = await SerializationService.serializeSequences(sequences);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      // Deserialize and check structure
      const deserializeResult = await SerializationService.deserializeSequences(result.data!);
      expect(deserializeResult.success).toBe(true);
      expect(deserializeResult.data?.sequences).toHaveLength(1);
      expect(deserializeResult.data?.metadata?.count).toBe(1);
    });

    test('calculates total duration correctly', async () => {
      const sequences = [testSequence, testSequence]; // Two identical sequences
      
      const result = await SerializationService.serializeSequences(sequences);
      
      expect(result.success).toBe(true);
      
      const deserializeResult = await SerializationService.deserializeSequences(result.data!);
      expect(deserializeResult.success).toBe(true);
      expect(deserializeResult.data?.metadata?.totalDuration).toBe(
        testSequence.estimatedDuration * 2
      );
    });
  });

  describe('Validation', () => {
    test('validates serialized data structure', () => {
      const validData = {
        version: '1.2.0',
        format: 'json',
        compressed: false,
        timestamp: new Date(),
        size: 100,
        data: '{"test": "data"}',
      };
      
      const result = SerializationService.validateSerializedData(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects missing required fields', () => {
      const invalidData = {
        format: 'json',
        compressed: false,
        // Missing version, timestamp, size, data
      };
      
      const result = SerializationService.validateSerializedData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Missing version information');
      expect(result.errors).toContain('Missing timestamp');
      expect(result.errors).toContain('Missing data payload');
    });

    test('warns about compressed data without checksum', () => {
      const dataWithoutChecksum = {
        version: '1.2.0',
        format: 'json',
        compressed: true, // Compressed but no checksum
        timestamp: new Date(),
        size: 100,
        data: '{"test": "data"}',
      };
      
      const result = SerializationService.validateSerializedData(dataWithoutChecksum);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Compressed data missing checksum');
    });
  });

  describe('Performance Optimization', () => {
    test('handles chunked serialization', async () => {
      const largeDataArray = Array(250).fill({ test: 'data' }); // 250 items
      
      const results = await SerializationService.serializeInChunks(
        largeDataArray,
        100 // 100 items per chunk
      );
      
      expect(results).toHaveLength(3); // 3 chunks: 100, 100, 50
      expect(results.every(r => r.success)).toBe(true);
    });

    test('deserializes chunks correctly', async () => {
      const testData = [
        [{ test: 'chunk1' }],
        [{ test: 'chunk2' }],
        [{ test: 'chunk3' }],
      ];
      
      // Serialize each chunk
      const serializedChunks = await Promise.all(
        testData.map(chunk => SerializationService.serialize(chunk))
      );
      
      expect(serializedChunks.every(r => r.success)).toBe(true);
      
      // Deserialize all chunks
      const result = await SerializationService.deserializeChunks(
        serializedChunks.map(r => r.data!)
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
    });

    test('handles chunk deserialization errors gracefully', async () => {
      const validChunk = await SerializationService.serialize([{ test: 'valid' }]);
      const invalidChunk = {
        version: '1.0.0',
        format: 'json' as const,
        compressed: false,
        timestamp: new Date(),
        size: 100,
        data: 'invalid json{',
      };
      
      const result = await SerializationService.deserializeChunks([
        validChunk.data!,
        invalidChunk,
      ]);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Only valid chunk
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('File Operations', () => {
    test('creates download link for file save', async () => {
      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      const mockCreateElement = jest.fn().mockReturnValue(mockLink);
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      const mockCreateObjectURL = jest.fn().mockReturnValue('blob:url');
      const mockRevokeObjectURL = jest.fn();

      // Mock Blob constructor
      global.Blob = jest.fn().mockImplementation((content, options) => ({
        content,
        options,
      })) as any;

      // Setup DOM and URL mocks before the test
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });

      Object.defineProperty(global, 'document', {
        value: {
          createElement: mockCreateElement,
          body: {
            appendChild: mockAppendChild,
            removeChild: mockRemoveChild,
          },
        },
        writable: true,
      });

      Object.defineProperty(global, 'URL', {
        value: {
          createObjectURL: mockCreateObjectURL,
          revokeObjectURL: mockRevokeObjectURL,
        },
        writable: true,
      });

      const testData = {
        version: '1.2.0',
        format: 'json' as const,
        compressed: false,
        timestamp: new Date(),
        size: 100,
        data: '{"test": "data"}',
      };

      await SerializationService.saveToFile(testData, 'test.json');

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test.json');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    test('loads file and deserializes content', async () => {
      const testData = { test: 'file content' };
      const serializedData = {
        version: '1.2.0',
        format: 'json' as const,
        compressed: false,
        timestamp: new Date(),
        size: 100,
        data: JSON.stringify(testData),
      };
      
      const mockFile = {
        text: jest.fn().mockResolvedValue(JSON.stringify(serializedData)),
      } as any;
      
      const result = await SerializationService.loadFromFile(mockFile);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
      expect(mockFile.text).toHaveBeenCalled();
    });

    test('handles file loading errors', async () => {
      const mockFile = {
        text: jest.fn().mockRejectedValue(new Error('File read error')),
      } as any;
      
      const result = await SerializationService.loadFromFile(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
