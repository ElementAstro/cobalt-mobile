import { createNotification } from '@/lib/stores/notification-store';

// WebSocket Message Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id?: string;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  authToken?: string;
}

export interface WebSocketEventHandlers {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnect?: (attempt: number) => void;
  onReconnectFailed?: () => void;
}

// WebSocket Connection States
export enum WebSocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

// Real-time Event Types
export enum RealtimeEventType {
  // Equipment events
  EQUIPMENT_STATUS_CHANGED = 'equipment:status_changed',
  EQUIPMENT_CONNECTED = 'equipment:connected',
  EQUIPMENT_DISCONNECTED = 'equipment:disconnected',
  EQUIPMENT_ERROR = 'equipment:error',
  
  // Sequence events
  SEQUENCE_STARTED = 'sequence:started',
  SEQUENCE_COMPLETED = 'sequence:completed',
  SEQUENCE_PAUSED = 'sequence:paused',
  SEQUENCE_RESUMED = 'sequence:resumed',
  SEQUENCE_CANCELLED = 'sequence:cancelled',
  SEQUENCE_PROGRESS = 'sequence:progress',
  
  // Image capture events
  IMAGE_CAPTURE_STARTED = 'image:capture_started',
  IMAGE_CAPTURE_COMPLETED = 'image:capture_completed',
  IMAGE_CAPTURE_FAILED = 'image:capture_failed',
  IMAGE_PROCESSING_STARTED = 'image:processing_started',
  IMAGE_PROCESSING_COMPLETED = 'image:processing_completed',
  
  // System events
  SYSTEM_STATUS = 'system:status',
  SYSTEM_WARNING = 'system:warning',
  SYSTEM_ERROR = 'system:error',
  
  // User events
  USER_NOTIFICATION = 'user:notification',
  USER_MESSAGE = 'user:message',
  
  // Weather events
  WEATHER_UPDATE = 'weather:update',
  WEATHER_ALERT = 'weather:alert',
}

// WebSocket Client Class
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private handlers: WebSocketEventHandlers = {};
  private messageHandlers = new Map<string, Array<(data: any) => void>>();
  private state: WebSocketState = WebSocketState.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private isManualClose = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('WebSocket is already connected');
      return;
    }

    this.isManualClose = false;
    this.setState(WebSocketState.CONNECTING);

    try {
      // Build WebSocket URL with auth token if provided
      let wsUrl = this.config.url;
      if (this.config.authToken) {
        const separator = wsUrl.includes('?') ? '&' : '?';
        wsUrl += `${separator}token=${encodeURIComponent(this.config.authToken)}`;
      }

      this.ws = new WebSocket(wsUrl, this.config.protocols);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.setState(WebSocketState.ERROR);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualClose = true;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.setState(WebSocketState.DISCONNECTED);
    this.reconnectAttempts = 0;
  }

  /**
   * Send message to server
   */
  send(type: string, data: any): void {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        this.queueMessage(message);
      }
    } else {
      this.queueMessage(message);
    }
  }

  /**
   * Subscribe to specific message type
   */
  subscribe(messageType: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    
    this.messageHandlers.get(messageType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: WebSocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Get current connection state
   */
  getState(): WebSocketState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === WebSocketState.CONNECTED;
  }

  /**
   * Update auth token
   */
  updateAuthToken(token: string): void {
    this.config.authToken = token;
    
    // Reconnect with new token if currently connected
    if (this.isConnected()) {
      this.disconnect();
      setTimeout(() => this.connect(), 100);
    }
  }

  // Private methods
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      console.log('WebSocket connected');
      this.setState(WebSocketState.CONNECTED);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processMessageQueue();
      this.handlers.onOpen?.(event);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.setState(WebSocketState.DISCONNECTED);
      this.clearTimers();
      this.handlers.onClose?.(event);
      
      if (!this.isManualClose && event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.setState(WebSocketState.ERROR);
      this.handlers.onError?.(event);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle heartbeat responses
    if (message.type === 'pong') {
      return;
    }

    // Call general message handler
    this.handlers.onMessage?.(message);

    // Call specific message type handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data);
        } catch (error) {
          console.error(`Error in message handler for ${message.type}:`, error);
        }
      });
    }

    // Handle system notifications
    if (message.type === RealtimeEventType.USER_NOTIFICATION) {
      this.handleNotification(message.data);
    }
  }

  private handleNotification(notificationData: any): void {
    const { type, title, message, priority, category } = notificationData;
    
    switch (type) {
      case 'info':
        createNotification.info(title, message, { priority, category });
        break;
      case 'success':
        createNotification.success(title, message, { priority, category });
        break;
      case 'warning':
        createNotification.warning(title, message, { priority, category });
        break;
      case 'error':
        createNotification.error(title, message, { priority, category });
        break;
      default:
        createNotification.info(title, message, { priority, category });
    }
  }

  private setState(newState: WebSocketState): void {
    if (this.state !== newState) {
      this.state = newState;
      console.log(`WebSocket state changed to: ${newState}`);
    }
  }

  private scheduleReconnect(): void {
    if (this.isManualClose || this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
        console.error('Max reconnection attempts reached');
        this.handlers.onReconnectFailed?.();
      }
      return;
    }

    this.setState(WebSocketState.RECONNECTING);
    this.reconnectAttempts++;
    
    const delay = this.config.reconnectInterval! * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.handlers.onReconnect?.(this.reconnectAttempts);
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    if (this.config.heartbeatInterval! > 0) {
      this.heartbeatTimer = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.send('ping', { timestamp: Date.now() });
        }
      }, this.config.heartbeatInterval);
    }
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);
    
    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!;
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send queued message:', error);
        break;
      }
    }
  }
}

