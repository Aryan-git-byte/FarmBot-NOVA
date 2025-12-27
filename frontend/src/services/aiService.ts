import { supabase, AiLog, ProcessedSensorReading } from '../config/supabase';
import { SensorService } from './sensorService';
import { WeatherService, WeatherData } from './weatherService';
import { RagService, QueryAnalyzer } from './ragService';
import { EnhancedOpenWeatherService } from './externalApiService';

// Groq API Keys with fallback system
const GROQ_API_KEYS = [
  import.meta.env.VITE_GROQ_API_KEY_1,
  import.meta.env.VITE_GROQ_API_KEY_2,
  import.meta.env.VITE_GROQ_API_KEY_3,
].filter(key => key); // Filter out undefined/empty keys


if (GROQ_API_KEYS.length === 0) {
  throw new Error('At least one Groq API key is required for AI responses');
}

// Enhanced conversation message structure
interface ConversationMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sensorData?: ProcessedSensorReading[];
    weatherData?: WeatherData[];
    queryType?: string;
    urgency?: string;
    location?: { lat: number; lon: number; name?: string };
  };
}

// Conversation session structure
interface ConversationSession {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  context: {
    farmLocation?: { lat: number; lon: number; name?: string };
    cropType?: string;
    season?: string;
    language?: string;
    farmerExperience?: 'beginner' | 'intermediate' | 'expert';
    farmSize?: string;
    previousRecommendations?: string[];
    currentIssues?: string[];
    followUpNeeded?: boolean;
  };
}

// Enhanced context for AI processing
interface QueryContext {
  type: 'irrigation' | 'health' | 'nutrition' | 'harvest' | 'weather' | 'general' | 'analysis' | 'soil_analysis' | 'follow_up';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  language: string;
  season: 'summer' | 'monsoon' | 'winter';
  timeContext: 'morning' | 'afternoon' | 'evening' | 'night';
  conversationContext?: {
    isFollowUp: boolean;
    previousTopics: string[];
    unresolvedIssues: string[];
    farmerProfile?: {
      experience: string;
      cropType?: string;
      farmSize?: string;
    };
  };
}

// Farm data structure with location-based maps
interface FarmData {
  sensorData: ProcessedSensorReading[];
  weatherDataMap: Map<string, WeatherData>;
  locations: Array<{ lat: number; lon: number; name?: string; locationKey: string }>;
  criticalAlerts: ProcessedSensorReading[];
}

export interface AiResponse {
  advice: string;
  confidence: number;
  sources: string[];
  responseTime?: number;
  intelligence_level: 'advanced';
  conversationId: string;
  followUpQuestions?: string[];
  recommendations?: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  relatedTopics?: string[];
  eventBreakdown?: Array<{ label: string; ms: number; source: string }>;
}

export class AiService {

  /**
   * New pipeline: enrich prompt, then pass to QueryAnalyzer and RAG pipeline
   */
  static async enrichAndRouteQuery(query: string, locationData?: { latitude: number; longitude: number; name?: string }): Promise<import('./ragService').RagResponse> {
    // 1. Enrich prompt/context (weather, master prompt, etc.)
    // Use similar logic as processQuery to get weather data and build context
    const farmData = await this.getFarmData();
    let weatherData: any = null;
    if (locationData && locationData.latitude && locationData.longitude) {
      // Try to get weather for the provided location
      try {
        weatherData = await EnhancedOpenWeatherService.fetchWeatherData(locationData.latitude, locationData.longitude);
      } catch (e) {
        // Weather fetch failed, continue without it
        weatherData = null;
      }
    }
    // Build enriched context object
    // const enrichedContext = {
    //   query,
    //   location: locationData,
    //   weather: weatherData,
    //   farmData,
    //   masterPrompt: 'You are an advanced agricultural AI assistant. Use real-time data and provide factual, actionable advice.'
    // };

    // 2. Pass enriched context to QueryAnalyzer
    // QueryAnalyzer expects (userQuery, location)
    // const analysis = await QueryAnalyzer.analyzeQuery(query, locationData);

    // 3. Pass QueryAnalyzer output to RAG pipeline
    // RagService.answerQuestion expects (userQuery, location)
    const ragResponse = await RagService.answerQuestion(query, locationData);

    // 4. Return final answer (RagResponse)
    return ragResponse;
  }

  /**
   * Proxy for RagService.getCachedResponse
   */
  static async getCachedResponse(query: string): Promise<import('./ragService').RagResponse | null> {
    return RagService.getCachedResponse(query);
  }
  private static conversationCache = new Map<string, ConversationSession>();
  private static readonly MAX_CONTEXT_MESSAGES = 10;
  // private static readonly CONTEXT_RELEVANCE_THRESHOLD = 0.7; // Unused

  // MAIN PROCESSING METHOD WITH CONTEXT
  static async processQuery(
    query: string,
    conversationId?: string,
    _userId?: string | null,
    language: string = 'en'
  ): Promise<AiResponse> {
    const startTime = performance.now();
    const eventBreakdown: Array<{ label: string; ms: number; source: string }> = [];

    // 1. Get or create conversation session
    const t0 = performance.now();
    const session = conversationId
      ? await this.getConversationSession(conversationId)
      : await this.createNewConversation(language);
    eventBreakdown.push({ label: 'Conversation', ms: Math.round(performance.now() - t0), source: 'supabase' });

    // 2. Analyze query with conversation context
    const t1 = performance.now();
    const context = this.analyzeQueryWithContext(query, language, session);
    eventBreakdown.push({ label: 'Analyze Query', ms: Math.round(performance.now() - t1), source: 'internal' });

    // 3. Fetch all farm data
    const t2 = performance.now();
    const farmData = await this.getFarmData();
    eventBreakdown.push({ label: 'Farm Data', ms: Math.round(performance.now() - t2), source: 'sensorService/weatherService' });

    // 4. Add user message to conversation
    const userMessage: ConversationMessage = {
      role: 'user',
      content: query,
      timestamp: new Date(),
      metadata: {
        sensorData: farmData.sensorData,
        weatherData: Array.from(farmData.weatherDataMap.values()),
        queryType: context.type,
        urgency: context.urgency
      }
    };
    session.messages.push(userMessage);

    // 5. Build comprehensive prompt with conversation history
    const t3 = performance.now();
    const systemPrompt = this.buildSystemPrompt(language, context, farmData, session);
    eventBreakdown.push({ label: 'Build Prompt', ms: Math.round(performance.now() - t3), source: 'internal' });

    // 6. Get AI response from Groq
    const t4 = performance.now();
    const aiResponse = await this.callGroqAPI(systemPrompt, query, session);
    eventBreakdown.push({ label: 'Groq API', ms: Math.round(performance.now() - t4), source: 'groq' });

    // 7. Parse AI response for structured data
    const t5 = performance.now();
    const parsedResponse = this.parseAiResponse(aiResponse);
    eventBreakdown.push({ label: 'Parse Response', ms: Math.round(performance.now() - t5), source: 'internal' });

    // 8. Add assistant message to conversation
    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: parsedResponse.advice,
      timestamp: new Date(),
      metadata: {
        queryType: context.type,
        urgency: context.urgency
      }
    };
    session.messages.push(assistantMessage);

    // 9. Update session context based on conversation
    const t6 = performance.now();
    await this.updateSessionContext(session, query, parsedResponse);
    eventBreakdown.push({ label: 'Update Context', ms: Math.round(performance.now() - t6), source: 'supabase' });

    // 10. Save conversation to database
    const t7 = performance.now();
    await this.saveConversation(session);
    eventBreakdown.push({ label: 'Save Conversation', ms: Math.round(performance.now() - t7), source: 'supabase' });

    // 11. Format and return response
    const response: AiResponse = {
      ...parsedResponse,
      conversationId: session.id,
      confidence: 0.9,
      sources: ['groq/llama-3.3-70b-versatile', 'live_sensor_data', 'live_weather_data', 'conversation_context'],
      responseTime: performance.now() - startTime,
      intelligence_level: 'advanced',
      eventBreakdown
    };

    // Log the query and response to Supabase
    await this.logQuery(query, response, session.id);

