"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';
import {
  Camera,
  Target,
  Settings,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  ArrowDown,
  MousePointer,
  Hand,
  Eye,
  Lightbulb,
  Zap,
  Star,
  ChevronRight,
  ChevronLeft,
  X,
  HelpCircle,
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  instruction: string;
  targetElement?: string;
  highlightArea?: { x: number; y: number; width: number; height: number };
  interactionType: 'click' | 'drag' | 'input' | 'observe';
  completed: boolean;
  optional: boolean;
  tips?: string[];
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'equipment' | 'imaging' | 'navigation' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  steps: TutorialStep[];
  prerequisites?: string[];
}

interface InteractiveTutorialsProps {
  className?: string;
  tutorialId?: string;
  onComplete?: () => void;
  onExit?: () => void;
}

// Sample tutorials
const sampleTutorials: Tutorial[] = [
  {
    id: 'camera-basics',
    title: 'Camera Control Basics',
    description: 'Learn to control your camera settings and capture your first image',
    category: 'equipment',
    difficulty: 'beginner',
    estimatedTime: 10,
    steps: [
      {
        id: 'connect-camera',
        title: 'Connect Your Camera',
        description: 'First, let\'s connect your camera to the app',
        instruction: 'Tap the "Connect Camera" button to establish connection',
        targetElement: 'connect-camera-btn',
        interactionType: 'click',
        completed: false,
        optional: false,
        tips: ['Make sure your camera is powered on', 'Check USB/WiFi connection'],
      },
      {
        id: 'adjust-exposure',
        title: 'Set Exposure Time',
        description: 'Configure the exposure time for your image',
        instruction: 'Use the slider to set exposure time to 30 seconds',
        targetElement: 'exposure-slider',
        interactionType: 'drag',
        completed: false,
        optional: false,
        tips: ['Longer exposures capture more light', 'Start with 30 seconds for testing'],
      },
      {
        id: 'set-iso',
        title: 'Configure ISO',
        description: 'Set the camera sensitivity',
        instruction: 'Select ISO 800 from the dropdown menu',
        targetElement: 'iso-select',
        interactionType: 'click',
        completed: false,
        optional: false,
        tips: ['Higher ISO = more sensitive but more noise', 'ISO 800 is good for beginners'],
      },
      {
        id: 'capture-image',
        title: 'Capture Your First Image',
        description: 'Take your first astrophoto!',
        instruction: 'Press the capture button to take a photo',
        targetElement: 'capture-btn',
        interactionType: 'click',
        completed: false,
        optional: false,
        tips: ['Make sure your mount is tracking', 'Wait for the exposure to complete'],
      },
    ],
  },
  {
    id: 'sequence-planning',
    title: 'Creating Image Sequences',
    description: 'Learn to plan and execute automated imaging sequences',
    category: 'imaging',
    difficulty: 'intermediate',
    estimatedTime: 15,
    prerequisites: ['camera-basics'],
    steps: [
      {
        id: 'select-target',
        title: 'Choose Your Target',
        description: 'Select a celestial object to photograph',
        instruction: 'Browse the target catalog and select M31 (Andromeda Galaxy)',
        targetElement: 'target-catalog',
        interactionType: 'click',
        completed: false,
        optional: false,
        tips: ['M31 is great for beginners', 'Check visibility times'],
      },
      {
        id: 'create-sequence',
        title: 'Create Imaging Sequence',
        description: 'Set up an automated sequence of images',
        instruction: 'Click "New Sequence" and configure 10 x 5-minute exposures',
        targetElement: 'new-sequence-btn',
        interactionType: 'click',
        completed: false,
        optional: false,
        tips: ['Multiple shorter exposures are often better', 'Plan for 2-3 hours total'],
      },
      {
        id: 'add-filters',
        title: 'Configure Filters',
        description: 'Add different filters to your sequence',
        instruction: 'Add Luminance, Red, Green, and Blue filters to create LRGB sequence',
        targetElement: 'filter-config',
        interactionType: 'click',
        completed: false,
        optional: true,
        tips: ['LRGB creates full-color images', 'Luminance captures detail'],
      },
      {
        id: 'start-sequence',
        title: 'Start the Sequence',
        description: 'Begin automated imaging',
        instruction: 'Review settings and click "Start Sequence"',
        targetElement: 'start-sequence-btn',
        interactionType: 'click',
        completed: false,
        optional: false,
        tips: ['Monitor progress regularly', 'Check for clouds or wind'],
      },
    ],
  },
];

