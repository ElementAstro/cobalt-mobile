"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { UserPreferences } from '@/lib/targets/recommendation-engine';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  User,
  Settings,
  Calendar,
  CheckCircle,
  Star,
  Telescope,
  Clock,
  MapPin
} from 'lucide-react';

interface PlanningWizardProps {
  onComplete: (preferences: UserPreferences) => void;
  onCancel: () => void;
  className?: string;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const wizardSteps: WizardStep[] = [
  {
    id: 'experience',
    title: 'Experience Level',
    description: 'Tell us about your astrophotography experience',
    icon: User
  },
  {
    id: 'preferences',
    title: 'Target Preferences',
    description: 'What types of objects do you like to image?',
    icon: Target
  },
  {
    id: 'equipment',
    title: 'Equipment & Time',
    description: 'Configure your session parameters',
    icon: Settings
  },
  {
    id: 'goals',
    title: 'Imaging Goals',
    description: 'What are you hoping to achieve?',
    icon: Star
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Review your preferences before generating recommendations',
    icon: CheckCircle
  }
];

export function PlanningWizard({ onComplete, onCancel, className }: PlanningWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    experienceLevel: 'intermediate',
    preferredTargetTypes: [],
    favoriteConstellations: [],
    imagingGoals: [],
    timeAvailable: 240,
    difficultyPreference: 'moderate',
    colorPreference: 'mixed'
  });

  const targetTypes = [
    'galaxy', 'emission nebula', 'reflection nebula', 'planetary nebula',
    'star cluster', 'double star', 'planet', 'moon', 'comet', 'asteroid'
  ];

  const constellations = [
    'Andromeda', 'Orion', 'Cygnus', 'Cassiopeia', 'Ursa Major', 'Leo',
    'Virgo', 'Sagittarius', 'Scorpius', 'Perseus', 'Auriga', 'Gemini'
  ];

  const imagingGoals = [
    { id: 'widefield', label: 'Wide Field', description: 'Large star fields and constellations' },
    { id: 'deepsky', label: 'Deep Sky', description: 'Galaxies, nebulae, and clusters' },
    { id: 'planetary', label: 'Planetary', description: 'Planets and lunar imaging' },
    { id: 'lunar', label: 'Lunar', description: 'Moon surface details' },
    { id: 'solar', label: 'Solar', description: 'Sun observation (with proper filters)' }
  ];

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(preferences);
  };

  const renderStepContent = () => {
    const step = wizardSteps[currentStep];

    switch (step.id) {
      case 'experience':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">What's your experience level with astrophotography?</Label>
              <p className="text-sm text-muted-foreground mt-1">
                This helps us recommend targets appropriate for your skill level
              </p>
            </div>
            
            <div className="grid gap-3">
              {[
                { value: 'beginner', label: 'Beginner', description: 'New to astrophotography, learning the basics' },
                { value: 'intermediate', label: 'Intermediate', description: 'Some experience, comfortable with basic techniques' },
                { value: 'advanced', label: 'Advanced', description: 'Experienced, looking for challenging targets' }
              ].map((level) => (
                <Card 
                  key={level.value}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    preferences.experienceLevel === level.value && "ring-2 ring-primary"
                  )}
                  onClick={() => updatePreferences({ experienceLevel: level.value as any })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        preferences.experienceLevel === level.value 
                          ? "bg-primary border-primary" 
                          : "border-muted-foreground"
                      )} />
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-muted-foreground">{level.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Preferred difficulty level</Label>
              <Select 
                value={preferences.difficultyPreference} 
                onValueChange={(value) => updatePreferences({ difficultyPreference: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy - Bright, large targets</SelectItem>
                  <SelectItem value="moderate">Moderate - Balanced challenge</SelectItem>
                  <SelectItem value="challenging">Challenging - Faint, complex targets</SelectItem>
                  <SelectItem value="expert">Expert - Most difficult targets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">What types of objects interest you most?</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select all that apply - we'll prioritize these in our recommendations
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {targetTypes.map((type) => (
                <Card
                  key={type}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    preferences.preferredTargetTypes.includes(type) && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    const updated = preferences.preferredTargetTypes.includes(type)
                      ? preferences.preferredTargetTypes.filter(t => t !== type)
                      : [...preferences.preferredTargetTypes, type];
                    updatePreferences({ preferredTargetTypes: updated });
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center",
                        preferences.preferredTargetTypes.includes(type)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      )}>
                        {preferences.preferredTargetTypes.includes(type) && (
                          <CheckCircle className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm font-medium capitalize">{type}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <div>
              <Label className="text-base font-medium">Favorite constellations</Label>
              <p className="text-sm text-muted-foreground mt-1">
                We'll prioritize targets in these areas of the sky
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {constellations.map((constellation) => (
                <Card
                  key={constellation}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    preferences.favoriteConstellations.includes(constellation) && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    const updated = preferences.favoriteConstellations.includes(constellation)
                      ? preferences.favoriteConstellations.filter(c => c !== constellation)
                      : [...preferences.favoriteConstellations, constellation];
                    updatePreferences({ favoriteConstellations: updated });
                  }}
                >
                  <CardContent className="p-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded border",
                        preferences.favoriteConstellations.includes(constellation)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      )} />
                      <span className="text-xs font-medium">{constellation}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Color preference</Label>
              <Select 
                value={preferences.colorPreference} 
                onValueChange={(value) => updatePreferences({ colorPreference: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emission">Emission nebulae (red/pink)</SelectItem>
                  <SelectItem value="reflection">Reflection nebulae (blue)</SelectItem>
                  <SelectItem value="planetary">Planetary nebulae (varied)</SelectItem>
                  <SelectItem value="mixed">Mixed - all types</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'equipment':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Available imaging time</Label>
              <p className="text-sm text-muted-foreground mt-1">
                How long do you typically have for an imaging session?
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Time available</span>
                <span className="text-sm font-medium">
                  {Math.round(preferences.timeAvailable / 60)} hours {preferences.timeAvailable % 60} minutes
                </span>
              </div>
              <Slider
                value={[preferences.timeAvailable]}
                onValueChange={([value]) => updatePreferences({ timeAvailable: value })}
                min={60}
                max={480}
                step={30}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 hour</span>
                <span>8 hours</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-medium">Session preferences</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="prioritize-new">Prioritize new targets</Label>
                    <p className="text-xs text-muted-foreground">Focus on targets you haven't imaged before</p>
                  </div>
                  <Switch id="prioritize-new" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="balance-types">Balance target types</Label>
                    <p className="text-xs text-muted-foreground">Mix different types of objects in sessions</p>
                  </div>
                  <Switch id="balance-types" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="consider-weather">Consider weather</Label>
                    <p className="text-xs text-muted-foreground">Factor in current weather conditions</p>
                  </div>
                  <Switch id="consider-weather" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">What are your imaging goals?</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select the types of imaging you're most interested in
              </p>
            </div>

            <div className="space-y-3">
              {imagingGoals.map((goal) => (
                <Card
                  key={goal.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    preferences.imagingGoals.includes(goal.id as any) && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    const updated = preferences.imagingGoals.includes(goal.id as any)
                      ? preferences.imagingGoals.filter(g => g !== goal.id)
                      : [...preferences.imagingGoals, goal.id as any];
                    updatePreferences({ imagingGoals: updated });
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5",
                        preferences.imagingGoals.includes(goal.id as any)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      )}>
                        {preferences.imagingGoals.includes(goal.id as any) && (
                          <CheckCircle className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{goal.label}</div>
                        <div className="text-sm text-muted-foreground">{goal.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <Label htmlFor="notes" className="text-base font-medium">Additional notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific targets you're interested in, or other preferences..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Review Your Preferences</h3>
              <p className="text-sm text-muted-foreground">
                Make sure everything looks correct before we generate your personalized recommendations
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Experience Level</Label>
                      <p className="text-sm text-muted-foreground capitalize">{preferences.experienceLevel}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Difficulty Preference</Label>
                      <p className="text-sm text-muted-foreground capitalize">{preferences.difficultyPreference}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Available Time</Label>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(preferences.timeAvailable / 60)}h {preferences.timeAvailable % 60}m
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Color Preference</Label>
                      <p className="text-sm text-muted-foreground capitalize">{preferences.colorPreference}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-medium">Preferred Target Types</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {preferences.preferredTargetTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs capitalize">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-medium">Favorite Constellations</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {preferences.favoriteConstellations.map((constellation) => (
                      <Badge key={constellation} variant="outline" className="text-xs">
                        {constellation}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-medium">Imaging Goals</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {preferences.imagingGoals.map((goal) => (
                      <Badge key={goal} variant="secondary" className="text-xs capitalize">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepData = wizardSteps[currentStep];
  const progress = ((currentStep + 1) / wizardSteps.length) * 100;

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <currentStepData.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{currentStepData.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep + 1} of {wizardSteps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStepContent()}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? onCancel : prevStep}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {currentStep === 0 ? 'Cancel' : 'Previous'}
            </Button>

            <Button
              onClick={currentStep === wizardSteps.length - 1 ? handleComplete : nextStep}
              className="flex items-center gap-2"
            >
              {currentStep === wizardSteps.length - 1 ? 'Generate Recommendations' : 'Next'}
              {currentStep !== wizardSteps.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
