/**
 * Optimized Image Processing Utilities
 * Handles large images efficiently with web workers and progressive loading
 */

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  progressive?: boolean;
  useWebWorker?: boolean;
}

export interface ImageAnalysisResult {
  width: number;
  height: number;
  size: number;
  format: string;
  quality: number;
  histogram?: number[];
  brightness?: number;
  contrast?: number;
  processingTime: number;
}

/**
 * Optimized image resizing using canvas with memory management
 */
export function resizeImage(
  imageData: ImageData | HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  options: ImageProcessingOptions = {}
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Use high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (imageData instanceof HTMLImageElement) {
        ctx.drawImage(imageData, 0, 0, targetWidth, targetHeight);
      } else {
        // Create temporary canvas for ImageData
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) throw new Error('Temp canvas context not available');
        
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        tempCtx.putImageData(imageData, 0, 0);
        
        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
      }

      const resizedImageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      
      // Clean up
      canvas.remove();
      
      resolve(resizedImageData);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Progressive image loading with size optimization
 */
export function loadImageProgressively(
  src: string,
  options: ImageProcessingOptions = {}
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const startTime = performance.now();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      console.log(`Image loaded in ${loadTime.toFixed(2)}ms`);
      
      // Auto-resize if image is too large
      if (options.maxWidth && img.width > options.maxWidth) {
        const ratio = options.maxWidth / img.width;
        img.width = options.maxWidth;
        img.height = img.height * ratio;
      }
      
      resolve(img);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    // Enable CORS if needed
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

/**
 * Fast image analysis using optimized algorithms
 */
export function analyzeImageFast(imageData: ImageData): ImageAnalysisResult {
  const startTime = performance.now();
  
  const { data, width, height } = imageData;
  const pixelCount = width * height;
  
  // Fast histogram calculation using typed arrays
  const histogram = new Uint32Array(256);
  let totalBrightness = 0;
  let minBrightness = 255;
  let maxBrightness = 0;
  
  // Process pixels in chunks for better performance
  const chunkSize = 1024;
  for (let i = 0; i < data.length; i += chunkSize * 4) {
    const endIndex = Math.min(i + chunkSize * 4, data.length);
    
    for (let j = i; j < endIndex; j += 4) {
      // Calculate luminance using fast approximation
      const brightness = Math.round(
        0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2]
      );
      
      histogram[brightness]++;
      totalBrightness += brightness;
      minBrightness = Math.min(minBrightness, brightness);
      maxBrightness = Math.max(maxBrightness, brightness);
    }
  }
  
  const avgBrightness = totalBrightness / pixelCount;
  const contrast = maxBrightness - minBrightness;
  
  const processingTime = performance.now() - startTime;
  
  return {
    width,
    height,
    size: data.length,
    format: 'imagedata',
    quality: Math.round((contrast / 255) * 100),
    histogram: Array.from(histogram),
    brightness: avgBrightness,
    contrast,
    processingTime
  };
}

/**
 * Memory-efficient image processing with cleanup
 */
export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    this.ctx = ctx;
  }
  
  async processImage(
    image: HTMLImageElement | ImageData,
    options: ImageProcessingOptions = {}
  ): Promise<ImageAnalysisResult> {
    const startTime = performance.now();
    
    try {
      // Determine optimal processing size
      const maxDimension = Math.max(
        options.maxWidth || 2048,
        options.maxHeight || 2048
      );
      
      let imageData: ImageData;
      
      if (image instanceof HTMLImageElement) {
        // Resize if too large
        const scale = Math.min(
          maxDimension / image.width,
          maxDimension / image.height,
          1
        );
        
        const targetWidth = Math.round(image.width * scale);
        const targetHeight = Math.round(image.height * scale);
        
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
        
        this.ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        imageData = this.ctx.getImageData(0, 0, targetWidth, targetHeight);
      } else {
        imageData = image;
      }
      
      // Perform fast analysis
      const result = analyzeImageFast(imageData);
      
      // Add processing metadata
      result.processingTime = performance.now() - startTime;
      
      return result;
    } catch (error) {
      throw new Error(`Image processing failed: ${error}`);
    }
  }
  
  dispose(): void {
    this.canvas.remove();
  }
}

/**
 * Web Worker wrapper for heavy image processing
 */
export function processImageInWorker(
  imageData: ImageData,
  options: ImageProcessingOptions = {}
): Promise<ImageAnalysisResult> {
  return new Promise((resolve, reject) => {
    // Check if Web Workers are supported
    if (typeof Worker === 'undefined') {
      // Fallback to main thread
      resolve(analyzeImageFast(imageData));
      return;
    }
    
    try {
      // Create inline worker for image processing
      const workerCode = `
        self.onmessage = function(e) {
          const { imageData, options } = e.data;
          
          // Fast analysis implementation
          const startTime = performance.now();
          const { data, width, height } = imageData;
          const pixelCount = width * height;
          
          const histogram = new Uint32Array(256);
          let totalBrightness = 0;
          let minBrightness = 255;
          let maxBrightness = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const brightness = Math.round(
              0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
            );
            
            histogram[brightness]++;
            totalBrightness += brightness;
            minBrightness = Math.min(minBrightness, brightness);
            maxBrightness = Math.max(maxBrightness, brightness);
          }
          
          const result = {
            width,
            height,
            size: data.length,
            format: 'imagedata',
            quality: Math.round(((maxBrightness - minBrightness) / 255) * 100),
            histogram: Array.from(histogram),
            brightness: totalBrightness / pixelCount,
            contrast: maxBrightness - minBrightness,
            processingTime: performance.now() - startTime
          };
          
          self.postMessage(result);
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      worker.onmessage = (e) => {
        worker.terminate();
        URL.revokeObjectURL(blob.toString());
        resolve(e.data);
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        URL.revokeObjectURL(blob.toString());
        reject(error);
      };
      
      worker.postMessage({ imageData, options });
      
    } catch (error) {
      // Fallback to main thread
      resolve(analyzeImageFast(imageData));
    }
  });
}

/**
 * Utility to check if image processing should use optimization
 */
export function shouldOptimizeImage(width: number, height: number): boolean {
  const pixelCount = width * height;
  const threshold = 1920 * 1080; // 2MP threshold
  return pixelCount > threshold;
}
