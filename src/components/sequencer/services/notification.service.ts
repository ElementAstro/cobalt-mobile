export interface SequenceNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  sequenceId?: string;
  stepId?: string;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

class NotificationService {
  private notifications: SequenceNotification[] = [];
  private listeners: Array<(notifications: SequenceNotification[]) => void> = [];

  subscribe(listener: (notifications: SequenceNotification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  add(notification: Omit<SequenceNotification, 'id' | 'timestamp'>) {
    const newNotification: SequenceNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.notifications.unshift(newNotification);
    
    // Auto-remove non-persistent notifications after 5 seconds
    if (!notification.persistent) {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, 5000);
    }

    this.notify();
    return newNotification.id;
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notify();
  }

  clear() {
    this.notifications = [];
    this.notify();
  }

  // Convenience methods for different notification types
  info(title: string, message: string, options?: Partial<SequenceNotification>) {
    return this.add({
      type: 'info',
      title,
      message,
      ...options,
    });
  }

  success(title: string, message: string, options?: Partial<SequenceNotification>) {
    return this.add({
      type: 'success',
      title,
      message,
      ...options,
    });
  }

  warning(title: string, message: string, options?: Partial<SequenceNotification>) {
    return this.add({
      type: 'warning',
      title,
      message,
      ...options,
    });
  }

  error(title: string, message: string, options?: Partial<SequenceNotification>) {
    return this.add({
      type: 'error',
      title,
      message,
      persistent: true, // Errors are persistent by default
      ...options,
    });
  }

  // Sequence-specific notifications
  sequenceStarted(sequenceName: string, sequenceId: string) {
    return this.success(
      'Sequence Started',
      `"${sequenceName}" has begun execution`,
      { sequenceId }
    );
  }

  sequenceCompleted(sequenceName: string, sequenceId: string, duration: number) {
    const durationText = this.formatDuration(duration);
    return this.success(
      'Sequence Completed',
      `"${sequenceName}" finished successfully in ${durationText}`,
      { sequenceId, persistent: true }
    );
  }

  sequenceFailed(sequenceName: string, sequenceId: string, error: string) {
    return this.error(
      'Sequence Failed',
      `"${sequenceName}" failed: ${error}`,
      { sequenceId }
    );
  }

  sequencePaused(sequenceName: string, sequenceId: string) {
    return this.warning(
      'Sequence Paused',
      `"${sequenceName}" has been paused`,
      { sequenceId }
    );
  }

  stepCompleted(stepName: string, sequenceId: string, stepId: string) {
    return this.info(
      'Step Completed',
      `"${stepName}" finished successfully`,
      { sequenceId, stepId }
    );
  }

  stepFailed(stepName: string, error: string, sequenceId: string, stepId: string, retryAction?: () => void) {
    const actions: NotificationAction[] = [];
    
    if (retryAction) {
      actions.push({
        label: 'Retry',
        action: retryAction,
        variant: 'default',
      });
    }

    return this.error(
      'Step Failed',
      `"${stepName}" failed: ${error}`,
      { 
        sequenceId, 
        stepId,
        actions,
      }
    );
  }

  equipmentError(equipmentName: string, error: string, reconnectAction?: () => void) {
    const actions: NotificationAction[] = [];
    
    if (reconnectAction) {
      actions.push({
        label: 'Reconnect',
        action: reconnectAction,
        variant: 'default',
      });
    }

    return this.error(
      'Equipment Error',
      `${equipmentName}: ${error}`,
      { actions }
    );
  }

  weatherWarning(condition: string, continueAction?: () => void, abortAction?: () => void) {
    const actions: NotificationAction[] = [];
    
    if (continueAction) {
      actions.push({
        label: 'Continue Anyway',
        action: continueAction,
        variant: 'destructive',
      });
    }
    
    if (abortAction) {
      actions.push({
        label: 'Abort Sequence',
        action: abortAction,
        variant: 'outline',
      });
    }

    return this.warning(
      'Weather Warning',
      `Poor conditions detected: ${condition}`,
      { 
        persistent: true,
        actions,
      }
    );
  }

  targetLow(targetName: string, altitude: number, continueAction?: () => void) {
    const actions: NotificationAction[] = [];
    
    if (continueAction) {
      actions.push({
        label: 'Continue',
        action: continueAction,
        variant: 'default',
      });
    }

    return this.warning(
      'Target Low',
      `${targetName} is at ${altitude.toFixed(1)}° altitude`,
      { 
        persistent: true,
        actions,
      }
    );
  }

  diskSpaceLow(availableGB: number) {
    return this.warning(
      'Low Disk Space',
      `Only ${availableGB.toFixed(1)} GB remaining`,
      { persistent: true }
    );
  }

  temperatureDrift(currentTemp: number, targetTemp: number) {
    const drift = Math.abs(currentTemp - targetTemp);
    return this.warning(
      'Temperature Drift',
      `Camera temperature has drifted ${drift.toFixed(1)}°C from target`,
    );
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // Browser notifications (if permission granted)
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  private async showBrowserNotification(notification: SequenceNotification) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);
  }

  // Enable/disable browser notifications
  private browserNotificationsEnabled = false;

  enableBrowserNotifications() {
    this.browserNotificationsEnabled = true;
  }

  disableBrowserNotifications() {
    this.browserNotificationsEnabled = false;
  }

  // Override add method to include browser notifications
  addWithBrowserNotification(notification: Omit<SequenceNotification, 'id' | 'timestamp'>) {
    const id = this.add(notification);
    
    if (this.browserNotificationsEnabled && (notification.type === 'error' || notification.type === 'success')) {
      const fullNotification = this.notifications.find(n => n.id === id);
      if (fullNotification) {
        this.showBrowserNotification(fullNotification);
      }
    }
    
    return id;
  }
}

export const notificationService = new NotificationService();
