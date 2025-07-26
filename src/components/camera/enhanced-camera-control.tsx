/**
 * Enhanced Camera Control Component
 * Demonstrates advanced mobile interactions for camera control
 */

"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { OptimizedMotion, OptimizedInteractive } from '@/components/ui/optimized-motion';
import { useEnhancedInteractions, usePinchGesture, useSwipeGesture } from '@/hooks/use-enhanced-interactions';
import { useAccessibleInteractive, useAccessibility } from '@/hooks/use-accessibility';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { GestureState } from '@/lib/interaction-manager';
import { cn } from '@/lib/utils';
import {
  Camera,
  Settings,
  Zap,
  Sun,
  Aperture,
  Timer,
  Focus,
  Palette,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  Square,
  Circle
} from 'lucide-react';

interface CameraSettings {
  exposure: number;
  iso: number;
  aperture: number;
  focusPosition: number;
  zoom: number;
  rotation: number;
  whiteBalance: string;
  captureMode: 'single' | 'burst' | 'timelapse';
}

export function EnhancedCameraControl() {
  const [settings, setSettings] = useState<CameraSettings>({
    exposure: 0,
    iso: 800,
    aperture: 2.8,
    focusPosition: 50,
    zoom: 1,
    rotation: 0,
    whiteBalance: 'auto',
    captureMode: 'single',
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'live' | 'settings'>('live');
  const [gestureLog, setGestureLog] = useState<string[]>([]);

  const { announce } = useAccessibility();
  const { measureInteraction } = usePerformanceMonitor();

  // Pinch to zoom
  const { ref: zoomRef } = usePinchGesture(
    useCallback((gesture) => {
      const scale = (gesture as any).scale || 1;
      const newZoom = Math.max(1, Math.min(10, settings.zoom * scale));
      setSettings(prev => ({ ...prev, zoom: newZoom }));
      announce(`Zoom: ${newZoom.toFixed(1)}x`);
    }, [settings.zoom, announce])
  );

  // Swipe for quick settings
  const { ref: swipeRef } = useSwipeGesture(
    useCallback((direction) => {
      switch (direction) {
        case 'left':
          setSettings(prev => ({ 
            ...prev, 
            exposure: Math.max(-3, prev.exposure - 0.5) 
          }));
          announce('Exposure decreased');
          break;
        case 'right':
          setSettings(prev => ({ 
            ...prev, 
            exposure: Math.min(3, prev.exposure + 0.5) 
          }));
          announce('Exposure increased');
          break;
        case 'up':
          setSettings(prev => ({ 
            ...prev, 
            iso: Math.min(6400, prev.iso * 2) 
          }));
          announce(`ISO increased to ${settings.iso * 2}`);
          break;
        case 'down':
          setSettings(prev => ({ 
            ...prev, 
            iso: Math.max(100, prev.iso / 2) 
          }));
          announce(`ISO decreased to ${settings.iso / 2}`);
          break;
      }
    }, [settings.iso, announce])
  );

  // Enhanced gesture handling for camera preview
  const { ref: previewRef } = useEnhancedInteractions({
    onTap: useCallback((gesture: GestureState) => {
      // Focus at tap point
      const rect = (gesture as any).target?.getBoundingClientRect();
      if (rect) {
        const x = ((gesture.currentX - rect.left) / rect.width) * 100;
        const y = ((gesture.currentY - rect.top) / rect.height) * 100;
        setSettings(prev => ({
          ...prev,
          focusPosition: Math.round((x + y) / 2)
        }));
        announce(`Focus set to ${Math.round((x + y) / 2)}%`);
      }
    }, [announce]),
    
    onDoubleTap: useCallback(() => {
      // Reset zoom on double tap
      setSettings(prev => ({ ...prev, zoom: 1 }));
      announce('Zoom reset to 1x');
    }, [announce]),
    
    onLongPress: useCallback(() => {
      // Toggle capture mode on long press
      const modes: CameraSettings['captureMode'][] = ['single', 'burst', 'timelapse'];
      const currentIndex = modes.indexOf(settings.captureMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      setSettings(prev => ({ ...prev, captureMode: nextMode }));
      announce(`Capture mode: ${nextMode}`);
    }, [settings.captureMode, announce]),
  });

  const handleCapture = useCallback(() => {
    measureInteraction('camera-capture', async () => {
      setIsCapturing(true);
      announce('Capturing image...');
      
      // Simulate capture delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsCapturing(false);
      announce('Image captured successfully');
    });
  }, [measureInteraction, announce]);

  const { getAccessibleProps: getCaptureButtonProps } = useAccessibleInteractive({
    onActivate: handleCapture,
    disabled: isCapturing,
    ariaLabel: `Capture ${settings.captureMode} image`,
  });

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Camera Preview */}
      <Card className="flex-1">
        <CardContent className="p-0 h-full">
          <div
            ref={previewRef as React.RefObject<HTMLDivElement>}
            className="relative h-full min-h-[300px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg overflow-hidden"
            style={{
              transform: `scale(${settings.zoom}) rotate(${settings.rotation}deg)`,
              transformOrigin: 'center',
            }}
          >
            {/* Simulated camera feed */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
            
            {/* Focus indicator */}
            <div 
              className="absolute w-16 h-16 border-2 border-white rounded-full pointer-events-none transition-all duration-300"
              style={{
                left: `${settings.focusPosition}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.8,
              }}
            >
              <Focus className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Camera info overlay */}
            <div className="absolute top-4 left-4 space-y-2">
              <Badge variant="secondary" className="bg-black/50 text-white">
                {settings.zoom.toFixed(1)}x
              </Badge>
              <Badge variant="secondary" className="bg-black/50 text-white">
                ISO {settings.iso}
              </Badge>
              <Badge variant="secondary" className="bg-black/50 text-white">
                f/{settings.aperture}
              </Badge>
            </div>

            {/* Gesture hints */}
            <div className="absolute bottom-4 left-4 text-white/70 text-xs space-y-1">
              <div>Tap: Focus</div>
              <div>Double tap: Reset zoom</div>
              <div>Long press: Change mode</div>
              <div>Pinch: Zoom</div>
              <div>Swipe: Adjust settings</div>
            </div>

            {/* Capture mode indicator */}
            <div className="absolute top-4 right-4">
              <Badge variant="default" className="bg-primary/80">
                {settings.captureMode.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Controls */}
      <div className="grid grid-cols-2 gap-4">
        {/* Capture Button */}
        <OptimizedInteractive>
          <Button
            {...(() => {
              const { ref, ...props } = getCaptureButtonProps();
              return { ...props, ref: ref as React.RefObject<HTMLButtonElement> };
            })()}
            size="lg"
            disabled={isCapturing}
            className={cn(
              "h-16 relative overflow-hidden",
              isCapturing && "animate-pulse"
            )}
          >
            <div className="flex items-center gap-2">
              {isCapturing ? (
                <Square className="h-6 w-6" />
              ) : settings.captureMode === 'single' ? (
                <Circle className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
              <span className="font-medium">
                {isCapturing ? 'Capturing...' : 'Capture'}
              </span>
            </div>
          </Button>
        </OptimizedInteractive>

        {/* Settings Toggle */}
        <OptimizedInteractive>
          <Button
            variant="outline"
            size="lg"
            className="h-16"
            onClick={() => setPreviewMode(prev => prev === 'live' ? 'settings' : 'live')}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              <span className="font-medium">Settings</span>
            </div>
          </Button>
        </OptimizedInteractive>
      </div>

      {/* Settings Panel */}
      {previewMode === 'settings' && (
        <OptimizedMotion animation="slide" direction="up">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Exposure */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span className="text-sm font-medium">Exposure</span>
                  <Badge variant="outline">{settings.exposure > 0 ? '+' : ''}{settings.exposure}</Badge>
                </div>
                <Slider
                  value={[settings.exposure]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, exposure: value }))}
                  min={-3}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* ISO */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">ISO</span>
                  <Badge variant="outline">{settings.iso}</Badge>
                </div>
                <Slider
                  value={[Math.log2(settings.iso / 100)]}
                  onValueChange={([value]) => setSettings(prev => ({ 
                    ...prev, 
                    iso: Math.round(100 * Math.pow(2, value)) 
                  }))}
                  min={0}
                  max={6}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Focus */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Focus className="h-4 w-4" />
                  <span className="text-sm font-medium">Focus</span>
                  <Badge variant="outline">{settings.focusPosition}%</Badge>
                </div>
                <Slider
                  value={[settings.focusPosition]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, focusPosition: value }))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, zoom: 1, rotation: 0 }))}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({ 
                    ...prev, 
                    zoom: Math.min(10, prev.zoom * 1.5) 
                  }))}
                >
                  <ZoomIn className="h-4 w-4 mr-1" />
                  Zoom+
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({ 
                    ...prev, 
                    zoom: Math.max(1, prev.zoom / 1.5) 
                  }))}
                >
                  <ZoomOut className="h-4 w-4 mr-1" />
                  Zoom-
                </Button>
              </div>
            </CardContent>
          </Card>
        </OptimizedMotion>
      )}
    </div>
  );
}
