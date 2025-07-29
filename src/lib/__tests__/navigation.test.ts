import { NavigationManager, navigationManager, UrlNavigation } from '../navigation';

// Mock window.history and window.location
const mockPushState = jest.fn();
const mockBack = jest.fn();
const mockAddEventListener = jest.fn();

Object.defineProperty(window, 'history', {
  value: {
    pushState: mockPushState,
    back: mockBack,
  },
  writable: true,
});

Object.defineProperty(window, 'location', {
  value: {
    pathname: '/dashboard',
    search: '',
  },
  writable: true,
});

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});

describe('NavigationManager', () => {
  let manager: NavigationManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = NavigationManager.getInstance();
  });

  describe('URL Building and Parsing', () => {
    it('builds correct URLs for device detail pages', () => {
      const url = manager['buildUrl']({
        page: 'camera-detail',
        deviceId: 'camera-001',
        tab: 'controls'
      });

      expect(url).toBe('/camera-detail/camera-001?tab=controls');
    });

    it('builds URLs without optional parameters', () => {
      const url = manager['buildUrl']({
        page: 'dashboard'
      });

      expect(url).toBe('/dashboard');
    });

    it('parses URLs correctly', () => {
      const params = manager.parseUrl('/camera-detail/camera-001?tab=metrics');

      expect(params).toEqual({
        page: 'camera-detail',
        deviceId: 'camera-001',
        tab: 'metrics'
      });
    });

    it('parses simple URLs', () => {
      const params = manager.parseUrl('/dashboard');

      expect(params).toEqual({
        page: 'dashboard',
        deviceId: undefined,
        tab: undefined
      });
    });

    it('handles empty URLs', () => {
      const params = manager.parseUrl('/');

      expect(params).toEqual({
        page: 'dashboard',
        deviceId: undefined,
        tab: undefined
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to a page and updates URL', () => {
      const mockListener = jest.fn();
      manager.subscribe(mockListener);

      manager.navigateTo('camera-detail', 'camera-001', 'controls');

      expect(mockPushState).toHaveBeenCalledWith(
        { page: 'camera-detail', deviceId: 'camera-001', tab: 'controls' },
        '',
        '/camera-detail/camera-001?tab=controls'
      );

      expect(mockListener).toHaveBeenCalledWith({
        page: 'camera-detail',
        deviceId: 'camera-001',
        tab: 'controls'
      });
    });

    it('navigates back in history', () => {
      manager.navigateBack();
      expect(mockBack).toHaveBeenCalled();
    });

    it('allows subscription and unsubscription', () => {
      const mockListener = jest.fn();
      const unsubscribe = manager.subscribe(mockListener);

      manager.navigateTo('dashboard');
      expect(mockListener).toHaveBeenCalledTimes(1);

      unsubscribe();
      manager.navigateTo('devices');
      expect(mockListener).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Device Type Detection', () => {
    it('identifies device detail pages correctly', () => {
      expect(manager.isDeviceDetailPage('camera-detail')).toBe(true);
      expect(manager.isDeviceDetailPage('mount-detail')).toBe(true);
      expect(manager.isDeviceDetailPage('focuser-detail')).toBe(true);
      expect(manager.isDeviceDetailPage('filter-detail')).toBe(true);
      expect(manager.isDeviceDetailPage('dashboard')).toBe(false);
      expect(manager.isDeviceDetailPage('devices')).toBe(false);
    });

    it('extracts device type from page correctly', () => {
      expect(manager.getDeviceTypeFromPage('camera-detail')).toBe('camera');
      expect(manager.getDeviceTypeFromPage('mount-detail')).toBe('mount');
      expect(manager.getDeviceTypeFromPage('focuser-detail')).toBe('focuser');
      expect(manager.getDeviceTypeFromPage('filter-detail')).toBe('filter');
      expect(manager.getDeviceTypeFromPage('dashboard')).toBe(null);
    });

    it('provides default device IDs', () => {
      expect(manager.getDeviceId('camera-detail')).toBe('camera-001');
      expect(manager.getDeviceId('mount-detail')).toBe('mount-001');
      expect(manager.getDeviceId('focuser-detail')).toBe('focuser-001');
      expect(manager.getDeviceId('filter-detail')).toBe('filter-001');
      expect(manager.getDeviceId('dashboard')).toBe('unknown');
    });

    it('uses provided device ID when available', () => {
      expect(manager.getDeviceId('camera-detail', 'custom-camera')).toBe('custom-camera');
    });
  });

  describe('Breadcrumb Generation', () => {
    it('generates breadcrumbs for device detail pages', () => {
      const breadcrumbs = manager.generateBreadcrumbs({
        page: 'camera-detail',
        deviceId: 'camera-001'
      });

      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].label).toBe('Dashboard');
      expect(breadcrumbs[1].label).toBe('Equipment');
      expect(breadcrumbs[2].label).toBe('Camera');
      expect(breadcrumbs[2].onClick).toBeUndefined(); // Current page
    });

    it('generates breadcrumbs for regular pages', () => {
      const breadcrumbs = manager.generateBreadcrumbs({
        page: 'devices'
      });

      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[0].label).toBe('Dashboard');
      expect(breadcrumbs[1].label).toBe('Equipment');
      expect(breadcrumbs[1].onClick).toBeUndefined(); // Current page
    });
  });

  describe('Initialization', () => {
    it('initializes and sets up event listeners', () => {
      const params = manager.initialize();

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );

      expect(params).toEqual({
        page: 'dashboard',
        deviceId: undefined,
        tab: undefined
      });
    });
  });
});

