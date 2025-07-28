import { Target } from '../target-planning/target-database';
import { EquipmentProfile } from '../stores/equipment-store';
import { WeatherConditions, AstronomicalConditions } from '../weather/weather-service';

export interface OptimizationParameters {
  sessionStart: Date;
  sessionEnd: Date;
  minAltitude: number; // degrees
  maxAirmass: number;
  prioritizeTransit: boolean;
  allowTargetSwitching: boolean;
  minTargetDuration: number; // minutes
  setupTime: number; // minutes
  weather: WeatherConditions;
}

export interface OptimizedSession {
  targets: OptimizedTarget[];
  timeline: any[]; // Timeline of events
  totalDuration: number; // minutes
  efficiency: number; // percentage 0-100
  estimatedCompletion: number; // percentage
  qualityScore: number; // 0-100
  recommendations: string[];
  warnings: string[];
}

export interface OptimizedTarget {
  target: Target;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  altitude: number; // degrees at start
  airmass: number;
  priority: number; // 1-10
  filters: string[];
  exposureSettings: {
    exposureTime: number; // seconds
    frameCount: number;
    totalTime: number; // minutes
  };
  qualityPrediction: number; // 0-100
}

export class TargetOptimizer {
  private location: { latitude: number; longitude: number };
  private timezone: string;

  constructor(location: { latitude: number; longitude: number; timezone: string }) {
    this.location = { latitude: location.latitude, longitude: location.longitude };
    this.timezone = location.timezone;
  }

