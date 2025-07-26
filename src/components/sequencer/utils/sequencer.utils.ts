import { 
  Sequence, 
  SequenceStep, 
  SequenceStepType, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  CaptureSettings,
  FilterSettings,
  FocusSettings,
  SlewSettings,
  WaitSettings,
  StepSettings
} from '../types/sequencer.types';

// ID generation
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Time formatting utilities
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString();
}

// Duration calculations
export function calculateSequenceDuration(steps: SequenceStep[]): number {
  return steps.reduce((total, step) => total + step.duration, 0);
}

export function calculateRemainingTime(steps: SequenceStep[], currentStepIndex: number): number {
  return steps
    .slice(currentStepIndex)
    .reduce((total, step) => total + step.duration, 0);
}

export function calculateProgress(steps: SequenceStep[], currentStepIndex: number, currentStepProgress: number = 0): number {
  const totalDuration = calculateSequenceDuration(steps);
  if (totalDuration === 0) return 0;
  
  const completedDuration = steps
    .slice(0, currentStepIndex)
    .reduce((total, step) => total + step.duration, 0);
  
  const currentStepDuration = steps[currentStepIndex]?.duration || 0;
  const currentProgress = (currentStepDuration * currentStepProgress) / 100;
  
  return ((completedDuration + currentProgress) / totalDuration) * 100;
}

// Step type utilities
export function getStepTypeIcon(type: SequenceStepType): string {
  const iconMap: Record<SequenceStepType, string> = {
    capture: '📷',
    filter: '🔍',
    focus: '🎯',
    slew: '🧭',
    wait: '⏱️',
    calibration: '⚖️',
    dither: '🔀',
    meridian_flip: '🔄',
    condition: '❓',
    loop: '🔁',
  };
  return iconMap[type] || '❓';
}

export function getStepTypeColor(type: SequenceStepType): string {
  const colorMap: Record<SequenceStepType, string> = {
    capture: 'bg-blue-500',
    filter: 'bg-purple-500',
    focus: 'bg-green-500',
    slew: 'bg-orange-500',
    wait: 'bg-gray-500',
    calibration: 'bg-yellow-500',
    dither: 'bg-indigo-500',
    meridian_flip: 'bg-red-500',
    condition: 'bg-pink-500',
    loop: 'bg-cyan-500',
  };
  return colorMap[type] || 'bg-gray-500';
}

export function getStepTypeName(type: SequenceStepType): string {
  const nameMap: Record<SequenceStepType, string> = {
    capture: 'Capture',
    filter: 'Filter Change',
    focus: 'Focus',
    slew: 'Slew',
    wait: 'Wait',
    calibration: 'Calibration',
    dither: 'Dither',
    meridian_flip: 'Meridian Flip',
    condition: 'Condition',
    loop: 'Loop',
  };
  return nameMap[type] || 'Unknown';
}

// Step description utilities
export function getStepDescription(step: SequenceStep): string {
  switch (step.type) {
    case 'capture': {
      const settings = step.settings as CaptureSettings;
      return `${settings.count} × ${settings.exposure}s (${settings.binning})`;
    }
    case 'filter': {
      const settings = step.settings as FilterSettings;
      return `Position ${settings.position}${settings.name ? ` (${settings.name})` : ''}`;
    }
    case 'focus': {
      const settings = step.settings as FocusSettings;
      return settings.type === 'auto' ? 'Auto focus routine' : `Manual focus to ${settings.position}`;
    }
    case 'slew': {
      const settings = step.settings as SlewSettings;
      return `${settings.ra}, ${settings.dec}${settings.targetName ? ` (${settings.targetName})` : ''}`;
    }
    case 'wait': {
      const settings = step.settings as WaitSettings;
      return `Wait ${formatDuration(settings.duration)}${settings.reason ? ` - ${settings.reason}` : ''}`;
    }
    default:
      return step.description || 'No description';
  }
}

