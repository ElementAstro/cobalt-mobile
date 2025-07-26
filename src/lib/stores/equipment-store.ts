import { createEnhancedStore, createAsyncAction } from './base-store';

// Equipment types
export interface EquipmentStatus {
  camera: 'connected' | 'disconnected' | 'error' | 'connecting';
  mount: 'connected' | 'disconnected' | 'error' | 'connecting';
  filterWheel: 'connected' | 'disconnected' | 'error' | 'connecting';
  focuser: 'connected' | 'disconnected' | 'error' | 'connecting';
}

export interface CameraSettings {
  exposure: number;
  iso: number;
  binning: string;
  gain: number;
  offset: number;
  temperature: number;
  coolingEnabled: boolean;
  frameType: string;
  imageFormat: string;
}

export interface MountStatus {
  ra: string;
  dec: string;
  rightAscension: number;
  declination: number;
  altitude: number;
  azimuth: number;
  tracking: boolean;
  slewing: boolean;
  parked: boolean;
  pierSide: string;
  sideOfPier: string;
  siderealTime: string;
  utcDate: string;
}

export interface FilterWheelStatus {
  position: number;
  currentPosition: number;
  moving: boolean;
  temperature: number;
  filterNames: string[];
}

export interface FocuserStatus {
  position: number;
  moving: boolean;
  temperature: number;
  tempCompEnabled: boolean;
  tempCoeff: number;
}

export interface AutoFocusSettings {
  running: boolean;
  hfr: number;
  targetHFR: number;
  tolerance: number;
  maxSteps: number;
  stepSize: number;
  backlash: number;
  useTemperatureCompensation: boolean;
}

// Equipment store state
interface EquipmentStoreState {
  // Status
  equipmentStatus: EquipmentStatus;
  isConnecting: boolean;
  connectionError: string | null;
  lastStatusUpdate: Date | null;

  // Camera
  cameraSettings: CameraSettings;
  cameraTemp: number;
  isCameraCapturing: boolean;
  cameraError: string | null;

  // Mount
  mountStatus: MountStatus;
  isMountSlewing: boolean;
  mountError: string | null;

  // Filter Wheel
  filterWheelStatus: FilterWheelStatus;
  isFilterWheelMoving: boolean;
  filterWheelError: string | null;

  // Focuser
  focuserStatus: FocuserStatus;
  autoFocus: AutoFocusSettings;
  isFocuserMoving: boolean;
  focuserError: string | null;

  // Actions
  setEquipmentStatus: (status: Partial<EquipmentStatus>) => void;
  refreshEquipmentStatus: () => Promise<void>;
  
  // Camera actions
  setCameraSettings: (settings: Partial<CameraSettings>) => void;
  setCameraTemp: (temp: number) => void;
  captureImage: (settings?: Partial<CameraSettings>) => Promise<void>;
  
  // Mount actions
  setMountStatus: (status: Partial<MountStatus>) => void;
  slewToCoordinates: (ra: number, dec: number) => Promise<void>;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  parkMount: () => Promise<void>;
  
  // Filter wheel actions
  setFilterWheelStatus: (status: Partial<FilterWheelStatus>) => void;
  changeFilter: (position: number) => Promise<void>;
  
  // Focuser actions
  setFocuserStatus: (status: Partial<FocuserStatus>) => void;
  setAutoFocus: (settings: Partial<AutoFocusSettings>) => void;
  moveFocuser: (steps: number) => Promise<void>;
  runAutoFocus: () => Promise<void>;
  
  // Utility actions
  connectAllEquipment: () => Promise<void>;
  disconnectAllEquipment: () => Promise<void>;
  emergencyStop: () => Promise<void>;
}

// Initial state
const initialEquipmentState = {
  equipmentStatus: {
    camera: 'disconnected' as const,
    mount: 'disconnected' as const,
    filterWheel: 'disconnected' as const,
    focuser: 'disconnected' as const,
  },
  isConnecting: false,
  connectionError: null,
  lastStatusUpdate: null,

  cameraSettings: {
    exposure: 60,
    iso: 800,
    binning: '1x1',
    gain: 100,
    offset: 10,
    temperature: -10,
    coolingEnabled: true,
    frameType: 'Light',
    imageFormat: 'FITS',
  },
  cameraTemp: 15,
  isCameraCapturing: false,
  cameraError: null,

  mountStatus: {
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
    utcDate: new Date().toISOString(),
  },
  isMountSlewing: false,
  mountError: null,

  filterWheelStatus: {
    position: 1,
    currentPosition: 1,
    moving: false,
    temperature: 20,
    filterNames: ['Luminance', 'Red', 'Green', 'Blue', 'Ha', 'OIII', 'SII', 'Clear'],
  },
  isFilterWheelMoving: false,
  filterWheelError: null,

  focuserStatus: {
    position: 50000,
    moving: false,
    temperature: 18,
    tempCompEnabled: true,
    tempCoeff: -2.5,
  },
  autoFocus: {
    running: false,
    hfr: 2.5,
    targetHFR: 2.0,
    tolerance: 0.1,
    maxSteps: 50,
    stepSize: 100,
    backlash: 200,
    useTemperatureCompensation: true,
  },
  isFocuserMoving: false,
  focuserError: null,
};

