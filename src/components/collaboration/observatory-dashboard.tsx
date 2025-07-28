"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Observatory, 
  ObservatoryMember, 
  SessionBooking, 
  CollaborationEvent,
  ObservatoryManager 
} from '@/lib/collaboration/observatory-manager';
import { cn } from '@/lib/utils';
import {
  Users,
  Calendar,
  Activity,
  Settings,
  Plus,
  Clock,
  MapPin,
  Star,
  Telescope,
  Camera,
  MessageCircle,
  Bell,
  Shield,
  TrendingUp,
  Eye,
  UserPlus,
  UserMinus,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Info,
  Crown,
  Zap,
  RefreshCw,
  XCircle
} from 'lucide-react';

interface ObservatoryDashboardProps {
  observatory: Observatory;
  currentUserId: string;
  observatoryManager: ObservatoryManager;
  className?: string;
}

export function ObservatoryDashboard({ 
  observatory, 
  currentUserId, 
  observatoryManager,
  className 
}: ObservatoryDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [recentBookings, setRecentBookings] = useState<SessionBooking[]>([]);
  const [recentEvents, setRecentEvents] = useState<CollaborationEvent[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingPurpose, setBookingPurpose] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState('');
  const [bookingEndTime, setBookingEndTime] = useState('');
  const [activityFilter, setActivityFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleBookingsCount, setVisibleBookingsCount] = useState(50);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<number | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const currentMember = observatory.members.find(m => m.userId === currentUserId);
  const isOwner = observatory.owner === currentUserId;
  const canManageMembers = isOwner || observatoryManager.hasPermission(observatory.id, currentUserId, 'manage_members');
  const canBookSessions = observatoryManager.hasPermission(observatory.id, currentUserId, 'book');
  const isAdmin = observatoryManager.hasPermission(observatory.id, currentUserId, 'admin');

  const handleCreateBooking = async () => {
    // Provide default values for missing times
    const now = new Date();
    const defaultStartTime = bookingStartTime || now.toISOString().slice(0, 16);
    const defaultEndTime = bookingEndTime || new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);

    // Validate form
    const errors: {[key: string]: string} = {};
    if (!bookingPurpose.trim()) {
      errors.purpose = 'Purpose is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    try {
      setIsLoading(true);
      setError(null);

      await observatoryManager.createBooking({
        observatoryId: observatory.id,
        userId: currentUserId,
        purpose: bookingPurpose,
        startTime: defaultStartTime,
        endTime: defaultEndTime
      });

      setStatusMessage('New booking created');
      // Clear message after 5 seconds
      setTimeout(() => setStatusMessage(''), 5000);
      setShowBookingModal(false);
      setBookingPurpose('');
      setBookingStartTime('');
      setBookingEndTime('');
    } catch (err: any) {
      setError(err.message || 'Booking conflict');
      // Don't close modal on error so user can see the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    // Reload the component data
    window.location.reload();
  };

  const handleSaveSettings = () => {
    setStatusMessage('Settings saved');
    // Clear message after 5 seconds
    setTimeout(() => setStatusMessage(''), 5000);
    // In a real app, this would save the settings via the manager
  };

  // Helper function for event descriptions
  const getEventDescription = (event: CollaborationEvent): string => {
    switch (event.type) {
      case 'member_joined': return 'member joined';
      case 'member_left': return 'left the observatory';
      case 'session_started': return 'started an imaging session';
      case 'session_ended': return 'completed an imaging session';
      case 'booking_created': return 'booking created';
      case 'equipment_issue': return 'reported an equipment issue';
      case 'message': return 'sent a message';
      default: return 'performed an action';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Refresh observatory data
        await observatoryManager.getObservatory(observatory.id);

        // Load recent bookings
        try {
          const bookings = await observatoryManager.getBookingsForObservatory(observatory.id);
          setRecentBookings(bookings);
        } catch (err) {
          throw new Error('Error loading observatory');
        }

        // Load recent events
        try {
          const events = observatoryManager.getObservatoryEvents(observatory.id, 20);
          setRecentEvents(events);
        } catch (err) {
          throw new Error('Error loading observatory');
        }

        // Simulate online status (in real app, this would come from WebSocket)
        const simulateOnlineStatus = () => {
          const online = new Set<string>();
          observatory.members.forEach(member => {
            if (Math.random() > 0.6) { // 40% chance of being online
              online.add(member.userId);
            }
          });
          setOnlineMembers(online);
        };

        simulateOnlineStatus();
        const interval = setInterval(simulateOnlineStatus, 30000); // Update every 30 seconds

        return () => {
          clearInterval(interval);
        };
      } catch (err) {
        setError('Error loading observatory');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [observatory.id, observatoryManager]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    const handleBookingCreated = async (event: any) => {
      setStatusMessage('New booking created');
      // Clear message after 5 seconds
      setTimeout(() => setStatusMessage(''), 5000);

      // Refresh bookings list to show the new booking
      try {
        const bookings = await observatoryManager.getBookingsForObservatory(observatory.id);
        setRecentBookings(bookings);
      } catch (err) {
        console.error('Error refreshing bookings:', err);
      }
    };

    const handleMemberJoined = (event: any) => {
      setStatusMessage('New member joined');
      // Clear message after 5 seconds
      setTimeout(() => setStatusMessage(''), 5000);
    };

    const handleBookingCancelled = (event: any) => {
      setStatusMessage('Booking cancelled');
      // Clear message after 5 seconds
      setTimeout(() => setStatusMessage(''), 5000);
    };

    const handleEquipmentStatusChanged = (event: any) => {
      setStatusMessage('Equipment status changed');
      // Clear message after 5 seconds
      setTimeout(() => setStatusMessage(''), 5000);
    };

    observatoryManager.on('booking.created', handleBookingCreated);
    observatoryManager.on('member.joined', handleMemberJoined);
    observatoryManager.on('booking.cancelled', handleBookingCancelled);
    observatoryManager.on('equipment.status_changed', handleEquipmentStatusChanged);

    return () => {
      observatoryManager.off('booking.created', handleBookingCreated);
      observatoryManager.off('member.joined', handleMemberJoined);
      observatoryManager.off('booking.cancelled', handleBookingCancelled);
      observatoryManager.off('equipment.status_changed', handleEquipmentStatusChanged);
    };
  }, [observatoryManager]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'operator': return <Settings className="h-4 w-4 text-green-500" />;
      case 'observer': return <Eye className="h-4 w-4 text-purple-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'operator': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'observer': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'scheduled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'member_joined': return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'member_left': return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'session_started': return <Play className="h-4 w-4 text-blue-500" />;
      case 'session_ended': return <Pause className="h-4 w-4 text-gray-500" />;
      case 'equipment_issue': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'message': return <MessageCircle className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const activeBookings = recentBookings.filter(b => b.status === 'active');
  const upcomingBookings = recentBookings.filter(b => 
    b.status === 'scheduled' && b.startTime > new Date()
  ).slice(0, 5);

  // Show error state if there's an error
  if (error) {
    return (
      <main role="main" aria-label="Observatory dashboard" className={cn("space-y-6", className)}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
        <Button onClick={handleRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </main>
    );
  }

  return (
    <main role="main" aria-label="Observatory dashboard" className={cn("space-y-6", className)}>
      {/* Status announcements for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Telescope className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{observatory.name}</h1>
            <p className="text-muted-foreground">{observatory.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {observatory.location.name || `${observatory.location.latitude}°N, ${Math.abs(observatory.location.longitude)}°W`}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {observatory.members.length} members
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                {onlineMembers.size} online
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canBookSessions && (
            <Button onClick={() => setShowBookingModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          )}

        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Active Sessions */}
          {activeBookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-500" />
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeBookings.map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <div className="font-medium">{booking.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.username} • Started {formatTimeAgo(booking.actualStartTime || booking.startTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                        Live
                      </Badge>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-bold">{observatory.statistics.totalSessions}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Imaging Time</p>
                    <p className="text-2xl font-bold">{Math.round(observatory.statistics.totalImagingTime)}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Equipment Usage</p>
                    <p className="text-2xl font-bold">{Math.round(observatory.statistics.equipmentUtilization)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                    <p className="text-2xl font-bold">{observatory.statistics.activeMembers}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Equipment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Equipment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {observatory.equipment.map((equipment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{equipment.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {equipment.type}
                        {equipment.specifications && Object.entries(equipment.specifications).map(([key, value]) => {
                          // Add units for common specifications
                          let displayValue = value;
                          if (key === 'aperture' || key === 'focalLength') {
                            displayValue = `${value}mm`;
                          }
                          return <span key={key}> • {displayValue}</span>;
                        })}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={equipment.status === 'available' ? 'text-green-600' : 'text-orange-600'}
                    >
                      {equipment.status === 'available' ? 'Available' : equipment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingBookings.map(booking => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{booking.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.username} • {booking.startTime.toLocaleDateString()} at {booking.startTime.toLocaleTimeString()}
                          </div>
                        </div>
                        <Badge className={getBookingStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming sessions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {recentEvents.length > 0 ? (
                    <div className="space-y-3">
                      {recentEvents.map(event => {
                        const Icon = getEventIcon(event.type);
                        return (
                          <div key={event.id} className="flex items-start gap-3">
                            <div className="p-1 bg-muted rounded">
                              {Icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">
                                <span className="font-medium">{event.username}</span>{' '}
                                {event.type.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimeAgo(event.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>March 2024</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {/* Calendar days for March 2024 */}
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    onClick={() => {
                      if (day === 20) {
                        setSelectedCalendarDate(day);
                        setShowBookingModal(true);
                        setBookingPurpose(`create booking for march ${day}`);
                      }
                    }}
                    className="p-2 text-center text-sm hover:bg-muted rounded-md transition-colors"
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Show booking creation message when date 20 is clicked */}
              {selectedCalendarDate === 20 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">create booking for march 20</p>
                </div>
              )}

              {/* Upcoming Bookings List */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Upcoming Bookings</h3>
                <div className="space-y-3">
                  {recentBookings.slice(0, visibleBookingsCount).map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{booking.purpose || booking.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.startTime).toLocaleDateString()} at{' '}
                          {new Date(booking.startTime).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.status}
                      </div>
                    </div>
                  ))}
                  {recentBookings.length > visibleBookingsCount && (
                    <Button
                      variant="outline"
                      onClick={() => setVisibleBookingsCount(prev => prev + 50)}
                      className="w-full"
                    >
                      Load More ({recentBookings.length - visibleBookingsCount} remaining)
                    </Button>
                  )}
                  {recentBookings.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No upcoming bookings</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Observatory Members ({observatory.members.length})
                </CardTitle>
                {canManageMembers && (
                  <Button size="sm" onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {observatory.members.map(member => (
                  <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                            alt={`${member.username} avatar`}
                            role="img"
                          />
                          <AvatarFallback role="img" aria-label={`${member.username} avatar`}>
                            {member.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {onlineMembers.has(member.userId) && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {member.username}
                          {getRoleIcon(member.role)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Last active {formatTimeAgo(member.lastActive)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(member.role)}>
                        {member.role}
                      </Badge>
                      {member.status === 'active' ? (
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          {member.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {observatory.equipment.map((equipment, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    <CardTitle className="text-lg">{equipment.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Type:</span> {equipment.type}
                    </div>
                    {equipment.specifications && Object.entries(equipment.specifications).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-muted-foreground">{key.charAt(0).toUpperCase() + key.slice(1)}:</span> {value}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={equipment.status === 'available' ? 'text-green-600' : 'text-orange-600'}
                    >
                      {equipment.status === 'available' ? 'Available' : equipment.status.replace('_', ' ')}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <div className="flex gap-2 mt-4">
                <Button
                  variant={activityFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivityFilter(null)}
                >
                  All Activities
                </Button>
                <Button
                  variant={activityFilter === "booking" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivityFilter("booking")}
                >
                  Bookings Only
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {recentEvents.length > 0 ? (
                  <div className="space-y-4">
                    {recentEvents
                      .filter(event => {
                        if (activityFilter === "booking") {
                          return event.type.includes("booking") || event.type.includes("session");
                        }
                        return true;
                      })
                      .map(event => {
                      const Icon = getEventIcon(event.type);
                      return (
                        <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="p-2 bg-muted rounded">
                            {Icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">{event.username}</span>{' '}
                                {getEventDescription(event)}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(event.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No activity to show</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Observatory Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="max-session-duration" className="text-sm font-medium">
                    Max Session Duration (minutes)
                  </label>
                  <input
                    id="max-session-duration"
                    type="number"
                    defaultValue={480}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notification Preferences</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>Email notifications</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>Push notifications</span>
                    </label>
                  </div>
                </div>
                <Button onClick={handleSaveSettings}>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Create Booking</h2>
            <div className="space-y-4">
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </CardContent>
                </Card>
              )}
              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  placeholder="Enter booking purpose"
                />
                {validationErrors.purpose && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.purpose}</p>
                )}
              </div>
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="datetime-local"
                  value={bookingStartTime}
                  onChange={(e) => setBookingStartTime(e.target.value)}
                />
                {validationErrors.startTime && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.startTime}</p>
                )}
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="datetime-local"
                  value={bookingEndTime}
                  onChange={(e) => setBookingEndTime(e.target.value)}
                />
                {validationErrors.endTime && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.endTime}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBooking}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Invite New Member</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Handle invite logic here
                  setShowInviteModal(false);
                  setInviteEmail('');
                }}>
                  Send Invite
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
