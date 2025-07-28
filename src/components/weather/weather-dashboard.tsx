"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWeatherStore, defaultLocations, startWeatherAutoRefresh } from '@/lib/stores/weather-store';
import { cn } from '@/lib/utils';
import {
  Cloud,
  CloudRain,
  Sun,
  Moon,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  Gauge,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Star,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface WeatherDashboardProps {
  className?: string;
  compact?: boolean;
}

export function WeatherDashboard({ className, compact = false }: WeatherDashboardProps) {
  const {
    currentWeather,
    astronomicalConditions,
    forecast,
    location,
    isLoading,
    lastUpdated,
    error,
    autoRefresh,
    setLocation,
    refreshWeather,
    setAutoRefresh,
    getImagingQuality,
    getImagingRecommendation,
    isGoodForImaging,
    getActiveAlerts,
    clearError
  } = useWeatherStore();

  const [selectedTab, setSelectedTab] = useState('current');

  useEffect(() => {
    // Start auto-refresh when component mounts
    if (autoRefresh && location) {
      startWeatherAutoRefresh();
    }

    // Initial data fetch if we have a location but no data
    if (location && !currentWeather && !isLoading) {
      refreshWeather();
    }
  }, [location, autoRefresh, currentWeather, isLoading, refreshWeather]);

  const handleLocationChange = (locationName: string) => {
    const selectedLocation = defaultLocations.find(loc => loc.name === locationName);
    if (selectedLocation) {
      setLocation(selectedLocation);
    }
  };

  const getWeatherIcon = (cloudCover: number, isNight: boolean) => {
    if (cloudCover > 70) return CloudRain;
    if (cloudCover > 30) return Cloud;
    return isNight ? Moon : Sun;
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-green-500';
    if (quality >= 60) return 'text-yellow-500';
    if (quality >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getQualityBadgeVariant = (quality: number) => {
    if (quality >= 80) return 'default';
    if (quality >= 60) return 'secondary';
    if (quality >= 40) return 'outline';
    return 'destructive';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Weather
            </div>
            {isGoodForImaging() && (
              <Badge variant="default" className="text-xs">
                Good for Imaging
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentWeather && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <span>{Math.round(currentWeather.temperature)}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-muted-foreground" />
                <span>{currentWeather.cloudCover}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-muted-foreground" />
                <span>{Math.round(currentWeather.windSpeed)} km/h</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>{astronomicalConditions?.seeing.toFixed(1)}"</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Quality</span>
            <div className="flex items-center gap-2">
              <Progress value={getImagingQuality()} className="w-16 h-2" />
              <span className={cn("text-xs font-medium", getQualityColor(getImagingQuality()))}>
                {getImagingQuality()}%
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshWeather}
            disabled={isLoading}
            className="w-full"
          >
            <RefreshCw className={cn("h-3 w-3 mr-2", isLoading && "animate-spin")} />
            {isLoading ? 'Updating...' : 'Refresh'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weather & Conditions</h2>
          <p className="text-muted-foreground">
            {location ? location.name : 'No location selected'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={location?.name || ''} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select location">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {location?.name || 'Select location'}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(defaultLocations || []).map((loc) => (
                <SelectItem key={loc.name} value={loc.name}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={refreshWeather}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={clearError} className="ml-auto">
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {getActiveAlerts().length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Weather Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getActiveAlerts().map((alert) => (
                <div key={alert.id} className="p-3 bg-yellow-50 rounded-lg">
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-sm text-muted-foreground">{alert.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Until {formatTime(alert.endTime)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="astronomical">Astronomical</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentWeather ? (
            <>
              {/* Imaging Quality Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Imaging Conditions</span>
                    <Badge variant={getQualityBadgeVariant(getImagingQuality())}>
                      {getImagingQuality()}% Quality
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={getImagingQuality()} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      {getImagingRecommendation()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Current Weather Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Temperature</p>
                        <p className="text-2xl font-bold">{Math.round(currentWeather.temperature)}°C</p>
                      </div>
                      <Thermometer className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Cloud Cover</p>
                        <p className="text-2xl font-bold">{currentWeather.cloudCover}%</p>
                      </div>
                      <Cloud className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Wind Speed</p>
                        <p className="text-2xl font-bold">{Math.round(currentWeather.windSpeed)}</p>
                        <p className="text-xs text-muted-foreground">km/h</p>
                      </div>
                      <Wind className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Humidity</p>
                        <p className="text-2xl font-bold">{currentWeather.humidity}%</p>
                      </div>
                      <Droplets className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  {isLoading ? 'Loading weather data...' : 'No weather data available'}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          {forecast ? (
            <div className="space-y-4">
              {/* Hourly Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle>24-Hour Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-4 overflow-x-auto">
                    {forecast.hourly.slice(0, 12).map((hour, index) => (
                      <div key={index} className="text-center space-y-2">
                        <div className="text-sm font-medium">
                          {formatTime(hour.timestamp)}
                        </div>
                        <div className="flex justify-center">
                          {React.createElement(getWeatherIcon(hour.cloudCover, true), {
                            className: "h-6 w-6 text-muted-foreground"
                          })}
                        </div>
                        <div className="text-sm">{Math.round(hour.temperature)}°</div>
                        <div className="text-xs text-muted-foreground">{hour.cloudCover}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Daily Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle>7-Day Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.daily.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium w-16">
                            {formatDate(day.date)}
                          </div>
                          {React.createElement(getWeatherIcon(day.conditions.cloudCover, true), {
                            className: "h-5 w-5 text-muted-foreground"
                          })}
                          <div className="text-sm">
                            {Math.round(day.conditions.temperature)}°C
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getQualityBadgeVariant(day.qualityScore)}>
                            {day.imagingQuality}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {day.qualityScore}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No forecast data available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="astronomical" className="space-y-4">
          {astronomicalConditions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Seeing Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Seeing</span>
                    <span className="font-mono">{astronomicalConditions.seeing.toFixed(1)}"</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Transparency</span>
                    <span className="font-mono">{astronomicalConditions.transparency}/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sky Quality</span>
                    <span className="font-mono">{astronomicalConditions.skyQuality.toFixed(1)} mag/arcsec²</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Celestial Objects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Moon Phase</span>
                    <span className="font-mono">{(astronomicalConditions.moonPhase * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Moon Altitude</span>
                    <span className="font-mono">{astronomicalConditions.moonAltitude.toFixed(1)}°</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sun Altitude</span>
                    <span className="font-mono">{astronomicalConditions.sunAltitude.toFixed(1)}°</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No astronomical data available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {formatTime(lastUpdated)} on {formatDate(lastUpdated)}
        </div>
      )}
    </div>
  );
}
