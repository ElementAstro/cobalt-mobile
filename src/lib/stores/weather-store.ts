import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { weatherService, WeatherForecast, WeatherConditions, AstronomicalConditions, WeatherAlert, LocationData } from '../weather/weather-service';

export interface WeatherState {
  // Current data
  currentWeather: WeatherConditions | null;
  astronomicalConditions: AstronomicalConditions | null;
  forecast: WeatherForecast | null;
  
  // Location
  location: LocationData | null;
  
  // UI state
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
  
  // Settings
  autoRefresh: boolean;
  refreshInterval: number; // minutes
  alertsEnabled: boolean;
  
  // Actions
  setLocation: (location: LocationData) => void;
  refreshWeather: () => Promise<void>;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (minutes: number) => void;
  setAlertsEnabled: (enabled: boolean) => void;
  clearError: () => void;
  
  // Computed getters
  getImagingQuality: () => number;
  getImagingRecommendation: () => string;
  isGoodForImaging: () => boolean;
  getActiveAlerts: () => WeatherAlert[];
}

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentWeather: null,
      astronomicalConditions: null,
      forecast: null,
      location: null,
      isLoading: false,
      lastUpdated: null,
      error: null,
      autoRefresh: true,
      refreshInterval: 15, // 15 minutes
      alertsEnabled: true,

      // Actions
      setLocation: (location: LocationData) => {
        set({ location });
        weatherService.setLocation(location);
        // Automatically refresh weather when location changes
        get().refreshWeather();
      },

      refreshWeather: async () => {
        const { location } = get();
        if (!location) {
          set({ error: 'Location not set' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const [currentWeather, astronomicalConditions, forecast] = await Promise.all([
            weatherService.getCurrentWeather(),
            weatherService.getAstronomicalConditions(),
            weatherService.getWeatherForecast(7)
          ]);

          set({
            currentWeather,
            astronomicalConditions,
            forecast,
            lastUpdated: new Date(),
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Failed to refresh weather:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch weather data'
          });
        }
      },

      setAutoRefresh: (enabled: boolean) => {
        set({ autoRefresh: enabled });
      },

      setRefreshInterval: (minutes: number) => {
        set({ refreshInterval: Math.max(5, Math.min(60, minutes)) }); // Clamp between 5-60 minutes
      },

      setAlertsEnabled: (enabled: boolean) => {
        set({ alertsEnabled: enabled });
      },

      clearError: () => {
        set({ error: null });
      },

      // Computed getters
      getImagingQuality: () => {
        const { currentWeather, astronomicalConditions } = get();
        if (!currentWeather || !astronomicalConditions) return 0;
        
        return weatherService.isGoodForImaging(currentWeather, astronomicalConditions) ? 75 : 25;
      },

      getImagingRecommendation: () => {
        const { forecast } = get();
        if (!forecast) return 'Weather data not available';
        
        return weatherService.getImagingRecommendation(forecast);
      },

      isGoodForImaging: () => {
        const { currentWeather, astronomicalConditions } = get();
        if (!currentWeather || !astronomicalConditions) return false;
        
        return weatherService.isGoodForImaging(currentWeather, astronomicalConditions);
      },

      getActiveAlerts: () => {
        const { forecast, alertsEnabled } = get();
        if (!forecast || !alertsEnabled) return [];
        
        const now = new Date();
        return forecast.alerts.filter(alert => 
          alert.startTime <= now && alert.endTime >= now
        );
      }
    }),
    {
      name: 'weather-storage',
      partialize: (state) => ({
        location: state.location,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        alertsEnabled: state.alertsEnabled
      })
    }
  )
);

// Auto-refresh functionality
let refreshTimer: NodeJS.Timeout | null = null;

export const startWeatherAutoRefresh = () => {
  const store = useWeatherStore.getState();
  
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  
  if (store.autoRefresh && store.location) {
    refreshTimer = setInterval(() => {
      const currentStore = useWeatherStore.getState();
      if (currentStore.autoRefresh && currentStore.location) {
        currentStore.refreshWeather();
      }
    }, store.refreshInterval * 60 * 1000);
  }
};

export const stopWeatherAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

// Subscribe to refresh interval changes
useWeatherStore.subscribe(
  (state) => state.refreshInterval,
  () => {
    const store = useWeatherStore.getState();
    if (store.autoRefresh) {
      startWeatherAutoRefresh();
    }
  }
);

// Subscribe to auto-refresh changes
useWeatherStore.subscribe(
  (state) => state.autoRefresh,
  (autoRefresh) => {
    if (autoRefresh) {
      startWeatherAutoRefresh();
    } else {
      stopWeatherAutoRefresh();
    }
  }
);

// Default locations for common observing sites
export const defaultLocations: LocationData[] = [
  {
    latitude: 34.2257,
    longitude: -116.8650,
    elevation: 1706,
    timezone: 'America/Los_Angeles',
    name: 'Joshua Tree National Park, CA'
  },
  {
    latitude: 31.9583,
    longitude: -111.5967,
    elevation: 2096,
    timezone: 'America/Phoenix',
    name: 'Kitt Peak, AZ'
  },
  {
    latitude: 19.8283,
    longitude: -155.4783,
    elevation: 4205,
    timezone: 'Pacific/Honolulu',
    name: 'Mauna Kea, HI'
  },
  {
    latitude: -24.6272,
    longitude: -70.4044,
    elevation: 2635,
    timezone: 'America/Santiago',
    name: 'Atacama Desert, Chile'
  },
  {
    latitude: 28.7606,
    longitude: -17.8814,
    elevation: 2396,
    timezone: 'Atlantic/Canary',
    name: 'Roque de los Muchachos, Spain'
  }
];

export default useWeatherStore;
