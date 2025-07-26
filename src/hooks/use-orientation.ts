import { useState, useEffect, useCallback } from 'react';
import { deviceDetector } from '@/lib/utils/device-detection';

export type OrientationType = 'portrait' | 'landscape';
export type OrientationAngle = 0 | 90 | 180 | 270;

// Define OrientationLockType for TypeScript compatibility
declare global {
  type OrientationLockType =
    | 'any'
    | 'natural'
    | 'landscape'
    | 'portrait'
    | 'portrait-primary'
    | 'portrait-secondary'
    | 'landscape-primary'
    | 'landscape-secondary';
}

export interface OrientationState {
  type: OrientationType;
  angle: OrientationAngle;
  isSupported: boolean;
  canLock: boolean;
}

export interface OrientationHookReturn extends OrientationState {
  lock: (orientation: OrientationType) => Promise<boolean>;
  unlock: () => Promise<boolean>;
  addListener: (callback: (state: OrientationState) => void) => () => void;
}

/**
 * Hook for managing device orientation
 */
export function useOrientation(): OrientationHookReturn {
  const [orientationState, setOrientationState] = useState<OrientationState>({
    type: 'portrait',
    angle: 0,
    isSupported: false,
    canLock: false,
  });

  const [listeners] = useState(new Set<(state: OrientationState) => void>());

  // Get current orientation info
  const getOrientationInfo = useCallback((): OrientationState => {
    if (typeof window === 'undefined') {
      return {
        type: 'portrait',
        angle: 0,
        isSupported: false,
        canLock: false,
      };
    }

    // Check if orientation API is supported
    const isSupported = 'orientation' in screen || 'orientation' in window;
    const canLock = 'orientation' in screen && 'lock' in screen.orientation;

    let type: OrientationType = 'portrait';
    let angle: OrientationAngle = 0;

    // Try to get orientation from screen.orientation (modern API)
    if ('orientation' in screen && screen.orientation) {
      const orientationType = screen.orientation.type;
      type = orientationType.includes('portrait') ? 'portrait' : 'landscape';
      angle = screen.orientation.angle as OrientationAngle;
    }
    // Fallback to window.orientation (legacy API)
    else if ('orientation' in window) {
      const windowOrientation = window.orientation as number;
      angle = Math.abs(windowOrientation) as OrientationAngle;
      type = Math.abs(windowOrientation) === 90 ? 'landscape' : 'portrait';
    }
    // Fallback to window dimensions
    else {
      type = (window as any).innerWidth > (window as any).innerHeight ? 'landscape' : 'portrait';
      angle = type === 'landscape' ? 90 : 0;
    }

    return {
      type,
      angle,
      isSupported,
      canLock,
    };
  }, []);

  // Update orientation state
  const updateOrientation = useCallback(() => {
    const newState = getOrientationInfo();
    setOrientationState(newState);
    
    // Notify listeners
    listeners.forEach(listener => {
      try {
        listener(newState);
      } catch (error) {
        console.error('Error in orientation listener:', error);
      }
    });
  }, [getOrientationInfo, listeners]);

  // Lock orientation
  const lock = useCallback(async (orientation: OrientationType): Promise<boolean> => {
    if (typeof window === 'undefined' || !('orientation' in screen) || !(screen.orientation as any).lock) {
      console.warn('Orientation lock not supported');
      return false;
    }

    try {
      // Map orientation type to screen orientation values
      const orientationMap = {
        portrait: 'portrait-primary' as OrientationLockType,
        landscape: 'landscape-primary' as OrientationLockType,
      };

      await (screen.orientation as any).lock(orientationMap[orientation]);
      return true;
    } catch (error) {
      console.error('Failed to lock orientation:', error);
      return false;
    }
  }, []);

  // Unlock orientation
  const unlock = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('orientation' in screen) || !(screen.orientation as any).unlock) {
      console.warn('Orientation unlock not supported');
      return false;
    }

    try {
      (screen.orientation as any).unlock();
      return true;
    } catch (error) {
      console.error('Failed to unlock orientation:', error);
      return false;
    }
  }, []);

  // Add orientation change listener
  const addListener = useCallback((callback: (state: OrientationState) => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }, [listeners]);

  // Set up event listeners
  useEffect(() => {
    updateOrientation();

    const handleOrientationChange = () => {
      // Small delay to ensure screen dimensions are updated
      setTimeout(updateOrientation, 100);
    };

    // Listen for orientation change events
    if ('orientation' in screen && screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
      window.addEventListener('orientationchange', handleOrientationChange);
    }

    // Also listen for resize events as fallback
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      if ('orientation' in screen && screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      } else {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [updateOrientation]);

  return {
    ...orientationState,
    lock,
    unlock,
    addListener,
  };
}

/**
 * Hook for orientation-specific layouts
 */
export function useOrientationLayout() {
  const orientation = useOrientation();
  const [layoutClasses, setLayoutClasses] = useState<{
    container: string;
    content: string;
    sidebar: string;
  }>({
    container: '',
    content: '',
    sidebar: '',
  });

  useEffect(() => {
    const deviceInfo = deviceDetector.getDeviceInfo();
    if (!deviceInfo) return;

    const { type: deviceType } = deviceInfo;
    const { type: orientationType } = orientation;

    // Generate responsive classes based on device and orientation
    const classes = {
      container: [
        'min-h-screen',
        deviceType === 'mobile' && orientationType === 'landscape' && 'overflow-hidden',
        deviceType === 'tablet' && orientationType === 'portrait' && 'max-w-none',
      ].filter(Boolean).join(' '),

      content: [
        'flex-1',
        deviceType === 'mobile' && orientationType === 'landscape' && 'flex-row',
        deviceType === 'mobile' && orientationType === 'portrait' && 'flex-col',
        deviceType === 'tablet' && orientationType === 'landscape' && 'grid grid-cols-2 gap-4',
      ].filter(Boolean).join(' '),

      sidebar: [
        'transition-all duration-300',
        deviceType === 'mobile' && orientationType === 'landscape' && 'w-1/3 min-w-64',
        deviceType === 'mobile' && orientationType === 'portrait' && 'w-full h-auto',
        deviceType === 'tablet' && 'w-64',
      ].filter(Boolean).join(' '),
    };

    setLayoutClasses(classes);
  }, [orientation]);

  return {
    ...orientation,
    layoutClasses,
  };
}

/**
 * Hook for handling orientation-specific behavior
 */
export function useOrientationBehavior() {
  const orientation = useOrientation();
  const [shouldAutoRotate, setShouldAutoRotate] = useState(true);
  const [preferredOrientation, setPreferredOrientation] = useState<OrientationType | null>(null);

  // Auto-lock orientation based on content type
  const autoLockForContent = useCallback(async (contentType: 'video' | 'camera' | 'game' | 'reading') => {
    if (!shouldAutoRotate || !orientation.canLock) return false;

    const orientationMap = {
      video: 'landscape' as OrientationType,
      camera: 'portrait' as OrientationType,
      game: 'landscape' as OrientationType,
      reading: 'portrait' as OrientationType,
    };

    const targetOrientation = orientationMap[contentType];
    if (targetOrientation !== orientation.type) {
      return await orientation.lock(targetOrientation);
    }

    return true;
  }, [orientation, shouldAutoRotate]);

  // Restore preferred orientation
  const restoreOrientation = useCallback(async () => {
    if (preferredOrientation && preferredOrientation !== orientation.type) {
      return await orientation.lock(preferredOrientation);
    } else {
      return await orientation.unlock();
    }
  }, [orientation, preferredOrientation]);

  // Handle orientation warnings for specific content
  const getOrientationWarning = useCallback((contentType: 'video' | 'camera' | 'imaging' | 'settings') => {
    const deviceInfo = deviceDetector.getDeviceInfo();
    if (!deviceInfo || deviceInfo.type === 'desktop') return null;

    const recommendations = {
      video: {
        preferred: 'landscape' as OrientationType,
        message: 'Rotate your device to landscape for the best video experience',
      },
      camera: {
        preferred: 'portrait' as OrientationType,
        message: 'Portrait orientation recommended for camera controls',
      },
      imaging: {
        preferred: 'landscape' as OrientationType,
        message: 'Landscape mode provides better access to imaging controls',
      },
      settings: {
        preferred: 'portrait' as OrientationType,
        message: 'Portrait mode recommended for easier navigation',
      },
    };

    const recommendation = recommendations[contentType];
    if (recommendation.preferred !== orientation.type) {
      return recommendation.message;
    }

    return null;
  }, [orientation.type]);

  return {
    ...orientation,
    shouldAutoRotate,
    setShouldAutoRotate,
    preferredOrientation,
    setPreferredOrientation,
    autoLockForContent,
    restoreOrientation,
    getOrientationWarning,
  };
}
