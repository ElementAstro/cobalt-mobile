import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'equipment' | 'sequence' | 'weather';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actionable?: boolean;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'equipment' | 'imaging' | 'weather' | 'social' | 'update';
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  showOnLockScreen: boolean;
  categories: {
    system: boolean;
    equipment: boolean;
    imaging: boolean;
    weather: boolean;
    social: boolean;
    update: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  priority: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

export interface NotificationStoreState {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Preferences
  preferences: NotificationPreferences;
  
  // Push notification state
  pushSubscription: PushSubscription | null;
  pushSupported: boolean;
  pushPermission: NotificationPermission;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  clearExpired: () => void;
  
  // Preferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  
  // Push notifications
  requestPushPermission: () => Promise<boolean>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
  
  // Utility
  getNotificationsByCategory: (category: string) => Notification[];
  getUnreadNotifications: () => Notification[];
  shouldShowNotification: (notification: Notification) => boolean;
}

// Default preferences
const defaultPreferences: NotificationPreferences = {
  enabled: true,
  sound: true,
  vibration: true,
  showOnLockScreen: false,
  categories: {
    system: true,
    equipment: true,
    imaging: true,
    weather: true,
    social: false,
    update: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  priority: {
    low: true,
    medium: true,
    high: true,
    critical: true,
  },
};

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const isInQuietHours = (preferences: NotificationPreferences): boolean => {
  if (!preferences.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
  const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
};

const showBrowserNotification = (notification: Notification, preferences: NotificationPreferences) => {
  if (!preferences.enabled || isInQuietHours(preferences)) return;
  
  if ('Notification' in window && Notification.permission === 'granted') {
    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'critical',
      silent: !preferences.sound,
      // timestamp: notification.timestamp.getTime(), // Not supported in NotificationOptions
    });

    // Auto-close non-critical notifications after 5 seconds
    if (notification.priority !== 'critical') {
      setTimeout(() => browserNotification.close(), 5000);
    }

    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();
    };
  }
};

// Create notification store
export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      preferences: defaultPreferences,
      pushSubscription: null,
      pushSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window,
      pushPermission: typeof window !== 'undefined' ? Notification.permission : 'default',

      // Add notification
      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: generateId(),
          timestamp: new Date(),
          read: false,
        };

        set((state) => {
          // Remove expired notifications first
          const now = new Date();
          state.notifications = state.notifications.filter(
            (n: Notification) => !n.expiresAt || n.expiresAt > now
          );

          // Add new notification
          state.notifications.unshift(notification);
          
          // Limit to 100 notifications
          if (state.notifications.length > 100) {
            state.notifications = state.notifications.slice(0, 100);
          }
          
          // Update unread count
          state.unreadCount = state.notifications.filter((n: Notification) => !n.read).length;
        });

        // Show browser notification if appropriate
        const state = get();
        if (state.shouldShowNotification(notification)) {
          showBrowserNotification(notification, state.preferences);
        }
      },

      // Mark notification as read
      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n: Notification) => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        });
      },

      // Mark all notifications as read
      markAllAsRead: () => {
        set((state) => {
          state.notifications.forEach((n: Notification) => n.read = true);
          state.unreadCount = 0;
        });
      },

      // Remove notification
      removeNotification: (id) => {
        set((state) => {
          const index = state.notifications.findIndex((n: Notification) => n.id === id);
          if (index !== -1) {
            const wasUnread = !state.notifications[index].read;
            state.notifications.splice(index, 1);
            if (wasUnread) {
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          }
        });
      },

      // Clear all notifications
      clearAll: () => {
        set((state) => {
          state.notifications = [];
          state.unreadCount = 0;
        });
      },

      // Clear expired notifications
      clearExpired: () => {
        set((state) => {
          const now = new Date();
          const beforeCount = state.notifications.length;
          const unreadBefore = state.unreadCount;
          
          state.notifications = state.notifications.filter((n: Notification) => {
            if (n.expiresAt && n.expiresAt <= now) {
              if (!n.read) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
              return false;
            }
            return true;
          });
        });
      },

      // Update preferences
      updatePreferences: (updates) => {
        set((state) => {
          Object.assign(state.preferences, updates);
        });
      },

      // Request push notification permission
      requestPushPermission: async () => {
        if (!('Notification' in window)) return false;
        
        try {
          const permission = await Notification.requestPermission();
          set((state) => {
            state.pushPermission = permission;
          });
          return permission === 'granted';
        } catch (error) {
          console.error('Failed to request notification permission:', error);
          return false;
        }
      },

      // Subscribe to push notifications
      subscribeToPush: async () => {
        const { pushSupported, pushPermission } = get();
        if (!pushSupported || pushPermission !== 'granted') return false;

        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });

          set((state) => {
            state.pushSubscription = subscription;
          });

          // Send subscription to server
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
          });

          return true;
        } catch (error) {
          console.error('Failed to subscribe to push notifications:', error);
          return false;
        }
      },

      // Unsubscribe from push notifications
      unsubscribeFromPush: async () => {
        const { pushSubscription } = get();
        if (!pushSubscription) return true;

        try {
          await pushSubscription.unsubscribe();
          
          set((state) => {
            state.pushSubscription = null;
          });

          // Notify server
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: pushSubscription.endpoint }),
          });

          return true;
        } catch (error) {
          console.error('Failed to unsubscribe from push notifications:', error);
          return false;
        }
      },

      // Get notifications by category
      getNotificationsByCategory: (category) => {
        return get().notifications.filter(n => n.category === category);
      },

      // Get unread notifications
      getUnreadNotifications: () => {
        return get().notifications.filter(n => !n.read);
      },

      // Check if notification should be shown
      shouldShowNotification: (notification) => {
        const { preferences } = get();
        
        if (!preferences.enabled) return false;
        if (!preferences.categories[notification.category]) return false;
        if (!preferences.priority[notification.priority]) return false;
        if (isInQuietHours(preferences) && notification.priority !== 'critical') return false;
        
        return true;
      },
    })),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        preferences: state.preferences,
        pushSubscription: state.pushSubscription,
      }),
    }
  )
);

// Notification helper functions
export const createNotification = {
  info: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      priority: 'medium',
      category: 'system',
      ...options,
    }),

  success: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      priority: 'medium',
      category: 'system',
      ...options,
    }),

  warning: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      priority: 'high',
      category: 'system',
      ...options,
    }),

  error: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      priority: 'high',
      category: 'system',
      persistent: true,
      ...options,
    }),

  equipment: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().addNotification({
      type: 'equipment',
      title,
      message,
      priority: 'medium',
      category: 'equipment',
      ...options,
    }),

  sequence: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().addNotification({
      type: 'sequence',
      title,
      message,
      priority: 'medium',
      category: 'imaging',
      ...options,
    }),

  weather: (title: string, message: string, options?: Partial<Notification>) =>
    useNotificationStore.getState().addNotification({
      type: 'weather',
      title,
      message,
      priority: 'low',
      category: 'weather',
      ...options,
    }),
};
