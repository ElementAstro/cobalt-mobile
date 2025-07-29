"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DesktopGrid, DesktopColumns, DesktopMasonry } from './desktop-grid';
import { DesktopHeader, DesktopTabs } from './desktop-navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Desktop Dashboard Layout
interface DesktopDashboardLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  metrics?: React.ReactNode[];
  primaryContent?: React.ReactNode;
  secondaryContent?: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export function DesktopDashboardLayout({
  title,
  subtitle,
  actions,
  metrics = [],
  primaryContent,
  secondaryContent,
  sidebar,
  className,
}: DesktopDashboardLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      {(title || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
            {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}

      {/* Metrics Row */}
      {metrics.length > 0 && (
        <DesktopGrid
          columns={{ desktop: 4, wide: 6, ultrawide: 8 }}
          gap="md"
          className="mb-6"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {metric}
            </motion.div>
          ))}
        </DesktopGrid>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Primary Content */}
        <div className={cn(
          "space-y-6",
          sidebar ? "lg:col-span-3" : "lg:col-span-4"
        )}>
          {primaryContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {primaryContent}
            </motion.div>
          )}
          
          {secondaryContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {secondaryContent}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        {sidebar && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            {sidebar}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Desktop Content Layout (for articles, documentation, etc.)
interface DesktopContentLayoutProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  content: React.ReactNode;
  tableOfContents?: React.ReactNode;
  relatedContent?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function DesktopContentLayout({
  title,
  breadcrumbs,
  content,
  tableOfContents,
  relatedContent,
  actions,
  className,
}: DesktopContentLayoutProps) {
  return (
    <div className={cn("max-w-none", className)}>
      {/* Header */}
      <DesktopHeader
        title={title}
        breadcrumbs={breadcrumbs}
        actions={actions}
        className="mb-8"
      />

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Table of Contents */}
        {tableOfContents && (
          <div className="xl:col-span-1">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contents</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {tableOfContents}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={cn(
          "space-y-6",
          tableOfContents && relatedContent ? "xl:col-span-3" :
          tableOfContents || relatedContent ? "xl:col-span-4" :
          "xl:col-span-5"
        )}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-neutral dark:prose-invert max-w-none"
          >
            {content}
          </motion.div>
        </div>

        {/* Related Content */}
        {relatedContent && (
          <div className="xl:col-span-1">
            <div className="sticky top-6 space-y-4">
              {relatedContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Desktop Multi-Panel Layout
interface DesktopMultiPanelLayoutProps {
  leftPanel?: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel?: React.ReactNode;
  leftPanelWidth?: number;
  rightPanelWidth?: number;
  className?: string;
}

export function DesktopMultiPanelLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  leftPanelWidth = 300,
  rightPanelWidth = 300,
  className,
}: DesktopMultiPanelLayoutProps) {
  return (
    <div className={cn("flex h-full gap-6", className)}>
      {/* Left Panel */}
      {leftPanel && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-shrink-0"
          style={{ width: leftPanelWidth }}
        >
          <Card className="h-full">
            <CardContent className="p-6 h-full overflow-auto">
              {leftPanel}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Center Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-w-0"
      >
        <Card className="h-full">
          <CardContent className="p-6 h-full overflow-auto">
            {centerPanel}
          </CardContent>
        </Card>
      </motion.div>

      {/* Right Panel */}
      {rightPanel && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0"
          style={{ width: rightPanelWidth }}
        >
          <Card className="h-full">
            <CardContent className="p-6 h-full overflow-auto">
              {rightPanel}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// Desktop Split Layout (50/50 or custom ratios)
interface DesktopSplitLayoutProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  ratio?: [number, number]; // e.g., [1, 1] for 50/50, [2, 1] for 66/33
  direction?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DesktopSplitLayout({
  leftContent,
  rightContent,
  ratio = [1, 1],
  direction = 'horizontal',
  gap = 'md',
  className,
}: DesktopSplitLayoutProps) {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  const gridTemplate = direction === 'horizontal' 
    ? `grid-cols-[${ratio[0]}fr_${ratio[1]}fr]`
    : `grid-rows-[${ratio[0]}fr_${ratio[1]}fr]`;

  return (
    <div className={cn(
      "grid h-full",
      gridTemplate,
      gapClasses[gap],
      className
    )}>
      <motion.div
        initial={{ opacity: 0, [direction === 'horizontal' ? 'x' : 'y']: -20 }}
        animate={{ opacity: 1, [direction === 'horizontal' ? 'x' : 'y']: 0 }}
        className="min-w-0 min-h-0"
      >
        <Card className="h-full">
          <CardContent className="p-6 h-full overflow-auto">
            {leftContent}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, [direction === 'horizontal' ? 'x' : 'y']: 20 }}
        animate={{ opacity: 1, [direction === 'horizontal' ? 'x' : 'y']: 0 }}
        transition={{ delay: 0.1 }}
        className="min-w-0 min-h-0"
      >
        <Card className="h-full">
          <CardContent className="p-6 h-full overflow-auto">
            {rightContent}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Desktop Tabbed Layout
interface DesktopTabbedLayoutProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    content: React.ReactNode;
    badge?: string | number;
  }>;
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export function DesktopTabbedLayout({
  tabs,
  defaultTab,
  className,
  onTabChange,
}: DesktopTabbedLayoutProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <DesktopTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {activeTabContent}
        </motion.div>
      </div>
    </div>
  );
}

// Desktop Card Grid Layout
interface DesktopCardGridLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  cards: React.ReactNode[];
  columns?: {
    desktop?: number;
    wide?: number;
    ultrawide?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function DesktopCardGridLayout({
  title,
  subtitle,
  actions,
  cards,
  columns = { desktop: 3, wide: 4, ultrawide: 5 },
  gap = 'lg',
  className,
}: DesktopCardGridLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      {(title || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}

      {/* Card Grid */}
      <DesktopGrid columns={columns} gap={gap}>
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {card}
          </motion.div>
        ))}
      </DesktopGrid>
    </div>
  );
}
