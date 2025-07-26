"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore, UserOnboardingProfile } from '@/lib/stores/onboarding-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';
import {
  User,
  Star,
  Camera,
  Telescope,
  Filter,
  Target,
  Clock,
  BookOpen,
  Eye,
  Hand,
  Play,
  Zap,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Lightbulb,
  Mountain,
  Sparkles,
} from 'lucide-react';

interface ProfileSetupProps {
  className?: string;
  onComplete?: (profile: UserOnboardingProfile) => void;
  onPrevious?: () => void;
}

// Experience level options
const experienceLevels = [
  {
    value: 'beginner' as const,
    title: 'Beginner',
    description: 'New to astrophotography, learning the basics',
    icon: Lightbulb,
    color: 'from-green-500 to-green-600',
    features: ['Guided tutorials', 'Simple workflows', 'Equipment recommendations'],
  },
  {
    value: 'intermediate' as const,
    title: 'Intermediate',
    description: 'Some experience, ready for advanced features',
    icon: Mountain,
    color: 'from-blue-500 to-blue-600',
    features: ['Advanced automation', 'Custom sequences', 'Performance optimization'],
  },
  {
    value: 'advanced' as const,
    title: 'Advanced',
    description: 'Expert user, wants full control and customization',
    icon: Sparkles,
    color: 'from-purple-500 to-purple-600',
    features: ['Full customization', 'API access', 'Advanced scripting'],
  },
];

// Equipment types
const equipmentTypes = [
  { id: 'dslr', label: 'DSLR Camera', icon: Camera, category: 'camera' },
  { id: 'ccd', label: 'CCD Camera', icon: Camera, category: 'camera' },
  { id: 'cmos', label: 'CMOS Camera', icon: Camera, category: 'camera' },
  { id: 'eq-mount', label: 'Equatorial Mount', icon: Telescope, category: 'mount' },
  { id: 'alt-az', label: 'Alt-Az Mount', icon: Telescope, category: 'mount' },
  { id: 'filter-wheel', label: 'Filter Wheel', icon: Filter, category: 'accessory' },
  { id: 'focuser', label: 'Auto Focuser', icon: Target, category: 'accessory' },
  { id: 'guide-scope', label: 'Guide Scope', icon: Telescope, category: 'accessory' },
];

// Primary goals
const primaryGoals = [
  { id: 'learn', label: 'Learn Astrophotography', icon: BookOpen },
  { id: 'automate', label: 'Automate Equipment', icon: Zap },
  { id: 'capture', label: 'Capture Better Images', icon: Camera },
  { id: 'plan', label: 'Plan Imaging Sessions', icon: Target },
  { id: 'share', label: 'Share with Community', icon: Star },
  { id: 'experiment', label: 'Experiment & Explore', icon: Sparkles },
];

// Learning styles
const learningStyles = [
  {
    value: 'visual' as const,
    title: 'Visual Learner',
    description: 'Learn best with diagrams, videos, and visual guides',
    icon: Eye,
  },
  {
    value: 'hands-on' as const,
    title: 'Hands-On Learner',
    description: 'Prefer to learn by doing and experimenting',
    icon: Hand,
  },
  {
    value: 'guided' as const,
    title: 'Guided Learning',
    description: 'Like step-by-step instructions and structured lessons',
    icon: Play,
  },
  {
    value: 'self-paced' as const,
    title: 'Self-Paced',
    description: 'Prefer to explore and learn at your own pace',
    icon: BookOpen,
  },
];

