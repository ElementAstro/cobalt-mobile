"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TargetRecommendationEngine, 
  TargetRecommendation, 
  UserPreferences, 
  RecommendationContext 
} from '@/lib/targets/recommendation-engine';
import { TargetOptimizer, OptimizedSession } from '@/lib/targets/target-optimizer';
import { useTargetPlanningStore } from '@/lib/stores/target-planning-store';
import { useEquipmentStore } from '@/lib/stores/equipment-store';
import { useWeatherStore } from '@/lib/stores/weather-store';
import { cn } from '@/lib/utils';
import {
  Target,
  Star,
  Clock,
  Filter,
  Telescope,
  MapPin,
  TrendingUp,
  Lightbulb,
  Calendar,
  Zap,
  Eye,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface DiscoveryAssistantProps {
  className?: string;
  equipment?: any[];
  availableTargets?: any[];
}

export function DiscoveryAssistant({ className, equipment, availableTargets }: DiscoveryAssistantProps) {
  const [selectedTab, setSelectedTab] = useState('recommendations');
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    experienceLevel: 'intermediate',
    preferredTargetTypes: ['galaxy', 'emission nebula'],
    favoriteConstellations: ['Orion', 'Andromeda', 'Cygnus'],
    imagingGoals: ['deepsky', 'widefield'],
    timeAvailable: 240, // 4 hours
    difficultyPreference: 'moderate',
    colorPreference: 'mixed'
  });
  const [recommendations, setRecommendations] = useState<TargetRecommendation[]>([]);
  const [optimizedSession, setOptimizedSession] = useState<OptimizedSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Store hooks
  const { availableTargets: storeTargets, currentObservatory } = useTargetPlanningStore();
  const { equipmentStatus } = useEquipmentStore();
  const { currentWeather, astronomicalConditions } = useWeatherStore();

  // Use props if available, otherwise fall back to store
  const effectiveTargets = availableTargets || storeTargets;
  const effectiveEquipment = equipment?.[0] || null;

  // Initialize recommendation engine
  const recommendationEngine = useMemo(() =>
    new TargetRecommendationEngine(effectiveTargets),
    [effectiveTargets]
  );

  // Initialize target optimizer
  const targetOptimizer = useMemo(() =>
    new TargetOptimizer({
      latitude: currentObservatory?.latitude || 40.7128,
      longitude: currentObservatory?.longitude || -74.0060,
      timezone: currentObservatory?.timezone || 'America/New_York'
    }),
    [currentObservatory]
  );

  // Generate recommendations when preferences change
  useEffect(() => {
    generateRecommendations();
  }, [userPreferences, effectiveEquipment, currentWeather]);

  const generateRecommendations = async (customPreferences?: UserPreferences) => {
    if (!effectiveEquipment) return;

    setIsLoading(true);
    try {
      const prefs = customPreferences || userPreferences;
      const context: RecommendationContext = {
        userPreferences: prefs,
        equipment: effectiveEquipment,
        location: {
          latitude: currentObservatory?.latitude || 40.7128,
          longitude: currentObservatory?.longitude || -74.0060,
          timezone: currentObservatory?.timezone || 'America/New_York'
        },
        currentDate: new Date(),
        weather: currentWeather || undefined,
        astronomical: astronomicalConditions || undefined,
        sessionDuration: prefs.timeAvailable
      };

      const newRecommendations = await recommendationEngine.getRecommendations(context, 10);
      setRecommendations(newRecommendations);

      // Generate optimized session
      if (newRecommendations.length > 0) {
        const sessionStart = new Date();
        sessionStart.setHours(20, 0, 0, 0); // 8 PM start
        const sessionEnd = new Date(sessionStart.getTime() + prefs.timeAvailable * 60 * 1000);

        const optimized = targetOptimizer.optimizeSession(
          newRecommendations.slice(0, 5).map(r => r.target),
          effectiveEquipment,
          sessionStart,
          sessionEnd,
          {
            maxImagingTime: 180,
            minTargetAltitude: 30,
            maxAirmass: 2.5,
            moonAvoidanceAngle: 30,
            prioritizeNewTargets: true,
            balanceTargetTypes: true,
            considerWeather: true
          },
          currentWeather || undefined,
          astronomicalConditions || undefined
        );

        setOptimizedSession(optimized);
      }
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'challenging': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'expert': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const RecommendationCard = ({ recommendation }: { recommendation: TargetRecommendation }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              {recommendation.target.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {recommendation.target.type} in {recommendation.target.constellation}
            </p>
          </div>
          <div className="text-right">
            <div className={cn("text-2xl font-bold", getScoreColor(recommendation.score))}>
              {Math.round(recommendation.score)}
            </div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge className={getDifficultyColor(recommendation.difficulty)}>
            {recommendation.difficulty}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {Math.round(recommendation.estimatedImagingTime / 60)}h
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {recommendation.equipmentSuitability}% match
          </Badge>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Why this target?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {recommendation.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {recommendation.learningOpportunities.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Learning Opportunities
            </h4>
            <div className="flex flex-wrap gap-1">
              {recommendation.learningOpportunities.map((opportunity, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {opportunity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <div className="text-xs text-muted-foreground">Optimal Filters</div>
            <div className="text-sm font-medium">
              {recommendation.optimalFilters.join(', ')}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Weather Suitability</div>
            <div className="flex items-center gap-2">
              <Progress value={recommendation.weatherSuitability} className="flex-1" />
              <span className="text-sm font-medium">{recommendation.weatherSuitability}%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            Add to Session
          </Button>
          <Button size="sm" variant="outline">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Target Discovery Assistant</h2>
          <p className="text-muted-foreground">
            AI-powered recommendations tailored to your equipment and preferences
          </p>
        </div>
        <Button onClick={generateRecommendations} disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="session">Session Plan</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : recommendations.length > 0 ? (
            <ScrollArea className="h-[600px]">
              {recommendations.map((recommendation, index) => (
                <RecommendationCard key={index} recommendation={recommendation} />
              ))}
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No recommendations available</h3>
                  <p className="text-muted-foreground mb-4">
                    Adjust your preferences or check your equipment setup
                  </p>
                  <Button onClick={generateRecommendations}>
                    Generate Recommendations
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          {optimizedSession ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Optimized Session Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {optimizedSession.targets.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Targets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(optimizedSession.totalDuration / 60)}h
                      </div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(optimizedSession.qualityScore)}
                      </div>
                      <div className="text-xs text-muted-foreground">Quality</div>
                    </div>
                  </div>

                  <Progress value={optimizedSession.estimatedCompletion} className="mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    {Math.round(optimizedSession.estimatedCompletion)}% of available time utilized
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {optimizedSession.targets.map((target, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{target.target.name}</h4>
                        <Badge variant="outline">
                          Priority {target.priority}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Time: </span>
                          {target.startTime.toLocaleTimeString()} - {target.endTime.toLocaleTimeString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration: </span>
                          {Math.round(target.duration)}min
                        </div>
                        <div>
                          <span className="text-muted-foreground">Altitude: </span>
                          {Math.round(target.altitude)}°
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quality: </span>
                          <span className={getScoreColor(target.qualityPrediction)}>
                            {Math.round(target.qualityPrediction)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {optimizedSession.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {optimizedSession.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No session plan available</h3>
                  <p className="text-muted-foreground">
                    Generate recommendations first to create an optimized session plan
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Preferences</CardTitle>
              <p className="text-sm text-muted-foreground">
                Adjust these settings to get better personalized recommendations
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Experience Level */}
              <div>
                <h4 className="text-sm font-medium mb-3">Experience Level</h4>
                <div className="flex gap-2">
                  {['beginner', 'intermediate', 'advanced'].map((level) => (
                    <Button
                      key={level}
                      variant={userPreferences.experienceLevel === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newPrefs = { ...userPreferences, experienceLevel: level as any };
                        setUserPreferences(newPrefs);
                        // Trigger recommendation regeneration
                        if (equipment && availableTargets) {
                          generateRecommendations(newPrefs);
                        }
                      }}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Preferred Targets */}
              <div>
                <h4 className="text-sm font-medium mb-3">Preferred Targets</h4>
                <div className="flex flex-wrap gap-2">
                  {['galaxy', 'emission nebula', 'planetary nebula', 'star cluster', 'double star'].map((type) => (
                    <Button
                      key={type}
                      variant={userPreferences.preferredTargetTypes.includes(type) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newTypes = userPreferences.preferredTargetTypes.includes(type)
                          ? userPreferences.preferredTargetTypes.filter(t => t !== type)
                          : [...userPreferences.preferredTargetTypes, type];
                        const newPrefs = { ...userPreferences, preferredTargetTypes: newTypes };
                        setUserPreferences(newPrefs);
                        if (equipment && availableTargets) {
                          generateRecommendations(newPrefs);
                        }
                      }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Imaging Goals */}
              <div>
                <h4 className="text-sm font-medium mb-3">Imaging Goals</h4>
                <div className="flex flex-wrap gap-2">
                  {['deepsky', 'widefield', 'planetary', 'lunar', 'solar'].map((goal) => (
                    <Button
                      key={goal}
                      variant={userPreferences.imagingGoals.includes(goal) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newGoals = userPreferences.imagingGoals.includes(goal)
                          ? userPreferences.imagingGoals.filter(g => g !== goal)
                          : [...userPreferences.imagingGoals, goal];
                        const newPrefs = { ...userPreferences, imagingGoals: newGoals };
                        setUserPreferences(newPrefs);
                        if (equipment && availableTargets) {
                          generateRecommendations(newPrefs);
                        }
                      }}
                    >
                      {goal.charAt(0).toUpperCase() + goal.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
