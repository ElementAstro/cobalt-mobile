export interface GuidingParameters {
  aggressiveness: number; // 0-100
  minMove: number; // arcseconds
  maxMove: number; // arcseconds
  calibrationSteps: number;
  settleTime: number; // seconds
  settlePixels: number;
  ditherAmount: number; // pixels
  ditherSettleTime: number; // seconds
  enableDecGuiding: boolean;
  enableRAGuiding: boolean;
  hysteresis: number; // 0-100
  lowpassFilter: number; // 0-100
  resistSwitch: boolean;
  resistSwitchThreshold: number; // arcseconds
}

export interface GuidingCalibration {
  id: string;
  timestamp: Date;
  raStepsPerArcsec: number;
  decStepsPerArcsec: number;
  raAngle: number; // degrees
  decAngle: number; // degrees
  raRate: number; // arcsec/sec
  decRate: number; // arcsec/sec
  orthogonalError: number; // degrees
  calibrationQuality: 'excellent' | 'good' | 'fair' | 'poor';
  isValid: boolean;
  notes?: string;
}

export interface GuidingStats {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalFrames: number;
  droppedFrames: number;
  rmsRA: number; // arcseconds
  rmsDec: number; // arcseconds
  rmsTotal: number; // arcseconds
  maxRA: number; // arcseconds
  maxDec: number; // arcseconds
  peakRA: number; // arcseconds
  peakDec: number; // arcseconds
  corrections: {
    ra: number[];
    dec: number[];
    timestamps: Date[];
  };
  starMass: number[];
  snr: number[];
  starPosition: { x: number; y: number }[];
  ditherEvents: {
    timestamp: Date;
    offsetX: number;
    offsetY: number;
    settleTime: number;
  }[];
}

export interface PolarAlignmentData {
  id: string;
  timestamp: Date;
  method: 'drift' | 'platesolve' | 'manual';
  azimuthError: number; // arcminutes
  altitudeError: number; // arcminutes
  totalError: number; // arcminutes
  azimuthCorrection: number; // arcminutes
  altitudeCorrection: number; // arcminutes
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  measurements: {
    timestamp: Date;
    starPosition: { x: number; y: number };
    hourAngle: number;
    declination: number;
    drift: { ra: number; dec: number }; // arcsec/min
  }[];
  isComplete: boolean;
  notes?: string;
}

export interface GuidingState {
  isGuiding: boolean;
  isCalibrated: boolean;
  isConnected: boolean;
  currentStar: { x: number; y: number; mass: number; snr: number } | null;
  lockPosition: { x: number; y: number } | null;
  currentError: { ra: number; dec: number }; // arcseconds
  currentCorrection: { ra: number; dec: number }; // milliseconds
  exposureTime: number; // seconds
  gain: number;
  frameRate: number; // fps
  temperature: number; // celsius
  status: 'idle' | 'calibrating' | 'guiding' | 'dithering' | 'settling' | 'lost' | 'error';
  statusMessage: string;
  settleProgress: number; // 0-100
}

class GuidingEngine {
  private state: GuidingState = {
    isGuiding: false,
    isCalibrated: false,
    isConnected: false,
    currentStar: null,
    lockPosition: null,
    currentError: { ra: 0, dec: 0 },
    currentCorrection: { ra: 0, dec: 0 },
    exposureTime: 2.0,
    gain: 50,
    frameRate: 0.5,
    temperature: -10,
    status: 'idle',
    statusMessage: 'Ready',
    settleProgress: 0
  };

  private parameters: GuidingParameters = {
    aggressiveness: 75,
    minMove: 0.1,
    maxMove: 5.0,
    calibrationSteps: 8,
    settleTime: 10,
    settlePixels: 1.5,
    ditherAmount: 3.0,
    ditherSettleTime: 15,
    enableDecGuiding: true,
    enableRAGuiding: true,
    hysteresis: 10,
    lowpassFilter: 20,
    resistSwitch: true,
    resistSwitchThreshold: 2.0
  };

