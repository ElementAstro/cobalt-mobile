"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/mobile-utils';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Target,
  Camera,
  Settings,
  Activity,
  Lightbulb,
  CheckCircle,
} from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    type: 'click' | 'navigate' | 'wait';
    target?: string;
    duration?: number;
  };
  skippable?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onStepChange?: (step: number) => void;
  className?: string;
}

export function OnboardingTour({
  steps,
  isOpen,
  onClose,
  onComplete,
  onStepChange,
  className,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Find and highlight target element
  useEffect(() => {
    if (!step?.target || !isOpen) {
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(step.target) as HTMLElement;
    if (element) {
      setTargetElement(element);
      setIsHighlighting(true);
      
      // Scroll element into view
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });

      // Add highlight class
      element.classList.add('onboarding-highlight');
      
      // Remove highlight after animation
      const timeout = setTimeout(() => {
        setIsHighlighting(false);
      }, 2000);

      return () => {
        clearTimeout(timeout);
        element.classList.remove('onboarding-highlight');
      };
    }
  }, [step?.target, isOpen, currentStep]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      hapticFeedback.success();
      onComplete();
      return;
    }

    hapticFeedback.light();
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    onStepChange?.(nextStep);
  }, [currentStep, isLastStep, onComplete, onStepChange]);

  const handlePrevious = useCallback(() => {
    if (isFirstStep) return;
    
    hapticFeedback.light();
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    onStepChange?.(prevStep);
  }, [currentStep, isFirstStep, onStepChange]);

  const handleSkip = useCallback(() => {
    hapticFeedback.medium();
    onComplete();
  }, [onComplete]);

  const handleClose = useCallback(() => {
    hapticFeedback.medium();
    onClose();
  }, [onClose]);

  // Handle step action
  const handleStepAction = useCallback(() => {
    if (!step?.action) return;

    switch (step.action.type) {
      case 'click':
        if (step.action.target) {
          const element = document.querySelector(step.action.target) as HTMLElement;
          element?.click();
        }
        break;
      case 'navigate':
        // Handle navigation if needed
        break;
      case 'wait':
        setTimeout(() => {
          handleNext();
        }, step.action.duration || 2000);
        return;
    }
    
    handleNext();
  }, [step, handleNext]);

  if (!isOpen || !step) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={step.skippable !== false ? handleClose : undefined}
      />

      {/* Tour Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          'fixed z-50 w-full max-w-md mx-auto',
          step.position === 'top' && 'top-4 left-1/2 transform -translate-x-1/2',
          step.position === 'bottom' && 'bottom-4 left-1/2 transform -translate-x-1/2',
          step.position === 'left' && 'left-4 top-1/2 transform -translate-y-1/2',
          step.position === 'right' && 'right-4 top-1/2 transform -translate-y-1/2',
          (!step.position || step.position === 'center') && 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
          className
        )}
        style={{
          maxWidth: 'calc(100vw - 2rem)',
        }}
      >
        <Card className="shadow-2xl border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {step.icon && (
                  <step.icon className="h-5 w-5 text-primary" />
                )}
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {currentStep + 1} of {steps.length}
                </Badge>
                {step.skippable !== false && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <Progress value={progress} className="h-2 mt-2" />
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.content}
            </p>

            {step.action && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Lightbulb className="h-4 w-4" />
                  <span>
                    {step.action.type === 'click' && 'Tap the highlighted element to continue'}
                    {step.action.type === 'navigate' && 'Navigate to continue the tour'}
                    {step.action.type === 'wait' && 'Please wait while we demonstrate...'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                {!isLastStep && step.skippable !== false && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-muted-foreground"
                  >
                    Skip Tour
                  </Button>
                )}

                {step.action ? (
                  <Button
                    onClick={handleStepAction}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {step.action.type === 'click' ? 'Try It' : 'Continue'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="flex items-center gap-2"
                  >
                    {isLastStep ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Complete
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Highlight Spotlight */}
      {targetElement && isHighlighting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-40"
          style={{
            background: `radial-gradient(circle at ${targetElement.offsetLeft + targetElement.offsetWidth / 2}px ${targetElement.offsetTop + targetElement.offsetHeight / 2}px, transparent 60px, rgba(0,0,0,0.7) 120px)`,
          }}
        />
      )}

      <style jsx global>{`
        .onboarding-highlight {
          position: relative;
          z-index: 60;
          animation: onboarding-pulse 2s ease-in-out;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          border-radius: 8px;
        }

        @keyframes onboarding-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.7), 0 0 30px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </>
  );
}

// Predefined tour steps for the astrophotography application
export const astrophotographyTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Cobalt Mobile',
    content: 'Welcome to your advanced astrophotography control platform! This tour will guide you through the key features to help you capture stunning images of the night sky.',
    position: 'center',
    icon: Target,
    skippable: true,
  },
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    content: 'This is your main dashboard where you can monitor all your equipment status, environmental conditions, and sequence progress at a glance.',
    target: '[data-tour="dashboard"]',
    position: 'bottom',
    icon: Activity,
  },
  {
    id: 'equipment-status',
    title: 'Equipment Status',
    content: 'These widgets show the real-time status of your camera, mount, filter wheel, and focuser. Green means connected and ready!',
    target: '[data-tour="equipment-status"]',
    position: 'bottom',
    icon: Camera,
  },
  {
    id: 'navigation',
    title: 'Bottom Navigation',
    content: 'Use the bottom navigation to switch between different sections of the app. The badges show important notifications and status updates.',
    target: '[data-tour="navigation"]',
    position: 'top',
    icon: Settings,
  },
  {
    id: 'devices-page',
    title: 'Device Controls',
    content: 'Tap on Devices to access detailed controls for each piece of equipment. You can adjust settings, run calibrations, and monitor performance.',
    target: '[data-tour="devices-nav"]',
    position: 'top',
    action: {
      type: 'click',
      target: '[data-tour="devices-nav"]',
    },
  },
  {
    id: 'pull-to-refresh',
    title: 'Pull to Refresh',
    content: 'Pull down on any page to refresh equipment status and data. This ensures you always have the latest information.',
    position: 'center',
    icon: Activity,
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    content: 'The floating action button provides quick access to common operations like emergency stop, quick capture, and auto focus.',
    target: '[data-tour="quick-actions"]',
    position: 'left',
    icon: Target,
  },
  {
    id: 'sequence-control',
    title: 'Sequence Control',
    content: 'Navigate to the Sequencer to create and manage your imaging sequences. Plan your entire night of astrophotography!',
    target: '[data-tour="sequence-nav"]',
    position: 'top',
    action: {
      type: 'click',
      target: '[data-tour="sequence-nav"]',
    },
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    content: 'Congratulations! You\'re now ready to start capturing amazing astrophotography images. Clear skies and happy imaging!',
    position: 'center',
    icon: CheckCircle,
  },
];

// Hook for managing onboarding state
export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cobalt-onboarding-completed') === 'true';
    }
    return false;
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const startOnboarding = useCallback(() => {
    setIsOnboardingOpen(true);
    hapticFeedback.light();
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    setIsOnboardingOpen(false);
    localStorage.setItem('cobalt-onboarding-completed', 'true');
    hapticFeedback.success();
  }, []);

  const resetOnboarding = useCallback(() => {
    setHasCompletedOnboarding(false);
    localStorage.removeItem('cobalt-onboarding-completed');
    hapticFeedback.light();
  }, []);

  const closeOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
    hapticFeedback.medium();
  }, []);

  // Auto-start onboarding for new users
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 1000); // Delay to let the app load

      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboarding]);

  return {
    hasCompletedOnboarding,
    isOnboardingOpen,
    startOnboarding,
    completeOnboarding,
    resetOnboarding,
    closeOnboarding,
  };
}
