export interface ImageMetrics {
  hfr: number; // Half Flux Radius in pixels
  fwhm: number; // Full Width Half Maximum in pixels
  snr: number; // Signal to Noise Ratio
  backgroundLevel: number; // Background ADU level
  peakValue: number; // Peak pixel value
  starCount: number; // Number of detected stars
  eccentricity: number; // Star roundness (0 = perfect circle, 1 = line)
  noise: number; // Image noise level
  contrast: number; // Image contrast
  saturation: number; // Percentage of saturated pixels
  focusScore: number; // Overall focus quality score (0-100)
  timestamp: Date;
}

export interface StarData {
  x: number;
  y: number;
  flux: number;
  hfr: number;
  fwhm: number;
  snr: number;
  peak: number;
  background: number;
  eccentricity: number;
  saturated: boolean;
}

export interface ImageAnalysisResult {
  metrics: ImageMetrics;
  stars: StarData[];
  histogram: {
    red: number[];
    green: number[];
    blue: number[];
    luminance: number[];
  };
  focusAnalysis: {
    isInFocus: boolean;
    focusDirection: 'in' | 'out' | 'optimal';
    confidence: number;
    recommendation: string;
  };
  qualityAssessment: {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    score: number; // 0-100
    issues: string[];
    recommendations: string[];
  };
}

export interface ImageProcessingOptions {
  starDetectionThreshold: number; // Sigma threshold for star detection
  backgroundSigma: number; // Sigma for background calculation
  minStarSize: number; // Minimum star size in pixels
  maxStarSize: number; // Maximum star size in pixels
  saturationThreshold: number; // ADU threshold for saturation
  enableSubPixelAccuracy: boolean;
  filterNoise: boolean;
}

class ImageAnalyzer {
  private defaultOptions: ImageProcessingOptions = {
    starDetectionThreshold: 3.0,
    backgroundSigma: 2.0,
    minStarSize: 2,
    maxStarSize: 50,
    saturationThreshold: 60000, // 16-bit ADU
    enableSubPixelAccuracy: true,
    filterNoise: true
  };

  async analyzeImage(
    imageData: ImageData | ArrayBuffer | Uint16Array,
    options: Partial<ImageProcessingOptions> = {}
  ): Promise<ImageAnalysisResult> {
    const opts = { ...this.defaultOptions, ...options };
    
    // Convert image data to standardized format
    const processedData = this.preprocessImage(imageData);
    
    // Detect stars
    const stars = this.detectStars(processedData, opts);
    
    // Calculate image metrics
    const metrics = this.calculateMetrics(processedData, stars, opts);
    
    // Generate histogram
    const histogram = this.generateHistogram(processedData);
    
    // Analyze focus
    const focusAnalysis = this.analyzeFocus(stars, metrics);
    
    // Assess overall quality
    const qualityAssessment = this.assessQuality(metrics, stars);
    
    return {
      metrics,
      stars,
      histogram,
      focusAnalysis,
      qualityAssessment
    };
  }

  private preprocessImage(imageData: ImageData | ArrayBuffer | Uint16Array): Uint16Array {
    // In a real implementation, this would handle different image formats
    // For simulation, we'll generate realistic image data
    if (imageData instanceof Uint16Array) {
      return imageData;
    }
    
    // Simulate a 1024x1024 16-bit image with stars and noise
    const width = 1024;
    const height = 1024;
    const data = new Uint16Array(width * height);
    
    // Add background noise
    const backgroundLevel = 1000 + Math.random() * 500;
    const noiseLevel = 50 + Math.random() * 30;
    
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.max(0, Math.min(65535, 
        backgroundLevel + (Math.random() - 0.5) * noiseLevel * 2
      ));
    }
    
    // Add simulated stars
    const starCount = 50 + Math.random() * 100;
    for (let s = 0; s < starCount; s++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const brightness = 5000 + Math.random() * 20000;
      const size = 2 + Math.random() * 8;
      
      this.addSimulatedStar(data, width, height, x, y, brightness, size);
    }
    