describe('UrlNavigation', () => {
  describe('Device Detail URLs', () => {
    it('generates device detail URLs correctly', () => {
      const url = UrlNavigation.getDeviceDetailUrl('camera', 'camera-001', 'controls');
      expect(url).toBe('/camera-detail/camera-001?tab=controls');
    });

    it('generates URLs without tab parameter', () => {
      const url = UrlNavigation.getDeviceDetailUrl('mount', 'mount-001');
      expect(url).toBe('/mount-detail/mount-001');
    });

    it('handles invalid device types', () => {
      const url = UrlNavigation.getDeviceDetailUrl('invalid', 'device-001');
      expect(url).toBe('/devices');
    });

    it('parses device detail URLs correctly', () => {
      const params = UrlNavigation.parseDeviceDetailUrl('/focuser-detail/focuser-001?tab=metrics');
      
      expect(params).toEqual({
        page: 'focuser-detail',
        deviceId: 'focuser-001',
        tab: 'metrics'
      });
    });

    it('identifies device detail URLs correctly', () => {
      expect(UrlNavigation.isDeviceDetailUrl('/camera-detail/camera-001')).toBe(true);
      expect(UrlNavigation.isDeviceDetailUrl('/mount-detail/mount-001?tab=controls')).toBe(true);
      expect(UrlNavigation.isDeviceDetailUrl('/dashboard')).toBe(false);
      expect(UrlNavigation.isDeviceDetailUrl('/devices')).toBe(false);
    });
  });
});

describe('Singleton Pattern', () => {
  it('returns the same instance', () => {
    const instance1 = NavigationManager.getInstance();
    const instance2 = NavigationManager.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('maintains state across getInstance calls', () => {
    const instance1 = NavigationManager.getInstance();
    const mockListener = jest.fn();
    
    instance1.subscribe(mockListener);
    
    const instance2 = NavigationManager.getInstance();
    instance2.navigateTo('dashboard');
    
    expect(mockListener).toHaveBeenCalled();
  });
});

describe('navigationManager export', () => {
  it('exports the singleton instance', () => {
    expect(navigationManager).toBeInstanceOf(NavigationManager);
    expect(navigationManager).toBe(NavigationManager.getInstance());
  });
});

describe('Edge Cases', () => {
  it('handles malformed URLs gracefully', () => {
    const manager = NavigationManager.getInstance();

    const params1 = manager.parseUrl('///invalid//url//');
    expect(params1.page).toBe('dashboard');

    const params2 = manager.parseUrl('/camera-detail/?tab=');
    expect(params2.page).toBe('camera-detail');
    expect(params2.tab).toBe(undefined);
  });

  it('handles special characters in URLs', () => {
    const manager = NavigationManager.getInstance();

    const params = manager.parseUrl('/camera-detail/camera%20001?tab=control%20panel');
    expect(params.deviceId).toBe('camera%20001');
    expect(params.tab).toBe('control%20panel');
  });

  it('handles empty search parameters', () => {
    const manager = NavigationManager.getInstance();

    const params = manager.parseUrl('/camera-detail/camera-001?');
    expect(params.page).toBe('camera-detail');
    expect(params.deviceId).toBe('camera-001');
    expect(params.tab).toBe(undefined);
  });
});
