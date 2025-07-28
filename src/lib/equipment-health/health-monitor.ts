export interface EquipmentMetrics {
  timestamp: Date;
  temperature: number; // Celsius
  humidity: number; // Percentage
  voltage: number; // Volts
  current: number; // Amperes
  power: number; // Watts
  vibration: number; // Arbitrary units
  operatingTime: number; // Hours since last power on
  cycleCount: number; // Number of operations/cycles
  errorCount: number; // Number of errors since last reset
  responseTime: number; // Command response time in ms
  accuracy: number; // Positioning accuracy in arcseconds
  backlash: number; // Mechanical backlash in arcseconds
  thermalDrift: number; // Thermal drift in arcseconds/°C
}

export interface EquipmentComponent {
  id: string;
  name: string;
  type: 'mount' | 'camera' | 'focuser' | 'filterwheel' | 'rotator' | 'guider' | 'dome' | 'weather_station';
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  installDate: Date;
  lastMaintenance?: Date;
  warrantyExpiry?: Date;
  expectedLifetime: number; // Hours
  criticalTemperatureRange: { min: number; max: number };
  optimalTemperatureRange: { min: number; max: number };
  maxOperatingHours: number; // Hours per session
  maintenanceInterval: number; // Days
  calibrationInterval: number; // Days
  specifications: {
    accuracy?: number; // arcseconds
    repeatability?: number; // arcseconds
    maxLoad?: number; // kg
    powerConsumption?: number; // watts
    operatingTemperature?: { min: number; max: number };
    [key: string]: any;
  };
}

export interface HealthStatus {
  component: EquipmentComponent;
  overall: 'excellent' | 'good' | 'warning' | 'critical' | 'offline';
  score: number; // 0-100
  metrics: EquipmentMetrics;
  trends: {
    temperature: 'stable' | 'rising' | 'falling' | 'fluctuating';
    power: 'stable' | 'increasing' | 'decreasing' | 'fluctuating';
    accuracy: 'stable' | 'improving' | 'degrading';
    responseTime: 'stable' | 'improving' | 'degrading';
  };
  alerts: {
    type: 'temperature' | 'power' | 'accuracy' | 'maintenance' | 'calibration' | 'error' | 'wear';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
  }[];
  predictions: {
    nextMaintenance: Date;
    nextCalibration: Date;
    estimatedLifeRemaining: number; // Hours
    failureRisk: 'low' | 'medium' | 'high';
    recommendedActions: string[];
  };
  performance: {
    uptime: number; // Percentage
    reliability: number; // Percentage
    efficiency: number; // Percentage
    mtbf: number; // Mean time between failures in hours
  };
}

export interface MaintenanceRecord {
  id: string;
  componentId: string;
  date: Date;
  type: 'routine' | 'preventive' | 'corrective' | 'calibration' | 'upgrade';
  description: string;
  technician: string;
  duration: number; // Minutes
  cost?: number;
  partsReplaced?: string[];
  notes?: string;
  beforeMetrics?: EquipmentMetrics;
  afterMetrics?: EquipmentMetrics;
  nextScheduled?: Date;
}

export interface PerformanceBaseline {
  componentId: string;
  establishedDate: Date;
  baselineMetrics: EquipmentMetrics;
  tolerances: {
    temperature: number;
    accuracy: number;
    responseTime: number;
    power: number;
  };
  updateInterval: number; // Days
  lastUpdate: Date;
}

class EquipmentHealthMonitor {
  private components: Map<string, EquipmentComponent> = new Map();
  private healthHistory: Map<string, HealthStatus[]> = new Map();
  private maintenanceRecords: Map<string, MaintenanceRecord[]> = new Map();
  private performanceBaselines: Map<string, PerformanceBaseline> = new Map();
  private alertCallbacks: ((alert: HealthStatus['alerts'][0]) => void)[] = [];

  // Component management
  addComponent(component: EquipmentComponent): void {
    this.components.set(component.id, component);
    this.healthHistory.set(component.id, []);
    this.maintenanceRecords.set(component.id, []);
    
    // Establish baseline if not exists
    if (!this.performanceBaselines.has(component.id)) {
      this.establishBaseline(component.id);
    }
  }

