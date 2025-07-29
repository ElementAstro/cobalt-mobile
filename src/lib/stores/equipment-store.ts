import { createEnhancedStore, createAsyncAction } from './base-store';
import { equipmentApi, Equipment, EquipmentProfile, EquipmentStatus } from '../api/equipment';

// Re-export types from the API for convenience
export type { EquipmentProfile, Equipment, EquipmentStatus } from '../api/equipment';

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

// Equipment Management State
interface EquipmentManagementState {
  // Equipment list and management
  equipmentList: Equipment[];
  selectedEquipment: Equipment | null;
  isLoadingEquipment: boolean;
  equipmentError: string | null;

  // Search and filtering
  searchQuery: string;
  filterType: string | null;
  filterStatus: string | null;
  filterBrand: string | null;
  sortBy: 'name' | 'type' | 'status' | 'lastConnected';
  sortOrder: 'asc' | 'desc';

  // Equipment operations
  isConnectingEquipment: Record<string, boolean>;
  isDeletingEquipment: Record<string, boolean>;
  equipmentConnectionErrors: Record<string, string>;

  // Equipment profiles
  profiles: EquipmentProfile[];
  selectedProfile: EquipmentProfile | null;
  isLoadingProfiles: boolean;

  // Form state
  isAddingEquipment: boolean;
  isEditingEquipment: boolean;
  editingEquipmentId: string | null;
  formErrors: Record<string, string>;
}

// Equipment store state
interface EquipmentStoreState extends EquipmentManagementState {
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

  // Equipment Management Actions
  loadEquipmentList: () => Promise<void>;
  addEquipment: (equipment: Omit<Equipment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  connectEquipment: (id: string) => Promise<void>;
  disconnectEquipment: (id: string) => Promise<void>;
  testEquipmentConnection: (id: string) => Promise<void>;

  // Search and filtering actions
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string | null) => void;
  setFilterStatus: (status: string | null) => void;
  setFilterBrand: (brand: string | null) => void;
  setSortBy: (sortBy: 'name' | 'type' | 'status' | 'lastConnected') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  clearFilters: () => void;

  // Equipment selection and form actions
  selectEquipment: (equipment: Equipment | null) => void;
  startAddingEquipment: () => void;
  startEditingEquipment: (id: string) => void;
  cancelEquipmentForm: () => void;
  setFormError: (field: string, error: string) => void;
  clearFormErrors: () => void;

