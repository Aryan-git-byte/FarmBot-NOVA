import { supabase, ApiData } from '../config/supabase';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

if (!OPENWEATHER_API_KEY) {
  throw new Error('Missing OpenWeather API key. Please check your .env file.');
}

export interface WeatherData {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  weather_condition: string;
  weather_description: string;
  visibility: number;
  rainfall: number;
  timestamp: string;
}

export interface WeatherForecast {
  date: string;
  temperature_min: number;
  temperature_max: number;
  humidity: number;
  weather_condition: string;
  weather_description: string;
  rainfall: number;
  wind_speed: number;
}

export class WeatherService {
  // Get current weather data
  static async getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      // Check cache first (data less than 30 minutes old)
      const cachedData = await this.getCachedWeatherData(lat, lon, 30);
      if (cachedData) {
        return cachedData;
      }

      const response = await fetch(
        `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=hi`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      // Save raw API response to api_data table
      await this.saveApiData('OpenWeather', apiResponse, lat, lon);
      
      // Parse and return structured weather data
      const weatherData = this.parseWeatherData(apiResponse, lat, lon);
      return weatherData;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      
      // Try to get latest cached data as fallback
      const fallbackData = await this.getCachedWeatherData(lat, lon, 24 * 60); // 24 hours
      return fallbackData;
    }
  }

  // Get weather forecast
  static async getWeatherForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
    try {
      const response = await fetch(
        `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=hi`
      );

      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      // Save raw forecast API response to api_data table
      await this.saveApiData('OpenWeather_Forecast', apiResponse, lat, lon);
      
      // Parse and return forecast data
      const forecasts = this.parseForecastData(apiResponse);
      return forecasts;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      return [];
    }
  }

  // Save raw API data to api_data table
  private static async saveApiData(
    apiSource: string, 
    data: any, 
    latitude?: number, 
    longitude?: number
  ): Promise<void> {
    try {
      const apiData: Omit<ApiData, 'id'> = {
        timestamp: new Date().toISOString(),
        api_source: apiSource,
        data: data,
        latitude,
        longitude
      };

      const { error } = await supabase
        .from('api_data')
        .insert([apiData]);

      if (error) {
        console.error('Error saving API data:', error);
      }
    } catch (error) {
      console.error('Error in saveApiData:', error);
    }
  }

  // Parse OpenWeather API response to structured WeatherData
  private static parseWeatherData(apiResponse: any, lat: number, lon: number): WeatherData {
    return {
      id: `weather_${Date.now()}`,
      location: apiResponse.name || 'Unknown',
      latitude: lat,
      longitude: lon,
      temperature: Math.round(apiResponse.main.temp),
      humidity: apiResponse.main.humidity,
      pressure: apiResponse.main.pressure,
      wind_speed: Math.round((apiResponse.wind?.speed || 0) * 3.6), // Convert m/s to km/h
      wind_direction: apiResponse.wind?.deg || 0,
      weather_condition: apiResponse.weather[0].main,
      weather_description: apiResponse.weather[0].description,
      visibility: Math.round((apiResponse.visibility || 10000) / 1000), // Convert to km
      rainfall: apiResponse.rain?.['1h'] || 0,
      timestamp: new Date().toISOString()
    };
  }

  // Parse OpenWeather forecast API response
  private static parseForecastData(apiResponse: any): WeatherForecast[] {
    // Group by date and get daily summary
    const dailyForecasts = new Map<string, any[]>();
    
    apiResponse.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, []);
      }
      dailyForecasts.get(date)!.push(item);
    });

    const forecasts: WeatherForecast[] = [];
    
    dailyForecasts.forEach((dayData, date) => {
      const temps = dayData.map(d => d.main.temp);
      const humidities = dayData.map(d => d.main.humidity);
      const rainfall = dayData.reduce((sum, d) => sum + (d.rain?.['3h'] || 0), 0);
      const windSpeeds = dayData.map(d => d.wind?.speed || 0);
      
      // Get most common weather condition
      const conditions = dayData.map(d => d.weather[0].main);
      const mostCommonCondition = conditions.sort((a, b) =>
        conditions.filter(v => v === a).length - conditions.filter(v => v === b).length
      ).pop();

      const descriptions = dayData.map(d => d.weather[0].description);
      const mostCommonDescription = descriptions.sort((a, b) =>
        descriptions.filter(v => v === a).length - descriptions.filter(v => v === b).length
      ).pop();

      forecasts.push({
        date,
        temperature_min: Math.round(Math.min(...temps)),
        temperature_max: Math.round(Math.max(...temps)),
        humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
        weather_condition: mostCommonCondition || 'Clear',
        weather_description: mostCommonDescription || 'clear sky',
        rainfall: Math.round(rainfall * 10) / 10,
        wind_speed: Math.round(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length * 3.6)
      });
    });

    return forecasts.slice(0, 5); // Return 5-day forecast
  }

  // Get cached weather data from api_data table
  private static async getCachedWeatherData(
    lat: number, 
    lon: number, 
    maxAgeMinutes: number
  ): Promise<WeatherData | null> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - maxAgeMinutes);

      const { data, error } = await supabase
        .from('api_data')
        .select('*')
        .eq('api_source', 'OpenWeather')
        .gte('timestamp', cutoffTime.toISOString())
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return null;
      }

      const cachedRecord = data[0];
      
      // Check if location is close enough (within ~1km)
      if (cachedRecord.latitude && cachedRecord.longitude) {
        const distance = this.calculateDistance(lat, lon, cachedRecord.latitude, cachedRecord.longitude);
        if (distance > 1) {
          return null;
        }
      }

      // Parse the cached API data
      const weatherData = this.parseWeatherData(cachedRecord.data, lat, lon);
      weatherData.timestamp = cachedRecord.timestamp; // Use original timestamp
      
      return weatherData;
    } catch (error) {
      console.error('Error getting cached weather data:', error);
      return null;
    }
  }

  // Get historical weather data from api_data
  static async getHistoricalWeatherData(
    lat: number, 
    lon: number, 
    days: number = 7
  ): Promise<WeatherData[]> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setDate(cutoffTime.getDate() - days);

      const { data, error } = await supabase
        .from('api_data')
        .select('*')
        .eq('api_source', 'OpenWeather')
        .gte('timestamp', cutoffTime.toISOString())
        .order('timestamp', { ascending: false });

      if (error || !data) {
        return [];
      }

      // Filter by location and parse data
      const weatherHistory: WeatherData[] = [];
      
      data.forEach(record => {
        if (record.latitude && record.longitude) {
          const distance = this.calculateDistance(lat, lon, record.latitude, record.longitude);
          if (distance <= 5) { // Within 5km
            const weatherData = this.parseWeatherData(record.data, lat, lon);
            weatherData.timestamp = record.timestamp;
            weatherHistory.push(weatherData);
          }
        }
      });

      return weatherHistory;
    } catch (error) {
      console.error('Error getting historical weather data:', error);
      return [];
    }
  }

  // Calculate distance between two coordinates
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Generate weather-based advice in Hindi/Bhojpuri
  static generateWeatherAdvice(weather: WeatherData, language: string = 'hi'): string[] {
    const advice: string[] = [];
    
    const translations = {
      hi: {
        hotWeather: 'बहुत गर्मी है, पौधों को छाया दें और ज्यादा पानी दें',
        coldWeather: 'ठंड है, पौधों को ढकें और सुबह पानी न दें',
        highHumidity: 'नमी ज्यादा है, फंगल रोग से बचाव करें',
        lowHumidity: 'हवा सूखी है, पत्तियों पर पानी का छिड़काव करें',
        rainExpected: 'बारिश आने वाली है, सिंचाई रोक दें',
        strongWind: 'तेज हवा चल रही है, पौधों को सहारा दें',
        goodWeather: 'मौसम अच्छा है, खेती के काम करने का अच्छा समय है'
      }
    };

    const t = translations.hi; // Default to Hindi

    // Temperature advice
    if (weather.temperature > 35) {
      advice.push(t.hotWeather);
    } else if (weather.temperature < 10) {
      advice.push(t.coldWeather);
    }

    // Humidity advice
    if (weather.humidity > 80) {
      advice.push(t.highHumidity);
    } else if (weather.humidity < 30) {
      advice.push(t.lowHumidity);
    }

    // Rain advice
    if (weather.rainfall > 0 || weather.weather_condition.includes('Rain')) {
      advice.push(t.rainExpected);
    }

    // Wind advice
    if (weather.wind_speed > 25) {
      advice.push(t.strongWind);
    }

    // Good weather
    if (weather.temperature >= 20 && weather.temperature <= 30 && 
        weather.humidity >= 40 && weather.humidity <= 70 && 
        weather.wind_speed < 15) {
      advice.push(t.goodWeather);
    }

    return advice;
  }

  // Get weather icon based on condition
  static getWeatherIcon(condition: string): string {
    const iconMap: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    
    return iconMap[condition] || '🌤️';
  }
}