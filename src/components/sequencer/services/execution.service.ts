import {
  Sequence,
  SequenceStep,
  SequenceStepType,
  CaptureSettings,
  FilterSettings,
  FocusSettings,
  SlewSettings,
  WaitSettings,
  // StepStatus // Unused for now
} from '../types/sequencer.types';
import { notificationService } from './notification.service';
import { simulationEngine } from '@/lib/simulation-engine';

export interface ExecutionContext {
  sequence: Sequence;
  currentStepIndex: number;
  isRunning: boolean;
  isPaused: boolean;
  abortSignal: AbortSignal;
  onStepStart: (step: SequenceStep) => void;
  onStepProgress: (stepId: string, progress: number) => void;
  onStepComplete: (stepId: string, success: boolean, error?: string) => void;
  onSequenceComplete: (success: boolean) => void;
  onLog: (message: string, level: 'info' | 'warn' | 'error') => void;
}

export class SequenceExecutionService {
  private executionContext: ExecutionContext | null = null;
  private currentStepController: AbortController | null = null;

  async executeSequence(context: ExecutionContext): Promise<void> {
    this.executionContext = context;
    
    try {
      context.onLog('Starting sequence execution', 'info');
      notificationService.sequenceStarted(context.sequence.name, context.sequence.id);
      
      for (let i = context.currentStepIndex; i < context.sequence.steps.length; i++) {
        if (context.abortSignal.aborted) {
          context.onLog('Sequence execution aborted', 'warn');
          return;
        }

        // Wait if paused
        while (context.isPaused && !context.abortSignal.aborted) {
          await this.sleep(100);
        }

        if (context.abortSignal.aborted) {
          return;
        }

        const step = context.sequence.steps[i];
        
        if (!step.enabled) {
          context.onLog(`Skipping disabled step: ${step.name}`, 'info');
          context.onStepComplete(step.id, true);
          continue;
        }

        try {
          context.onStepStart(step);
          context.onLog(`Starting step: ${step.name}`, 'info');
          
          await this.executeStep(step, context);
          
          context.onStepComplete(step.id, true);
          context.onLog(`Completed step: ${step.name}`, 'info');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          context.onLog(`Step failed: ${step.name} - ${errorMessage}`, 'error');
          
          // Handle retry logic
          const retryCount = step.retryCount || 0;
          const maxRetries = step.maxRetries || 0;
          
          if (retryCount < maxRetries) {
            context.onLog(`Retrying step: ${step.name} (attempt ${retryCount + 1}/${maxRetries})`, 'warn');
            step.retryCount = retryCount + 1;
            i--; // Retry the same step
            continue;
          }
          
          context.onStepComplete(step.id, false, errorMessage);
          
          // Check if we should continue or abort
          if (this.shouldAbortOnError(step)) {
            throw new Error(`Critical step failed: ${step.name}`);
          }
        }
      }
      
      context.onSequenceComplete(true);
      context.onLog('Sequence completed successfully', 'info');

      const duration = context.sequence.startTime
        ? Math.floor((Date.now() - context.sequence.startTime.getTime()) / 1000)
        : 0;
      notificationService.sequenceCompleted(context.sequence.name, context.sequence.id, duration);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      context.onSequenceComplete(false);
      context.onLog(`Sequence failed: ${errorMessage}`, 'error');
      notificationService.sequenceFailed(context.sequence.name, context.sequence.id, errorMessage);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  async executeStep(step: SequenceStep, context: ExecutionContext): Promise<void> {
    this.currentStepController = new AbortController();
    
    // Combine abort signals
    const combinedSignal = this.combineAbortSignals([
      context.abortSignal,
      this.currentStepController.signal
    ]);

    switch (step.type) {
      case 'capture':
        await this.executeCaptureStep(step, context, combinedSignal);
        break;
      case 'filter':
        await this.executeFilterStep(step, context, combinedSignal);
        break;
      case 'focus':
        await this.executeFocusStep(step, context, combinedSignal);
        break;
      case 'slew':
        await this.executeSlewStep(step, context, combinedSignal);
        break;
      case 'wait':
        await this.executeWaitStep(step, context, combinedSignal);
        break;
      default:
        throw new Error(`Unsupported step type: ${step.type}`);
    }
  }

  private async executeCaptureStep(
    step: SequenceStep,
    context: ExecutionContext,
    abortSignal: AbortSignal
  ): Promise<void> {
    const settings = step.settings as CaptureSettings;

    context.onLog(`Capturing ${settings.count} frames at ${settings.exposure}s exposure`, 'info');

    for (let i = 0; i < settings.count; i++) {
      if (abortSignal.aborted) {
        throw new Error('Capture aborted');
      }

      context.onLog(`Capturing frame ${i + 1}/${settings.count} (${settings.exposure}s)`, 'info');

      // Use enhanced simulation engine for realistic capture
      const captureResult = await simulationEngine.simulateCapture(
        settings.exposure,
        (progress) => {
          const totalProgress = ((i + progress / 100) / settings.count) * 100;
          context.onStepProgress(step.id, totalProgress);
        },
        abortSignal
      );

      if (!captureResult.success) {
        throw new Error(captureResult.error || 'Capture failed');
      }

      // Log capture quality metrics if available
      if (captureResult.metadata) {
        const { fwhm, snr, temperature } = captureResult.metadata;
        context.onLog(`Frame ${i + 1} completed - FWHM: ${(fwhm as number).toFixed(2)}", SNR: ${(snr as number).toFixed(1)}, Temp: ${(temperature as number).toFixed(1)}°C`, 'info');
      }

      // Apply dithering if enabled
      if (settings.dither && i < settings.count - 1) {
        context.onLog('Applying dither offset', 'info');
        await this.simulateDithering(abortSignal, context);
      }
    }
  }

  private async executeFilterStep(
    step: SequenceStep, 
    context: ExecutionContext, 
    abortSignal: AbortSignal
  ): Promise<void> {
    const settings = step.settings as FilterSettings;
    
    context.onLog(`Changing to filter position ${settings.position}`, 'info');
    
    // Simulate filter wheel movement
    await this.sleep(3000, abortSignal);
    context.onStepProgress(step.id, 50);
    
    // Wait for filter to settle
    const waitTime = (settings.waitTime || 5) * 1000;
    await this.sleep(waitTime, abortSignal);
    context.onStepProgress(step.id, 100);
  }

  private async executeFocusStep(
    step: SequenceStep, 
    context: ExecutionContext, 
    abortSignal: AbortSignal
  ): Promise<void> {
    const settings = step.settings as FocusSettings;
    
    if (settings.type === 'auto') {
      context.onLog('Starting auto focus routine', 'info');

      // Simulate auto focus process with realistic behavior
      const maxAttempts = settings.maxAttempts || 5;
      let bestPosition = 15000;
      let bestHFR = 3.5;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (abortSignal.aborted) {
          throw new Error('Auto focus aborted');
        }

        const testPosition = bestPosition + (attempt - 3) * 200; // Test positions around center
        context.onLog(`Auto focus step ${attempt}/${maxAttempts} - Testing position ${testPosition}`, 'info');

        // Simulate focuser move (simplified)
        await new Promise(resolve => setTimeout(resolve, 1000));
        const moveResult = { success: true, error: null as string | null };

        if (!moveResult.success) {
          throw new Error(moveResult.error || 'Focuser move failed during auto focus');
        }

        // Take test image and measure HFR
        await this.sleep(3000, abortSignal); // Image capture
        const measuredHFR = this.simulateHFRMeasurement(testPosition, bestPosition);

        context.onLog(`Position ${testPosition}: HFR = ${measuredHFR.toFixed(2)}"`, 'info');

        if (measuredHFR < bestHFR) {
          bestHFR = measuredHFR;
          bestPosition = testPosition;
        }

        const progress = (attempt / maxAttempts) * 100;
        context.onStepProgress(step.id, progress);
      }

      // Move to best position
      context.onLog(`Moving to best focus position: ${bestPosition} (HFR: ${bestHFR.toFixed(2)}")`, 'info');
      // Simulate focuser move to best position
      await new Promise(resolve => setTimeout(resolve, 2000));

      context.onLog(`Auto focus completed - Final HFR: ${bestHFR.toFixed(2)}"`, 'info');
    } else {
      context.onLog(`Moving focuser to position ${settings.position}`, 'info');

      // Simulate focuser movement with progress
      const targetPosition = settings.position || 15000;
      for (let i = 0; i <= 100; i += 10) {
        context.onStepProgress(step.id, i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      context.onLog(`Focuser moved to position ${targetPosition}`, 'info');
    }
  }

  private async executeSlewStep(
    step: SequenceStep,
    context: ExecutionContext,
    abortSignal: AbortSignal
  ): Promise<void> {
    const settings = step.settings as SlewSettings;

    context.onLog(`Slewing to RA: ${settings.ra}, Dec: ${settings.dec}`, 'info');

    // Use enhanced simulation for realistic slewing
    const slewResult = await simulationEngine.simulateSlew(
      0, 0, // Current position (would be from mount status in real implementation)
      parseFloat(settings.ra), parseFloat(settings.dec),
      (progress) => {
        context.onStepProgress(step.id, progress * 0.6); // 60% for slew
      },
      abortSignal
    );

    if (!slewResult.success) {
      throw new Error(slewResult.error || 'Slew failed');
    }

    context.onLog(`Slew completed - Final position: RA: ${slewResult.finalRA?.toFixed(4)}, Dec: ${slewResult.finalDec?.toFixed(4)}`, 'info');

    if (settings.platesolve) {
      context.onLog('Performing plate solve', 'info');
      await this.simulatePlateSolve(abortSignal, context);
      context.onStepProgress(step.id, 85);
    }

    if (settings.centerTarget) {
      context.onLog('Centering target', 'info');
      await this.simulateCentering(abortSignal, context);
    }

    context.onStepProgress(step.id, 100);
  }

  private async executeWaitStep(
    step: SequenceStep, 
    context: ExecutionContext, 
    abortSignal: AbortSignal
  ): Promise<void> {
    const settings = step.settings as WaitSettings;
    
    context.onLog(`Waiting for ${settings.duration} seconds${settings.reason ? ` - ${settings.reason}` : ''}`, 'info');
    
    await this.sleep(settings.duration * 1000, abortSignal, (elapsed, total) => {
      context.onStepProgress(step.id, (elapsed / total) * 100);
    });
  }

  private async simulateDithering(
    abortSignal: AbortSignal,
    context: ExecutionContext
  ): Promise<void> {
    // Simulate dither command
    await this.sleep(1000, abortSignal);
    context.onLog('Dither command sent', 'info');

    // Simulate settling time with realistic variations
    const settleTime = 3000 + Math.random() * 2000; // 3-5 seconds
    await this.sleep(settleTime, abortSignal);
    context.onLog('Dither settling completed', 'info');
  }

  private async simulatePlateSolve(
    abortSignal: AbortSignal,
    context: ExecutionContext
  ): Promise<void> {
    context.onLog('Taking plate solve image', 'info');
    await this.sleep(5000, abortSignal); // Image capture

    context.onLog('Analyzing star field', 'info');
    await this.sleep(8000, abortSignal); // Analysis time

    // Simulate success/failure
    if (Math.random() < 0.9) { // 90% success rate
      const accuracy = 2 + Math.random() * 3; // 2-5 arcseconds
      context.onLog(`Plate solve successful - Accuracy: ${accuracy.toFixed(1)}"`, 'info');
    } else {
      throw new Error('Plate solve failed - insufficient stars detected');
    }
  }

  private async simulateCentering(
    abortSignal: AbortSignal,
    context: ExecutionContext
  ): Promise<void> {
    const iterations = 2 + Math.floor(Math.random() * 2); // 2-3 iterations

    for (let i = 1; i <= iterations; i++) {
      context.onLog(`Centering iteration ${i}/${iterations}`, 'info');
      await this.sleep(3000, abortSignal);

      if (i === iterations) {
        const finalError = Math.random() * 5; // 0-5 arcseconds
        context.onLog(`Centering completed - Final error: ${finalError.toFixed(1)}"`, 'info');
      }
    }
  }

  private simulateHFRMeasurement(testPosition: number, bestPosition: number): number {
    // Simulate realistic HFR measurement based on focus position
    const distanceFromBest = Math.abs(testPosition - bestPosition);
    const baseHFR = 2.0; // Best possible HFR
    const defocusEffect = Math.pow(distanceFromBest / 500, 2) * 0.5; // Quadratic defocus
    const noise = (Math.random() - 0.5) * 0.3; // Measurement noise

    return Math.max(1.5, baseHFR + defocusEffect + noise);
  }

  private async sleep(ms: number, abortSignal?: AbortSignal, onProgress?: (elapsed: number, total: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let intervalId: NodeJS.Timeout | undefined;

      const timeoutId = setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
        resolve();
      }, ms);

      const cleanup = () => {
        clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
      };

      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          cleanup();
          reject(new Error('Operation aborted'));
        });
      }

      if (onProgress) {
        intervalId = setInterval(() => {
          const elapsed = Date.now() - startTime;
          onProgress(elapsed, ms);
        }, 100);
      }
    });
  }

  private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }
      
      signal.addEventListener('abort', () => {
        controller.abort();
      });
    }
    
    return controller.signal;
  }

  private shouldAbortOnError(step: SequenceStep): boolean {
    // Critical steps that should abort the sequence on failure
    const criticalStepTypes: SequenceStepType[] = ['slew'];

    if (criticalStepTypes.includes(step.type)) {
      return true;
    }

    // Check step-specific abort conditions
    if (step.onFailure) {
      return step.onFailure.some(action => action.type === 'abort');
    }

    // For focus failures, only abort after max retries
    if (step.type === 'focus' && (step.retryCount || 0) >= (step.maxRetries || 3)) {
      return true;
    }

    return false;
  }

  stopCurrentStep(): void {
    if (this.currentStepController) {
      this.currentStepController.abort();
    }
  }

  private cleanup(): void {
    this.currentStepController = null;
    this.executionContext = null;
  }
}

export const executionService = new SequenceExecutionService();