  private currentCalibration: GuidingCalibration | null = null;
  private currentStats: GuidingStats | null = null;
  private guidingHistory: GuidingStats[] = [];
  private calibrationHistory: GuidingCalibration[] = [];
  private eventCallbacks: ((event: string, data: any) => void)[] = [];

  // Connection management
  async connect(): Promise<boolean> {
    try {
      // Simulate connection to guiding camera
      await this.delay(1000);
      this.state.isConnected = true;
      this.state.statusMessage = 'Connected to guiding camera';
      this.triggerEvent('connected', { timestamp: new Date() });
      return true;
    } catch (error) {
      this.state.statusMessage = 'Failed to connect to guiding camera';
      this.triggerEvent('error', { message: 'Connection failed', error });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.state.isGuiding) {
      await this.stopGuiding();
    }
    this.state.isConnected = false;
    this.state.statusMessage = 'Disconnected';
    this.triggerEvent('disconnected', { timestamp: new Date() });
  }

  // Calibration
  async startCalibration(): Promise<GuidingCalibration> {
    if (!this.state.isConnected) {
      throw new Error('Guiding camera not connected');
    }

    if (!this.state.currentStar) {
      throw new Error('No guide star selected');
    }

    this.state.status = 'calibrating';
    this.state.statusMessage = 'Starting calibration...';
    this.triggerEvent('calibration_started', { timestamp: new Date() });

    try {
      // Simulate calibration process
      const calibration = await this.performCalibration();
      
      this.currentCalibration = calibration;
      this.calibrationHistory.push(calibration);
      this.state.isCalibrated = calibration.isValid;
      this.state.status = 'idle';
      this.state.statusMessage = calibration.isValid ? 'Calibration complete' : 'Calibration failed';
      
      this.triggerEvent('calibration_complete', { calibration });
      return calibration;
    } catch (error) {
      this.state.status = 'error';
      this.state.statusMessage = 'Calibration failed';
      this.triggerEvent('calibration_failed', { error });
      throw error;
    }
  }

  private async performCalibration(): Promise<GuidingCalibration> {
    const calibration: GuidingCalibration = {
      id: `cal_${Date.now()}`,
      timestamp: new Date(),
      raStepsPerArcsec: 0,
      decStepsPerArcsec: 0,
      raAngle: 0,
      decAngle: 0,
      raRate: 0,
      decRate: 0,
      orthogonalError: 0,
      calibrationQuality: 'good',
      isValid: false,
      notes: ''
    };

    // Simulate calibration steps
    for (let step = 0; step < this.parameters.calibrationSteps; step++) {
      this.state.statusMessage = `Calibration step ${step + 1}/${this.parameters.calibrationSteps}`;
      this.triggerEvent('calibration_progress', { 
        step: step + 1, 
        total: this.parameters.calibrationSteps 
      });
      
      await this.delay(2000); // Simulate step duration
    }

    // Calculate calibration results (simulated)
    calibration.raStepsPerArcsec = 15.0 + (Math.random() - 0.5) * 2.0;
    calibration.decStepsPerArcsec = 15.2 + (Math.random() - 0.5) * 2.0;
    calibration.raAngle = 0.0 + (Math.random() - 0.5) * 10.0;
    calibration.decAngle = 90.0 + (Math.random() - 0.5) * 10.0;
    calibration.raRate = 15.04; // sidereal rate
    calibration.decRate = 0.0;
    calibration.orthogonalError = Math.abs(Math.abs(calibration.decAngle - calibration.raAngle) - 90.0);

    // Determine calibration quality
    if (calibration.orthogonalError < 5.0 && 
        calibration.raStepsPerArcsec > 10.0 && 
        calibration.decStepsPerArcsec > 10.0) {
      calibration.calibrationQuality = 'excellent';
      calibration.isValid = true;
    } else if (calibration.orthogonalError < 10.0) {
      calibration.calibrationQuality = 'good';
      calibration.isValid = true;
    } else if (calibration.orthogonalError < 20.0) {
      calibration.calibrationQuality = 'fair';
      calibration.isValid = true;
    } else {
      calibration.calibrationQuality = 'poor';
      calibration.isValid = false;
    }

    return calibration;
  }

