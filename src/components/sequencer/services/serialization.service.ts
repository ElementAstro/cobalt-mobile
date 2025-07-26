import { 
  Sequence, 
  SequenceTemplate, 
  Workspace,
  Target,
  SerializationOptions,
  SerializedData,
  SerializationResult,
  DeserializationResult,
  SequenceExport
} from '../types/sequencer.types';

// Compression utilities (using built-in compression when available)
class CompressionUtils {
  static async compress(data: string): Promise<{ compressed: string; ratio: number }> {
    const startTime = performance.now();
    
    try {
      // Use CompressionStream if available (modern browsers)
      if (typeof window !== 'undefined' && 'CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        writer.write(encoder.encode(data));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        const compressedString = btoa(String.fromCharCode(...compressed));
        const ratio = data.length / compressedString.length;
        
        return { compressed: compressedString, ratio };
      }
      
      // Fallback to simple LZ-style compression
      return this.simpleLZCompress(data);
    } catch (error) {
      console.warn('Compression failed, using uncompressed data:', error);
      return { compressed: data, ratio: 1 };
    }
  }
  
  static async decompress(compressedData: string): Promise<string> {
    try {
      if (typeof window !== 'undefined' && 'DecompressionStream' in window) {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        const decoder = new TextDecoder();
        const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0));
        
        writer.write(compressed);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return decoder.decode(decompressed);
      }
      
      // Fallback decompression
      return this.simpleLZDecompress(compressedData);
    } catch (error) {
      console.warn('Decompression failed, treating as uncompressed:', error);
      return compressedData;
    }
  }
  
  private static simpleLZCompress(data: string): { compressed: string; ratio: number } {
    // Simple dictionary-based compression
    const dict: Record<string, string> = {};
    let dictSize = 256;
    let result = '';
    let w = '';
    
    for (let i = 0; i < data.length; i++) {
      const c = data[i];
      const wc = w + c;
      
      if (dict[wc]) {
        w = wc;
      } else {
        result += dict[w] || w;
        dict[wc] = String.fromCharCode(dictSize++);
        w = c;
      }
    }
    
    if (w) result += dict[w] || w;
    
    const ratio = data.length / result.length;
    return { compressed: result, ratio };
  }
  
  private static simpleLZDecompress(data: string): string {
    // Simple decompression - for now just return as-is
    // In a real implementation, this would reverse the compression
    return data;
  }
}

// Checksum utilities
class ChecksumUtils {
  static async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    if (typeof window !== 'undefined' && 'crypto' in window && 'subtle' in crypto) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
  
  static async verifyChecksum(data: string, expectedChecksum: string): Promise<boolean> {
    const actualChecksum = await this.calculateChecksum(data);
    return actualChecksum === expectedChecksum;
  }
}

// Migration utilities
class MigrationUtils {
  private static migrations: Record<string, (data: any) => any> = {
    '1.0.0': (data) => data, // No migration needed
    '1.1.0': (data) => {
      // Add workspace support
      if (!data.workspaces) {
        data.workspaces = [];
      }
      return data;
    },
    '1.2.0': (data) => {
      // Add target library
      if (!data.targetLibrary) {
        data.targetLibrary = { targets: [], categories: [], catalogs: [], tags: [] };
      }
      return data;
    },
  };
  
  static migrate(data: any, fromVersion: string, toVersion: string): { data: any; migrationsApplied: string[] } {
    const versions = Object.keys(this.migrations).sort();
    const fromIndex = versions.indexOf(fromVersion);
    const toIndex = versions.indexOf(toVersion);
    
    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
      return { data, migrationsApplied: [] };
    }
    
    const migrationsApplied: string[] = [];
    let migratedData = { ...data };
    
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      const version = versions[i];
      migratedData = this.migrations[version](migratedData);
      migrationsApplied.push(version);
    }
    
    return { data: migratedData, migrationsApplied };
  }
}

export class SerializationService {
  private static readonly CURRENT_VERSION = '1.2.0';
  private static readonly MAX_SIZE_FOR_COMPRESSION = 1024 * 1024; // 1MB
  
