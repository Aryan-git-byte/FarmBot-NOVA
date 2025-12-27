/**
 * External API Integration Service
 * Handles real-time data fetching from various agricultural and environmental APIs
 * Author: Aryan Kumar
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SoilGridsData {
  soil_ph: number | null;
  organic_carbon: number | null;
  nitrogen: number | null;
  cec: number | null; // Cation Exchange Capacity
  clay_content: number | null;
  sand_content: number | null;
  silt_content: number | null;
  bdod: number | null; // Bulk Density
  source: 'SoilGrids';
  confidence: number;
  depth: string; // e.g., "0-5cm"
}

export interface OpenWeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  rainfall: number; // mm in last hour
  rainfall_daily: number; // mm in last 24h
  weather_condition: string;
  weather_description: string;
  clouds: number;
  uv_index?: number;
  source: 'OpenWeather';
  timestamp: Date;
}

export interface CropInfo {
  crop_name: string;
  scientific_name: string;
  optimal_ph_range: [number, number];
  optimal_temp_range: [number, number];
  water_requirement: 'low' | 'medium' | 'high';
  growing_season: string;
  npk_requirement: {
    nitrogen: string;
    phosphorus: string;
    potassium: string;
  };
  description: string;
  source: 'FAO' | 'Wikidata' | 'ICAR';
}

export interface ApiCacheEntry {
  data: any;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
}

// ============================================================================
// SOILGRIDS API SERVICE
// ============================================================================

export class SoilGridsService {
  private static readonly BASE_URL = 'https://rest.isric.org/soilgrids/v2.0';
  private static cache = new Map<string, ApiCacheEntry>();
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Fetch soil properties from SoilGrids API
   */
  static async fetchSoilData(
    latitude: number,
    longitude: number,
    depth: string = '0-5cm'
  ): Promise<SoilGridsData> {
    const cacheKey = `soilgrids_${latitude}_${longitude}_${depth}`;
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached as SoilGridsData;
    }

    try {
      // SoilGrids properties endpoint
      const properties = ['phh2o', 'soc', 'nitrogen', 'cec', 'clay', 'sand', 'silt', 'bdod'];
      const url = `${this.BASE_URL}/properties/query?lon=${longitude}&lat=${latitude}&property=${properties.join('&property=')}&depth=${depth}&value=mean`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`SoilGrids API error: ${response.status}`);
      }

      const data = await response.json();
      
      const soilData: SoilGridsData = {
        soil_ph: this.extractValue(data, 'phh2o', depth) !== null ? this.extractValue(data, 'phh2o', depth)! / 10 : null, // Convert to pH scale
        organic_carbon: this.extractValue(data, 'soc', depth) !== null ? this.extractValue(data, 'soc', depth)! / 10 : null, // g/kg
        nitrogen: this.extractValue(data, 'nitrogen', depth) !== null ? this.extractValue(data, 'nitrogen', depth)! / 100 : null, // g/kg
        cec: this.extractValue(data, 'cec', depth) !== null ? this.extractValue(data, 'cec', depth)! / 10 : null, // cmol(c)/kg
        clay_content: this.extractValue(data, 'clay', depth) !== null ? this.extractValue(data, 'clay', depth)! / 10 : null, // %
        sand_content: this.extractValue(data, 'sand', depth) !== null ? this.extractValue(data, 'sand', depth)! / 10 : null, // %
        silt_content: this.extractValue(data, 'silt', depth) !== null ? this.extractValue(data, 'silt', depth)! / 10 : null, // %
        bdod: this.extractValue(data, 'bdod', depth) !== null ? this.extractValue(data, 'bdod', depth)! / 100 : null, // kg/dm³
        source: 'SoilGrids',
        confidence: 0.8,
        depth: depth
      };

      // Cache the result
      this.setCachedData(cacheKey, soilData);

      return soilData;
    } catch (error) {
      console.error('SoilGrids API error:', error);
      throw new Error(`Failed to fetch soil data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static extractValue(data: any, property: string, depth: string): number | null {
    try {
      const propertyData = data.properties.layers.find((layer: any) => 
        layer.name === property
      );
      
      if (!propertyData) return null;

      const depthData = propertyData.depths.find((d: any) => 
        d.label === depth || d.range.label === depth
      );

      return depthData?.values?.mean || null;
    } catch {
      return null;
    }
  }

  private static getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      ttl: this.CACHE_TTL
    });
  }
}

// ============================================================================
// OPENWEATHER API SERVICE (Enhanced)
// ============================================================================

export class EnhancedOpenWeatherService {
  private static cache = new Map<string, ApiCacheEntry>();
  private static readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private static readonly API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

  /**
   * Fetch comprehensive weather data
   */
  static async fetchWeatherData(
    latitude: number,
    longitude: number
  ): Promise<OpenWeatherData> {
    if (!this.API_KEY || typeof this.API_KEY !== 'string' || this.API_KEY.trim() === '') {
      console.error('OpenWeather API key is invalid or not configured');
      throw new Error('OpenWeather API key not configured');
    }

    const cacheKey = `weather_${latitude}_${longitude}`;

    // Check cache
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached as OpenWeatherData;
    }

    try {
      // Current weather endpoint
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.API_KEY}&units=metric`;
      console.debug('Fetching weather data from URL:', currentUrl);

      const response = await fetch(currentUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenWeather API error: ${response.status} - ${response.statusText}`, errorText);
        throw new Error(`OpenWeather API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      const weatherData: OpenWeatherData = {
        temperature: data.main?.temp || null,
        feels_like: data.main?.feels_like || null,
        humidity: data.main?.humidity || null,
        pressure: data.main?.pressure || null,
        wind_speed: data.wind?.speed || null,
        rainfall: data.rain?.['1h'] || 0,
        rainfall_daily: data.rain?.['1h'] ? data.rain['1h'] * 24 : 0, // Approximation
        weather_condition: data.weather?.[0]?.main || 'Unknown',
        weather_description: data.weather?.[0]?.description || 'No description',
        clouds: data.clouds?.all || 0,
        source: 'OpenWeather',
        timestamp: new Date()
      };

      // Try to get UV index from One Call API (if available)
      try {
        const oneCallUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&appid=${this.API_KEY}&units=metric&exclude=minutely,hourly`;
        console.debug('Fetching additional weather data from URL:', oneCallUrl);

        const oneCallResponse = await fetch(oneCallUrl);
        if (oneCallResponse.ok) {
          const oneCallData = await oneCallResponse.json();
          weatherData.uv_index = oneCallData.current?.uvi || null;
          weatherData.rainfall_daily = oneCallData.daily?.[0]?.rain || 0;
        } else {
          console.warn('Failed to fetch UV index data:', oneCallResponse.status, oneCallResponse.statusText);
        }
      } catch (uvError) {
        console.warn('Optional UV index fetch failed:', uvError);
      }

      // Cache the result
      this.setCachedData(cacheKey, weatherData);

      return weatherData;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      ttl: this.CACHE_TTL
    });
  }
}

// ============================================================================
// FAO / WIKIDATA CROP INFORMATION SERVICE
// ============================================================================

export class CropInformationService {
  private static cache = new Map<string, ApiCacheEntry>();
  private static readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Fetch crop information from multiple sources
   */
  static async fetchCropInfo(cropName: string): Promise<CropInfo | null> {
    const cacheKey = `crop_${cropName.toLowerCase()}`;
    
    // Check cache
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached as CropInfo;
    }

    try {
      // Try Wikidata first (free, no API key needed)
      const cropInfo = await this.fetchFromWikidata(cropName);
      
      if (cropInfo) {
        this.setCachedData(cacheKey, cropInfo);
        return cropInfo;
      }

      // Fallback to hardcoded database for common crops
      const fallback = this.getFallbackCropInfo(cropName);
      if (fallback) {
        this.setCachedData(cacheKey, fallback);
      }
      
      return fallback;
    } catch (error) {
      console.error('Crop information fetch error:', error);
      return this.getFallbackCropInfo(cropName);
    }
  }

  private static async fetchFromWikidata(cropName: string): Promise<CropInfo | null> {
    try {
      // Wikidata SPARQL query for crop information
      const query = `
        SELECT ?crop ?cropLabel ?scientificName WHERE {
          ?crop wdt:P31 wd:Q28257; # Instance of cultivar
                rdfs:label "${cropName}"@en;
                wdt:P225 ?scientificName.
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 1
      `;

      const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
      const response = await fetch(url);

      if (!response.ok) return null;

      const data = await response.json();
      
      if (data.results.bindings.length === 0) return null;

      const result = data.results.bindings[0];
      
      // Return basic info (extended details from fallback)
      const defaultProps = this.getDefaultCropProperties();
      return {
        crop_name: result.cropLabel.value,
        scientific_name: result.scientificName.value,
        optimal_ph_range: defaultProps.optimal_ph_range!,
        optimal_temp_range: defaultProps.optimal_temp_range!,
        water_requirement: defaultProps.water_requirement!,
        growing_season: defaultProps.growing_season!,
        npk_requirement: defaultProps.npk_requirement!,
        description: defaultProps.description!,
        source: 'Wikidata'
      };
    } catch {
      return null;
    }
  }

  private static getDefaultCropProperties(): Omit<CropInfo, 'crop_name' | 'scientific_name' | 'source'> {
    // Default properties that will be merged
    return {
      optimal_ph_range: [6.0, 7.5],
      optimal_temp_range: [20, 30],
      water_requirement: 'medium',
      growing_season: 'Season varies by region',
      npk_requirement: {
        nitrogen: 'Medium',
        phosphorus: 'Medium',
        potassium: 'Medium'
      },
      description: 'Crop information retrieved from agricultural database'
    };
  }

  /**
   * Fallback crop database for common crops
   */
  private static getFallbackCropInfo(cropName: string): CropInfo | null {
    const crops: Record<string, CropInfo> = {
      rice: {
        crop_name: 'Rice',
        scientific_name: 'Oryza sativa',
        optimal_ph_range: [5.5, 7.0],
        optimal_temp_range: [20, 35],
        water_requirement: 'high',
        growing_season: 'Kharif (June-November)',
        npk_requirement: { nitrogen: 'High', phosphorus: 'Medium', potassium: 'Medium' },
        description: 'Major cereal crop, requires flooded conditions',
        source: 'ICAR'
      },
      wheat: {
        crop_name: 'Wheat',
        scientific_name: 'Triticum aestivum',
        optimal_ph_range: [6.0, 7.5],
        optimal_temp_range: [12, 25],
        water_requirement: 'medium',
        growing_season: 'Rabi (November-April)',
        npk_requirement: { nitrogen: 'High', phosphorus: 'Medium', potassium: 'Low' },
        description: 'Winter cereal crop, requires cool temperatures',
        source: 'ICAR'
      },
      maize: {
        crop_name: 'Maize/Corn',
        scientific_name: 'Zea mays',
        optimal_ph_range: [5.8, 7.0],
        optimal_temp_range: [21, 30],
        water_requirement: 'medium',
        growing_season: 'Kharif or Summer',
        npk_requirement: { nitrogen: 'High', phosphorus: 'Medium', potassium: 'Medium' },
        description: 'Versatile cereal crop, heat-loving',
        source: 'ICAR'
      },
      chickpea: {
        crop_name: 'Chickpea',
        scientific_name: 'Cicer arietinum',
        optimal_ph_range: [6.0, 8.0],
        optimal_temp_range: [20, 30],
        water_requirement: 'low',
        growing_season: 'Rabi (October-March)',
        npk_requirement: { nitrogen: 'Low', phosphorus: 'High', potassium: 'Medium' },
        description: 'Pulse crop, drought-tolerant',
        source: 'ICAR'
      },
      tomato: {
        crop_name: 'Tomato',
        scientific_name: 'Solanum lycopersicum',
        optimal_ph_range: [6.0, 7.0],
        optimal_temp_range: [20, 27],
        water_requirement: 'medium',
        growing_season: 'Year-round with irrigation',
        npk_requirement: { nitrogen: 'Medium', phosphorus: 'High', potassium: 'High' },
        description: 'Vegetable crop, requires regular watering',
        source: 'ICAR'
      },
      potato: {
        crop_name: 'Potato',
        scientific_name: 'Solanum tuberosum',
        optimal_ph_range: [5.5, 6.5],
        optimal_temp_range: [15, 20],
        water_requirement: 'medium',
        growing_season: 'Rabi (October-March)',
        npk_requirement: { nitrogen: 'Medium', phosphorus: 'High', potassium: 'High' },
        description: 'Tuber crop, prefers cool weather',
        source: 'ICAR'
      },
      cotton: {
        crop_name: 'Cotton',
        scientific_name: 'Gossypium',
        optimal_ph_range: [6.0, 7.5],
        optimal_temp_range: [21, 30],
        water_requirement: 'medium',
        growing_season: 'Kharif (April-October)',
        npk_requirement: { nitrogen: 'High', phosphorus: 'Medium', potassium: 'High' },
        description: 'Fiber crop, requires warm climate',
        source: 'ICAR'
      },
      sugarcane: {
        crop_name: 'Sugarcane',
        scientific_name: 'Saccharum officinarum',
        optimal_ph_range: [6.0, 7.5],
        optimal_temp_range: [25, 35],
        water_requirement: 'high',
        growing_season: 'Year-long crop (12-18 months)',
        npk_requirement: { nitrogen: 'High', phosphorus: 'Medium', potassium: 'High' },
        description: 'Long-duration crop, high water demand',
        source: 'ICAR'
      }
    };

    const normalizedName = cropName.toLowerCase().trim();
    return crops[normalizedName] || null;
  }

  /**
   * Search for crops based on conditions
   */
  static async searchCropsByConditions(
    ph?: number,
    temperature?: number,
    rainfall?: number
  ): Promise<CropInfo[]> {
    const allCrops = [
      'rice', 'wheat', 'maize', 'chickpea', 'tomato', 
      'potato', 'cotton', 'sugarcane'
    ];

    const suitableCrops: CropInfo[] = [];

    for (const cropName of allCrops) {
      const cropInfo = await this.fetchCropInfo(cropName);
      if (!cropInfo) continue;

      let suitable = true;

      // Check pH compatibility
      if (ph !== undefined) {
        const [minPh, maxPh] = cropInfo.optimal_ph_range;
        if (ph < minPh - 0.5 || ph > maxPh + 0.5) {
          suitable = false;
        }
      }

      // Check temperature compatibility
      if (temperature !== undefined) {
        const [minTemp, maxTemp] = cropInfo.optimal_temp_range;
        if (temperature < minTemp - 5 || temperature > maxTemp + 5) {
          suitable = false;
        }
      }

      // Check water requirement vs rainfall
      if (rainfall !== undefined) {
        if (rainfall < 400 && cropInfo.water_requirement === 'high') {
          suitable = false;
        }
        if (rainfall > 1500 && cropInfo.water_requirement === 'low') {
          suitable = false; // Too much water for drought-tolerant crops
        }
      }

      if (suitable) {
        suitableCrops.push(cropInfo);
      }
    }

    return suitableCrops;
  }

  private static getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      ttl: this.CACHE_TTL
    });
  }
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const ExternalApiService = {
  SoilGrids: SoilGridsService,
  Weather: EnhancedOpenWeatherService,
  Crops: CropInformationService
};
