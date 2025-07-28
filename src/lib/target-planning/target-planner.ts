export interface ObservatoryLocation {
  id: string;
  name: string;
  latitude: number; // degrees
  longitude: number; // degrees
  elevation: number; // meters
  timezone: string;
  horizonProfile?: { azimuth: number; altitude: number }[];
  lightPollution: 'excellent' | 'good' | 'moderate' | 'poor';
  seeingConditions: 'excellent' | 'good' | 'average' | 'poor';
}

export interface Target {
  id: string;
  name: string;
  commonName?: string;
  type: 'galaxy' | 'nebula' | 'star_cluster' | 'planetary_nebula' | 'supernova_remnant' | 'star' | 'planet' | 'comet' | 'asteroid';
  coordinates: {
    ra: number; // hours (0-24)
    dec: number; // degrees (-90 to +90)
    epoch: number; // e.g., 2000.0
  };
  magnitude: number;
  size: {
    major: number; // arcminutes
    minor: number; // arcminutes
    angle: number; // position angle in degrees
  };
  constellation: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'all';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  minAltitude: number; // minimum altitude for good imaging
  transitTime?: Date; // when target transits meridian
  riseTime?: Date;
  setTime?: Date;
  moonAvoidance: number; // minimum angular distance from moon (degrees)
  filters?: string[]; // recommended filters
  exposureRecommendations?: {
    filter: string;
    exposureTime: number; // seconds
    binning: number;
    gain?: number;
  }[];
  notes?: string;
}

export interface ImagingSession {
  id: string;
  targetId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  totalExposureTime: number; // minutes
  filters: {
    filter: string;
    exposureTime: number; // seconds
    count: number;
    binning: number;
    gain?: number;
  }[];
  meridianFlip?: {
    time: Date;
    duration: number; // minutes
  };
  conditions: {
    seeing: number; // arcseconds
    transparency: number; // 0-10 scale
    moonPhase: number; // 0-1
    moonAltitude: number; // degrees
    moonSeparation: number; // degrees from target
  };
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'weather_cancelled';
  notes?: string;
}

export interface PlanningConstraints {
  minAltitude: number; // degrees
  maxAirmass: number;
  moonAvoidance: number; // degrees
  maxMoonPhase: number; // 0-1
  minMoonSeparation: number; // degrees
  twilightType: 'civil' | 'nautical' | 'astronomical';
  maxCloudCover: number; // percentage
  minTransparency: number; // 0-10 scale
  maxSeeing: number; // arcseconds
  meridianFlipTolerance: number; // degrees past meridian
  sessionDuration: {
    min: number; // minutes
    max: number; // minutes
  };
}

export interface TargetVisibility {
  target: Target;
  isVisible: boolean;
  altitude: number; // degrees
  azimuth: number; // degrees
  airmass: number;
  hourAngle: number; // hours
  timeToMeridian: number; // hours (negative if past)
  timeToSet: number; // hours
  moonSeparation: number; // degrees
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
  recommendations: string[];
}

export interface SessionPlan {
  date: Date;
  sessions: ImagingSession[];
  totalImagingTime: number; // minutes
  targets: Target[];
  conditions: {
    moonPhase: number;
    moonrise: Date;
    moonset: Date;
    twilightStart: Date; // astronomical twilight
    twilightEnd: Date; // astronomical twilight
    weather: {
      cloudCover: number;
      seeing: number;
      transparency: number;
      humidity: number;
      temperature: number;
    };
  };
  meridianFlips: {
    time: Date;
    targetId: string;
    duration: number;
  }[];
  recommendations: string[];
  warnings: string[];
}

class TargetPlanner {
  private observatoryLocation: ObservatoryLocation;
  private defaultConstraints: PlanningConstraints = {
    minAltitude: 30,
    maxAirmass: 2.5,
    moonAvoidance: 30,
    maxMoonPhase: 0.7,
    minMoonSeparation: 45,
    twilightType: 'astronomical',
    maxCloudCover: 30,
    minTransparency: 6,
    maxSeeing: 4,
    meridianFlipTolerance: 15,
    sessionDuration: {
      min: 30,
      max: 480
    }
  };

  constructor(observatory: ObservatoryLocation) {
    this.observatoryLocation = observatory;
  }

  // Astronomical calculations
  private julianDate(date: Date): number {
    const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
    const y = date.getFullYear() + 4800 - a;
    const m = (date.getMonth() + 1) + 12 * a - 3;
    
    return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 +
           (date.getHours() - 12) / 24 + date.getMinutes() / 1440 + date.getSeconds() / 86400;
  }

