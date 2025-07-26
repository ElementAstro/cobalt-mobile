/**
 * Filter wheel status hook
 * Specialized hook for handling filter wheel status and connection management
 */

import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { UseFilterWheelStatusReturn } from '../types/filterwheel.types';
import {
  getStatusColor,
  getConnectionStatusText,
  isTemperatureNormal,
  formatTemperature,
  getTemperatureStatus,
} from '../utils/filterwheel.utils';

export function useFilterWheelStatus(): UseFilterWheelStatusReturn {
  const {
    filterWheelStatus,
    setFilterWheelStatus,
    equipmentStatus,
    setEquipmentStatus,
  } = useAppStore();

  // Enhanced status with connection info
  const status = useMemo(() => ({
    ...filterWheelStatus,
    connected: equipmentStatus.filterWheel === 'connected',
  }), [filterWheelStatus, equipmentStatus.filterWheel]);

  // Connection state
  const isConnected = status.connected;
  const temperature = status.temperature;

  // Refresh status from device
  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      // In a real implementation, this would communicate with the actual device
      // For now, we'll simulate a status refresh
      
      // Simulate some variation in temperature
      const tempVariation = (Math.random() - 0.5) * 2; // ±1°C variation
      const newTemperature = Math.max(-10, Math.min(50, status.temperature + tempVariation));
      
      setFilterWheelStatus({
        ...status,
        temperature: newTemperature,
      });
    } catch (error) {
      console.error('Failed to refresh filter wheel status:', error);
      throw error;
    }
  }, [status, setFilterWheelStatus]);

  // Connect to filter wheel
  const connect = useCallback(async (): Promise<void> => {
    try {
      // Simulate connection process
      setEquipmentStatus({ filterWheel: 'connecting' });
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setEquipmentStatus({ filterWheel: 'connected' });
      
      // Initialize status after connection
      setFilterWheelStatus({
        currentPosition: 1,
        targetPosition: 1,
        moving: false,
        connected: true,
        temperature: 18.5,
      });
    } catch (error) {
      setEquipmentStatus({ filterWheel: 'error' });
      console.error('Failed to connect to filter wheel:', error);
      throw error;
    }
  }, [setEquipmentStatus, setFilterWheelStatus]);

  // Disconnect from filter wheel
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      setEquipmentStatus({ filterWheel: 'disconnected' });
      
      setFilterWheelStatus({
        ...status,
        connected: false,
        moving: false,
      });
    } catch (error) {
      console.error('Failed to disconnect from filter wheel:', error);
      throw error;
    }
  }, [status, setEquipmentStatus, setFilterWheelStatus]);

  // Get status color based on connection and movement state
  const getStatusColorUtil = useCallback((): string => {
    if (!isConnected) return getStatusColor('disconnected');
    if (status.moving) return getStatusColor('moving');
    return getStatusColor('connected');
  }, [isConnected, status.moving]);

  // Get connection status text
  const getConnectionStatusTextUtil = useCallback((): string => {
    if (equipmentStatus.filterWheel === 'connecting') return 'Connecting...';
    if (equipmentStatus.filterWheel === 'error') return 'Error';
    return getConnectionStatusText(isConnected);
  }, [equipmentStatus.filterWheel, isConnected]);

  // Check if temperature is normal
  const isTemperatureNormalUtil = useCallback((): boolean => {
    return isTemperatureNormal(temperature);
  }, [temperature]);

  // Get formatted temperature
  const getFormattedTemperature = useCallback((unit: 'celsius' | 'fahrenheit' = 'celsius'): string => {
    return formatTemperature(temperature, unit);
  }, [temperature]);

  // Get temperature status
  const getTemperatureStatusUtil = useCallback(() => {
    return getTemperatureStatus(temperature);
  }, [temperature]);

  // Get detailed status information
  const getDetailedStatus = useCallback(() => {
    return {
      connection: {
        status: equipmentStatus.filterWheel,
        text: getConnectionStatusTextUtil(),
        color: getStatusColorUtil(),
      },
      temperature: {
        value: temperature,
        formatted: getFormattedTemperature(),
        status: getTemperatureStatusUtil(),
        isNormal: isTemperatureNormalUtil(),
      },
      position: {
        current: status.currentPosition,
        target: status.moving ? status.targetPosition : null,
        isMoving: status.moving,
      },
    };
  }, [
    equipmentStatus.filterWheel,
    getConnectionStatusTextUtil,
    getStatusColorUtil,
    temperature,
    getFormattedTemperature,
    getTemperatureStatusUtil,
    isTemperatureNormalUtil,
    status.currentPosition,
    status.targetPosition,
    status.moving,
  ]);

  return {
    // Status state
    status,
    isConnected,
    temperature,

    // Status actions
    refreshStatus,
    connect,
    disconnect,

    // Status utilities
    getStatusColor: getStatusColorUtil,
    getConnectionStatusText: getConnectionStatusTextUtil,
    isTemperatureNormal: isTemperatureNormalUtil,
    getFormattedTemperature,
    getTemperatureStatus: getTemperatureStatusUtil,
    getDetailedStatus,
  };
}