  // Guiding
  async startGuiding(): Promise<void> {
    if (!this.state.isConnected) {
      throw new Error('Guiding camera not connected');
    }

    if (!this.state.isCalibrated) {
      throw new Error('Mount not calibrated');
    }

    if (!this.state.currentStar) {
      throw new Error('No guide star selected');
    }

    this.state.isGuiding = true;
    this.state.status = 'guiding';
    this.state.statusMessage = 'Guiding started';
    this.state.lockPosition = { ...this.state.currentStar };

    // Initialize guiding session
    this.currentStats = {
      sessionId: `guide_${Date.now()}`,
      startTime: new Date(),
      totalFrames: 0,
      droppedFrames: 0,
      rmsRA: 0,
      rmsDec: 0,
      rmsTotal: 0,
      maxRA: 0,
      maxDec: 0,
      peakRA: 0,
      peakDec: 0,
      corrections: {
        ra: [],
        dec: [],
        timestamps: []
      },
      starMass: [],
      snr: [],
      starPosition: [],
      ditherEvents: []
    };

    this.triggerEvent('guiding_started', { 
      sessionId: this.currentStats.sessionId,
      timestamp: new Date() 
    });

    // Start guiding loop
    this.startGuidingLoop();
  }

  async stopGuiding(): Promise<void> {
    this.state.isGuiding = false;
    this.state.status = 'idle';
    this.state.statusMessage = 'Guiding stopped';
    this.state.lockPosition = null;

    if (this.currentStats) {
      this.currentStats.endTime = new Date();
      this.guidingHistory.push(this.currentStats);
      
      this.triggerEvent('guiding_stopped', { 
        sessionId: this.currentStats.sessionId,
        stats: this.currentStats 
      });
      
      this.currentStats = null;
    }
  }

  private async startGuidingLoop(): Promise<void> {
    while (this.state.isGuiding) {
      try {
        await this.performGuidingStep();
        await this.delay(this.state.exposureTime * 1000);
      } catch (error) {
        console.error('Guiding step failed:', error);
        this.state.status = 'error';
        this.state.statusMessage = 'Guiding error';
        this.triggerEvent('guiding_error', { error });
        break;
      }
    }
  }

  private async performGuidingStep(): Promise<void> {
    if (!this.currentStats || !this.state.lockPosition) return;

    // Simulate star detection and measurement
    const starPosition = this.simulateStarPosition();
    const starMass = 1000 + Math.random() * 500;
    const snr = 20 + Math.random() * 30;

    // Calculate error
    const error = {
      ra: (starPosition.x - this.state.lockPosition.x) * 0.5, // Convert pixels to arcseconds
      dec: (starPosition.y - this.state.lockPosition.y) * 0.5
    };

    // Apply guiding algorithm
    const correction = this.calculateCorrection(error);

    // Update state
    this.state.currentStar = { ...starPosition, mass: starMass, snr };
    this.state.currentError = error;
    this.state.currentCorrection = correction;

    // Update statistics
    this.currentStats.totalFrames++;
    this.currentStats.corrections.ra.push(correction.ra);
    this.currentStats.corrections.dec.push(correction.dec);
    this.currentStats.corrections.timestamps.push(new Date());
    this.currentStats.starMass.push(starMass);
    this.currentStats.snr.push(snr);
    this.currentStats.starPosition.push(starPosition);

    // Calculate RMS
    this.updateGuidingStats();

    this.triggerEvent('guiding_step', {
      error,
      correction,
      starPosition,
      starMass,
      snr,
      rms: {
        ra: this.currentStats.rmsRA,
        dec: this.currentStats.rmsDec,
        total: this.currentStats.rmsTotal
      }
    });
  }

