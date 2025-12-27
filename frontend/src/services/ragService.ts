/**
 * RAG-based AI Question Answering System
 * Real-time agricultural intelligence without pre-stored datasets
 * Author: Aryan Kumar
 */

import {
  ExternalApiService,
  SoilGridsData,
  OpenWeatherData,
  CropInfo
} from './externalApiService';
// import { supabase } from '../config/supabase';
import type { ProcessedSensorReading } from '../config/supabase';
import { SensorService } from './sensorService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface QueryAnalysis {
  query_type: 
    | 'crop_recommendation' 
    | 'soil_analysis' 
    | 'weather_query' 
    | 'pest_disease'
    | 'fertilizer_advice'
    | 'irrigation_advice'
    | 'general_farming'
    | 'seasonal_planning';
  parameters: {
    soil_ph?: number;
    rainfall?: number;
    temperature?: number;
    location?: { latitude: number; longitude: number };
    crop_name?: string;
    season?: string;
    [key: string]: any;
  };
  recommended_apis: string[];
  confidence: number;
  extracted_entities: string[];
  needs_sensor_data?: boolean; // NEW: flag for land/field/farm queries
}

export interface MergedContext {
  soil_data?: SoilGridsData;
  weather_data?: OpenWeatherData;
  crop_recommendations?: CropInfo[];
  specific_crop?: CropInfo;
  sensor_data?: ProcessedSensorReading[]; // NEW: sensor data
  user_query: string;
  query_analysis: QueryAnalysis;
  location?: { latitude: number; longitude: number; name?: string };
  timestamp: Date;
}

export interface RagResponse {
  answer: string;
  confidence: number;
  sources: string[];
  data_used: {
    soil?: boolean;
    weather?: boolean;
    crops?: boolean;
    sensor?: boolean; // NEW: track if sensor data was used
  };
  recommendations?: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
  related_questions?: string[];
  thinking_process?: string[];
  response_time_ms: number;
}

// ============================================================================
// GROQ API CLIENT
// ============================================================================

class GroqClient {
  private static readonly API_KEYS = [
    import.meta.env.VITE_GROQ_API_KEY_1,
    import.meta.env.VITE_GROQ_API_KEY_2,
    import.meta.env.VITE_GROQ_API_KEY_3,
  ].filter(key => key);

  private static currentKeyIndex = 0;
  private static readonly BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly MODEL = 'llama-3.3-70b-versatile';

