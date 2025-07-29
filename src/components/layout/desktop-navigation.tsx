"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home,
  Grid3X3,
  Activity,
  Cloud,
  Camera,
  Target,
  Heart,
  Crosshair,
  ChevronRight,
  ChevronDown,
  Search,
  Bell,
  Settings,
  User,
  MoreHorizontal,
} from 'lucide-react';
import { CurrentPage } from '@/lib/store';

interface NavigationItem {
  id: CurrentPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  color?: 'default' | 'secondary' | 'destructive';
  children?: NavigationItem[];
  description?: string;
}

interface DesktopSidebarNavigationProps {
  currentPage: CurrentPage;
  onPageChange: (page: CurrentPage) => void;
  collapsed?: boolean;
  className?: string;
}

export function DesktopSidebarNavigation({
  currentPage,
  onPageChange,
  collapsed = false,
  className,
}: DesktopSidebarNavigationProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview and system status',
    },
    {
      id: 'devices',
      label: 'Equipment',
      icon: Grid3X3,
      description: 'Device management and control',
      badge: 2,
      color: 'secondary',
    },
    {
      id: 'sequence',
      label: 'Sequencer',
      icon: Activity,
      description: 'Imaging sequence automation',
    },
    {
      id: 'weather',
      label: 'Weather',
      icon: Cloud,
      description: 'Environmental conditions',
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: Camera,
      description: 'Image analysis and processing',
    },
    {
      id: 'targets',
      label: 'Targets',
      icon: Target,
      description: 'Target planning and selection',
    },
    {
      id: 'health',
      label: 'Health',
      icon: Heart,
      description: 'Equipment health monitoring',
    },
    {
      id: 'guiding',
      label: 'Guiding',
      icon: Crosshair,
      description: 'Autoguiding and polar alignment',
    },
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isActive = currentPage === item.id;
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="w-full">
        <Button
          variant={isActive ? "default" : "ghost"}
          className={cn(
            "w-full justify-start h-auto py-3",
            level > 0 && "ml-4",
            collapsed ? "px-2" : "px-3",
            isActive && "bg-primary text-primary-foreground shadow-sm"
          )}
          onClick={() => {
            if (hasChildren && !collapsed) {
              toggleExpanded(item.id);
            } else {
              onPageChange(item.id);
            }
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <item.icon className={cn(
              "h-5 w-5 flex-shrink-0",
              isActive ? "text-primary-foreground" : "text-muted-foreground"
            )} />
            
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium truncate">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.badge && (
                    <Badge
                      variant={(item.color as "default" | "secondary" | "destructive") || "default"}
                      className="h-5 px-2 text-xs"
                    >
                      {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                  
                  {hasChildren && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </div>
        </Button>

        {/* Submenu */}
        {hasChildren && !collapsed && (
          <motion.div
            initial={false}
            animate={{
              height: isExpanded ? 'auto' : 0,
              opacity: isExpanded ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="py-1 space-y-1">
              {item.children?.map(child => renderNavigationItem(child, level + 1))}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <nav className={cn("space-y-1", className)}>
      {navigationItems.map(item => renderNavigationItem(item))}
    </nav>
  );
}

// Desktop breadcrumb navigation
interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface DesktopBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function DesktopBreadcrumbs({ items, className }: DesktopBreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          {index === items.length - 1 ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 font-normal text-muted-foreground hover:text-foreground"
              onClick={item.onClick}
            >
              {item.label}
            </Button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Desktop header with search and actions
interface DesktopHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export function DesktopHeader({
  title,
  breadcrumbs,
  actions,
  searchPlaceholder = "Search...",
  onSearch,
  className,
}: DesktopHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className={cn(
      "flex items-center justify-between gap-4 py-4",
      className
    )}>
      <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <DesktopBreadcrumbs items={breadcrumbs} />
        ) : title ? (
          <h1 className="text-2xl font-bold truncate">{title}</h1>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        {onSearch && (
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 pr-4 py-2 w-64 rounded-md border border-input",
                "bg-background text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              )}
            />
          </form>
        )}

        {/* Actions */}
        {actions}

        {/* Default actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

// Desktop tab navigation
interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  disabled?: boolean;
}

interface DesktopTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function DesktopTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: DesktopTabsProps) {
  return (
    <div className={cn(
      "border-b border-border bg-background",
      className
    )}>
      <nav className="flex space-x-8 px-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              disabled={tab.disabled}
              className={cn(
                "relative h-12 px-0 py-0 border-b-2 border-transparent rounded-none",
                "hover:text-foreground hover:border-border",
                isActive && "border-primary text-primary",
                tab.disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
            >
              <div className="flex items-center gap-2">
                {tab.icon && <tab.icon className="h-4 w-4" />}
                <span className="font-medium">{tab.label}</span>
                {tab.badge && (
                  <Badge variant="secondary" className="h-5 px-2 text-xs">
                    {tab.badge}
                  </Badge>
                )}
              </div>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
