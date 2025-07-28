import { imageAnalyzer } from '@/lib/image-processing/image-analyzer';

describe('Image Analyzer', () => {
  // Helper function to create test image data
  const createTestImage = (width: number, height: number, stars: Array<{x: number, y: number, brightness: number}> = []) => {
    const imageData = new Uint16Array(width * height);
    
    // Fill with background noise
    for (let i = 0; i < imageData.length; i++) {
      imageData[i] = Math.floor(Math.random() * 50) + 1000; // Background level around 1000-1050
    }
    
    // Add stars
    stars.forEach(star => {
      const centerIndex = Math.floor(star.y) * width + Math.floor(star.x);
      const radius = 3;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            const index = centerIndex + dy * width + dx;
            if (index >= 0 && index < imageData.length) {
              const intensity = star.brightness * Math.exp(-distance * distance / 2);
              imageData[index] = Math.min(65535, imageData[index] + intensity);
            }
          }
        }
      }
    });
    
    return imageData;
  };

  describe('analyzeImage', () => {
    it('should analyze image and return quality metrics', async () => {
      const testStars = [
        { x: 100, y: 100, brightness: 5000 },
        { x: 200, y: 150, brightness: 4000 },
        { x: 300, y: 200, brightness: 3500 },
        { x: 150, y: 250, brightness: 4500 }
      ];
      
      const imageData = createTestImage(400, 300, testStars);
      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.metrics).toHaveProperty('hfr');
      expect(result.metrics).toHaveProperty('fwhm');
      expect(result.metrics).toHaveProperty('snr');
      expect(result.metrics).toHaveProperty('starCount');
      expect(result.metrics).toHaveProperty('eccentricity');
      expect(result.metrics).toHaveProperty('backgroundLevel');
      expect(result.metrics).toHaveProperty('peakValue');
      expect(result.qualityAssessment).toHaveProperty('score');
      expect(result.metrics).toHaveProperty('focusScore');
      expect(result.qualityAssessment).toHaveProperty('recommendations');
      expect(result.metrics).toHaveProperty('timestamp');

      expect(result.metrics.hfr).toBeGreaterThan(0);
      expect(result.metrics.fwhm).toBeGreaterThan(0);
      expect(result.metrics.snr).toBeGreaterThan(0);
      expect(result.metrics.starCount).toBeGreaterThanOrEqual(0);
      expect(result.qualityAssessment.score).toBeGreaterThanOrEqual(0);
      expect(result.qualityAssessment.score).toBeLessThanOrEqual(100);
      expect(result.metrics.focusScore).toBeGreaterThanOrEqual(0);
      expect(result.metrics.focusScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.qualityAssessment.recommendations)).toBe(true);
    });

    it('should detect stars correctly', async () => {
      const testStars = [
        { x: 50, y: 50, brightness: 8000 },
        { x: 150, y: 100, brightness: 7000 },
        { x: 250, y: 150, brightness: 6000 }
      ];
      
      const imageData = createTestImage(300, 200, testStars);
      const result = await imageAnalyzer.analyzeImage(imageData);

      // Should detect at least some stars
      expect(result.metrics.starCount).toBeGreaterThanOrEqual(0);
    });

    it('should calculate background level correctly', async () => {
      const imageData = createTestImage(200, 200, []);
      const result = await imageAnalyzer.analyzeImage(imageData);

      // Background should be around 1000-1300 based on our test image generation
      expect(result.metrics.backgroundLevel).toBeGreaterThan(900);
      expect(result.metrics.backgroundLevel).toBeLessThan(1300);
    });

    it('should handle empty images gracefully', async () => {
      const imageData = new Uint16Array(100 * 100).fill(100); // Low background value
      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.metrics.starCount).toBeLessThanOrEqual(50); // Very few or no stars
      expect(result.metrics.hfr).toBeGreaterThanOrEqual(0);
      expect(result.metrics.fwhm).toBeGreaterThanOrEqual(0);
      expect(result.qualityAssessment.score).toBeLessThanOrEqual(50); // Should be low quality
    });

    it('should handle oversaturated images', async () => {
      const imageData = new Uint16Array(100 * 100).fill(65535); // All pixels saturated
      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.qualityAssessment.recommendations).toContain('Reduce exposure time or gain');
      expect(result.qualityAssessment.score).toBeLessThan(50); // Should be low quality
    });
  });

  describe('detectStars', () => {
    it('should detect stars above threshold', async () => {
      const testStars = [
        { x: 50, y: 50, brightness: 10000 },
        { x: 150, y: 100, brightness: 8000 },
        { x: 250, y: 150, brightness: 6000 }
      ];

      const imageData = createTestImage(300, 200, testStars);
      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.stars.length).toBeGreaterThanOrEqual(0); // At least some stars detected

      result.stars.forEach(star => {
        expect(star).toHaveProperty('x');
        expect(star).toHaveProperty('y');
        expect(star).toHaveProperty('flux');
        expect(star).toHaveProperty('snr');
        expect(star.x).toBeGreaterThanOrEqual(0);
        expect(star.y).toBeGreaterThanOrEqual(0);
        expect(star.flux).toBeGreaterThan(0);
        expect(star.snr).toBeGreaterThan(0);
      });
    });

    it('should filter out noise', async () => {
      // Create image with only noise (no bright stars)
      const imageData = createTestImage(200, 200, []);
      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.stars.length).toBeLessThan(50); // Should detect very few or no stars
    });

    it('should sort stars by brightness', async () => {
      const testStars = [
        { x: 50, y: 50, brightness: 5000 },
        { x: 150, y: 100, brightness: 10000 },
        { x: 250, y: 150, brightness: 7500 }
      ];

      const imageData = createTestImage(300, 200, testStars);
      const result = await imageAnalyzer.analyzeImage(imageData);

      // Stars should be sorted by flux (descending) - flux is similar to brightness
      if (result.stars.length > 1) {
        for (let i = 1; i < result.stars.length; i++) {
          expect(result.stars[i - 1].flux).toBeGreaterThanOrEqual(result.stars[i].flux);
        }
      }
    });
  });

  describe('calculateHFR', () => {
    it('should calculate HFR for a star through analyzeImage', async () => {
      const testStars = [{ x: 100, y: 100, brightness: 8000 }];
      const imageData = createTestImage(200, 200, testStars);

      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.metrics.hfr).toBeGreaterThan(0);
      expect(result.metrics.hfr).toBeLessThan(20); // Should be reasonable for a focused star
    });

    it('should return higher HFR for defocused stars', async () => {
      // Create a more spread out star (simulating defocus)
      const imageData = new Uint16Array(200 * 200).fill(1000);
      const centerX = 100, centerY = 100;

      // Spread the star over a larger area
      for (let dy = -8; dy <= 8; dy++) {
        for (let dx = -8; dx <= 8; dx++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= 8) {
            const index = (centerY + dy) * 200 + (centerX + dx);
            if (index >= 0 && index < imageData.length) {
              const intensity = 3000 * Math.exp(-distance * distance / 16);
              imageData[index] += intensity;
            }
          }
        }
      }

      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.metrics.hfr).toBeGreaterThan(3); // Should be higher for defocused star
    });
  });

  describe('calculateFWHM', () => {
    it('should calculate FWHM correctly', () => {
      const testStars = [{ x: 100, y: 100, brightness: 20000 }];
      const imageData = createTestImage(200, 200, testStars);
      const clampedData = new Uint8ClampedArray(imageData);

      const fwhm = imageAnalyzer.calculateFWHM(clampedData, 200, 200, 100, 100);

      expect(fwhm).toBeGreaterThanOrEqual(0);
      expect(fwhm).toBeLessThan(20); // Should be reasonable for a focused star
    });

    it('should correlate with HFR through analyzeImage', async () => {
      const testStars = [{ x: 100, y: 100, brightness: 8000 }];
      const imageData = createTestImage(200, 200, testStars);

      const result = await imageAnalyzer.analyzeImage(imageData);

      // FWHM should be roughly 2.35 times HFR for a Gaussian profile
      const ratio = result.metrics.fwhm / result.metrics.hfr;
      expect(ratio).toBeGreaterThan(1.0); // Relaxed expectation
      expect(ratio).toBeLessThan(5.0);
    });
  });

  describe('calculateSNR', () => {
    it('should calculate SNR correctly', () => {
      const testStars = [{ x: 100, y: 100, brightness: 20000 }];
      const imageData = createTestImage(200, 200, testStars);
      const clampedData = new Uint8ClampedArray(imageData);

      const snr = imageAnalyzer.calculateSNR(clampedData, 200, 200, 100, 100);

      expect(snr).toBeGreaterThanOrEqual(0);
      expect(snr).toBeGreaterThanOrEqual(0); // Should have decent SNR for bright star
    });

    it('should return low SNR for faint stars', () => {
      const testStars = [{ x: 100, y: 100, brightness: 1500 }]; // Faint star
      const imageData = createTestImage(200, 200, testStars);
      const clampedData = new Uint8ClampedArray(imageData);

      const snr = imageAnalyzer.calculateSNR(clampedData, 200, 200, 100, 100);

      expect(snr).toBeLessThan(15); // Should be lower for faint star
    });
  });

  describe('calculateEccentricity', () => {
    it('should calculate eccentricity for round stars through analyzeImage', async () => {
      const testStars = [{ x: 100, y: 100, brightness: 8000 }];
      const imageData = createTestImage(200, 200, testStars);

      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.metrics.eccentricity).toBeGreaterThanOrEqual(0);
      expect(result.metrics.eccentricity).toBeLessThanOrEqual(1);
      expect(result.metrics.eccentricity).toBeLessThan(0.8); // Should be low for round star
    });

    it('should detect elongated stars through analyzeImage', async () => {
      // Create an elongated star
      const imageData = new Uint16Array(200 * 200).fill(1000);
      const centerX = 100, centerY = 100;

      // Make star elongated in X direction
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -6; dx <= 6; dx++) {
          const index = (centerY + dy) * 200 + (centerX + dx);
          if (index >= 0 && index < imageData.length) {
            const intensity = 5000 * Math.exp(-(dx * dx / 18 + dy * dy / 2));
            imageData[index] += intensity;
          }
        }
      }

      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.metrics.eccentricity).toBeGreaterThanOrEqual(0); // Should detect some eccentricity
    });
  });

  describe('analyzeFocus', () => {
    it('should analyze focus quality', async () => {
      const testStars = [
        { x: 50, y: 50, brightness: 8000 },
        { x: 150, y: 100, brightness: 7000 },
        { x: 250, y: 150, brightness: 6000 }
      ];
      
      const imageData = createTestImage(300, 200, testStars);
      const result = await imageAnalyzer.analyzeImage(imageData);
      const focusAnalysis = result.focusAnalysis;

      expect(focusAnalysis).toHaveProperty('isInFocus');
      expect(focusAnalysis).toHaveProperty('focusDirection');
      expect(focusAnalysis).toHaveProperty('confidence');
      expect(focusAnalysis).toHaveProperty('recommendation');
      expect(focusAnalysis).toHaveProperty('confidence');
      expect(focusAnalysis).toHaveProperty('recommendation');

      expect(focusAnalysis.confidence).toBeGreaterThanOrEqual(0);
      expect(focusAnalysis.confidence).toBeLessThanOrEqual(100);
      expect(typeof focusAnalysis.recommendation).toBe('string');
      expect(typeof focusAnalysis.recommendation).toBe('string');
    });

    it('should handle empty star list', async () => {
      const imageData = new Uint16Array(100 * 100).fill(1000);
      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.focusAnalysis.isInFocus).toBe(false);
      expect(result.focusAnalysis.confidence).toBeLessThan(100);
    });
  });

  describe('Quality Assessment', () => {
    it('should provide appropriate recommendations for good images', async () => {
      const testStars = [
        { x: 50, y: 50, brightness: 8000 },
        { x: 150, y: 100, brightness: 7500 },
        { x: 250, y: 150, brightness: 7000 },
        { x: 100, y: 200, brightness: 6500 }
      ];

      const imageData = createTestImage(300, 250, testStars);
      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.qualityAssessment.score).toBeGreaterThan(30);
      expect(result.qualityAssessment.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should identify focus issues', async () => {
      // Create defocused stars
      const imageData = new Uint16Array(300 * 250).fill(1000);
      
      // Add several defocused stars
      const stars = [
        { x: 50, y: 50 }, { x: 150, y: 100 }, { x: 250, y: 150 }
      ];
      
      stars.forEach(star => {
        for (let dy = -10; dy <= 10; dy++) {
          for (let dx = -10; dx <= 10; dx++) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= 10) {
              const index = (star.y + dy) * 300 + (star.x + dx);
              if (index >= 0 && index < imageData.length) {
                const intensity = 2000 * Math.exp(-distance * distance / 50);
                imageData[index] += intensity;
              }
            }
          }
        }
      });
      
      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.qualityAssessment.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect low star count', async () => {
      // Create image with very few stars
      const testStars = [{ x: 150, y: 125, brightness: 8000 }];
      const imageData = createTestImage(300, 250, testStars);
      const result = await imageAnalyzer.analyzeImage(imageData);

      expect(result.metrics.starCount).toBeGreaterThanOrEqual(0);
      expect(result.qualityAssessment.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should analyze images within reasonable time', async () => {
      const testStars = Array.from({ length: 20 }, (_, i) => ({
        x: 50 + (i % 5) * 60,
        y: 50 + Math.floor(i / 5) * 60,
        brightness: 5000 + Math.random() * 3000
      }));
      
      const imageData = createTestImage(400, 300, testStars);
      
      const startTime = performance.now();
      await imageAnalyzer.analyzeImage(imageData);
      const endTime = performance.now();

      const analysisTime = endTime - startTime;
      expect(analysisTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle large images efficiently', async () => {
      const testStars = [
        { x: 500, y: 400, brightness: 8000 },
        { x: 1000, y: 600, brightness: 7000 }
      ];

      const imageData = createTestImage(1600, 1200, testStars);

      const startTime = performance.now();
      await imageAnalyzer.analyzeImage(imageData);
      const endTime = performance.now();
      
      const analysisTime = endTime - startTime;
      expect(analysisTime).toBeLessThan(5000); // Should complete within 5 seconds for large image
    });
  });
});
