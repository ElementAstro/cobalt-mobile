import {
  Target,
  TargetCoordinates,
  TargetMetadata,
  ObservabilityData,
  TargetLibrary,
  TargetSearchOptions,
  TargetImportData,
  ObservabilityCalculation
} from '../types/sequencer.types';
import { generateId, parseRA, parseDec, formatRA, formatDec } from '../utils/sequencer.utils';



export class TargetService {
  private static readonly BUILT_IN_TARGETS: TargetImportData[] = [
    {
      name: 'M31 - Andromeda Galaxy',
      ra: '00h 42m 44s',
      dec: '+41° 16\' 09"',
      type: 'dso',
      magnitude: 3.4,
      size: { major: 190, minor: 60, angle: 35 },
      commonNames: ['Andromeda Galaxy', 'NGC 224'],
      catalogIds: ['M31', 'NGC 224', 'UGC 454'],
      constellation: 'Andromeda',
      notes: 'Nearest major galaxy to the Milky Way',
    },
    {
      name: 'M42 - Orion Nebula',
      ra: '05h 35m 17s',
      dec: '-05° 23\' 14"',
      type: 'dso',
      magnitude: 4.0,
      size: { major: 85, minor: 60, angle: 0 },
      commonNames: ['Orion Nebula', 'NGC 1976'],
      catalogIds: ['M42', 'NGC 1976'],
      constellation: 'Orion',
      notes: 'Famous star-forming region',
    },
    {
      name: 'M13 - Hercules Globular Cluster',
      ra: '16h 41m 41s',
      dec: '+36° 27\' 37"',
      type: 'dso',
      magnitude: 5.8,
      size: { major: 20, minor: 20, angle: 0 },
      commonNames: ['Hercules Cluster', 'NGC 6205'],
      catalogIds: ['M13', 'NGC 6205'],
      constellation: 'Hercules',
      notes: 'Brightest globular cluster in northern hemisphere',
    },
    {
      name: 'Jupiter',
      ra: '12h 30m 00s', // This would be calculated dynamically
      dec: '+15° 00\' 00"',
      type: 'planet',
      magnitude: -2.5,
      commonNames: ['Jupiter'],
      notes: 'Largest planet in the solar system',
    },
    {
      name: 'Saturn',
      ra: '14h 15m 00s', // This would be calculated dynamically
      dec: '+10° 30\' 00"',
      type: 'planet',
      magnitude: 0.5,
      commonNames: ['Saturn'],
      notes: 'Ringed planet',
    },
  ];

  // Target creation and management
  static createTarget(data: TargetImportData): Target {
    const coordinates = this.parseCoordinates(data.ra, data.dec);
    
    return {
      id: generateId(),
      name: data.name,
      type: (data.type as any) || 'custom',
      coordinates,
      metadata: {
        commonNames: data.commonNames || [],
        catalogIds: data.catalogIds || [],
        constellation: data.constellation,
        magnitude: data.magnitude,
        size: data.size,
        notes: data.notes,
        tags: [],
      },
      created: new Date(),
      modified: new Date(),
    };
  }

  static parseCoordinates(ra: string | number, dec: string | number): TargetCoordinates {
    let raHours: number;
    let decDegrees: number;

    if (typeof ra === 'string') {
      raHours = parseRA(ra);
    } else {
      raHours = ra;
    }

    if (typeof dec === 'string') {
      decDegrees = parseDec(dec);
    } else {
      decDegrees = dec;
    }

    return {
      ra: raHours,
      dec: decDegrees,
      epoch: 2000.0, // J2000.0
    };
  }

  static formatCoordinates(coordinates: TargetCoordinates): { ra: string; dec: string } {
    return {
      ra: formatRA(coordinates.ra),
      dec: formatDec(coordinates.dec),
    };
  }

