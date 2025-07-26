"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Info,
  Star,
  Play,
  Save,
  Download,
  Upload,
  Zap,
  Moon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { simulationEngine, EnvironmentalConditions } from '@/lib/simulation-engine';

interface Target {
  id: string;
  name: string;
  ra: string;
  dec: string;
  type: 'galaxy' | 'nebula' | 'star_cluster' | 'planetary' | 'double_star';
  magnitude: number;
  size: string; // arcminutes
  bestMonths: number[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  recommendedFilters: string[];
  recommendedExposure: {
    L: number;
    R: number;
    G: number;
    B: number;
    Ha: number;
    OIII: number;
    SII: number;
  };
}

interface SequencePlan {
  id: string;
  name: string;
  target: Target;
  totalTime: number; // minutes
  startTime: Date;
  endTime: Date;
  filters: Array<{
    filter: string;
    exposureTime: number;
    count: number;
    totalTime: number;
  }>;
  calibrationFrames: {
    darks: number;
    flats: number;
    bias: number;
  };
  autoFocusInterval: number;
  ditherFrequency: number;
  estimatedCompletion: number; // percentage
  weatherSuitability: number; // 0-100
  moonImpact: 'none' | 'low' | 'medium' | 'high';
}

interface PlannerSuggestion {
  type: 'optimization' | 'warning' | 'tip';
  message: string;
  action?: () => void;
}

export function AdvancedSequencePlanner() {
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [sequencePlan, setSequencePlan] = useState<SequencePlan | null>(null);
  const [suggestions, setSuggestions] = useState<PlannerSuggestion[]>([]);
  const [planningDate, setPlanningDate] = useState(new Date());
  const [availableTime, setAvailableTime] = useState(480); // minutes
  const [currentTab, setCurrentTab] = useState('targets');

  // Sample targets database
  const targets: Target[] = [
    {
      id: 'M31',
      name: 'Andromeda Galaxy (M31)',
      ra: '00h 42m 44s',
      dec: '+41° 16\' 09"',
      type: 'galaxy',
      magnitude: 3.4,
      size: '190x60',
      bestMonths: [8, 9, 10, 11, 12, 1],
      difficulty: 'beginner',
      recommendedFilters: ['L', 'R', 'G', 'B'],
      recommendedExposure: { L: 300, R: 300, G: 300, B: 300, Ha: 0, OIII: 0, SII: 0 }
    },
    {
      id: 'M42',
      name: 'Orion Nebula (M42)',
      ra: '05h 35m 17s',
      dec: '-05° 23\' 14"',
      type: 'nebula',
      magnitude: 4.0,
      size: '85x60',
      bestMonths: [10, 11, 12, 1, 2, 3],
      difficulty: 'beginner',
      recommendedFilters: ['L', 'R', 'G', 'B', 'Ha', 'OIII'],
      recommendedExposure: { L: 180, R: 180, G: 180, B: 180, Ha: 600, OIII: 600, SII: 0 }
    },
    {
      id: 'NGC7000',
      name: 'North America Nebula (NGC 7000)',
      ra: '20h 58m 48s',
      dec: '+44° 20\' 00"',
      type: 'nebula',
      magnitude: 4.0,
      size: '120x100',
      bestMonths: [6, 7, 8, 9, 10],
      difficulty: 'intermediate',
      recommendedFilters: ['Ha', 'OIII', 'SII'],
      recommendedExposure: { L: 0, R: 0, G: 0, B: 0, Ha: 900, OIII: 900, SII: 900 }
    },
    {
      id: 'M13',
      name: 'Hercules Globular Cluster (M13)',
      ra: '16h 41m 41s',
      dec: '+36° 27\' 37"',
      type: 'star_cluster',
      magnitude: 5.8,
      size: '20x20',
      bestMonths: [4, 5, 6, 7, 8, 9],
      difficulty: 'beginner',
      recommendedFilters: ['L', 'R', 'G', 'B'],
      recommendedExposure: { L: 120, R: 120, G: 120, B: 120, Ha: 0, OIII: 0, SII: 0 }
    }
  ];

  const generateSuggestions = useCallback((plan: SequencePlan) => {
    const newSuggestions: PlannerSuggestion[] = [];

    // Weather suggestions
    if (plan.weatherSuitability < 70) {
      newSuggestions.push({
        type: 'warning',
        message: 'Weather conditions may not be optimal for imaging. Consider rescheduling.'
      });
    }

    // Moon impact suggestions
    if (plan.moonImpact === 'high') {
      newSuggestions.push({
        type: 'warning',
        message: 'High moon illumination may affect image quality. Consider narrowband filters or wait for new moon.'
      });
    }

    // Exposure optimization
    if (plan.estimatedCompletion < 50) {
      newSuggestions.push({
        type: 'optimization',
        message: 'Consider increasing exposure times or reducing filter count to maximize signal.'
      });
    }

    // Target visibility
    const currentMonth = planningDate.getMonth() + 1;
    if (!plan.target.bestMonths.includes(currentMonth)) {
      newSuggestions.push({
        type: 'warning',
        message: 'Target may not be optimally positioned during this time of year.'
      });
    }

    // Equipment suggestions
    if (plan.target.difficulty === 'advanced') {
      newSuggestions.push({
        type: 'tip',
        message: 'This is an advanced target. Ensure your equipment is properly calibrated and consider longer exposures.'
      });
    }

    setSuggestions(newSuggestions);
  }, [planningDate]);

  const generateSequencePlan = useCallback((target: Target) => {
    const environmentalConditions = simulationEngine.getEnvironmentalConditions();
    
    // Calculate optimal exposure distribution
    const filters = Object.entries(target.recommendedExposure)
      .filter(([, exposure]) => exposure > 0)
      .map(([filter, exposureTime]) => {
        const count = Math.floor((availableTime * 0.8) / (filters.length * (exposureTime / 60)));
        return {
          filter,
          exposureTime,
          count: Math.max(1, count),
          totalTime: count * (exposureTime / 60)
        };
      });

    const totalImagingTime = filters.reduce((sum, f) => sum + f.totalTime, 0);
    
    const plan: SequencePlan = {
      id: `plan-${Date.now()}`,
      name: `${target.name} - ${planningDate.toDateString()}`,
      target,
      totalTime: totalImagingTime,
      startTime: new Date(planningDate.getTime() + 20 * 60 * 60 * 1000), // 8 PM
      endTime: new Date(planningDate.getTime() + (20 + totalImagingTime / 60) * 60 * 60 * 1000),
      filters,
      calibrationFrames: {
        darks: Math.min(20, Math.floor(filters.reduce((sum, f) => sum + f.count, 0) * 0.1)),
        flats: 20,
        bias: 50
      },
      autoFocusInterval: 60, // minutes
      ditherFrequency: 5, // every 5 frames
      estimatedCompletion: Math.min(100, (totalImagingTime / (availableTime * 0.8)) * 100),
      weatherSuitability: calculateWeatherSuitability(environmentalConditions),
      moonImpact: calculateMoonImpact(planningDate, target)
    };

    setSequencePlan(plan);
    generateSuggestions(plan);
  }, [availableTime, planningDate, generateSuggestions]);

  useEffect(() => {
    if (selectedTarget) {
      generateSequencePlan(selectedTarget);
    }
  }, [selectedTarget, planningDate, availableTime, generateSequencePlan]);

  const calculateWeatherSuitability = (conditions: EnvironmentalConditions) => {
    let score = 100;
    
    if (conditions.cloudCover > 0.3) score -= 30;
    if (conditions.windSpeed > 20) score -= 20;
    if (conditions.humidity > 85) score -= 15;
    if (conditions.seeing > 3) score -= 25;
    
    return Math.max(0, score);
  };

  const calculateMoonImpact = (date: Date, target: Target): 'none' | 'low' | 'medium' | 'high' => {
    // Simplified moon phase calculation
    const moonPhase = simulationEngine.getEnvironmentalConditions().moonPhase;
    
    if (target.type === 'nebula' && target.recommendedFilters.includes('Ha')) {
      return moonPhase > 0.7 ? 'medium' : 'low';
    }
    
    if (moonPhase > 0.8) return 'high';
    if (moonPhase > 0.5) return 'medium';
    if (moonPhase > 0.2) return 'low';
    return 'none';
  };



  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'tip': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'galaxy': return <Target className="h-4 w-4" />;
      case 'nebula': return <Star className="h-4 w-4" />;
      case 'star_cluster': return <Zap className="h-4 w-4" />;
      case 'planetary': return <Moon className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Advanced Sequence Planner</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Plan
          </Button>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="targets">Target Selection</TabsTrigger>
          <TabsTrigger value="planning">Sequence Planning</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
        </TabsList>

        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {targets.map((target) => (
                  <motion.div
                    key={target.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all",
                      selectedTarget?.id === target.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedTarget(target)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(target.type)}
                        <h3 className="font-medium">{target.name}</h3>
                      </div>
                      <div className="flex gap-1">
                        <Badge
                          className={cn(
                            "text-white text-xs",
                            getDifficultyColor(target.difficulty)
                          )}
                        >
                          {target.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>RA: {target.ra} | Dec: {target.dec}</p>
                      <p>Magnitude: {target.magnitude} | Size: {target.size}&apos;</p>
                      <p>Type: {target.type.replace('_', ' ')}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {target.recommendedFilters.slice(0, 4).map((filter) => (
                        <Badge key={filter} variant="outline" className="text-xs">
                          {filter}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Planning Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="planning-date">Observation Date</Label>
                  <Input
                    id="planning-date"
                    type="date"
                    value={planningDate.toISOString().split('T')[0]}
                    onChange={(e) => setPlanningDate(new Date(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="available-time">Available Time (minutes)</Label>
                  <Input
                    id="available-time"
                    type="number"
                    value={availableTime}
                    onChange={(e) => setAvailableTime(parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {sequencePlan && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Generated Sequence Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Target:</span> {sequencePlan.target.name}
                      </div>
                      <div>
                        <span className="font-medium">Total Time:</span> {sequencePlan.totalTime.toFixed(0)} min
                      </div>
                      <div>
                        <span className="font-medium">Completion:</span> {sequencePlan.estimatedCompletion.toFixed(0)}%
                      </div>
                      <div>
                        <span className="font-medium">Weather Score:</span> {sequencePlan.weatherSuitability}/100
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Filter Schedule</h4>
                      <div className="space-y-2">
                        {sequencePlan.filters.map((filter, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="font-medium">{filter.filter}</span>
                            <span className="text-sm">
                              {filter.count} × {filter.exposureTime}s = {filter.totalTime.toFixed(0)}min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          {suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      {getSuggestionIcon(suggestion.type)}
                      <div className="flex-1">
                        <p className="text-sm">{suggestion.message}</p>
                        {suggestion.action && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto mt-1"
                            onClick={suggestion.action}
                          >
                            Apply Suggestion
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Ready</CardTitle>
            </CardHeader>
            <CardContent>
              {sequencePlan ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Sequence plan is ready for execution</span>
                  </div>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Sequence
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a target and configure your sequence to begin</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdvancedSequencePlanner;
