"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getMobileInteractiveClasses, hapticFeedback } from '@/lib/mobile-utils';
import { Plus, X } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'secondary';
  disabled?: boolean;
}

interface FloatingActionButtonProps {
  actions: QuickAction[];
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'sm' | 'md' | 'lg';
  triggerIcon?: React.ComponentType<{ className?: string }>;
  closeIcon?: React.ComponentType<{ className?: string }>;
}

export function FloatingActionButton({
  actions,
  className,
  position = 'bottom-right',
  size = 'md',
  triggerIcon: TriggerIcon = Plus,
  closeIcon: CloseIcon = X,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-14 w-14',
    lg: 'h-16 w-16',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2',
  };

  const handleToggle = () => {
    if (isDragging) return;
    hapticFeedback.medium();
    setIsOpen(!isOpen);
  };

  const handleActionClick = (action: QuickAction) => {
    if (action.disabled) return;
    hapticFeedback.light();
    action.onClick();
    setIsOpen(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartPos.current.x;
    const deltaY = touch.clientY - dragStartPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 10 && !isDragging) {
      setIsDragging(true);
      setIsOpen(false);
    }

    if (isDragging) {
      setDragPosition({ x: deltaX, y: deltaY });
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      // Snap back to original position
      setDragPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full mb-4 flex flex-col items-center space-y-3"
          >
            {actions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0, 
                    y: 20,
                    transition: { delay: (actions.length - index - 1) * 0.05 }
                  }}
                  className="flex items-center space-x-3"
                >
                  {/* Action Label */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: index * 0.05 + 0.1 }
                    }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border text-sm font-medium whitespace-nowrap"
                  >
                    {action.label}
                  </motion.div>

                  {/* Action Button */}
                  <Button
                    variant={action.variant || 'default'}
                    size="icon"
                    className={cn(
                      'h-12 w-12 rounded-full shadow-lg',
                      getMobileInteractiveClasses({ feedback: true }),
                      action.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled}
                    aria-label={action.label}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        animate={{
          x: dragPosition.x,
          y: dragPosition.y,
          scale: isDragging ? 1.1 : 1,
        }}
        transition={{
          type: isDragging ? 'spring' : 'tween',
          stiffness: 300,
          damping: 30,
        }}
      >
        <Button
          ref={buttonRef}
          variant="default"
          className={cn(
            sizeClasses[size],
            'rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
            'bg-primary text-primary-foreground',
            getMobileInteractiveClasses({ 
              size: 'recommended', 
              feedback: true, 
              focus: true 
            }),
            isDragging && 'cursor-grabbing',
            className
          )}
          onClick={handleToggle}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
          aria-expanded={isOpen}
          data-tour="quick-actions"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <CloseIcon className={iconSizes[size]} />
            ) : (
              <TriggerIcon className={iconSizes[size]} />
            )}
          </motion.div>
        </Button>
      </motion.div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Preset quick action configurations
export const QuickActionPresets = {
  astrophotography: [
    {
      id: 'emergency-stop',
      label: 'Emergency Stop',
      icon: ({ className }: { className?: string }) => (
        <div className={cn('rounded-full bg-red-500', className)} />
      ),
      variant: 'destructive' as const,
    },
    {
      id: 'quick-capture',
      label: 'Quick Capture',
      icon: ({ className }: { className?: string }) => (
        <div className={cn('rounded bg-blue-500', className)} />
      ),
    },
    {
      id: 'auto-focus',
      label: 'Auto Focus',
      icon: ({ className }: { className?: string }) => (
        <div className={cn('rounded-full bg-green-500', className)} />
      ),
    },
  ],
} as const;
