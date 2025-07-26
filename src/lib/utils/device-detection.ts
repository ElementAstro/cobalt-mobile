// Device detection and capability utilities
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';
  version: {
    os: string;
    browser: string;
  };
  capabilities: DeviceCapabilities;
  screen: ScreenInfo;
  performance: PerformanceInfo;
}

export interface DeviceCapabilities {
  touchScreen: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  geolocation: boolean;
  camera: boolean;
  microphone: boolean;
  bluetooth: boolean;
  nfc: boolean;
  vibration: boolean;
  fullscreen: boolean;
  orientation: boolean;
  webgl: boolean;
  webgl2: boolean;
  webrtc: boolean;
  serviceWorker: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  webSockets: boolean;
  notifications: boolean;
  backgroundSync: boolean;
}

export interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  colorDepth: number;
  refreshRate?: number;
}

export interface PerformanceInfo {
  memory?: number; // GB
  cores?: number;
  connectionType?: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet' | 'unknown';
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number; // Mbps
  rtt?: number; // ms
  saveData?: boolean;
}

class DeviceDetector {
  private deviceInfo: DeviceInfo | null = null;
  private listeners = new Set<(info: DeviceInfo) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.detectDevice();
      this.setupEventListeners();
    }
  }

  /**
   * Get current device information
   */
  getDeviceInfo(): DeviceInfo | null {
    if (!this.deviceInfo && typeof window !== 'undefined') {
      this.detectDevice();
    }
    return this.deviceInfo;
  }

  /**
   * Check if device is mobile
   */
  isMobile(): boolean {
    return this.getDeviceInfo()?.type === 'mobile' || false;
  }

  /**
   * Check if device is tablet
   */
  isTablet(): boolean {
    return this.getDeviceInfo()?.type === 'tablet' || false;
  }

  /**
   * Check if device is desktop
   */
  isDesktop(): boolean {
    return this.getDeviceInfo()?.type === 'desktop' || false;
  }

  /**
   * Check if device has touch screen
   */
  isTouchDevice(): boolean {
    return this.getDeviceInfo()?.capabilities.touchScreen || false;
  }

  /**
   * Check if device is in portrait orientation
   */
  isPortrait(): boolean {
    return this.getDeviceInfo()?.screen.orientation === 'portrait' || false;
  }

  /**
   * Check if device is in landscape orientation
   */
  isLandscape(): boolean {
    return this.getDeviceInfo()?.screen.orientation === 'landscape' || false;
  }

  /**
   * Get device performance tier
   */
  getPerformanceTier(): 'low' | 'medium' | 'high' {
    const info = this.getDeviceInfo();
    if (!info) return 'medium';

    const { performance, capabilities } = info;
    let score = 0;

    // Memory score
    if (performance.memory) {
      if (performance.memory >= 8) score += 3;
      else if (performance.memory >= 4) score += 2;
      else if (performance.memory >= 2) score += 1;
    }

    // CPU cores score
    if (performance.cores) {
      if (performance.cores >= 8) score += 3;
      else if (performance.cores >= 4) score += 2;
      else if (performance.cores >= 2) score += 1;
    }

    // Graphics capabilities
    if (capabilities.webgl2) score += 2;
    else if (capabilities.webgl) score += 1;

    // Connection quality
    if (performance.connectionType === 'wifi' || performance.connectionType === 'ethernet') score += 2;
    else if (performance.connectionType === '4g' || performance.connectionType === '5g') score += 1;

    if (score >= 8) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Check if device supports specific capability
   */
  supportsCapability(capability: keyof DeviceCapabilities): boolean {
    return this.getDeviceInfo()?.capabilities[capability] || false;
  }

  /**
   * Add device info change listener
   */
  addListener(listener: (info: DeviceInfo) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get optimal settings for device
   */
  getOptimalSettings(): {
    animationsEnabled: boolean;
    highQualityImages: boolean;
    backgroundSync: boolean;
    cacheSize: number; // MB
    maxConcurrentRequests: number;
    updateInterval: number; // ms
  } {
    const tier = this.getPerformanceTier();
    const info = this.getDeviceInfo();
    const isLowData = info?.performance.saveData || false;

    switch (tier) {
      case 'high':
        return {
          animationsEnabled: !isLowData,
          highQualityImages: !isLowData,
          backgroundSync: true,
          cacheSize: isLowData ? 50 : 200,
          maxConcurrentRequests: 6,
          updateInterval: 1000,
        };
      case 'medium':
        return {
          animationsEnabled: !isLowData,
          highQualityImages: false,
          backgroundSync: true,
          cacheSize: isLowData ? 25 : 100,
          maxConcurrentRequests: 4,
          updateInterval: 2000,
        };
      case 'low':
        return {
          animationsEnabled: false,
          highQualityImages: false,
          backgroundSync: false,
          cacheSize: 25,
          maxConcurrentRequests: 2,
          updateInterval: 5000,
        };
    }
  }

  // Private methods
  private detectDevice(): void {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent;
    const screen = window.screen;

    this.deviceInfo = {
      type: this.detectDeviceType(userAgent, screen),
      os: this.detectOS(userAgent),
      browser: this.detectBrowser(userAgent),
      version: this.detectVersions(userAgent),
      capabilities: this.detectCapabilities(),
      screen: this.getScreenInfo(),
      performance: this.getPerformanceInfo(),
    };
  }

  private detectDeviceType(userAgent: string, screen: Screen): DeviceInfo['type'] {
    // Check for tablet first (larger screens but still mobile OS)
    if (/iPad|Android(?=.*Mobile)|Tablet/i.test(userAgent)) {
      return 'tablet';
    }

    // Check for mobile
    if (/Mobile|iPhone|Android|BlackBerry|Opera Mini|IEMobile/i.test(userAgent)) {
      return 'mobile';
    }

    // Check screen size as fallback
    const maxDimension = Math.max(screen.width, screen.height);
    const minDimension = Math.min(screen.width, screen.height);

    if (maxDimension <= 768) return 'mobile';
    if (maxDimension <= 1024 && minDimension <= 768) return 'tablet';
    
    return 'desktop';
  }

  private detectOS(userAgent: string): DeviceInfo['os'] {
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Android/i.test(userAgent)) return 'android';
    if (/Windows/i.test(userAgent)) return 'windows';
    if (/Mac OS X/i.test(userAgent)) return 'macos';
    if (/Linux/i.test(userAgent)) return 'linux';
    return 'unknown';
  }

  private detectBrowser(userAgent: string): DeviceInfo['browser'] {
    if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) return 'chrome';
    if (/Firefox/i.test(userAgent)) return 'firefox';
    if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'safari';
    if (/Edge/i.test(userAgent)) return 'edge';
    if (/Opera/i.test(userAgent)) return 'opera';
    return 'unknown';
  }

  private detectVersions(userAgent: string): DeviceInfo['version'] {
    // Simplified version detection
    const osVersion = this.extractVersion(userAgent, /(?:iPhone OS|Android|Windows NT|Mac OS X|Linux) ([\d._]+)/);
    const browserVersion = this.extractVersion(userAgent, /(?:Chrome|Firefox|Safari|Edge|Opera)\/([\d.]+)/);

    return {
      os: osVersion || 'unknown',
      browser: browserVersion || 'unknown',
    };
  }

  private extractVersion(userAgent: string, regex: RegExp): string | null {
    const match = userAgent.match(regex);
    return match ? match[1].replace(/_/g, '.') : null;
  }

  private detectCapabilities(): DeviceCapabilities {
    return {
      touchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      accelerometer: 'DeviceMotionEvent' in window,
      gyroscope: 'DeviceOrientationEvent' in window,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      bluetooth: 'bluetooth' in navigator,
      nfc: 'nfc' in navigator,
      vibration: 'vibrate' in navigator,
      fullscreen: 'requestFullscreen' in document.documentElement,
      orientation: 'orientation' in screen,
      webgl: this.supportsWebGL(),
      webgl2: this.supportsWebGL2(),
      webrtc: 'RTCPeerConnection' in window,
      serviceWorker: 'serviceWorker' in navigator,
      indexedDB: 'indexedDB' in window,
      localStorage: 'localStorage' in window,
      sessionStorage: 'sessionStorage' in window,
      webSockets: 'WebSocket' in window,
      notifications: 'Notification' in window,
      backgroundSync: 'serviceWorker' in navigator &&
        typeof window !== 'undefined' &&
        window.ServiceWorkerRegistration &&
        'sync' in window.ServiceWorkerRegistration.prototype,
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

  private getScreenInfo(): ScreenInfo {
    const screen = window.screen;
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: screen.width > screen.height ? 'landscape' : 'portrait',
      colorDepth: screen.colorDepth,
      refreshRate: (screen as any).refreshRate,
    };
  }

  private getPerformanceInfo(): PerformanceInfo {
    const info: PerformanceInfo = {};

    // Memory info (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      info.memory = memory.jsHeapSizeLimit / (1024 * 1024 * 1024); // Convert to GB
    }

    // CPU cores
    info.cores = navigator.hardwareConcurrency;

    // Network info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      info.connectionType = connection.type || 'unknown';
      info.effectiveType = connection.effectiveType;
      info.downlink = connection.downlink;
      info.rtt = connection.rtt;
      info.saveData = connection.saveData;
    }

    return info;
  }

  private setupEventListeners(): void {
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.detectDevice();
        this.notifyListeners();
      }, 100);
    });

    // Listen for resize events
    window.addEventListener('resize', () => {
      this.detectDevice();
      this.notifyListeners();
    });

    // Listen for network changes
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', () => {
        this.detectDevice();
        this.notifyListeners();
      });
    }
  }

  private notifyListeners(): void {
    if (this.deviceInfo) {
      this.listeners.forEach(listener => {
        try {
          listener(this.deviceInfo!);
        } catch (error) {
          console.error('Error in device info listener:', error);
        }
      });
    }
  }
}

// Create singleton instance
export const deviceDetector = new DeviceDetector();

// Export utility functions
export const isMobile = () => deviceDetector.isMobile();
export const isTablet = () => deviceDetector.isTablet();
export const isDesktop = () => deviceDetector.isDesktop();
export const isTouchDevice = () => deviceDetector.isTouchDevice();
export const isPortrait = () => deviceDetector.isPortrait();
export const isLandscape = () => deviceDetector.isLandscape();
export const getDeviceInfo = () => deviceDetector.getDeviceInfo();
export const getPerformanceTier = () => deviceDetector.getPerformanceTier();
export const getOptimalSettings = () => deviceDetector.getOptimalSettings();
