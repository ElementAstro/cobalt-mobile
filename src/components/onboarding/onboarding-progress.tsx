"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Circle,
  SkipForward,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Star,
  Trophy,
  Target,
  ChevronRight,
  ChevronDown,
  Settings,
  User,
  Camera,
  Zap,
  BookOpen,
  Award,
  TrendingUp,
  Calendar,
  BarChart3,
} from 'lucide-react';

interface OnboardingProgressProps {
  className?: string;
  showDetailed?: boolean;
  onContinue?: (flowId?: string) => void;
  onSkipAll?: () => void;
  onCustomize?: () => void;
}

// Progress visualization component
function ProgressVisualization({ 
  progress, 
  completedSteps, 
  totalSteps, 
  timeSpent 
}: {
  progress: number;
  completedSteps: number;
  totalSteps: number;
  timeSpent: number;
}) {
  return (
    <div className="space-y-6">
      {/* Main progress circle */}
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-primary"
            strokeDasharray={`${2 * Math.PI * 50}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
            animate={{ 
              strokeDashoffset: 2 * Math.PI * 50 * (1 - progress / 100) 
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-primary">
              {Math.round(progress)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Complete
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-primary">
            {completedSteps}
          </div>
          <div className="text-xs text-muted-foreground">
            Steps Done
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-semibold text-blue-500">
            {totalSteps - completedSteps}
          </div>
          <div className="text-xs text-muted-foreground">
            Remaining
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-lg font-semibold text-green-500">
            {Math.round(timeSpent)}m
          </div>
          <div className="text-xs text-muted-foreground">
            Time Spent
          </div>
        </div>
      </div>
    </div>
  );
}

// Flow customization component
function FlowCustomization({ 
  onSave, 
  onCancel 
}: { 
  onSave: (config: any) => void; 
  onCancel: () => void; 
}) {
  const { availableFlows, userProfile } = useOnboardingStore();
  const [selectedFlows, setSelectedFlows] = useState<string[]>([]);
  const [skipOptional, setSkipOptional] = useState(false);
  const [fastTrack, setFastTrack] = useState(false);

  const handleFlowToggle = useCallback((flowId: string) => {
    setSelectedFlows(prev => 
      prev.includes(flowId) 
        ? prev.filter(id => id !== flowId)
        : [...prev, flowId]
    );
  }, []);

  const estimatedTime = selectedFlows.reduce((total, flowId) => {
    const flow = availableFlows.find(f => f.id === flowId);
    if (!flow) return total;
    
    const stepTime = flow.steps.reduce((stepTotal, step) => {
      if (skipOptional && step.optional) return stepTotal;
      return stepTotal + (step.estimatedTime || 5);
    }, 0);
    
    return total + (fastTrack ? stepTime * 0.7 : stepTime);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Customize Your Journey</h3>
        <p className="text-muted-foreground">
          Choose which tutorials you'd like to complete
        </p>
      </div>

      {/* Flow selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Select Tutorials</Label>
        <div className="space-y-2">
          {availableFlows.map((flow) => {
            const isSelected = selectedFlows.includes(flow.id);
            const isRecommended = userProfile?.experienceLevel === flow.targetAudience || flow.targetAudience === 'all';
            
            return (
              <div
                key={flow.id}
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => handleFlowToggle(flow.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5">
                    {isSelected ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{flow.name}</h4>
                      {isRecommended && (
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {flow.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {flow.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{flow.steps.length} steps</span>
                      <span>~{flow.steps.reduce((acc, step) => acc + (step.estimatedTime || 5), 0)} min</span>
                      <span className="capitalize">{flow.targetAudience}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Options</Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="font-medium text-sm">Skip Optional Steps</div>
              <div className="text-xs text-muted-foreground">
                Focus on essential features only
              </div>
            </div>
            <Button
              variant={skipOptional ? "default" : "outline"}
              size="sm"
              onClick={() => setSkipOptional(!skipOptional)}
            >
              {skipOptional ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="font-medium text-sm">Fast Track Mode</div>
              <div className="text-xs text-muted-foreground">
                Shorter explanations, quicker pace
              </div>
            </div>
            <Button
              variant={fastTrack ? "default" : "outline"}
              size="sm"
              onClick={() => setFastTrack(!fastTrack)}
            >
              {fastTrack ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Estimated Time:</span>
          <Badge variant="outline">
            ~{Math.round(estimatedTime)} minutes
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Selected Tutorials:</span>
          <Badge variant="outline">
            {selectedFlows.length} of {availableFlows.length}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => onSave({ selectedFlows, skipOptional, fastTrack })}
          disabled={selectedFlows.length === 0}
        >
          Start Custom Journey
        </Button>
      </div>
    </motion.div>
  );
}

// Main progress component
export function OnboardingProgress({ 
  className, 
  showDetailed = false,
  onContinue,
  onSkipAll,
  onCustomize 
}: OnboardingProgressProps) {
  const {
    progress,
    currentFlow,
    availableFlows,
    userProfile,
    getRecommendedFlows,
    isOnboardingActive,
    resumeOnboarding,
    pauseOnboarding,
    resetOnboarding,
  } = useOnboardingStore();

  const { announce } = useAccessibility();
  const [showCustomization, setShowCustomization] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const totalSteps = availableFlows.reduce((acc, flow) => acc + flow.steps.length, 0);
  const completedSteps = progress.completedSteps.length;
  const recommendedFlows = getRecommendedFlows();

  const handleContinue = useCallback(() => {
    if (isOnboardingActive) {
      resumeOnboarding();
    }
    onContinue?.();
    announce('Continuing onboarding');
  }, [isOnboardingActive, resumeOnboarding, onContinue, announce]);

  const handleSkipAll = useCallback(() => {
    if (window.confirm('Are you sure you want to skip all remaining tutorials? You can always access them later from the help menu.')) {
      onSkipAll?.();
      announce('All tutorials skipped');
    }
  }, [onSkipAll, announce]);

  const handleCustomize = useCallback(() => {
    setShowCustomization(true);
    announce('Opening customization options');
  }, [announce]);

  const handleCustomizationSave = useCallback((config: any) => {
    setShowCustomization(false);
    onCustomize?.();
    announce('Custom onboarding flow configured');
  }, [onCustomize, announce]);

  const handleReset = useCallback(() => {
    if (window.confirm('This will reset all onboarding progress. Are you sure?')) {
      resetOnboarding();
      announce('Onboarding progress reset');
    }
  }, [resetOnboarding, announce]);

  if (showCustomization) {
    return (
      <div className={cn("max-w-2xl mx-auto", className)}>
        <FlowCustomization
          onSave={handleCustomizationSave}
          onCancel={() => setShowCustomization(false)}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("max-w-4xl mx-auto space-y-6", className)}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold">Your Learning Journey</h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Track your progress and customize your onboarding experience
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Progress visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressVisualization
              progress={progress.progressPercentage}
              completedSteps={completedSteps}
              totalSteps={totalSteps}
              timeSpent={progress.totalTimeSpent}
            />
          </CardContent>
        </Card>

        {/* Current status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentFlow ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Play className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{currentFlow.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {currentFlow.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round((progress.completedSteps.filter(stepId => 
                      currentFlow.steps.some(step => step.id === stepId)
                    ).length / currentFlow.steps.length) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(progress.completedSteps.filter(stepId => 
                      currentFlow.steps.some(step => step.id === stepId)
                    ).length / currentFlow.steps.length) * 100} 
                  />
                </div>

                <Button onClick={handleContinue} className="w-full">
                  Continue Tutorial
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Ready to Start</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose a tutorial to begin your learning journey
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended flows */}
      {recommendedFlows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Recommended for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {recommendedFlows.slice(0, 4).map((flow) => (
                <div
                  key={flow.id}
                  className="p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => onContinue?.(flow.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {flow.category === 'equipment' && <Camera className="h-4 w-4 text-primary" />}
                      {flow.category === 'imaging' && <Target className="h-4 w-4 text-primary" />}
                      {flow.category === 'setup' && <Settings className="h-4 w-4 text-primary" />}
                      {flow.category === 'features' && <Zap className="h-4 w-4 text-primary" />}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{flow.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {flow.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {flow.steps.length} steps
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ~{flow.steps.reduce((acc, step) => acc + (step.estimatedTime || 5), 0)} min
                        </Badge>
                      </div>
                    </div>
                    
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCustomize}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Customize Journey
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowStats(!showStats)}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                {showStats ? 'Hide' : 'Show'} Stats
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleReset}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Progress
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSkipAll}
                className="flex items-center gap-2"
              >
                <SkipForward className="h-4 w-4" />
                Skip All
              </Button>
            </div>
          </div>

          {/* Detailed stats */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">
                      {progress.completedFlows.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Flows Completed
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-green-500">
                      {progress.completedSteps.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Steps Completed
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-500">
                      {progress.skippedSteps.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Steps Skipped
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-purple-500">
                      {Math.round(progress.totalTimeSpent)}m
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Time
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
