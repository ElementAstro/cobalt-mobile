"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { useUserStore } from '@/lib/stores/user-store';
import { WelcomeScreens } from './welcome-screens';
import { ProfileSetup } from './profile-setup';
import { InteractiveTutorials } from './interactive-tutorials';
import { OnboardingProgress } from './onboarding-progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  CheckCircle,
  ArrowRight,
  Settings,
  User,
  BookOpen,
  Trophy,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface OnboardingOrchestratorProps {
  className?: string;
  autoStart?: boolean;
  onComplete?: () => void;
  onDismiss?: () => void;
}

type OnboardingMode = 'welcome' | 'profile' | 'tutorials' | 'progress' | 'completed';

export function OnboardingOrchestrator({ 
  className, 
  autoStart = false,
  onComplete,
  onDismiss 
}: OnboardingOrchestratorProps) {
  const {
    currentFlow,
    currentStepIndex,
    isOnboardingActive,
    userProfile,
    progress,
    startOnboarding,
    completeOnboarding,
    pauseOnboarding,
    updateUserProfile,
  } = useOnboardingStore();

  const { isAuthenticated } = useUserStore();
  const { announce } = useAccessibility();

  const [currentMode, setCurrentMode] = useState<OnboardingMode>('welcome');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Determine if onboarding should be shown
  useEffect(() => {
    const shouldShow = autoStart || 
      (!userProfile && isAuthenticated) || 
      (progress.progressPercentage < 100 && isOnboardingActive);
    
    setShowOnboarding(shouldShow);
    
    if (shouldShow && !userProfile) {
      setCurrentMode('welcome');
    } else if (shouldShow && userProfile && progress.progressPercentage < 100) {
      setCurrentMode('progress');
    }
  }, [autoStart, userProfile, isAuthenticated, progress.progressPercentage, isOnboardingActive]);

  // Handle mode transitions
  const handleWelcomeComplete = useCallback(() => {
    setCurrentMode('profile');
    announce('Welcome completed, moving to profile setup');
  }, [announce]);

  const handleProfileComplete = useCallback((profile: any) => {
    updateUserProfile(profile);
    setCurrentMode('progress');
    announce('Profile setup completed');
  }, [updateUserProfile, announce]);

  const handleTutorialComplete = useCallback(() => {
    setCurrentMode('progress');
    announce('Tutorial completed');
  }, [announce]);

  const handleOnboardingComplete = useCallback(() => {
    completeOnboarding();
    setCurrentMode('completed');
    setShowOnboarding(false);
    onComplete?.();
    announce('Onboarding completed successfully');
  }, [completeOnboarding, onComplete, announce]);

  const handleDismiss = useCallback(() => {
    pauseOnboarding();
    setShowOnboarding(false);
    onDismiss?.();
    announce('Onboarding dismissed');
  }, [pauseOnboarding, onDismiss, announce]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
    announce(isMinimized ? 'Onboarding expanded' : 'Onboarding minimized');
  }, [isMinimized, announce]);

  const handleStartTutorial = useCallback((tutorialId?: string) => {
    if (tutorialId) {
      startOnboarding(tutorialId);
    }
    setCurrentMode('tutorials');
    announce('Starting interactive tutorial');
  }, [startOnboarding, announce]);

  // Don't render if onboarding shouldn't be shown
  if (!showOnboarding) {
    return null;
  }

  // Minimized state
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="shadow-lg border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-sm">Onboarding</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(progress.progressPercentage)}% complete
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-8 w-8 p-0"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentMode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 z-40 bg-background/95 backdrop-blur-sm",
          className
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="font-semibold">Cobalt Mobile Onboarding</h1>
                  <p className="text-sm text-muted-foreground">
                    {currentMode === 'welcome' && 'Welcome to your astrophotography journey'}
                    {currentMode === 'profile' && 'Setting up your profile'}
                    {currentMode === 'tutorials' && 'Interactive learning experience'}
                    {currentMode === 'progress' && 'Track your learning progress'}
                    {currentMode === 'completed' && 'Onboarding completed!'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Progress indicator */}
                {currentMode !== 'completed' && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(progress.progressPercentage)}% Complete
                  </Badge>
                )}

                {/* Mode indicators */}
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    currentMode === 'welcome' ? "bg-primary" : "bg-muted"
                  )} />
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    currentMode === 'profile' ? "bg-primary" : "bg-muted"
                  )} />
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    currentMode === 'tutorials' || currentMode === 'progress' ? "bg-primary" : "bg-muted"
                  )} />
                </div>

                {/* Controls */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-8 w-8 p-0"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
              {/* Welcome screens */}
              {currentMode === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <WelcomeScreens onComplete={handleWelcomeComplete} />
                </motion.div>
              )}

              {/* Profile setup */}
              {currentMode === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ProfileSetup
                    onComplete={handleProfileComplete}
                    onPrevious={() => setCurrentMode('welcome')}
                  />
                </motion.div>
              )}

              {/* Interactive tutorials */}
              {currentMode === 'tutorials' && (
                <motion.div
                  key="tutorials"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <InteractiveTutorials
                    onComplete={handleTutorialComplete}
                    onExit={() => setCurrentMode('progress')}
                  />
                </motion.div>
              )}

              {/* Progress and flow selection */}
              {currentMode === 'progress' && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <OnboardingProgress
                    onContinue={handleStartTutorial}
                    onSkipAll={handleOnboardingComplete}
                    onCustomize={() => {
                      // Handle custom flow configuration
                      handleStartTutorial();
                    }}
                  />
                </motion.div>
              )}

              {/* Completion screen */}
              {currentMode === 'completed' && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center space-y-8 max-w-2xl mx-auto"
                >
                  <div className="space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center"
                    >
                      <Trophy className="h-12 w-12 text-white" />
                    </motion.div>
                    
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
                      <p className="text-lg text-muted-foreground">
                        You've completed the Cobalt Mobile onboarding experience
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-sm font-medium">Profile Set</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-sm font-medium">Tutorials Done</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                        <Settings className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-sm font-medium">Ready to Go</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      You're now ready to start your astrophotography journey with Cobalt Mobile. 
                      Remember, you can always access tutorials and help from the settings menu.
                    </p>
                    
                    <Button
                      onClick={handleOnboardingComplete}
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      Start Using Cobalt Mobile
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        {currentMode !== 'completed' && (
          <div className="border-t bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Need help? Press F1 or contact support</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span>
                    Progress: {progress.completedSteps.length} of {
                      progress.completedSteps.length + 
                      (currentFlow?.steps.length || 0) - currentStepIndex
                    } steps
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMode('progress')}
                    className="text-xs"
                  >
                    View Progress
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