export function ProfileSetup({ className, onComplete, onPrevious }: ProfileSetupProps) {
  const { updateUserProfile } = useOnboardingStore();
  const { announce } = useAccessibility();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserOnboardingProfile>>({
    experienceLevel: 'beginner',
    interests: [],
    equipmentTypes: [],
    primaryGoals: [],
    timeAvailable: 15,
    preferredLearningStyle: 'guided',
  });

  const steps = [
    'Experience Level',
    'Equipment',
    'Goals & Interests',
    'Learning Preferences',
  ];

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      announce(`Moving to ${steps[currentStep + 1]}`);
    } else {
      // Complete profile setup
      const completeProfile = profile as UserOnboardingProfile;
      updateUserProfile(completeProfile);
      onComplete?.(completeProfile);
      announce('Profile setup completed');
    }
  }, [currentStep, steps, profile, updateUserProfile, onComplete, announce]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      announce(`Moving to ${steps[currentStep - 1]}`);
    } else {
      onPrevious?.();
    }
  }, [currentStep, steps, onPrevious, announce]);

  const updateProfile = useCallback((updates: Partial<UserOnboardingProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleArrayItem = useCallback((array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  }, []);

  const isStepValid = useCallback(() => {
    switch (currentStep) {
      case 0: return !!profile.experienceLevel;
      case 1: return (profile.equipmentTypes?.length || 0) > 0;
      case 2: return (profile.primaryGoals?.length || 0) > 0;
      case 3: return !!profile.preferredLearningStyle;
      default: return true;
    }
  }, [currentStep, profile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("max-w-4xl mx-auto space-y-8", className)}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <User className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold">Tell Us About Yourself</h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Help us customize your Cobalt Mobile experience
        </p>
        
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                index <= currentStep 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {index < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-12 h-0.5 mx-2 transition-all",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
        </p>
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Experience Level */}
            {currentStep === 0 && (
              <motion.div
                key="experience"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold">What's your experience level?</h3>
                  <p className="text-muted-foreground">
                    This helps us tailor the interface and tutorials to your needs
                  </p>
                </div>

                <div className="grid gap-4 max-w-3xl mx-auto">
                  {experienceLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => updateProfile({ experienceLevel: level.value })}
                      className={cn(
                        "p-6 rounded-xl border-2 transition-all text-left",
                        "hover:border-primary/50 hover:bg-primary/5",
                        profile.experienceLevel === level.value
                          ? "border-primary bg-primary/10"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center",
                          level.color
                        )}>
                          <level.icon className="h-6 w-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold mb-1">{level.title}</h4>
                          <p className="text-muted-foreground mb-3">{level.description}</p>
                          
                          <div className="flex flex-wrap gap-2">
                            {level.features.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {profile.experienceLevel === level.value && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Equipment */}
            {currentStep === 1 && (
              <motion.div
                key="equipment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold">What equipment do you use?</h3>
                  <p className="text-muted-foreground">
                    Select all that apply - we'll optimize the interface for your setup
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {equipmentTypes.map((equipment) => {
                    const isSelected = profile.equipmentTypes?.includes(equipment.id) || false;
                    
                    return (
                      <button
                        key={equipment.id}
                        onClick={() => updateProfile({
                          equipmentTypes: toggleArrayItem(profile.equipmentTypes || [], equipment.id)
                        })}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-center space-y-3",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 mx-auto rounded-lg flex items-center justify-center",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <equipment.icon className="h-6 w-6" />
                        </div>
                        
                        <div>
                          <p className="font-medium text-sm">{equipment.label}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {equipment.category}
                          </Badge>
                        </div>
                        
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 mx-auto text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Selected: {profile.equipmentTypes?.length || 0} items
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Goals & Interests */}
            {currentStep === 2 && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold">What are your primary goals?</h3>
                  <p className="text-muted-foreground">
                    Help us understand what you want to achieve with astrophotography
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  {primaryGoals.map((goal) => {
                    const isSelected = profile.primaryGoals?.includes(goal.id) || false;
                    
                    return (
                      <button
                        key={goal.id}
                        onClick={() => updateProfile({
                          primaryGoals: toggleArrayItem(profile.primaryGoals || [], goal.id)
                        })}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-left",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            <goal.icon className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium">{goal.label}</p>
                          </div>
                          
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="text-center">
                    <Label className="text-base font-medium">
                      How much time do you want to spend on onboarding?
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      We'll adjust the tutorial length accordingly
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Slider
                      value={[profile.timeAvailable || 15]}
                      onValueChange={([value]) => updateProfile({ timeAvailable: value })}
                      max={60}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>5 min (Quick start)</span>
                      <span className="font-medium text-foreground">
                        {profile.timeAvailable || 15} minutes
                      </span>
                      <span>60 min (Comprehensive)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Learning Preferences */}
            {currentStep === 3 && (
              <motion.div
                key="learning"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold">How do you prefer to learn?</h3>
                  <p className="text-muted-foreground">
                    We'll customize the tutorials to match your learning style
                  </p>
                </div>

                <div className="grid gap-4 max-w-2xl mx-auto">
                  {learningStyles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => updateProfile({ preferredLearningStyle: style.value })}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left",
                        "hover:border-primary/50 hover:bg-primary/5",
                        profile.preferredLearningStyle === style.value
                          ? "border-primary bg-primary/10"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          profile.preferredLearningStyle === style.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}>
                          <style.icon className="h-6 w-6" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{style.title}</h4>
                          <p className="text-sm text-muted-foreground">{style.description}</p>
                        </div>
                        
                        {profile.preferredLearningStyle === style.value && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {currentStep === 0 ? 'Back' : 'Previous'}
        </Button>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            ~{Math.max(1, Math.ceil((steps.length - currentStep) * 2))} min remaining
          </span>
        </div>

        <Button
          onClick={handleNext}
          disabled={!isStepValid()}
          className="flex items-center gap-2"
        >
          {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
