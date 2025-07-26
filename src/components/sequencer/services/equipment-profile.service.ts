import {
  EquipmentProfile,
  EquipmentConfiguration,
  EquipmentSettings,
  CalibrationData,
  CalibrationFrameSet,
  CameraConfig,
  MountConfig,
  FilterConfig,
  ProfileValidationResult,
  ProfileComparison,
  ProfileDifference
} from '../types/sequencer.types';
import { generateId } from '../utils/sequencer.utils';



export class EquipmentProfileService {
  private static profiles: EquipmentProfile[] = [];

  // Profile management
  static createProfile(
    name: string,
    description: string,
    equipment: EquipmentConfiguration,
    settings: EquipmentSettings
  ): EquipmentProfile {
    const profile: EquipmentProfile = {
      id: generateId(),
      name,
      description,
      equipment,
      settings,
      calibration: {
        darks: [],
        flats: [],
        bias: [],
        lastCalibrated: new Date(),
      },
      metadata: {
        tags: [],
        isDefault: false,
      },
      created: new Date(),
      modified: new Date(),
      version: '1.0.0',
    };

    this.profiles.push(profile);
    return profile;
  }

  static updateProfile(profileId: string, updates: Partial<EquipmentProfile>): void {
    const index = this.profiles.findIndex(p => p.id === profileId);
    if (index !== -1) {
      this.profiles[index] = {
        ...this.profiles[index],
        ...updates,
        modified: new Date(),
      };
    }
  }

  static deleteProfile(profileId: string): void {
    this.profiles = this.profiles.filter(p => p.id !== profileId);
  }

  static getProfiles(): EquipmentProfile[] {
    return [...this.profiles];
  }

  static getProfile(profileId: string): EquipmentProfile | null {
    return this.profiles.find(p => p.id === profileId) || null;
  }

  static cloneProfile(profileId: string, newName?: string): EquipmentProfile | null {
    const original = this.getProfile(profileId);
    if (!original) return null;

    const cloned: EquipmentProfile = {
      ...original,
      id: generateId(),
      name: newName || `${original.name} (Copy)`,
      metadata: {
        ...original.metadata,
        isDefault: false,
      },
      created: new Date(),
      modified: new Date(),
    };

    this.profiles.push(cloned);
    return cloned;
  }