// Validation utilities
export function validateSequence(sequence: Sequence): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Basic sequence validation
  if (!sequence.name.trim()) {
    errors.push({
      field: 'name',
      message: 'Sequence name is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (sequence.steps.length === 0) {
    errors.push({
      field: 'steps',
      message: 'Sequence must have at least one step',
      code: 'EMPTY_SEQUENCE',
    });
  }
  
  // Step validation
  sequence.steps.forEach((step, index) => {
    const stepErrors = validateStep(step);
    errors.push(...stepErrors.errors.map(err => ({
      ...err,
      field: `steps[${index}].${err.field}`,
    })));
    warnings.push(...stepErrors.warnings.map(warn => ({
      ...warn,
      field: `steps[${index}].${warn.field}`,
    })));
  });
  
  // Sequence-level warnings
  const totalDuration = calculateSequenceDuration(sequence.steps);
  if (totalDuration > 8 * 3600) { // 8 hours
    warnings.push({
      field: 'duration',
      message: 'Sequence duration exceeds 8 hours',
      code: 'LONG_SEQUENCE',
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateStep(step: SequenceStep): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Basic step validation
  if (!step.name.trim()) {
    errors.push({
      field: 'name',
      message: 'Step name is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (step.duration <= 0) {
    errors.push({
      field: 'duration',
      message: 'Step duration must be positive',
      code: 'INVALID_DURATION',
    });
  }
  
  // Type-specific validation
  switch (step.type) {
    case 'capture':
      validateCaptureSettings(step.settings as CaptureSettings, errors, warnings);
      break;
    case 'filter':
      validateFilterSettings(step.settings as FilterSettings, errors);
      break;
    case 'focus':
      validateFocusSettings(step.settings as FocusSettings, errors, warnings);
      break;
    case 'slew':
      validateSlewSettings(step.settings as SlewSettings, errors);
      break;
    case 'wait':
      validateWaitSettings(step.settings as WaitSettings, errors, warnings);
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateCaptureSettings(settings: CaptureSettings, errors: ValidationError[], warnings: ValidationWarning[]) {
  if (settings.exposure <= 0) {
    errors.push({
      field: 'settings.exposure',
      message: 'Exposure time must be positive',
      code: 'INVALID_EXPOSURE',
    });
  }
  
  if (settings.count <= 0) {
    errors.push({
      field: 'settings.count',
      message: 'Frame count must be positive',
      code: 'INVALID_COUNT',
    });
  }
  
  if (settings.exposure > 600) { // 10 minutes
    warnings.push({
      field: 'settings.exposure',
      message: 'Long exposure time may cause tracking issues',
      code: 'LONG_EXPOSURE',
    });
  }
  
  if (settings.count > 100) {
    warnings.push({
      field: 'settings.count',
      message: 'Large number of frames may take a long time',
      code: 'MANY_FRAMES',
    });
  }
}

function validateFilterSettings(settings: FilterSettings, errors: ValidationError[]) {
  if (settings.position < 1 || settings.position > 8) {
    errors.push({
      field: 'settings.position',
      message: 'Filter position must be between 1 and 8',
      code: 'INVALID_POSITION',
    });
  }
}

function validateFocusSettings(settings: FocusSettings, errors: ValidationError[], warnings: ValidationWarning[]) {
  if (settings.type === 'manual' && (settings.position === undefined || settings.position < 0)) {
    errors.push({
      field: 'settings.position',
      message: 'Manual focus requires a valid position',
      code: 'INVALID_POSITION',
    });
  }
  
  if (settings.maxAttempts && settings.maxAttempts > 10) {
    warnings.push({
      field: 'settings.maxAttempts',
      message: 'High number of focus attempts may take a long time',
      code: 'MANY_ATTEMPTS',
    });
  }
}

function validateSlewSettings(settings: SlewSettings, errors: ValidationError[]) {
  // Basic RA/Dec format validation
  const raPattern = /^\d{1,2}h\s*\d{1,2}m\s*\d{1,2}(\.\d+)?s$/;
  const decPattern = /^[+-]?\d{1,2}°\s*\d{1,2}'\s*\d{1,2}(\.\d+)?"$/;

  if (!settings.ra) {
    errors.push({
      field: 'settings.ra',
      message: 'RA is required for slew operation',
      code: 'REQUIRED_FIELD',
    });
  } else if (!raPattern.test(settings.ra.replace(/\s+/g, ' ').trim())) {
    errors.push({
      field: 'settings.ra',
      message: 'Invalid RA format (expected: XXh XXm XXs)',
      code: 'INVALID_RA_FORMAT',
    });
  }

  if (!settings.dec) {
    errors.push({
      field: 'settings.dec',
      message: 'Dec is required for slew operation',
      code: 'REQUIRED_FIELD',
    });
  } else if (!decPattern.test(settings.dec.replace(/\s+/g, ' ').trim())) {
    errors.push({
      field: 'settings.dec',
      message: 'Invalid Dec format (expected: ±XX° XX\' XX")',
      code: 'INVALID_DEC_FORMAT',
    });
  }
}

function validateWaitSettings(settings: WaitSettings, errors: ValidationError[], warnings: ValidationWarning[]) {
  if (settings.duration <= 0) {
    errors.push({
      field: 'settings.duration',
      message: 'Wait duration must be positive',
      code: 'INVALID_DURATION',
    });
  }
  
  if (settings.duration > 3600) { // 1 hour
    warnings.push({
      field: 'settings.duration',
      message: 'Long wait time may not be necessary',
      code: 'LONG_WAIT',
    });
  }
}

// Coordinate conversion utilities
export function parseRA(ra: string): number {
  const match = ra.match(/(\d+)h\s*(\d+)m\s*(\d+(?:\.\d+)?)s/);
  if (!match) throw new Error('Invalid RA format');
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseFloat(match[3]);
  
  return hours + minutes / 60 + seconds / 3600;
}

export function parseDec(dec: string): number {
  const match = dec.match(/([+-]?)(\d+)°\s*(\d+)'\s*(\d+(?:\.\d+)?)"?/);
  if (!match) throw new Error('Invalid Dec format');
  
  const sign = match[1] === '-' ? -1 : 1;
  const degrees = parseInt(match[2]);
  const minutes = parseInt(match[3]);
  const seconds = parseFloat(match[4]);
  
  return sign * (degrees + minutes / 60 + seconds / 3600);
}

export function formatRA(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = ((hours - h) * 60 - m) * 60;
  
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toFixed(1).padStart(4, '0')}s`;
}

export function formatDec(degrees: number): string {
  const sign = degrees >= 0 ? '+' : '-';
  const absDegrees = Math.abs(degrees);
  const d = Math.floor(absDegrees);
  const m = Math.floor((absDegrees - d) * 60);
  const s = ((absDegrees - d) * 60 - m) * 60;
  
  return `${sign}${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}' ${s.toFixed(1).padStart(4, '0')}"`;
}

// Step template utilities
export function createStepTemplate(type: SequenceStepType): Omit<SequenceStep, 'id'> {
  const baseStep = {
    type,
    name: getStepTypeName(type),
    description: '',
    duration: 0,
    status: 'pending' as const,
    progress: 0,
    enabled: true,
    retryCount: 0,
    maxRetries: 3,
  };
  
  switch (type) {
    case 'capture':
      return {
        ...baseStep,
        name: 'Capture Frames',
        duration: 300,
        settings: {
          exposure: 300,
          count: 1,
          binning: '1x1',
          frameType: 'light',
          dither: false,
        } as CaptureSettings,
      };
      
    case 'filter':
      return {
        ...baseStep,
        name: 'Change Filter',
        duration: 10,
        settings: {
          position: 1,
          waitTime: 5,
        } as FilterSettings,
      };
      
    case 'focus':
      return {
        ...baseStep,
        name: 'Auto Focus',
        duration: 60,
        settings: {
          type: 'auto',
          tolerance: 0.5,
          maxAttempts: 5,
        } as FocusSettings,
      };
      
    case 'slew':
      return {
        ...baseStep,
        name: 'Slew to Target',
        duration: 30,
        settings: {
          ra: '00h 00m 00s',
          dec: '+00° 00\' 00"',
          platesolve: true,
          centerTarget: true,
        } as SlewSettings,
      };
      
    case 'wait':
      return {
        ...baseStep,
        name: 'Wait',
        duration: 60,
        settings: {
          duration: 60,
          reason: 'Settling time',
        } as WaitSettings,
      };
      
    default:
      return {
        ...baseStep,
        settings: {} as StepSettings,
      };
  }
}

// Search and filter utilities
export function searchSequences(sequences: Sequence[], query: string): Sequence[] {
  const lowercaseQuery = query.toLowerCase();
  
  return sequences.filter(sequence => 
    sequence.name.toLowerCase().includes(lowercaseQuery) ||
    sequence.description?.toLowerCase().includes(lowercaseQuery) ||
    sequence.target?.toLowerCase().includes(lowercaseQuery) ||
    sequence.metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function filterSequencesByCategory(sequences: Sequence[], category: string): Sequence[] {
  if (category === 'all') return sequences;
  return sequences.filter(sequence => sequence.metadata.category === category);
}

export function sortSequences(sequences: Sequence[], sortBy: 'name' | 'created' | 'modified' | 'duration'): Sequence[] {
  return [...sequences].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return b.created.getTime() - a.created.getTime();
      case 'modified':
        return b.modified.getTime() - a.modified.getTime();
      case 'duration':
        return b.estimatedDuration - a.estimatedDuration;
      default:
        return 0;
    }
  });
}
