"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getMobileInteractiveClasses } from '@/lib/mobile-utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  delay?: number;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({
  content,
  children,
  position = 'auto',
  trigger = 'hover',
  delay = 500,
  className,
  contentClassName,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actualPosition, setActualPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const open = controlledOpen !== undefined ? controlledOpen : isOpen;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current || position !== 'auto') {
      setActualPosition(position as 'top' | 'bottom' | 'left' | 'right');
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Check available space in each direction
    const spaceTop = triggerRect.top;
    const spaceBottom = viewport.height - triggerRect.bottom;
    const spaceLeft = triggerRect.left;
    const spaceRight = viewport.width - triggerRect.right;

    // Determine best position based on available space
    if (spaceTop >= tooltipRect.height && spaceTop >= spaceBottom) {
      setActualPosition('top');
    } else if (spaceBottom >= tooltipRect.height) {
      setActualPosition('bottom');
    } else if (spaceRight >= tooltipRect.width && spaceRight >= spaceLeft) {
      setActualPosition('right');
    } else {
      setActualPosition('left');
    }
  }, [position]);

  const handleOpen = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (trigger === 'hover') {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(true);
        onOpenChange?.(true);
      }, delay);
    } else {
      setIsOpen(true);
      onOpenChange?.(true);
    }
  };

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleToggle = () => {
    if (open) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  useEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, position, updatePosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionClasses = () => {
    const baseClasses = "absolute z-50";
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    const baseClasses = "absolute w-2 h-2 bg-popover border transform rotate-45";
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0`;
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-r-0`;
      case 'left':
        return `${baseClasses} left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0`;
      case 'right':
        return `${baseClasses} right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0`;
      default:
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0`;
    }
  };

  const triggerProps = {
    ...(trigger === 'hover' && {
      onMouseEnter: handleOpen,
      onMouseLeave: handleClose,
    }),
    ...(trigger === 'click' && {
      onClick: handleToggle,
    }),
    ...(trigger === 'focus' && {
      onFocus: handleOpen,
      onBlur: handleClose,
    }),
  };

  return (
    <div ref={triggerRef} className={cn("relative inline-block", className)} {...triggerProps}>
      {children}
      
      <AnimatePresence>
        {open && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={getPositionClasses()}
            style={{ zIndex: 9999 }}
          >
            <div
              className={cn(
                "bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-lg border",
                "max-w-xs text-sm leading-relaxed",
                contentClassName
              )}
            >
              {content}
              <div className={getArrowClasses()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Specialized help tooltip for contextual guidance
interface HelpTooltipProps {
  title?: string;
  description: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  className?: string;
}

export function HelpTooltip({
  title,
  description,
  children,
  position = 'auto',
  className,
}: HelpTooltipProps) {
  return (
    <Tooltip
      position={position}
      trigger="hover"
      delay={300}
      className={className}
      content={
        <div className="space-y-1">
          {title && (
            <div className="font-medium text-foreground">{title}</div>
          )}
          <div className="text-muted-foreground text-xs leading-relaxed">
            {description}
          </div>
        </div>
      }
    >
      {children}
    </Tooltip>
  );
}

// Quick info tooltip for status indicators
interface InfoTooltipProps {
  info: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function InfoTooltip({
  info,
  children,
  variant = 'default',
  className,
}: InfoTooltipProps) {
  const variantClasses = {
    default: 'bg-popover text-popover-foreground border-border',
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800',
  };

  return (
    <Tooltip
      trigger="hover"
      delay={200}
      className={className}
      contentClassName={variantClasses[variant]}
      content={info}
    >
      {children}
    </Tooltip>
  );
}

// Mobile-optimized tooltip that shows on tap
export function MobileTooltip({
  content,
  children,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip
      trigger="click"
      position="auto"
      className={cn(getMobileInteractiveClasses({ feedback: true }), className)}
      content={content}
    >
      {children}
    </Tooltip>
  );
}