// Tutorial overlay component
function TutorialOverlay({ 
  step, 
  onNext, 
  onPrevious, 
  onSkip, 
  onExit,
  currentStepIndex,
  totalSteps 
}: {
  step: TutorialStep;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onExit: () => void;
  currentStepIndex: number;
  totalSteps: number;
}) {
  const [showTips, setShowTips] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      {/* Highlight area */}
      {step.highlightArea && (
        <div
          className="absolute border-2 border-primary rounded-lg shadow-lg"
          style={{
            left: step.highlightArea.x,
            top: step.highlightArea.y,
            width: step.highlightArea.width,
            height: step.highlightArea.height,
          }}
        />
      )}

      {/* Tutorial card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4"
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Step {currentStepIndex + 1} of {totalSteps}
                </Badge>
                {step.optional && (
                  <Badge variant="secondary">Optional</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onExit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-lg">{step.title}</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{step.description}</p>
            
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.interactionType === 'click' && <MousePointer className="h-3 w-3" />}
                  {step.interactionType === 'drag' && <Hand className="h-3 w-3" />}
                  {step.interactionType === 'input' && <Settings className="h-3 w-3" />}
                  {step.interactionType === 'observe' && <Eye className="h-3 w-3" />}
                </div>
                <p className="text-sm font-medium">{step.instruction}</p>
              </div>
            </div>

            {step.tips && step.tips.length > 0 && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTips(!showTips)}
                  className="flex items-center gap-2 text-xs"
                >
                  <Lightbulb className="h-3 w-3" />
                  {showTips ? 'Hide Tips' : 'Show Tips'}
                </Button>
                
                <AnimatePresence>
                  {showTips && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1"
                    >
                      {step.tips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {step.optional && (
                  <Button variant="ghost" size="sm" onClick={onSkip}>
                    Skip
                  </Button>
                )}
                <Button
                  onClick={onNext}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {currentStepIndex === totalSteps - 1 ? 'Complete' : 'Next'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Main interactive tutorials component
export function InteractiveTutorials({ 
  className, 
  tutorialId, 
  onComplete, 
  onExit 
}: InteractiveTutorialsProps) {
  const {
    highlightElement,
    clearHighlight,
    userProfile,
  } = useOnboardingStore();

  const { announce } = useAccessibility();
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Initialize tutorial
  useEffect(() => {
    if (tutorialId) {
      const tutorial = sampleTutorials.find(t => t.id === tutorialId);
      if (tutorial) {
        setCurrentTutorial(tutorial);
        setIsActive(true);
        announce(`Starting tutorial: ${tutorial.title}`);
      }
    }
  }, [tutorialId, announce]);

  // Handle step navigation
  const handleNext = useCallback(() => {
    if (!currentTutorial) return;

    const currentStep = currentTutorial.steps[currentStepIndex];
    
    // Mark step as completed
    setCompletedSteps(prev => [...prev, currentStep.id]);
    
    if (currentStepIndex < currentTutorial.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      announce(`Moving to step ${currentStepIndex + 2}`);
    } else {
      // Tutorial completed
      handleComplete();
    }
  }, [currentTutorial, currentStepIndex, announce]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      announce(`Moving to step ${currentStepIndex}`);
    }
  }, [currentStepIndex, announce]);

  const handleSkip = useCallback(() => {
    if (!currentTutorial) return;
    
    const currentStep = currentTutorial.steps[currentStepIndex];
    announce(`Skipped step: ${currentStep.title}`);
    handleNext();
  }, [currentTutorial, currentStepIndex, handleNext, announce]);

  const handleComplete = useCallback(() => {
    if (!currentTutorial) return;
    
    setIsActive(false);
    clearHighlight();
    announce(`Tutorial completed: ${currentTutorial.title}`);
    onComplete?.();
  }, [currentTutorial, clearHighlight, announce, onComplete]);

  const handleExit = useCallback(() => {
    setIsActive(false);
    clearHighlight();
    announce('Tutorial exited');
    onExit?.();
  }, [clearHighlight, announce, onExit]);

  // Tutorial selection screen
  if (!currentTutorial || !isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("space-y-6", className)}
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Interactive Tutorials</h2>
          <p className="text-lg text-muted-foreground">
            Learn by doing with hands-on, interactive tutorials
          </p>
        </div>

        <div className="grid gap-4 max-w-4xl mx-auto">
          {sampleTutorials
            .filter(tutorial => {
              // Filter based on user experience level
              if (!userProfile) return true;
              
              if (userProfile.experienceLevel === 'beginner' && tutorial.difficulty === 'advanced') {
                return false;
              }
              
              return true;
            })
            .map((tutorial) => (
              <Card key={tutorial.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {tutorial.category === 'equipment' && <Camera className="h-5 w-5 text-primary" />}
                          {tutorial.category === 'imaging' && <Target className="h-5 w-5 text-primary" />}
                          {tutorial.category === 'navigation' && <Settings className="h-5 w-5 text-primary" />}
                          {tutorial.category === 'advanced' && <Zap className="h-5 w-5 text-primary" />}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold">{tutorial.title}</h3>
                          <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {tutorial.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {tutorial.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            ~{tutorial.estimatedTime} min
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {tutorial.steps.length} steps
                          </Badge>
                        </div>
                      </div>

                      {tutorial.prerequisites && tutorial.prerequisites.length > 0 && (
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Prerequisites: {tutorial.prerequisites.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => {
                        setCurrentTutorial(tutorial);
                        setCurrentStepIndex(0);
                        setIsActive(true);
                        setCompletedSteps([]);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Start Tutorial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </motion.div>
    );
  }

  // Active tutorial overlay
  const currentStep = currentTutorial.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / currentTutorial.steps.length) * 100;

  return (
    <>
      {/* Progress indicator */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
        <Card className="px-4 py-2">
          <div className="flex items-center gap-3 min-w-64">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{currentTutorial.title}</span>
                <span className="text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tutorial overlay */}
      <AnimatePresence>
        {isActive && (
          <TutorialOverlay
            step={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onExit={handleExit}
            currentStepIndex={currentStepIndex}
            totalSteps={currentTutorial.steps.length}
          />
        )}
      </AnimatePresence>
    </>
  );
}
