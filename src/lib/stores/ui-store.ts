import { createEnhancedStore } from './base-store';

// UI types
export type CurrentPage =
  | 'dashboard'
  | 'devices'
  | 'sequence'
  | 'logs'
  | 'settings'
  | 'camera-detail'
  | 'mount-detail'
  | 'filter-detail'
  | 'focuser-detail'
  | 'profiles'
  | 'monitor'
  | 'planner';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';
export type Theme = 'light' | 'dark' | 'auto';

export interface NotificationState {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
}

export interface ModalState {
  id: string;
  type: string;
  props: Record<string, unknown>;
  isOpen: boolean;
}

// UI store state
interface UIStoreState {
  // Navigation
  currentPage: CurrentPage;
  navigationHistory: CurrentPage[];
  isNavigating: boolean;

  // Theme and appearance
  theme: Theme;
  isDarkMode: boolean;
  language: Language;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;

  // Layout
  sidebarCollapsed: boolean;
  compactMode: boolean;
  showAdvancedControls: boolean;

  // Notifications
  notifications: NotificationState[];
  unreadNotificationCount: number;
  notificationsEnabled: boolean;

  // Modals and overlays
  modals: ModalState[];
  activeModal: string | null;
  isLoading: boolean;
  loadingMessage: string;

  // User preferences
  autoSave: boolean;
  confirmActions: boolean;
  showTooltips: boolean;
  enableHapticFeedback: boolean;

  // Performance
  performanceMode: 'auto' | 'high' | 'balanced' | 'battery';
  animationsEnabled: boolean;
  backgroundUpdatesEnabled: boolean;

  // Actions
  setCurrentPage: (page: CurrentPage) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleDarkMode: () => void;
  
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  setShowAdvancedControls: (show: boolean) => void;
  
