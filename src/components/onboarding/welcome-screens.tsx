"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';
import {
  Telescope,
  Camera,
  Target,
  Settings,
  Star,
  ChevronRight,
  ChevronLeft,
  Play,
  SkipForward,
  CheckCircle,
  Sparkles,
  Zap,
  Shield,
  Smartphone,
  Globe,
  Users,
} from 'lucide-react';

interface WelcomeScreensProps {
  className?: string;
  onComplete?: () => void;
}

// Welcome intro screen
function WelcomeIntro({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-8"
    >
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center"
        >
          <Telescope className="h-12 w-12 text-white" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to Cobalt Mobile
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Your Advanced Astrophotography Control Platform
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-6"
      >
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Take control of your astrophotography equipment with precision and ease. 
          From camera control to sequence automation, we've got everything you need 
          to capture the cosmos.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {[
            { icon: Camera, label: 'Equipment Control', color: 'text-blue-500' },
            { icon: Target, label: 'Sequence Planning', color: 'text-green-500' },
            { icon: Star, label: 'Target Database', color: 'text-yellow-500' },
            { icon: Settings, label: 'Automation', color: 'text-purple-500' },
          ].map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="text-center space-y-2"
            >
              <div className={cn("mx-auto w-12 h-12 rounded-lg bg-muted flex items-center justify-center", feature.color)}>
                <feature.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">{feature.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex justify-center"
      >
        <Button onClick={onNext} size="lg" className="flex items-center gap-2">
          Get Started
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

// App overview screen
function AppOverview({ onNext, onPrevious }: { onNext: () => void; onPrevious: () => void }) {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    {
      icon: Camera,
      title: 'Equipment Control',
      description: 'Connect and control your cameras, mounts, filter wheels, and focusers with intuitive interfaces.',
      highlights: ['Real-time status monitoring', 'Automated calibration', 'Custom profiles'],
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Target,
      title: 'Sequence Planning',
      description: 'Create sophisticated imaging sequences with intelligent automation and optimization.',
      highlights: ['AI-powered suggestions', 'Weather integration', 'Multi-target sessions'],
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Star,
      title: 'Target Database',
      description: 'Access a comprehensive database of celestial objects with detailed information and imaging tips.',
      highlights: ['10,000+ objects', 'Visibility predictions', 'Imaging recommendations'],
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: Zap,
      title: 'Smart Automation',
      description: 'Let the app handle complex workflows while you focus on the creative aspects of astrophotography.',
      highlights: ['Meridian flips', 'Focus automation', 'Weather monitoring'],
      color: 'from-purple-500 to-purple-600',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  const currentFeatureData = features[currentFeature];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Powerful Features at Your Fingertips</h2>
        <p className="text-lg text-muted-foreground">
          Discover what makes Cobalt Mobile the ultimate astrophotography companion
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Feature showcase */}
              <div className="p-8 space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className={cn("w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center", currentFeatureData.color)}>
                      <currentFeatureData.icon className="h-8 w-8 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{currentFeatureData.title}</h3>
                      <p className="text-muted-foreground">{currentFeatureData.description}</p>
                    </div>

                    <div className="space-y-2">
                      {currentFeatureData.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Feature navigation */}
              <div className="bg-muted/30 p-8 space-y-4">
                <h4 className="font-semibold mb-4">All Features</h4>
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-all duration-200",
                        "hover:bg-background/50",
                        index === currentFeature 
                          ? "bg-background shadow-sm border" 
                          : "hover:bg-background/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          index === currentFeature 
                            ? `bg-gradient-to-br ${feature.color}` 
                            : "bg-muted"
                        )}>
                          <feature.icon className={cn(
                            "h-4 w-4",
                            index === currentFeature ? "text-white" : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{feature.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFeature(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentFeature ? "bg-primary w-6" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        <Button onClick={onNext} className="flex items-center gap-2">
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Main welcome screens component
export function WelcomeScreens({ className, onComplete }: WelcomeScreensProps) {
  const {
    currentFlow,
    currentStepIndex,
    isOnboardingActive,
    nextStep,
    previousStep,
    skipStep,
    completeStep,
    startOnboarding,
  } = useOnboardingStore();

  const { announce } = useAccessibility();
  const [canSkip, setCanSkip] = useState(true);

  // Start welcome flow if not already active
  useEffect(() => {
    if (!isOnboardingActive) {
      startOnboarding('welcome');
    }
  }, [isOnboardingActive, startOnboarding]);

  const handleNext = useCallback(() => {
    completeStep();
    nextStep();
    announce('Moving to next step');
  }, [completeStep, nextStep, announce]);

  const handlePrevious = useCallback(() => {
    previousStep();
    announce('Moving to previous step');
  }, [previousStep, announce]);

  const handleSkip = useCallback(() => {
    skipStep();
    announce('Step skipped');
  }, [skipStep, announce]);

  const handleComplete = useCallback(() => {
    completeStep();
    onComplete?.();
    announce('Welcome completed');
  }, [completeStep, onComplete, announce]);

  if (!currentFlow || !isOnboardingActive) {
    return null;
  }

  const currentStep = currentFlow.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / currentFlow.steps.length) * 100;
  const isLastStep = currentStepIndex === currentFlow.steps.length - 1;

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-background to-muted/20 flex flex-col", className)}>
      {/* Progress header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{currentFlow.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Step {currentStepIndex + 1} of {currentFlow.steps.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {canSkip && !isLastStep && (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </Button>
              )}
              <Badge variant="outline">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
          </div>
          
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {currentStep?.component === 'WelcomeIntro' && (
              <WelcomeIntro key="intro" onNext={handleNext} />
            )}
            {currentStep?.component === 'AppOverview' && (
              <AppOverview 
                key="overview" 
                onNext={isLastStep ? handleComplete : handleNext}
                onPrevious={handlePrevious}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span>Mobile Optimized</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Community Driven</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Available Worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