    return response;
  }

  // STREAMING PROCESSING METHOD WITH CONTEXT
  static async processQueryStream(
    query: string,
    onChunk: (chunk: string) => void,
    conversationId?: string,
    _userId?: string | null,
    language: string = 'en'
  ): Promise<AiResponse> {
    const startTime = performance.now();

    // 1. Get or create conversation session
    const session = conversationId
      ? await this.getConversationSession(conversationId)
      : await this.createNewConversation(language);
    
    // 2. Analyze query with conversation context
    const context = this.analyzeQueryWithContext(query, language, session);
    
    // 3. Fetch all farm data
    const farmData = await this.getFarmData();
    
    // 4. Add user message to conversation
    const userMessage: ConversationMessage = {
      role: 'user',
      content: query,
      timestamp: new Date(),
      metadata: {
        sensorData: farmData.sensorData,
        weatherData: Array.from(farmData.weatherDataMap.values()),
        queryType: context.type,
        urgency: context.urgency
      }
    };
    session.messages.push(userMessage);
    
    // 5. Build comprehensive prompt with conversation history
    const systemPrompt = this.buildSystemPrompt(language, context, farmData, session);
    
    // 6. Get AI response from Groq with streaming
    const aiResponse = await this.callGroqAPIStream(systemPrompt, query, session, onChunk);
    
    // 7. Parse AI response for structured data
    const parsedResponse = this.parseAiResponse(aiResponse);
    
    // 8. Add assistant message to conversation
    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: parsedResponse.advice,
      timestamp: new Date(),
      metadata: {
        queryType: context.type,
        urgency: context.urgency
      }
    };
    session.messages.push(assistantMessage);
    
    // 9. Update session context based on conversation
    await this.updateSessionContext(session, query, parsedResponse);
    
    // 10. Save conversation to database
    await this.saveConversation(session);
    
    // 11. Format and return response
    const response: AiResponse = {
      ...parsedResponse,
      conversationId: session.id,
      confidence: 0.9,
      sources: ['groq/llama-3.3-70b-versatile', 'live_sensor_data', 'live_weather_data', 'conversation_context'],
      responseTime: performance.now() - startTime,
      intelligence_level: 'advanced'
    };

    // Log the query and response to Supabase
    await this.logQuery(query, response, session.id);
    
    return response;
  }

  // CONVERSATION SESSION MANAGEMENT
  private static async createNewConversation(language: string = 'en'): Promise<ConversationSession> {
    const sessionId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: ConversationSession = {
      id: sessionId,
      title: 'New Farm Consultation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      context: {
        language,
        season: this.getCurrentSeason(),
        previousRecommendations: [],
        currentIssues: [],
        followUpNeeded: false
      }
    };

    // Add welcome message
    const welcomeMessage: ConversationMessage = {
      role: 'system',
      content: language === 'hi' 
        ? 'नमस्कार! मैं आपका कृषि सहायक हूं। मैं आपकी खेती से जुड़ी समस्याओं का समाधान और सलाह दे सकता हूं।'
        : 'Hello! I\'m your agricultural assistant. I can help solve your farming problems and provide expert advice.',
      timestamp: new Date()
    };
    session.messages.push(welcomeMessage);

    this.conversationCache.set(sessionId, session);
    return session;
  }

  private static async getConversationSession(conversationId: string): Promise<ConversationSession> {
    // Check cache first
    if (this.conversationCache.has(conversationId)) {
      return this.conversationCache.get(conversationId)!;
    }

    // Load from database
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error loading conversation:', error);
      return this.createNewConversation();
    }

    // Load messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (messagesError) {
      console.error('Error loading messages:', messagesError);
    }

    const session: ConversationSession = {
      id: data.id,
      title: data.title,
      messages: messages || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      context: data.context || {}
    };

    this.conversationCache.set(conversationId, session);
    return session;
  }

  // ENHANCED QUERY ANALYSIS WITH CONTEXT
  private static analyzeQueryWithContext(
    query: string, 
    language: string, 
    session: ConversationSession
  ): QueryContext {
    const lowerQuery = query.toLowerCase();
    const recentMessages = session.messages.slice(-5);
    
    const followUpIndicators = ['what about', 'and also', 'but what if', 'how about', 'also', 'additionally'];
    const isFollowUp = followUpIndicators.some(indicator => lowerQuery.includes(indicator)) ||
                      recentMessages.length > 2;

    const previousTopics = recentMessages
      .filter(msg => msg.role === 'user')
      .map(msg => this.extractTopicFromMessage(msg.content))
      .filter(Boolean);

    let type: QueryContext['type'] = 'general';
    
    if (lowerQuery.includes('water') || lowerQuery.includes('पानी') || lowerQuery.includes('irrigation') || lowerQuery.includes('सिंचाई')) {
      type = 'irrigation';
    } else if (lowerQuery.includes('disease') || lowerQuery.includes('बीमारी') || lowerQuery.includes('health') || lowerQuery.includes('स्वास्थ्य')) {
      type = 'health';
    } else if (lowerQuery.includes('fertilizer') || lowerQuery.includes('खाद') || lowerQuery.includes('nutrition') || lowerQuery.includes('पोषण')) {
      type = 'nutrition';
    } else if (lowerQuery.includes('weather') || lowerQuery.includes('मौसम')) {
      type = 'weather';
    } else if (lowerQuery.includes('soil') || lowerQuery.includes('मिट्टी')) {
      type = 'soil_analysis';
    } else if (lowerQuery.includes('analyze') || lowerQuery.includes('विश्लेषण')) {
      type = 'analysis';
    } else if (lowerQuery.includes('harvest') || lowerQuery.includes('फसल')) {
      type = 'harvest';
    } else if (isFollowUp) {
      type = 'follow_up';
    }

    let urgency: QueryContext['urgency'] = 'medium';
    
    const hasRecentCriticalAlerts = recentMessages.some(msg => 
      msg.metadata?.sensorData?.some(sensor => sensor.status === 'critical')
    );
    
    if (hasRecentCriticalAlerts || lowerQuery.includes('urgent') || lowerQuery.includes('emergency')) {
      urgency = 'critical';
    } else if (lowerQuery.includes('problem') || lowerQuery.includes('issue') || lowerQuery.includes('समस्या')) {
      urgency = 'high';
    }

    const unresolvedIssues = session.context.currentIssues || [];

    return {
      type,
      urgency,
      language,
      season: this.getCurrentSeason(),
      timeContext: this.getTimeContext(),
      conversationContext: {
        isFollowUp,
        previousTopics: previousTopics.filter((topic): topic is string => topic !== null),
        unresolvedIssues,
        farmerProfile: {
          experience: session.context.farmerExperience || 'intermediate',
          cropType: session.context.cropType,
          farmSize: session.context.farmSize
        }
      }
    };
  }

  // COMPREHENSIVE DATA FETCHING
  private static async getFarmData(): Promise<FarmData> {
    const sensorData = await SensorService.getLatestReadings();
    
    const uniqueLocations = new Map<string, { lat: number; lon: number; name?: string }>();
    
    sensorData.forEach(reading => {
      if (reading.latitude && reading.longitude) {
        const locationKey = `${reading.latitude.toFixed(4)},${reading.longitude.toFixed(4)}`;
        uniqueLocations.set(locationKey, {
          lat: reading.latitude,
          lon: reading.longitude,
          name: `Sensor ${reading.sensor_id || 'Location'}`
        });
      }
    });

    if (uniqueLocations.size === 0) {
      uniqueLocations.set('28.6139,77.2090', { 
        lat: 28.6139, 
        lon: 77.2090, 
        name: 'Delhi, India' 
      });
    }

    const locations = Array.from(uniqueLocations.entries()).map(([locationKey, location]) => ({
      ...location,
      locationKey
    }));

    const weatherPromises = locations.map(async location => {
      try {
        const weatherData = await WeatherService.getCurrentWeather(location.lat, location.lon);
        return { locationKey: location.locationKey, data: weatherData };
      } catch (error) {
        console.error(`Weather fetch failed for ${location.locationKey}:`, error);
        throw error;
      }
    });

    const weatherResults = await Promise.all(weatherPromises);
    const weatherDataMap = new Map<string, WeatherData>();

    weatherResults.forEach(result => {
      if (result.data) {
        weatherDataMap.set(result.locationKey, result.data);
      }
    });

    const criticalAlerts = sensorData.filter(reading => reading.status === 'critical');

    return {
      sensorData,
      weatherDataMap,
      locations,
      criticalAlerts
    };
  }

  // BUILD SYSTEM PROMPT
  private static buildSystemPrompt(
    language: string, 
    context: QueryContext, 
    farmData: FarmData, 
    session: ConversationSession
  ): string {
    const isHindi = language === 'hi';
    
    // Translate season and time to Hindi if needed
    const seasonTranslation: Record<string, string> = {
      'summer': isHindi ? 'गर्मी' : 'summer',
      'monsoon': isHindi ? 'मानसून' : 'monsoon',
      'winter': isHindi ? 'सर्दी' : 'winter'
    };
    
    const timeTranslation: Record<string, string> = {
      'morning': isHindi ? 'सुबह' : 'morning',
      'afternoon': isHindi ? 'दोपहर' : 'afternoon',
      'evening': isHindi ? 'शाम' : 'evening',
      'night': isHindi ? 'रात' : 'night'
    };
    
    const seasonText = seasonTranslation[context.season] || context.season;
    const timeText = timeTranslation[context.timeContext] || context.timeContext;
    
    const systemPrompt = isHindi 
      ? `आप एक भारतीय कृषि विशेषज्ञ हैं। अभी ${seasonText} का मौसम है और ${timeText} का समय है। आपको किसान को नीचे दिए गए LIVE सेंसर डेटा और मौसम की जानकारी के आधार पर विशिष्ट सलाह देनी है।`
      : `You are an Indian agricultural expert. It's currently ${seasonText} season and ${timeText} time. You must provide specific advice based on the LIVE sensor data and weather information provided below.`;

    let conversationHistory = '';
    const recentMessages = session.messages.slice(-this.MAX_CONTEXT_MESSAGES);
    
    if (recentMessages.length > 1) {
      const historyText = recentMessages
        .filter(msg => msg.role !== 'system')
        .map(msg => `${msg.role === 'user' ? 'FARMER' : 'EXPERT'}: ${msg.content}`)
        .join('\n');
      
      conversationHistory = `\n\nCONVERSATION HISTORY:\n${historyText}`;
    }

    let sensorContext = '';
    if (farmData.sensorData.length > 0) {
      const sensorInfo = farmData.sensorData.map(reading => {
        return `${reading.sensor_type}: ${reading.value}${reading.unit || ''} (Status: ${reading.status}, Location: ${reading.latitude?.toFixed(4)}, ${reading.longitude?.toFixed(4)})`;
      }).join('\n');
      sensorContext = `\n\nCURRENT SENSOR READINGS:\n${sensorInfo}`;
    }

    let weatherContext = '';
    if (farmData.weatherDataMap.size > 0) {
      const weatherEntries = Array.from(farmData.weatherDataMap.entries()).map(([locationKey, weather]) => {
        const location = farmData.locations.find(l => l.locationKey === locationKey);
        return `Location ${location?.name || locationKey}: Temperature ${weather.temperature}°C, Humidity ${weather.humidity}%, Wind Speed ${weather.wind_speed}km/h, Pressure ${weather.pressure}hPa${weather.rainfall ? `, Rainfall ${weather.rainfall}mm` : ''}`;
      });
      weatherContext = `\n\nCURRENT WEATHER CONDITIONS:\n${weatherEntries.join('\n')}`;
    }

    // Regional context based on coordinates
    let regionalContext = '';
    if (farmData.locations.length > 0) {
      const firstLocation = farmData.locations[0];
      const lat = firstLocation.lat;
      const lon = firstLocation.lon;
      
      let region = 'India';
      let soilType = 'Mixed';
      let climateZone = 'Tropical';
      
      // North India
      if (lat >= 28 && lat <= 32 && lon >= 74 && lon <= 79) {
        region = 'North India (Punjab/Haryana)';
        soilType = 'Alluvial (alkaline tendency)';
        climateZone = 'Sub-tropical, Winter fog common';
      }
      // Delhi/UP
      else if (lat >= 25 && lat <= 30 && lon >= 77 && lon <= 83) {
        region = 'North-Central India (Delhi/UP)';
        soilType = 'Alluvial';
        climateZone = 'Sub-tropical monsoon';
      }
      // Maharashtra
      else if (lat >= 16 && lat <= 21 && lon >= 72 && lon <= 80) {
        region = 'West India (Maharashtra)';
        soilType = 'Black cotton soil (Vertisol)';
        climateZone = 'Semi-arid to sub-humid';
      }
      // Karnataka/Tamil Nadu
      else if (lat >= 10 && lat <= 16 && lon >= 75 && lon <= 80) {
        region = 'South India (Karnataka/TN)';
        soilType = 'Red/Laterite (acidic)';
        climateZone = 'Tropical humid';
      }
      // West Bengal/Bihar
      else if (lat >= 22 && lat <= 27 && lon >= 85 && lon <= 89) {
        region = 'East India (WB/Bihar)';
        soilType = 'Alluvial (high rainfall zone)';
        climateZone = 'Humid subtropical';
      }
      // Gujarat
      else if (lat >= 20 && lat <= 24 && lon >= 68 && lon <= 74) {
        region = 'West India (Gujarat)';
        soilType = 'Alluvial/Black';
        climateZone = 'Semi-arid';
      }
      // Madhya Pradesh
      else if (lat >= 21 && lat <= 26 && lon >= 74 && lon <= 82) {
        region = 'Central India (MP)';
        soilType = 'Black/Red';
        climateZone = 'Sub-tropical';
      }
      
      regionalContext = `\n\nREGIONAL CONTEXT:\nRegion: ${region}\nTypical Soil Type: ${soilType}\nClimate Zone: ${climateZone}\nCoordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }

    let farmerContext = '';
    if (session.context) {
      const profile = [];
      if (session.context.farmerExperience) profile.push(`Experience: ${session.context.farmerExperience}`);
      if (session.context.cropType) profile.push(`Crop: ${session.context.cropType}`);
      if (session.context.farmSize) profile.push(`Farm Size: ${session.context.farmSize}`);
      if (session.context.farmLocation) profile.push(`Location: ${session.context.farmLocation.name}`);
      
      if (profile.length > 0) {
        farmerContext = `\n\nFARMER PROFILE:\n${profile.join('\n')}`;
      }
    }

    let issuesContext = '';
    if (session.context.currentIssues && session.context.currentIssues.length > 0) {
      issuesContext = `\n\nONGOING ISSUES:\n${session.context.currentIssues.join('\n')}`;
    }

    let recommendationsContext = '';
    if (session.context.previousRecommendations && session.context.previousRecommendations.length > 0) {
      recommendationsContext = `\n\nPREVIOUS RECOMMENDATIONS:\n${session.context.previousRecommendations.slice(-3).join('\n')}`;
    }

    let alertsContext = '';
    if (farmData.criticalAlerts.length > 0) {
      const alerts = farmData.criticalAlerts.map(alert => 
        `CRITICAL: ${alert.sensor_type} showing ${alert.value}${alert.unit || ''} - requires immediate attention`
      ).join('\n');
      alertsContext = `\n\nCRITICAL ALERTS:\n${alerts}`;
    }

    return `${systemPrompt}

Query Type: ${context.type}
Urgency Level: ${context.urgency}
Is Follow-up: ${context.conversationContext?.isFollowUp ? 'Yes' : 'No'}
Language: ${isHindi ? 'Hindi' : 'English'}${conversationHistory}${farmerContext}${regionalContext}${sensorContext}${weatherContext}${alertsContext}${issuesContext}${recommendationsContext}

CRITICAL INSTRUCTIONS:
${isHindi ? '⚠️ महत्वपूर्ण: यदि ऊपर सेंसर डेटा दिया गया है, तो आपको अपनी सलाह में उन विशिष्ट मूल्यों का उल्लेख करना चाहिए। उदाहरण: "आपकी मिट्टी की नमी 45% है" या "तापमान 28°C है"।' : '⚠️ IMPORTANT: If sensor data is provided above, you MUST mention those specific values in your advice. Example: "Your soil moisture is at 45%" or "Temperature is 28°C".'}
${isHindi ? '⚠️ यदि कोई सेंसर डेटा नहीं है, तो सीधे कहें "कृपया अपने खेत की स्थिति बताएं" और सामान्य सलाह न दें।' : '⚠️ If NO sensor data is available, directly say "Please provide your farm conditions" and do NOT give generic advice.'}

RESPONSE GUIDELINES:
- ${isHindi ? 'यदि किसान केवल "नमस्ते" या "हाय" कहता है और सेंसर डेटा उपलब्ध है, तो सेंसर डेटा का उपयोग करके खेत की वर्तमान स्थिति बताएं' : 'If farmer just says "hello" or "hi" and sensor data is available, proactively share the current farm conditions using the sensor data'}
- ${isHindi ? 'हमेशा विशिष्ट संख्याओं का उपयोग करें जो ऊपर दिए गए डेटा से हैं' : 'Always use specific numbers from the data provided above'}
- ${isHindi ? 'सामान्य सलाह न दें - डेटा-संचालित सिफारिशें दें' : 'Do not give generic advice - provide data-driven recommendations'}
- Remember and reference the conversation history when relevant
- Address critical alerts with highest priority
- Respond in ${isHindi ? 'Hindi' : 'English'} language
- Use emojis to make the advice more readable and engaging
- Structure your response clearly with sections

MANDATORY ELEMENTS TO INCLUDE:
1. ALWAYS ask about crop growth stage if not provided (seedling/vegetative/flowering/fruiting)
2. ALWAYS specify numerical thresholds: "Irrigate when soil moisture drops below 40%"
3. ALWAYS mention specific fertilizer products: "Apply Urea 46-0-0 at 60 kg/ha"
4. ALWAYS provide cost-benefit: "60kg Urea costs ₹360-420, expected yield gain 2-3 quintals worth ₹1000-1500"
5. ALWAYS recommend irrigation method: "Drip irrigation saves 50% water" or "Sprinkler suitable for this crop"
6. ALWAYS consider regional factors: "In your North Indian climate..." or "Black soils common in Maharashtra..."
7. ALWAYS suggest pest/disease monitoring: "Check for yellowing (nitrogen deficiency) or leaf spots (fungal disease)"
8. ALWAYS mention crop rotation if relevant: "After harvest, grow legumes to restore nitrogen"
9. NEVER give contradictory advice: Review your response for consistency
10. ALWAYS cite reference ranges from ICAR/agricultural universities when possible

CRITICAL SAFETY RULES FOR FERTILIZER RECOMMENDATIONS:
1. NEVER provide specific fertilizer doses (kg/ha) without knowing the crop growth stage
2. If Nitrogen > 100 mg/kg, say "Nitrogen is adequate - monitor growth; only add if deficiency observed"
3. NEVER recommend more than 50 kg/ha nitrogen without explicit crop stage information
4. For potassium > 150 mg/kg or phosphorus > 40 mg/kg, say "adequate - maintain current levels"
5. NEVER contradict yourself (e.g., don't say N is high then recommend adding more N)
6. Always clarify: "total seasonal amount" vs "per application" when mentioning fertilizer doses
7. For repeated applications: specify total season budget AND individual application amounts separately
8. Always recommend soil testing + local agricultural expert consultation before major fertilizer applications
9. Use ranges (e.g., "80-120 kg/ha total for season") rather than exact doses
10. If crop type or critical data is missing, say "Please provide [missing info] before I can recommend specific actions"

SPECIFIC FERTILIZER PRODUCTS TO RECOMMEND (Indian Context):
- Nitrogen: Urea (46-0-0), Ammonium Sulfate (20-0-0), DAP (18-46-0)
- Phosphorus: Single Super Phosphate (SSP 16% P2O5), DAP (18-46-0)
- Potassium: Muriate of Potash (MOP 60% K2O), Sulphate of Potash (SOP 50% K2O)
- Complex: NPK 19:19:19, NPK 20:20:0, NPK 12:32:16
- Micro: Zinc Sulfate (ZnSO4), Ferrous Sulfate (FeSO4), Borax

INTERPRETATION GUIDELINES WITH REFERENCES:
- Soil Nitrogen (mg/kg): <80=Low, 80-120=Adequate, >120=High [Source: ICAR-IISS Nutrient Guidelines]
- Soil Phosphorus (mg/kg): <11=Low, 11-22=Medium, 23-56=High, >56=Very High [Olsen Method]
- Soil Potassium (mg/kg): <110=Low, 110-280=Medium, >280=High [Ammonium Acetate Method]
- Soil pH: 6.0-7.5=Optimal for most crops, <5.5=Acidic (needs lime), >8.0=Alkaline (needs gypsum)
- Soil Moisture for Wheat: 50-70%=Optimal, <40%=Irrigate immediately, >80%=Excess (drainage needed)
- Soil Moisture for Rice: 80-100%=Optimal (flooded), 60-80%=Adequate, <50%=Stress
- Soil Moisture for Vegetables: 60-80%=Optimal, <50%=Irrigate, >85%=Root rot risk
- Soil Moisture for Millets: 40-60%=Optimal (drought tolerant), <35%=Stress

CROP GROWTH STAGE REQUIREMENTS:
WHEAT:
- Tillering (20-30 DAS): N 40-50 kg/ha, P 20-30 kg/ha, K 20-30 kg/ha
- Jointing (45-55 DAS): N 30-40 kg/ha (top dress)
- Booting/Flowering (65-75 DAS): N 20-30 kg/ha (foliar spray if needed)
- Optimal Moisture: 60-70%, Irrigate at CRI (21 DAS), Tillering (40 DAS), Jointing (60 DAS), Flowering (80 DAS)

RICE:
- Transplanting: N 50 kg/ha, P 40 kg/ha, K 40 kg/ha (basal)
- Tillering (21-28 DAT): N 40 kg/ha (top dress)
- Panicle Initiation (42-49 DAT): N 30 kg/ha (top dress)
- Optimal Moisture: Keep flooded 2-5 cm water until milk stage

TOMATO:
- Vegetative (0-30 DAT): N 30 kg/ha, P 25 kg/ha, K 25 kg/ha
- Flowering (30-60 DAT): N 40 kg/ha, K 40 kg/ha (increase potassium)
- Fruiting (60-120 DAT): N 50 kg/ha, K 60 kg/ha (high potassium for fruit quality)
- Optimal Moisture: 65-75%, avoid waterlogging

IRRIGATION METHOD RECOMMENDATIONS:
- Drip Irrigation: Best for tomato, potato, cotton, sugarcane - 40-60% water saving, better WUE
- Sprinkler: Suitable for wheat, vegetables, orchards - 30-40% water saving
- Flood/Border: Traditional for rice, sugarcane - water intensive but proven
- Furrow: Good for row crops like maize, cotton - moderate water use

PEST & DISEASE IDENTIFICATION:
Common symptoms to ask about:
- Yellow leaves with green veins = Iron/Zinc deficiency or Nitrogen excess
- Brown leaf tips = Potassium deficiency or salt stress
- Wilting despite moist soil = Root rot (Fusarium/Pythium) or vascular wilt
- White powdery coating = Powdery mildew (use Sulfur 3g/L or Carbendazim 1g/L)
- Brown/black spots = Leaf spot disease (use Mancozeb 2.5g/L)
- Holes in leaves = Insect damage (identify: caterpillars, beetles, grasshoppers)

REGIONAL AGROCLIMATIC CONSIDERATIONS:
- North India (Punjab, Haryana, UP): High wheat-rice intensity, alkaline soils, winter fog
- South India (TN, AP, Karnataka): Rice-pulse rotation, acidic soils, double cropping
- West India (Gujarat, Maharashtra): Cotton-wheat, black soils, erratic rainfall
- East India (WB, Bihar, Odisha): Rice-pulse, high rainfall, acidic soils
- Central India (MP, Chhattisgarh): Soybean-wheat, medium black soils, rainfed

CROP ROTATION & COMPANION PLANTING:
- After Wheat: Mung bean, Cowpea (legumes fix nitrogen)
- After Rice: Mustard, Chickpea (break pest cycle)
- After Cotton: Wheat, Sorghum (replenish soil)
- Companion: Marigold with vegetables (pest repellent), Mustard as trap crop

ECONOMIC CONSIDERATIONS:
- Cost-Benefit Analysis: Always mention input cost vs. expected yield increase
- Urea (₹6-7/kg), DAP (₹27-30/kg), MOP (₹20-23/kg)
- Example: "60 kg/ha Urea costs ₹360-420, expected yield increase 2-3 quintals (₹1000-1500 value)"
- Prioritize: Nitrogen > Phosphorus > Potassium based on deficiency severity
- Organic alternatives: FYM 5-10 tons/ha (cheaper but slower release)

FORMAT YOUR RESPONSE:
${isHindi ? '⚠️ महत्वपूर्ण: केवल प्रासंगिक अनुभागों को शामिल करें। यदि प्रश्न सरल है (जैसे "नमस्ते"), तो केवल मुख्य सलाह दें। सभी 5 अनुभागों का उपयोग केवल तभी करें जब वे वास्तव में लागू हों।' : '⚠️ IMPORTANT: Include ONLY relevant sections. If query is simple (e.g., "hello"), provide only main advice. Use all 5 sections ONLY when they truly apply.'}

${isHindi ? '🌱 **मुख्य सलाह**: [विशिष्ट डेटा मूल्यों के साथ विस्तृत सिफारिश - जैसे "आपकी मिट्टी की नमी 45% है जो अच्छी है"] - हमेशा शामिल करें' : '🌱 **Main Advice**: [Detailed recommendation with specific data values - e.g., "Your soil moisture is at 45% which is good"] - Always include'}
${isHindi ? '⚡ **तत्काल कार्रवाई**: [डेटा के आधार पर अभी क्या करें] - केवल तभी जब तत्काल कार्रवाई आवश्यक हो' : '⚡ **Immediate Actions**: [What to do right now based on the data] - Only if immediate action needed'}
${isHindi ? '📅 **आगामी कदम**: [आने वाले दिनों/हफ्तों के लिए योजना] - केवल तभी जब दीर्घकालिक योजना प्रासंगिक हो' : '📅 **Next Steps**: [What to plan for coming days/weeks] - Only if long-term planning relevant'}
${isHindi ? '❓ **अनुवर्ती प्रश्न**: [किसान की बेहतर मदद के लिए प्रश्न] - केवल तभी जब अधिक जानकारी की आवश्यकता हो' : '❓ **Follow-up Questions**: [Questions to help farmer better] - Only if more info needed'}
${isHindi ? '🔗 **संबंधित विषय**: [अन्य क्षेत्र जिन्हें किसान देख सकता है] - केवल तभी जब प्रासंगिक विषय हों' : '🔗 **Related Topics**: [Other areas farmer might want to explore] - Only if relevant topics exist'}

${isHindi ? 'उदाहरण - सरल अभिवादन के लिए: केवल 🌱 मुख्य सलाह का उपयोग करें और सेंसर डेटा साझा करें' : 'Example - For simple greeting: Use only 🌱 Main Advice and share sensor data'}
${isHindi ? 'उदाहरण - जटिल समस्या के लिए: सभी प्रासंगिक अनुभागों का उपयोग करें' : 'Example - For complex problem: Use all relevant sections'}`;
  }

  // GROQ API CALL WITH FALLBACK
  private static async callGroqAPI(
    systemPrompt: string,
    userQuery: string,
    session: ConversationSession
  ): Promise<string> {
    // Build messages array with conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add recent conversation messages (excluding the current query)
    const recentMessages = session.messages.slice(-this.MAX_CONTEXT_MESSAGES);
    for (const msg of recentMessages) {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current user query
    messages.push({
      role: 'user',
      content: userQuery
    });

    const requestBody = {
      model: 'llama-3.3-70b-versatile',
      messages: messages
    };

    let lastError: Error | null = null;

    // Try each API key in sequence
    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
      const apiKey = GROQ_API_KEYS[i];
      
      try {
        console.log(`Attempting Groq API call with key ${i + 1}/${GROQ_API_KEYS.length}`);
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Groq API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.choices?.[0]?.message?.content) {
          throw new Error('Invalid response from Groq API');
        }

        console.log(`✓ Successfully connected with API key ${i + 1}`);
        return data.choices[0].message.content;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`✗ API key ${i + 1} failed:`, lastError.message);
        
        // If this is not the last key, continue to next one
        if (i < GROQ_API_KEYS.length - 1) {
          console.log(`Trying next API key...`);
          continue;
        }
      }
    }

    // If all keys failed, throw the last error
    throw new Error(`All ${GROQ_API_KEYS.length} API keys failed. Last error: ${lastError?.message}`);
  }

  // GROQ API CALL WITH STREAMING AND FALLBACK
  private static async callGroqAPIStream(
    systemPrompt: string,
    userQuery: string,
    session: ConversationSession,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    // Build messages array with conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add recent conversation messages (excluding the current query)
    const recentMessages = session.messages.slice(-this.MAX_CONTEXT_MESSAGES);
    for (const msg of recentMessages) {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current user query
    messages.push({
      role: 'user',
      content: userQuery
    });

    const requestBody = {
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      stream: true // Enable streaming
    };

    let lastError: Error | null = null;

    // Try each API key in sequence
    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
      const apiKey = GROQ_API_KEYS[i];
      
      try {
        console.log(`Attempting Groq streaming API call with key ${i + 1}/${GROQ_API_KEYS.length}`);
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Groq API error: ${response.status} - ${errorText}`);
        }

        // Read the stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get response stream reader');
        }

        const decoder = new TextDecoder();
        let fullResponse = '';
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            const lines = buffer.split('\n').filter(line => line.trim() !== '');
            buffer = '';

            for (const line of lines) {
              // Groq sends data in the format "data: {...}"
              if (line.startsWith('data: ')) {
                const data = line.slice(6); // Remove "data: " prefix
                if (data === '[DONE]') continue;

                // Try to parse only if it looks like a complete JSON object
                if (data.startsWith('{') && data.endsWith('}')) {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      fullResponse += content;
                      onChunk(content); // Call the callback with the chunk
                    }
                  } catch (e) {
                    // Suppress noisy error logs for expected streaming chunk errors
                  }
                } else {
                  // If not a complete JSON, buffer for next chunk
                  buffer = line + '\n';
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        if (!fullResponse) {
          throw new Error('No content received from streaming response');
        }

        console.log(`✓ Successfully streamed response with API key ${i + 1}`);
        return fullResponse;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`✗ Streaming API key ${i + 1} failed:`, lastError.message);
        
        // If this is not the last key, continue to next one
        if (i < GROQ_API_KEYS.length - 1) {
          console.log(`Trying next API key for streaming...`);
          continue;
        }
      }
    }

    // If all keys failed, throw the last error
    throw new Error(`All ${GROQ_API_KEYS.length} API keys failed for streaming. Last error: ${lastError?.message}`);
  }

  // PARSE AI RESPONSE FOR STRUCTURED DATA
  private static parseAiResponse(response: string): Omit<AiResponse, 'conversationId' | 'confidence' | 'sources' | 'responseTime' | 'intelligence_level'> {
    const followUpQuestions: string[] = [];
    const relatedTopics: string[] = [];
    const recommendations = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[]
    };

    const lines = response.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('❓') || trimmed.includes('Follow-up Questions')) {
        currentSection = 'followup';
      } else if (trimmed.includes('🔗') || trimmed.includes('Related Topics')) {
        currentSection = 'related';
      } else if (trimmed.includes('⚡') || trimmed.includes('Immediate Actions')) {
        currentSection = 'immediate';
      } else if (trimmed.includes('📅') || trimmed.includes('Next Steps')) {
        currentSection = 'shortterm';
      } else if (currentSection === 'followup' && trimmed && !trimmed.startsWith('🌱') && !trimmed.startsWith('⚡') && !trimmed.startsWith('📅') && !trimmed.startsWith('🔗')) {
        followUpQuestions.push(trimmed.replace(/^[-•*]\s*/, ''));
      } else if (currentSection === 'related' && trimmed && !trimmed.startsWith('🌱') && !trimmed.startsWith('⚡') && !trimmed.startsWith('📅') && !trimmed.startsWith('❓')) {
        relatedTopics.push(trimmed.replace(/^[-•*]\s*/, ''));
      } else if (currentSection === 'immediate' && trimmed && !trimmed.startsWith('🌱') && !trimmed.startsWith('📅') && !trimmed.startsWith('❓') && !trimmed.startsWith('🔗')) {
        recommendations.immediate.push(trimmed.replace(/^[-•*]\s*/, ''));
      } else if (currentSection === 'shortterm' && trimmed && !trimmed.startsWith('🌱') && !trimmed.startsWith('⚡') && !trimmed.startsWith('❓') && !trimmed.startsWith('🔗')) {
        recommendations.shortTerm.push(trimmed.replace(/^[-•*]\s*/, ''));
      }
    });

    return {
      advice: response,
      followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : undefined,
      recommendations: recommendations.immediate.length > 0 || recommendations.shortTerm.length > 0 ? recommendations : undefined,
      relatedTopics: relatedTopics.length > 0 ? relatedTopics : undefined
    };
  }

  // UPDATE SESSION CONTEXT
  private static async updateSessionContext(
    session: ConversationSession, 
    query: string, 
    response: Omit<AiResponse, 'conversationId' | 'confidence' | 'sources' | 'responseTime' | 'intelligence_level'>
  ): Promise<void> {
    const lowerQuery = query.toLowerCase();
    
    const cropKeywords = {
      'rice': 'rice', 'धान': 'rice',
      'wheat': 'wheat', 'गेहूं': 'wheat', 
      'corn': 'corn', 'मक्का': 'corn',
      'tomato': 'tomato', 'टमाटर': 'tomato',
      'potato': 'potato', 'आलू': 'potato'
    };
    
    for (const [keyword, crop] of Object.entries(cropKeywords)) {
      if (lowerQuery.includes(keyword)) {
        session.context.cropType = crop;
        break;
      }
    }

    const sizeKeywords = {
      'small': 'small', 'छोटा': 'small',
      'medium': 'medium', 'मध्यम': 'medium',
      'large': 'large', 'बड़ा': 'large',
      'acre': 'medium', 'एकड़': 'medium'
    };
    
    for (const [keyword, size] of Object.entries(sizeKeywords)) {
      if (lowerQuery.includes(keyword)) {
        session.context.farmSize = size;
        break;
      }
    }

    if (lowerQuery.includes('problem') || lowerQuery.includes('issue') || lowerQuery.includes('समस्या') || 
        lowerQuery.includes('disease') || lowerQuery.includes('बीमारी')) {
      if (!session.context.currentIssues) session.context.currentIssues = [];
      const issue = this.extractIssueFromQuery(query);
      if (issue && !session.context.currentIssues.includes(issue)) {
        session.context.currentIssues.push(issue);
      }
    }

    if (response.recommendations) {
      if (!session.context.previousRecommendations) session.context.previousRecommendations = [];
      
      [...response.recommendations.immediate, ...response.recommendations.shortTerm]
        .forEach(rec => {
          if (rec && !session.context.previousRecommendations?.includes(rec)) {
            session.context.previousRecommendations?.push(rec);
          }
        });
      
      session.context.previousRecommendations = session.context.previousRecommendations.slice(-10);
    }

    if (session.title === 'New Farm Consultation' && session.messages.length > 2) {
      session.title = this.generateConversationTitle(query);
    }

    session.context.followUpNeeded = (response.followUpQuestions?.length || 0) > 0;
    session.updatedAt = new Date();
  }

  // SAVE CONVERSATION TO DATABASE
  private static async saveConversation(session: ConversationSession): Promise<void> {
    try {
      const { error: convError } = await supabase
        .from('conversations')
        .upsert({
          id: session.id,
          title: session.title,
          context: session.context,
          created_at: session.createdAt.toISOString(),
          updated_at: session.updatedAt.toISOString()
        });

      if (convError) {
        console.error('Error saving conversation:', convError);
        return;
      }

      const newMessages = session.messages.slice(-2);
      const messagesToInsert = newMessages.map(msg => ({
        id: `${session.id}_${msg.timestamp.getTime()}`,
        conversation_id: session.id,
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata,
        timestamp: msg.timestamp.toISOString()
      }));

      if (messagesToInsert.length > 0) {
        const { error: msgError } = await supabase
          .from('conversation_messages')
          .upsert(messagesToInsert);

        if (msgError) {
          console.error('Error saving messages:', msgError);
        }
      }
    } catch (error) {
      console.error('Error in saveConversation:', error);
    }
  }

  // LOGGING
  private static async logQuery(
    query: string,
    response: AiResponse,
    conversationId: string
  ): Promise<void> {
    try {
      const logEntry: Omit<AiLog, 'id' | 'created_at' | 'timestamp'> = {
        query,
        response: response.advice,
        confidence: response.confidence,
        response_time: Math.round(response.responseTime || 0),
        language: 'auto-detected',
        sources: response.sources,
        intelligence_level: response.intelligence_level,
        status: 'success',
        model_used: 'llama-3.3-70b-versatile',
        user_feedback: null,
        conversation_id: conversationId
      };

      const { error } = await supabase.from('ai_log').insert([logEntry]);
      
      if (error) {
        console.error('Failed to insert AI log:', error);
      }
    } catch (error) {
      console.error('Failed to log AI query:', error);
    }
  }

  // UTILITY METHODS
  private static getCurrentSeason(): 'summer' | 'monsoon' | 'winter' {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 5) return 'summer';
    if (month >= 6 && month <= 9) return 'monsoon';
    return 'winter';
  }

  private static getTimeContext(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private static extractTopicFromMessage(content: string): string | null {
    const topicKeywords = {
      'irrigation': ['water', 'irrigation', 'पानी', 'सिंचाई'],
      'disease': ['disease', 'health', 'बीमारी', 'स्वास्थ्य'],
      'fertilizer': ['fertilizer', 'nutrition', 'खाद', 'पोषण'],
      'weather': ['weather', 'rain', 'मौसम', 'बारिश'],
      'soil': ['soil', 'मिट्टी'],
      'harvest': ['harvest', 'crop', 'फसल'],
      'pest': ['pest', 'insect', 'कीट']
    };

    const lowerContent = content.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return topic;
      }
    }
    return null;
  }

  private static extractIssueFromQuery(query: string): string | null {
    const issuePatterns = [
      /problem with (.+)/i,
      /issue with (.+)/i,
      /(.+) disease/i,
      /(.+) की समस्या/i,
      /(.+) बीमारी/i
    ];

    for (const pattern of issuePatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    if (query.toLowerCase().includes('problem') || query.toLowerCase().includes('समस्या')) {
      return query.substring(0, 50) + (query.length > 50 ? '...' : '');
    }

    return null;
  }

  private static generateConversationTitle(query: string): string {
    const words = query.split(' ').slice(0, 4);
    return words.join(' ') + (query.split(' ').length > 4 ? '...' : '');
  }

  // PUBLIC METHODS FOR CONVERSATION MANAGEMENT

  static async getConversationHistory(conversationId: string): Promise<ConversationMessage[]> {
    try {
      const session = await this.getConversationSession(conversationId);
      return session.messages;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  static async getUserConversations(_userId?: string | null, limit: number = 20): Promise<ConversationSession[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: [],
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
        context: conv.context || {}
      }));
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    }
  }

  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { error: msgError } = await supabase
        .from('conversation_messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (msgError) {
        console.error('Error deleting messages:', msgError);
        return false;
      }

      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (convError) {
        console.error('Error deleting conversation:', convError);
        return false;
      }

      this.conversationCache.delete(conversationId);
      return true;
    } catch (error) {
      console.error('Error in deleteConversation:', error);
      return false;
    }
  }

  static async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation title:', error);
        return false;
      }

      if (this.conversationCache.has(conversationId)) {
        const session = this.conversationCache.get(conversationId)!;
        session.title = title;
        session.updatedAt = new Date();
      }

      return true;
    } catch (error) {
      console.error('Error in updateConversationTitle:', error);
      return false;
    }
  }

  static async getConversationInsights(conversationId: string): Promise<{
    totalMessages: number;
    topics: string[];
    issues: string[];
    recommendations: string[];
    duration: number;
    lastActivity: Date;
  }> {
    try {
      const session = await this.getConversationSession(conversationId);
      
      const topics = new Set<string>();
      const issues = new Set<string>();
      const recommendations = new Set<string>();

      session.messages.forEach(msg => {
        if (msg.role === 'user') {
          const topic = this.extractTopicFromMessage(msg.content);
          if (topic) topics.add(topic);

          const issue = this.extractIssueFromQuery(msg.content);
          if (issue) issues.add(issue);
        }
      });

      session.context.previousRecommendations?.forEach(rec => {
        recommendations.add(rec);
      });

      const duration = Math.round(
        (session.updatedAt.getTime() - session.createdAt.getTime()) / (1000 * 60)
      );

      return {
        totalMessages: session.messages.length,
        topics: Array.from(topics),
        issues: Array.from(issues),
        recommendations: Array.from(recommendations),
        duration,
        lastActivity: session.updatedAt
      };
    } catch (error) {
      console.error('Error getting conversation insights:', error);
      return {
        totalMessages: 0,
        topics: [],
        issues: [],
        recommendations: [],
        duration: 0,
        lastActivity: new Date()
      };
    }
  }

  static async searchConversations(
    _userId: string | null,
    searchQuery: string,
    limit: number = 10
  ): Promise<ConversationSession[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`title.ilike.%${searchQuery}%,context->cropType.ilike.%${searchQuery}%`)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: [],
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
        context: conv.context || {}
      }));
    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  }

  // LOCATION AND SENSOR BASED METHODS
  static getLocationBasedAdvice(
    latitude: number, 
    longitude: number, 
    conversationId?: string,
    language: string = 'en'
  ): Promise<AiResponse> {
    const locationQuery = language === 'hi' 
      ? `इस स्थान (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) के लिए खेती की सलाह दें`
      : `Provide farming advice for location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    
    return this.processQuery(locationQuery, conversationId, undefined, language);
  }

  static getSensorBasedRecommendations(
    sensorType: string, 
    value: number, 
    unit: string, 
    conversationId?: string,
    language: string = 'en'
  ): Promise<AiResponse> {
    const query = language === 'hi'
      ? `${sensorType} सेंसर ${value}${unit} दिखा रहा है। क्या करना चाहिए?`
      : `${sensorType} sensor showing ${value}${unit}. What should I do?`;
    
    return this.processQuery(query, conversationId, undefined, language);
  }

  // PERFORMANCE MONITORING
  static async getPerformanceStats(): Promise<{
    totalQueries: number;
    avgResponseTime: number;
    successRate: number;
    lastQueryTime: string | null;
    conversationStats: {
      totalConversations: number;
      avgConversationLength: number;
      activeConversations: number;
    };
  }> {
    try {
      const { data: logs, error: logsError } = await supabase
        .from('ai_log')
        .select('response_time, created_at, status, conversation_id')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      const totalQueries = logs.length;
      const successfulQueries = logs.filter(log => log.status === 'success').length;
      const avgResponseTime = logs.reduce((sum, log) => sum + (log.response_time || 0), 0) / totalQueries;
      const successRate = totalQueries > 0 ? successfulQueries / totalQueries : 0;
      const lastQueryTime = logs[0]?.created_at || null;

      const totalConversations = conversations.length;
      const recentConversations = conversations.filter(conv => {
        const updatedAt = new Date(conv.updated_at);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return updatedAt > dayAgo;
      });
      const activeConversations = recentConversations.length;

      const conversationLengths = await Promise.all(
        conversations.slice(0, 20).map(async conv => {
          const { data: messages } = await supabase
            .from('conversation_messages')
            .select('id')
            .eq('conversation_id', conv.id);
          return messages?.length || 0;
        })
      );
      const avgConversationLength = conversationLengths.reduce((sum, len) => sum + len, 0) / conversationLengths.length;

      return {
        totalQueries,
        avgResponseTime,
        successRate,
        lastQueryTime,
        conversationStats: {
          totalConversations,
          avgConversationLength,
          activeConversations
        }
      };
    } catch (error) {
      console.error('Error fetching performance stats:', error);
      return {
        totalQueries: 0,
        avgResponseTime: 0,
        successRate: 0,
        lastQueryTime: null,
        conversationStats: {
          totalConversations: 0,
          avgConversationLength: 0,
          activeConversations: 0
        }
      };
    }
  }

  // CACHE MANAGEMENT
  static clearCache(): void {
    this.conversationCache.clear();
    console.log('Conversation cache cleared');
  }

  static getCacheSize(): number {
    return this.conversationCache.size;
  }

  static purgeCacheOlderThan(minutes: number): void {
    const cutoffTime = Date.now() - minutes * 60 * 1000;
    for (const [id, session] of this.conversationCache.entries()) {
      if (session.updatedAt.getTime() < cutoffTime) {
        this.conversationCache.delete(id);
      }
    }
  }

  // BULK TESTING METHODS
  static async processBulkQueries(
    testCases: BulkTestCase[],
    onProgress?: (current: number, total: number, result: BulkTestResult) => void
  ): Promise<BulkTestResult[]> {
    const results: BulkTestResult[] = [];
    
    // Process one test at a time for smoother experience
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const startTime = performance.now();
      
      try {
        // Fetch weather data if location is provided
        let weatherData: WeatherData | null = null;
        if (testCase.latitude && testCase.longitude) {
          try {
            weatherData = await WeatherService.getCurrentWeather(
              testCase.latitude,
              testCase.longitude
            );
          } catch (weatherError) {
            console.warn(`Failed to fetch weather for location ${testCase.latitude}, ${testCase.longitude}:`, weatherError);
            // Continue without weather data
          }
        }
        
        // Build query from test case with weather data
        const query = this.buildQueryFromTestCase(testCase, weatherData);
        
        // Process the query
        const response = await this.processQuery(
          query,
          undefined,
          undefined,
          testCase.language || 'en'
        );
        
        const result: BulkTestResult = {
          id: testCase.id,
          input: testCase,
          query: query,
          response: response.advice,
          confidence: response.confidence,
          responseTime: performance.now() - startTime,
          timestamp: new Date().toISOString(),
          status: 'success',
          recommendations: response.recommendations,
          followUpQuestions: response.followUpQuestions,
          relatedTopics: response.relatedTopics,
          weatherData: weatherData || undefined
        };
        
        results.push(result);
        
        // Call progress callback immediately after each test completes
        if (onProgress) {
          onProgress(i + 1, testCases.length, result);
        }
        
        // Small delay between tests to avoid overwhelming the API
        // Skip delay after last test
        if (i < testCases.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
      } catch (error) {
        const errorResult: BulkTestResult = {
          id: testCase.id,
          input: testCase,
          query: this.buildQueryFromTestCase(testCase, null),
          response: '',
          confidence: 0,
          responseTime: performance.now() - startTime,
          timestamp: new Date().toISOString(),
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        results.push(errorResult);
        
        if (onProgress) {
          onProgress(i + 1, testCases.length, errorResult);
        }
        
        // Small delay even after errors
        if (i < testCases.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
    
    return results;
  }

  private static buildQueryFromTestCase(testCase: BulkTestCase, weatherData: WeatherData | null = null): string {
    // CHECK FOR MISSING CRITICAL DATA
    const missingFields: string[] = [];
    const criticalFields = {
      'latitude': testCase.latitude,
      'longitude': testCase.longitude,
      'soil pH': testCase.soilPH,
      'soil moisture': testCase.soilMoisture,
      'nitrogen': testCase.soilNitrogen,
      'phosphorus': testCase.soilPhosphorus,
      'potassium': testCase.soilPotassium,
      'crop type': testCase.cropType
    };
    
    for (const [fieldName, value] of Object.entries(criticalFields)) {
      if (value === undefined || value === null || value === '') {
        missingFields.push(fieldName);
      }
    }
    
    // If critical data is missing, add warning to query
    let warningPrefix = '';
    if (missingFields.length > 0) {
      warningPrefix = `[CRITICAL: Missing data - ${missingFields.join(', ')}. Provide ONLY general advice with NO specific fertilizer doses or amounts. Request missing information.] `;
    }
    
    const parts: string[] = [];
    
    if (testCase.latitude && testCase.longitude) {
      parts.push(`Location: ${testCase.latitude}, ${testCase.longitude}`);
    }
    
    if (testCase.soilMoisture !== undefined) {
      parts.push(`Soil Moisture: ${testCase.soilMoisture}%`);
    }
    
    if (testCase.soilPH !== undefined) {
      parts.push(`Soil pH: ${testCase.soilPH}`);
    }
    
    if (testCase.soilNitrogen !== undefined) {
      parts.push(`Nitrogen: ${testCase.soilNitrogen} mg/kg`);
    }
    
    if (testCase.soilPhosphorus !== undefined) {
      parts.push(`Phosphorus: ${testCase.soilPhosphorus} mg/kg`);
    }
    
    if (testCase.soilPotassium !== undefined) {
      parts.push(`Potassium: ${testCase.soilPotassium} mg/kg`);
    }
    
    // If weather data is fetched, use it; otherwise use manual temperature/humidity if provided
    if (weatherData) {
      parts.push(`Temperature: ${weatherData.temperature}°C`);
      parts.push(`Humidity: ${weatherData.humidity}%`);
      parts.push(`Weather: ${weatherData.weather_description}`);
      parts.push(`Wind Speed: ${weatherData.wind_speed} km/h`);
      if (weatherData.rainfall > 0) {
        parts.push(`Rainfall: ${weatherData.rainfall}mm`);
      }
    } else {
      // Fallback to manual temperature/humidity from CSV if no weather data
      if (testCase.temperature !== undefined) {
        parts.push(`Temperature: ${testCase.temperature}°C`);
      }
      
      if (testCase.humidity !== undefined) {
        parts.push(`Humidity: ${testCase.humidity}%`);
      }
    }
    
    if (testCase.cropType) {
      parts.push(`Crop: ${testCase.cropType}`);
    }
    
    const dataString = parts.join(', ');
    
    const baseQuery = testCase.customQuery || 
      (testCase.language === 'hi' 
        ? 'इन मापदंडों के आधार पर खेती की सलाह दें' 
        : 'Provide farming advice based on these parameters');
    
    // Add warning prefix if critical data is missing
    return `${warningPrefix}${baseQuery}. ${dataString}`;
  }

  static async exportBulkResultsToCSV(results: BulkTestResult[]): Promise<string> {
    const headers = [
      'ID',
      'Status',
      'Latitude',
      'Longitude',
      'Soil Moisture (%)',
      'Soil pH',
      'Nitrogen (mg/kg)',
      'Phosphorus (mg/kg)',
      'Potassium (mg/kg)',
      'Crop Type',
      'Weather Temp (°C)',
      'Weather Humidity (%)',
      'Weather Condition',
      'Weather Description',
      'Wind Speed (km/h)',
      'Rainfall (mm)',
      'Query',
      'AI Response',
      'Confidence',
      'Response Time (ms)',
      'Immediate Actions',
      'Next Steps',
      'Follow-up Questions',
      'Related Topics',
      'Error',
      'Timestamp'
    ];
    
    const csvRows = [headers.join(',')];
    
    for (const result of results) {
      const row = [
        result.id,
        result.status,
        result.input.latitude || '',
        result.input.longitude || '',
        result.input.soilMoisture || '',
        result.input.soilPH || '',
        result.input.soilNitrogen || '',
        result.input.soilPhosphorus || '',
        result.input.soilPotassium || '',
        result.input.cropType || '',
        result.weatherData?.temperature || '',
        result.weatherData?.humidity || '',
        result.weatherData?.weather_condition || '',
        result.weatherData?.weather_description || '',
        result.weatherData?.wind_speed || '',
        result.weatherData?.rainfall || '',
        this.escapeCsvField(result.query),
        this.escapeCsvField(result.response),
        result.confidence,
        Math.round(result.responseTime),
        this.escapeCsvField(result.recommendations?.immediate.join('; ') || ''),
        this.escapeCsvField(result.recommendations?.shortTerm.join('; ') || ''),
        this.escapeCsvField(result.followUpQuestions?.join('; ') || ''),
        this.escapeCsvField(result.relatedTopics?.join('; ') || ''),
        this.escapeCsvField(result.error || ''),
        result.timestamp
      ];
      
      csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
  }

  static async exportBulkResultsToJSON(results: BulkTestResult[]): Promise<string> {
    return JSON.stringify(results, null, 2);
  }

  private static escapeCsvField(field: string): string {
    if (!field) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  }

  static parseCsvToBulkTestCases(csvContent: string): BulkTestCase[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const testCases: BulkTestCase[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const testCase: BulkTestCase = {
        id: String(i),
        language: 'en'
      };
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (!value) return;
        
        // Use more specific matching to avoid conflicts
        if (header === 'id' || header.includes('test_id')) {
          testCase.id = value;
        } else if (header.includes('lat') && !header.includes('long')) {
          testCase.latitude = parseFloat(value);
        } else if (header.includes('lon') || header.includes('long')) {
          testCase.longitude = parseFloat(value);
        } else if (header.includes('moisture')) {
          testCase.soilMoisture = parseFloat(value);
        } else if ((header.includes('ph') || header.includes('pH')) && !header.includes('phos')) {
          // Match 'ph' or 'pH' but NOT 'phosphorus'
          testCase.soilPH = parseFloat(value);
        } else if (header.includes('nitrogen') || header === 'n' || header === 'n_level') {
          testCase.soilNitrogen = parseFloat(value);
        } else if (header.includes('phosph') || header === 'p' || header === 'p_level') {
          // Match 'phosphorus' or 'phosphate' but not just any 'p'
          testCase.soilPhosphorus = parseFloat(value);
        } else if (header.includes('potassium') || header === 'k' || header === 'k_level') {
          testCase.soilPotassium = parseFloat(value);
        } else if (header.includes('temp') && !header.includes('attempt')) {
          testCase.temperature = parseFloat(value);
        } else if (header.includes('humid')) {
          testCase.humidity = parseFloat(value);
        } else if (header.includes('crop')) {
          testCase.cropType = value;
        } else if (header.includes('query') || header.includes('question')) {
          testCase.customQuery = value;
        } else if (header.includes('lang')) {
          testCase.language = value as 'en' | 'hi';
        }
      });
      
      testCases.push(testCase);
    }
    
    return testCases;
  }

  private static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Generate AI-driven insights for weather data
   * Returns a concise, spoken-friendly insight about weather conditions
   */
  static async getWeatherInsights(
    weatherData: WeatherData,
    trend: 'warming' | 'cooling' | 'stable',
    language: string = 'en'
  ): Promise<string> {
    try {
      const systemPrompt = language === 'hi'
        ? `आप एक कृषि सलाहकार हैं। मौसम की जानकारी को संक्षेप में बताएं (अधिकतम 2-3 वाक्य, बोलने के लिए उपयुक्त):
तापमान: ${weatherData.temperature}°C
आर्द्रता: ${weatherData.humidity}%
स्थिति: ${weatherData.weather_description}
रुझान: ${trend === 'warming' ? 'तापमान बढ़ रहा है' : trend === 'cooling' ? 'तापमान घट रहा है' : 'तापमान स्थिर है'}
हवा की गति: ${weatherData.wind_speed} किमी/घंटा

कृपया किसानों के लिए सरल हिंदी में मौसम की संक्षिप्त जानकारी और एक त्वरित सलाह दें।`
        : `You are an agricultural advisor. Provide a brief weather summary (max 2-3 sentences, suitable for text-to-speech):
Temperature: ${weatherData.temperature}°C
Humidity: ${weatherData.humidity}%
Condition: ${weatherData.weather_description}
Trend: ${trend === 'warming' ? 'Temperature rising' : trend === 'cooling' ? 'Temperature falling' : 'Temperature stable'}
Wind speed: ${weatherData.wind_speed} km/h

Provide a concise weather summary and quick farming advice in simple language.`;

      const userQuery = language === 'hi' 
        ? 'मौसम की जानकारी बताएं।'
        : 'Provide weather insights.';

      // Create a temporary session for this quick query
      const tempSession = await this.createNewConversation(language);
      const response = await this.callGroqAPI(systemPrompt, userQuery, tempSession);
      return response.trim();
    } catch (error) {
      console.error('Error generating weather insights:', error);
      // Fallback to simple template
      if (language === 'hi') {
        return `मौसम की जानकारी: तापमान ${weatherData.temperature}°C, आर्द्रता ${weatherData.humidity}%, स्थिति: ${weatherData.weather_description}. ${trend === 'warming' ? 'तापमान बढ़ रहा है।' : trend === 'cooling' ? 'तापमान घट रहा है।' : 'तापमान स्थिर है।'}`;
      }
      return `Weather update: Temperature ${weatherData.temperature}°C, humidity ${weatherData.humidity}%, condition: ${weatherData.weather_description}. ${trend === 'warming' ? 'Temperature rising.' : trend === 'cooling' ? 'Temperature falling.' : 'Temperature stable.'}`;
    }
  }

  /**
   * Generate AI-driven insights for sensor parameter
   * Returns a concise, spoken-friendly insight about the parameter
   */
  static async getSensorInsights(
    sensorName: string,
    value: number,
    unit: string,
    status: 'optimal' | 'warning' | 'critical',
    trend: 'up' | 'down' | 'stable',
    language: string = 'en'
  ): Promise<string> {
    try {
      const systemPrompt = language === 'hi'
        ? `आप एक कृषि सलाहकार हैं। इस सेंसर डेटा को संक्षेप में बताएं (अधिकतम 2-3 वाक्य, बोलने के लिए उपयुक्त):
पैरामीटर: ${sensorName}
मान: ${value}${unit}
स्थिति: ${status === 'optimal' ? 'अच्छा' : status === 'warning' ? 'सावधान' : 'खतरनाक'}
रुझान: ${trend === 'up' ? 'बढ़ रहा है' : trend === 'down' ? 'घट रहा है' : 'स्थिर है'}

कृपया किसानों के लिए सरल हिंदी में इस पैरामीटर की संक्षिप्त जानकारी और त्वरित सलाह दें।`
        : `You are an agricultural advisor. Provide brief insights about this sensor reading (max 2-3 sentences, suitable for text-to-speech):
Parameter: ${sensorName}
Value: ${value}${unit}
Status: ${status}
Trend: ${trend === 'up' ? 'increasing' : trend === 'down' ? 'decreasing' : 'stable'}

Provide a concise summary and quick farming advice in simple language.`;

      const userQuery = language === 'hi'
        ? `${sensorName} की जानकारी बताएं।`
        : `Provide insights for ${sensorName}.`;

      // Create a temporary session for this quick query
      const tempSession = await this.createNewConversation(language);
      const response = await this.callGroqAPI(systemPrompt, userQuery, tempSession);
      return response.trim();
    } catch (error) {
      console.error('Error generating sensor insights:', error);
      // Fallback to simple template
      if (language === 'hi') {
        let text = `${sensorName}: वर्तमान मान ${value}${unit ? ' ' + unit : ''}.`;
        if (trend === 'up') text += ' मान बढ़ रहा है.';
        else if (trend === 'down') text += ' मान घट रहा है.';
        else text += ' मान स्थिर है.';
        return text;
      }
      let text = `${sensorName}: Current value is ${value}${unit ? ' ' + unit : ''}.`;
      if (trend === 'up') text += ' Value is increasing.';
      else if (trend === 'down') text += ' Value is decreasing.';
      else text += ' Value is stable.';
      return text;
    }
  }
}

// Types for bulk testing
export interface BulkTestCase {
  id: string;
  latitude?: number;
  longitude?: number;
  soilMoisture?: number;
  soilPH?: number;
  soilNitrogen?: number;
  soilPhosphorus?: number;
  soilPotassium?: number;
  temperature?: number;
  humidity?: number;
  cropType?: string;
  customQuery?: string;
  language?: 'en' | 'hi';
}

export interface BulkTestResult {
  id: string;
  input: BulkTestCase;
  query: string;
  response: string;
  confidence: number;
  responseTime: number;
  timestamp: string;
  status: 'success' | 'error';
  recommendations?: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  followUpQuestions?: string[];
  relatedTopics?: string[];
  weatherData?: WeatherData;
  error?: string;
}