    return data;
  }

  private addSimulatedStar(
    data: Uint16Array, 
    width: number, 
    height: number, 
    centerX: number, 
    centerY: number, 
    brightness: number, 
    size: number
  ): void {
    const radius = size * 2;
    const startX = Math.max(0, Math.floor(centerX - radius));
    const endX = Math.min(width - 1, Math.floor(centerX + radius));
    const startY = Math.max(0, Math.floor(centerY - radius));
    const endY = Math.min(height - 1, Math.floor(centerY + radius));
    
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= radius) {
          // Gaussian profile
          const intensity = brightness * Math.exp(-(distance * distance) / (2 * size * size));
          const index = y * width + x;
          data[index] = Math.min(65535, data[index] + intensity);
        }
      }
    }
  }

  private detectStars(data: Uint16Array, options: ImageProcessingOptions): StarData[] {
    // Simplified star detection algorithm
    // In a real implementation, this would use sophisticated algorithms like DAOFind
    const width = Math.sqrt(data.length); // Assuming square image
    const height = width;
    const stars: StarData[] = [];
    
    // Calculate background statistics
    const background = this.calculateBackground(data);
    const threshold = background.mean + options.starDetectionThreshold * background.sigma;
    
    // Simple peak detection
    for (let y = options.maxStarSize; y < height - options.maxStarSize; y++) {
      for (let x = options.maxStarSize; x < width - options.maxStarSize; x++) {
        const index = y * width + x;
        const value = data[index];
        
        if (value > threshold) {
          // Check if this is a local maximum
          let isLocalMax = true;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const neighborIndex = (y + dy) * width + (x + dx);
              if (data[neighborIndex] >= value) {
                isLocalMax = false;
                break;
              }
            }
            if (!isLocalMax) break;
          }
          
          if (isLocalMax) {
            const star = this.analyzeStarRegion(data, width, height, x, y, background);
            if (star && star.hfr >= options.minStarSize && star.hfr <= options.maxStarSize) {
              stars.push(star);
            }
          }
        }
      }
    }
    
    return stars.slice(0, 200); // Limit to prevent performance issues
  }

  private calculateBackground(data: Uint16Array): { mean: number; sigma: number; median: number } {
    // Use sigma-clipped statistics for robust background estimation
    const sorted = Array.from(data).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Calculate MAD (Median Absolute Deviation)
    const deviations = sorted.map(val => Math.abs(val - median));
    deviations.sort((a, b) => a - b);
    const mad = deviations[Math.floor(deviations.length / 2)];
    const sigma = mad * 1.4826; // Convert MAD to standard deviation
    
    // Calculate mean of central 68% of data
    const lowerBound = median - 2 * sigma;
    const upperBound = median + 2 * sigma;
    const clippedValues = sorted.filter(val => val >= lowerBound && val <= upperBound);
    const mean = clippedValues.reduce((sum, val) => sum + val, 0) / clippedValues.length;
    
    return { mean, sigma, median };
  }

  private analyzeStarRegion(
    data: Uint16Array,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    background: { mean: number; sigma: number }
  ): StarData | null {
    const radius = 15; // Analysis radius
    let totalFlux = 0;
    let weightedX = 0;
    let weightedY = 0;
    let peakValue = 0;
    let pixelCount = 0;
    
    // Calculate centroid and flux
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const index = y * width + x;
          const value = data[index] - background.mean;
          
          if (value > 0) {
            totalFlux += value;
            weightedX += x * value;
            weightedY += y * value;
            peakValue = Math.max(peakValue, data[index]);
            pixelCount++;
          }
        }
      }
    }
    
    if (totalFlux <= 0) return null;
    
    const centroidX = weightedX / totalFlux;
    const centroidY = weightedY / totalFlux;
    
    // Calculate HFR (Half Flux Radius)
    const hfr = this.calculateHFR(data, width, height, centroidX, centroidY, background.mean);
    
    // Calculate FWHM (approximation)
    const fwhm = hfr * 2.35; // Gaussian approximation
    
    // Calculate SNR
    const snr = totalFlux / (background.sigma * Math.sqrt(pixelCount));
    
    // Calculate eccentricity (simplified)
    const eccentricity = this.calculateEccentricity(data, width, height, centroidX, centroidY, hfr, background.mean);
    
    return {
      x: centroidX,
      y: centroidY,
      flux: totalFlux,
      hfr,
      fwhm,
      snr,
      peak: peakValue,
      background: background.mean,
      eccentricity,
      saturated: peakValue >= 60000 // 16-bit saturation threshold
    };
  }

  private calculateHFR(
    data: Uint16Array,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    backgroundLevel: number
  ): number {
    const maxRadius = 20;
    const radialProfile: { radius: number; flux: number }[] = [];
    
    // Calculate radial profile
    for (let r = 0; r < maxRadius; r += 0.5) {
      let totalFlux = 0;
      let count = 0;
      
      const circumference = Math.max(1, Math.floor(2 * Math.PI * r));
      for (let i = 0; i < circumference; i++) {
        const angle = (2 * Math.PI * i) / circumference;
        const x = Math.round(centerX + r * Math.cos(angle));
        const y = Math.round(centerY + r * Math.sin(angle));
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const index = y * width + x;
          totalFlux += Math.max(0, data[index] - backgroundLevel);
          count++;
        }
      }
      
      if (count > 0) {
        radialProfile.push({ radius: r, flux: totalFlux / count });
      }
    }
    
    // Find half-flux radius
    const totalFlux = radialProfile.reduce((sum, point) => sum + point.flux, 0);
    const halfFlux = totalFlux / 2;
    
    let cumulativeFlux = 0;
    for (const point of radialProfile) {
      cumulativeFlux += point.flux;
      if (cumulativeFlux >= halfFlux) {
        return point.radius;
      }
    }
    
    return radialProfile[radialProfile.length - 1]?.radius || 5;
  }

  private calculateEccentricity(
    data: Uint16Array,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    hfr: number,
    backgroundLevel: number
  ): number {
    // Simplified eccentricity calculation using second moments
    let m20 = 0, m02 = 0, m11 = 0, totalFlux = 0;
    const radius = Math.ceil(hfr * 3);
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = Math.round(centerX + dx);
        const y = Math.round(centerY + dy);
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const index = y * width + x;
          const flux = Math.max(0, data[index] - backgroundLevel);
          
          if (flux > 0) {
            m20 += dx * dx * flux;
            m02 += dy * dy * flux;
            m11 += dx * dy * flux;
            totalFlux += flux;
          }
        }
      }
    }
    
    if (totalFlux === 0) return 0;
    
    m20 /= totalFlux;
    m02 /= totalFlux;
    m11 /= totalFlux;
    
    // Calculate eccentricity from second moments
    const a = (m20 + m02 + Math.sqrt((m20 - m02) ** 2 + 4 * m11 ** 2)) / 2;
    const b = (m20 + m02 - Math.sqrt((m20 - m02) ** 2 + 4 * m11 ** 2)) / 2;
    
    if (a === 0) return 0;
    return Math.sqrt(1 - b / a);
  }

  private calculateMetrics(
    data: Uint16Array,
    stars: StarData[],
    options: ImageProcessingOptions
  ): ImageMetrics {
    const background = this.calculateBackground(data);

    // Calculate average HFR and FWHM from detected stars
    const validStars = stars.filter(star => star.snr > 5 && !star.saturated);
    const avgHFR = validStars.length > 0
      ? validStars.reduce((sum, star) => sum + star.hfr, 0) / validStars.length
      : 5.0;
    const avgFWHM = avgHFR * 2.35;

    // Calculate average SNR
    const avgSNR = validStars.length > 0
      ? validStars.reduce((sum, star) => sum + star.snr, 0) / validStars.length
      : 10;

    // Calculate average eccentricity
    const avgEccentricity = validStars.length > 0
      ? validStars.reduce((sum, star) => sum + star.eccentricity, 0) / validStars.length
      : 0.3;

    // Find peak value (avoid stack overflow with large arrays)
    let peakValue = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > peakValue) {
        peakValue = data[i];
      }
    }

    // Calculate noise level
    const noise = background.sigma;

    // Calculate contrast (simplified)
    const contrast = peakValue > background.mean ? (peakValue - background.mean) / background.mean : 0;

    // Calculate saturation percentage
    const saturatedPixels = Array.from(data).filter(val => val >= options.saturationThreshold).length;
    const saturation = (saturatedPixels / data.length) * 100;

    // Calculate focus score
    const focusScore = this.calculateFocusScore(avgHFR, avgSNR, avgEccentricity);

    return {
      hfr: avgHFR,
      fwhm: avgFWHM,
      snr: avgSNR,
      backgroundLevel: background.mean,
      peakValue,
      starCount: validStars.length,
      eccentricity: avgEccentricity,
      noise,
      contrast,
      saturation,
      focusScore,
      timestamp: new Date()
    };
  }

  private calculateFocusScore(hfr: number, snr: number, eccentricity: number): number {
    // Focus score based on HFR, SNR, and star roundness
    let score = 100;

    // HFR penalty (lower is better)
    if (hfr > 2.0) score -= (hfr - 2.0) * 15;
    if (hfr > 4.0) score -= (hfr - 4.0) * 25;

    // SNR bonus (higher is better)
    if (snr < 10) score -= (10 - snr) * 2;

    // Eccentricity penalty (lower is better for round stars)
    if (eccentricity > 0.3) score -= (eccentricity - 0.3) * 50;

    return Math.max(0, Math.min(100, score));
  }

  private generateHistogram(data: Uint16Array): {
    red: number[];
    green: number[];
    blue: number[];
    luminance: number[];
  } {
    // For monochrome data, create luminance histogram
    const bins = 256;
    const luminance = new Array(bins).fill(0);
    const binSize = 65536 / bins; // 16-bit to 8-bit conversion

    for (const value of data) {
      const bin = Math.min(bins - 1, Math.floor(value / binSize));
      luminance[bin]++;
    }

    // For simulation, create RGB histograms based on luminance
    const red = luminance.map(val => val * (0.8 + Math.random() * 0.4));
    const green = luminance.map(val => val * (0.8 + Math.random() * 0.4));
    const blue = luminance.map(val => val * (0.8 + Math.random() * 0.4));

    return { red, green, blue, luminance };
  }

  private analyzeFocus(stars: StarData[], metrics: ImageMetrics): {
    isInFocus: boolean;
    focusDirection: 'in' | 'out' | 'optimal';
    confidence: number;
    recommendation: string;
  } {
    const targetHFR = 2.5; // Target HFR for good focus
    const tolerance = 0.5;

    const isInFocus = metrics.hfr <= targetHFR + tolerance;

    let focusDirection: 'in' | 'out' | 'optimal' = 'optimal';
    let recommendation = 'Focus is optimal.';

    if (metrics.hfr > targetHFR + tolerance) {
      focusDirection = 'in';
      recommendation = `Focus needs improvement. Current HFR: ${metrics.hfr.toFixed(2)}, target: ${targetHFR.toFixed(2)}. Consider running autofocus.`;
    } else if (metrics.hfr < targetHFR - tolerance && metrics.eccentricity > 0.4) {
      focusDirection = 'out';
      recommendation = 'Stars appear over-corrected or there may be optical issues. Check collimation.';
    }

    // Calculate confidence based on star count and SNR
    const confidence = Math.min(100, (metrics.starCount / 20) * 50 + (metrics.snr / 20) * 50);

    return {
      isInFocus,
      focusDirection,
      confidence,
      recommendation
    };
  }

  private assessQuality(metrics: ImageMetrics, stars: StarData[]): {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Focus quality
    if (metrics.hfr > 4.0) {
      score -= 30;
      issues.push('Poor focus quality');
      recommendations.push('Run autofocus routine');
    } else if (metrics.hfr > 2.5) {
      score -= 15;
      issues.push('Suboptimal focus');
      recommendations.push('Consider fine-tuning focus');
    }

    // Star count
    if (metrics.starCount < 10) {
      score -= 20;
      issues.push('Low star count');
      recommendations.push('Check pointing and exposure time');
    }

    // SNR
    if (metrics.snr < 5) {
      score -= 25;
      issues.push('Low signal-to-noise ratio');
      recommendations.push('Increase exposure time or gain');
    }

    // Saturation
    if (metrics.saturation > 5) {
      score -= 20;
      issues.push('High saturation level');
      recommendations.push('Reduce exposure time or gain');
    }

    // Star roundness
    if (metrics.eccentricity > 0.5) {
      score -= 15;
      issues.push('Poor star roundness');
      recommendations.push('Check tracking and guiding');
    }

    // Noise level
    if (metrics.noise > 100) {
      score -= 10;
      issues.push('High noise level');
      recommendations.push('Check camera cooling and gain settings');
    }

    score = Math.max(0, Math.min(100, score));

    let overall: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 85) overall = 'excellent';
    else if (score >= 70) overall = 'good';
    else if (score >= 50) overall = 'fair';
    else overall = 'poor';

    return {
      overall,
      score,
      issues,
      recommendations
    };
  }

  // Utility methods for real-time analysis
  async analyzeSubframe(
    imageData: ImageData | ArrayBuffer,
    region: { x: number; y: number; width: number; height: number }
  ): Promise<Partial<ImageAnalysisResult>> {
    // Quick analysis of a subframe for real-time feedback
    const processedData = this.preprocessImage(imageData);
    const stars = this.detectStars(processedData, this.defaultOptions);
    const metrics = this.calculateMetrics(processedData, stars, this.defaultOptions);

    return {
      metrics,
      stars: stars.slice(0, 10), // Limit for performance
      focusAnalysis: this.analyzeFocus(stars, metrics)
    };
  }

  calculateTrend(
    currentMetrics: ImageMetrics,
    previousMetrics: ImageMetrics[]
  ): {
    hfrTrend: 'improving' | 'degrading' | 'stable';
    snrTrend: 'improving' | 'degrading' | 'stable';
    focusTrend: 'improving' | 'degrading' | 'stable';
  } {
    if (previousMetrics.length === 0) {
      return {
        hfrTrend: 'stable',
        snrTrend: 'stable',
        focusTrend: 'stable'
      };
    }

    const recentMetrics = previousMetrics.slice(-5); // Last 5 measurements
    const avgPreviousHFR = recentMetrics.reduce((sum, m) => sum + m.hfr, 0) / recentMetrics.length;
    const avgPreviousSNR = recentMetrics.reduce((sum, m) => sum + m.snr, 0) / recentMetrics.length;
    const avgPreviousFocus = recentMetrics.reduce((sum, m) => sum + m.focusScore, 0) / recentMetrics.length;

    const hfrChange = currentMetrics.hfr - avgPreviousHFR;
    const snrChange = currentMetrics.snr - avgPreviousSNR;
    const focusChange = currentMetrics.focusScore - avgPreviousFocus;

    return {
      hfrTrend: Math.abs(hfrChange) < 0.1 ? 'stable' : hfrChange < 0 ? 'improving' : 'degrading',
      snrTrend: Math.abs(snrChange) < 1 ? 'stable' : snrChange > 0 ? 'improving' : 'degrading',
      focusTrend: Math.abs(focusChange) < 2 ? 'stable' : focusChange > 0 ? 'improving' : 'degrading'
    };
  }

  /**
   * Calculate Full Width at Half Maximum (FWHM) for a star
   */
  calculateFWHM(data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number): number {
    const radius = 20;
    const centerIdx = Math.floor(centerY) * width + Math.floor(centerX);
    const centerValue = data[centerIdx];
    const halfMax = centerValue / 2;

    // Find FWHM by measuring width at half maximum
    let leftX = centerX;
    let rightX = centerX;

    // Search left
    for (let x = Math.floor(centerX); x >= Math.max(0, centerX - radius); x--) {
      const idx = Math.floor(centerY) * width + x;
      if (data[idx] <= halfMax) {
        leftX = x;
        break;
      }
    }

    // Search right
    for (let x = Math.floor(centerX); x <= Math.min(width - 1, centerX + radius); x++) {
      const idx = Math.floor(centerY) * width + x;
      if (data[idx] <= halfMax) {
        rightX = x;
        break;
      }
    }

    return Math.abs(rightX - leftX);
  }

  /**
   * Calculate Signal-to-Noise Ratio (SNR) for a star
   */
  calculateSNR(data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number): number {
    const radius = 10;
    const backgroundRadius = 20;

    // Calculate signal (peak value)
    const centerIdx = Math.floor(centerY) * width + Math.floor(centerX);
    const signal = data[centerIdx];

    // Calculate background noise
    let backgroundSum = 0;
    let backgroundCount = 0;

    for (let y = Math.max(0, centerY - backgroundRadius); y <= Math.min(height - 1, centerY + backgroundRadius); y++) {
      for (let x = Math.max(0, centerX - backgroundRadius); x <= Math.min(width - 1, centerX + backgroundRadius); x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance > radius && distance <= backgroundRadius) {
          const idx = Math.floor(y) * width + Math.floor(x);
          backgroundSum += data[idx];
          backgroundCount++;
        }
      }
    }

    const backgroundMean = backgroundCount > 0 ? backgroundSum / backgroundCount : 0;
    const noise = Math.sqrt(backgroundMean); // Simplified noise calculation

    return noise > 0 ? (signal - backgroundMean) / noise : 0;
  }
}

// Export singleton instance
export const imageAnalyzer = new ImageAnalyzer();
export default imageAnalyzer;
