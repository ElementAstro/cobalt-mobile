"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, Notification } from '@/lib/stores/notification-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  X,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Camera,
  Target,
  Cloud,
  Filter,
  Clock,
  Star,
} from 'lucide-react';

interface NotificationCenterProps {
  className?: string;
  onClose?: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'info':
      return Info;
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return AlertCircle;
    case 'equipment':
      return Camera;
    case 'sequence':
      return Target;
    case 'weather':
      return Cloud;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'info':
      return 'text-blue-500';
    case 'success':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    case 'equipment':
      return 'text-purple-500';
    case 'sequence':
      return 'text-indigo-500';
    case 'weather':
      return 'text-cyan-500';
    default:
      return 'text-muted-foreground';
  }
};

const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'critical':
      return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
    case 'high':
      return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
    case 'medium':
      return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
    case 'low':
      return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
    default:
      return 'border-l-gray-300';
  }
};

function NotificationItem({ notification, onMarkAsRead, onRemove }: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const Icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);
  const priorityStyle = getPriorityColor(notification.priority);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "border-l-4 p-4 rounded-r-lg transition-all duration-200",
        priorityStyle,
        !notification.read && "shadow-md"
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn("flex-shrink-0 mt-0.5", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={cn(
                "text-sm font-medium",
                !notification.read && "font-semibold"
              )}>
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {notification.category}
                </Badge>
                <Badge 
                  variant={notification.priority === 'critical' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {notification.priority}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {notification.actions && notification.actions.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {notification.actions.map((action) => (
                    <Button
                      key={action.id}
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={action.action}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 ml-2">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-8 w-8 p-0"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(notification.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title="Remove notification"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationCenter({ className, onClose }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    preferences,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    clearExpired,
    getNotificationsByCategory,
    getUnreadNotifications,
  } = useNotificationStore();

  const { announce } = useAccessibility();
  const [activeTab, setActiveTab] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  // Clear expired notifications on mount and periodically
  useEffect(() => {
    clearExpired();
    const interval = setInterval(clearExpired, 60000); // Every minute
    return () => clearInterval(interval);
  }, [clearExpired]);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
    announce('All notifications marked as read');
  }, [markAllAsRead, announce]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      clearAll();
      announce('All notifications cleared');
    }
  }, [clearAll, announce]);

  const getFilteredNotifications = useCallback(() => {
    switch (activeTab) {
      case 'unread':
        return getUnreadNotifications();
      case 'equipment':
        return getNotificationsByCategory('equipment');
      case 'imaging':
        return getNotificationsByCategory('imaging');
      case 'weather':
        return getNotificationsByCategory('weather');
      case 'system':
        return getNotificationsByCategory('system');
      default:
        return notifications;
    }
  }, [activeTab, notifications, getUnreadNotifications, getNotificationsByCategory]);

  const filteredNotifications = getFilteredNotifications();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("w-full max-w-2xl mx-auto", className)}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark All Read
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="flex items-center gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border rounded-lg p-4 space-y-3"
              >
                <h4 className="font-medium">Notification Settings</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Enabled</span>
                    <Badge variant={preferences.enabled ? 'default' : 'secondary'}>
                      {preferences.enabled ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sound</span>
                    <Badge variant={preferences.sound ? 'default' : 'secondary'}>
                      {preferences.sound ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quiet Hours</span>
                    <Badge variant={preferences.quietHours.enabled ? 'default' : 'secondary'}>
                      {preferences.quietHours.enabled ? 'On' : 'Off'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Categories</span>
                    <Badge variant="outline">
                      {Object.values(preferences.categories).filter(Boolean).length}/
                      {Object.keys(preferences.categories).length}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" className="text-xs">
                All
                {notifications.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Unread
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="equipment" className="text-xs">
                Equipment
              </TabsTrigger>
              <TabsTrigger value="imaging" className="text-xs">
                Imaging
              </TabsTrigger>
              <TabsTrigger value="weather" className="text-xs">
                Weather
              </TabsTrigger>
              <TabsTrigger value="system" className="text-xs">
                System
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No notifications</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? "You're all caught up!"
                      : `No ${activeTab} notifications`
                    }
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {filteredNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onRemove={removeNotification}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