  private localSiderealTime(date: Date): number {
    const jd = this.julianDate(date);
    const t = (jd - 2451545.0) / 36525;
    
    // Greenwich Mean Sidereal Time
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + 
               0.000387933 * t * t - t * t * t / 38710000;
    
    // Normalize to 0-360
    gmst = gmst % 360;
    if (gmst < 0) gmst += 360;
    
    // Convert to Local Sidereal Time
    const lst = gmst + this.observatoryLocation.longitude;
    return (lst % 360) / 15; // Convert to hours
  }

  private calculateAltAz(ra: number, dec: number, date: Date): { altitude: number; azimuth: number } {
    const lst = this.localSiderealTime(date);
    const hourAngle = (lst - ra) * 15; // Convert to degrees
    
    const lat = this.observatoryLocation.latitude * Math.PI / 180;
    const decRad = dec * Math.PI / 180;
    const haRad = hourAngle * Math.PI / 180;
    
    // Calculate altitude
    const sinAlt = Math.sin(decRad) * Math.sin(lat) + 
                   Math.cos(decRad) * Math.cos(lat) * Math.cos(haRad);
    const altitude = Math.asin(sinAlt) * 180 / Math.PI;
    
    // Calculate azimuth
    const cosAz = (Math.sin(decRad) - Math.sin(lat) * sinAlt) / 
                  (Math.cos(lat) * Math.cos(Math.asin(sinAlt)));
    let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI;
    
    if (Math.sin(haRad) > 0) {
      azimuth = 360 - azimuth;
    }
    
    return { altitude, azimuth };
  }

  private calculateAirmass(altitude: number): number {
    if (altitude <= 0) return Infinity;
    const zenithAngle = 90 - altitude;
    const zenithRad = zenithAngle * Math.PI / 180;
    
    // Kasten and Young formula
    return 1 / (Math.cos(zenithRad) + 0.50572 * Math.pow(96.07995 - zenithAngle, -1.6364));
  }

  private calculateMoonPosition(date: Date): { ra: number; dec: number; phase: number; illumination: number } {
    // Simplified moon position calculation
    const jd = this.julianDate(date);
    const t = (jd - 2451545.0) / 36525;
    
    // Moon's mean longitude
    const l = 218.3164477 + 481267.88123421 * t;
    
    // Moon's mean anomaly
    const m = 134.9633964 + 477198.8675055 * t;
    
    // Sun's mean anomaly
    const ms = 357.5291092 + 35999.0502909 * t;
    
    // Moon's argument of latitude
    const f = 93.2720950 + 483202.0175233 * t;
    
    // Moon's longitude
    const longitude = l + 6.288774 * Math.sin(m * Math.PI / 180) +
                     1.274027 * Math.sin((2 * l - m) * Math.PI / 180) +
                     0.658314 * Math.sin(2 * l * Math.PI / 180);
    
    // Moon's latitude
    const latitude = 5.128122 * Math.sin(f * Math.PI / 180);
    
    // Convert to RA/Dec (simplified)
    const ra = longitude / 15; // Convert to hours
    const dec = latitude;
    
    // Moon phase calculation
    const phase = (jd - 2451550.1) / 29.530588853;
    const phaseAngle = (phase - Math.floor(phase)) * 2 * Math.PI;
    const illumination = (1 + Math.cos(phaseAngle)) / 2;
    
    return { ra: ra % 24, dec, phase: phase % 1, illumination };
  }

  private calculateTwilightTimes(date: Date): { start: Date; end: Date } {
    // Simplified twilight calculation
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);
    
    // Approximate astronomical twilight times
    const start = new Date(baseDate);
    start.setHours(20, 0, 0, 0); // 8 PM
    
    const end = new Date(baseDate);
    end.setDate(end.getDate() + 1);
    end.setHours(5, 0, 0, 0); // 5 AM next day
    