  removeComponent(componentId: string): void {
    this.components.delete(componentId);
    this.healthHistory.delete(componentId);
    this.maintenanceRecords.delete(componentId);
    this.performanceBaselines.delete(componentId);
  }

  getComponent(componentId: string): EquipmentComponent | undefined {
    return this.components.get(componentId);
  }

  getAllComponents(): EquipmentComponent[] {
    return Array.from(this.components.values());
  }

  // Health monitoring
  async updateComponentHealth(componentId: string, metrics: EquipmentMetrics): Promise<HealthStatus> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    const healthStatus = this.analyzeHealth(component, metrics);
    
    // Store in history
    const history = this.healthHistory.get(componentId) || [];
    history.push(healthStatus);
    
    // Keep last 1000 records
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    
    this.healthHistory.set(componentId, history);

    // Check for alerts
    for (const alert of healthStatus.alerts) {
      if (!alert.acknowledged) {
        this.triggerAlert(alert);
      }
    }

    return healthStatus;
  }

  private analyzeHealth(component: EquipmentComponent, metrics: EquipmentMetrics): HealthStatus {
    let score = 100;
    const alerts: HealthStatus['alerts'] = [];
    const trends = this.calculateTrends(component.id, metrics);
    
    // Temperature analysis
    if (metrics.temperature < component.criticalTemperatureRange.min || 
        metrics.temperature > component.criticalTemperatureRange.max) {
      score -= 30;
      alerts.push({
        type: 'temperature',
        severity: 'critical',
        message: `Temperature ${metrics.temperature.toFixed(1)}°C outside critical range`,
        timestamp: new Date(),
        acknowledged: false
      });
    } else if (metrics.temperature < component.optimalTemperatureRange.min || 
               metrics.temperature > component.optimalTemperatureRange.max) {
      score -= 15;
      alerts.push({
        type: 'temperature',
        severity: 'warning',
        message: `Temperature ${metrics.temperature.toFixed(1)}°C outside optimal range`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Power analysis
    const expectedPower = component.specifications.powerConsumption || 50;
    const powerDeviation = Math.abs(metrics.power - expectedPower) / expectedPower;
    if (powerDeviation > 0.3) {
      score -= 20;
      alerts.push({
        type: 'power',
        severity: 'warning',
        message: `Power consumption ${metrics.power.toFixed(1)}W deviates significantly from expected ${expectedPower}W`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Accuracy analysis
    const expectedAccuracy = component.specifications.accuracy || 5;
    if (metrics.accuracy > expectedAccuracy * 2) {
      score -= 25;
      alerts.push({
        type: 'accuracy',
        severity: 'critical',
        message: `Accuracy degraded to ${metrics.accuracy.toFixed(2)}" (expected: ${expectedAccuracy}")`,
        timestamp: new Date(),
        acknowledged: false
      });
    } else if (metrics.accuracy > expectedAccuracy * 1.5) {
      score -= 10;
      alerts.push({
        type: 'accuracy',
        severity: 'warning',
        message: `Accuracy slightly degraded: ${metrics.accuracy.toFixed(2)}"`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Response time analysis
    if (metrics.responseTime > 5000) { // 5 seconds
      score -= 15;
      alerts.push({
        type: 'error',
        severity: 'warning',
        message: `Slow response time: ${metrics.responseTime}ms`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Error count analysis
    if (metrics.errorCount > 10) {
      score -= 20;
      alerts.push({
        type: 'error',
        severity: 'warning',
        message: `High error count: ${metrics.errorCount} errors`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Maintenance due check
    const maintenanceRecords = this.maintenanceRecords.get(component.id) || [];
    const lastMaintenance = maintenanceRecords
      .filter(r => r.type === 'routine' || r.type === 'preventive')
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    
    if (lastMaintenance) {
      const daysSinceMaintenance = (Date.now() - lastMaintenance.date.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceMaintenance > component.maintenanceInterval) {
        score -= 10;
        alerts.push({
          type: 'maintenance',
          severity: 'info',
          message: `Maintenance overdue by ${Math.floor(daysSinceMaintenance - component.maintenanceInterval)} days`,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    }

    // Determine overall status
    let overall: HealthStatus['overall'];
    if (score >= 90) overall = 'excellent';
    else if (score >= 75) overall = 'good';
    else if (score >= 50) overall = 'warning';
    else if (score >= 25) overall = 'critical';
    else overall = 'offline';

    // Calculate predictions
    const predictions = this.calculatePredictions(component, metrics, trends);
    
    // Calculate performance metrics
    const performance = this.calculatePerformance(component.id, metrics);

    return {
      component,
      overall,
      score: Math.max(0, Math.min(100, score)),
      metrics,
      trends,
      alerts,
      predictions,
      performance
    };
  }

  private calculateTrends(componentId: string, currentMetrics: EquipmentMetrics): HealthStatus['trends'] {
    const history = this.healthHistory.get(componentId) || [];
    if (history.length < 5) {
      return {
        temperature: 'stable',
        power: 'stable',
        accuracy: 'stable',
        responseTime: 'stable'
      };
    }

    const recent = history.slice(-5);
    const temperatures = recent.map(h => h.metrics.temperature);
    const powers = recent.map(h => h.metrics.power);
    const accuracies = recent.map(h => h.metrics.accuracy);
    const responseTimes = recent.map(h => h.metrics.responseTime);

    return {
      temperature: this.analyzeTrend(temperatures, currentMetrics.temperature),
      power: this.analyzeTrend(powers, currentMetrics.power),
      accuracy: this.analyzeTrend(accuracies, currentMetrics.accuracy, true), // Lower is better
      responseTime: this.analyzeTrend(responseTimes, currentMetrics.responseTime, true) // Lower is better
    };
  }

  private analyzeTrend(values: number[], current: number, lowerIsBetter = false): 'stable' | 'improving' | 'degrading' | 'rising' | 'falling' | 'fluctuating' {
    if (values.length < 3) return 'stable';

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Check for high fluctuation
    if (stdDev > avg * 0.2) return 'fluctuating';
    
    // Calculate trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (Math.abs(change) < 0.05) return 'stable';
    
    if (lowerIsBetter) {
      return change < 0 ? 'improving' : 'degrading';
    } else {
      if (change > 0) return 'rising';
      else return 'falling';
    }
  }

  private calculatePredictions(
    component: EquipmentComponent, 
    metrics: EquipmentMetrics, 
    trends: HealthStatus['trends']
  ): HealthStatus['predictions'] {
    const now = new Date();
    
    // Next maintenance prediction
    const maintenanceRecords = this.maintenanceRecords.get(component.id) || [];
    const lastMaintenance = maintenanceRecords
      .filter(r => r.type === 'routine' || r.type === 'preventive')
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    
    const nextMaintenance = new Date(
      (lastMaintenance?.date.getTime() || component.installDate.getTime()) + 
      component.maintenanceInterval * 24 * 60 * 60 * 1000
    );

    // Next calibration prediction
    const lastCalibration = maintenanceRecords
      .filter(r => r.type === 'calibration')
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    
    const nextCalibration = new Date(
      (lastCalibration?.date.getTime() || component.installDate.getTime()) + 
      component.calibrationInterval * 24 * 60 * 60 * 1000
    );

    // Estimated life remaining
    const totalOperatingTime = metrics.operatingTime;
    const lifeRemaining = Math.max(0, component.expectedLifetime - totalOperatingTime);

    // Failure risk assessment
    let failureRisk: 'low' | 'medium' | 'high' = 'low';
    if (trends.accuracy === 'degrading' || trends.responseTime === 'degrading') {
      failureRisk = 'medium';
    }
    if (metrics.errorCount > 20 || trends.temperature === 'fluctuating') {
      failureRisk = 'high';
    }

    // Recommended actions
    const recommendedActions: string[] = [];
    if (nextMaintenance < now) {
      recommendedActions.push('Schedule routine maintenance');
    }
    if (nextCalibration < now) {
      recommendedActions.push('Perform calibration');
    }
    if (trends.accuracy === 'degrading') {
      recommendedActions.push('Check mechanical alignment');
    }
    if (trends.temperature === 'rising') {
      recommendedActions.push('Improve cooling or ventilation');
    }
    if (failureRisk === 'high') {
      recommendedActions.push('Consider component replacement');
    }

    return {
      nextMaintenance,
      nextCalibration,
      estimatedLifeRemaining: lifeRemaining,
      failureRisk,
      recommendedActions
    };
  }

  private calculatePerformance(componentId: string, metrics: EquipmentMetrics): HealthStatus['performance'] {
    const history = this.healthHistory.get(componentId) || [];
    
    if (history.length === 0) {
      return {
        uptime: 100,
        reliability: 100,
        efficiency: 100,
        mtbf: 1000
      };
    }

    // Calculate uptime (percentage of time component was operational)
    const totalReadings = history.length;
    const operationalReadings = history.filter(h => h.overall !== 'offline').length;
    const uptime = (operationalReadings / totalReadings) * 100;

    // Calculate reliability (percentage of time without critical alerts)
    const reliableReadings = history.filter(h => 
      !h.alerts.some(alert => alert.severity === 'critical')
    ).length;
    const reliability = (reliableReadings / totalReadings) * 100;

    // Calculate efficiency (based on performance vs specifications)
    const efficiencyScores = history.map(h => h.score);
    const efficiency = efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length;

    // Calculate MTBF (Mean Time Between Failures)
    const failures = history.filter(h => h.overall === 'critical' || h.overall === 'offline');
    const mtbf = failures.length > 0 ? (totalReadings * 24) / failures.length : 1000; // Hours

    return {
      uptime: Math.round(uptime * 100) / 100,
      reliability: Math.round(reliability * 100) / 100,
      efficiency: Math.round(efficiency * 100) / 100,
      mtbf: Math.round(mtbf)
    };
  }

  private establishBaseline(componentId: string): void {
    // Generate baseline metrics for simulation
    const component = this.components.get(componentId);
    if (!component) return;

    const baselineMetrics: EquipmentMetrics = {
      timestamp: new Date(),
      temperature: 20 + Math.random() * 10,
      humidity: 50 + Math.random() * 20,
      voltage: 12 + Math.random() * 0.5,
      current: 2 + Math.random() * 1,
      power: component.specifications.powerConsumption || 50,
      vibration: Math.random() * 5,
      operatingTime: 0,
      cycleCount: 0,
      errorCount: 0,
      responseTime: 100 + Math.random() * 200,
      accuracy: component.specifications.accuracy || 2,
      backlash: Math.random() * 5,
      thermalDrift: Math.random() * 0.1
    };

    const baseline: PerformanceBaseline = {
      componentId,
      establishedDate: new Date(),
      baselineMetrics,
      tolerances: {
        temperature: 5,
        accuracy: 1,
        responseTime: 500,
        power: 10
      },
      updateInterval: 30, // 30 days
      lastUpdate: new Date()
    };

    this.performanceBaselines.set(componentId, baseline);
  }

  // Maintenance management
  addMaintenanceRecord(record: MaintenanceRecord): void {
    const records = this.maintenanceRecords.get(record.componentId) || [];
    records.push(record);
    records.sort((a, b) => b.date.getTime() - a.date.getTime());
    this.maintenanceRecords.set(record.componentId, records);
  }

  getMaintenanceHistory(componentId: string): MaintenanceRecord[] {
    return this.maintenanceRecords.get(componentId) || [];
  }

  getUpcomingMaintenance(): { component: EquipmentComponent; dueDate: Date; type: string }[] {
    const upcoming: { component: EquipmentComponent; dueDate: Date; type: string }[] = [];
    
    for (const component of this.components.values()) {
      const records = this.maintenanceRecords.get(component.id) || [];
      
      // Check routine maintenance
      const lastRoutine = records
        .filter(r => r.type === 'routine' || r.type === 'preventive')
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      
      if (lastRoutine) {
        const nextRoutine = new Date(lastRoutine.date.getTime() + component.maintenanceInterval * 24 * 60 * 60 * 1000);
        if (nextRoutine > new Date()) {
          upcoming.push({ component, dueDate: nextRoutine, type: 'routine' });
        }
      }

      // Check calibration
      const lastCalibration = records
        .filter(r => r.type === 'calibration')
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      
      if (lastCalibration) {
        const nextCalibration = new Date(lastCalibration.date.getTime() + component.calibrationInterval * 24 * 60 * 60 * 1000);
        if (nextCalibration > new Date()) {
          upcoming.push({ component, dueDate: nextCalibration, type: 'calibration' });
        }
      }
    }

    return upcoming.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  // Alert management
  onAlert(callback: (alert: HealthStatus['alerts'][0]) => void): void {
    this.alertCallbacks.push(callback);
  }

  private triggerAlert(alert: HealthStatus['alerts'][0]): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        console.error('Alert callback error:', error);
      }
    }
  }

  acknowledgeAlert(componentId: string, alertTimestamp: Date): void {
    const history = this.healthHistory.get(componentId);
    if (!history) return;

    for (const healthStatus of history) {
      for (const alert of healthStatus.alerts) {
        if (alert.timestamp.getTime() === alertTimestamp.getTime()) {
          alert.acknowledged = true;
          break;
        }
      }
    }
  }

  // Simulation methods for testing
  simulateMetrics(componentId: string): EquipmentMetrics {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    const baseline = this.performanceBaselines.get(componentId);
    const baseMetrics = baseline?.baselineMetrics || {
      temperature: 25,
      humidity: 60,
      voltage: 12,
      current: 2,
      power: 50,
      vibration: 2,
      operatingTime: 100,
      cycleCount: 1000,
      errorCount: 0,
      responseTime: 200,
      accuracy: 2,
      backlash: 2,
      thermalDrift: 0.05
    };

    // Add some realistic variation
    return {
      timestamp: new Date(),
      temperature: baseMetrics.temperature + (Math.random() - 0.5) * 10,
      humidity: Math.max(0, Math.min(100, baseMetrics.humidity + (Math.random() - 0.5) * 20)),
      voltage: baseMetrics.voltage + (Math.random() - 0.5) * 1,
      current: Math.max(0, baseMetrics.current + (Math.random() - 0.5) * 0.5),
      power: Math.max(0, baseMetrics.power + (Math.random() - 0.5) * 10),
      vibration: Math.max(0, baseMetrics.vibration + (Math.random() - 0.5) * 2),
      operatingTime: baseMetrics.operatingTime + Math.random() * 0.1,
      cycleCount: baseMetrics.cycleCount + Math.floor(Math.random() * 5),
      errorCount: Math.max(0, baseMetrics.errorCount + (Math.random() < 0.1 ? 1 : 0)),
      responseTime: Math.max(50, baseMetrics.responseTime + (Math.random() - 0.5) * 100),
      accuracy: Math.max(0.1, baseMetrics.accuracy + (Math.random() - 0.5) * 1),
      backlash: Math.max(0, baseMetrics.backlash + (Math.random() - 0.5) * 1),
      thermalDrift: baseMetrics.thermalDrift + (Math.random() - 0.5) * 0.02
    };
  }

  // System health overview
  getSystemHealthOverview(): {
    totalComponents: number;
    healthyComponents: number;
    warningComponents: number;
    criticalComponents: number;
    offlineComponents: number;
    overallScore: number;
    activeAlerts: number;
    upcomingMaintenance: number;
  } {
    const allComponents = Array.from(this.components.values());
    const latestHealth = allComponents.map(component => {
      const history = this.healthHistory.get(component.id) || [];
      return history[history.length - 1];
    }).filter(Boolean);

    const healthyComponents = latestHealth.filter(h => h.overall === 'excellent' || h.overall === 'good').length;
    const warningComponents = latestHealth.filter(h => h.overall === 'warning').length;
    const criticalComponents = latestHealth.filter(h => h.overall === 'critical').length;
    const offlineComponents = latestHealth.filter(h => h.overall === 'offline').length;

    const overallScore = latestHealth.length > 0 
      ? latestHealth.reduce((sum, h) => sum + h.score, 0) / latestHealth.length 
      : 100;

    const activeAlerts = latestHealth.reduce((sum, h) => 
      sum + h.alerts.filter(alert => !alert.acknowledged).length, 0
    );

    const upcomingMaintenance = this.getUpcomingMaintenance().length;

    return {
      totalComponents: allComponents.length,
      healthyComponents,
      warningComponents,
      criticalComponents,
      offlineComponents,
      overallScore: Math.round(overallScore),
      activeAlerts,
      upcomingMaintenance
    };
  }
}

// Export singleton instance
export const equipmentHealthMonitor = new EquipmentHealthMonitor();
export default EquipmentHealthMonitor;
