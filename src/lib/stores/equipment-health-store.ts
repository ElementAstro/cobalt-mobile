import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  equipmentHealthMonitor,
  EquipmentComponent,
  HealthStatus,
  MaintenanceRecord,
  EquipmentMetrics
} from '../equipment-health/health-monitor';

export interface EquipmentHealthState {
  // Components
  components: EquipmentComponent[];
  selectedComponentId: string | null;
  
  // Health monitoring
  healthStatuses: Map<string, HealthStatus>;
  lastHealthUpdate: Date | null;
  monitoringEnabled: boolean;
  updateInterval: number; // seconds
  
  // Alerts
  activeAlerts: HealthStatus['alerts'];
  alertHistory: HealthStatus['alerts'];
  alertSettings: {
    enableNotifications: boolean;
    criticalAlertsOnly: boolean;
    emailNotifications: boolean;
    soundAlerts: boolean;
  };
  
  // Maintenance
  maintenanceRecords: Map<string, MaintenanceRecord[]>;
  upcomingMaintenance: { component: EquipmentComponent; dueDate: Date; type: string }[];
  maintenanceReminders: boolean;
  
  // Analytics
  systemOverview: {
    totalComponents: number;
    healthyComponents: number;
    warningComponents: number;
    criticalComponents: number;
    offlineComponents: number;
    overallScore: number;
    activeAlerts: number;
    upcomingMaintenance: number;
  };
  
  // UI state
  viewMode: 'overview' | 'components' | 'alerts' | 'maintenance' | 'analytics';
  selectedTimeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  showOfflineComponents: boolean;
  
  // Actions
  addComponent: (component: EquipmentComponent) => void;
  removeComponent: (componentId: string) => void;
  updateComponent: (componentId: string, updates: Partial<EquipmentComponent>) => void;
  selectComponent: (componentId: string | null) => void;
  
  // Health monitoring
  updateComponentHealth: (componentId: string, metrics?: EquipmentMetrics) => Promise<void>;
  updateAllComponentsHealth: () => Promise<void>;
  setMonitoringEnabled: (enabled: boolean) => void;
  setUpdateInterval: (seconds: number) => void;
  
  // Alerts
  acknowledgeAlert: (componentId: string, alertTimestamp: Date) => void;
  acknowledgeAllAlerts: () => void;
  updateAlertSettings: (settings: Partial<EquipmentHealthState['alertSettings']>) => void;
  
  // Maintenance
  addMaintenanceRecord: (record: MaintenanceRecord) => void;
  updateMaintenanceRecord: (recordId: string, updates: Partial<MaintenanceRecord>) => void;
  scheduleMaintenanceReminder: (componentId: string, date: Date, type: string) => void;
  setMaintenanceReminders: (enabled: boolean) => void;
  
  // UI actions
  setViewMode: (mode: EquipmentHealthState['viewMode']) => void;
  setSelectedTimeRange: (range: EquipmentHealthState['selectedTimeRange']) => void;
  setShowOfflineComponents: (show: boolean) => void;
  
  // Computed getters
  getComponentHealth: (componentId: string) => HealthStatus | null;
  getHealthyComponents: () => EquipmentComponent[];
  getComponentsNeedingAttention: () => EquipmentComponent[];
  getCriticalAlerts: () => HealthStatus['alerts'];
  getMaintenanceHistory: (componentId: string) => MaintenanceRecord[];
  getOverdueMaintenance: () => { component: EquipmentComponent; dueDate: Date; type: string }[];
  exportHealthData: () => string;
}