  private simulateStarPosition(): { x: number; y: number } {
    if (!this.state.lockPosition) {
      return { x: 100, y: 100 };
    }

    // Simulate realistic guiding errors with periodic error and atmospheric seeing
    const periodicError = {
      ra: 0.5 * Math.sin(Date.now() / 60000), // 1-minute period
      dec: 0.2 * Math.cos(Date.now() / 120000) // 2-minute period
    };

    const atmosphericSeeing = {
      ra: (Math.random() - 0.5) * 2.0,
      dec: (Math.random() - 0.5) * 2.0
    };

    const totalError = {
      ra: periodicError.ra + atmosphericSeeing.ra,
      dec: periodicError.dec + atmosphericSeeing.dec
    };

    return {
      x: this.state.lockPosition.x + totalError.ra / 0.5, // Convert arcsec to pixels
      y: this.state.lockPosition.y + totalError.dec / 0.5
    };
  }

  private calculateCorrection(error: { ra: number; dec: number }): { ra: number; dec: number } {
    const correction = { ra: 0, dec: 0 };

    // Apply aggressiveness factor
    const aggressiveness = this.parameters.aggressiveness / 100.0;

    if (this.parameters.enableRAGuiding) {
      correction.ra = error.ra * aggressiveness;
      
      // Apply min/max move limits
      if (Math.abs(correction.ra) < this.parameters.minMove) {
        correction.ra = 0;
      } else if (Math.abs(correction.ra) > this.parameters.maxMove) {
        correction.ra = Math.sign(correction.ra) * this.parameters.maxMove;
      }
    }

    if (this.parameters.enableDecGuiding) {
      correction.dec = error.dec * aggressiveness;
      
      // Apply min/max move limits
      if (Math.abs(correction.dec) < this.parameters.minMove) {
        correction.dec = 0;
      } else if (Math.abs(correction.dec) > this.parameters.maxMove) {
        correction.dec = Math.sign(correction.dec) * this.parameters.maxMove;
      }
    }

    // Apply hysteresis
    if (this.parameters.hysteresis > 0) {
      const hysteresisThreshold = this.parameters.hysteresis / 100.0;
      if (Math.abs(error.ra) < hysteresisThreshold) correction.ra = 0;
      if (Math.abs(error.dec) < hysteresisThreshold) correction.dec = 0;
    }

    // Convert arcseconds to milliseconds (simplified)
    return {
      ra: correction.ra * 67, // ~67ms per arcsecond for typical mount
      dec: correction.dec * 67
    };
  }

  private updateGuidingStats(): void {
    if (!this.currentStats) return;

    const corrections = this.currentStats.corrections;
    if (corrections.ra.length === 0) return;

    // Calculate RMS
    const raSquaredSum = corrections.ra.reduce((sum, val) => sum + val * val, 0);
    const decSquaredSum = corrections.dec.reduce((sum, val) => sum + val * val, 0);
    
    this.currentStats.rmsRA = Math.sqrt(raSquaredSum / corrections.ra.length);
    this.currentStats.rmsDec = Math.sqrt(decSquaredSum / corrections.dec.length);
    this.currentStats.rmsTotal = Math.sqrt(this.currentStats.rmsRA ** 2 + this.currentStats.rmsDec ** 2);

    // Calculate max values
    this.currentStats.maxRA = Math.max(...corrections.ra.map(Math.abs));
    this.currentStats.maxDec = Math.max(...corrections.dec.map(Math.abs));

    // Calculate peak values (95th percentile)
    const sortedRA = [...corrections.ra].map(Math.abs).sort((a, b) => a - b);
    const sortedDec = [...corrections.dec].map(Math.abs).sort((a, b) => a - b);
    const p95Index = Math.floor(sortedRA.length * 0.95);
    
    this.currentStats.peakRA = sortedRA[p95Index] || 0;
    this.currentStats.peakDec = sortedDec[p95Index] || 0;
  }

