"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Trash2,
} from "lucide-react";

import { SequenceNotification, notificationService } from "../services/notification.service";
import { formatTime } from "../utils/sequencer.utils";

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<SequenceNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationBadgeVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const unreadCount = notifications.filter(n => !n.persistent).length;
  const errorCount = notifications.filter(n => n.type === 'error').length;

  if (!isOpen) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {(unreadCount > 0 || errorCount > 0) && (
            <Badge
              variant={errorCount > 0 ? 'destructive' : 'default'}
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
            >
              {errorCount > 0 ? errorCount : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className={`w-96 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {notifications.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {notifications.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => notificationService.clear()}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.type === 'error'
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                      : notification.type === 'warning'
                      ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
                      : notification.type === 'success'
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm">{notification.title}</div>
                        <Badge
                          variant={getNotificationBadgeVariant(notification.type)}
                          className="text-xs"
                        >
                          {notification.type}
                        </Badge>
                        <div className="text-xs text-muted-foreground ml-auto">
                          {formatTime(notification.timestamp)}
                        </div>
                      </div>
                      <p className="text-sm text-foreground">{notification.message}</p>
                      
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {notification.actions.map((action, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant={action.variant || 'outline'}
                              onClick={() => {
                                action.action();
                                if (!notification.persistent) {
                                  notificationService.remove(notification.id);
                                }
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => notificationService.remove(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for using notifications in components
export function useNotifications() {
  const [notifications, setNotifications] = useState<SequenceNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  return {
    notifications,
    notificationService,
    unreadCount: notifications.filter(n => !n.persistent).length,
    errorCount: notifications.filter(n => n.type === 'error').length,
  };
}
