/**
 * Mobile Interaction Showcase
 * Demonstrates the enhanced mobile interaction capabilities
 */

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedMotion, OptimizedAnimatePresence, AnimationPresets } from '@/components/ui/optimized-motion';
import { VerticalLayout, VerticalLayoutPresets } from '@/components/ui/vertical-layout';
import { EnhancedGestureNavigation } from '@/components/enhanced-gesture-navigation';
import { useEnhancedInteractions, useSwipeGesture, usePinchGesture } from '@/hooks/use-enhanced-interactions';
import { useAccessibleInteractive, useAccessibility } from '@/hooks/use-accessibility';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { cn } from '@/lib/utils';
import { 
  Smartphone, 
  Zap, 
  Eye, 
  Hand, 
  Gauge,
  Accessibility,
  Layers,
  Move,
  RotateCcw,
  ZoomIn
} from 'lucide-react';

export function MobileInteractionShowcase() {
  const [activeDemo, setActiveDemo] = useState<string>('gestures');
  const [gestureLog, setGestureLog] = useState<string[]>([]);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const { metrics, settings } = usePerformanceMonitor();
  const { settings: a11ySettings, announce } = useAccessibility();

  // Gesture demonstration
  const { ref: gestureRef } = useEnhancedInteractions({
    onSwipe: (gesture) => {
      const message = `Swiped ${gesture.direction} (velocity: ${gesture.velocity.toFixed(2)})`;
      setGestureLog(prev => [message, ...prev.slice(0, 4)]);
      announce(message);
    },
    onTap: () => {
      const message = 'Tapped';
      setGestureLog(prev => [message, ...prev.slice(0, 4)]);
    },
    onLongPress: () => {
      const message = 'Long pressed';
      setGestureLog(prev => [message, ...prev.slice(0, 4)]);
      announce(message);
    },
    onPinch: (gesture) => {
      const pinchScale = 'scale' in gesture ? (gesture as any).scale : 1;
      const newScale = Math.max(0.5, Math.min(3, scale * pinchScale));
      setScale(newScale);
      const message = `Pinched: ${newScale.toFixed(2)}x`;
      setGestureLog(prev => [message, ...prev.slice(0, 4)]);
    },
    onPan: (gesture) => {
      const deltaX = 'deltaX' in gesture ? gesture.deltaX : 0;
      const deltaY = 'deltaY' in gesture ? gesture.deltaY : 0;
      setPosition({
        x: Math.max(-100, Math.min(100, deltaX / 2)),
        y: Math.max(-100, Math.min(100, deltaY / 2)),
      });
    },
  });

  // Accessible button demo
  const { getAccessibleProps } = useAccessibleInteractive({
    onActivate: () => {
      announce('Accessible button activated!');
      setGestureLog(prev => ['Accessible button activated', ...prev.slice(0, 4)]);
    },
    ariaLabel: 'Demonstration accessible button',
  });

  const demoSections = VerticalLayoutPresets.dashboard({
    overview: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <div className="text-2xl font-bold">{metrics.fps} FPS</div>
              <div className="text-xs text-muted-foreground">
                Quality: {settings.animationQuality}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Accessibility className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Accessibility</span>
              </div>
              <div className="text-sm">
                <Badge variant={a11ySettings.screenReaderEnabled ? 'default' : 'secondary'}>
                  Screen Reader
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Touch: {a11ySettings.touchTargetSize}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['gestures', 'layout', 'accessibility', 'performance'].map((demo) => (
            <Button
              key={demo}
              variant={activeDemo === demo ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveDemo(demo)}
              className="capitalize"
            >
              {demo}
            </Button>
          ))}
        </div>
      </div>
    ),
    details: (
      <OptimizedAnimatePresence>
        {activeDemo === 'gestures' && (
          <OptimizedMotion key="gestures" {...AnimationPresets.slideUp}>
            <GestureDemo 
              gestureRef={gestureRef}
              gestureLog={gestureLog}
              scale={scale}
              rotation={rotation}
              position={position}
              onReset={() => {
                setScale(1);
                setRotation(0);
                setPosition({ x: 0, y: 0 });
                setGestureLog([]);
              }}
            />
          </OptimizedMotion>
        )}
        
        {activeDemo === 'layout' && (
          <OptimizedMotion key="layout" {...AnimationPresets.slideUp}>
            <LayoutDemo />
          </OptimizedMotion>
        )}
        
        {activeDemo === 'accessibility' && (
          <OptimizedMotion key="accessibility" {...AnimationPresets.slideUp}>
            <AccessibilityDemo getAccessibleProps={getAccessibleProps} />
          </OptimizedMotion>
        )}
        
        {activeDemo === 'performance' && (
          <OptimizedMotion key="performance" {...AnimationPresets.slideUp}>
            <PerformanceDemo metrics={metrics} settings={settings} />
          </OptimizedMotion>
        )}
      </OptimizedAnimatePresence>
    ),
    controls: (
      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setGestureLog([])}
        >
          Clear Gesture Log
        </Button>
        
        <Button
          {...(() => {
            const { ref, ...props } = getAccessibleProps();
            return props;
          })()}
          className="w-full"
        >
          Test Accessible Button
        </Button>
        
        <div className="text-xs text-muted-foreground text-center">
          Try swiping, tapping, pinching, and long-pressing in the demo area above
        </div>
      </div>
    ),
  });

  return (
    <div className="h-full">
      <VerticalLayout
        sections={demoSections}
        spacing="standard"
        adaptiveHeight={true}
      />
    </div>
  );
}