// Default equipment components for simulation
const defaultComponents: EquipmentComponent[] = [
  {
    id: 'mount_eq6r',
    name: 'EQ6-R Pro Mount',
    type: 'mount',
    manufacturer: 'Sky-Watcher',
    model: 'EQ6-R Pro',
    serialNumber: 'SW-EQ6R-2023-001',
    firmwareVersion: '4.38.02',
    installDate: new Date('2023-01-15'),
    expectedLifetime: 50000, // hours
    criticalTemperatureRange: { min: -20, max: 60 },
    optimalTemperatureRange: { min: 0, max: 40 },
    maxOperatingHours: 12,
    maintenanceInterval: 90, // days
    calibrationInterval: 30, // days
    specifications: {
      accuracy: 1.5, // arcseconds
      repeatability: 0.5,
      maxLoad: 20, // kg
      powerConsumption: 24, // watts
      operatingTemperature: { min: -20, max: 60 }
    }
  },
  {
    id: 'camera_asi2600mc',
    name: 'ASI2600MC Pro',
    type: 'camera',
    manufacturer: 'ZWO',
    model: 'ASI2600MC Pro',
    serialNumber: 'ZWO-ASI2600MC-2023-042',
    firmwareVersion: '1.2.3',
    installDate: new Date('2023-02-01'),
    expectedLifetime: 30000,
    criticalTemperatureRange: { min: -40, max: 70 },
    optimalTemperatureRange: { min: -20, max: 40 },
    maxOperatingHours: 10,
    maintenanceInterval: 180,
    calibrationInterval: 60,
    specifications: {
      powerConsumption: 12,
      operatingTemperature: { min: -40, max: 70 }
    }
  },
  {
    id: 'focuser_eaf',
    name: 'EAF Focuser',
    type: 'focuser',
    manufacturer: 'ZWO',
    model: 'EAF',
    serialNumber: 'ZWO-EAF-2023-018',
    firmwareVersion: '2.1.0',
    installDate: new Date('2023-02-15'),
    expectedLifetime: 40000,
    criticalTemperatureRange: { min: -30, max: 60 },
    optimalTemperatureRange: { min: -10, max: 40 },
    maxOperatingHours: 12,
    maintenanceInterval: 120,
    calibrationInterval: 45,
    specifications: {
      accuracy: 0.1,
      repeatability: 0.05,
      powerConsumption: 5,
      operatingTemperature: { min: -30, max: 60 }
    }
  },
  {
    id: 'filterwheel_efw',
    name: 'EFW Filter Wheel',
    type: 'filterwheel',
    manufacturer: 'ZWO',
    model: 'EFW 2"',
    serialNumber: 'ZWO-EFW-2023-025',
    firmwareVersion: '1.8.2',
    installDate: new Date('2023-03-01'),
    expectedLifetime: 35000,
    criticalTemperatureRange: { min: -30, max: 60 },
    optimalTemperatureRange: { min: -10, max: 40 },
    maxOperatingHours: 12,
    maintenanceInterval: 150,
    calibrationInterval: 90,
    specifications: {
      powerConsumption: 3,
      operatingTemperature: { min: -30, max: 60 }
    }
  }
];

