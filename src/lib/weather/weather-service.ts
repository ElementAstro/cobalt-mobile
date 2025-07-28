import { simulationEngine } from '../simulation-engine';

export interface WeatherConditions {
  temperature: number; // Celsius
  humidity: number; // Percentage
  pressure: number; // hPa
  windSpeed: number; // km/h
  windDirection: number; // degrees
  cloudCover: number; // Percentage
  visibility: number; // km
  dewPoint: number; // Celsius
  uvIndex: number;
  timestamp: Date;
}

export interface AstronomicalConditions {
  seeing: number; // arcseconds
  transparency: number; // 0-10 scale
  skyQuality: number; // SQM reading
  lightPollution: number; // Bortle scale
  moonPhase: number; // 0-1 (0 = new moon, 1 = full moon)
  moonAltitude: number; // degrees
  moonIllumination: number; // percentage
  sunAltitude: number; // degrees (negative = below horizon)
}

export interface WeatherForecast {
  current: WeatherConditions;
  astronomical: AstronomicalConditions;
  hourly: Array<WeatherConditions & { hour: number }>;
  daily: Array<{
    date: Date;
    conditions: WeatherConditions;
    astronomical: AstronomicalConditions;
    imagingQuality: 'excellent' | 'good' | 'fair' | 'poor';
    qualityScore: number; // 0-100
  }>;
  alerts: WeatherAlert[];
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory';
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  affectsImaging: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  elevation: number; // meters
  timezone: string;
  name: string;
}