// Create equipment store
export const useEquipmentStore = createEnhancedStore<EquipmentStoreState>(
  {
    name: 'equipment-store',
    version: 1,
    persist: true,
    persistKeys: ['cameraSettings', 'autoFocus', 'filterWheelStatus'],
  },
  (set: any, get: any) => ({
    ...initialEquipmentState,

    // Equipment status actions
    setEquipmentStatus: (status: any) =>
      set((state: any) => {
        Object.assign(state.equipmentStatus, status);
        state.lastStatusUpdate = new Date();
      }),

    refreshEquipmentStatus: async () => {
      set((state: any) => { state.isConnecting = true; state.connectionError = null; });

      try {
        // Simulate equipment status refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        

        const getRandomStatus = () => {
          const rand = Math.random();
          if (rand < 0.8) return 'connected';
          if (rand < 0.95) return 'disconnected';
          return 'error';
        };

        const result = {
          camera: getRandomStatus(),
          mount: getRandomStatus(),
          filterWheel: getRandomStatus(),
          focuser: getRandomStatus(),
        };

        set((state: any) => {
          Object.assign(state.equipmentStatus, result);
          state.lastStatusUpdate = new Date();
          state.isConnecting = false;
        });
      } catch (error) {
        set((state: any) => {
          state.connectionError = error instanceof Error ? error.message : 'Unknown error';
          state.isConnecting = false;
        });
        throw error;
      }
    },

    // Camera actions
    setCameraSettings: (settings: any) =>
      set((state: any) => {
        Object.assign(state.cameraSettings, settings);
      }),

    setCameraTemp: (temp: any) =>
      set((state: any) => {
        state.cameraTemp = temp;
      }),

    captureImage: createAsyncAction(
      { setState: set, getState: get },
      async (settings?: Partial<CameraSettings>) => {
        const state = get();
        if (state.equipmentStatus.camera !== 'connected') {
          throw new Error('Camera not connected');
        }

        // Apply settings if provided
        if (settings) {
          set((state: any) => {
            Object.assign(state.cameraSettings, settings);
          });
        }

        // Simulate capture
        const exposure = settings?.exposure || state.cameraSettings.exposure;
        await new Promise(resolve => setTimeout(resolve, Math.min(exposure * 100, 5000)));
        
        return { success: true, filename: `image_${Date.now()}.fits` };
      },
      {
        loadingKey: 'isCameraCapturing',
        errorKey: 'cameraError',
      }
    ),

    // Mount actions
    setMountStatus: (status: any) =>
      set((state: any) => {
        Object.assign(state.mountStatus, status);
      }),

    slewToCoordinates: createAsyncAction(
      { setState: set, getState: get },
      async (ra: number, dec: number) => {
        const state = get();
        if (state.equipmentStatus.mount !== 'connected') {
          throw new Error('Mount not connected');
        }

        // Simulate slewing
        set((state: any) => {
          state.mountStatus.slewing = true;
          state.mountStatus.tracking = false;
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        set((state: any) => {
          state.mountStatus.rightAscension = ra;
          state.mountStatus.declination = dec;
          state.mountStatus.slewing = false;
          state.mountStatus.tracking = true;
        });
      },
      {
        loadingKey: 'isMountSlewing',
        errorKey: 'mountError',
      }
    ),

    startTracking: createAsyncAction(
      { setState: set, getState: get },
      async () => {
        const state = get();
        if (state.equipmentStatus.mount !== 'connected') {
          throw new Error('Mount not connected');
        }

        set((state: any) => {
          state.mountStatus.tracking = true;
        });
      },
      {
        errorKey: 'mountError',
      }
    ),

    stopTracking: createAsyncAction(
      { setState: set, getState: get },
      async () => {
        set((state: any) => {
          state.mountStatus.tracking = false;
        });
      },
      {
        errorKey: 'mountError',
      }
    ),

    parkMount: createAsyncAction(
      { setState: set, getState: get },
      async () => {
        const state = get();
        if (state.equipmentStatus.mount !== 'connected') {
          throw new Error('Mount not connected');
        }

        set((state: any) => {
          state.mountStatus.slewing = true;
          state.mountStatus.tracking = false;
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        set((state: any) => {
          state.mountStatus.parked = true;
          state.mountStatus.slewing = false;
        });
      },
      {
        loadingKey: 'isMountSlewing',
        errorKey: 'mountError',
      }
    ),

    // Filter wheel actions
    setFilterWheelStatus: (status: any) =>
      set((state: any) => {
        Object.assign(state.filterWheelStatus, status);
      }),

    changeFilter: createAsyncAction(
      { setState: set, getState: get },
      async (position: number) => {
        const state = get();
        if (state.equipmentStatus.filterWheel !== 'connected') {
          throw new Error('Filter wheel not connected');
        }

        set((state: any) => {
          state.filterWheelStatus.moving = true;
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        set((state: any) => {
          state.filterWheelStatus.position = position;
          state.filterWheelStatus.currentPosition = position;
          state.filterWheelStatus.moving = false;
        });
      },
      {
        loadingKey: 'isFilterWheelMoving',
        errorKey: 'filterWheelError',
      }
    ),

    // Focuser actions
    setFocuserStatus: (status: any) =>
      set((state: any) => {
        Object.assign(state.focuserStatus, status);
      }),

    setAutoFocus: (settings: any) =>
      set((state: any) => {
        Object.assign(state.autoFocus, settings);
      }),

    moveFocuser: createAsyncAction(
      { setState: set, getState: get },
      async (steps: number) => {
        const state = get();
        if (state.equipmentStatus.focuser !== 'connected') {
          throw new Error('Focuser not connected');
        }

        set((state: any) => {
          state.focuserStatus.moving = true;
        });

        await new Promise(resolve => setTimeout(resolve, Math.abs(steps) * 10));

        set((state: any) => {
          state.focuserStatus.position += steps;
          state.focuserStatus.moving = false;
        });
      },
      {
        loadingKey: 'isFocuserMoving',
        errorKey: 'focuserError',
      }
    ),

    runAutoFocus: createAsyncAction(
      { setState: set, getState: get },
      async () => {
        const state = get();
        if (state.equipmentStatus.focuser !== 'connected') {
          throw new Error('Focuser not connected');
        }
        if (state.equipmentStatus.camera !== 'connected') {
          throw new Error('Camera not connected');
        }

        set((state: any) => {
          state.autoFocus.running = true;
        });

        // Simulate auto focus routine
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));

          set((state: any) => {
            state.autoFocus.hfr = 3.0 - (i * 0.05) + (Math.random() * 0.2 - 0.1);
          });
        }

        set((state: any) => {
          state.autoFocus.running = false;
          state.autoFocus.hfr = state.autoFocus.targetHFR;
        });
      },
      {
        errorKey: 'focuserError',
      }
    ),

    // Utility actions
    connectAllEquipment: createAsyncAction(
      { setState: set, getState: get },
      async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        set((state: any) => {
          state.equipmentStatus.camera = 'connected';
          state.equipmentStatus.mount = 'connected';
          state.equipmentStatus.filterWheel = 'connected';
          state.equipmentStatus.focuser = 'connected';
          state.lastStatusUpdate = new Date();
        });
      },
      {
        loadingKey: 'isConnecting',
        errorKey: 'connectionError',
      }
    ),

    disconnectAllEquipment: createAsyncAction(
      { setState: set, getState: get },
      async () => {
        set((state: any) => {
          state.equipmentStatus.camera = 'disconnected';
          state.equipmentStatus.mount = 'disconnected';
          state.equipmentStatus.filterWheel = 'disconnected';
          state.equipmentStatus.focuser = 'disconnected';
          state.lastStatusUpdate = new Date();
        });
      },
      {
        errorKey: 'connectionError',
      }
    ),

    emergencyStop: createAsyncAction(
      { setState: set, getState: get },
      async () => {
        set((state: any) => {
          // Stop all ongoing operations
          state.isCameraCapturing = false;
          state.isMountSlewing = false;
          state.isFilterWheelMoving = false;
          state.isFocuserMoving = false;
          state.autoFocus.running = false;
          
          // Stop mount tracking
          state.mountStatus.tracking = false;
          state.mountStatus.slewing = false;
          
          // Stop filter wheel
          state.filterWheelStatus.moving = false;
          
          // Stop focuser
          state.focuserStatus.moving = false;
        });
      },
      {
        errorKey: 'connectionError',
      }
    ),
  })
);
