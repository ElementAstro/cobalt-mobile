/**
 * Enhanced Simulation Engine for Cobalt Mobile
 * Provides realistic equipment behavior, environmental effects, and error simulation
 */

export interface SimulationConfig {
  realism: 'basic' | 'realistic' | 'expert';
  errorRate: number; // 0-1, probability of errors
  weatherEffects: boolean;
  equipmentAging: boolean;
  networkLatency: number; // ms
  testMode?: boolean; // For fast test execution
}

export interface EnvironmentalConditions {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  cloudCover: number;
  seeing: number; // arcseconds
  lightPollution: number;
  moonPhase: number; // 0-1
  altitude: number; // degrees above horizon
  skyQuality: number; // Sky quality in mag/arcsec²
}

export interface EquipmentHealth {
  camera: {
    sensorTemp: number;
    coolingEfficiency: number;
    readNoise: number;
    darkCurrent: number;
    lastCalibration: Date;
  };
  mount: {
    trackingAccuracy: number;
    gearBacklash: number;
    thermalStability: number;
    lastAlignment: Date;
  };
  focuser: {
    backlash: number;
    repeatability: number;
    thermalCoefficient: number;
  };
  filterWheel: {
    positionAccuracy: number;
    motorWear: number;
    lastMaintenance: Date;
  };
}

