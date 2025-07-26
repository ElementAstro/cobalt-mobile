/**
 * Auto focus specific hook for advanced auto focus operations
 */

import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  UseAutoFocusReturn, 
  AutoFocusConfig,
  // FocusCurve, // Unused for now
  AutoFocusSample
} from '../types/focuser.types';
import { 
  analyzeFocusCurve, 
  getFocusCurveStatistics,
  validateAutoFocusConfig,
  generateAutoFocusPositions,
  calculateAutoFocusProgress
} from '../utils/focuser.utils';
import { DEFAULT_AUTOFOCUS_CONFIG } from '../utils/focuser.constants';

export function useAutoFocus(): UseAutoFocusReturn {
  const {
    autoFocus,
    focuserStatus,
    setAutoFocus,
    setFocuserStatus,
  } = useAppStore();

  // Enhanced auto focus state
  const isRunning = useMemo(() => autoFocus.running, [autoFocus.running]);
  const progress = useMemo(() => autoFocus.progress, [autoFocus.progress]);
  const samples = useMemo(() => autoFocus.samples, [autoFocus.samples]);
  const bestPosition = useMemo(() => autoFocus.bestPosition, [autoFocus.bestPosition]);
  const bestHfr = useMemo(() => autoFocus.hfr, [autoFocus.hfr]);

  // Analyze focus curve
  const curve = useMemo(() => {
    return analyzeFocusCurve(samples);
  }, [samples]);

  // Start auto focus with configuration
  const startAutoFocus = useCallback(async (config?: Partial<AutoFocusConfig>) => {
    if (autoFocus.running || focuserStatus.moving) {
      throw new Error('Cannot start auto focus: focuser is busy');
    }

    const finalConfig = { ...DEFAULT_AUTOFOCUS_CONFIG, ...config };
    
    if (!validateAutoFocusConfig(finalConfig)) {
      throw new Error('Invalid auto focus configuration');
    }

    // Reset auto focus state
    setAutoFocus({
      running: true,
      progress: 0,
      samples: [],
    } as any);

    try {
      // Generate positions for auto focus sweep
      const positions = generateAutoFocusPositions(
        focuserStatus.position,
        finalConfig.stepSize,
        finalConfig.maxSteps
      );

      let currentStep = 0;
      const totalSteps = positions.length;

      // Simulate auto focus routine
      const performStep = () => {
        if (currentStep >= totalSteps) {
          // Auto focus complete
          const currentSamples = useAppStore.getState().autoFocus.samples;
          const bestSample = currentSamples.reduce((best, current) =>
            current.hfr < best.hfr ? current : best
          );

          const curve = analyzeFocusCurve(currentSamples);

          setAutoFocus({
            running: false,
            progress: 100,
            bestPosition: bestSample.position,
            hfr: bestSample.hfr,
            samples: currentSamples,
          } as any);

          // Move to best position
          setFocuserStatus({
            moving: true,
            targetPosition: bestSample.position,
          });

          setTimeout(() => {
            setFocuserStatus({
              moving: false,
              position: bestSample.position,
            });
          }, 2000);

          return;
        }

        const position = positions[currentStep];
        const progress = calculateAutoFocusProgress(currentStep + 1, totalSteps);

        // Move to position
        setFocuserStatus({
          moving: true,
          targetPosition: position,
        });

        // Simulate movement and capture
        setTimeout(() => {
          setFocuserStatus({
            moving: false,
            position: position,
          });

          // Simulate HFR measurement
          const baseHfr = 2.0;
          const noise = Math.random() * 0.5;
          const distanceFromOptimal = Math.abs(position - 15420);
          const hfr = baseHfr + noise + (distanceFromOptimal / 5000);

          const sample: AutoFocusSample = {
            position,
            hfr,
            timestamp: new Date(),
            starCount: Math.floor(Math.random() * 50) + 10,
            fwhm: hfr * 0.8,
            eccentricity: Math.random() * 0.3,
          };

          // Update samples and progress
          const currentSamples = useAppStore.getState().autoFocus.samples;
          setAutoFocus({
            progress,
            samples: [...currentSamples, sample],
          });

          currentStep++;
          
          // Continue to next step
          setTimeout(performStep, 1000);
        }, 1500);
      };

      // Start the auto focus sequence
      performStep();

    } catch (error) {
      setAutoFocus({
        running: false,
        progress: 0,
      } as any);
      throw error;
    }
  }, [autoFocus.running, focuserStatus.moving, focuserStatus.position, setAutoFocus, setFocuserStatus]);

  // Abort auto focus
  const abortAutoFocus = useCallback(async () => {
    if (!autoFocus.running) return;

    setAutoFocus({
      running: false,
      progress: 0,
    } as any);

    // Stop any ongoing movement
    if (focuserStatus.moving) {
      setFocuserStatus({
        moving: false,
        targetPosition: focuserStatus.position,
      });
    }
  }, [autoFocus.running, focuserStatus.moving, focuserStatus.position, setAutoFocus, setFocuserStatus]);

  // Analyze current curve
  const analyzeCurve = useCallback(() => {
    return analyzeFocusCurve(samples);
  }, [samples]);

  // Get statistics
  const getStatistics = useCallback(() => {
    return getFocusCurveStatistics(samples);
  }, [samples]);

  return {
    // State
    autoFocus,
    isRunning,
    progress,
    samples,
    bestPosition,
    bestHfr,
    curve,

    // Actions
    startAutoFocus,
    abortAutoFocus,

    // Analysis
    analyzeCurve,
    getStatistics,
  };
}
