// OS version compatibility utilities
export interface OSVersion {
  major: number;
  minor: number;
  patch: number;
  build?: string;
}

export interface OSCompatibility {
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  version: OSVersion;
  isSupported: boolean;
  supportLevel: 'full' | 'partial' | 'limited' | 'unsupported';
  features: OSFeatureSupport;
  recommendations: string[];
}

export interface OSFeatureSupport {
  // Core web features
  serviceWorker: boolean;
  webPush: boolean;
  webShare: boolean;
  webBluetooth: boolean;
  webUSB: boolean;
  webNFC: boolean;
  
  // Media features
  webRTC: boolean;
  mediaDevices: boolean;
  screenCapture: boolean;
  pictureInPicture: boolean;
  
  // Storage features
  indexedDB: boolean;
  webSQL: boolean;
  persistentStorage: boolean;
  
  // UI features
  fullscreen: boolean;
  screenOrientation: boolean;
  vibration: boolean;
  
  // Sensor features
  deviceMotion: boolean;
  deviceOrientation: boolean;
  geolocation: boolean;
  
  // Performance features
  webGL: boolean;
  webGL2: boolean;
  webAssembly: boolean;
  sharedArrayBuffer: boolean;
  
  // Security features
  webCrypto: boolean;
  credentialManagement: boolean;
  
  // Mobile-specific
  touchEvents: boolean;
  pointerEvents: boolean;
  visualViewport: boolean;
}

// Minimum supported versions
const MIN_SUPPORTED_VERSIONS = {
  ios: { major: 12, minor: 0, patch: 0 },
  android: { major: 7, minor: 0, patch: 0 },
  windows: { major: 10, minor: 0, patch: 0 },
  macos: { major: 10, minor: 14, patch: 0 },
  linux: { major: 0, minor: 0, patch: 0 }, // No specific version requirements
};

// Recommended versions for full feature support
const RECOMMENDED_VERSIONS = {
  ios: { major: 15, minor: 0, patch: 0 },
  android: { major: 10, minor: 0, patch: 0 },
  windows: { major: 10, minor: 0, patch: 19041 },
  macos: { major: 12, minor: 0, patch: 0 },
  linux: { major: 0, minor: 0, patch: 0 },
};