export const useEquipmentHealthStore = create<EquipmentHealthState>()(
  persist(
    (set, get) => ({
      // Initial state
      components: defaultComponents,
      selectedComponentId: null,
      healthStatuses: new Map(),
      lastHealthUpdate: null,
      monitoringEnabled: true,
      updateInterval: 60, // 1 minute
      activeAlerts: [],
      alertHistory: [],
      alertSettings: {
        enableNotifications: true,
        criticalAlertsOnly: false,
        emailNotifications: false,
        soundAlerts: true
      },
      maintenanceRecords: new Map(),
      upcomingMaintenance: [],
      maintenanceReminders: true,
      systemOverview: {
        totalComponents: defaultComponents.length,
        healthyComponents: defaultComponents.length,
        warningComponents: 0,
        criticalComponents: 0,
        offlineComponents: 0,
        overallScore: 100,
        activeAlerts: 0,
        upcomingMaintenance: 0
      },
      viewMode: 'overview',
      selectedTimeRange: '24h',
      showOfflineComponents: true,

      // Actions
      addComponent: (component) => {
        const { components } = get();
        set({ components: [...components, component] });
        equipmentHealthMonitor.addComponent(component);
      },

      removeComponent: (componentId) => {
        const { components, healthStatuses, maintenanceRecords } = get();
        const newHealthStatuses = new Map(healthStatuses);
        const newMaintenanceRecords = new Map(maintenanceRecords);
        
        newHealthStatuses.delete(componentId);
        newMaintenanceRecords.delete(componentId);
        
        set({
          components: components.filter(c => c.id !== componentId),
          healthStatuses: newHealthStatuses,
          maintenanceRecords: newMaintenanceRecords,
          selectedComponentId: get().selectedComponentId === componentId ? null : get().selectedComponentId
        });
        
        equipmentHealthMonitor.removeComponent(componentId);
      },

      updateComponent: (componentId, updates) => {
        const { components } = get();
        const updatedComponents = components.map(c => 
          c.id === componentId ? { ...c, ...updates } : c
        );
        set({ components: updatedComponents });
      },

      selectComponent: (componentId) => {
        set({ selectedComponentId: componentId });
      },

      // Health monitoring
      updateComponentHealth: async (componentId, metrics) => {
        try {
          const component = get().components.find(c => c.id === componentId);
          if (!component) return;

          // Use provided metrics or simulate them
          const componentMetrics = metrics || equipmentHealthMonitor.simulateMetrics(componentId);
          
          const healthStatus = await equipmentHealthMonitor.updateComponentHealth(componentId, componentMetrics);
          
          const { healthStatuses, activeAlerts } = get();
          const newHealthStatuses = new Map(healthStatuses);
          newHealthStatuses.set(componentId, healthStatus);
          
          // Update active alerts
          const newActiveAlerts = [...activeAlerts];
          for (const alert of healthStatus.alerts) {
            if (!alert.acknowledged && !newActiveAlerts.some(a => 
              a.timestamp.getTime() === alert.timestamp.getTime() && a.message === alert.message
            )) {
              newActiveAlerts.push(alert);
            }
          }
          
          set({
            healthStatuses: newHealthStatuses,
            activeAlerts: newActiveAlerts,
            lastHealthUpdate: new Date()
          });
          
          // Update system overview
          get().updateSystemOverview();
        } catch (error) {
          console.error('Failed to update component health:', error);
        }
      },

      updateAllComponentsHealth: async () => {
        const { components } = get();
        for (const component of components) {
          await get().updateComponentHealth(component.id);
        }
      },

      setMonitoringEnabled: (enabled) => {
        set({ monitoringEnabled: enabled });
        if (enabled) {
          startHealthMonitoring();
        } else {
          stopHealthMonitoring();
        }
      },

      setUpdateInterval: (seconds) => {
        set({ updateInterval: Math.max(10, Math.min(3600, seconds)) });
        if (get().monitoringEnabled) {
          startHealthMonitoring(); // Restart with new interval
        }
      },

      // Alerts
      acknowledgeAlert: (componentId, alertTimestamp) => {
        const { activeAlerts, alertHistory } = get();
        const alertIndex = activeAlerts.findIndex(alert => 
          alert.timestamp.getTime() === alertTimestamp.getTime()
        );
        
        if (alertIndex >= 0) {
          const acknowledgedAlert = { ...activeAlerts[alertIndex], acknowledged: true };
          const newActiveAlerts = [...activeAlerts];
          newActiveAlerts.splice(alertIndex, 1);
          
          set({
            activeAlerts: newActiveAlerts,
            alertHistory: [...alertHistory, acknowledgedAlert]
          });
          
          equipmentHealthMonitor.acknowledgeAlert(componentId, alertTimestamp);
        }
      },

      acknowledgeAllAlerts: () => {
        const { activeAlerts, alertHistory } = get();
        const acknowledgedAlerts = activeAlerts.map(alert => ({ ...alert, acknowledged: true }));
        
        set({
          activeAlerts: [],
          alertHistory: [...alertHistory, ...acknowledgedAlerts]
        });
      },

      updateAlertSettings: (settings) => {
        const { alertSettings } = get();
        set({
          alertSettings: { ...alertSettings, ...settings }
        });
      },

      // Maintenance
      addMaintenanceRecord: (record) => {
        const { maintenanceRecords } = get();
        const componentRecords = maintenanceRecords.get(record.componentId) || [];
        const newRecords = new Map(maintenanceRecords);
        newRecords.set(record.componentId, [...componentRecords, record]);
        
        set({ maintenanceRecords: newRecords });
        equipmentHealthMonitor.addMaintenanceRecord(record);
        
        // Update upcoming maintenance
        get().updateUpcomingMaintenance();
      },

      updateMaintenanceRecord: (recordId, updates) => {
        const { maintenanceRecords } = get();
        const newRecords = new Map(maintenanceRecords);
        
        for (const [componentId, records] of newRecords) {
          const recordIndex = records.findIndex(r => r.id === recordId);
          if (recordIndex >= 0) {
            const updatedRecords = [...records];
            updatedRecords[recordIndex] = { ...updatedRecords[recordIndex], ...updates };
            newRecords.set(componentId, updatedRecords);
            break;
          }
        }
        
        set({ maintenanceRecords: newRecords });
      },

      scheduleMaintenanceReminder: (componentId, date, type) => {
        // Implementation for scheduling reminders
        console.log(`Scheduled ${type} maintenance reminder for ${componentId} on ${date}`);
      },

      setMaintenanceReminders: (enabled) => {
        set({ maintenanceReminders: enabled });
      },

      // UI actions
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      setSelectedTimeRange: (range) => {
        set({ selectedTimeRange: range });
      },

      setShowOfflineComponents: (show) => {
        set({ showOfflineComponents: show });
      },

      // Helper methods
      updateSystemOverview: () => {
        const overview = equipmentHealthMonitor.getSystemHealthOverview();
        set({ systemOverview: overview });
      },

      updateUpcomingMaintenance: () => {
        const upcoming = equipmentHealthMonitor.getUpcomingMaintenance();
        set({ upcomingMaintenance: upcoming });
      },

      // Computed getters
      getComponentHealth: (componentId) => {
        const { healthStatuses } = get();
        return healthStatuses.get(componentId) || null;
      },

      getHealthyComponents: () => {
        const { components, healthStatuses } = get();
        return components.filter(component => {
          const health = healthStatuses.get(component.id);
          return health && (health.overall === 'excellent' || health.overall === 'good');
        });
      },

      getComponentsNeedingAttention: () => {
        const { components, healthStatuses } = get();
        return components.filter(component => {
          const health = healthStatuses.get(component.id);
          return health && (health.overall === 'warning' || health.overall === 'critical');
        });
      },

      getCriticalAlerts: () => {
        const { activeAlerts } = get();
        return activeAlerts.filter(alert => alert.severity === 'critical');
      },

      getMaintenanceHistory: (componentId) => {
        const { maintenanceRecords } = get();
        return maintenanceRecords.get(componentId) || [];
      },

      getOverdueMaintenance: () => {
        const { upcomingMaintenance } = get();
        const now = new Date();
        return upcomingMaintenance.filter(item => item.dueDate < now);
      },

      exportHealthData: () => {
        const { components, healthStatuses, maintenanceRecords, systemOverview } = get();
        const exportData = {
          timestamp: new Date().toISOString(),
          systemOverview,
          components,
          healthStatuses: Array.from(healthStatuses.entries()),
          maintenanceRecords: Array.from(maintenanceRecords.entries())
        };
        return JSON.stringify(exportData, null, 2);
      }
    }),
    {
      name: 'equipment-health-storage',
      partialize: (state) => ({
        components: state.components,
        monitoringEnabled: state.monitoringEnabled,
        updateInterval: state.updateInterval,
        alertSettings: state.alertSettings,
        maintenanceReminders: state.maintenanceReminders,
        viewMode: state.viewMode,
        selectedTimeRange: state.selectedTimeRange,
        showOfflineComponents: state.showOfflineComponents,
        alertHistory: state.alertHistory.slice(-100), // Keep last 100 alerts
        maintenanceRecords: state.maintenanceRecords
      })
    }
  )
);

