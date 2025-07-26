import { apiClient, ApiResponse } from './client';

// Equipment Types
export interface Equipment {
  id: string;
  name: string;
  type: 'camera' | 'mount' | 'filter_wheel' | 'focuser' | 'guide_scope' | 'other';
  brand: string;
  model: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  connectionType: 'usb' | 'wifi' | 'bluetooth' | 'serial';
  capabilities: string[];
  settings: Record<string, any>;
  lastConnected?: Date;
  firmware?: string;
  serialNumber?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentProfile {
  id: string;
  name: string;
  description?: string;
  equipmentIds: string[];
  settings: Record<string, any>;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionRequest {
  equipmentId: string;
  connectionType?: 'usb' | 'wifi' | 'bluetooth' | 'serial';
  settings?: Record<string, any>;
}

export interface EquipmentSettings {
  [key: string]: any;
}

export interface EquipmentStatus {
  id: string;
  status: Equipment['status'];
  temperature?: number;
  power?: number;
  position?: { x: number; y: number; z?: number };
  lastUpdate: Date;
  errors?: string[];
  warnings?: string[];
}

export interface EquipmentCommand {
  command: string;
  parameters?: Record<string, any>;
  timeout?: number;
}

export interface CommandResponse {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

// Equipment API Service
export class EquipmentApi {
  /**
   * Get all user equipment
   */
  async getEquipment(): Promise<ApiResponse<Equipment[]>> {
    return apiClient.get<Equipment[]>('/equipment');
  }

  /**
   * Get equipment by ID
   */
  async getEquipmentById(id: string): Promise<ApiResponse<Equipment>> {
    return apiClient.get<Equipment>(`/equipment/${id}`);
  }

  /**
   * Add new equipment
   */
  async addEquipment(equipment: Omit<Equipment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Equipment>> {
    return apiClient.post<Equipment>('/equipment', equipment);
  }

  /**
   * Update equipment
   */
  async updateEquipment(id: string, updates: Partial<Equipment>): Promise<ApiResponse<Equipment>> {
    return apiClient.put<Equipment>(`/equipment/${id}`, updates);
  }

  /**
   * Delete equipment
   */
  async deleteEquipment(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/equipment/${id}`);
  }

  /**
   * Connect to equipment
   */
  async connectEquipment(request: ConnectionRequest): Promise<ApiResponse<EquipmentStatus>> {
    return apiClient.post<EquipmentStatus>(`/equipment/${request.equipmentId}/connect`, {
      connectionType: request.connectionType,
      settings: request.settings,
    });
  }

  /**
   * Disconnect from equipment
   */
  async disconnectEquipment(id: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/equipment/${id}/disconnect`);
  }

  /**
   * Get equipment status
   */
  async getEquipmentStatus(id: string): Promise<ApiResponse<EquipmentStatus>> {
    return apiClient.get<EquipmentStatus>(`/equipment/${id}/status`);
  }

  /**
   * Get status for all connected equipment
   */
  async getAllEquipmentStatus(): Promise<ApiResponse<EquipmentStatus[]>> {
    return apiClient.get<EquipmentStatus[]>('/equipment/status');
  }

  /**
   * Update equipment settings
   */
  async updateEquipmentSettings(id: string, settings: EquipmentSettings): Promise<ApiResponse<Equipment>> {
    return apiClient.put<Equipment>(`/equipment/${id}/settings`, { settings });
  }

  /**
   * Get equipment settings
   */
  async getEquipmentSettings(id: string): Promise<ApiResponse<EquipmentSettings>> {
    return apiClient.get<EquipmentSettings>(`/equipment/${id}/settings`);
  }

  /**
   * Send command to equipment
   */
  async sendCommand(id: string, command: EquipmentCommand): Promise<ApiResponse<CommandResponse>> {
    return apiClient.post<CommandResponse>(`/equipment/${id}/command`, command);
  }

  /**
   * Get equipment capabilities
   */
  async getEquipmentCapabilities(id: string): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>(`/equipment/${id}/capabilities`);
  }

  /**
   * Scan for available equipment
   */
  async scanForEquipment(connectionType?: string): Promise<ApiResponse<Equipment[]>> {
    const params = connectionType ? `?type=${connectionType}` : '';
    return apiClient.get<Equipment[]>(`/equipment/scan${params}`);
  }

  /**
   * Test equipment connection
   */
  async testConnection(id: string): Promise<ApiResponse<{ success: boolean; latency: number; error?: string }>> {
    return apiClient.post<{ success: boolean; latency: number; error?: string }>(`/equipment/${id}/test`);
  }

  /**
   * Get equipment profiles
   */
  async getProfiles(): Promise<ApiResponse<EquipmentProfile[]>> {
    return apiClient.get<EquipmentProfile[]>('/equipment/profiles');
  }

  /**
   * Get profile by ID
   */
  async getProfileById(id: string): Promise<ApiResponse<EquipmentProfile>> {
    return apiClient.get<EquipmentProfile>(`/equipment/profiles/${id}`);
  }

  /**
   * Create equipment profile
   */
  async createProfile(profile: Omit<EquipmentProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<EquipmentProfile>> {
    return apiClient.post<EquipmentProfile>('/equipment/profiles', profile);
  }

  /**
   * Update equipment profile
   */
  async updateProfile(id: string, updates: Partial<EquipmentProfile>): Promise<ApiResponse<EquipmentProfile>> {
    return apiClient.put<EquipmentProfile>(`/equipment/profiles/${id}`, updates);
  }

  /**
   * Delete equipment profile
   */
  async deleteProfile(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/equipment/profiles/${id}`);
  }

  /**
   * Apply equipment profile
   */
  async applyProfile(id: string): Promise<ApiResponse<{ applied: string[]; failed: string[] }>> {
    return apiClient.post<{ applied: string[]; failed: string[] }>(`/equipment/profiles/${id}/apply`);
  }

  /**
   * Get equipment logs
   */
  async getEquipmentLogs(
    id: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      level?: 'debug' | 'info' | 'warn' | 'error';
      limit?: number;
    }
  ): Promise<ApiResponse<Array<{
    timestamp: Date;
    level: string;
    message: string;
    data?: any;
  }>>> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate.toISOString());
    if (options?.endDate) params.append('endDate', options.endDate.toISOString());
    if (options?.level) params.append('level', options.level);
    if (options?.limit) params.append('limit', options.limit.toString());

    const queryString = params.toString();
    const url = `/equipment/${id}/logs${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(url);
  }

  /**
   * Calibrate equipment
   */
  async calibrateEquipment(
    id: string,
    calibrationType: string,
    parameters?: Record<string, any>
  ): Promise<ApiResponse<{ success: boolean; calibrationData?: any; error?: string }>> {
    return apiClient.post(`/equipment/${id}/calibrate`, {
      type: calibrationType,
      parameters,
    });
  }

  /**
   * Get calibration status
   */
  async getCalibrationStatus(id: string): Promise<ApiResponse<{
    isCalibrated: boolean;
    lastCalibration?: Date;
    calibrationData?: any;
    nextCalibrationDue?: Date;
  }>> {
    return apiClient.get(`/equipment/${id}/calibration/status`);
  }

  /**
   * Update equipment firmware
   */
  async updateFirmware(
    id: string,
    firmwareFile: File
  ): Promise<ApiResponse<{ success: boolean; version?: string; error?: string }>> {
    const formData = new FormData();
    formData.append('firmware', firmwareFile);

    return apiClient.request(`/equipment/${id}/firmware/update`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  }

  /**
   * Get firmware update status
   */
  async getFirmwareUpdateStatus(id: string): Promise<ApiResponse<{
    isUpdating: boolean;
    progress?: number;
    currentVersion?: string;
    targetVersion?: string;
    error?: string;
  }>> {
    return apiClient.get(`/equipment/${id}/firmware/status`);
  }

  /**
   * Export equipment configuration
   */
  async exportConfiguration(equipmentIds?: string[]): Promise<ApiResponse<{
    configuration: any;
    exportDate: Date;
    version: string;
  }>> {
    const body = equipmentIds ? { equipmentIds } : undefined;
    return apiClient.post('/equipment/export', body);
  }

  /**
   * Import equipment configuration
   */
  async importConfiguration(configurationData: any): Promise<ApiResponse<{
    imported: string[];
    failed: string[];
    warnings: string[];
  }>> {
    return apiClient.post('/equipment/import', { configuration: configurationData });
  }

  /**
   * Get equipment statistics
   */
  async getEquipmentStatistics(
    id: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ApiResponse<{
    connectionTime: number;
    commandsExecuted: number;
    errorsCount: number;
    averageResponseTime: number;
    lastUsed: Date;
    usageByDay: Array<{ date: string; usage: number }>;
  }>> {
    const params = new URLSearchParams();
    if (timeRange?.start) params.append('start', timeRange.start.toISOString());
    if (timeRange?.end) params.append('end', timeRange.end.toISOString());

    const queryString = params.toString();
    const url = `/equipment/${id}/statistics${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(url);
  }
}

// Create singleton instance
export const equipmentApi = new EquipmentApi();
