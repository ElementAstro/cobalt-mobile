import { CurrentPage } from './store';

// URL routing utilities for device detail pages
export interface RouteParams {
  page: CurrentPage;
  deviceId?: string;
  tab?: string;
}

export class NavigationManager {
  private static instance: NavigationManager;
  private listeners: Array<(params: RouteParams) => void> = [];

  static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  // Subscribe to navigation changes
  subscribe(listener: (params: RouteParams) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of navigation changes
  private notify(params: RouteParams): void {
    this.listeners.forEach(listener => listener(params));
  }

  // Navigate to a page with optional parameters
  navigateTo(page: CurrentPage, deviceId?: string, tab?: string): void {
    const params: RouteParams = { page, deviceId, tab };
    
    // Update URL without page reload
    const url = this.buildUrl(params);
    window.history.pushState(params, '', url);
    
    // Notify listeners
    this.notify(params);
  }

  // Navigate back in history
  navigateBack(): void {
    window.history.back();
  }

  // Build URL from route parameters
  private buildUrl(params: RouteParams): string {
    let url = `/${params.page}`;
    
    if (params.deviceId) {
      url += `/${params.deviceId}`;
    }
    
    if (params.tab) {
      url += `?tab=${params.tab}`;
    }
    
    return url;
  }

  // Parse URL to extract route parameters
  parseUrl(url: string = window.location.pathname + window.location.search): RouteParams {
    const [pathname, search] = url.split('?');
    const pathParts = pathname.split('/').filter(Boolean);
    
    const page = (pathParts[0] || 'dashboard') as CurrentPage;
    const deviceId = pathParts[1];
    
    const searchParams = new URLSearchParams(search);
    const tab = searchParams.get('tab') || undefined;
    
    return { page, deviceId, tab };
  }

  // Get current route parameters
  getCurrentRoute(): RouteParams {
    return this.parseUrl();
  }

  // Initialize navigation manager with current URL
  initialize(): RouteParams {
    const params = this.getCurrentRoute();
    
    // Listen for browser back/forward navigation
    window.addEventListener('popstate', (event) => {
      const params = event.state || this.getCurrentRoute();
      this.notify(params);
    });
    
    return params;
  }

  // Check if current page is a device detail page
  isDeviceDetailPage(page: CurrentPage): boolean {
    return ['camera-detail', 'mount-detail', 'focuser-detail', 'filter-detail'].includes(page);
  }

  // Get device type from page
  getDeviceTypeFromPage(page: CurrentPage): string | null {
    const mapping: Record<string, string> = {
      'camera-detail': 'camera',
      'mount-detail': 'mount',
      'focuser-detail': 'focuser',
      'filter-detail': 'filter'
    };
    return mapping[page] || null;
  }

  // Get device ID from current URL or default mapping
  getDeviceId(page: CurrentPage, deviceId?: string): string {
    if (deviceId) return deviceId;
    
    // Default device IDs for each type
    const defaultIds: Record<string, string> = {
      'camera-detail': 'camera-001',
      'mount-detail': 'mount-001',
      'focuser-detail': 'focuser-001',
      'filter-detail': 'filter-001'
    };
    
    return defaultIds[page] || 'unknown';
  }

  // Generate breadcrumb items for current route
  generateBreadcrumbs(params: RouteParams): Array<{ label: string; onClick?: () => void }> {
    const breadcrumbs = [
      { label: 'Dashboard', onClick: () => this.navigateTo('dashboard') }
    ];

    if (this.isDeviceDetailPage(params.page)) {
      breadcrumbs.push(
        { label: 'Equipment', onClick: () => this.navigateTo('devices') }
      );
      
      const deviceType = this.getDeviceTypeFromPage(params.page);
      if (deviceType) {
        breadcrumbs.push({
          label: this.getDeviceDisplayName(deviceType),
          onClick: undefined // Current page
        });
      }
    } else {
      breadcrumbs.push({
        label: this.getPageDisplayName(params.page),
        onClick: undefined // Current page
      });
    }

    return breadcrumbs;
  }

  // Get display name for device type
  private getDeviceDisplayName(deviceType: string): string {
    const names: Record<string, string> = {
      camera: 'Camera',
      mount: 'Mount',
      focuser: 'Focuser',
      filter: 'Filter Wheel'
    };
    return names[deviceType] || deviceType;
  }

  // Get display name for page
  private getPageDisplayName(page: CurrentPage): string {
    const names: Record<CurrentPage, string> = {
      dashboard: 'Dashboard',
      devices: 'Equipment',
      sequence: 'Sequences',
      weather: 'Weather',
      analysis: 'Analysis',
      targets: 'Targets',
      health: 'Health',
      guiding: 'Guiding',
      logs: 'Logs',
      settings: 'Settings',
      'camera-detail': 'Camera',
      'mount-detail': 'Mount',
      'focuser-detail': 'Focuser',
      'filter-detail': 'Filter Wheel',
      profiles: 'Profiles',
      monitor: 'Monitor',
      planner: 'Planner'
    };
    return names[page] || page;
  }
}

// Export singleton instance
export const navigationManager = NavigationManager.getInstance();

// Hook for using navigation in React components
export function useNavigation() {
  return {
    navigateTo: (page: CurrentPage, deviceId?: string, tab?: string) => 
      navigationManager.navigateTo(page, deviceId, tab),
    navigateBack: () => navigationManager.navigateBack(),
    getCurrentRoute: () => navigationManager.getCurrentRoute(),
    isDeviceDetailPage: (page: CurrentPage) => navigationManager.isDeviceDetailPage(page),
    generateBreadcrumbs: (params: RouteParams) => navigationManager.generateBreadcrumbs(params)
  };
}

// URL-based navigation utilities
export const UrlNavigation = {
  // Generate shareable URLs for device detail pages
  getDeviceDetailUrl: (deviceType: string, deviceId: string, tab?: string): string => {
    const pageMap: Record<string, CurrentPage> = {
      camera: 'camera-detail',
      mount: 'mount-detail',
      focuser: 'focuser-detail',
      filter: 'filter-detail'
    };
    
    const page = pageMap[deviceType];
    if (!page) return '/devices';
    
    return navigationManager['buildUrl']({ page, deviceId, tab });
  },

  // Parse device detail URL
  parseDeviceDetailUrl: (url: string) => {
    return navigationManager.parseUrl(url);
  },

  // Check if URL is a device detail page
  isDeviceDetailUrl: (url: string): boolean => {
    const params = navigationManager.parseUrl(url);
    return navigationManager.isDeviceDetailPage(params.page);
  }
};