  optimizeSession(
    targets: Target[],
    equipment: EquipmentProfile,
    parameters: OptimizationParameters
  ): OptimizedSession {
    // Input validation
    if (!equipment) {
      throw new Error('Equipment profile is required');
    }
    if (!parameters) {
      throw new Error('Optimization parameters are required');
    }
    if (!parameters.sessionStart || !parameters.sessionEnd) {
      throw new Error('Session start and end times are required');
    }

    const sessionStart = parameters.sessionStart;
    const sessionEnd = parameters.sessionEnd;
    const sessionDuration = Math.max(0, (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60));

    const optimizedTargets: OptimizedTarget[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Handle invalid date ranges
    if (sessionDuration <= 0) {
      warnings.push('Invalid session duration: end time must be after start time');
      return {
        targets: [],
        timeline: [],
        totalDuration: 0,
        efficiency: 0,
        estimatedCompletion: 0,
        qualityScore: 0,
        recommendations: ['Check session start and end times'],
        warnings
      };
    }

    // Filter targets by visibility and constraints
    let viableTargets = this.filterViableTargets(
      targets,
      sessionStart,
      sessionEnd,
      parameters
    );

    // If no targets meet strict constraints, try progressively relaxed constraints
    if (viableTargets.length === 0) {
      // Try with slightly relaxed constraints first
      const relaxedParams1 = { ...parameters, minAltitude: Math.max(15, parameters.minAltitude - 10), maxAirmass: Math.min(3.0, parameters.maxAirmass + 0.5) };
      viableTargets = this.filterViableTargets(targets, sessionStart, sessionEnd, relaxedParams1);

      if (viableTargets.length > 0) {
        warnings.push('Using slightly relaxed constraints to find viable targets');
      } else if (parameters.minAltitude <= 30 && parameters.maxAirmass >= 2.0) {
        // Try with more relaxed constraints
        const relaxedParams2 = { ...parameters, minAltitude: 10, maxAirmass: 3.5 };
        viableTargets = this.filterViableTargets(targets, sessionStart, sessionEnd, relaxedParams2);

        if (viableTargets.length > 0) {
          warnings.push('Using relaxed constraints to find viable targets');
        } else {
          // Last resort: use all targets with minimal constraints
          viableTargets = targets.filter(target => target.magnitude < 15); // Just filter out very faint targets
          if (viableTargets.length > 0) {
            warnings.push('Using minimal constraints - targets may not be optimally positioned');
          }
        }
      }

      if (viableTargets.length === 0) {
        warnings.push('No targets meet the current constraints');
        return {
          targets: [],
          timeline: [],
          totalDuration: Math.abs(0),
          efficiency: 0,
          estimatedCompletion: 0,
          qualityScore: 0,
          recommendations: ['Consider relaxing altitude or airmass constraints'],
          warnings
        };
      }
    }

    // Calculate optimal imaging windows for each target
    const targetWindows = viableTargets.map(target =>
      this.calculateImagingWindow(target, sessionStart, sessionEnd, parameters)
    );

    // Sort by priority and quality
    let sortedWindows = targetWindows
      .filter(window => window.duration > parameters.minTargetDuration) // Use parameter minimum
      .sort((a, b) => b.qualityPrediction - a.qualityPrediction);

    // If no windows meet the minimum duration, try with shorter durations
    if (sortedWindows.length === 0) {
      sortedWindows = targetWindows
        .filter(window => window.duration > 30) // Minimum 30 minutes
        .sort((a, b) => b.qualityPrediction - a.qualityPrediction);

      if (sortedWindows.length > 0) {
        warnings.push('Using shorter exposure durations due to constraints');
      }
    }

    // If still no windows, use all available windows
    if (sortedWindows.length === 0) {
      sortedWindows = targetWindows
        .filter(window => window.duration > 0)
        .sort((a, b) => b.qualityPrediction - a.qualityPrediction);

      if (sortedWindows.length > 0) {
        warnings.push('Using all available imaging windows regardless of duration');
      }
    }

    // Allocate time to targets
    let remainingTime = sessionDuration;
    let currentTime = new Date(sessionStart);

    for (const window of sortedWindows) {
      if (remainingTime < 30) break; // Not enough time for meaningful imaging

      const allocatedTime = Math.min(
        window.duration,
        remainingTime,
        parameters.maxImagingTime
      );

      if (allocatedTime >= 30) {
        const optimizedTarget: OptimizedTarget = {
          ...window,
          startTime: new Date(currentTime),
          endTime: new Date(currentTime.getTime() + allocatedTime * 60 * 1000),
          duration: allocatedTime,
          exposureSettings: this.calculateExposureSettings(
            window.target,
            equipment,
            allocatedTime
          )
        };

        optimizedTargets.push(optimizedTarget);
        remainingTime -= allocatedTime;
        currentTime = new Date(currentTime.getTime() + allocatedTime * 60 * 1000);
      }
    }

    // Generate recommendations
    if (optimizedTargets.length === 0) {
      recommendations.push('Consider extending session duration or relaxing constraints');
    } else {
      recommendations.push(...this.generateRecommendations(optimizedTargets, parameters));
    }

    // Calculate quality metrics
    const totalDuration = Math.max(0, optimizedTargets.reduce((sum, t) => sum + t.duration, 0));
    const avgQuality = optimizedTargets.reduce((sum, t) => sum + t.qualityPrediction, 0) / optimizedTargets.length || 0;
    const completion = (totalDuration / sessionDuration) * 100;
    const efficiency = Math.min(100, completion); // Efficiency is how well we use the available time

    // Create timeline
    const timeline = optimizedTargets.map(target => ({
      startTime: target.startTime,
      endTime: target.endTime,
      target: target.target.name,
      type: 'imaging'
    }));

    return {
      targets: optimizedTargets,
      timeline,
      totalDuration,
      efficiency,
      estimatedCompletion: completion,
      qualityScore: avgQuality,
      recommendations,
      warnings
    };
  }

  private filterViableTargets(
    targets: Target[],
    sessionStart: Date,
    sessionEnd: Date,
    parameters: OptimizationParameters
  ): Target[] {
    return targets.filter(target => {
      // Check if target is above minimum altitude during session
      const midSession = new Date((sessionStart.getTime() + sessionEnd.getTime()) / 2);
      const altitude = this.calculateAltitudeForTarget(target, midSession);
      const airmass = this.calculateAirmass(altitude);

      return altitude >= parameters.minAltitude &&
             airmass <= parameters.maxAirmass;
    });
  }

  private calculateImagingWindow(
    target: Target,
    sessionStart: Date,
    sessionEnd: Date,
    parameters: OptimizationParameters
  ): OptimizedTarget {
    const midSession = new Date((sessionStart.getTime() + sessionEnd.getTime()) / 2);
    const altitude = this.calculateAltitude(target, midSession);
    const airmass = this.calculateAirmass(altitude);
    
    // Calculate quality prediction based on various factors
    let qualityPrediction = 70; // Base quality

    // Altitude bonus
    if (altitude > 60) qualityPrediction += 15;
    else if (altitude > 45) qualityPrediction += 10;
    else if (altitude < 30) qualityPrediction -= 10;

    // Airmass penalty
    if (airmass > 2) qualityPrediction -= 15;
    else if (airmass > 1.5) qualityPrediction -= 5;

    // Target brightness
    if (target.magnitude < 8) qualityPrediction += 10;
    else if (target.magnitude > 12) qualityPrediction -= 10;

    const sessionDuration = (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60);
    const estimatedDuration = Math.min(sessionDuration, this.estimateOptimalDuration(target));

    return {
      target,
      startTime: sessionStart,
      endTime: sessionEnd,
      duration: estimatedDuration,
      altitude,
      airmass,
      priority: this.calculatePriority(target, altitude, airmass),
      filters: this.recommendFilters(target),
      exposureSettings: {
        exposureTime: 300, // Will be calculated properly
        frameCount: 0,
        totalTime: 0
      },
      qualityPrediction: Math.max(0, Math.min(100, qualityPrediction))
    };
  }

  private calculateExposureSettings(
    target: Target,
    equipment: EquipmentProfile,
    duration: number
  ) {
    // Base exposure time based on target type and equipment
    let exposureTime = 300; // 5 minutes default

    if (target.type === 'galaxy' && target.magnitude > 10) {
      exposureTime = 600; // 10 minutes for faint galaxies
    } else if (target.type === 'planetary nebula') {
      exposureTime = 180; // 3 minutes for planetary nebulae
    } else if (target.type === 'emission nebula') {
      exposureTime = 900; // 15 minutes for emission nebulae
    }

    // Adjust for equipment
    if (equipment.telescope?.aperture && equipment.telescope.aperture < 100) {
      exposureTime *= 1.5; // Longer exposures for smaller telescopes
    }

    const frameCount = Math.floor((duration * 60) / exposureTime);
    const totalTime = (frameCount * exposureTime) / 60;

    return {
      exposureTime,
      frameCount,
      totalTime
    };
  }

  private generateRecommendations(
    targets: OptimizedTarget[],
    parameters: OptimizationParameters
  ): string[] {
    const recommendations: string[] = [];

    if (targets.length === 1) {
      recommendations.push('Consider adding more targets for variety');
    }

    const avgAirmass = targets.reduce((sum, t) => sum + t.airmass, 0) / targets.length;
    if (avgAirmass > 1.8) {
      recommendations.push('High airmass detected - consider waiting for better positioning');
    }

    const totalDuration = targets.reduce((sum, t) => sum + t.duration, 0);
    if (totalDuration < parameters.maxImagingTime * 0.8) {
      recommendations.push('Session could be extended for better results');
    }

    return recommendations;
  }

  // Astronomical calculation helpers

  private calculateAirmass(altitude: number): number {
    if (altitude <= 0) return 999;
    return 1 / Math.sin(altitude * Math.PI / 180);
  }

  private calculateHourAngle(target: Target, time: Date): number {
    // Simplified hour angle calculation
    const lst = this.calculateLocalSiderealTime(time);
    return lst - target.coordinates.ra;
  }

  private calculateHourAngleForCoordinates(
    coordinates: { ra: number; dec: number },
    location: { latitude: number; longitude: number },
    time: Date
  ): number {
    // Simplified hour angle calculation
    const lst = this.calculateLocalSiderealTimeForLocation(location, time);
    return lst - coordinates.ra;
  }

  private calculateLocalSiderealTimeForLocation(
    location: { latitude: number; longitude: number },
    time: Date
  ): number {
    // Simplified LST calculation
    const jd = this.dateToJulianDay(time);
    const t = (jd - 2451545.0) / 36525.0;
    const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - t * t * t / 38710000.0;
    const lst = gmst + location.longitude;
    return ((lst % 360) + 360) % 360; // Normalize to 0-360 degrees
  }

  private calculateLocalSiderealTime(time: Date): number {
    // Simplified LST calculation
    const jd = this.dateToJulianDay(time);
    const t = (jd - 2451545.0) / 36525;
    const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * t * t;
    return (gmst + this.location.longitude) % 360;
  }

  private dateToJulianDay(date: Date): number {
    // Ensure we have a Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    return (dateObj.getTime() / 86400000) + 2440587.5;
  }

  private calculatePriority(target: Target, altitude: number, airmass: number): number {
    let priority = 5; // Base priority

    if (altitude > 60) priority += 2;
    if (airmass < 1.3) priority += 2;
    if (target.magnitude < 8) priority += 1;

    return Math.max(1, Math.min(10, priority));
  }

  private recommendFilters(target: Target): string[] {
    if (target.type === 'emission nebula') return ['Ha', 'OIII', 'SII'];
    if (target.type === 'galaxy') return ['L', 'R', 'G', 'B'];
    if (target.type === 'planetary nebula') return ['OIII', 'Ha'];
    return ['L', 'R', 'G', 'B'];
  }

  private estimateOptimalDuration(target: Target): number {
    let duration = 120; // 2 hours base

    if (target.magnitude > 10) duration += 60;
    if (target.magnitude > 12) duration += 120;
    if (target.size < 5) duration += 60;

    return duration;
  }

  // Public methods expected by tests
  calculateAltitude(
    coordinates: { ra: number; dec: number },
    location: { latitude: number; longitude: number },
    time: Date
  ): number {
    // Simplified altitude calculation
    // In a real implementation, this would use proper astronomical calculations
    const hourAngle = this.calculateHourAngleForCoordinates(coordinates, location, time);
    const dec = coordinates.dec;
    const lat = location.latitude;

    const altitude = Math.asin(
      Math.sin(dec * Math.PI / 180) * Math.sin(lat * Math.PI / 180) +
      Math.cos(dec * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
    ) * 180 / Math.PI;

    return Math.max(0, altitude);
  }

  // Helper method for internal use with Target objects
  private calculateAltitudeForTarget(target: Target, time: Date): number {
    return this.calculateAltitude(target.coordinates, this.location, time);
  }

  calculateTransitTime(
    coordinates: { ra: number; dec: number },
    location: { latitude: number; longitude: number },
    date: Date
  ): Date {
    // Calculate when the object transits (crosses the meridian)
    const lst = this.calculateLocalSiderealTime(date);
    const hourAngleAtTransit = 0; // Object is on meridian when hour angle = 0
    const targetRA = coordinates.ra;

    // Calculate time difference to transit
    let timeDiff = (targetRA - lst) / 15; // Convert degrees to hours

    // Ensure we get the next transit (within 24 hours)
    if (timeDiff < 0) timeDiff += 24;
    if (timeDiff > 24) timeDiff -= 24;

    return new Date(date.getTime() + timeDiff * 60 * 60 * 1000);
  }

  optimizeExposureSettings(
    target: Target,
    equipment: EquipmentProfile,
    weather: WeatherConditions
  ) {
    let exposureTime = 300; // 5 minutes default
    let gain = 100;
    let binning = 1;
    let filterSequence = ['L', 'R', 'G', 'B'];

    // Adjust based on target type
    if (target.type === 'galaxy') {
      exposureTime = target.magnitude > 10 ? 600 : 480;
      filterSequence = ['L', 'R', 'G', 'B'];
    } else if (target.type === 'nebula' || target.type === 'emission nebula') {
      exposureTime = 900;
      filterSequence = ['Ha', 'OIII', 'SII'];
    } else if (target.type === 'planetary nebula') {
      exposureTime = 180;
      filterSequence = ['OIII', 'Ha'];
    }

    // Adjust for weather conditions
    if (weather.seeing > 4) {
      binning = 2; // Use binning in poor seeing
      exposureTime = Math.max(120, exposureTime * 0.7); // Shorter exposures
    }

    if (weather.transparency < 5) {
      exposureTime = Math.min(1200, exposureTime * 1.3); // Longer exposures for poor transparency
    }

    // Adjust for equipment
    if (equipment.telescope?.aperture && equipment.telescope.aperture < 100) {
      exposureTime *= 1.5; // Longer exposures for smaller telescopes
    }

    if (!equipment.camera) {
      // Default settings when camera info is missing
      gain = 100;
      binning = 1;
    } else {
      // Optimize based on camera capabilities
      if (equipment.camera.cooled) {
        gain = 50; // Lower gain for cooled cameras
      }
    }

    return {
      exposureTime: Math.round(exposureTime),
      gain,
      binning,
      filterSequence
    };
  }

  calculateImageScale(equipment: EquipmentProfile): number {
    if (!equipment.telescope || !equipment.camera) {
      return 0; // Cannot calculate without both telescope and camera
    }

    const focalLength = equipment.telescope.focalLength;
    const pixelSize = equipment.camera.pixelSize || 3.8; // Default pixel size in microns

    // Image scale in arcseconds per pixel
    const imageScale = (pixelSize / focalLength) * 206.265;

    return imageScale;
  }

  calculateFieldOfView(equipment: EquipmentProfile) {
    const imageScale = this.calculateImageScale(equipment);

    if (imageScale === 0 || !equipment.camera) {
      return { width: 0, height: 0 };
    }

    const camera = equipment.camera;
    const width = (camera.resolution.width * imageScale) / 60; // Convert to arcminutes
    const height = (camera.resolution.height * imageScale) / 60; // Convert to arcminutes

    return {
      width: Math.round(width * 100) / 100,
      height: Math.round(height * 100) / 100
    };
  }

  private calculateImagingWindow(
    target: Target,
    sessionStart: Date,
    sessionEnd: Date,
    parameters: OptimizationParameters
  ) {
    // Calculate when target is best positioned during the session
    const sessionDuration = (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60);
    const midSession = new Date((sessionStart.getTime() + sessionEnd.getTime()) / 2);

    // Calculate altitude at mid-session
    const altitude = this.calculateAltitudeForTarget(target, midSession);
    const airmass = this.calculateAirmass(altitude);

    // Estimate optimal duration based on target properties
    const optimalDuration = this.estimateOptimalDuration(target);
    const actualDuration = Math.min(optimalDuration, sessionDuration / 3); // Don't use more than 1/3 of session

    // Calculate quality prediction
    let qualityPrediction = 50; // Base quality
    if (altitude > 45) qualityPrediction += 20;
    if (airmass < 1.5) qualityPrediction += 15;
    if (target.magnitude < 8) qualityPrediction += 10;

    // Weather adjustments
    if (parameters.weather) {
      if (parameters.weather.seeing < 3) qualityPrediction += 10;
      if (parameters.weather.transparency > 7) qualityPrediction += 10;
      if (parameters.weather.cloudCover < 20) qualityPrediction += 5;
    }

    return {
      target,
      startTime: sessionStart,
      endTime: new Date(sessionStart.getTime() + actualDuration * 60 * 1000),
      duration: actualDuration,
      qualityPrediction: Math.max(0, Math.min(100, qualityPrediction))
    };
  }

  private calculatePriority(target: Target, altitude: number, airmass: number): number {
    let priority = 50; // Base priority

    // Higher priority for better altitude
    if (altitude > 60) priority += 20;
    else if (altitude > 45) priority += 10;
    else if (altitude > 30) priority += 5;

    // Lower priority for higher airmass
    if (airmass < 1.2) priority += 15;
    else if (airmass < 1.5) priority += 10;
    else if (airmass < 2.0) priority += 5;

    // Adjust for target type
    if (target.type === 'galaxy') priority += 5;
    if (target.type === 'nebula') priority += 10;

    return Math.max(0, Math.min(100, priority));
  }
}