// Auto-monitoring functionality
let healthMonitoringTimer: NodeJS.Timeout | null = null;

export const startHealthMonitoring = () => {
  const store = useEquipmentHealthStore.getState();
  
  if (healthMonitoringTimer) {
    clearInterval(healthMonitoringTimer);
  }
  
  if (store.monitoringEnabled) {
    // Initialize components in health monitor
    for (const component of store.components) {
      equipmentHealthMonitor.addComponent(component);
    }
    
    // Start monitoring
    healthMonitoringTimer = setInterval(() => {
      const currentStore = useEquipmentHealthStore.getState();
      if (currentStore.monitoringEnabled) {
        currentStore.updateAllComponentsHealth();
      }
    }, store.updateInterval * 1000);
    
    // Initial health update
    store.updateAllComponentsHealth();
  }
};

export const stopHealthMonitoring = () => {
  if (healthMonitoringTimer) {
    clearInterval(healthMonitoringTimer);
    healthMonitoringTimer = null;
  }
};

// Subscribe to monitoring changes
useEquipmentHealthStore.subscribe(
  (state) => state.monitoringEnabled,
  (monitoringEnabled) => {
    if (monitoringEnabled) {
      startHealthMonitoring();
    } else {
      stopHealthMonitoring();
    }
  }
);

// Subscribe to interval changes
useEquipmentHealthStore.subscribe(
  (state) => state.updateInterval,
  () => {
    const store = useEquipmentHealthStore.getState();
    if (store.monitoringEnabled) {
      startHealthMonitoring();
    }
  }
);

// Initialize monitoring on store creation
startHealthMonitoring();

export default useEquipmentHealthStore;
