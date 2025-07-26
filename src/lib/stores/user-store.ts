import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api/auth';
import { webSocketManager } from '@/lib/api/websocket';
import { offlineStorage } from '@/lib/storage/offline-storage';
import { syncManager } from '@/lib/storage/sync-manager';
import { createNotification } from './notification-store';
import { immer } from 'zustand/middleware/immer';

// User profile types
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';
  units: 'metric' | 'imperial';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    equipment: boolean;
    sequences: boolean;
    weather: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    shareData: boolean;
    analytics: boolean;
  };
  equipment: {
    defaultProfiles: string[];
    autoConnect: boolean;
    simulationMode: boolean;
  };
}

export interface UserStats {
  totalSessions: number;
  totalImages: number;
  totalExposureTime: number; // in seconds
  favoriteTargets: string[];
  equipmentUsage: Record<string, number>;
  lastActive: Date;
  joinDate: Date;
}

export interface UserStoreState {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // User data
  profile: UserProfile | null;
  preferences: UserPreferences;
  stats: UserStats | null;
  
  // Session data
  sessionToken: string | null;
  refreshToken: string | null;
  tokenExpiry: Date | null;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: Partial<UserProfile> & { password: string; username: string; timezone: string }) => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  initializeAuth: () => Promise<boolean>;

  // Data loading methods
  loadUserPreferences: () => Promise<void>;
  loadUserStats: () => Promise<void>;

  // Utility actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  theme: 'auto',
  language: 'en',
  units: 'metric',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  notifications: {
    email: true,
    push: true,
    inApp: true,
    equipment: true,
    sequences: true,
    weather: false,
  },
  privacy: {
    profileVisibility: 'private',
    shareData: false,
    analytics: true,
  },
  equipment: {
    defaultProfiles: [],
    autoConnect: true,
    simulationMode: true,
  },
};

// Create user store
export const useUserStore = create<UserStoreState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: false,
      error: null,
      profile: null,
      preferences: defaultPreferences,
      stats: null,
      sessionToken: null,
      refreshToken: null,
      tokenExpiry: null,

      // Authentication actions
      login: async (email: string, password: string, rememberMe = false) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authApi.login({ email, password, rememberMe });

          if (response.success && response.data) {
            const { user, token, refreshToken, expiresAt } = response.data;

            // Store user data offline
            await offlineStorage.setUserData('profile', user, user.id, 'profile');

            // Initialize WebSocket connection
            webSocketManager.initialize(token);

            set((state) => {
              state.isAuthenticated = true;
              state.profile = user;
              state.sessionToken = token;
              state.refreshToken = refreshToken;
              state.tokenExpiry = new Date(expiresAt);
              state.isLoading = false;
            });

            // Load additional user data
            get().loadUserPreferences();
            get().loadUserStats();

            createNotification.success(
              'Welcome Back!',
              `Logged in as ${user.firstName} ${user.lastName}`,
              { category: 'system' }
            );

            return true;
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set((state) => {
            state.error = errorMessage;
            state.isLoading = false;
          });

          createNotification.error(
            'Login Failed',
            errorMessage,
            { category: 'system' }
          );

          return false;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
          webSocketManager.disconnect();

          set((state) => {
            state.isAuthenticated = false;
            state.profile = null;
            state.sessionToken = null;
            state.refreshToken = null;
            state.tokenExpiry = null;
            state.error = null;
            state.preferences = defaultPreferences;
            state.stats = null;
          });

          createNotification.info(
            'Logged Out',
            'You have been successfully logged out',
            { category: 'system' }
          );
        } catch (error) {
          console.error('Logout error:', error);
          // Force logout even if API call fails
          set((state) => {
            state.isAuthenticated = false;
            state.profile = null;
            state.sessionToken = null;
            state.refreshToken = null;
            state.tokenExpiry = null;
            state.error = null;
            state.preferences = defaultPreferences;
            state.stats = null;
          });
        }
      },

      register: async (userData) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            throw new Error('Registration failed');
          }

          const data = await response.json();
          
          set((state) => {
            state.isAuthenticated = true;
            state.profile = data.user;
            state.sessionToken = data.token;
            state.refreshToken = data.refreshToken;
            state.tokenExpiry = new Date(data.expiresAt);
            state.isLoading = false;
          });

          return true;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Registration failed';
            state.isLoading = false;
          });
          return false;
        }
      },

      updateProfile: async (updates) => {
        const { profile } = get();
        if (!profile) return false;

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().sessionToken}`,
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error('Profile update failed');
          }

          const updatedProfile = await response.json();
          
          set((state) => {
            state.profile = { ...state.profile!, ...updatedProfile };
            state.isLoading = false;
          });

          return true;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Profile update failed';
            state.isLoading = false;
          });
          return false;
        }
      },

      updatePreferences: async (updates) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().sessionToken}`,
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error('Preferences update failed');
          }

          set((state) => {
            state.preferences = { ...state.preferences, ...updates };
            state.isLoading = false;
          });

          return true;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Preferences update failed';
            state.isLoading = false;
          });
          return false;
        }
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Session refresh failed');
          }

          const data = await response.json();
          
          set((state) => {
            state.sessionToken = data.token;
            state.tokenExpiry = new Date(data.expiresAt);
          });

          return true;
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          return false;
        }
      },

      deleteAccount: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/user/delete', {
            method: 'DELETE',
            headers: { 
              'Authorization': `Bearer ${get().sessionToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Account deletion failed');
          }

          // Logout after successful deletion
          get().logout();
          return true;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Account deletion failed';
            state.isLoading = false;
          });
          return false;
        }
      },

      // Initialize authentication from stored tokens
      initializeAuth: async () => {
        try {
          const success = await authApi.initializeAuth();

          if (success) {
            const response = await authApi.getCurrentUser();

            if (response.success && response.data) {
              const user = response.data;

              // Initialize WebSocket
              const token = authApi.getStoredToken();
              if (token) {
                webSocketManager.initialize(token);
              }

              set((state) => {
                state.isAuthenticated = true;
                state.profile = user;
                state.sessionToken = token;
                state.refreshToken = authApi.getStoredRefreshToken();
              });

              // Load additional user data
              get().loadUserPreferences();
              get().loadUserStats();

              return true;
            }
          }

          return false;
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          return false;
        }
      },

      // Load user preferences
      loadUserPreferences: async () => {
        try {
          // Try to load from offline storage first
          const cachedPreferences = await offlineStorage.getUserData('preferences');
          if (cachedPreferences) {
            set((state) => {
              state.preferences = { ...defaultPreferences, ...cachedPreferences };
            });
          }
        } catch (error) {
          console.error('Failed to load user preferences:', error);
        }
      },

      // Load user statistics
      loadUserStats: async () => {
        try {
          // Try to load from offline storage first
          const cachedStats = await offlineStorage.getUserData('stats');
          if (cachedStats) {
            set((state) => {
              state.stats = cachedStats;
            });
          }
        } catch (error) {
          console.error('Failed to load user stats:', error);
        }
      },

      // Utility actions
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading;
        });
      },
    })),
    {
      name: 'user-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        profile: state.profile,
        preferences: state.preferences,
        sessionToken: state.sessionToken,
        refreshToken: state.refreshToken,
        tokenExpiry: state.tokenExpiry,
      }),
    }
  )
);