  // Profile validation
  static validateProfile(profile: EquipmentProfile): ProfileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!profile.name.trim()) {
      errors.push('Profile name is required');
    }

    // Camera validation
    const cameraValid = this.validateCamera(profile.equipment.camera, errors, warnings);
    
    // Mount validation
    const mountValid = this.validateMount(profile.equipment.mount, errors, warnings);
    
    // Filter wheel validation
    let filterWheelValid = true;
    if (profile.equipment.filterWheel) {
      filterWheelValid = this.validateFilterWheel(profile.equipment.filterWheel, errors, warnings);
    }

    // Focuser validation
    let focuserValid = true;
    if (profile.equipment.focuser) {
      focuserValid = this.validateFocuser(profile.equipment.focuser, errors, warnings);
    }

    // Settings validation
    this.validateSettings(profile.settings, errors, warnings);

    const overall = errors.length === 0;

    return {
      isValid: overall,
      errors,
      warnings,
      compatibility: {
        camera: cameraValid,
        mount: mountValid,
        focuser: focuserValid,
        filterWheel: filterWheelValid,
        overall,
      },
    };
  }

  private static validateCamera(camera: CameraConfig, errors: string[], warnings: string[]): boolean {
    if (!camera.name.trim()) {
      errors.push('Camera name is required');
      return false;
    }

    if (camera.pixelSize <= 0) {
      errors.push('Camera pixel size must be positive');
      return false;
    }

    if (camera.resolution.width <= 0 || camera.resolution.height <= 0) {
      errors.push('Camera resolution must be positive');
      return false;
    }

    if (camera.pixelSize > 20) {
      warnings.push('Large pixel size may affect resolution');
    }

    return true;
  }

  private static validateMount(mount: MountConfig, errors: string[], warnings: string[]): boolean {
    if (!mount.name.trim()) {
      errors.push('Mount name is required');
      return false;
    }

    if (mount.maxSlewRate <= 0) {
      errors.push('Mount slew rate must be positive');
      return false;
    }

    if (mount.trackingAccuracy <= 0) {
      errors.push('Mount tracking accuracy must be positive');
      return false;
    }

    if (mount.trackingAccuracy > 10) {
      warnings.push('Poor tracking accuracy may affect image quality');
    }

    return true;
  }

  private static validateFilterWheel(
    filterWheel: any,
    errors: string[],
    warnings: string[]
  ): boolean {
    if (!filterWheel.name.trim()) {
      errors.push('Filter wheel name is required');
      return false;
    }

    if (filterWheel.positions <= 0) {
      errors.push('Filter wheel must have at least one position');
      return false;
    }

    if (filterWheel.filters.length > filterWheel.positions) {
      errors.push('More filters defined than available positions');
      return false;
    }

    return true;
  }

  private static validateFocuser(focuser: any, errors: string[], warnings: string[]): boolean {
    if (!focuser.name.trim()) {
      errors.push('Focuser name is required');
      return false;
    }

    if (focuser.stepSize <= 0) {
      errors.push('Focuser step size must be positive');
      return false;
    }

    if (focuser.maxTravel <= 0) {
      errors.push('Focuser travel must be positive');
      return false;
    }

    return true;
  }

  private static validateSettings(settings: EquipmentSettings, errors: string[], warnings: string[]): void {
    // Camera settings
    if (settings.camera.defaultGain < 0) {
      errors.push('Camera gain cannot be negative');
    }

    if (settings.camera.coolingTarget < -50 || settings.camera.coolingTarget > 50) {
      warnings.push('Extreme cooling target may affect camera performance');
    }

    // Mount settings
    if (settings.mount.slewRate <= 0) {
      errors.push('Mount slew rate must be positive');
    }

    if (settings.mount.flipHourAngle < -12 || settings.mount.flipHourAngle > 12) {
      warnings.push('Unusual flip hour angle setting');
    }
  }

  // Profile comparison
  static compareProfiles(profile1: EquipmentProfile, profile2: EquipmentProfile): ProfileComparison {
    const differences: ProfileDifference[] = [];

    // Compare camera configurations
    this.compareCameras(profile1.equipment.camera, profile2.equipment.camera, differences);

    // Compare mount configurations
    this.compareMounts(profile1.equipment.mount, profile2.equipment.mount, differences);

    // Compare settings
    this.compareSettings(profile1.settings, profile2.settings, differences);

    // Calculate compatibility score
    const compatibility = this.calculateCompatibility(differences);

    // Generate recommendations
    const recommendations = this.generateRecommendations(differences);

    return {
      profile1,
      profile2,
      differences,
      compatibility,
      recommendations,
    };
  }

  private static compareCameras(camera1: CameraConfig, camera2: CameraConfig, differences: ProfileDifference[]): void {
    if (camera1.pixelSize !== camera2.pixelSize) {
      differences.push({
        category: 'Camera',
        field: 'pixelSize',
        value1: camera1.pixelSize,
        value2: camera2.pixelSize,
        impact: 'medium',
        description: 'Different pixel sizes affect image scale and resolution',
      });
    }

    if (camera1.cooled !== camera2.cooled) {
      differences.push({
        category: 'Camera',
        field: 'cooled',
        value1: camera1.cooled,
        value2: camera2.cooled,
        impact: 'high',
        description: 'Cooling capability affects noise performance',
      });
    }
  }

  private static compareMounts(mount1: MountConfig, mount2: MountConfig, differences: ProfileDifference[]): void {
    if (mount1.type !== mount2.type) {
      differences.push({
        category: 'Mount',
        field: 'type',
        value1: mount1.type,
        value2: mount2.type,
        impact: 'high',
        description: 'Different mount types have different capabilities',
      });
    }

    if (Math.abs(mount1.trackingAccuracy - mount2.trackingAccuracy) > 1) {
      differences.push({
        category: 'Mount',
        field: 'trackingAccuracy',
        value1: mount1.trackingAccuracy,
        value2: mount2.trackingAccuracy,
        impact: 'medium',
        description: 'Tracking accuracy affects image quality',
      });
    }
  }

  private static compareSettings(settings1: EquipmentSettings, settings2: EquipmentSettings, differences: ProfileDifference[]): void {
    if (settings1.camera.defaultGain !== settings2.camera.defaultGain) {
      differences.push({
        category: 'Settings',
        field: 'camera.defaultGain',
        value1: settings1.camera.defaultGain,
        value2: settings2.camera.defaultGain,
        impact: 'low',
        description: 'Different default gain settings',
      });
    }

    if (settings1.camera.coolingTarget !== settings2.camera.coolingTarget) {
      differences.push({
        category: 'Settings',
        field: 'camera.coolingTarget',
        value1: settings1.camera.coolingTarget,
        value2: settings2.camera.coolingTarget,
        impact: 'medium',
        description: 'Different cooling targets affect noise performance',
      });
    }
  }

  private static calculateCompatibility(differences: ProfileDifference[]): number {
    let score = 100;

    differences.forEach(diff => {
      switch (diff.impact) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    return Math.max(0, score);
  }

  private static generateRecommendations(differences: ProfileDifference[]): string[] {
    const recommendations: string[] = [];

    const highImpactDiffs = differences.filter(d => d.impact === 'high');
    if (highImpactDiffs.length > 0) {
      recommendations.push('Review high-impact differences before switching profiles');
    }

    const cameraDiffs = differences.filter(d => d.category === 'Camera');
    if (cameraDiffs.length > 0) {
      recommendations.push('Recalibrate camera settings when switching profiles');
    }

    const mountDiffs = differences.filter(d => d.category === 'Mount');
    if (mountDiffs.length > 0) {
      recommendations.push('Verify mount alignment and limits');
    }

    return recommendations;
  }

  // Built-in profiles
  static getBuiltInProfiles(): EquipmentProfile[] {
    return [
      this.createDefaultDSLRProfile(),
      this.createDefaultCCDProfile(),
      this.createPlanetaryProfile(),
    ];
  }

  private static createDefaultDSLRProfile(): EquipmentProfile {
    return {
      id: 'builtin-dslr',
      name: 'DSLR Setup',
      description: 'Standard DSLR camera setup for beginners',
      equipment: {
        camera: {
          name: 'Canon EOS 6D',
          model: 'EOS 6D',
          pixelSize: 6.55,
          resolution: { width: 5472, height: 3648 },
          cooled: false,
          binningModes: ['1x1'],
          frameTypes: ['light', 'dark', 'flat'],
        },
        mount: {
          name: 'EQ6-R Pro',
          model: 'EQ6-R Pro',
          type: 'equatorial',
          maxSlewRate: 4.0,
          trackingAccuracy: 1.5,
          payloadCapacity: 20,
          hasGPS: true,
          hasPEC: true,
        },
      },
      settings: {
        camera: {
          defaultGain: 0,
          defaultOffset: 0,
          defaultBinning: '1x1',
          coolingTarget: 20,
          downloadTimeout: 30,
          imageFormat: 'RAW',
        },
        mount: {
          slewRate: 3.0,
          trackingRate: 1.0,
          guidingRate: 0.5,
          flipHourAngle: 6,
          parkPosition: { ra: 0, dec: 90 },
          limits: {
            eastLimit: 90,
            westLimit: -90,
            horizonLimit: 20,
          },
        },
        safety: {
          enableWeatherMonitoring: true,
          enableEquipmentMonitoring: true,
          autoAbortOnError: true,
          maxConsecutiveErrors: 3,
          emergencyStopConditions: ['high_wind', 'rain', 'clouds'],
        },
      },
      calibration: {
        darks: [],
        flats: [],
        bias: [],
        lastCalibrated: new Date(),
      },
      metadata: {
        tags: ['DSLR', 'Beginner', 'Built-in'],
        isDefault: true,
      },
      created: new Date(),
      modified: new Date(),
      version: '1.0.0',
    };
  }

  private static createDefaultCCDProfile(): EquipmentProfile {
    return {
      id: 'builtin-ccd',
      name: 'CCD Setup',
      description: 'Advanced CCD camera setup',
      equipment: {
        camera: {
          name: 'SBIG STF-8300M',
          model: 'STF-8300M',
          pixelSize: 5.4,
          resolution: { width: 3326, height: 2504 },
          cooled: true,
          maxCooling: -40,
          gainRange: { min: 0, max: 63 },
          offsetRange: { min: 0, max: 255 },
          binningModes: ['1x1', '2x2', '3x3'],
          frameTypes: ['light', 'dark', 'flat', 'bias'],
        },
        mount: {
          name: 'Paramount MX+',
          model: 'Paramount MX+',
          type: 'equatorial',
          maxSlewRate: 6.0,
          trackingAccuracy: 0.5,
          payloadCapacity: 45,
          hasGPS: true,
          hasPEC: true,
        },
        filterWheel: {
          name: 'SBIG CFW-8',
          model: 'CFW-8',
          positions: 8,
          filters: [
            { position: 1, name: 'Luminance', type: 'luminance' },
            { position: 2, name: 'Red', type: 'red' },
            { position: 3, name: 'Green', type: 'green' },
            { position: 4, name: 'Blue', type: 'blue' },
            { position: 5, name: 'H-alpha', type: 'ha', bandwidth: 7 },
            { position: 6, name: 'OIII', type: 'oiii', bandwidth: 8.5 },
            { position: 7, name: 'SII', type: 'sii', bandwidth: 8 },
          ],
        },
      },
      settings: {
        camera: {
          defaultGain: 0,
          defaultOffset: 10,
          defaultBinning: '1x1',
          coolingTarget: -20,
          downloadTimeout: 60,
          imageFormat: 'FITS',
        },
        mount: {
          slewRate: 5.0,
          trackingRate: 1.0,
          guidingRate: 0.5,
          flipHourAngle: 6,
          parkPosition: { ra: 0, dec: 90 },
          limits: {
            eastLimit: 90,
            westLimit: -90,
            horizonLimit: 25,
          },
        },
        filterWheel: {
          defaultFilter: 1,
          changeTimeout: 10,
          settleTime: 2,
        },
        safety: {
          enableWeatherMonitoring: true,
          enableEquipmentMonitoring: true,
          autoAbortOnError: true,
          maxConsecutiveErrors: 2,
          emergencyStopConditions: ['high_wind', 'rain', 'clouds', 'dome_error'],
        },
      },
      calibration: {
        darks: [],
        flats: [],
        bias: [],
        lastCalibrated: new Date(),
      },
      metadata: {
        tags: ['CCD', 'Advanced', 'Built-in'],
        isDefault: false,
      },
      created: new Date(),
      modified: new Date(),
      version: '1.0.0',
    };
  }

  private static createPlanetaryProfile(): EquipmentProfile {
    return {
      id: 'builtin-planetary',
      name: 'Planetary Setup',
      description: 'High-speed planetary imaging setup',
      equipment: {
        camera: {
          name: 'ZWO ASI290MM',
          model: 'ASI290MM',
          pixelSize: 2.9,
          resolution: { width: 1936, height: 1096 },
          cooled: false,
          gainRange: { min: 0, max: 300 },
          offsetRange: { min: 0, max: 100 },
          binningModes: ['1x1', '2x2'],
          frameTypes: ['light'],
        },
        mount: {
          name: 'Celestron CGX',
          model: 'CGX',
          type: 'equatorial',
          maxSlewRate: 5.0,
          trackingAccuracy: 1.0,
          payloadCapacity: 25,
          hasGPS: true,
          hasPEC: true,
        },
      },
      settings: {
        camera: {
          defaultGain: 200,
          defaultOffset: 30,
          defaultBinning: '1x1',
          coolingTarget: 20,
          downloadTimeout: 5,
          imageFormat: 'SER',
        },
        mount: {
          slewRate: 4.0,
          trackingRate: 1.0,
          guidingRate: 1.0,
          flipHourAngle: 6,
          parkPosition: { ra: 0, dec: 90 },
          limits: {
            eastLimit: 90,
            westLimit: -90,
            horizonLimit: 15,
          },
        },
        safety: {
          enableWeatherMonitoring: false,
          enableEquipmentMonitoring: true,
          autoAbortOnError: false,
          maxConsecutiveErrors: 5,
          emergencyStopConditions: ['mount_error'],
        },
      },
      calibration: {
        darks: [],
        flats: [],
        bias: [],
        lastCalibrated: new Date(),
      },
      metadata: {
        tags: ['Planetary', 'High-speed', 'Built-in'],
        isDefault: false,
      },
      created: new Date(),
      modified: new Date(),
      version: '1.0.0',
    };
  }
}
