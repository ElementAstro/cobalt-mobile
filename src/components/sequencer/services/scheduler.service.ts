import {
  ScheduleRule,
  ScheduleCondition,
  ScheduleAction,
  ScheduledSequence,
  Sequence,
  Target,
  ObservabilityData,
  SchedulingOptions,
  SchedulingResult,
  SchedulingConflict
} from '../types/sequencer.types';
import { generateId } from '../utils/sequencer.utils';
import { TargetService } from './target.service';



export class SchedulerService {
  private static rules: ScheduleRule[] = [];
  private static scheduledSequences: ScheduledSequence[] = [];

  // Rule management
  static addRule(rule: Omit<ScheduleRule, 'id' | 'created' | 'modified'>): ScheduleRule {
    const newRule: ScheduleRule = {
      ...rule,
      id: generateId(),
      created: new Date(),
      modified: new Date(),
    };
    
    this.rules.push(newRule);
    return newRule;
  }

  static updateRule(ruleId: string, updates: Partial<ScheduleRule>): void {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules[index] = {
        ...this.rules[index],
        ...updates,
        modified: new Date(),
      };
    }
  }

  static deleteRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  static getRules(): ScheduleRule[] {
    return [...this.rules];
  }

  // Condition evaluation
  static evaluateCondition(condition: ScheduleCondition, context: any): boolean {
    switch (condition.type) {
      case 'time_range':
        return this.evaluateTimeCondition(condition, context);
      case 'altitude':
        return this.evaluateAltitudeCondition(condition, context);
      case 'weather':
        return this.evaluateWeatherCondition(condition, context);
      case 'moon_phase':
        return this.evaluateMoonPhaseCondition(condition, context);
      case 'equipment_status':
        return this.evaluateEquipmentCondition(condition, context);
      default:
        return true;
    }
  }

  private static evaluateTimeCondition(condition: ScheduleCondition, context: any): boolean {
    const now = new Date();
    const { start, end } = condition.value;
    
    switch (condition.operator) {
      case 'between':
        return now >= new Date(start) && now <= new Date(end);
      case '>':
        return now > new Date(condition.value);
      case '<':
        return now < new Date(condition.value);
      default:
        return true;
    }
  }

  private static evaluateAltitudeCondition(condition: ScheduleCondition, context: any): boolean {
    const { target, location, date } = context;
    if (!target || !location) return true;

    const observability = TargetService.calculateObservability(target, {
      latitude: location.latitude,
      longitude: location.longitude,
      date: date || new Date(),
    });

    const altitude = observability.altitude || 0;
    
    switch (condition.operator) {
      case '>':
        return altitude > condition.value;
      case '<':
        return altitude < condition.value;
      case '>=':
        return altitude >= condition.value;
      case '<=':
        return altitude <= condition.value;
      default:
        return true;
    }
  }

  private static evaluateWeatherCondition(condition: ScheduleCondition, context: any): boolean {
    // This would integrate with actual weather data
    const { weather } = context;
    if (!weather) return true;

    // Simplified weather evaluation
    switch (condition.value.parameter) {
      case 'cloud_cover':
        return weather.cloudCover <= condition.value.threshold;
      case 'wind_speed':
        return weather.windSpeed <= condition.value.threshold;
      case 'humidity':
        return weather.humidity <= condition.value.threshold;
      default:
        return true;
    }
  }

  private static evaluateMoonPhaseCondition(condition: ScheduleCondition, context: any): boolean {
    const { date } = context;
    const moonPhase = this.calculateMoonPhase(date || new Date());
    
    switch (condition.operator) {
      case '<':
        return moonPhase < condition.value;
      case '>':
        return moonPhase > condition.value;
      default:
        return true;
    }
  }

  private static evaluateEquipmentCondition(condition: ScheduleCondition, context: any): boolean {
    const { equipment } = context;
    if (!equipment) return true;

    // Check equipment status
    return equipment.status === 'ready' && !equipment.errors?.length;
  }

  // Moon phase calculation (simplified)
  private static calculateMoonPhase(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Simplified moon phase calculation
    const c = Math.floor((year - 1900) / 100);
    const e = 2 * (year - 1900 - 100 * c);
    const f = Math.floor((month + 1) * 30.6);
    const jd = 365.25 * (year - 1900) + f + day - 694039.09;
    const phase = (jd / 29.5305882) % 1;
    
    return phase;
  }

  // Automatic scheduling
  static async scheduleSequences(
    sequences: Sequence[],
    targets: Target[],
    options: SchedulingOptions
  ): Promise<SchedulingResult> {
    const scheduledSequences: ScheduledSequence[] = [];
    const conflicts: SchedulingConflict[] = [];
    const warnings: string[] = [];

    // Sort sequences by priority and constraints
    const sortedSequences = this.prioritizeSequences(sequences, targets, options);

    let currentTime = new Date(options.startDate);
    const endTime = new Date(options.endDate);

    for (const sequence of sortedSequences) {
      const target = targets.find(t => t.id === sequence.target);
      if (!target) {
        warnings.push(`Target not found for sequence ${sequence.name}`);
        continue;
      }

      // Find optimal time slot
      const timeSlot = this.findOptimalTimeSlot(
        sequence,
        target,
        currentTime,
        endTime,
        options
      );

      if (timeSlot) {
        const scheduledSequence: ScheduledSequence = {
          id: generateId(),
          sequenceId: sequence.id,
          targetId: target.id,
          scheduledStart: timeSlot.start,
          scheduledEnd: timeSlot.end,
          status: 'pending',
          priority: this.calculateSequencePriority(sequence, target, options),
          rules: [],
          conditions: [],
          metadata: {
            estimatedDuration: sequence.estimatedDuration,
            weatherRequirements: options.constraints.weatherRequirements,
            equipmentRequirements: sequence.metadata.equipment || [],
          },
        };

        scheduledSequences.push(scheduledSequence);
        currentTime = timeSlot.end;
      } else {
        conflicts.push({
          type: 'target_visibility',
          sequences: [sequence.id],
          description: `No suitable time slot found for ${sequence.name}`,
          severity: 'medium',
          suggestions: ['Adjust time constraints', 'Lower altitude requirements'],
        });
      }
    }

    // Check for conflicts
    const detectedConflicts = this.detectConflicts(scheduledSequences);
    conflicts.push(...detectedConflicts);

    // Calculate statistics
    const totalTime = scheduledSequences.reduce(
      (sum, seq) => sum + seq.metadata.estimatedDuration,
      0
    );
    const availableTime = (endTime.getTime() - options.startDate.getTime()) / 1000;
    const utilizationRate = totalTime / availableTime;

    return {
      success: conflicts.filter(c => c.severity === 'high').length === 0,
      scheduledSequences,
      conflicts,
      warnings,
      statistics: {
        totalTime,
        utilizationRate,
        sequenceCount: scheduledSequences.length,
        targetCount: new Set(scheduledSequences.map(s => s.targetId)).size,
      },
    };
  }

  private static prioritizeSequences(
    sequences: Sequence[],
    targets: Target[],
    options: SchedulingOptions
  ): Sequence[] {
    return sequences.sort((a, b) => {
      const targetA = targets.find(t => t.id === a.target);
      const targetB = targets.find(t => t.id === b.target);
      
      const priorityA = this.calculateSequencePriority(a, targetA, options);
      const priorityB = this.calculateSequencePriority(b, targetB, options);
      
      return priorityB - priorityA; // Higher priority first
    });
  }

  private static calculateSequencePriority(
    sequence: Sequence,
    target: Target | undefined,
    options: SchedulingOptions
  ): number {
    let priority = 0;

    // Base priority from sequence metadata
    if (sequence.metadata.difficulty === 'beginner') priority += 10;
    if (sequence.metadata.difficulty === 'intermediate') priority += 20;
    if (sequence.metadata.difficulty === 'advanced') priority += 30;

    // Target visibility bonus
    if (target) {
      const observability = TargetService.calculateObservability(target, {
        latitude: options.location.latitude,
        longitude: options.location.longitude,
        date: options.startDate,
      });

      if (observability.altitude && observability.altitude > options.constraints.minAltitude) {
        priority += 50;
      }

      if (observability.airmass && observability.airmass < options.constraints.maxAirmass) {
        priority += 30;
      }
    }

    // Duration penalty for very long sequences
    if (sequence.estimatedDuration > 4 * 3600) { // 4 hours
      priority -= 20;
    }

    return priority;
  }

  private static findOptimalTimeSlot(
    sequence: Sequence,
    target: Target,
    startTime: Date,
    endTime: Date,
    options: SchedulingOptions
  ): { start: Date; end: Date } | null {
    const duration = sequence.estimatedDuration * 1000; // Convert to milliseconds
    let currentTime = new Date(startTime);

    while (currentTime.getTime() + duration <= endTime.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + duration);
      
      // Check target visibility during this slot
      const midTime = new Date(currentTime.getTime() + duration / 2);
      const observability = TargetService.calculateObservability(target, {
        latitude: options.location.latitude,
        longitude: options.location.longitude,
        date: midTime,
      });

      if (
        observability.altitude &&
        observability.altitude >= options.constraints.minAltitude &&
        observability.airmass &&
        observability.airmass <= options.constraints.maxAirmass
      ) {
        return { start: currentTime, end: slotEnd };
      }

      // Move to next 15-minute slot
      currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
    }

    return null;
  }

  private static detectConflicts(scheduledSequences: ScheduledSequence[]): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];

    // Check for time overlaps
    for (let i = 0; i < scheduledSequences.length; i++) {
      for (let j = i + 1; j < scheduledSequences.length; j++) {
        const seq1 = scheduledSequences[i];
        const seq2 = scheduledSequences[j];

        if (
          seq1.scheduledEnd &&
          seq2.scheduledEnd &&
          seq1.scheduledStart < seq2.scheduledEnd &&
          seq2.scheduledStart < seq1.scheduledEnd
        ) {
          conflicts.push({
            type: 'time_overlap',
            sequences: [seq1.sequenceId, seq2.sequenceId],
            description: 'Sequences have overlapping time slots',
            severity: 'high',
            suggestions: ['Adjust sequence timing', 'Reduce sequence duration'],
          });
        }
      }
    }

    return conflicts;
  }

  // Real-time scheduling
  static getNextScheduledSequence(): ScheduledSequence | null {
    const now = new Date();
    const upcoming = this.scheduledSequences
      .filter(seq => seq.status === 'pending' && seq.scheduledStart > now)
      .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());

    return upcoming[0] || null;
  }

  static updateScheduledSequenceStatus(
    sequenceId: string,
    status: ScheduledSequence['status']
  ): void {
    const sequence = this.scheduledSequences.find(s => s.id === sequenceId);
    if (sequence) {
      sequence.status = status;
      if (status === 'running') {
        sequence.actualStart = new Date();
      } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        sequence.actualEnd = new Date();
      }
    }
  }

  // Schedule optimization
  static optimizeSchedule(
    scheduledSequences: ScheduledSequence[],
    options: SchedulingOptions
  ): ScheduledSequence[] {
    // Implement genetic algorithm or other optimization technique
    // This is a simplified version
    return scheduledSequences.sort((a, b) => b.priority - a.priority);
  }
}