    return { start, end };
  }

  calculateTargetVisibility(target: Target, date: Date, constraints: Partial<PlanningConstraints> = {}): TargetVisibility {
    const fullConstraints = { ...this.defaultConstraints, ...constraints };
    const { altitude, azimuth } = this.calculateAltAz(target.coordinates.ra, target.coordinates.dec, date);
    const airmass = this.calculateAirmass(altitude);
    
    // Calculate hour angle
    const lst = this.localSiderealTime(date);
    const hourAngle = lst - target.coordinates.ra;
    
    // Time to meridian (when hour angle = 0)
    let timeToMeridian = -hourAngle;
    if (timeToMeridian > 12) timeToMeridian -= 24;
    if (timeToMeridian < -12) timeToMeridian += 24;
    
    // Moon position and separation
    const moon = this.calculateMoonPosition(date);
    const moonSeparation = this.calculateAngularSeparation(
      target.coordinates.ra * 15, target.coordinates.dec,
      moon.ra * 15, moon.dec
    );
    
    // Visibility assessment
    const issues: string[] = [];
    const recommendations: string[] = [];
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    
    const isVisible = altitude >= fullConstraints.minAltitude;
    
    if (!isVisible) {
      issues.push(`Target below minimum altitude (${altitude.toFixed(1)}° < ${fullConstraints.minAltitude}°)`);
      quality = 'poor';
    }
    
    if (airmass > fullConstraints.maxAirmass) {
      issues.push(`High airmass (${airmass.toFixed(2)} > ${fullConstraints.maxAirmass})`);
      if (quality === 'excellent') quality = 'fair';
    }
    
    if (moonSeparation < fullConstraints.minMoonSeparation) {
      issues.push(`Too close to moon (${moonSeparation.toFixed(1)}° < ${fullConstraints.minMoonSeparation}°)`);
      if (quality === 'excellent') quality = 'good';
    }
    
    if (moon.illumination > fullConstraints.maxMoonPhase) {
      issues.push(`Moon too bright (${(moon.illumination * 100).toFixed(0)}% illuminated)`);
      if (quality === 'excellent') quality = 'good';
    }
    
    // Recommendations
    if (timeToMeridian > 0 && timeToMeridian < 4) {
      recommendations.push(`Best viewing in ${timeToMeridian.toFixed(1)} hours (at meridian)`);
    }
    
    if (airmass < 1.5) {
      recommendations.push('Excellent atmospheric conditions');
    } else if (airmass < 2.0) {
      recommendations.push('Good atmospheric conditions');
    }
    
    return {
      target,
      isVisible,
      altitude,
      azimuth,
      airmass,
      hourAngle,
      timeToMeridian,
      timeToSet: 12 - timeToMeridian, // Simplified
      moonSeparation,
      quality,
      issues,
      recommendations
    };
  }

  private calculateAngularSeparation(ra1: number, dec1: number, ra2: number, dec2: number): number {
    const ra1Rad = ra1 * Math.PI / 180;
    const dec1Rad = dec1 * Math.PI / 180;
    const ra2Rad = ra2 * Math.PI / 180;
    const dec2Rad = dec2 * Math.PI / 180;
    
    const cosDistance = Math.sin(dec1Rad) * Math.sin(dec2Rad) + 
                       Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.cos(ra1Rad - ra2Rad);
    
    return Math.acos(Math.max(-1, Math.min(1, cosDistance))) * 180 / Math.PI;
  }

  planOptimalSession(
    targets: Target[], 
    date: Date, 
    constraints: Partial<PlanningConstraints> = {}
  ): SessionPlan {
    const fullConstraints = { ...this.defaultConstraints, ...constraints };
    const twilight = this.calculateTwilightTimes(date);
    const moon = this.calculateMoonPosition(date);
    
    // Calculate visibility for all targets throughout the night
    const sessions: ImagingSession[] = [];
    const availableTargets: Target[] = [];
    const meridianFlips: { time: Date; targetId: string; duration: number }[] = [];
    
    // Check each target's visibility window
    for (const target of targets) {
      const visibility = this.calculateTargetVisibility(target, date, constraints);
      
      if (visibility.isVisible && visibility.quality !== 'poor') {
        availableTargets.push(target);
        
        // Calculate optimal imaging window
        const sessionStart = new Date(twilight.start);
        const sessionEnd = new Date(twilight.end);
        
        // Check if meridian flip is needed
        if (visibility.timeToMeridian > 0 && visibility.timeToMeridian < 8) {
          const flipTime = new Date(date);
          flipTime.setTime(flipTime.getTime() + visibility.timeToMeridian * 60 * 60 * 1000);
          
          meridianFlips.push({
            time: flipTime,
            targetId: target.id,
            duration: 5 // 5 minutes for flip
          });
        }
        
        // Create imaging session
        const session: ImagingSession = {
          id: `session_${target.id}_${date.toISOString().split('T')[0]}`,
          targetId: target.id,
          date,
          startTime: sessionStart,
          endTime: sessionEnd,
          totalExposureTime: 120, // 2 hours default
          filters: target.exposureRecommendations || [
            { filter: 'L', exposureTime: 300, count: 24, binning: 1 }
          ],
          conditions: {
            seeing: 2.5,
            transparency: 7,
            moonPhase: moon.illumination,
            moonAltitude: this.calculateAltAz(moon.ra, moon.dec, date).altitude,
            moonSeparation: visibility.moonSeparation
          },
          status: 'planned'
        };
        
        sessions.push(session);
      }
    }
    
    // Sort sessions by priority (altitude, moon separation, etc.)
    sessions.sort((a, b) => {
      const visA = this.calculateTargetVisibility(
        targets.find(t => t.id === a.targetId)!, date, constraints
      );
      const visB = this.calculateTargetVisibility(
        targets.find(t => t.id === b.targetId)!, date, constraints
      );
      
      // Prioritize by quality, then by altitude
      const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1 };
      const qualityDiff = qualityOrder[visB.quality] - qualityOrder[visA.quality];
      if (qualityDiff !== 0) return qualityDiff;
      
      return visB.altitude - visA.altitude;
    });
    
    const recommendations: string[] = [];
    const warnings: string[] = [];
    
    if (moon.illumination > 0.7) {
      warnings.push('Bright moon may affect deep-sky imaging');
      recommendations.push('Consider narrowband filters or lunar imaging');
    }
    
    if (availableTargets.length === 0) {
      warnings.push('No suitable targets available for this date');
      recommendations.push('Try a different date or adjust constraints');
    }
    
    if (meridianFlips.length > 0) {
      recommendations.push(`${meridianFlips.length} meridian flip(s) scheduled`);
    }
    
    return {
      date,
      sessions: sessions.slice(0, 3), // Limit to top 3 targets
      totalImagingTime: sessions.reduce((total, session) => total + session.totalExposureTime, 0),
      targets: availableTargets,
      conditions: {
        moonPhase: moon.illumination,
        moonrise: new Date(date.getTime() + 18 * 60 * 60 * 1000), // Simplified
        moonset: new Date(date.getTime() + 6 * 60 * 60 * 1000), // Simplified
        twilightStart: twilight.start,
        twilightEnd: twilight.end,
        weather: {
          cloudCover: 20,
          seeing: 2.5,
          transparency: 7,
          humidity: 65,
          temperature: 15
        }
      },
      meridianFlips,
      recommendations,
      warnings
    };
  }

  planMultiNightSession(
    targets: Target[],
    startDate: Date,
    numberOfNights: number,
    constraints: Partial<PlanningConstraints> = {}
  ): SessionPlan[] {
    const plans: SessionPlan[] = [];
    
    for (let i = 0; i < numberOfNights; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const plan = this.planOptimalSession(targets, currentDate, constraints);
      plans.push(plan);
    }
    
    return plans;
  }

  findBestImagingDates(
    target: Target,
    startDate: Date,
    endDate: Date,
    constraints: Partial<PlanningConstraints> = {}
  ): { date: Date; quality: 'excellent' | 'good' | 'fair' | 'poor'; score: number }[] {
    const results: { date: Date; quality: 'excellent' | 'good' | 'fair' | 'poor'; score: number }[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const visibility = this.calculateTargetVisibility(target, currentDate, constraints);
      
      if (visibility.isVisible) {
        // Calculate quality score
        let score = 100;
        score -= Math.max(0, (visibility.airmass - 1) * 20); // Airmass penalty
        score -= Math.max(0, (45 - visibility.moonSeparation) * 2); // Moon separation penalty
        score += Math.min(20, visibility.altitude - 30); // Altitude bonus
        
        results.push({
          date: new Date(currentDate),
          quality: visibility.quality,
          score: Math.max(0, Math.min(100, score))
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return results.sort((a, b) => b.score - a.score);
  }
}

export default TargetPlanner;

// Export singleton instance with default observatory
export const targetPlanner = new TargetPlanner({
  id: 'default_observatory',
  name: 'Default Observatory',
  latitude: 40.7128,
  longitude: -74.0060,
  elevation: 100,
  timezone: 'America/New_York',
  lightPollution: 'moderate',
  seeingConditions: 'average'
});