class WeatherService {
  private apiKey: string | null = null;
  private location: LocationData | null = null;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    // In a real implementation, this would come from environment variables
    this.apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY || null;
  }

  setLocation(location: LocationData) {
    this.location = location;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getCacheKey(endpoint: string, params: Record<string, any> = {}): string {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  async getCurrentWeather(): Promise<WeatherConditions> {
    const cacheKey = this.getCacheKey('current_weather');
    const cached = this.getFromCache<WeatherConditions>(cacheKey);
    if (cached) return cached;

    // Simulate weather data if no API key or in development
    if (!this.apiKey || process.env.NODE_ENV === 'development') {
      const conditions = this.generateSimulatedWeather();
      this.setCache(cacheKey, conditions);
      return conditions;
    }

    try {
      // In a real implementation, this would call an actual weather API
      const response = await this.fetchWeatherAPI('current');
      const conditions = this.parseWeatherResponse(response);
      this.setCache(cacheKey, conditions);
      return conditions;
    } catch (error) {
      console.warn('Weather API failed, using simulated data:', error);
      const conditions = this.generateSimulatedWeather();
      this.setCache(cacheKey, conditions);
      return conditions;
    }
  }

  async getAstronomicalConditions(): Promise<AstronomicalConditions> {
    const cacheKey = this.getCacheKey('astronomical');
    const cached = this.getFromCache<AstronomicalConditions>(cacheKey);
    if (cached) return cached;

    const conditions = this.calculateAstronomicalConditions();
    this.setCache(cacheKey, conditions, 30 * 60 * 1000); // 30 minutes cache
    return conditions;
  }

  async getWeatherForecast(days: number = 7): Promise<WeatherForecast> {
    const cacheKey = this.getCacheKey('forecast', { days });
    const cached = this.getFromCache<WeatherForecast>(cacheKey);
    if (cached) return cached;

    const current = await this.getCurrentWeather();
    const astronomical = await this.getAstronomicalConditions();
    
    const forecast: WeatherForecast = {
      current,
      astronomical,
      hourly: this.generateHourlyForecast(24),
      daily: this.generateDailyForecast(days),
      alerts: this.generateWeatherAlerts()
    };

    this.setCache(cacheKey, forecast, 60 * 60 * 1000); // 1 hour cache
    return forecast;
  }

  private generateSimulatedWeather(): WeatherConditions {
    const envConditions = simulationEngine.getEnvironmentalConditions();
    
    return {
      temperature: envConditions.temperature + (Math.random() - 0.5) * 4,
      humidity: Math.max(0, Math.min(100, envConditions.humidity + (Math.random() - 0.5) * 20)),
      pressure: envConditions.pressure + (Math.random() - 0.5) * 10,
      windSpeed: Math.max(0, envConditions.windSpeed + (Math.random() - 0.5) * 10),
      windDirection: Math.random() * 360,
      cloudCover: Math.max(0, Math.min(100, envConditions.cloudCover + (Math.random() - 0.5) * 30)),
      visibility: Math.max(1, Math.min(50, 25 + (Math.random() - 0.5) * 20)),
      dewPoint: envConditions.temperature - 5 + (Math.random() - 0.5) * 6,
      uvIndex: Math.max(0, Math.min(11, Math.random() * 2)), // Low at night
      timestamp: new Date()
    };
  }

  private calculateAstronomicalConditions(): AstronomicalConditions {
    const now = new Date();
    const envConditions = simulationEngine.getEnvironmentalConditions();
    
    // Calculate moon phase (simplified)
    const moonPhase = this.calculateMoonPhase(now);
    const moonAltitude = this.calculateMoonAltitude(now);
    const sunAltitude = this.calculateSunAltitude(now);
    
    return {
      seeing: Math.max(0.8, Math.min(5.0, envConditions.seeing + (Math.random() - 0.5) * 0.5)),
      transparency: Math.max(1, Math.min(10, 7 + (Math.random() - 0.5) * 3)),
      skyQuality: Math.max(15, Math.min(22, 20 + (Math.random() - 0.5) * 4)),
      lightPollution: envConditions.lightPollution || 4,
      moonPhase,
      moonAltitude,
      moonIllumination: moonPhase * 100,
      sunAltitude
    };
  }

  private generateHourlyForecast(hours: number): Array<WeatherConditions & { hour: number }> {
    const forecast = [];
    const baseConditions = this.generateSimulatedWeather();
    
    for (let i = 0; i < hours; i++) {
      const hourConditions = {
        ...baseConditions,
        temperature: baseConditions.temperature + (Math.random() - 0.5) * 6,
        cloudCover: Math.max(0, Math.min(100, baseConditions.cloudCover + (Math.random() - 0.5) * 40)),
        windSpeed: Math.max(0, baseConditions.windSpeed + (Math.random() - 0.5) * 8),
        hour: i,
        timestamp: new Date(Date.now() + i * 60 * 60 * 1000)
      };
      forecast.push(hourConditions);
    }
    
    return forecast;
  }

  private generateDailyForecast(days: number) {
    const forecast = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const conditions = this.generateSimulatedWeather();
      const astronomical = this.calculateAstronomicalConditions();
      const qualityScore = this.calculateImagingQuality(conditions, astronomical);
      
      forecast.push({
        date,
        conditions,
        astronomical,
        imagingQuality: this.getQualityRating(qualityScore),
        qualityScore
      });
    }
    
    return forecast;
  }

  private generateWeatherAlerts(): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    
    // Simulate some weather alerts
    if (Math.random() < 0.3) {
      alerts.push({
        id: `alert-${Date.now()}`,
        type: 'warning',
        severity: 'moderate',
        title: 'High Wind Warning',
        description: 'Winds expected to exceed 25 km/h. Consider securing equipment.',
        startTime: new Date(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        affectsImaging: true
      });
    }
    
    return alerts;
  }

  private calculateImagingQuality(weather: WeatherConditions, astronomical: AstronomicalConditions): number {
    let score = 100;
    
    // Cloud cover impact (most important)
    score -= weather.cloudCover * 0.8;
    
    // Wind impact
    if (weather.windSpeed > 20) score -= (weather.windSpeed - 20) * 2;
    
    // Humidity impact
    if (weather.humidity > 80) score -= (weather.humidity - 80) * 0.5;
    
    // Seeing impact
    score -= (astronomical.seeing - 1) * 10;
    
    // Moon impact
    if (astronomical.moonAltitude > 0) {
      score -= astronomical.moonIllumination * 0.3;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private getQualityRating(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  private calculateMoonPhase(date: Date): number {
    // Simplified moon phase calculation
    const knownNewMoon = new Date('2024-01-11'); // Known new moon date
    const daysSinceNewMoon = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const lunarCycle = 29.53; // Average lunar cycle in days
    const phase = (daysSinceNewMoon % lunarCycle) / lunarCycle;
    return phase;
  }

  private calculateMoonAltitude(date: Date): number {
    // Simplified calculation - in reality would use proper astronomical calculations
    const hour = date.getHours();
    const moonPhase = this.calculateMoonPhase(date);

    // Approximate moon altitude based on time and phase
    let altitude = Math.sin((hour - 12) * Math.PI / 12) * 60;

    // Adjust for moon phase
    if (moonPhase < 0.5) {
      altitude += (0.5 - moonPhase) * 30;
    }

    return Math.max(-90, Math.min(90, altitude));
  }

  private calculateSunAltitude(date: Date): number {
    // Simplified sun altitude calculation
    const hour = date.getHours() + date.getMinutes() / 60;
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

    // Solar declination (simplified)
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);

    // Hour angle
    const hourAngle = 15 * (hour - 12);

    // Assume latitude of 40 degrees for simulation
    const latitude = this.location?.latitude || 40;

    // Solar altitude
    const altitude = Math.asin(
      Math.sin(declination * Math.PI / 180) * Math.sin(latitude * Math.PI / 180) +
      Math.cos(declination * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
    ) * 180 / Math.PI;

    return altitude;
  }

  private async fetchWeatherAPI(endpoint: string): Promise<any> {
    if (!this.location || !this.apiKey) {
      throw new Error('Location or API key not set');
    }

    const baseUrl = 'https://api.openweathermap.org/data/2.5';
    const url = `${baseUrl}/${endpoint}?lat=${this.location.latitude}&lon=${this.location.longitude}&appid=${this.apiKey}&units=metric`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    return response.json();
  }

  private parseWeatherResponse(data: any): WeatherConditions {
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: (data.wind?.speed || 0) * 3.6, // Convert m/s to km/h
      windDirection: data.wind?.deg || 0,
      cloudCover: data.clouds?.all || 0,
      visibility: (data.visibility || 10000) / 1000, // Convert m to km
      dewPoint: data.main.temp - ((100 - data.main.humidity) / 5), // Simplified calculation
      uvIndex: data.uvi || 0,
      timestamp: new Date()
    };
  }

  // Public utility methods
  isGoodForImaging(conditions: WeatherConditions, astronomical: AstronomicalConditions): boolean {
    return this.calculateImagingQuality(conditions, astronomical) >= 60;
  }

  getImagingRecommendation(forecast: WeatherForecast): string {
    const currentQuality = this.calculateImagingQuality(forecast.current, forecast.astronomical);

    if (currentQuality >= 80) {
      return "Excellent conditions for imaging! Clear skies and stable atmosphere.";
    } else if (currentQuality >= 60) {
      return "Good imaging conditions. Some minor atmospheric disturbances possible.";
    } else if (currentQuality >= 40) {
      return "Fair conditions. Consider shorter exposures or wait for improvement.";
    } else {
      return "Poor conditions for imaging. Consider postponing session.";
    }
  }

  findBestImagingWindow(forecast: WeatherForecast, durationHours: number = 4): { start: Date; end: Date; quality: number } | null {
    const hourly = forecast.hourly;
    let bestWindow = null;
    let bestScore = 0;

    for (let i = 0; i <= hourly.length - durationHours; i++) {
      const windowHours = hourly.slice(i, i + durationHours);
      const avgScore = windowHours.reduce((sum, hour) => {
        const astronomical = this.calculateAstronomicalConditions(); // Simplified
        return sum + this.calculateImagingQuality(hour, astronomical);
      }, 0) / windowHours.length;

      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestWindow = {
          start: windowHours[0].timestamp,
          end: windowHours[windowHours.length - 1].timestamp,
          quality: avgScore
        };
      }
    }

    return bestWindow;
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
export default weatherService;