  // Dithering
  async dither(offsetX?: number, offsetY?: number): Promise<void> {
    if (!this.state.isGuiding) {
      throw new Error('Not currently guiding');
    }

    const ditherX = offsetX ?? (Math.random() - 0.5) * this.parameters.ditherAmount * 2;
    const ditherY = offsetY ?? (Math.random() - 0.5) * this.parameters.ditherAmount * 2;

    this.state.status = 'dithering';
    this.state.statusMessage = `Dithering ${ditherX.toFixed(1)}, ${ditherY.toFixed(1)} pixels`;

    this.triggerEvent('dither_started', { offsetX: ditherX, offsetY: ditherY });

    try {
      // Simulate dither move
      await this.delay(2000);

      // Update lock position
      if (this.state.lockPosition) {
        this.state.lockPosition.x += ditherX;
        this.state.lockPosition.y += ditherY;
      }

      // Start settling
      this.state.status = 'settling';
      this.state.statusMessage = 'Settling after dither';
      
      await this.waitForSettle();

      this.state.status = 'guiding';
      this.state.statusMessage = 'Guiding resumed';

      // Record dither event
      if (this.currentStats) {
        this.currentStats.ditherEvents.push({
          timestamp: new Date(),
          offsetX: ditherX,
          offsetY: ditherY,
          settleTime: this.parameters.ditherSettleTime
        });
      }

      this.triggerEvent('dither_complete', { offsetX: ditherX, offsetY: ditherY });
    } catch (error) {
      this.state.status = 'error';
      this.state.statusMessage = 'Dither failed';
      this.triggerEvent('dither_failed', { error });
      throw error;
    }
  }

  private async waitForSettle(): Promise<void> {
    const settleStartTime = Date.now();
    const settleTimeout = this.parameters.ditherSettleTime * 1000;

    while (Date.now() - settleStartTime < settleTimeout) {
      const progress = ((Date.now() - settleStartTime) / settleTimeout) * 100;
      this.state.settleProgress = Math.min(100, progress);
      
      this.triggerEvent('settle_progress', { progress: this.state.settleProgress });
      
      await this.delay(100);
    }

    this.state.settleProgress = 0;
  }

  // Star selection
  selectGuideStar(x: number, y: number): void {
    // Simulate star detection at position
    const mass = 800 + Math.random() * 400;
    const snr = 15 + Math.random() * 25;

    this.state.currentStar = { x, y, mass, snr };
    this.state.statusMessage = `Guide star selected (SNR: ${snr.toFixed(1)})`;
    
    this.triggerEvent('star_selected', { 
      position: { x, y }, 
      mass, 
      snr 
    });
  }

  // Parameter management
  updateParameters(updates: Partial<GuidingParameters>): void {
    this.parameters = { ...this.parameters, ...updates };
    this.triggerEvent('parameters_updated', { parameters: this.parameters });
  }

  getParameters(): GuidingParameters {
    return { ...this.parameters };
  }

  // State access
  getState(): GuidingState {
    return { ...this.state };
  }

  getCurrentStats(): GuidingStats | null {
    return this.currentStats ? { ...this.currentStats } : null;
  }

  getGuidingHistory(): GuidingStats[] {
    return [...this.guidingHistory];
  }

  getCurrentCalibration(): GuidingCalibration | null {
    return this.currentCalibration ? { ...this.currentCalibration } : null;
  }

  getCalibrationHistory(): GuidingCalibration[] {
    return [...this.calibrationHistory];
  }

  // Event handling
  onEvent(callback: (event: string, data: any) => void): void {
    this.eventCallbacks.push(callback);
  }

  private triggerEvent(event: string, data: any): void {
    for (const callback of this.eventCallbacks) {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Event callback error:', error);
      }
    }
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Polar alignment methods
  async startPolarAlignment(method: 'drift' | 'platesolve' = 'drift'): Promise<PolarAlignmentData> {
    if (!this.state.isConnected) {
      throw new Error('Guiding camera not connected');
    }

    const alignmentData: PolarAlignmentData = {
      id: `polar_${Date.now()}`,
      timestamp: new Date(),
      method,
      azimuthError: 0,
      altitudeError: 0,
      totalError: 0,
      azimuthCorrection: 0,
      altitudeCorrection: 0,
      quality: 'fair',
      measurements: [],
      isComplete: false,
      notes: ''
    };

    this.state.status = 'calibrating';
    this.state.statusMessage = `Starting ${method} polar alignment`;
    
    this.triggerEvent('polar_alignment_started', { method, id: alignmentData.id });

    try {
      if (method === 'drift') {
        await this.performDriftAlignment(alignmentData);
      } else {
        await this.performPlatesolvingAlignment(alignmentData);
      }

      alignmentData.isComplete = true;
      this.state.status = 'idle';
      this.state.statusMessage = 'Polar alignment complete';
      
      this.triggerEvent('polar_alignment_complete', { alignmentData });
      return alignmentData;
    } catch (error) {
      this.state.status = 'error';
      this.state.statusMessage = 'Polar alignment failed';
      this.triggerEvent('polar_alignment_failed', { error });
      throw error;
    }
  }

