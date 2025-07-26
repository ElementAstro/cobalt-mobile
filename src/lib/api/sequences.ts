import { apiClient, ApiResponse } from './client';

// Sequence Types
export interface ImagingSequence {
  id: string;
  name: string;
  description?: string;
  targetId: string;
  targetName: string;
  status: 'draft' | 'ready' | 'running' | 'paused' | 'completed' | 'cancelled' | 'error';
  steps: SequenceStep[];
  settings: SequenceSettings;
  progress: SequenceProgress;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  scheduledStart?: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
}

export interface SequenceStep {
  id: string;
  type: 'capture' | 'filter_change' | 'focus' | 'dither' | 'wait' | 'script';
  name: string;
  order: number;
  enabled: boolean;
  settings: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface SequenceSettings {
  autoStart: boolean;
  autoFocus: boolean;
  ditherEnabled: boolean;
  ditherPixels: number;
  pauseOnError: boolean;
  maxRetries: number;
  cooldownTemperature?: number;
  safetyChecks: {
    weather: boolean;
    altitude: boolean;
    focus: boolean;
  };
  notifications: {
    onStart: boolean;
    onComplete: boolean;
    onError: boolean;
    onProgress: boolean;
  };
}

export interface SequenceProgress {
  currentStepIndex: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  progressPercentage: number;
  estimatedTimeRemaining: number; // in minutes
  imagesCompleted: number;
  totalImages: number;
  totalExposureTime: number; // in seconds
  completedExposureTime: number; // in seconds
}

export interface CaptureStep extends SequenceStep {
  settings: {
    exposureTime: number; // in seconds
    binning: number;
    gain?: number;
    offset?: number;
    filter?: string;
    count: number;
    fileNamePattern: string;
    saveLocation: string;
  };
}

export interface SequenceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'deep_sky' | 'planetary' | 'lunar' | 'solar' | 'custom';
  targetType: 'galaxy' | 'nebula' | 'star_cluster' | 'planet' | 'moon' | 'sun' | 'other';
  steps: Omit<SequenceStep, 'id' | 'status' | 'startTime' | 'endTime' | 'error' | 'retryCount'>[];
  defaultSettings: Partial<SequenceSettings>;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SequenceExecutionLog {
  id: string;
  sequenceId: string;
  stepId: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

// Sequences API Service
export class SequencesApi {
  /**
   * Get all user sequences
   */
  async getSequences(filters?: {
    status?: ImagingSequence['status'];
    targetId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ImagingSequence[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.targetId) params.append('targetId', filters.targetId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    return apiClient.get<ImagingSequence[]>(`/sequences${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get sequence by ID
   */
  async getSequenceById(id: string): Promise<ApiResponse<ImagingSequence>> {
    return apiClient.get<ImagingSequence>(`/sequences/${id}`);
  }

  /**
   * Create new sequence
   */
  async createSequence(sequence: Omit<ImagingSequence, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'progress'>): Promise<ApiResponse<ImagingSequence>> {
    return apiClient.post<ImagingSequence>('/sequences', sequence);
  }

  /**
   * Update sequence
   */
  async updateSequence(id: string, updates: Partial<ImagingSequence>): Promise<ApiResponse<ImagingSequence>> {
    return apiClient.put<ImagingSequence>(`/sequences/${id}`, updates);
  }

  /**
   * Delete sequence
   */
  async deleteSequence(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/sequences/${id}`);
  }

  /**
   * Duplicate sequence
   */
  async duplicateSequence(id: string, name?: string): Promise<ApiResponse<ImagingSequence>> {
    return apiClient.post<ImagingSequence>(`/sequences/${id}/duplicate`, { name });
  }

  /**
   * Start sequence execution
   */
  async startSequence(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post<{ success: boolean; message: string }>(`/sequences/${id}/start`);
  }

  /**
   * Pause sequence execution
   */
  async pauseSequence(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post<{ success: boolean; message: string }>(`/sequences/${id}/pause`);
  }

  /**
   * Resume sequence execution
   */
  async resumeSequence(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post<{ success: boolean; message: string }>(`/sequences/${id}/resume`);
  }

  /**
   * Stop sequence execution
   */
  async stopSequence(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post<{ success: boolean; message: string }>(`/sequences/${id}/stop`);
  }

  /**
   * Cancel sequence execution
   */
  async cancelSequence(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post<{ success: boolean; message: string }>(`/sequences/${id}/cancel`);
  }

  /**
   * Get sequence progress
   */
  async getSequenceProgress(id: string): Promise<ApiResponse<SequenceProgress>> {
    return apiClient.get<SequenceProgress>(`/sequences/${id}/progress`);
  }

  /**
   * Get sequence execution logs
   */
  async getSequenceLogs(
    id: string,
    options?: {
      level?: 'debug' | 'info' | 'warn' | 'error';
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<SequenceExecutionLog[]>> {
    const params = new URLSearchParams();
    if (options?.level) params.append('level', options.level);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    return apiClient.get<SequenceExecutionLog[]>(`/sequences/${id}/logs${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Validate sequence before execution
   */
  async validateSequence(id: string): Promise<ApiResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    estimatedDuration: number;
  }>> {
    return apiClient.post<{
      isValid: boolean;
      errors: string[];
      warnings: string[];
      estimatedDuration: number;
    }>(`/sequences/${id}/validate`);
  }

  /**
   * Get sequence templates
   */
  async getTemplates(filters?: {
    category?: SequenceTemplate['category'];
    targetType?: SequenceTemplate['targetType'];
    difficulty?: SequenceTemplate['difficulty'];
    isPublic?: boolean;
  }): Promise<ApiResponse<SequenceTemplate[]>> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.targetType) params.append('targetType', filters.targetType);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());

    const queryString = params.toString();
    return apiClient.get<SequenceTemplate[]>(`/sequences/templates${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<ApiResponse<SequenceTemplate>> {
    return apiClient.get<SequenceTemplate>(`/sequences/templates/${id}`);
  }

  /**
   * Create sequence from template
   */
  async createFromTemplate(
    templateId: string,
    options: {
      name: string;
      targetId: string;
      customSettings?: Partial<SequenceSettings>;
    }
  ): Promise<ApiResponse<ImagingSequence>> {
    return apiClient.post<ImagingSequence>(`/sequences/templates/${templateId}/create`, options);
  }

  /**
   * Save sequence as template
   */
  async saveAsTemplate(
    sequenceId: string,
    templateData: Omit<SequenceTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<SequenceTemplate>> {
    return apiClient.post<SequenceTemplate>(`/sequences/${sequenceId}/save-as-template`, templateData);
  }

  /**
   * Schedule sequence execution
   */
  async scheduleSequence(
    id: string,
    scheduledStart: Date,
    conditions?: {
      weatherRequired?: boolean;
      altitudeMin?: number;
      altitudeMax?: number;
    }
  ): Promise<ApiResponse<{ success: boolean; scheduledId: string }>> {
    return apiClient.post<{ success: boolean; scheduledId: string }>(`/sequences/${id}/schedule`, {
      scheduledStart: scheduledStart.toISOString(),
      conditions,
    });
  }

  /**
   * Get scheduled sequences
   */
  async getScheduledSequences(): Promise<ApiResponse<Array<{
    id: string;
    sequenceId: string;
    scheduledStart: Date;
    status: 'pending' | 'running' | 'completed' | 'cancelled';
    conditions?: any;
  }>>> {
    return apiClient.get('/sequences/scheduled');
  }

  /**
   * Cancel scheduled sequence
   */
  async cancelScheduledSequence(scheduledId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/sequences/scheduled/${scheduledId}`);
  }

  /**
   * Get sequence statistics
   */
  async getSequenceStatistics(
    id: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<ApiResponse<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    totalImages: number;
    totalExposureTime: number;
    successRate: number;
    executionHistory: Array<{
      date: Date;
      duration: number;
      status: string;
      imagesCount: number;
    }>;
  }>> {
    const params = new URLSearchParams();
    if (timeRange?.start) params.append('start', timeRange.start.toISOString());
    if (timeRange?.end) params.append('end', timeRange.end.toISOString());

    const queryString = params.toString();
    return apiClient.get(`/sequences/${id}/statistics${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Export sequence configuration
   */
  async exportSequence(id: string): Promise<ApiResponse<{
    sequence: ImagingSequence;
    exportDate: Date;
    version: string;
  }>> {
    return apiClient.get(`/sequences/${id}/export`);
  }

  /**
   * Import sequence configuration
   */
  async importSequence(sequenceData: any): Promise<ApiResponse<ImagingSequence>> {
    return apiClient.post<ImagingSequence>('/sequences/import', { sequence: sequenceData });
  }

  /**
   * Get sequence recommendations based on target and conditions
   */
  async getRecommendations(
    targetId: string,
    conditions?: {
      availableTime?: number; // in minutes
      equipmentIds?: string[];
      experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    }
  ): Promise<ApiResponse<{
    recommended: SequenceTemplate[];
    reasons: string[];
    estimatedResults: {
      imageQuality: number;
      difficulty: number;
      timeRequired: number;
    };
  }>> {
    return apiClient.post('/sequences/recommendations', {
      targetId,
      conditions,
    });
  }
}

// Create singleton instance
export const sequencesApi = new SequencesApi();