function GestureDemo({ 
  gestureRef, 
  gestureLog, 
  scale, 
  rotation, 
  position, 
  onReset 
}: {
  gestureRef: React.RefObject<HTMLElement | null>;
  gestureLog: string[];
  scale: number;
  rotation: number;
  position: { x: number; y: number };
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hand className="h-5 w-5" />
            Gesture Playground
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={gestureRef as React.RefObject<HTMLDivElement>}
            className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200 flex items-center justify-center overflow-hidden"
          >
            <div
              className="bg-blue-500 text-white p-4 rounded-lg shadow-lg transition-transform duration-100"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              }}
            >
              <div className="flex items-center gap-2">
                <Move className="h-4 w-4" />
                <span className="text-sm font-medium">Interactive Element</span>
              </div>
              <div className="text-xs opacity-75 mt-1">
                Scale: {scale.toFixed(2)}x
              </div>
            </div>
            
            <div className="absolute top-2 left-2 text-xs text-muted-foreground">
              Try: Swipe • Tap • Long Press • Pinch • Pan
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Gesture Log</span>
              <Button variant="ghost" size="sm" onClick={onReset}>
                Reset
              </Button>
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {gestureLog.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">
                  No gestures detected yet...
                </div>
              ) : (
                gestureLog.map((log, index) => (
                  <div key={index} className="text-xs bg-muted p-2 rounded">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LayoutDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Responsive Layout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Adaptive Grid</h4>
            <p className="text-sm text-muted-foreground">
              Automatically adjusts columns based on screen size and orientation.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Safe Areas</h4>
            <p className="text-sm text-muted-foreground">
              Respects device safe areas and notches for optimal viewing.
            </p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-100 to-red-100 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Vertical Optimization</h4>
          <p className="text-sm text-muted-foreground">
            Maximizes vertical space usage with collapsible sections and adaptive heights.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AccessibilityDemo({ getAccessibleProps }: { getAccessibleProps: () => any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Accessibility Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">Enhanced Touch Targets</h4>
            <div className="flex gap-2">
              <Button size="sm">Small</Button>
              <Button>Standard</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Screen Reader Support</h4>
            <Button
              {...(() => {
                const { ref, ...props } = getAccessibleProps();
                return props;
              })()}
              variant="outline"
            >
              Accessible Button with ARIA
            </Button>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Keyboard Navigation</h4>
            <p className="text-sm text-muted-foreground">
              Try using Tab, Enter, and arrow keys to navigate.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceDemo({ metrics, settings }: { metrics: any; settings: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium">Frame Rate</div>
            <div className="text-2xl font-bold">{metrics.fps} FPS</div>
          </div>
          
          <div>
            <div className="text-sm font-medium">Memory Usage</div>
            <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}%</div>
          </div>
          
          <div>
            <div className="text-sm font-medium">Animation Quality</div>
            <Badge variant={settings.animationQuality === 'high' ? 'default' : 'secondary'}>
              {settings.animationQuality}
            </Badge>
          </div>
          
          <div>
            <div className="text-sm font-medium">Battery Level</div>
            <div className="text-2xl font-bold">{metrics.batteryLevel.toFixed(0)}%</div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Performance automatically adapts based on device capabilities and battery level.
        </div>
      </CardContent>
    </Card>
  );
}