// WebSocket Manager for the application
export class WebSocketManager {
  private client: WebSocketClient | null = null;
  private config: WebSocketConfig;

  constructor() {
    this.config = {
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
    };
  }

  /**
   * Initialize WebSocket connection
   */
  initialize(authToken?: string): void {
    if (this.client) {
      this.client.disconnect();
    }

    this.config.authToken = authToken;
    this.client = new WebSocketClient(this.config);
    
    this.client.setEventHandlers({
      onOpen: () => {
        console.log('Real-time connection established');
        createNotification.success(
          'Connected',
          'Real-time updates are now active',
          { category: 'system' }
        );
      },
      onClose: () => {
        console.log('Real-time connection closed');
      },
      onError: () => {
        createNotification.error(
          'Connection Error',
          'Failed to establish real-time connection',
          { category: 'system' }
        );
      },
      onReconnectFailed: () => {
        createNotification.error(
          'Connection Failed',
          'Unable to reconnect to real-time services',
          { category: 'system', persistent: true }
        );
      },
    });

    this.client.connect();
  }

  /**
   * Get WebSocket client instance
   */
  getClient(): WebSocketClient | null {
    return this.client;
  }

  /**
   * Subscribe to equipment status updates
   */
  subscribeToEquipmentUpdates(handler: (data: any) => void): () => void {
    if (!this.client) throw new Error('WebSocket not initialized');
    
    const unsubscribers = [
      this.client.subscribe(RealtimeEventType.EQUIPMENT_STATUS_CHANGED, handler),
      this.client.subscribe(RealtimeEventType.EQUIPMENT_CONNECTED, handler),
      this.client.subscribe(RealtimeEventType.EQUIPMENT_DISCONNECTED, handler),
      this.client.subscribe(RealtimeEventType.EQUIPMENT_ERROR, handler),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }

  /**
   * Subscribe to sequence updates
   */
  subscribeToSequenceUpdates(handler: (data: any) => void): () => void {
    if (!this.client) throw new Error('WebSocket not initialized');
    
    const unsubscribers = [
      this.client.subscribe(RealtimeEventType.SEQUENCE_STARTED, handler),
      this.client.subscribe(RealtimeEventType.SEQUENCE_COMPLETED, handler),
      this.client.subscribe(RealtimeEventType.SEQUENCE_PAUSED, handler),
      this.client.subscribe(RealtimeEventType.SEQUENCE_RESUMED, handler),
      this.client.subscribe(RealtimeEventType.SEQUENCE_CANCELLED, handler),
      this.client.subscribe(RealtimeEventType.SEQUENCE_PROGRESS, handler),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }

  /**
   * Subscribe to image capture updates
   */
  subscribeToImageUpdates(handler: (data: any) => void): () => void {
    if (!this.client) throw new Error('WebSocket not initialized');
    
    const unsubscribers = [
      this.client.subscribe(RealtimeEventType.IMAGE_CAPTURE_STARTED, handler),
      this.client.subscribe(RealtimeEventType.IMAGE_CAPTURE_COMPLETED, handler),
      this.client.subscribe(RealtimeEventType.IMAGE_CAPTURE_FAILED, handler),
      this.client.subscribe(RealtimeEventType.IMAGE_PROCESSING_STARTED, handler),
      this.client.subscribe(RealtimeEventType.IMAGE_PROCESSING_COMPLETED, handler),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }

  /**
   * Subscribe to system updates
   */
  subscribeToSystemUpdates(handler: (data: any) => void): () => void {
    if (!this.client) throw new Error('WebSocket not initialized');
    
    const unsubscribers = [
      this.client.subscribe(RealtimeEventType.SYSTEM_STATUS, handler),
      this.client.subscribe(RealtimeEventType.SYSTEM_WARNING, handler),
      this.client.subscribe(RealtimeEventType.SYSTEM_ERROR, handler),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }

  /**
   * Subscribe to weather updates
   */
  subscribeToWeatherUpdates(handler: (data: any) => void): () => void {
    if (!this.client) throw new Error('WebSocket not initialized');
    
    const unsubscribers = [
      this.client.subscribe(RealtimeEventType.WEATHER_UPDATE, handler),
      this.client.subscribe(RealtimeEventType.WEATHER_ALERT, handler),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }

  /**
   * Update authentication token
   */
  updateAuthToken(token: string): void {
    this.config.authToken = token;
    if (this.client) {
      this.client.updateAuthToken(token);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client?.isConnected() || false;
  }
}

// Create singleton instance
export const webSocketManager = new WebSocketManager();
