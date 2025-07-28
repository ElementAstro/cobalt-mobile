import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export type CurrentPage =
  | "dashboard"
  | "devices"
  | "sequence"
  | "weather"
  | "analysis"
  | "targets"
  | "health"
  | "guiding"
  | "logs"
  | "settings"
  | "camera-detail"
  | "mount-detail"
  | "filter-detail"
  | "focuser-detail"
  | "profiles"
  | "monitor"
  | "planner";

export type Language = "en" | "es" | "fr" | "de" | "zh" | "ja";
export type Theme = "light" | "dark" | "auto";
export type ConnectionType = "wifi" | "bluetooth" | "usb";

export interface EquipmentStatus {
  camera: "connected" | "disconnected" | "error" | "connecting";
  mount: "connected" | "disconnected" | "error" | "connecting";
  filterWheel: "connected" | "disconnected" | "error" | "connecting";
  focuser: "connected" | "disconnected" | "error" | "connecting";
}

export interface EnvironmentalData {
  temperature: number;
  humidity: number;
  pressure: number;
  lightPollution: number;
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
  alt: string;
  az: string;
  tracking: boolean;
  slewing: boolean;
  isTracking: boolean;
  isSlewing: boolean;
  parked: boolean;
  aligned: boolean;
  guiding: boolean;
}

export interface FilterWheelStatus {
  currentPosition: number;
  targetPosition: number;
  moving: boolean;
  connected: boolean;
  temperature: number;
}

export interface FocuserStatus {
  position: number;
  targetPosition: number;
  moving: boolean;
  temperature: number;
  connected: boolean;
  maxPosition: number;
  stepSize: number;
}

export interface AutoFocusData {
  running: boolean;
  progress: number;
  bestPosition: number;
  hfr: number;
  samples: Array<{ position: number; hfr: number }>;
}

export interface SequenceStatus {
  running: boolean;
  paused: boolean;
  currentStep: number;
  totalSteps: number;
  progress: number;
  startTime: Date | null;
  estimatedEndTime: Date | null;
}

export interface SwipeState {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  direction: "left" | "right" | null;
  threshold: number;
}

export interface Notification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: Date;
}

// Main Store Interface
interface AppStore {
  // Navigation
  currentPage: CurrentPage;
  setCurrentPage: (page: CurrentPage) => void;

  // Connection
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;

  // Settings
  language: Language;
  theme: Theme;
  connectionType: ConnectionType;
  batteryLevel: number;
  isDarkMode: boolean;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setConnectionType: (type: ConnectionType) => void;
  setBatteryLevel: (level: number) => void;
  setIsDarkMode: (dark: boolean) => void;

  // Equipment Status
  equipmentStatus: EquipmentStatus;
  setEquipmentStatus: (status: Partial<EquipmentStatus>) => void;
  updateEquipmentStatus: (device: keyof EquipmentStatus, status: EquipmentStatus[keyof EquipmentStatus]) => void;
  refreshEquipmentStatus: () => void;

  // Environmental Data
  environmentalData: EnvironmentalData;
  setEnvironmentalData: (data: Partial<EnvironmentalData>) => void;
  updateEnvironmentalData: (data: Partial<EnvironmentalData>) => void;

  // Camera
  cameraSettings: CameraSettings;
  isCapturing: boolean;
  captureProgress: number;
  liveViewActive: boolean;
  cameraTemp: number;
  targetTemp: number;
  coolingPower: number;
  setCameraSettings: (settings: Partial<CameraSettings>) => void;
  updateCameraSettings: (settings: Partial<CameraSettings>) => void;
  setIsCapturing: (capturing: boolean) => void;
  setCaptureProgress: (progress: number) => void;
  setLiveViewActive: (active: boolean) => void;
  setCameraTemp: (temp: number) => void;
  setTargetTemp: (temp: number) => void;
  setCoolingPower: (power: number) => void;