  private async performDriftAlignment(alignmentData: PolarAlignmentData): Promise<void> {
    // Simulate drift alignment measurements
    const measurementDuration = 300000; // 5 minutes per measurement
    const measurements = ['east', 'west', 'meridian'];

    for (let i = 0; i < measurements.length; i++) {
      const direction = measurements[i];
      this.state.statusMessage = `Measuring drift - ${direction} position`;
      
      this.triggerEvent('drift_measurement_started', { 
        direction, 
        step: i + 1, 
        total: measurements.length 
      });

      // Simulate measurement
      await this.delay(5000); // Shortened for demo

      const measurement = {
        timestamp: new Date(),
        starPosition: { 
          x: 100 + Math.random() * 200, 
          y: 100 + Math.random() * 200 
        },
        hourAngle: (i - 1) * 90, // -90, 0, 90 degrees
        declination: 30 + Math.random() * 30,
        drift: {
          ra: (Math.random() - 0.5) * 10, // arcsec/min
          dec: (Math.random() - 0.5) * 10
        }
      };

      alignmentData.measurements.push(measurement);
      
      this.triggerEvent('drift_measurement_complete', { 
        direction, 
        measurement 
      });
    }

    // Calculate polar alignment errors
    this.calculatePolarAlignmentErrors(alignmentData);
  }

  private async performPlatesolvingAlignment(alignmentData: PolarAlignmentData): Promise<void> {
    // Simulate plate solving alignment
    this.state.statusMessage = 'Solving initial position';
    await this.delay(3000);

    // Take measurements at different hour angles
    for (let ha = -60; ha <= 60; ha += 30) {
      this.state.statusMessage = `Measuring at HA ${ha}°`;
      
      await this.delay(2000);

      const measurement = {
        timestamp: new Date(),
        starPosition: { 
          x: 100 + Math.random() * 200, 
          y: 100 + Math.random() * 200 
        },
        hourAngle: ha,
        declination: 30 + Math.random() * 30,
        drift: {
          ra: (Math.random() - 0.5) * 5,
          dec: (Math.random() - 0.5) * 5
        }
      };

      alignmentData.measurements.push(measurement);
    }

    this.calculatePolarAlignmentErrors(alignmentData);
  }

  private calculatePolarAlignmentErrors(alignmentData: PolarAlignmentData): void {
    // Simulate polar alignment error calculation
    alignmentData.azimuthError = Math.random() * 20; // 0-20 arcminutes
    alignmentData.altitudeError = Math.random() * 20;
    alignmentData.totalError = Math.sqrt(
      alignmentData.azimuthError ** 2 + alignmentData.altitudeError ** 2
    );

    // Calculate corrections (opposite of errors)
    alignmentData.azimuthCorrection = -alignmentData.azimuthError;
    alignmentData.altitudeCorrection = -alignmentData.altitudeError;

    // Determine quality
    if (alignmentData.totalError < 2) {
      alignmentData.quality = 'excellent';
    } else if (alignmentData.totalError < 5) {
      alignmentData.quality = 'good';
    } else if (alignmentData.totalError < 10) {
      alignmentData.quality = 'fair';
    } else {
      alignmentData.quality = 'poor';
    }
  }
}

// Export singleton instance
export const guidingEngine = new GuidingEngine();
export default GuidingEngine;