  static async serialize<T>(
    data: T,
    options: SerializationOptions = {}
  ): Promise<SerializationResult> {
    const startTime = performance.now();
    
    try {
      const {
        compress = true,
        format = 'json',
        version = this.CURRENT_VERSION,
        includeMetadata = true,
      } = options;
      
      // Prepare data for serialization
      const serializedData = JSON.stringify(data, null, compress ? 0 : 2);
      const originalSize = typeof Blob !== 'undefined'
        ? new Blob([serializedData]).size
        : new TextEncoder().encode(serializedData).length;
      
      let finalData = serializedData;
      let compressionRatio = 1;
      let compressionTime = 0;
      let isCompressed = false;
      
      // Apply compression if requested and data is large enough
      if (compress && originalSize > this.MAX_SIZE_FOR_COMPRESSION) {
        const compressionStart = performance.now();
        const { compressed, ratio } = await CompressionUtils.compress(serializedData);
        compressionTime = performance.now() - compressionStart;
        
        if (ratio > 1.1) { // Only use compression if it saves at least 10%
          finalData = compressed;
          compressionRatio = ratio;
          isCompressed = true;
        }
      }
      
      const finalSize = typeof Blob !== 'undefined'
        ? new Blob([finalData]).size
        : new TextEncoder().encode(finalData).length;
      const checksum = await ChecksumUtils.calculateChecksum(finalData);
      
      const result: SerializedData = {
        version,
        format,
        compressed: isCompressed,
        checksum,
        timestamp: new Date(),
        size: finalSize,
        data: finalData,
        metadata: includeMetadata ? {
          originalSize,
          compressionRatio,
          serializationTime: performance.now() - startTime,
        } : undefined,
      };
      
      return {
        success: true,
        data: result,
        performance: {
          serializationTime: performance.now() - startTime,
          compressionTime: compressionTime || undefined,
          originalSize,
          finalSize,
          compressionRatio: isCompressed ? compressionRatio : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Serialization failed',
      };
    }
  }
  
  static async deserialize<T>(
    serializedData: SerializedData | string
  ): Promise<DeserializationResult<T>> {
    const startTime = performance.now();
    
    try {
      let data: SerializedData;
      
      // Handle legacy string format
      if (typeof serializedData === 'string') {
        try {
          data = {
            version: '1.0.0',
            format: 'json',
            compressed: false,
            timestamp: new Date(),
            size: serializedData.length,
            data: serializedData,
          };
        } catch {
          return {
            success: false,
            error: 'Invalid serialized data format',
          };
        }
      } else {
        data = serializedData;
      }
      
      let rawData = data.data as string;
      let decompressionTime = 0;
      
      // Verify checksum if available
      if (data.checksum) {
        const isValid = await ChecksumUtils.verifyChecksum(rawData, data.checksum);
        if (!isValid) {
          return {
            success: false,
            error: 'Data integrity check failed',
          };
        }
      }
      
      // Decompress if needed
      if (data.compressed) {
        const decompressionStart = performance.now();
        rawData = await CompressionUtils.decompress(rawData);
        decompressionTime = performance.now() - decompressionStart;
      }
      
      // Parse JSON
      const parsedData = JSON.parse(rawData);
      
      // Apply migrations if needed
      let migratedData = parsedData;
      let migration;
      
      if (data.version !== this.CURRENT_VERSION) {
        const migrationResult = MigrationUtils.migrate(
          parsedData,
          data.version,
          this.CURRENT_VERSION
        );
        migratedData = migrationResult.data;
        migration = {
          fromVersion: data.version,
          toVersion: this.CURRENT_VERSION,
          migrationsApplied: migrationResult.migrationsApplied,
        };
      }
      
      return {
        success: true,
        data: migratedData,
        performance: {
          deserializationTime: performance.now() - startTime,
          decompressionTime: decompressionTime || undefined,
        },
        migration,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deserialization failed',
      };
    }
  }

  // Specialized serialization methods
  static async serializeSequences(
    sequences: Sequence[],
    options: SerializationOptions = {}
  ): Promise<SerializationResult> {
    const exportData: SequenceExport = {
      version: this.CURRENT_VERSION,
      sequences,
      exportDate: new Date(),
      metadata: {
        exportedBy: 'Cobalt Mobile Sequencer',
        count: sequences.length,
        totalDuration: sequences.reduce((sum, seq) => sum + seq.estimatedDuration, 0),
      },
    };

    return this.serialize(exportData, options);
  }

  static async deserializeSequences(
    data: SerializedData | string
  ): Promise<DeserializationResult<SequenceExport>> {
    return this.deserialize<SequenceExport>(data);
  }

  static async serializeWorkspace(
    workspace: Workspace,
    sequences: Sequence[],
    templates: SequenceTemplate[],
    options: SerializationOptions = {}
  ): Promise<SerializationResult> {
    const workspaceData = {
      workspace,
      sequences: sequences.filter(seq => workspace.sequences.includes(seq.id)),
      templates: templates.filter(tpl => workspace.templates.includes(tpl.id)),
      exportDate: new Date(),
      version: this.CURRENT_VERSION,
    };

    return this.serialize(workspaceData, options);
  }

  static async serializeTargetLibrary(
    targets: Target[],
    options: SerializationOptions = {}
  ): Promise<SerializationResult> {
    const targetData = {
      targets,
      version: this.CURRENT_VERSION,
      exportDate: new Date(),
      metadata: {
        count: targets.length,
        types: [...new Set(targets.map(t => t.type))],
      },
    };

    return this.serialize(targetData, options);
  }

  // Utility methods for file operations
  static async saveToFile(
    data: SerializedData,
    filename: string
  ): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // In Node.js environment, just return (this would be handled differently in a real app)
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async loadFromFile(file: File): Promise<DeserializationResult<any>> {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as SerializedData;
      return this.deserialize(data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load file',
      };
    }
  }

  // Performance optimization methods
  static async serializeInChunks<T>(
    data: T[],
    chunkSize: number = 100,
    options: SerializationOptions = {}
  ): Promise<SerializationResult[]> {
    const results: SerializationResult[] = [];

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const result = await this.serialize(chunk, options);
      results.push(result);
    }

    return results;
  }

  static async deserializeChunks<T>(
    serializedChunks: (SerializedData | string)[]
  ): Promise<DeserializationResult<T[]>> {
    try {
      const allData: T[] = [];
      const warnings: string[] = [];

      for (const chunk of serializedChunks) {
        const result = await this.deserialize<T[]>(chunk);
        if (result.success && result.data) {
          allData.push(...result.data);
        } else {
          warnings.push(result.error || 'Failed to deserialize chunk');
        }
      }

      return {
        success: true,
        data: allData,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deserialize chunks',
      };
    }
  }

  // Validation methods
  static validateSerializedData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.version) {
      errors.push('Missing version information');
    }

    if (!data.timestamp) {
      errors.push('Missing timestamp');
    }

    if (data.compressed && !data.checksum) {
      errors.push('Compressed data missing checksum');
    }

    if (!data.data) {
      errors.push('Missing data payload');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