  /**
   * Call OpenRouter API with automatic fallback
   */
  static async callApi(
    messages: Array<{ role: string; content: string }>,
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<string> {
    if (this.API_KEYS.length === 0) {
      throw new Error('No Groq API keys configured');
    }

    let lastError: Error | null = null;

    // Try each API key
    for (let attempt = 0; attempt < this.API_KEYS.length; attempt++) {
      const apiKey = this.API_KEYS[this.currentKeyIndex];
      
      try {
        const response = await fetch(this.BASE_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.MODEL,
            messages: messages,
            temperature: temperature,
            max_tokens: maxTokens
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Groq API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

      } catch (error) {
        lastError = error as Error;
        console.error(`API key ${this.currentKeyIndex} failed:`, error);
        
        // Rotate to next key
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.API_KEYS.length;
        
        // If it's not a rate limit error, don't retry
        if (!error?.toString().includes('429') && !error?.toString().includes('rate')) {
          throw error;
        }
      }
    }

    throw lastError || new Error('All API keys exhausted');
  }
}

// ============================================================================
// QUERY ANALYZER
// ============================================================================

export class QueryAnalyzer {
  /**
   * Analyze user query and determine what data to fetch
   */
  static async analyzeQuery(userQuery: string, location?: { latitude: number; longitude: number }): Promise<QueryAnalysis> {
    const systemPrompt = `You are an agricultural AI query analyzer. Your task is to analyze farming questions and extract:
1. Query type (crop_recommendation, soil_analysis, weather_query, pest_disease, fertilizer_advice, irrigation_advice, general_farming, seasonal_planning)
2. Parameters mentioned (pH, rainfall, temperature, crop names, etc.)
3. Which APIs to call (OpenWeather, FAO, Wikidata)  # Do NOT use SoilGrids
4. Extracted entities (crop names, locations, seasons, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "query_type": "crop_recommendation",
  "parameters": {
    "soil_ph": 6.5,
    "rainfall": 700
  },
  "recommended_apis": ["OpenWeather", "FAO"],
  "confidence": 0.9,
  "extracted_entities": ["rice", "maize"]
}`;

    const userPrompt = `Analyze this farming question: "${userQuery}"
${location ? `User location: Lat ${location.latitude}, Lon ${location.longitude}` : ''}

Extract parameters and determine which APIs are needed. Return JSON only.`;

    try {
      const response = await GroqClient.callApi(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        0.3, // Low temperature for structured output
        500
      );

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis: QueryAnalysis = JSON.parse(jsonMatch[0]);
      
      // Add location if provided
      if (location) {
        analysis.parameters.location = location;
      }

      // IMPORTANT: Add sensor data detection - the AI doesn't know about this
      const lowerQuery = userQuery.toLowerCase();
      // English + Hindi keywords for land-related queries
      const landKeywords = [
        // English
        'my land', 'my field', 'my farm', 'field', 'farm', 'land', 'soil', 'moisture', 'ph', 'sensor',
        // Hindi
        'मेरी जमीन', 'मेरा खेत', 'खेत', 'जमीन', 'मिट्टी', 'नमी', 'ph', 'सेंसर',
        'khet', 'nammi', 'jameen', 'mitti', 'sensor'
      ];
      analysis.needs_sensor_data = landKeywords.some(word => lowerQuery.includes(word));

      return analysis;

    } catch (error) {
      console.error('Query analysis failed:', error);
      
      // Fallback to basic analysis
      return this.fallbackAnalysis(userQuery, location);
    }
  }

  /**
   * Fallback analysis using keyword matching
   */
  private static fallbackAnalysis(userQuery: string, location?: { latitude: number; longitude: number }): QueryAnalysis {
    const query = userQuery.toLowerCase();

    // Detect query type
    let query_type: QueryAnalysis['query_type'] = 'general_farming';
    if (query.includes('crop') || query.includes('grow') || query.includes('plant')) {
      query_type = 'crop_recommendation';
    } else if (query.includes('soil') || query.includes('ph') || query.includes('nutrient')) {
      query_type = 'soil_analysis';
    } else if (query.includes('weather') || query.includes('rain') || query.includes('temperature')) {
      query_type = 'weather_query';
    } else if (query.includes('pest') || query.includes('disease') || query.includes('insect')) {
      query_type = 'pest_disease';
    } else if (query.includes('fertilizer') || query.includes('npk') || query.includes('nitrogen')) {
      query_type = 'fertilizer_advice';
    } else if (query.includes('water') || query.includes('irrigation') || query.includes('drip')) {
      query_type = 'irrigation_advice';
    }

    // Extract parameters
    const parameters: any = {};
    
    // Extract pH
    const phMatch = query.match(/ph\s*[:\-=]?\s*(\d+\.?\d*)/i);
    if (phMatch) parameters.soil_ph = parseFloat(phMatch[1]);

    // Extract rainfall
    const rainfallMatch = query.match(/(\d+)\s*(mm|millimeter)/i);
    if (rainfallMatch) parameters.rainfall = parseFloat(rainfallMatch[1]);

    // Extract temperature
    const tempMatch = query.match(/(\d+)\s*(°c|celsius|degrees)/i);
    if (tempMatch) parameters.temperature = parseFloat(tempMatch[1]);

    if (location) {
      parameters.location = location;
    }

    // Determine APIs to call (SoilGrids removed)
    const recommended_apis: string[] = [];
    if (query_type === 'weather_query' || query_type === 'crop_recommendation') {
      recommended_apis.push('OpenWeather');
    }
    if (query_type === 'crop_recommendation' || query.includes('crop')) {
      recommended_apis.push('FAO');
    }

    // Detect land/field/farm/soil/sensor keywords for sensor data
    const landKeywords = [
      // English
      'my land', 'my field', 'my farm', 'field', 'farm', 'land', 'soil', 'moisture', 'ph', 'sensor',
      // Hindi
      'मेरी जमीन', 'मेरा खेत', 'खेत', 'जमीन', 'मिट्टी', 'नमी', 'ph', 'सेंसर',
      'khet', 'nammi', 'jameen', 'mitti', 'sensor'
    ];
    const needs_sensor_data = landKeywords.some(word => query.includes(word));

    return {
      query_type,
      parameters,
      recommended_apis,
      confidence: 0.6,
      extracted_entities: [],
      needs_sensor_data
    };
  }
}

// ============================================================================
// DATA RETRIEVER
// ============================================================================

export class DataRetriever {
  /**
   * Fetch data from recommended APIs
   */
  static async fetchData(analysis: QueryAnalysis): Promise<Partial<MergedContext>> {
    const results: Partial<MergedContext> = {};
    const { parameters, recommended_apis, needs_sensor_data } = analysis;

    // Do NOT fetch soil data from SoilGrids (removed)

    // Fetch weather data if needed
    if (recommended_apis.includes('OpenWeather')) {
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (parameters.location && parameters.location.latitude && parameters.location.longitude) {
        latitude = parameters.location.latitude;
        longitude = parameters.location.longitude;
      } else {
        console.warn('Location data is missing. Attempting to use sensor data for latitude and longitude.');
        try {
          const latestSensorData = await SensorService.getLatestReadings();
          if (latestSensorData.length > 0) {
            latitude = latestSensorData[0].latitude;
            longitude = latestSensorData[0].longitude;
          } else {
            console.warn('No sensor data available to determine location. Skipping weather data fetch.');
          }
        } catch (sensorError) {
          console.error('Failed to fetch sensor data for location:', sensorError);
        }
      }

      if (latitude !== undefined && longitude !== undefined) {
        try {
          results.weather_data = await ExternalApiService.Weather.fetchWeatherData(latitude, longitude);
        } catch (error) {
          console.error('OpenWeather fetch failed:', error);
        }
      }
    }

    // Fetch crop recommendations if needed
    if (recommended_apis.includes('FAO') || recommended_apis.includes('Wikidata')) {
      try {
        if (parameters.crop_name) {
          // Specific crop query
          const cropInfo = await ExternalApiService.Crops.fetchCropInfo(parameters.crop_name);
          if (cropInfo) {
            results.specific_crop = cropInfo;
          }
        } else {
          // General crop recommendation
          const { latitude, longitude } = parameters.location || {};
          if (latitude !== undefined && longitude !== undefined) {
            results.crop_recommendations = await ExternalApiService.Crops.searchCropsByConditions(
              parameters.soil_ph,
              parameters.temperature,
              parameters.rainfall
            );
          }
        }
      } catch (error) {
        console.error('Crop data fetch failed:', error);
      }
    }

    // Fetch sensor data if needed and available
    if (needs_sensor_data) {
      try {
        const sensorData = await SensorService.getLatestReadings();
        if (sensorData.length > 0) {
          results.sensor_data = sensorData;
        } else {
          console.warn('No sensor data found for the given parameters');
        }
      } catch (error) {
        console.error('Sensor data fetch failed:', error);
      }
    }

    return results;
  }
}

// ============================================================================
// CONTEXT MERGER
// ============================================================================

export class ContextMerger {
  /**
   * Merge external data into the context
   */
  static mergeContext(
    baseContext: MergedContext,
    externalData: Partial<MergedContext>
  ): MergedContext {
    return {
      ...baseContext,
      ...externalData,
      soil_data: externalData.soil_data || baseContext.soil_data,
      weather_data: externalData.weather_data || baseContext.weather_data,
      crop_recommendations: externalData.crop_recommendations || baseContext.crop_recommendations,
      specific_crop: externalData.specific_crop || baseContext.specific_crop,
      sensor_data: externalData.sensor_data || baseContext.sensor_data,
    };
  }
}

// ============================================================================
// RAG RESPONDER
// ============================================================================

export class RagResponder {
  /**
   * Generate response using RAG (Retrieval-Augmented Generation)
   */
  static async generateResponse(context: MergedContext): Promise<RagResponse> {
    const systemPrompt = `You are an expert agricultural advisor. Provide detailed answers with actionable insights.
Use the data provided in the context, and if lacking, suggest reasonable actions based on common agricultural knowledge.

Context: {JSON}

Question: {user_query}

Answer:`;

    const userPrompt = `
Context:
${JSON.stringify(context, null, 2)}

Question: ${context.user_query}

Answer:`;

    try {
      const response = await GroqClient.callApi(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        0.5, // Balanced temperature for creativity and coherence
        1500 // Increased max tokens for detailed responses
      );

      // Parse JSON response for structured data
      let structuredData;
      try {
        structuredData = JSON.parse(response);
      } catch {
        structuredData = {};
      }

      return {
        answer: response,
        confidence: structuredData.confidence || 0.7,
        sources: structuredData.sources || [],
        data_used: {
          soil: !!context.soil_data,
          weather: !!context.weather_data,
          crops: !!context.crop_recommendations,
          sensor: !!context.sensor_data,
        },
        recommendations: structuredData.recommendations || {
          immediate: [],
          short_term: [],
          long_term: []
        },
        related_questions: structuredData.related_questions || [],
        thinking_process: structuredData.thinking_process || [],
        response_time_ms: 0 // Placeholder, calculate actual response time if needed
      };

    } catch (error) {
      console.error('Response generation failed:', error);
      return {
        answer: 'Sorry, I am unable to provide an answer at the moment. Please try again later.',
        confidence: 0,
        sources: [],
        data_used: {},
        response_time_ms: 0
      };
    }
  }
}

// ============================================================================
// MAIN RAG SERVICE
// ============================================================================

export class RagService {
  /**
   * Main entry point for RAG-based question answering
   */
  static async answerQuestion(
    userQuery: string,
    location?: { latitude: number; longitude: number }
  ): Promise<RagResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Analyze the query
      const analysis = await QueryAnalyzer.analyzeQuery(userQuery, location);

      // Step 2: Fetch relevant data
      const partialContext = await DataRetriever.fetchData(analysis);

      // Step 3: Create complete context
      const context: MergedContext = {
        ...partialContext,
        user_query: userQuery,
        query_analysis: analysis,
        location: location,
        timestamp: new Date()
      };

      // Step 4: Generate response
      const response = await RagResponder.generateResponse(context);

      // Add response time
      response.response_time_ms = Date.now() - startTime;

      return response;
    } catch (error) {
      console.error('RAG Service error:', error);
      return {
        answer: 'Sorry, I am unable to provide an answer at the moment. Please try again later.',
        confidence: 0,
        sources: [],
        data_used: {},
        response_time_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Get cached response if available (placeholder implementation)
   */
  static async getCachedResponse(_query: string): Promise<RagResponse | null> {
    // TODO: Implement caching logic
    return null;
  }
}
