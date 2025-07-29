"use client";

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
}

export function Breadcrumb({ 
  items, 
  className, 
  showHome = true,
  separator = <ChevronRight className="h-4 w-4 text-muted-foreground" />
}: BreadcrumbProps) {
  const allItems = showHome 
    ? [{ label: 'Home', icon: Home, onClick: () => window.location.href = '/' }, ...items]
    : items;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-1 text-sm", className)}
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const IconComponent = item.icon;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2" aria-hidden="true">
                  {separator}
                </span>
              )}
              
              {item.onClick || item.href ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto p-1 font-normal",
                    isLast 
                      ? "text-foreground font-medium cursor-default" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={item.onClick}
                  disabled={isLast}
                  aria-current={isLast ? "page" : undefined}
                >
                  {IconComponent && (
                    <IconComponent className="h-4 w-4 mr-1" />
                  )}
                  {item.label}
                </Button>
              ) : (
                <span 
                  className={cn(
                    "flex items-center px-1",
                    isLast 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {IconComponent && (
                    <IconComponent className="h-4 w-4 mr-1" />
                  )}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Preset breadcrumb configurations for common navigation patterns
export const BreadcrumbPresets = {
  deviceDetail: (deviceName: string, onBackToDevices: () => void) => ({
    items: [
      {
        label: 'Equipment',
        onClick: onBackToDevices
      },
      {
        label: deviceName,
        current: true
      }
    ]
  }),

  deviceSettings: (deviceName: string, onBackToDevice: () => void, onBackToDevices: () => void) => ({
    items: [
      {
        label: 'Equipment',
        onClick: onBackToDevices
      },
      {
        label: deviceName,
        onClick: onBackToDevice
      },
      {
        label: 'Settings',
        current: true
      }
    ]
  }),

  sequence: (sequenceName?: string) => ({
    items: [
      {
        label: 'Sequences',
        onClick: () => console.log('Navigate to sequences')
      },
      ...(sequenceName ? [{
        label: sequenceName,
        current: true
      }] : [])
    ]
  })
};

export default Breadcrumb;
