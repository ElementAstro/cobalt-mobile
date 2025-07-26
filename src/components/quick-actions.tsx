"use client";

import React from 'react';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { useAppStore, CurrentPage } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { hapticFeedback } from '@/lib/mobile-utils';
import { useToastHelpers } from '@/components/ui/toast';
import {
  Square,
  Camera,
  Focus,
  Target,
  RotateCw,
  Pause,
  Play,
  Home,
} from 'lucide-react';

interface QuickActionsProps {
  currentPage?: CurrentPage;
  onNavigate?: (page: CurrentPage) => void;
}

export function QuickActions({ currentPage, onNavigate }: QuickActionsProps) {
  const {
    sequenceStatus,
    startSequence,
    pauseSequence,
    stopSequence,
    equipmentStatus,
    refreshEquipmentStatus,
    autoFocus,
    setAutoFocus,
  } = useAppStore();

  const { t } = useTranslation();
  const toast = useToastHelpers();

  const handleEmergencyStop = () => {
    hapticFeedback.heavy();
    stopSequence();
    toast.warning('Emergency Stop', 'All sequences and equipment operations have been stopped');
    console.log('Emergency stop activated');
  };

  const handleQuickCapture = async () => {
    hapticFeedback.medium();

    if (equipmentStatus.camera !== 'connected') {
      toast.error('Camera Not Connected', 'Please connect your camera before capturing');
      return;
    }

    toast.loading('Quick Capture', 'Capturing image...');

    try {
      if (!sequenceStatus.running) {
        startSequence();
      }

      // Simulate capture process
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Capture Complete', 'Image captured successfully');
      console.log('Quick capture initiated');
    } catch {
      toast.error('Capture Failed', 'Failed to capture image. Please try again.');
    }
  };

  const handleAutoFocus = () => {
    hapticFeedback.light();

    if (equipmentStatus.focuser !== 'connected') {
      toast.error('Focuser Not Connected', 'Please connect your focuser before running auto focus');
      return;
    }

    const isStarting = !autoFocus.running;
    setAutoFocus({
      ...autoFocus,
      running: isStarting,
    });

    if (isStarting) {
      toast.info('Auto Focus Started', 'Running auto focus routine...');
    } else {
      toast.info('Auto Focus Stopped', 'Auto focus routine has been stopped');
    }

    console.log('Auto focus toggled');
  };

  const handleGoHome = () => {
    hapticFeedback.light();
    onNavigate?.('dashboard');
  };

  const handleRefreshAll = () => {
    hapticFeedback.medium();
    refreshEquipmentStatus?.();
    console.log('Refreshing all equipment status');
  };

  const handleSequenceToggle = () => {
    hapticFeedback.medium();
    if (sequenceStatus.running) {
      if (sequenceStatus.paused) {
        startSequence();
      } else {
        pauseSequence();
      }
    } else {
      startSequence();
    }
  };

  // Define actions based on current page and app state
  const getActions = () => {
    const baseActions = [
      {
        id: 'emergency-stop',
        label: t('emergencyStop') || 'Emergency Stop',
        icon: Square,
        onClick: handleEmergencyStop,
        variant: 'destructive' as const,
      },
    ];

    // Add context-specific actions
    if (currentPage === 'dashboard') {
      return [
        ...baseActions,
        {
          id: 'quick-capture',
          label: t('quickCapture') || 'Quick Capture',
          icon: Camera,
          onClick: handleQuickCapture,
          disabled: equipmentStatus.camera !== 'connected',
        },
        {
          id: 'auto-focus',
          label: autoFocus.running ? 'Stop Focus' : 'Auto Focus',
          icon: Focus,
          onClick: handleAutoFocus,
          disabled: equipmentStatus.focuser !== 'connected',
        },
        {
          id: 'refresh-all',
          label: 'Refresh All',
          icon: RotateCw,
          onClick: handleRefreshAll,
        },
      ];
    }

    if (currentPage === 'devices') {
      return [
        ...baseActions,
        {
          id: 'refresh-equipment',
          label: 'Refresh Equipment',
          icon: RotateCw,
          onClick: handleRefreshAll,
        },
        {
          id: 'go-home',
          label: 'Dashboard',
          icon: Home,
          onClick: handleGoHome,
        },
      ];
    }

    if (currentPage === 'sequence') {
      return [
        ...baseActions,
        {
          id: 'sequence-toggle',
          label: sequenceStatus.running 
            ? (sequenceStatus.paused ? 'Resume' : 'Pause')
            : 'Start Sequence',
          icon: sequenceStatus.running 
            ? (sequenceStatus.paused ? Play : Pause)
            : Play,
          onClick: handleSequenceToggle,
        },
        {
          id: 'quick-capture',
          label: 'Quick Capture',
          icon: Camera,
          onClick: handleQuickCapture,
          disabled: equipmentStatus.camera !== 'connected',
        },
      ];
    }

    if (currentPage?.includes('detail')) {
      return [
        ...baseActions,
        {
          id: 'go-home',
          label: 'Dashboard',
          icon: Home,
          onClick: handleGoHome,
        },
        {
          id: 'devices',
          label: 'All Devices',
          icon: Target,
          onClick: () => onNavigate?.('devices'),
        },
      ];
    }

    // Default actions for other pages
    return [
      ...baseActions,
      {
        id: 'go-home',
        label: 'Dashboard',
        icon: Home,
        onClick: handleGoHome,
      },
      {
        id: 'quick-capture',
        label: 'Quick Capture',
        icon: Camera,
        onClick: handleQuickCapture,
        disabled: equipmentStatus.camera !== 'connected',
      },
    ];
  };

  const actions = getActions();

  return (
    <FloatingActionButton
      actions={actions}
      position="bottom-right"
      size="md"
    />
  );
}

// Context-aware quick actions hook
export function useQuickActions(currentPage?: string) {
  const {
    sequenceStatus,
    equipmentStatus,
    autoFocus,
  } = useAppStore();

  const getAvailableActions = () => {
    const actions = [];

    // Always available
    actions.push('emergency-stop');

    // Camera actions
    if (equipmentStatus.camera === 'connected') {
      actions.push('quick-capture');
    }

    // Focuser actions
    if (equipmentStatus.focuser === 'connected') {
      actions.push('auto-focus');
    }

    // Sequence actions
    if (currentPage === 'sequence' || sequenceStatus.running) {
      actions.push('sequence-control');
    }

    // Navigation actions
    if (currentPage !== 'dashboard') {
      actions.push('go-home');
    }

    return actions;
  };

  const getActionStatus = (actionId: string) => {
    switch (actionId) {
      case 'emergency-stop':
        return { available: true, urgent: sequenceStatus.running };
      case 'quick-capture':
        return { 
          available: equipmentStatus.camera === 'connected',
          active: sequenceStatus.running 
        };
      case 'auto-focus':
        return { 
          available: equipmentStatus.focuser === 'connected',
          active: autoFocus.running 
        };
      case 'sequence-control':
        return { 
          available: true,
          active: sequenceStatus.running,
          paused: sequenceStatus.paused 
        };
      default:
        return { available: true };
    }
  };

  return {
    availableActions: getAvailableActions(),
    getActionStatus,
  };
}

export default QuickActions;