  // Profile management actions
  loadProfiles: () => Promise<void>;
  createProfile: (profile: Omit<EquipmentProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProfile: (id: string, updates: Partial<EquipmentProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  applyProfile: (id: string) => Promise<void>;
  selectProfile: (profile: EquipmentProfile | null) => void;

  // Computed getters
  getFilteredEquipment: () => Equipment[];
  getEquipmentByType: (type: string) => Equipment[];
  getConnectedEquipment: () => Equipment[];
  getDisconnectedEquipment: () => Equipment[];
}

// Sample equipment data for development/testing
const sampleEquipment: Equipment[] = [
  {
    id: 'eq-1',
    name: 'Main Camera',
    type: 'camera',
    brand: 'ZWO',
    model: 'ASI2600MC Pro',
    status: 'connected',
    connectionType: 'usb',
    capabilities: ['Cooling', 'High Resolution', 'Color'],
    settings: {
      gain: 100,
      offset: 10,
      temperature: -10,
      binning: '1x1'
    },
    lastConnected: new Date('2024-01-15T10:30:00Z'),
    firmware: 'v1.2.3',
    serialNumber: 'ASI2600MC-12345',
    userId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
  },
  {
    id: 'eq-2',
    name: 'Primary Mount',
    type: 'mount',
    brand: 'Sky-Watcher',
    model: 'EQ6-R Pro',
    status: 'connected',
    connectionType: 'wifi',
    capabilities: ['GoTo', 'Tracking', 'Autoguiding'],
    settings: {
      trackingRate: 'sidereal',
      guidingRate: '0.5x',
      slewRate: '9x'
    },
    lastConnected: new Date('2024-01-15T10:25:00Z'),
    firmware: 'v4.39.02',
    serialNumber: 'EQ6R-67890',
    userId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:25:00Z'),
  },
  {
    id: 'eq-3',
    name: 'Filter Wheel',
    type: 'filter_wheel',
    brand: 'ZWO',
    model: 'EFW 8x1.25"',
    status: 'disconnected',
    connectionType: 'usb',
    capabilities: ['8 Position', 'Fast Switching'],
    settings: {
      positions: 8,
      filters: ['L', 'R', 'G', 'B', 'Ha', 'OIII', 'SII', 'Clear']
    },
    lastConnected: new Date('2024-01-14T20:15:00Z'),
    firmware: 'v1.1.0',
    serialNumber: 'EFW8-11111',
    userId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-14T20:15:00Z'),
  },
  {
    id: 'eq-4',
    name: 'Electronic Focuser',
    type: 'focuser',
    brand: 'ZWO',
    model: 'EAF',
    status: 'error',
    connectionType: 'usb',
    capabilities: ['Auto Focus', 'Temperature Compensation'],
    settings: {
      stepSize: 100,
      backlash: 200,
      tempCoeff: -2.5
    },
    lastConnected: new Date('2024-01-13T18:45:00Z'),
    firmware: 'v1.0.5',
    serialNumber: 'EAF-22222',
    userId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-13T18:45:00Z'),
  },
];

// Initial state
const initialEquipmentState = {
  // Equipment Management State
  equipmentList: process.env.NODE_ENV === 'development' ? sampleEquipment : [],
  selectedEquipment: null,
  isLoadingEquipment: false,
  equipmentError: null,

  // Search and filtering
  searchQuery: '',
  filterType: null,
  filterStatus: null,
  filterBrand: null,
  sortBy: 'name' as const,
  sortOrder: 'asc' as const,

  // Equipment operations
  isConnectingEquipment: {},
  isDeletingEquipment: {},
  equipmentConnectionErrors: {},

  // Equipment profiles
  profiles: [],
  selectedProfile: null,
  isLoadingProfiles: false,

  // Form state
  isAddingEquipment: false,
  isEditingEquipment: false,
  editingEquipmentId: null,
  formErrors: {},

  // Legacy equipment status
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

    // Equipment Management Actions
    loadEquipmentList: createAsyncAction(
      { setState: set, getState: get },
      async () => {
        const response = await equipmentApi.getEquipment();
        if (response.success && response.data) {
          set((state: any) => {
            state.equipmentList = response.data;
          });
        } else {
          throw new Error(response.error || 'Failed to load equipment');
        }
      },
      {
        loadingKey: 'isLoadingEquipment',
        errorKey: 'equipmentError',
      }
    ),

    addEquipment: createAsyncAction(
      { setState: set, getState: get },
      async (equipment: Omit<Equipment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        const response = await equipmentApi.addEquipment(equipment);
        if (response.success && response.data) {
          set((state: any) => {
            state.equipmentList.push(response.data);
            state.isAddingEquipment = false;
            state.formErrors = {};
          });
        } else {
          throw new Error(response.error || 'Failed to add equipment');
        }
      },
      {
        errorKey: 'equipmentError',
      }
    ),

    updateEquipment: createAsyncAction(
      { setState: set, getState: get },
      async (id: string, updates: Partial<Equipment>) => {
        const response = await equipmentApi.updateEquipment(id, updates);
        if (response.success && response.data) {
          set((state: any) => {
            const index = state.equipmentList.findIndex((eq: Equipment) => eq.id === id);
            if (index !== -1) {
              state.equipmentList[index] = response.data;
            }
            state.isEditingEquipment = false;
            state.editingEquipmentId = null;
            state.formErrors = {};
          });
        } else {
          throw new Error(response.error || 'Failed to update equipment');
        }
      },
      {
        errorKey: 'equipmentError',
      }
    ),

    deleteEquipment: createAsyncAction(
      { setState: set, getState: get },
      async (id: string) => {
        set((state: any) => {
          state.isDeletingEquipment[id] = true;
        });

        const response = await equipmentApi.deleteEquipment(id);
        if (response.success) {
          set((state: any) => {
            state.equipmentList = state.equipmentList.filter((eq: Equipment) => eq.id !== id);
            delete state.isDeletingEquipment[id];
            if (state.selectedEquipment?.id === id) {
              state.selectedEquipment = null;
            }
          });
        } else {
          set((state: any) => {
            delete state.isDeletingEquipment[id];
          });
          throw new Error(response.error || 'Failed to delete equipment');
        }
      },
      {
        errorKey: 'equipmentError',
      }
    ),

    connectEquipment: createAsyncAction(
      { setState: set, getState: get },
      async (id: string) => {
        set((state: any) => {
          state.isConnectingEquipment[id] = true;
          delete state.equipmentConnectionErrors[id];
        });

        const response = await equipmentApi.connectEquipment({ equipmentId: id });
        if (response.success) {
          set((state: any) => {
            const equipment = state.equipmentList.find((eq: Equipment) => eq.id === id);
            if (equipment) {
              equipment.status = 'connected';
              equipment.lastConnected = new Date();
            }
            delete state.isConnectingEquipment[id];
          });
        } else {
          set((state: any) => {
            delete state.isConnectingEquipment[id];
            state.equipmentConnectionErrors[id] = response.error || 'Connection failed';
          });
          throw new Error(response.error || 'Failed to connect equipment');
        }
      },
      {
        errorKey: 'equipmentError',
      }
    ),

    disconnectEquipment: createAsyncAction(
      { setState: set, getState: get },
      async (id: string) => {
        const response = await equipmentApi.disconnectEquipment(id);
        if (response.success) {
          set((state: any) => {
            const equipment = state.equipmentList.find((eq: Equipment) => eq.id === id);
            if (equipment) {
              equipment.status = 'disconnected';
            }
          });
        } else {
          throw new Error(response.error || 'Failed to disconnect equipment');
        }
      },
      {
        errorKey: 'equipmentError',
      }
    ),

    testEquipmentConnection: createAsyncAction(
      { setState: set, getState: get },
      async (id: string) => {
        const response = await equipmentApi.testConnection(id);
        if (!response.success) {
          throw new Error(response.error || 'Connection test failed');
        }
      },
      {
        errorKey: 'equipmentError',
      }
    ),

    // Search and filtering actions
    setSearchQuery: (query: string) =>
      set((state: any) => {
        state.searchQuery = query;
      }),

    setFilterType: (type: string | null) =>
      set((state: any) => {
        state.filterType = type;
      }),

    setFilterStatus: (status: string | null) =>
      set((state: any) => {
        state.filterStatus = status;
      }),

    setFilterBrand: (brand: string | null) =>
      set((state: any) => {
        state.filterBrand = brand;
      }),

    setSortBy: (sortBy: 'name' | 'type' | 'status' | 'lastConnected') =>
      set((state: any) => {
        state.sortBy = sortBy;
      }),

    setSortOrder: (order: 'asc' | 'desc') =>
      set((state: any) => {
        state.sortOrder = order;
      }),

    clearFilters: () =>
      set((state: any) => {
        state.searchQuery = '';
        state.filterType = null;
        state.filterStatus = null;
        state.filterBrand = null;
        state.sortBy = 'name';
        state.sortOrder = 'asc';
      }),

    // Equipment selection and form actions
    selectEquipment: (equipment: Equipment | null) =>
      set((state: any) => {
        state.selectedEquipment = equipment;
      }),

    startAddingEquipment: () =>
      set((state: any) => {
        state.isAddingEquipment = true;
        state.isEditingEquipment = false;
        state.editingEquipmentId = null;
        state.formErrors = {};
      }),

    startEditingEquipment: (id: string) =>
      set((state: any) => {
        state.isEditingEquipment = true;
        state.isAddingEquipment = false;
        state.editingEquipmentId = id;
        state.formErrors = {};
      }),

    cancelEquipmentForm: () =>
      set((state: any) => {
        state.isAddingEquipment = false;
        state.isEditingEquipment = false;
        state.editingEquipmentId = null;
        state.formErrors = {};
      }),

    setFormError: (field: string, error: string) =>
      set((state: any) => {
        state.formErrors[field] = error;
      }),

    clearFormErrors: () =>
      set((state: any) => {
        state.formErrors = {};
      }),

    // Computed getters
    getFilteredEquipment: () => {
      const state = get();
      let filtered = [...state.equipmentList];

      // Apply search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(eq =>
          eq.name.toLowerCase().includes(query) ||
          eq.brand.toLowerCase().includes(query) ||
          eq.model.toLowerCase().includes(query) ||
          eq.type.toLowerCase().includes(query)
        );
      }

      // Apply type filter
      if (state.filterType) {
        filtered = filtered.filter(eq => eq.type === state.filterType);
      }

      // Apply status filter
      if (state.filterStatus) {
        filtered = filtered.filter(eq => eq.status === state.filterStatus);
      }

      // Apply brand filter
      if (state.filterBrand) {
        filtered = filtered.filter(eq => eq.brand === state.filterBrand);
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (state.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'lastConnected':
            aValue = a.lastConnected ? new Date(a.lastConnected).getTime() : 0;
            bValue = b.lastConnected ? new Date(b.lastConnected).getTime() : 0;
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }

        if (aValue < bValue) return state.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return state.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return filtered;
    },

    getEquipmentByType: (type: string) => {
      const state = get();
      return state.equipmentList.filter(eq => eq.type === type);
    },

    getConnectedEquipment: () => {
      const state = get();
      return state.equipmentList.filter(eq => eq.status === 'connected');
    },

    getDisconnectedEquipment: () => {
      const state = get();
      return state.equipmentList.filter(eq => eq.status === 'disconnected');
    },
  })
);
