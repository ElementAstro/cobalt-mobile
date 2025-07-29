"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Power, 
  Settings, 
  Calibrate, 
  RotateCw,
  Thermometer,
  Zap,
  Camera,
  Compass,
  Filter,
  Focus,
  Play,
  Pause,
  Square,
  Home,
  Target,
  RefreshCw,
  Download,
  Upload,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

export interface DeviceActionsProps {
  deviceType: 'camera' | 'mount' | 'focuser' | 'filter';
  className?: string;
}

export default function DeviceActions({ deviceType, className }: DeviceActionsProps) {
  const { t } = useTranslation();
  const [isExecuting, setIsExecuting] = useState<string | null>(null);

  const executeAction = async (actionName: string, action: () => Promise<void>) => {
    setIsExecuting(actionName);
    try {
      await action();
    } catch (error) {
      console.error(`Failed to execute ${actionName}:`, error);
    } finally {
      setIsExecuting(null);
    }
  };

  const renderCameraActions = () => (
    <div className="space-y-6">
      {/* Capture Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="w-full"
              onClick={() => executeAction('single-capture', async () => {
                await new Promise(resolve => setTimeout(resolve, 2000));
              })}
              disabled={isExecuting === 'single-capture'}
            >
              {isExecuting === 'single-capture' ? (
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Single Shot
            </Button>
            
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => executeAction('start-sequence', async () => {
                await new Promise(resolve => setTimeout(resolve, 1000));
              })}
              disabled={isExecuting === 'start-sequence'}
            >
              {isExecuting === 'start-sequence' ? (
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Sequence
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button variant="destructive" size="sm">
              <Square className="h-4 w-4 mr-2" />
              Abort
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cooling Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Cooling System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="cooling-enabled">Cooling Enabled</Label>
            <Switch id="cooling-enabled" defaultChecked />
          </div>
          
          <div className="space-y-2">
            <Label>Target Temperature: -10°C</Label>
            <Slider
              defaultValue={[-10]}
              min={-30}
              max={20}
              step={1}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Current:</span>
              <span className="font-medium ml-2">-8.5°C</span>
            </div>
            <div>
              <span className="text-muted-foreground">Power:</span>
              <span className="font-medium ml-2">65%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMountActions = () => (
    <div className="space-y-6">
      {/* Movement Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Movement Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => executeAction('goto-target', async () => {
                await new Promise(resolve => setTimeout(resolve, 3000));
              })}
              disabled={isExecuting === 'goto-target'}
            >
              {isExecuting === 'goto-target' ? (
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Target className="h-4 w-4 mr-2" />
              )}
              GoTo Target
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => executeAction('park-mount', async () => {
                await new Promise(resolve => setTimeout(resolve, 2000));
              })}
              disabled={isExecuting === 'park-mount'}
            >
              {isExecuting === 'park-mount' ? (
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Home className="h-4 w-4 mr-2" />
              )}
              Park
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
            <Button variant="outline" size="sm">
              <Square className="h-4 w-4 mr-2" />
              Stop All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calibrate className="h-5 w-5" />
            Alignment & Calibration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full">
            <Calibrate className="h-4 w-4 mr-2" />
            Polar Alignment
          </Button>
          <Button variant="outline" className="w-full">
            <Target className="h-4 w-4 mr-2" />
            Star Alignment
          </Button>
          <Button variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Position
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderFocuserActions = () => (
    <div className="space-y-6">
      {/* Manual Focus */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Focus className="h-5 w-5" />
            Manual Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Step Size</Label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 100, 500, 1000].map(size => (
                <Button key={size} variant="outline" size="sm">
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline">
              <span className="text-lg mr-2">-</span>
              Focus In
            </Button>
            <Button variant="outline">
              <span className="text-lg mr-2">+</span>
              Focus Out
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Target Position</Label>
            <div className="flex gap-2">
              <Input type="number" placeholder="15420" className="flex-1" />
              <Button size="sm">Go</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto Focus */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Auto Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full"
            onClick={() => executeAction('auto-focus', async () => {
              await new Promise(resolve => setTimeout(resolve, 5000));
            })}
            disabled={isExecuting === 'auto-focus'}
          >
            {isExecuting === 'auto-focus' ? (
              <RotateCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Start Auto Focus
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Best HFR:</span>
              <span>2.45 pixels</span>
            </div>
            <div className="flex justify-between">
              <span>Best Position:</span>
              <span>15,420</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilterActions = () => (
    <div className="space-y-6">
      {/* Filter Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Luminance', position: 1 },
              { name: 'Red', position: 2 },
              { name: 'Green', position: 3 },
              { name: 'Blue', position: 4 },
              { name: 'Ha', position: 5 },
              { name: 'OIII', position: 6 },
              { name: 'SII', position: 7 },
              { name: 'Clear', position: 8 }
            ].map(filter => (
              <Button 
                key={filter.position}
                variant={filter.position === 1 ? "default" : "outline"}
                size="sm"
                className="justify-start"
              >
                <Badge variant="secondary" className="mr-2 text-xs">
                  {filter.position}
                </Badge>
                {filter.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter Wheel Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Wheel Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => executeAction('home-wheel', async () => {
              await new Promise(resolve => setTimeout(resolve, 2000));
            })}
            disabled={isExecuting === 'home-wheel'}
          >
            {isExecuting === 'home-wheel' ? (
              <RotateCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Home className="h-4 w-4 mr-2" />
            )}
            Home Position
          </Button>
          
          <Button variant="outline" className="w-full">
            <Calibrate className="h-4 w-4 mr-2" />
            Calibrate Positions
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Current Position:</span>
              <span>1 - Luminance</span>
            </div>
            <div className="flex justify-between">
              <span>Temperature:</span>
              <span>12.8°C</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActions = () => {
    switch (deviceType) {
      case 'camera':
        return renderCameraActions();
      case 'mount':
        return renderMountActions();
      case 'focuser':
        return renderFocuserActions();
      case 'filter':
        return renderFilterActions();
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {renderActions()}
    </div>
  );
}
