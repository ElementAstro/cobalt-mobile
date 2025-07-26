/**
 * Optimized Motion Components
 * Performance-aware animation components that adapt to device capabilities
 */

"use client";

import React, { forwardRef, useMemo } from 'react';
import { motion, AnimatePresence, MotionProps, Variants } from 'framer-motion';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { cn } from '@/lib/utils';

// Enhanced motion component that adapts to performance
export interface OptimizedMotionProps extends Omit<MotionProps, 'animate' | 'initial' | 'exit'> {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade' | 'slide' | 'scale' | 'bounce' | 'custom';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  customVariants?: Variants;
  enableGPU?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export const OptimizedMotion = forwardRef<HTMLDivElement, OptimizedMotionProps>(
  ({
    children,
    className,
    animation = 'fade',
    direction = 'up',
    duration,
    delay = 0,
    customVariants,
    enableGPU = true,
    priority = 'medium',
    ...props
  }, ref) => {
    const { settings, getOptimizedAnimationConfig } = usePerformanceMonitor();
    
    const animationConfig = useMemo(() => {
      const config = getOptimizedAnimationConfig();
      // Provide fallback values for server-side rendering
      const safeDuration = config?.duration ?? 200;
      const safeEase = config?.ease ?? 'easeInOut';

      return {
        duration: duration || safeDuration / 1000,
        ease: safeEase,
        delay,
      };
    }, [duration, delay, getOptimizedAnimationConfig]);

    const variants = useMemo(() => {
      if (customVariants) return customVariants;
      
      if (!settings.enableAnimations) {
        return {
          initial: {},
          animate: {},
          exit: {},
        };
      }

      const baseVariants: Variants = {
        initial: {},
        animate: {},
        exit: {},
      };

      switch (animation) {
        case 'fade':
          baseVariants.initial = { opacity: 0 };
          baseVariants.animate = { opacity: 1 };
          baseVariants.exit = { opacity: 0 };
          break;
        
        case 'slide':
          const slideDistance = settings.animationQuality === 'low' ? 10 : 20;
          switch (direction) {
            case 'up':
              baseVariants.initial = { opacity: 0, y: slideDistance };
              baseVariants.animate = { opacity: 1, y: 0 };
              baseVariants.exit = { opacity: 0, y: -slideDistance };
              break;
            case 'down':
              baseVariants.initial = { opacity: 0, y: -slideDistance };
              baseVariants.animate = { opacity: 1, y: 0 };
              baseVariants.exit = { opacity: 0, y: slideDistance };
              break;
            case 'left':
              baseVariants.initial = { opacity: 0, x: slideDistance };
              baseVariants.animate = { opacity: 1, x: 0 };
              baseVariants.exit = { opacity: 0, x: -slideDistance };
              break;
            case 'right':
              baseVariants.initial = { opacity: 0, x: -slideDistance };
              baseVariants.animate = { opacity: 1, x: 0 };
              baseVariants.exit = { opacity: 0, x: slideDistance };
              break;
          }
          break;
        
        case 'scale':
          const scaleValue = settings.animationQuality === 'low' ? 0.95 : 0.9;
          baseVariants.initial = { opacity: 0, scale: scaleValue };
          baseVariants.animate = { opacity: 1, scale: 1 };
          baseVariants.exit = { opacity: 0, scale: scaleValue };
          break;
        
        case 'bounce':
          if (settings.animationQuality === 'low') {
            // Fallback to simple scale for low performance
            baseVariants.initial = { opacity: 0, scale: 0.9 };
            baseVariants.animate = { opacity: 1, scale: 1 };
            baseVariants.exit = { opacity: 0, scale: 0.9 };
          } else {
            baseVariants.initial = { opacity: 0, scale: 0.3 };
            baseVariants.animate = { 
              opacity: 1, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
              }
            };
            baseVariants.exit = { opacity: 0, scale: 0.3 };
          }
          break;
      }

      return baseVariants;
    }, [animation, direction, settings, customVariants]);

    // Skip animation entirely if disabled
    if (!settings.enableAnimations) {
      const { style, onDrag, ...divProps } = props;
      return (
        <div ref={ref} className={className} style={style as any} {...(divProps as any)}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          enableGPU && settings.renderQuality !== 'low' && 'transform-gpu will-change-transform',
          className
        )}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={animationConfig}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

OptimizedMotion.displayName = 'OptimizedMotion';

// Optimized AnimatePresence wrapper
export interface OptimizedAnimatePresenceProps {
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
  initial?: boolean;
}

export function OptimizedAnimatePresence({
  children,
  mode = 'wait',
  initial = true,
}: OptimizedAnimatePresenceProps) {
  const { settings } = usePerformanceMonitor();

  if (!settings.enableAnimations) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode={mode} initial={initial}>
      {children}
    </AnimatePresence>
  );
}

// Optimized list animation component
export interface OptimizedListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  animation?: 'fade' | 'slide' | 'scale';
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function OptimizedList({
  children,
  className,
  staggerDelay = 0.1,
  animation = 'slide',
  direction = 'up',
}: OptimizedListProps) {
  const { settings } = usePerformanceMonitor();

  const containerVariants: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: settings.animationQuality === 'low' ? 0 : staggerDelay,
      },
    },
  };

  if (!settings.enableAnimations) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {children.map((child, index) => (
        <OptimizedMotion
          key={index}
          animation={animation}
          direction={direction}
          delay={0} // Stagger is handled by parent
        >
          {child}
        </OptimizedMotion>
      ))}
    </motion.div>
  );
}

// Performance-aware scroll animation
export interface OptimizedScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  animation?: 'fade' | 'slide' | 'scale';
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function OptimizedScrollAnimation({
  children,
  className,
  threshold = 0.1,
  animation = 'slide',
  direction = 'up',
}: OptimizedScrollAnimationProps) {
  const { settings } = usePerformanceMonitor();

  // Disable scroll animations on low performance devices
  if (!settings.enableAnimations || settings.animationQuality === 'low') {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <OptimizedMotion animation={animation} direction={direction}>
        {children}
      </OptimizedMotion>
    </motion.div>
  );
}

// Optimized hover and tap animations
export interface OptimizedInteractiveProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  tapScale?: number;
  disabled?: boolean;
}

export function OptimizedInteractive({
  children,
  className,
  hoverScale = 1.05,
  tapScale = 0.95,
  disabled = false,
}: OptimizedInteractiveProps) {
  const { settings } = usePerformanceMonitor();

  const interactionProps = useMemo(() => {
    if (disabled || !settings.enableAnimations) {
      return {};
    }

    const props: any = {};

    if (settings.animationQuality !== 'low') {
      props.whileHover = { scale: hoverScale };
      props.whileTap = { scale: tapScale };
      props.transition = { type: 'spring', stiffness: 300, damping: 20 };
    }

    return props;
  }, [disabled, settings, hoverScale, tapScale]);

  return (
    <motion.div
      className={cn(
        'cursor-pointer',
        settings.renderQuality !== 'low' && 'transform-gpu',
        className
      )}
      {...interactionProps}
    >
      {children}
    </motion.div>
  );
}

// Export preset animation configurations
export const AnimationPresets = {
  slideUp: { animation: 'slide' as const, direction: 'up' as const },
  slideDown: { animation: 'slide' as const, direction: 'down' as const },
  slideLeft: { animation: 'slide' as const, direction: 'left' as const },
  slideRight: { animation: 'slide' as const, direction: 'right' as const },
  fadeIn: { animation: 'fade' as const },
  scaleIn: { animation: 'scale' as const },
  bounceIn: { animation: 'bounce' as const },
} as const;