  // Mount
  mountStatus: MountStatus;
  slewTarget: { ra: string; dec: string; name: string };
  slewRate: string;
  trackingRate: string;
  setMountStatus: (status: Partial<MountStatus>) => void;
  updateMountStatus: (status: Partial<MountStatus>) => void;
  setSlewTarget: (
    target: Partial<{ ra: string; dec: string; name: string }>
  ) => void;
  setSlewRate: (rate: string) => void;
  setTrackingRate: (rate: string) => void;

  // Filter Wheel
  filterWheelStatus: FilterWheelStatus;
  moveProgress: number;
  setFilterWheelStatus: (status: Partial<FilterWheelStatus>) => void;
  setMoveProgress: (progress: number) => void;

  // Focuser
  focuserStatus: FocuserStatus;
  autoFocus: AutoFocusData;
  stepSize: number;
  targetPosition: number;
  setFocuserStatus: (status: Partial<FocuserStatus>) => void;
  setAutoFocus: (data: Partial<AutoFocusData>) => void;
  setStepSize: (size: number) => void;
  setTargetPosition: (position: number) => void;

  // Sequence
  sequenceStatus: SequenceStatus;
  setSequenceStatus: (status: Partial<SequenceStatus>) => void;

  // Swipe Navigation
  swipeState: SwipeState;
  setSwipeState: (state: Partial<SwipeState>) => void;
  resetSwipeState: () => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Actions
  startCapture: () => void;
  abortCapture: () => void;
  startSequence: () => void;
  pauseSequence: () => void;
  stopSequence: () => void;
  handleSwipeNavigation: (direction: "left" | "right") => void;
  resetStore: () => void;
}