class OSCompatibilityChecker {
  private compatibility: OSCompatibility | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.detectCompatibility();
    }
  }

  /**
   * Get OS compatibility information
   */
  getCompatibility(): OSCompatibility | null {
    if (!this.compatibility && typeof window !== 'undefined') {
      this.detectCompatibility();
    }
    return this.compatibility;
  }

  /**
   * Check if current OS version is supported
   */
  isSupported(): boolean {
    return this.getCompatibility()?.isSupported || false;
  }

  /**
   * Get support level for current OS
   */
  getSupportLevel(): OSCompatibility['supportLevel'] {
    return this.getCompatibility()?.supportLevel || 'unsupported';
  }

  /**
   * Check if specific feature is supported
   */
  supportsFeature(feature: keyof OSFeatureSupport): boolean {
    const compatibility = this.getCompatibility();
    return compatibility?.features[feature] || false;
  }

  /**
   * Get recommendations for current OS
   */
  getRecommendations(): string[] {
    return this.getCompatibility()?.recommendations || [];
  }

  /**
   * Get fallback strategies for unsupported features
   */
  getFallbackStrategies(): Record<string, string> {
    const compatibility = this.getCompatibility();
    if (!compatibility) return {};

    const fallbacks: Record<string, string> = {};

    // Service Worker fallbacks
    if (!compatibility.features.serviceWorker) {
      fallbacks.serviceWorker = 'Use application cache or manual caching';
    }

    // Push notification fallbacks
    if (!compatibility.features.webPush) {
      fallbacks.webPush = 'Use polling for updates or email notifications';
    }

    // WebRTC fallbacks
    if (!compatibility.features.webRTC) {
      fallbacks.webRTC = 'Use server-side media processing';
    }

    // Geolocation fallbacks
    if (!compatibility.features.geolocation) {
      fallbacks.geolocation = 'Use IP-based location or manual entry';
    }

    // Vibration fallbacks
    if (!compatibility.features.vibration) {
      fallbacks.vibration = 'Use visual feedback instead';
    }

    // WebGL fallbacks
    if (!compatibility.features.webGL) {
      fallbacks.webGL = 'Use 2D canvas rendering';
    }

    return fallbacks;
  }

  // Private methods
  private detectCompatibility(): void {
    const userAgent = navigator.userAgent;
    const os = this.detectOS(userAgent);
    const version = this.parseVersion(userAgent, os);
    const features = this.detectFeatures();
    
    const isSupported = this.checkSupport(os, version);
    const supportLevel = this.determineSupportLevel(os, version, features);
    const recommendations = this.generateRecommendations(os, version, supportLevel);

    this.compatibility = {
      os,
      version,
      isSupported,
      supportLevel,
      features,
      recommendations,
    };
  }

  private detectOS(userAgent: string): OSCompatibility['os'] {
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Android/i.test(userAgent)) return 'android';
    if (/Windows/i.test(userAgent)) return 'windows';
    if (/Mac OS X/i.test(userAgent)) return 'macos';
    if (/Linux/i.test(userAgent)) return 'linux';
    return 'unknown';
  }

  private parseVersion(userAgent: string, os: OSCompatibility['os']): OSVersion {
    let versionMatch: RegExpMatchArray | null = null;

    switch (os) {
      case 'ios':
        versionMatch = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        break;
      case 'android':
        versionMatch = userAgent.match(/Android (\d+)\.(\d+)\.?(\d+)?/);
        break;
      case 'windows':
        versionMatch = userAgent.match(/Windows NT (\d+)\.(\d+)\.?(\d+)?/);
        break;
      case 'macos':
        versionMatch = userAgent.match(/Mac OS X (\d+)_(\d+)_?(\d+)?/);
        break;
      default:
        return { major: 0, minor: 0, patch: 0 };
    }

    if (versionMatch) {
      return {
        major: parseInt(versionMatch[1], 10),
        minor: parseInt(versionMatch[2] || '0', 10),
        patch: parseInt(versionMatch[3] || '0', 10),
      };
    }

    return { major: 0, minor: 0, patch: 0 };
  }

  private detectFeatures(): OSFeatureSupport {
    return {
      // Core web features
      serviceWorker: 'serviceWorker' in navigator,
      webPush: 'serviceWorker' in navigator && 'PushManager' in window,
      webShare: 'share' in navigator,
      webBluetooth: 'bluetooth' in navigator,
      webUSB: 'usb' in navigator,
      webNFC: 'nfc' in navigator,
      
      // Media features
      webRTC: 'RTCPeerConnection' in window,
      mediaDevices: 'mediaDevices' in navigator,
      screenCapture: 'getDisplayMedia' in (navigator.mediaDevices || {}),
      pictureInPicture: 'pictureInPictureEnabled' in document,
      
      // Storage features
      indexedDB: 'indexedDB' in window,
      webSQL: 'openDatabase' in window,
      persistentStorage: 'storage' in navigator && 'persist' in navigator.storage,
      
      // UI features
      fullscreen: 'requestFullscreen' in document.documentElement,
      screenOrientation: 'orientation' in screen,
      vibration: 'vibrate' in navigator,
      
      // Sensor features
      deviceMotion: 'DeviceMotionEvent' in window,
      deviceOrientation: 'DeviceOrientationEvent' in window,
      geolocation: 'geolocation' in navigator,
      
      // Performance features
      webGL: this.supportsWebGL(),
      webGL2: this.supportsWebGL2(),
      webAssembly: 'WebAssembly' in window,
      sharedArrayBuffer: 'SharedArrayBuffer' in window,
      
      // Security features
      webCrypto: 'crypto' in window && 'subtle' in window.crypto,
      credentialManagement: 'credentials' in navigator,
      
      // Mobile-specific
      touchEvents: 'ontouchstart' in window,
      pointerEvents: 'PointerEvent' in window,
      visualViewport: 'visualViewport' in window,
    };
  }

  private supportsWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  private supportsWebGL2(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch {
      return false;
    }
  }

  private checkSupport(os: OSCompatibility['os'], version: OSVersion): boolean {
    const minVersion = MIN_SUPPORTED_VERSIONS[os as keyof typeof MIN_SUPPORTED_VERSIONS];
    if (!minVersion) return os === 'unknown' ? false : true;

    return this.compareVersions(version, minVersion) >= 0;
  }

  private determineSupportLevel(
    os: OSCompatibility['os'],
    version: OSVersion,
    features: OSFeatureSupport
  ): OSCompatibility['supportLevel'] {
    if (!this.checkSupport(os, version)) {
      return 'unsupported';
    }

    const recommendedVersion = RECOMMENDED_VERSIONS[os as keyof typeof RECOMMENDED_VERSIONS];
    if (recommendedVersion && this.compareVersions(version, recommendedVersion) >= 0) {
      return 'full';
    }

    // Check feature support to determine partial vs limited
    const coreFeatures = [
      features.serviceWorker,
      features.indexedDB,
      features.webRTC,
      features.geolocation,
    ];

    const supportedCoreFeatures = coreFeatures.filter(Boolean).length;
    const totalCoreFeatures = coreFeatures.length;

    if (supportedCoreFeatures >= totalCoreFeatures * 0.8) {
      return 'partial';
    } else if (supportedCoreFeatures >= totalCoreFeatures * 0.5) {
      return 'limited';
    }

    return 'unsupported';
  }

  private generateRecommendations(
    os: OSCompatibility['os'],
    version: OSVersion,
    supportLevel: OSCompatibility['supportLevel']
  ): string[] {
    const recommendations: string[] = [];

    if (supportLevel === 'unsupported') {
      recommendations.push(
        `Your ${os} version ${version.major}.${version.minor} is not supported`,
        'Please update to a newer version for the best experience'
      );
    } else if (supportLevel === 'limited') {
      recommendations.push(
        'Some features may not work properly on your device',
        'Consider updating your operating system for better compatibility'
      );
    } else if (supportLevel === 'partial') {
      recommendations.push(
        'Most features are supported, but updating may improve performance'
      );
    }

    // OS-specific recommendations
    if (os === 'ios' && version.major < 15) {
      recommendations.push('Update to iOS 15+ for improved PWA support');
    }

    if (os === 'android' && version.major < 10) {
      recommendations.push('Update to Android 10+ for better security and performance');
    }

    return recommendations;
  }

  private compareVersions(a: OSVersion, b: OSVersion): number {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    return a.patch - b.patch;
  }
}

// Create singleton instance
export const osCompatibilityChecker = new OSCompatibilityChecker();

// Utility functions
export const isOSSupported = () => osCompatibilityChecker.isSupported();
export const getOSCompatibility = () => osCompatibilityChecker.getCompatibility();
export const getSupportLevel = () => osCompatibilityChecker.getSupportLevel();
export const supportsFeature = (feature: keyof OSFeatureSupport) => 
  osCompatibilityChecker.supportsFeature(feature);
export const getOSRecommendations = () => osCompatibilityChecker.getRecommendations();
export const getFallbackStrategies = () => osCompatibilityChecker.getFallbackStrategies();