  addNotification: (notification: Omit<NotificationState, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  openModal: (type: string, props?: Record<string, unknown>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  setLoading: (loading: boolean, message?: string) => void;
  
  updatePreferences: (preferences: Partial<{
    autoSave: boolean;
    confirmActions: boolean;
    showTooltips: boolean;
    enableHapticFeedback: boolean;
    performanceMode: 'auto' | 'high' | 'balanced' | 'battery';
    animationsEnabled: boolean;
    backgroundUpdatesEnabled: boolean;
  }>) => void;
}

// Initial state
const initialUIState = {
  currentPage: 'dashboard' as CurrentPage,
  navigationHistory: ['dashboard' as CurrentPage],
  isNavigating: false,

  theme: 'auto' as Theme,
  isDarkMode: false,
  language: 'en' as Language,
  fontSize: 'medium' as const,
  reducedMotion: false,

  sidebarCollapsed: false,
  compactMode: false,
  showAdvancedControls: false,

  notifications: [],
  unreadNotificationCount: 0,
  notificationsEnabled: true,

  modals: [],
  activeModal: null,
  isLoading: false,
  loadingMessage: '',

  autoSave: true,
  confirmActions: true,
  showTooltips: true,
  enableHapticFeedback: true,

  performanceMode: 'auto' as const,
  animationsEnabled: true,
  backgroundUpdatesEnabled: true,
};

// Create UI store
export const useUIStore = createEnhancedStore<UIStoreState>(
  {
    name: 'ui-store',
    version: 1,
    persist: true,
    persistKeys: [
      'theme',
      'language',
      'fontSize',
      'sidebarCollapsed',
      'compactMode',
      'showAdvancedControls',
      'autoSave',
      'confirmActions',
      'showTooltips',
      'enableHapticFeedback',
      'performanceMode',
      'animationsEnabled',
      'backgroundUpdatesEnabled',
    ],
  },
  (set: any) => ({
    ...initialUIState,

    // Navigation actions
    setCurrentPage: (page: any) =>
      set((state: any) => {
        if (state.currentPage !== page) {
          state.navigationHistory.push(page);
          // Keep history limited to 10 items
          if (state.navigationHistory.length > 10) {
            state.navigationHistory = state.navigationHistory.slice(-10);
          }
          state.currentPage = page;
        }
      }),

    navigateBack: () =>
      set((state: any) => {
        const history = state.navigationHistory;
        if (history.length > 1) {
          history.pop(); // Remove current page
          const previousPage = history[history.length - 1];
          state.currentPage = previousPage;
        }
      }),

    navigateForward: () => {
      // Implementation would depend on forward history tracking
    },

    // Theme actions
    setTheme: (theme: any) =>
      set((state: any) => {
        state.theme = theme;
        // Auto-detect dark mode based on system preference
        if (theme === 'auto') {
          state.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        } else {
          state.isDarkMode = theme === 'dark';
        }
      }),

    setLanguage: (language: any) =>
      set((state: any) => {
        state.language = language;
      }),

    setFontSize: (size: any) =>
      set((state: any) => {
        state.fontSize = size;
      }),

    toggleDarkMode: () =>
      set((state: any) => {
        state.isDarkMode = !state.isDarkMode;
        state.theme = state.isDarkMode ? 'dark' : 'light';
      }),

    // Layout actions
    setSidebarCollapsed: (collapsed: any) =>
      set((state: any) => {
        state.sidebarCollapsed = collapsed;
      }),

    setCompactMode: (compact: any) =>
      set((state: any) => {
        state.compactMode = compact;
      }),

    setShowAdvancedControls: (show: any) =>
      set((state: any) => {
        state.showAdvancedControls = show;
      }),

    // Notification actions
    addNotification: (notification: any) =>
      set((state: any) => {
        const newNotification: NotificationState = {
          ...notification,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          read: false,
        };

        state.notifications.unshift(newNotification);

        // Keep only last 50 notifications
        if (state.notifications.length > 50) {
          state.notifications = state.notifications.slice(0, 50);
        }

        state.unreadNotificationCount = state.notifications.filter((n: any) => !n.read).length;
      }),

    markNotificationRead: (id: any) =>
      set((state: any) => {
        const notification = state.notifications.find((n: any) => n.id === id);
        if (notification) {
          notification.read = true;
          state.unreadNotificationCount = state.notifications.filter((n: any) => !n.read).length;
        }
      }),

    removeNotification: (id: any) =>
      set((state: any) => {
        state.notifications = state.notifications.filter((n: any) => n.id !== id);
        state.unreadNotificationCount = state.notifications.filter((n: any) => !n.read).length;
      }),

    clearAllNotifications: () =>
      set((state: any) => {
        state.notifications = [];
        state.unreadNotificationCount = 0;
      }),

    // Modal actions
    openModal: (type: any, props: any = {}) => {
      const id = Math.random().toString(36).substr(2, 9);
      set((state: any) => {
        const modal: ModalState = {
          id,
          type,
          props,
          isOpen: true,
        };
        state.modals.push(modal);
        state.activeModal = id;
      });
      return id;
    },

    closeModal: (id: any) =>
      set((state: any) => {
        state.modals = state.modals.filter((m: any) => m.id !== id);
        if (state.activeModal === id) {
          const lastModal = state.modals[state.modals.length - 1];
          state.activeModal = lastModal ? lastModal.id : null;
        }
      }),

    closeAllModals: () =>
      set((state: any) => {
        state.modals = [];
        state.activeModal = null;
      }),

    // Loading actions
    setLoading: (loading: any, message: any = '') =>
      set((state: any) => {
        state.isLoading = loading;
        state.loadingMessage = message;
      }),

    // Preferences actions
    updatePreferences: (preferences: any) =>
      set((state: any) => {
        Object.assign(state, preferences);
      }),
  })
);

// Computed selectors
export const useUISelectors = () => {
  const store = useUIStore();
  
  return {
    // Get current theme with system preference detection
    getEffectiveTheme: () => {
      const { theme, isDarkMode } = store;
      if (theme === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return isDarkMode ? 'dark' : 'light';
    },
    
    // Get unread notifications
    getUnreadNotifications: () => {
      return store.notifications.filter(n => !n.read);
    },
    
    // Get active modal
    getActiveModal: () => {
      return store.modals.find(m => m.id === store.activeModal);
    },
    
    // Check if animations should be enabled
    shouldUseAnimations: () => {
      return store.animationsEnabled && !store.reducedMotion;
    },
  };
};
