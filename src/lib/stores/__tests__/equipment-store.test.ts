/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';

// Mock zustand persist middleware to avoid localStorage issues in tests
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
  createJSONStorage: () => ({
    getItem: jest.fn(() => null),
    setItem: jest.fn(() => {}),
    removeItem: jest.fn(() => {}),
  }),
  subscribeWithSelector: (fn: any) => fn,
}));

jest.mock('zustand/middleware/immer', () => ({
  immer: (fn: any) => (set: any, get: any, api: any) => {
    const immerSet = (update: any) => {
      if (typeof update === 'function') {
        const state = get();
        update(state);
        set(state);
      } else {
        set(update);
      }
    };
    return fn(immerSet, get, api);
  },
}));

import { useEquipmentStore } from '../equipment-store';

// Helper function to run async actions with fake timers
const runAsyncActionWithTimers = async (action: () => Promise<any>, timeToAdvance: number = 5000) => {
  let actionPromise: Promise<any>;
  await act(async () => {
    actionPromise = action();
    jest.advanceTimersByTime(timeToAdvance);
    await actionPromise;
  });
};

describe('useEquipmentStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any persisted state
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    // Use fake timers for consistent async behavior
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clean up any pending timers
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Simple test to verify store works
  it('should create store instance', () => {
    const { result } = renderHook(() => useEquipmentStore());
    expect(result.current).toBeDefined();
    expect(result.current).not.toBeNull();
    expect(typeof result.current.setEquipmentStatus).toBe('function');
  });

  describe('Initial State', () => {
    it('should have correct initial equipment status', () => {
      const { result } = renderHook(() => useEquipmentStore());

      expect(result.current.equipmentStatus).toEqual({
        camera: 'disconnected',
        mount: 'disconnected',
        filterWheel: 'disconnected',
        focuser: 'disconnected',
      });
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.connectionError).toBeNull();
      expect(result.current.lastStatusUpdate).toBeNull();
    });

    it('should have correct initial camera settings', () => {
      const { result } = renderHook(() => useEquipmentStore());

      expect(result.current.cameraSettings).toEqual({
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
      expect(result.current.cameraTemp).toBe(15);
      expect(result.current.isCameraCapturing).toBe(false);
      expect(result.current.cameraError).toBeNull();
    });

    it('should have correct initial mount status', () => {
      const { result } = renderHook(() => useEquipmentStore());
      
      expect(result.current.mountStatus).toEqual(
        expect.objectContaining({
          ra: '00:00:00',
          dec: '+00:00:00',
          rightAscension: 0,
          declination: 0,
          altitude: 45,
          azimuth: 180,
          tracking: false,
          slewing: false,
          parked: true,
          pierSide: 'East',
          sideOfPier: 'East',
          siderealTime: '00:00:00',
        })
      );
      expect(result.current.isMountSlewing).toBe(false);
      expect(result.current.mountError).toBeNull();
    });

    it('should have correct initial filter wheel status', () => {
      const { result } = renderHook(() => useEquipmentStore());
      
      expect(result.current.filterWheelStatus).toEqual({
        position: 1,
        currentPosition: 1,
        moving: false,
        temperature: 20,
        filterNames: ['Luminance', 'Red', 'Green', 'Blue', 'Ha', 'OIII', 'SII', 'Clear'],
      });
      expect(result.current.isFilterWheelMoving).toBe(false);
      expect(result.current.filterWheelError).toBeNull();
    });

    it('should have correct initial focuser status', () => {
      const { result } = renderHook(() => useEquipmentStore());
      
      expect(result.current.focuserStatus).toEqual({
        position: 50000,
        moving: false,
        temperature: 18,
        tempCompEnabled: true,
        tempCoeff: -2.5,
      });
      expect(result.current.autoFocus).toEqual({
        running: false,
        hfr: 2.5,
        targetHFR: 2.0,
        tolerance: 0.1,
        maxSteps: 50,
        stepSize: 100,
        backlash: 200,
        useTemperatureCompensation: true,
      });
      expect(result.current.isFocuserMoving).toBe(false);
      expect(result.current.focuserError).toBeNull();
    });
  });

  describe('Equipment Status Management', () => {
    it('should update equipment status', () => {
      const { result } = renderHook(() => useEquipmentStore());

      act(() => {
        result.current.setEquipmentStatus({
          camera: 'connected',
          mount: 'connecting',
        });
      });

      expect(result.current.equipmentStatus.camera).toBe('connected');
      expect(result.current.equipmentStatus.mount).toBe('connecting');
      expect(result.current.equipmentStatus.filterWheel).toBe('disconnected'); // unchanged
      expect(result.current.lastStatusUpdate).toBeInstanceOf(Date);
    });

    it('should refresh equipment status', async () => {
      const { result } = renderHook(() => useEquipmentStore());

      // Start the refresh operation
      let refreshPromise: Promise<void>;

      await act(async () => {
        refreshPromise = result.current.refreshEquipmentStatus();
        // Allow the initial state update to happen
        await Promise.resolve();
      });

      // Should set loading state
      expect(result.current.isConnecting).toBe(true);
      expect(result.current.connectionError).toBeNull();

      // Advance timers to complete the operation
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await refreshPromise;
      });

      // Should complete loading
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.lastStatusUpdate).toBeInstanceOf(Date);
      // Equipment status should be updated (random values)
      expect(['connected', 'disconnected', 'error']).toContain(result.current.equipmentStatus.camera);
    });
  });

  describe('Camera Management', () => {
    it('should update camera settings', () => {
      const { result } = renderHook(() => useEquipmentStore());
      
      act(() => {
        result.current.setCameraSettings({
          exposure: 120,
          iso: 1600,
          gain: 200,
        });
      });

      expect(result.current.cameraSettings.exposure).toBe(120);
      expect(result.current.cameraSettings.iso).toBe(1600);
      expect(result.current.cameraSettings.gain).toBe(200);
      // Other settings should remain unchanged
      expect(result.current.cameraSettings.binning).toBe('1x1');
    });

    it('should update camera temperature', () => {
      const { result } = renderHook(() => useEquipmentStore());
      
      act(() => {
        result.current.setCameraTemp(-15);
      });

      expect(result.current.cameraTemp).toBe(-15);
    });
  });
});