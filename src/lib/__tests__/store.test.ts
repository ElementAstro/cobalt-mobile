/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { useAppStore } from '../store';

// Mock zustand persist middleware
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

describe('App Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().resetStore();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAppStore());
      const state = result.current;

      expect(state.currentPage).toBe('dashboard');
      expect(state.language).toBe('en');
      expect(state.theme).toBe('auto');
      expect(state.isConnected).toBe(false);
      expect(state.connectionType).toBe('wifi');
      expect(state.equipmentStatus).toEqual({
        camera: 'disconnected',
        mount: 'disconnected',
        filterWheel: 'disconnected',
        focuser: 'disconnected',
      });
    });

    it('should have default environmental data', () => {
      const { result } = renderHook(() => useAppStore());
      const state = result.current;

      expect(state.environmentalData).toEqual({
        temperature: 20,
        humidity: 50,
        pressure: 1013.2,
        lightPollution: 18.5,
      });
    });

    it('should have default camera settings', () => {
      const { result } = renderHook(() => useAppStore());
      const state = result.current;

      expect(state.cameraSettings).toEqual({
        exposure: 60,
        iso: 800,
        binning: '1x1',
        gain: 100,
        offset: 10,
        temperature: -10,
        coolingEnabled: true,
        frameType: 'Light',
        imageFormat: 'FITS',
      });
    });
  });

  describe('Page Navigation', () => {
    it('should update current page', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setCurrentPage('devices');
      });

      expect(result.current.currentPage).toBe('devices');
    });

    it('should handle all valid page types', () => {
      const { result } = renderHook(() => useAppStore());
      const validPages = [
        'dashboard',
        'devices',
        'sequence',
        'logs',
        'settings',
        'camera-detail',
        'mount-detail',
        'filter-detail',
        'focuser-detail',
        'profiles',
        'monitor',
        'planner',
      ] as const;

      validPages.forEach(page => {
        act(() => {
          result.current.setCurrentPage(page);
        });
        expect(result.current.currentPage).toBe(page);
      });
    });
  });

  describe('Language Settings', () => {
    it('should update language', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setLanguage('es');
      });

      expect(result.current.language).toBe('es');
    });

    it('should handle all supported languages', () => {
      const { result } = renderHook(() => useAppStore());
      const languages = ['en', 'es', 'fr', 'de', 'zh', 'ja'] as const;

      languages.forEach(lang => {
        act(() => {
          result.current.setLanguage(lang);
        });
        expect(result.current.language).toBe(lang);
      });
    });
  });

  describe('Theme Settings', () => {
    it('should update theme', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should handle all theme options', () => {
      const { result } = renderHook(() => useAppStore());
      const themes = ['light', 'dark', 'auto'] as const;

      themes.forEach(theme => {
        act(() => {
          result.current.setTheme(theme);
        });
        expect(result.current.theme).toBe(theme);
      });
    });
  });

  describe('Connection Management', () => {
    it('should update connection status', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setIsConnected(true);
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('should update connection type', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setConnectionType('bluetooth');
      });

      expect(result.current.connectionType).toBe('bluetooth');
    });

    it('should handle all connection types', () => {
      const { result } = renderHook(() => useAppStore());
      const connectionTypes = ['wifi', 'bluetooth', 'usb'] as const;

      connectionTypes.forEach(type => {
        act(() => {
          result.current.setConnectionType(type);
        });
        expect(result.current.connectionType).toBe(type);
      });
    });
  });

  describe('Equipment Status', () => {
    it('should update equipment status', () => {
      const { result } = renderHook(() => useAppStore());

      const newStatus = {
        camera: 'connected' as const,
        mount: 'connecting' as const,
        filterWheel: 'error' as const,
        focuser: 'disconnected' as const,
      };

      act(() => {
        result.current.setEquipmentStatus(newStatus);
      });

      expect(result.current.equipmentStatus).toEqual(newStatus);
    });

    it('should update individual equipment status', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateEquipmentStatus('camera', 'connected');
      });

      expect(result.current.equipmentStatus.camera).toBe('connected');
      expect(result.current.equipmentStatus.mount).toBe('disconnected'); // Others unchanged
    });

    it('should handle all equipment status values', () => {
      const { result } = renderHook(() => useAppStore());
      const statuses = ['connected', 'disconnected', 'error', 'connecting'] as const;

      statuses.forEach(status => {
        act(() => {
          result.current.updateEquipmentStatus('camera', status);
        });
        expect(result.current.equipmentStatus.camera).toBe(status);
      });
    });
  });

  describe('Environmental Data', () => {
    it('should update environmental data', () => {
      const { result } = renderHook(() => useAppStore());

      const newData = {
        temperature: 25,
        humidity: 60,
        pressure: 1020,
        lightPollution: 3,
      };

      act(() => {
        result.current.setEnvironmentalData(newData);
      });

      expect(result.current.environmentalData).toEqual(newData);
    });

    it('should update partial environmental data', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateEnvironmentalData({ temperature: 15 });
      });

      expect(result.current.environmentalData.temperature).toBe(15);
      expect(result.current.environmentalData.humidity).toBe(50); // Unchanged
    });
  });

  describe('Camera Settings', () => {
    it('should update camera settings', () => {
      const { result } = renderHook(() => useAppStore());

      const newSettings = {
        exposure: 60,
        iso: 1600,
        binning: '2x2',
        gain: 200,
        offset: 20,
        temperature: -20,
        coolingEnabled: false,
        frameType: 'dark',
        imageFormat: 'raw',
      };

      act(() => {
        result.current.setCameraSettings(newSettings);
      });

      expect(result.current.cameraSettings).toEqual(newSettings);
    });

    it('should update partial camera settings', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateCameraSettings({ exposure: 120, gain: 150 });
      });

      expect(result.current.cameraSettings.exposure).toBe(120);
      expect(result.current.cameraSettings.gain).toBe(150);
      expect(result.current.cameraSettings.iso).toBe(800); // Unchanged
    });
  });

  describe('Mount Status', () => {
    it('should update mount status', () => {
      const { result } = renderHook(() => useAppStore());

      const newStatus = {
        ra: '12h 30m 45s',
        dec: '+45° 30\' 15"',
        azimuth: 180,
        altitude: 45,
        isTracking: true,
        isSlewing: false,
        pierSide: 'east' as const,
        sideOfPier: 'east' as const,
      };

      act(() => {
        result.current.setMountStatus(newStatus);
      });

      expect(result.current.mountStatus).toEqual(expect.objectContaining(newStatus));
    });

    it('should update partial mount status', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.updateMountStatus({ isTracking: true, isSlewing: true });
      });

      expect(result.current.mountStatus.isTracking).toBe(true);
      expect(result.current.mountStatus.isSlewing).toBe(true);
    });
  });

  describe('Notifications', () => {
    it('should add notification', () => {
      const { result } = renderHook(() => useAppStore());

      const notification = {
        id: 'test-1',
        type: 'info' as const,
        title: 'Test Notification',
        message: 'This is a test',
        timestamp: new Date(),
      };

      act(() => {
        result.current.addNotification(notification);
      });

      expect(result.current.notifications).toContain(notification);
    });

    it('should remove notification', () => {
      const { result } = renderHook(() => useAppStore());

      const notification = {
        id: 'test-1',
        type: 'info' as const,
        title: 'Test Notification',
        message: 'This is a test',
        timestamp: new Date(),
      };

      act(() => {
        result.current.addNotification(notification);
      });

      expect(result.current.notifications).toContain(notification);

      act(() => {
        result.current.removeNotification('test-1');
      });

      expect(result.current.notifications).not.toContain(notification);
    });

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useAppStore());

      const notifications = [
        { id: '1', type: 'info' as const, title: 'Test 1', message: 'Message 1', timestamp: new Date() },
        { id: '2', type: 'warning' as const, title: 'Test 2', message: 'Message 2', timestamp: new Date() },
      ];

      act(() => {
        notifications.forEach(n => result.current.addNotification(n));
      });

      expect(result.current.notifications).toHaveLength(2);

      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
    });
  });

  describe('Store Reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useAppStore());

      // Make some changes
      act(() => {
        result.current.setCurrentPage('devices');
        result.current.setLanguage('es');
        result.current.setTheme('dark');
        result.current.setIsConnected(true);
        result.current.addNotification({
          id: 'test',
          type: 'info',
          title: 'Test',
          message: 'Test',
          timestamp: new Date(),
        });
      });

      // Verify changes
      expect(result.current.currentPage).toBe('devices');
      expect(result.current.language).toBe('es');
      expect(result.current.theme).toBe('dark');
      expect(result.current.isConnected).toBe(true);
      expect(result.current.notifications).toHaveLength(1);

      // Reset store
      act(() => {
        result.current.resetStore();
      });

      // Verify reset
      expect(result.current.currentPage).toBe('dashboard');
      expect(result.current.language).toBe('en');
      expect(result.current.theme).toBe('auto');
      expect(result.current.isConnected).toBe(false);
      expect(result.current.notifications).toHaveLength(0);
    });
  });
});
