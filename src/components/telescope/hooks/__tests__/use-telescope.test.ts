/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useTelescope } from '../use-telescope';

// Mock the app store
const mockStore = {
  mountStatus: {
    ra: '00:00:00',
    dec: '+00:00:00',
    altitude: 45,
    azimuth: 180,
    tracking: false,
    slewing: false,
    parked: false,
    pierSide: 'east',
  },
  slewTarget: {
    ra: '12:00:00',
    dec: '+30:00:00',
    name: 'Test Target',
  },
  slewRate: 'guide',
  trackingRate: 'sidereal',
  equipmentStatus: {
    mount: 'disconnected',
    camera: 'disconnected',
    filterWheel: 'disconnected',
    focuser: 'disconnected',
  },
  setMountStatus: jest.fn(),
  setSlewTarget: jest.fn(),
  setSlewRate: jest.fn(),
  setTrackingRate: jest.fn(),
};

jest.mock('@/lib/store', () => ({
  useAppStore: () => mockStore,
}));

// Mock telescope utilities
jest.mock('../../utils/telescope.utils', () => ({
  validateSlewTarget: jest.fn(() => ({ isValid: true, errors: [] })),
  canPerformOperation: jest.fn(() => true),
}));

describe('useTelescope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock store state
    mockStore.mountStatus = {
      ra: '00:00:00',
      dec: '+00:00:00',
      altitude: 45,
      azimuth: 180,
      tracking: false,
      slewing: false,
      parked: false,
      pierSide: 'east',
    };
    
    mockStore.equipmentStatus.mount = 'disconnected';
  });

  describe('Basic Functionality', () => {
    it('should return telescope status with connection info', () => {
      const { result } = renderHook(() => useTelescope());

      expect(result.current.telescopeStatus).toEqual({
        ra: '00:00:00',
        dec: '+00:00:00',
        altitude: 45,
        azimuth: 180,
        tracking: false,
        slewing: false,
        parked: false,
        pierSide: 'east',
        connected: false,
      });
    });

    it('should reflect connection status from equipment store', () => {
      mockStore.equipmentStatus.mount = 'connected';
      
      const { result } = renderHook(() => useTelescope());

      expect(result.current.telescopeStatus.connected).toBe(true);
    });

    it('should provide slew target information', () => {
      const { result } = renderHook(() => useTelescope());

      expect(result.current.slewTarget).toEqual({
        ra: '12:00:00',
        dec: '+30:00:00',
        name: 'Test Target',
      });
    });

    it('should provide slew and tracking rates', () => {
      const { result } = renderHook(() => useTelescope());

      expect(result.current.slewRate).toBe('guide');
      expect(result.current.trackingRate).toBe('sidereal');
    });
  });

  describe('Mount Status Updates', () => {
    it('should update mount status', () => {
      const { result } = renderHook(() => useTelescope());

      const newStatus = {
        ra: '12:30:45',
        dec: '+45:30:15',
        altitude: 60,
        azimuth: 270,
        tracking: true,
        slewing: false,
        parked: false,
        pierSide: 'west',
      };

      act(() => {
        result.current.setMountStatus(newStatus);
      });

      expect(mockStore.setMountStatus).toHaveBeenCalledWith(newStatus);
    });

    it('should update slew target', () => {
      const { result } = renderHook(() => useTelescope());

      const newTarget = {
        ra: '20:15:30',
        dec: '-15:45:20',
        name: 'New Target',
      };

      act(() => {
        result.current.setSlewTarget(newTarget);
      });

      expect(mockStore.setSlewTarget).toHaveBeenCalledWith(newTarget);
    });

    it('should update slew rate', () => {
      const { result } = renderHook(() => useTelescope());

      act(() => {
        result.current.setSlewRate('max');
      });

      expect(mockStore.setSlewRate).toHaveBeenCalledWith('max');
    });

    it('should update tracking rate', () => {
      const { result } = renderHook(() => useTelescope());

      act(() => {
        result.current.setTrackingRate('lunar');
      });

      expect(mockStore.setTrackingRate).toHaveBeenCalledWith('lunar');
    });
  });

  describe('Operational Capabilities', () => {
    it('should indicate when mount can slew', () => {
      mockStore.equipmentStatus.mount = 'connected';
      mockStore.mountStatus.slewing = false;
      mockStore.mountStatus.parked = false;

      const { result } = renderHook(() => useTelescope());

      expect(result.current.canSlew).toBe(true);
    });

    it('should indicate when mount cannot slew (disconnected)', () => {
      mockStore.equipmentStatus.mount = 'disconnected';

      const { result } = renderHook(() => useTelescope());

      expect(result.current.canSlew).toBe(false);
    });

    it('should indicate when mount cannot slew (already slewing)', () => {
      mockStore.equipmentStatus.mount = 'connected';
      mockStore.mountStatus.slewing = true;

      const { result } = renderHook(() => useTelescope());

      expect(result.current.canSlew).toBe(false);
    });

    it('should indicate when mount cannot slew (parked)', () => {
      mockStore.equipmentStatus.mount = 'connected';
      mockStore.mountStatus.parked = true;

      const { result } = renderHook(() => useTelescope());

      expect(result.current.canSlew).toBe(false);
    });

    it('should indicate when mount can track', () => {
      mockStore.equipmentStatus.mount = 'connected';
      mockStore.mountStatus.slewing = false;
      mockStore.mountStatus.parked = false;

      const { result } = renderHook(() => useTelescope());

      expect(result.current.canTrack).toBe(true);
    });

    it('should indicate when mount can move', () => {
      mockStore.equipmentStatus.mount = 'connected';
      mockStore.mountStatus.parked = false;

      const { result } = renderHook(() => useTelescope());

      expect(result.current.canMove).toBe(true);
    });
  });

  describe('Telescope Operations', () => {
    beforeEach(() => {
      mockStore.equipmentStatus.mount = 'connected';
      mockStore.mountStatus.slewing = false;
      mockStore.mountStatus.parked = false;
    });

    it('should start slew operation', async () => {
      const { result } = renderHook(() => useTelescope());

      await act(async () => {
        await result.current.startSlew();
      });

      expect(mockStore.setMountStatus).toHaveBeenCalledWith(
        expect.objectContaining({ slewing: true })
      );
    });

    it('should abort slew operation', async () => {
      mockStore.mountStatus.slewing = true;
      
      const { result } = renderHook(() => useTelescope());

      await act(async () => {
        await result.current.abortSlew();
      });

      expect(mockStore.setMountStatus).toHaveBeenCalledWith(
        expect.objectContaining({ slewing: false })
      );
    });

    it('should start tracking', async () => {
      const { result } = renderHook(() => useTelescope());

      await act(async () => {
        await result.current.startTracking();
      });

      expect(mockStore.setMountStatus).toHaveBeenCalledWith(
        expect.objectContaining({ tracking: true })
      );
    });

    it('should stop tracking', async () => {
      mockStore.mountStatus.tracking = true;
      
      const { result } = renderHook(() => useTelescope());

      await act(async () => {
        await result.current.stopTracking();
      });

      expect(mockStore.setMountStatus).toHaveBeenCalledWith(
        expect.objectContaining({ tracking: false })
      );
    });

    it('should park mount', async () => {
      const { result } = renderHook(() => useTelescope());

      await act(async () => {
        await result.current.parkMount();
      });

      expect(mockStore.setMountStatus).toHaveBeenCalledWith(
        expect.objectContaining({ 
          parked: true,
          tracking: false,
          slewing: false,
        })
      );
    });

    it('should unpark mount', async () => {
      mockStore.mountStatus.parked = true;
      
      const { result } = renderHook(() => useTelescope());

      await act(async () => {
        await result.current.unparkMount();
      });

      expect(mockStore.setMountStatus).toHaveBeenCalledWith(
        expect.objectContaining({ parked: false })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle slew errors when mount is disconnected', async () => {
      mockStore.equipmentStatus.mount = 'disconnected';
      
      const { result } = renderHook(() => useTelescope());

      await expect(result.current.startSlew()).rejects.toThrow('Mount not connected');
    });

    it('should handle tracking errors when mount is parked', async () => {
      mockStore.equipmentStatus.mount = 'connected';
      mockStore.mountStatus.parked = true;
      
      const { result } = renderHook(() => useTelescope());

      await expect(result.current.startTracking()).rejects.toThrow('Cannot track while parked');
    });

    it('should handle invalid slew targets', async () => {
      const { validateSlewTarget } = require('../../utils/telescope.utils');
      validateSlewTarget.mockReturnValue({
        isValid: false,
        errors: ['Invalid RA format']
      });

      mockStore.equipmentStatus.mount = 'connected';

      const { result } = renderHook(() => useTelescope());

      await expect(result.current.startSlew()).rejects.toThrow('Invalid RA format');
    });

    it('should handle operation capability checks', async () => {
      const { canPerformOperation } = require('../../utils/telescope.utils');
      canPerformOperation.mockReturnValue(false);

      mockStore.equipmentStatus.mount = 'connected';
      
      const { result } = renderHook(() => useTelescope());

      await expect(result.current.startSlew()).rejects.toThrow('Operation not permitted');
    });
  });

  describe('State Synchronization', () => {
    it('should reflect real-time mount status changes', () => {
      const { result, rerender } = renderHook(() => useTelescope());

      expect(result.current.telescopeStatus.tracking).toBe(false);

      // Simulate external mount status change
      mockStore.mountStatus.tracking = true;
      rerender();

      expect(result.current.telescopeStatus.tracking).toBe(true);
    });

    it('should reflect connection status changes', () => {
      const { result, rerender } = renderHook(() => useTelescope());

      expect(result.current.telescopeStatus.connected).toBe(false);

      mockStore.equipmentStatus.mount = 'connected';
      rerender();

      expect(result.current.telescopeStatus.connected).toBe(true);
    });

    it('should maintain slew target consistency', () => {
      const { result, rerender } = renderHook(() => useTelescope());

      const newTarget = {
        ra: '15:30:45',
        dec: '+60:15:30',
        name: 'Updated Target',
      };

      mockStore.slewTarget = newTarget;
      rerender();

      expect(result.current.slewTarget).toEqual(newTarget);
    });
  });
});
