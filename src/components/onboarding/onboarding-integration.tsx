"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { useUserStore } from '@/lib/stores/user-store';
import { OnboardingOrchestrator } from './onboarding-orchestrator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  BookOpen,
  Play,
  RotateCcw,
  Settings,
  HelpCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface OnboardingIntegrationProps {
  className?: string;
  showInHeader?: boolean;
  showFloatingButton?: boolean;
  autoStartForNewUsers?: boolean;
}

/**
 * Integration component that manages onboarding state and provides
 * entry points throughout the application
 */
export function OnboardingIntegration({
  className,
  showInHeader = true,
  showFloatingButton = true,
  autoStartForNewUsers = true,
}: OnboardingIntegrationProps) {
  const {
    isOnboardingActive,
    progress,
    userProfile,
    startOnboarding,
    resumeOnboarding,
    getRecommendedFlows,
  } = useOnboardingStore();

  const { isAuthenticated, profile } = useUserStore();
  const { announce } = useAccessibility();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasShownAutoStart, setHasShownAutoStart] = useState(false);

  // Auto-start onboarding for new users
  useEffect(() => {
    if (
      autoStartForNewUsers &&
      isAuthenticated &&
      !userProfile &&
      !hasShownAutoStart &&
      progress.progressPercentage === 0
    ) {
      setShowOnboarding(true);
      setHasShownAutoStart(true);
      announce('Welcome! Starting onboarding experience');
    }
  }, [
    autoStartForNewUsers,
    isAuthenticated,
    userProfile,
    hasShownAutoStart,
    progress.progressPercentage,
    announce,
  ]);

  const handleStartOnboarding = useCallback(() => {
    setShowOnboarding(true);
    startOnboarding();
    announce('Starting onboarding experience');
  }, [startOnboarding, announce]);

  const handleResumeOnboarding = useCallback(() => {
    setShowOnboarding(true);
    resumeOnboarding();
    announce('Resuming onboarding experience');
  }, [resumeOnboarding, announce]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    announce('Onboarding completed successfully');
  }, [announce]);

  const handleOnboardingDismiss = useCallback(() => {
    setShowOnboarding(false);
    announce('Onboarding dismissed');
  }, [announce]);

  const recommendedFlows = getRecommendedFlows();
  const hasIncompleteOnboarding = progress.progressPercentage > 0 && progress.progressPercentage < 100;

  return (
    <>
      {/* Header integration */}
      {showInHeader && (
        <div className={cn("flex items-center gap-2", className)}>
          {hasIncompleteOnboarding ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResumeOnboarding}
              className="flex items-center gap-2"
            >
              <Play className="h-3 w-3" />
              Resume Tutorial
              <Badge variant="secondary" className="ml-1 text-xs">
                {Math.round(progress.progressPercentage)}%
              </Badge>
            </Button>
          ) : progress.progressPercentage === 100 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartOnboarding}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-3 w-3" />
              Restart Tutorials
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartOnboarding}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-3 w-3" />
              Get Started
            </Button>
          )}
        </div>
      )}

      {/* Floating action button */}
      {showFloatingButton && !showOnboarding && hasIncompleteOnboarding && (
        <div className="fixed bottom-6 left-6 z-30">
          <Card className="shadow-lg border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-sm">Continue Learning</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(progress.progressPercentage)}% complete
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={handleResumeOnboarding}
                  className="flex items-center gap-1"
                >
                  <Play className="h-3 w-3" />
                  Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help menu integration */}
      {recommendedFlows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <HelpCircle className="h-4 w-4" />
            Recommended Tutorials
          </div>
          
          {recommendedFlows.slice(0, 3).map((flow) => (
            <Button
              key={flow.id}
              variant="ghost"
              size="sm"
              onClick={() => {
                startOnboarding(flow.id);
                setShowOnboarding(true);
              }}
              className="w-full justify-start text-left h-auto p-2"
            >
              <div className="flex items-center gap-2 w-full">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  {flow.category === 'equipment' && <Settings className="h-3 w-3 text-primary" />}
                  {flow.category === 'imaging' && <Sparkles className="h-3 w-3 text-primary" />}
                  {flow.category === 'setup' && <Play className="h-3 w-3 text-primary" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs truncate">{flow.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {flow.steps.length} steps • ~{flow.steps.reduce((acc, step) => acc + (step.estimatedTime || 5), 0)} min
                  </div>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  {flow.targetAudience}
                </Badge>
              </div>
            </Button>
          ))}
        </div>
      )}

      {/* Progress summary for settings */}
      {progress.progressPercentage > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Onboarding Progress</h4>
                <Badge variant="outline">
                  {Math.round(progress.progressPercentage)}% Complete
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Completed Steps</span>
                  <span>{progress.completedSteps.length}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Completed Flows</span>
                  <span>{progress.completedFlows.length}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Time Spent</span>
                  <span>{Math.round(progress.totalTimeSpent)} minutes</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Last Active</span>
                  <span>{new Date(progress.lastActiveDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {hasIncompleteOnboarding ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResumeOnboarding}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Play className="h-3 w-3" />
                    Continue
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    All tutorials completed!
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartOnboarding}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main onboarding orchestrator */}
      {showOnboarding && (
        <OnboardingOrchestrator
          autoStart={autoStartForNewUsers}
          onComplete={handleOnboardingComplete}
          onDismiss={handleOnboardingDismiss}
        />
      )}
    </>
  );
}