// Create the store
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Navigation
      currentPage: "dashboard",
      setCurrentPage: (page) => set({ currentPage: page }),

      // Connection
      isConnected: false,
      setIsConnected: (connected) => set({ isConnected: connected }),

      // Settings
      language: "en",
      theme: "auto",
      connectionType: "wifi",
      batteryLevel: 85,
      isDarkMode: false,
      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),
      setConnectionType: (type) => set({ connectionType: type }),
      setBatteryLevel: (level) => set({ batteryLevel: level }),
      setIsDarkMode: (dark) => set({ isDarkMode: dark }),

      // Equipment Status
      equipmentStatus: {
        camera: "disconnected",
        mount: "disconnected",
        filterWheel: "disconnected",
        focuser: "disconnected",
      },
      setEquipmentStatus: (status) =>
        set((state) => ({
          equipmentStatus: { ...state.equipmentStatus, ...status },
        })),
      updateEquipmentStatus: (device, status) =>
        set((state) => ({
          equipmentStatus: { ...state.equipmentStatus, [device]: status },
        })),
      refreshEquipmentStatus: () => {
        // Simulate equipment status refresh with random variations
        const getRandomStatus = () => {
          const rand = Math.random();
          if (rand < 0.8) return "connected";
          if (rand < 0.95) return "disconnected";
          return "error";
        };

        set(() => ({
          equipmentStatus: {
            camera: getRandomStatus(),
            mount: getRandomStatus(),
            filterWheel: getRandomStatus(),
            focuser: getRandomStatus(),
          },
        }));
      },

      // Environmental Data
      environmentalData: {
        temperature: 20,
        humidity: 50,
        pressure: 1013.2,
        lightPollution: 18.5,
      },
      setEnvironmentalData: (data) =>
        set((state) => ({
          environmentalData: { ...state.environmentalData, ...data },
        })),
      updateEnvironmentalData: (data) =>
        set((state) => ({
          environmentalData: { ...state.environmentalData, ...data },
        })),

      // Camera
      cameraSettings: {
        exposure: 60,
        iso: 800,
        binning: "1x1",
        gain: 100,
        offset: 10,
        temperature: -10,
        coolingEnabled: true,
        frameType: "Light",
        imageFormat: "FITS",
      },
      isCapturing: false,
      captureProgress: 0,
      liveViewActive: false,
      cameraTemp: -8.5,
      targetTemp: -10,
      coolingPower: 65,
      setCameraSettings: (settings) =>
        set((state) => ({
          cameraSettings: { ...state.cameraSettings, ...settings },
        })),
      updateCameraSettings: (settings) =>
        set((state) => ({
          cameraSettings: { ...state.cameraSettings, ...settings },
        })),
      setIsCapturing: (capturing) => set({ isCapturing: capturing }),
      setCaptureProgress: (progress) => set({ captureProgress: progress }),
      setLiveViewActive: (active) => set({ liveViewActive: active }),
      setCameraTemp: (temp) => set({ cameraTemp: temp }),
      setTargetTemp: (temp) => set({ targetTemp: temp }),
      setCoolingPower: (power) => set({ coolingPower: power }),

      // Mount
      mountStatus: {
        ra: "05h 34m 12.3s",
        dec: "+22° 00' 52\"",
        alt: "45° 23' 15\"",
        az: "120° 45' 30\"",
        tracking: true,
        slewing: false,
        isTracking: false,
        isSlewing: false,
        parked: false,
        aligned: true,
        guiding: false,
      },
      slewTarget: {
        ra: "05h 34m 12s",
        dec: "+22° 00' 52\"",
        name: "M31 - Andromeda Galaxy",
      },
      slewRate: "Guide",
      trackingRate: "Sidereal",
      setMountStatus: (status) =>
        set((state) => ({
          mountStatus: { ...state.mountStatus, ...status },
        })),
      updateMountStatus: (status) =>
        set((state) => ({
          mountStatus: { ...state.mountStatus, ...status },
        })),
      setSlewTarget: (target) =>
        set((state) => ({
          slewTarget: { ...state.slewTarget, ...target },
        })),
      setSlewRate: (rate) => set({ slewRate: rate }),
      setTrackingRate: (rate) => set({ trackingRate: rate }),

      // Filter Wheel
      filterWheelStatus: {
        currentPosition: 1,
        targetPosition: 1,
        moving: false,
        connected: true,
        temperature: 18.5,
      },
      moveProgress: 0,
      setFilterWheelStatus: (status) =>
        set((state) => ({
          filterWheelStatus: { ...state.filterWheelStatus, ...status },
        })),
      setMoveProgress: (progress) => set({ moveProgress: progress }),

      // Focuser
      focuserStatus: {
        position: 15420,
        targetPosition: 15420,
        moving: false,
        temperature: 12.3,
        connected: true,
        maxPosition: 50000,
        stepSize: 10,
      },
      autoFocus: {
        running: false,
        progress: 0,
        bestPosition: 15420,
        hfr: 2.45,
        samples: [],
      },
      stepSize: 100,
      targetPosition: 15420,
      setFocuserStatus: (status) =>
        set((state) => ({
          focuserStatus: { ...state.focuserStatus, ...status },
        })),
      setAutoFocus: (data) =>
        set((state) => ({
          autoFocus: { ...state.autoFocus, ...data },
        })),
      setStepSize: (size) => set({ stepSize: size }),
      setTargetPosition: (position) => set({ targetPosition: position }),

      // Sequence
      sequenceStatus: {
        running: false,
        paused: false,
        currentStep: 0,
        totalSteps: 0,
        progress: 0,
        startTime: null,
        estimatedEndTime: null,
      },
      setSequenceStatus: (status) =>
        set((state) => ({
          sequenceStatus: { ...state.sequenceStatus, ...status },
        })),

      // Swipe Navigation
      swipeState: {
        isActive: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        direction: null,
        threshold: 50,
      },
      setSwipeState: (state) =>
        set((prevState) => ({
          swipeState: { ...prevState.swipeState, ...state },
        })),
      resetSwipeState: () =>
        set({
          swipeState: {
            isActive: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            direction: null,
            threshold: 50,
          },
        }),

      // Notifications
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // Actions
      startCapture: () => {
        const { cameraSettings } = get();
        set({ isCapturing: true, captureProgress: 0 });

        // Simulate capture progress
        const interval = setInterval(() => {
          const { captureProgress, isCapturing } = get();
          if (!isCapturing) {
            clearInterval(interval);
            return;
          }

          const newProgress =
            captureProgress + (100 / cameraSettings.exposure) * 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            set({ isCapturing: false, captureProgress: 100 });
          } else {
            set({ captureProgress: newProgress });
          }
        }, 100);
      },

      abortCapture: () => {
        set({ isCapturing: false, captureProgress: 0 });
      },

      startSequence: () => {
        set({
          sequenceStatus: {
            running: true,
            paused: false,
            currentStep: 0,
            totalSteps: 10,
            progress: 0,
            startTime: new Date(),
            estimatedEndTime: new Date(Date.now() + 3600000), // 1 hour
          },
        });
      },

      pauseSequence: () => {
        const { sequenceStatus } = get();
        set({
          sequenceStatus: {
            ...sequenceStatus,
            paused: !sequenceStatus.paused,
          },
        });
      },

      stopSequence: () => {
        set({
          sequenceStatus: {
            running: false,
            paused: false,
            currentStep: 0,
            totalSteps: 0,
            progress: 0,
            startTime: null,
            estimatedEndTime: null,
          },
        });
      },

      handleSwipeNavigation: (direction) => {
        const { currentPage } = get();
        const devicePages: CurrentPage[] = [
          "camera-detail",
          "mount-detail",
          "filter-detail",
          "focuser-detail",
        ];
        const currentIndex = devicePages.indexOf(currentPage);

        if (currentIndex !== -1) {
          if (direction === "right" && currentIndex > 0) {
            set({ currentPage: devicePages[currentIndex - 1] });
          } else if (
            direction === "left" &&
            currentIndex < devicePages.length - 1
          ) {
            set({ currentPage: devicePages[currentIndex + 1] });
          }
        }
      },

      resetStore: () => {
        set({
          currentPage: "dashboard",
          isConnected: false,
          language: "en",
          theme: "auto",
          connectionType: "wifi",
          batteryLevel: 85,
          isDarkMode: false,
          equipmentStatus: {
            camera: "disconnected",
            mount: "disconnected",
            filterWheel: "disconnected",
            focuser: "disconnected",
          },
          environmentalData: {
            temperature: 20,
            humidity: 50,
            pressure: 1013.2,
            lightPollution: 18.5,
          },
          cameraSettings: {
            exposure: 60,
            iso: 800,
            binning: "1x1",
            gain: 100,
            offset: 10,
            temperature: -10,
            coolingEnabled: true,
            frameType: "Light",
            imageFormat: "FITS",
          },
          isCapturing: false,
          captureProgress: 0,
          liveViewActive: false,
          cameraTemp: -8.5,
          targetTemp: -10,
          coolingPower: 65,
          mountStatus: {
            ra: "05h 34m 12.3s",
            dec: "+22° 00' 52\"",
            alt: "45° 23' 15\"",
            az: "120° 45' 30\"",
            tracking: false,
            slewing: false,
            isTracking: false,
            isSlewing: false,
            parked: false,
            aligned: true,
            guiding: false,
          },
          slewTarget: {
            ra: "05h 34m 12s",
            dec: "+22° 00' 52\"",
            name: "M31 - Andromeda Galaxy",
          },
          slewRate: "Guide",
          trackingRate: "Sidereal",
          filterWheelStatus: {
            currentPosition: 1,
            targetPosition: 1,
            moving: false,
            connected: true,
            temperature: 18.5,
          },
          moveProgress: 0,
          focuserStatus: {
            position: 15420,
            targetPosition: 15420,
            moving: false,
            temperature: 12.3,
            connected: true,
            maxPosition: 50000,
            stepSize: 10,
          },
          autoFocus: {
            running: false,
            progress: 0,
            bestPosition: 15420,
            hfr: 2.45,
            samples: [],
          },
          stepSize: 100,
          targetPosition: 15420,
          sequenceStatus: {
            running: false,
            paused: false,
            currentStep: 0,
            totalSteps: 0,
            progress: 0,
            startTime: null,
            estimatedEndTime: null,
          },
          swipeState: {
            isActive: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            direction: null,
            threshold: 50,
          },
          notifications: [],
        });
      },
    }),
    {
      name: "astro-app-storage",
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        connectionType: state.connectionType,
        cameraSettings: state.cameraSettings,
        slewRate: state.slewRate,
        trackingRate: state.trackingRate,
        stepSize: state.stepSize,
      }),
    }
  )
);