  // Target search and filtering
  static searchTargets(targets: Target[], options: TargetSearchOptions): Target[] {
    return targets.filter(target => {
      // Text search
      if (options.query) {
        const query = options.query.toLowerCase();
        const matchesName = target.name.toLowerCase().includes(query);
        const matchesCommonNames = target.metadata.commonNames?.some(name =>
          name.toLowerCase().includes(query)
        );
        const matchesCatalogIds = target.metadata.catalogIds?.some(id =>
          id.toLowerCase().includes(query)
        );
        const matchesNotes = target.metadata.notes?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesCommonNames && !matchesCatalogIds && !matchesNotes) {
          return false;
        }
      }

      // Type filter
      if (options.type && target.type !== options.type) {
        return false;
      }

      // Constellation filter
      if (options.constellation && target.metadata.constellation !== options.constellation) {
        return false;
      }

      // Magnitude filter
      if (options.magnitude && target.metadata.magnitude !== undefined) {
        const mag = target.metadata.magnitude;
        if (options.magnitude.min !== undefined && mag < options.magnitude.min) {
          return false;
        }
        if (options.magnitude.max !== undefined && mag > options.magnitude.max) {
          return false;
        }
      }

      // Size filter
      if (options.size && target.metadata.size) {
        const size = Math.max(target.metadata.size.major, target.metadata.size.minor);
        if (options.size.min !== undefined && size < options.size.min) {
          return false;
        }
        if (options.size.max !== undefined && size > options.size.max) {
          return false;
        }
      }

      // Tags filter
      if (options.tags && options.tags.length > 0) {
        const hasMatchingTag = options.tags.some(tag =>
          target.metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Catalogs filter
      if (options.catalogs && options.catalogs.length > 0) {
        const hasMatchingCatalog = options.catalogs.some(catalog =>
          target.metadata.catalogIds?.some(id => id.startsWith(catalog))
        );
        if (!hasMatchingCatalog) return false;
      }

      return true;
    });
  }

  // Observability calculations
  static calculateObservability(
    target: Target,
    calculation: ObservabilityCalculation
  ): ObservabilityData {
    const { latitude, longitude, date } = calculation;
    
    // Convert coordinates to radians
    const raRad = (target.coordinates.ra * 15) * Math.PI / 180; // RA in degrees * 15, then to radians
    const decRad = target.coordinates.dec * Math.PI / 180;
    const latRad = latitude * Math.PI / 180;
    
    // Calculate Local Sidereal Time (simplified)
    const jd = this.dateToJulianDay(date);
    const lst = this.calculateLST(jd, longitude);
    const lstRad = lst * Math.PI / 180;
    
    // Calculate hour angle
    const hourAngle = lstRad - raRad;
    
    // Calculate altitude and azimuth
    const sinAlt = Math.sin(decRad) * Math.sin(latRad) + 
                   Math.cos(decRad) * Math.cos(latRad) * Math.cos(hourAngle);
    const altitude = Math.asin(sinAlt) * 180 / Math.PI;
    
    const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / 
                  (Math.cos(latRad) * Math.cos(Math.asin(sinAlt)));
    let azimuth = Math.acos(cosAz) * 180 / Math.PI;
    
    if (Math.sin(hourAngle) > 0) {
      azimuth = 360 - azimuth;
    }
    
    // Calculate airmass
    const airmass = altitude > 0 ? 1 / Math.sin(altitude * Math.PI / 180) : Infinity;
    
    // Determine visibility
    let visibility: ObservabilityData['visibility'];
    if (altitude < 0) {
      visibility = 'not_visible';
    } else if (altitude > 60) {
      visibility = 'excellent';
    } else if (altitude > 30) {
      visibility = 'good';
    } else if (altitude > 15) {
      visibility = 'fair';
    } else {
      visibility = 'poor';
    }
    
    return {
      altitude: Math.round(altitude * 100) / 100,
      azimuth: Math.round(azimuth * 100) / 100,
      airmass: Math.round(airmass * 100) / 100,
      visibility,
    };
  }

  private static dateToJulianDay(date: Date): number {
    const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
    const y = date.getFullYear() + 4800 - a;
    const m = (date.getMonth() + 1) + 12 * a - 3;
    
    return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  private static calculateLST(jd: number, longitude: number): number {
    const t = (jd - 2451545.0) / 36525;
    const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + 
                 0.000387933 * t * t - t * t * t / 38710000;
    const lst = gmst + longitude;
    return ((lst % 360) + 360) % 360; // Normalize to 0-360
  }

  // Target library management
  static getBuiltInTargets(): Target[] {
    return this.BUILT_IN_TARGETS.map(data => this.createTarget(data));
  }

  static importTargetsFromCSV(csvData: string): Target[] {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const targets: Target[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;

      const data: any = {};
      headers.forEach((header, index) => {
        data[header.toLowerCase()] = values[index];
      });

      if (data.name && data.ra && data.dec) {
        try {
          const target = this.createTarget({
            name: data.name,
            ra: data.ra,
            dec: data.dec,
            type: data.type || 'custom',
            magnitude: data.magnitude ? parseFloat(data.magnitude) : undefined,
            constellation: data.constellation,
            notes: data.notes,
            commonNames: data.commonnames ? data.commonnames.split(';') : [],
            catalogIds: data.catalogids ? data.catalogids.split(';') : [],
          });
          targets.push(target);
        } catch (error) {
          console.warn(`Failed to import target ${data.name}:`, error);
        }
      }
    }

    return targets;
  }

  static exportTargetsToCSV(targets: Target[]): string {
    const headers = [
      'Name',
      'RA',
      'Dec',
      'Type',
      'Magnitude',
      'Constellation',
      'CommonNames',
      'CatalogIds',
      'Notes'
    ];

    const rows = targets.map(target => {
      const coords = this.formatCoordinates(target.coordinates);
      return [
        target.name,
        coords.ra,
        coords.dec,
        target.type,
        target.metadata.magnitude || '',
        target.metadata.constellation || '',
        target.metadata.commonNames?.join(';') || '',
        target.metadata.catalogIds?.join(';') || '',
        target.metadata.notes || ''
      ].map(value => `"${value}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  // Target validation
  static validateTarget(target: Target): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!target.name.trim()) {
      errors.push('Target name is required');
    }

    if (target.coordinates.ra < 0 || target.coordinates.ra >= 24) {
      errors.push('RA must be between 0 and 24 hours');
    }

    if (target.coordinates.dec < -90 || target.coordinates.dec > 90) {
      errors.push('Dec must be between -90 and +90 degrees');
    }

    if (target.metadata.magnitude !== undefined && 
        (target.metadata.magnitude < -30 || target.metadata.magnitude > 30)) {
      errors.push('Magnitude must be between -30 and +30');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Utility methods
  static calculateDistance(target1: Target, target2: Target): number {
    const ra1 = target1.coordinates.ra * 15 * Math.PI / 180;
    const dec1 = target1.coordinates.dec * Math.PI / 180;
    const ra2 = target2.coordinates.ra * 15 * Math.PI / 180;
    const dec2 = target2.coordinates.dec * Math.PI / 180;

    const dra = ra2 - ra1;
    const ddec = dec2 - dec1;

    const a = Math.sin(ddec / 2) ** 2 + 
              Math.cos(dec1) * Math.cos(dec2) * Math.sin(dra / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return c * 180 / Math.PI; // Return in degrees
  }

  static findNearbyTargets(
    target: Target,
    targets: Target[],
    radiusDegrees: number = 5
  ): Target[] {
    return targets.filter(t => {
      if (t.id === target.id) return false;
      const distance = this.calculateDistance(target, t);
      return distance <= radiusDegrees;
    });
  }

  // Target sorting
  static sortTargets(
    targets: Target[],
    sortBy: 'name' | 'type' | 'magnitude' | 'constellation' | 'ra' | 'dec'
  ): Target[] {
    return [...targets].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'magnitude':
          const magA = a.metadata.magnitude ?? 99;
          const magB = b.metadata.magnitude ?? 99;
          return magA - magB;
        case 'constellation':
          const constA = a.metadata.constellation ?? '';
          const constB = b.metadata.constellation ?? '';
          return constA.localeCompare(constB);
        case 'ra':
          return a.coordinates.ra - b.coordinates.ra;
        case 'dec':
          return a.coordinates.dec - b.coordinates.dec;
        default:
          return 0;
      }
    });
  }

  // Target statistics
  static getTargetStatistics(targets: Target[]): {
    totalTargets: number;
    byType: Record<string, number>;
    byConstellation: Record<string, number>;
    magnitudeRange: { min: number; max: number };
    averageMagnitude: number;
  } {
    const byType: Record<string, number> = {};
    const byConstellation: Record<string, number> = {};
    const magnitudes: number[] = [];

    targets.forEach(target => {
      // Count by type
      byType[target.type] = (byType[target.type] || 0) + 1;

      // Count by constellation
      if (target.metadata.constellation) {
        byConstellation[target.metadata.constellation] =
          (byConstellation[target.metadata.constellation] || 0) + 1;
      }

      // Collect magnitudes
      if (target.metadata.magnitude !== undefined) {
        magnitudes.push(target.metadata.magnitude);
      }
    });

    const magnitudeRange = magnitudes.length > 0 ? {
      min: Math.min(...magnitudes),
      max: Math.max(...magnitudes),
    } : { min: 0, max: 0 };

    const averageMagnitude = magnitudes.length > 0
      ? magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length
      : 0;

    return {
      totalTargets: targets.length,
      byType,
      byConstellation,
      magnitudeRange,
      averageMagnitude,
    };
  }
}