export class SimulationEngine {
  private config: SimulationConfig;
  private environmental!: EnvironmentalConditions;
  private equipmentHealth!: EquipmentHealth;
  private simulationStartTime: Date;
  private activeSimulations: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      realism: 'realistic',
      errorRate: 0.05,
      weatherEffects: true,
      equipmentAging: true,
      networkLatency: 100,
      testMode: false,
      ...config
    };

    this.simulationStartTime = new Date();
    this.initializeEnvironmental();
    this.initializeEquipmentHealth();
  }

  private initializeEnvironmental(): void {
    this.environmental = {
      temperature: 15 + (Math.random() - 0.5) * 20,
      humidity: 30 + Math.random() * 40,
      pressure: 1013 + (Math.random() - 0.5) * 20,
      windSpeed: Math.random() * 15,
      cloudCover: Math.random() * 0.3,
      seeing: 1.5 + Math.random() * 2,
      lightPollution: 18 + Math.random() * 4,
      moonPhase: Math.random(),
      altitude: 30 + Math.random() * 60,
      skyQuality: 18 + Math.random() * 4 // Sky quality in mag/arcsec²
    };
  }

  private initializeEquipmentHealth(): void {
    this.equipmentHealth = {
      camera: {
        sensorTemp: -10 + (Math.random() - 0.5) * 5,
        coolingEfficiency: 0.85 + Math.random() * 0.1,
        readNoise: 1.2 + Math.random() * 0.5,
        darkCurrent: 0.01 + Math.random() * 0.02,
        lastCalibration: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      },
      mount: {
        trackingAccuracy: 0.5 + Math.random() * 1.5,
        gearBacklash: 5 + Math.random() * 10,
        thermalStability: 0.8 + Math.random() * 0.15,
        lastAlignment: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      },
      focuser: {
        backlash: 10 + Math.random() * 20,
        repeatability: 0.95 + Math.random() * 0.04,
        thermalCoefficient: 5 + Math.random() * 10
      },
      filterWheel: {
        positionAccuracy: 0.98 + Math.random() * 0.015,
        motorWear: Math.random() * 0.2,
        lastMaintenance: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      }
    };
  }

  /**
   * Simulate camera capture with realistic timing and potential issues
   */
  async simulateCapture(
    exposureTime: number,
    onProgress: (progress: number) => void,
    abortSignal?: AbortSignal
  ): Promise<{ success: boolean; error?: string; metadata?: Record<string, unknown> }> {
    // Check for abort signal immediately
    if (abortSignal?.aborted) {
      return { success: false, error: 'Capture aborted' };
    }

    // Check for environmental issues
    const environmentalIssues = this.checkEnvironmentalConditions();
    if (environmentalIssues.length > 0 && Math.random() < this.config.errorRate) {
      return { success: false, error: environmentalIssues[0] };
    }

    // In test mode, return immediately with success
    if (this.config.testMode) {
      onProgress(100);
      return this.evaluateCaptureQuality(exposureTime);
    }

    const startTime = Date.now();

    // Calculate realistic capture time including readout
    const readoutTime = this.calculateReadoutTime();
    const totalTime = (exposureTime * 1000) + readoutTime;

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (abortSignal?.aborted) {
          clearInterval(interval);
          resolve({ success: false, error: 'Capture aborted' });
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / totalTime) * 100, 100);

        // Add realistic progress variations
        const adjustedProgress = this.addProgressVariation(progress);
        onProgress(adjustedProgress);

        if (elapsed >= totalTime) {
          clearInterval(interval);

          // Simulate potential capture issues
          const captureResult = this.evaluateCaptureQuality(exposureTime);
          resolve(captureResult);
        }
      }, 100);
    });
  }

  /**
   * Simulate mount slewing with realistic acceleration and deceleration
   */
  async simulateSlew(
    fromRA: number,
    fromDec: number,
    toRA: number,
    toDec: number,
    onProgress: (progress: number) => void,
    abortSignal?: AbortSignal
  ): Promise<{ success: boolean; error?: string; finalRA?: number; finalDec?: number }> {
    // Check for abort signal immediately
    if (abortSignal?.aborted) {
      return { success: false, error: 'Slew aborted' };
    }

    // In test mode, return immediately with success
    if (this.config.testMode) {
      onProgress(100);
      const pointingError = this.simulatePointingError();
      return {
        success: true,
        finalRA: toRA + pointingError.ra,
        finalDec: toDec + pointingError.dec
      };
    }

    const distance = this.calculateSlewDistance(fromRA, fromDec, toRA, toDec);
    const slewTime = this.calculateSlewTime(distance);

    const startTime = Date.now();

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (abortSignal?.aborted) {
          clearInterval(interval);
          resolve({ success: false, error: 'Slew aborted' });
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / slewTime) * 100, 100);

        // Simulate realistic slew curve (acceleration/deceleration)
        const adjustedProgress = this.applySlewCurve(progress);

        // Update current position
        const progressRatio = adjustedProgress / 100;
        const currentRA = fromRA + (toRA - fromRA) * progressRatio;
        const currentDec = fromDec + (toDec - fromDec) * progressRatio;

        onProgress(adjustedProgress);

        if (elapsed >= slewTime) {
          clearInterval(interval);

          // Add pointing accuracy simulation
          const pointingError = this.simulatePointingError();
          const finalRA = toRA + pointingError.ra;
          const finalDec = toDec + pointingError.dec;

          resolve({
            success: true,
            finalRA,
            finalDec
          });
        }
      }, 100);
    });
  }

  /**
   * Simulate focuser movement with backlash and thermal effects
   */
  async simulateFocuserMove(
    fromPosition: number,
    toPosition: number,
    onProgress: (progress: number) => void,
    abortSignal?: AbortSignal
  ): Promise<{ success: boolean; error?: string; finalPosition?: number }> {
    // Check for abort signal immediately
    if (abortSignal?.aborted) {
      return { success: false, error: 'Focuser move aborted' };
    }

    // In test mode, return immediately with success
    if (this.config.testMode) {
      onProgress(100);
      const repeatabilityError = (1 - this.equipmentHealth.focuser.repeatability) * 10;
      const finalPosition = toPosition + (Math.random() - 0.5) * repeatabilityError;
      return {
        success: true,
        finalPosition: Math.round(finalPosition)
      };
    }

    const distance = Math.abs(toPosition - fromPosition);
    const moveTime = this.calculateFocuserMoveTime(distance);

    const startTime = Date.now();

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (abortSignal?.aborted) {
          clearInterval(interval);
          resolve({ success: false, error: 'Focuser move aborted' });
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / moveTime) * 100, 100);
        onProgress(progress);

        if (elapsed >= moveTime) {
          clearInterval(interval);

          // Apply repeatability error
          const repeatabilityError = (1 - this.equipmentHealth.focuser.repeatability) * 10;
          const finalPosition = toPosition + (Math.random() - 0.5) * repeatabilityError;

          resolve({
            success: true,
            finalPosition: Math.round(finalPosition)
          });
        }
      }, 50);
    });
  }

  /**
   * Update environmental conditions over time
   */
  updateEnvironmentalConditions(): EnvironmentalConditions {
    // const timeElapsed = (Date.now() - this.simulationStartTime.getTime()) / (1000 * 60 * 60); // hours // Unused for now
    
    // Simulate natural weather changes
    this.environmental.temperature += (Math.random() - 0.5) * 0.5;
    this.environmental.humidity += (Math.random() - 0.5) * 2;
    this.environmental.pressure += (Math.random() - 0.5) * 0.2;
    this.environmental.windSpeed = Math.max(0, this.environmental.windSpeed + (Math.random() - 0.5) * 1);
    this.environmental.seeing += (Math.random() - 0.5) * 0.2;
    
    // Simulate cloud movement
    this.environmental.cloudCover = Math.max(0, Math.min(1, 
      this.environmental.cloudCover + (Math.random() - 0.5) * 0.1
    ));

    // Clamp values to realistic ranges
    this.environmental.temperature = Math.max(-30, Math.min(40, this.environmental.temperature));
    this.environmental.humidity = Math.max(0, Math.min(100, this.environmental.humidity));
    this.environmental.seeing = Math.max(0.8, Math.min(8, this.environmental.seeing));

    return { ...this.environmental };
  }

  // Helper methods
  private calculateReadoutTime(): number {
    // Simulate camera readout time based on binning and sensor size
    return 2000 + Math.random() * 1000; // 2-3 seconds
  }

  private checkEnvironmentalConditions(): string[] {
    const issues: string[] = [];
    
    if (this.environmental.cloudCover > 0.7) {
      issues.push('High cloud cover detected');
    }
    
    if (this.environmental.windSpeed > 20) {
      issues.push('High wind speed may affect tracking');
    }
    
    if (this.environmental.humidity > 85) {
      issues.push('High humidity may cause condensation');
    }

    return issues;
  }

  private addProgressVariation(progress: number): number {
    // Add slight variations to simulate realistic progress
    const variation = Math.sin(progress / 10) * 0.5;
    return Math.max(0, Math.min(100, progress + variation));
  }

  private evaluateCaptureQuality(exposureTime: number): { success: boolean; error?: string; metadata?: Record<string, unknown> } {
    // Simulate various capture issues based on error rate
    if (Math.random() < this.config.errorRate) {
      const errorTypes = [
        'Camera communication timeout',
        'Sensor overheating detected',
        'Memory card write error',
        'USB connection lost',
        'Power supply fluctuation'
      ];
      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      return { success: false, error: randomError };
    }
    
    if (this.environmental.cloudCover > 0.8 && Math.random() < 0.3) {
      return { success: false, error: 'Clouds detected during exposure' };
    }

    // Calculate image quality metrics
    const seeing = this.environmental.seeing;
    const fwhm = seeing * (1 + Math.random() * 0.2);
    const snr = this.calculateSNR(exposureTime);
    
    return {
      success: true,
      metadata: {
        fwhm,
        snr,
        temperature: this.environmental.temperature,
        seeing: this.environmental.seeing
      }
    };
  }

  private calculateSlewDistance(fromRA: number, fromDec: number, toRA: number, toDec: number): number {
    // Simplified angular distance calculation
    const deltaRA = Math.abs(toRA - fromRA);
    const deltaDec = Math.abs(toDec - fromDec);
    return Math.sqrt(deltaRA * deltaRA + deltaDec * deltaDec);
  }

  private calculateSlewTime(distance: number): number {
    // Realistic slew time based on distance and mount capabilities
    const baseTime = 5000; // 5 seconds minimum
    const timePerDegree = 2000; // 2 seconds per degree
    return baseTime + (distance * timePerDegree);
  }

  private applySlewCurve(progress: number): number {
    // Apply S-curve for realistic acceleration/deceleration
    if (progress < 20) {
      return progress * progress / 400; // Acceleration
    } else if (progress > 80) {
      const remaining = 100 - progress;
      return 100 - (remaining * remaining / 400); // Deceleration
    }
    return progress; // Constant speed
  }

  private simulatePointingError(): { ra: number; dec: number } {
    const accuracy = this.equipmentHealth.mount.trackingAccuracy;
    const maxError = accuracy / 3600; // Convert arcseconds to degrees
    
    return {
      ra: (Math.random() - 0.5) * maxError,
      dec: (Math.random() - 0.5) * maxError
    };
  }

  private calculateFocuserMoveTime(steps: number): number {
    // Realistic focuser timing: ~50 steps per second
    return Math.max(500, steps * 20); // Minimum 0.5 seconds
  }

  private calculateSNR(exposureTime: number): number {
    // Simplified SNR calculation
    const baseSNR = Math.sqrt(exposureTime) * 10;
    const environmentalFactor = 1 - (this.environmental.lightPollution / 25);
    return baseSNR * environmentalFactor * (0.8 + Math.random() * 0.4);
  }

  // Public getters
  getEnvironmentalConditions(): EnvironmentalConditions {
    return { ...this.environmental };
  }

  getEquipmentHealth(): EquipmentHealth {
    return { ...this.equipmentHealth };
  }

  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  cleanup(): void {
    this.activeSimulations.forEach(timeout => clearTimeout(timeout));
    this.activeSimulations.clear();
  }
}

// Lazy singleton instance
let _simulationEngine: SimulationEngine | null = null;

export const simulationEngine = {
  getInstance(): SimulationEngine {
    if (!_simulationEngine) {
      _simulationEngine = new SimulationEngine();
    }
    return _simulationEngine;
  },

  // Proxy methods for backward compatibility
  getEnvironmentalConditions() {
    return this.getInstance().getEnvironmentalConditions();
  },

  getEquipmentHealth() {
    return this.getInstance().getEquipmentHealth();
  },

  simulateCapture(exposureTime: number, onProgress: (progress: number) => void, abortSignal?: AbortSignal) {
    return this.getInstance().simulateCapture(exposureTime, onProgress, abortSignal);
  },

  simulateSlew(fromRA: number, fromDec: number, toRA: number, toDec: number, onProgress: (progress: number) => void, abortSignal?: AbortSignal) {
    return this.getInstance().simulateSlew(fromRA, fromDec, toRA, toDec, onProgress, abortSignal);
  },

  updateConfig(config: Partial<SimulationConfig>) {
    return this.getInstance().updateConfig(config);
  },

  getConfig() {
    return this.getInstance().getConfig();
  },

  cleanup() {
    return this.getInstance().cleanup();
  }
};