/**
 * Hook for accessing onboarding functionality in components
 */
export function useOnboardingIntegration() {
  const {
    isOnboardingActive,
    progress,
    userProfile,
    startOnboarding,
    resumeOnboarding,
    pauseOnboarding,
    getRecommendedFlows,
    highlightElement,
    clearHighlight,
  } = useOnboardingStore();

  const { announce } = useAccessibility();

  const startTutorial = useCallback((flowId?: string) => {
    startOnboarding(flowId);
    announce(`Starting tutorial${flowId ? `: ${flowId}` : ''}`);
  }, [startOnboarding, announce]);

  const resumeTutorial = useCallback(() => {
    resumeOnboarding();
    announce('Resuming tutorial');
  }, [resumeOnboarding, announce]);

  const pauseTutorial = useCallback(() => {
    pauseOnboarding();
    announce('Tutorial paused');
  }, [pauseOnboarding, announce]);

  const showTooltip = useCallback((elementId: string, position?: { x: number; y: number }) => {
    highlightElement(elementId, position);
    announce(`Highlighting ${elementId}`);
  }, [highlightElement, announce]);

  const hideTooltip = useCallback(() => {
    clearHighlight();
    announce('Tooltip hidden');
  }, [clearHighlight, announce]);

  return {
    // State
    isActive: isOnboardingActive,
    progress,
    userProfile,
    recommendedFlows: getRecommendedFlows(),
    
    // Actions
    startTutorial,
    resumeTutorial,
    pauseTutorial,
    showTooltip,
    hideTooltip,
    
    // Helpers
    hasIncompleteOnboarding: progress.progressPercentage > 0 && progress.progressPercentage < 100,
    isCompleted: progress.progressPercentage === 100,
    completedStepsCount: progress.completedSteps.length,
    totalTimeSpent: progress.totalTimeSpent,
  };
}

/**
 * Component for showing contextual onboarding hints
 */
export function OnboardingHint({ 
  elementId, 
  title, 
  description, 
  position = 'bottom',
  className 
}: {
  elementId: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  const { showTooltip, hideTooltip } = useOnboardingIntegration();
  const [isVisible, setIsVisible] = useState(false);

  const handleShow = useCallback(() => {
    setIsVisible(true);
    showTooltip(elementId);
  }, [elementId, showTooltip]);

  const handleHide = useCallback(() => {
    setIsVisible(false);
    hideTooltip();
  }, [hideTooltip]);

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={isVisible ? handleHide : handleShow}
        className="h-6 w-6 p-0 rounded-full bg-primary/10 hover:bg-primary/20"
      >
        <HelpCircle className="h-3 w-3 text-primary" />
      </Button>
      
      {isVisible && (
        <div className={cn(
          "absolute z-50 w-64 p-3 bg-popover border rounded-lg shadow-lg",
          position === 'top' && "bottom-full mb-2",
          position === 'bottom' && "top-full mt-2",
          position === 'left' && "right-full mr-2",
          position === 'right' && "left-full ml-2"
        )}>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHide}
            className="absolute top-1 right-1 h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      )}
    </div>
  );
}
