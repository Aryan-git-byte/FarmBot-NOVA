/**
 * AI Service - Frontend client for FarmBot Nova AI Backend
 * 
 * This service communicates with the backend API for all AI-related operations.
 * All Groq/LLM calls are now handled by the backend.
 * 
 * Author: Aryan Kumar
 */

import { supabase, ProcessedSensorReading } from '../config/supabase';
import { SensorService } from './sensorService';
import { WeatherService, WeatherData } from './weatherService';
import { ApiClient, BackendAiResponse, BackendConversationsResponse, BackendConversationHistoryResponse } from '../config/api';

// Get auth ID - hardcoded for testing
const getAuthId = async (): Promise<string> => {
  // TODO: Remove hardcoded auth_id in production
  return '17550';
};

// Conversation message structure (for local display)
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
  // Backend-specific fields
  ragInfo?: {
    success: boolean;
    ragChunksCount?: number;
    webResultsCount?: number;
    usedWebSearch?: boolean;
  };
  mlPredictionUsed?: boolean;
  detectedLanguage?: string;
  // Raw backend response - exactly as received from the API
  rawBackendResponse?: BackendAiResponse;
}

export class AiService {
  private static conversationCache = new Map<string, ConversationSession>();

  /**
   * Main processing method - sends query to backend API
   */
  static async processQuery(
    query: string,
    conversationId?: string,
    _userId?: string | null,
    language: string = 'en',
    image?: File
  ): Promise<AiResponse> {
    const startTime = performance.now();

    try {
      const authId = await getAuthId();
      
      // Get current location if available
      let lat: number | undefined;
      let lon: number | undefined;
      
      try {
        const sensorData = await SensorService.getLatestReadings();
        if (sensorData.length > 0 && sensorData[0].latitude && sensorData[0].longitude) {
          lat = sensorData[0].latitude;
          lon = sensorData[0].longitude;
        }
      } catch (error) {
        console.warn('Could not get location from sensor data:', error);
      }

      // Build form data for the request
      const formData = new FormData();
      formData.append('query', query);
      formData.append('auth_id', authId);
      
      if (conversationId) {
        formData.append('conversation_id', conversationId);
      }
      
      if (lat !== undefined && lon !== undefined) {
        formData.append('lat', lat.toString());
        formData.append('lon', lon.toString());
      }
      
      if (image) {
        formData.append('image', image);
      }

      // Call backend API
      const backendResponse = await ApiClient.postForm<BackendAiResponse>('/api/ai/ask', formData);

      // Parse and transform backend response
      const response = this.transformBackendResponse(backendResponse, startTime);

      // Note: Logging is now handled by the backend, no need to duplicate here

      return response;

    } catch (error) {
      console.error('AI query failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to process AI query');
    }
  }

  /**
   * Streaming processing method - backend doesn't support streaming yet,
   * so we simulate it by calling processQuery and streaming the result
   */
  static async processQueryStream(
    query: string,
    onChunk: (chunk: string) => void,
    conversationId?: string,
    userId?: string | null,
    language: string = 'en',
    image?: File
  ): Promise<AiResponse> {
    // Get the full response from backend
    const response = await this.processQuery(query, conversationId, userId, language, image);
    
    // Simulate streaming by sending the response in chunks
    const words = response.advice.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
      onChunk(chunk);
      // Small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 15));
    }
    
    return response;
  }

  /**
   * Transform backend response to frontend AiResponse format
   */
  private static transformBackendResponse(
    backendResponse: BackendAiResponse,
    startTime: number
  ): AiResponse {
    // Parse recommendations from the answer
    const parsed = this.parseAiResponse(backendResponse.answer);

    // Build event breakdown from timing analysis
    const eventBreakdown: Array<{ label: string; ms: number; source: string }> = [];
    const timing = backendResponse.timing_analysis;
    
    if (timing.get_coordinates_ms) {
      eventBreakdown.push({ label: 'Get Coordinates', ms: timing.get_coordinates_ms, source: 'internal' });
    }
    if (timing.location_context_build_ms) {
      eventBreakdown.push({ label: 'Location Context', ms: timing.location_context_build_ms, source: 'location_service' });
    }
    if (timing.soil_analysis_ms) {
      eventBreakdown.push({ label: 'Soil Analysis', ms: timing.soil_analysis_ms, source: 'soil_service' });
    }
    if (timing.sensor_data_fetch_ms) {
      eventBreakdown.push({ label: 'Sensor Data', ms: timing.sensor_data_fetch_ms, source: 'sensor_service' });
    }
    if (timing.ml_prediction_ms) {
      eventBreakdown.push({ label: 'ML Prediction', ms: timing.ml_prediction_ms, source: 'ml_service' });
    }
    if (timing.history_retrieval_ms) {
      eventBreakdown.push({ label: 'History Retrieval', ms: timing.history_retrieval_ms, source: 'redis' });
    }
    if (timing.rag_search_ms) {
      eventBreakdown.push({ label: 'RAG Search', ms: timing.rag_search_ms, source: 'qdrant' });
    }
    if (timing.llm_inference_ms) {
      eventBreakdown.push({ label: 'LLM Inference', ms: timing.llm_inference_ms, source: 'groq' });
    }

    // Build sources list
    const sources: string[] = ['backend_api'];
    if (backendResponse.rag_info?.success) {
      sources.push('rag_knowledge');
    }
    if (backendResponse.ml_prediction_used) {
      sources.push('ml_predictions');
    }
    if (backendResponse.context_used.sensor_available) {
      sources.push('sensor_data');
    }

    return {
      advice: backendResponse.answer,
      confidence: backendResponse.rag_info?.success ? 0.9 : 0.7,
      sources,
      responseTime: performance.now() - startTime,
      intelligence_level: 'advanced',
      conversationId: backendResponse.conversation_id,
      followUpQuestions: parsed.followUpQuestions,
      recommendations: parsed.recommendations,
      relatedTopics: parsed.relatedTopics,
      eventBreakdown,
      ragInfo: backendResponse.rag_info ? {
        success: backendResponse.rag_info.success,
        ragChunksCount: backendResponse.rag_info.rag_chunks_count,
        webResultsCount: backendResponse.rag_info.web_results_count,
        usedWebSearch: backendResponse.rag_info.used_web_search,
      } : undefined,
      mlPredictionUsed: backendResponse.ml_prediction_used,
      detectedLanguage: backendResponse.detected_language,
      // Store the raw backend response for display in the raw response drawer
      rawBackendResponse: backendResponse,
    };
  }

  /**
   * Parse AI response for structured data (follow-up questions, recommendations, etc.)
   */
  private static parseAiResponse(response: string): {
    followUpQuestions?: string[];
    recommendations?: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
    relatedTopics?: string[];
  } {
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
      followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : undefined,
      recommendations: recommendations.immediate.length > 0 || recommendations.shortTerm.length > 0 ? recommendations : undefined,
      relatedTopics: relatedTopics.length > 0 ? relatedTopics : undefined
    };
  }

  // Note: Logging is now handled by the backend, so logQuery function has been removed

  // ============================================================================
  // CONVERSATION MANAGEMENT - Using Backend API
  // ============================================================================

  /**
   * Get all conversations for the current user
   */
  static async getUserConversations(_userId?: string | null, limit: number = 20): Promise<ConversationSession[]> {
    try {
      const authId = await getAuthId();
      
      const response = await ApiClient.get<BackendConversationsResponse>('/api/ai/conversations', {
        auth_id: authId
      });

      return response.conversations.map(conv => ({
        id: conv.conversation_id,  // Backend uses conversation_id
        title: conv.title || `Conversation ${conv.conversation_id.slice(0, 8)}`,
        messages: [],
        createdAt: new Date(conv.last_message),  // Use last_message as timestamp
        updatedAt: new Date(conv.last_message),
        context: {}
      })).slice(0, limit);

    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    }
  }

  /**
   * Get conversation history
   */
  static async getConversationHistory(conversationId: string): Promise<ConversationMessage[]> {
    // Validate conversationId before making API call
    if (!conversationId || conversationId.trim() === '') {
      console.warn('getConversationHistory called with empty conversationId');
      return [];
    }

    try {
      const response = await ApiClient.get<BackendConversationHistoryResponse>('/api/ai/conversation/history', {
        conversation_id: conversationId,
        limit: '50'
      });

      return response.messages.map(msg => ({
        id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),  // Backend uses timestamp
        metadata: msg.metadata
      }));

    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(conversationId: string): Promise<boolean> {
    // Validate conversationId before making API call
    if (!conversationId || conversationId.trim() === '') {
      console.warn('deleteConversation called with empty conversationId');
      return false;
    }

    try {
      const authId = await getAuthId();
      
      await ApiClient.delete('/api/ai/conversation', {
        conversation_id: conversationId,
        auth_id: authId
      });

      this.conversationCache.delete(conversationId);
      return true;

    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Update conversation title (local + Supabase fallback)
   */
  static async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    try {
      // Update in Supabase directly since backend may not have this endpoint
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

  /**
   * Search conversations
   */
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

  /**
   * Get conversation insights
   */
  static async getConversationInsights(conversationId: string): Promise<{
    totalMessages: number;
    topics: string[];
    issues: string[];
    recommendations: string[];
    duration: number;
    lastActivity: Date;
  }> {
    try {
      const messages = await this.getConversationHistory(conversationId);
      
      const topics = new Set<string>();
      const issues = new Set<string>();

      messages.forEach(msg => {
        if (msg.role === 'user') {
          const topic = this.extractTopicFromMessage(msg.content);
          if (topic) topics.add(topic);

          const issue = this.extractIssueFromQuery(msg.content);
          if (issue) issues.add(issue);
        }
      });

      const firstMsg = messages[0];
      const lastMsg = messages[messages.length - 1];
      const duration = firstMsg && lastMsg 
        ? Math.round((lastMsg.timestamp.getTime() - firstMsg.timestamp.getTime()) / (1000 * 60))
        : 0;

      return {
        totalMessages: messages.length,
        topics: Array.from(topics),
        issues: Array.from(issues),
        recommendations: [],
        duration,
        lastActivity: lastMsg?.timestamp || new Date()
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

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

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

  // ============================================================================
  // LOCATION AND SENSOR BASED METHODS
  // ============================================================================

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

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

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

      return {
        totalQueries,
        avgResponseTime,
        successRate,
        lastQueryTime,
        conversationStats: {
          totalConversations,
          avgConversationLength: 0, // Would need additional query
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

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

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

  // ============================================================================
  // WEATHER AND SENSOR INSIGHTS (Using Backend)
  // ============================================================================

  /**
   * Generate AI-driven insights for weather data using dedicated backend endpoint
   */
  static async getWeatherInsights(
    weatherData: WeatherData,
    trend: 'warming' | 'cooling' | 'stable',
    language: string = 'en'
  ): Promise<string> {
    try {
      // Use dedicated weather insights endpoint
      const formData = new FormData();
      formData.append('temperature', weatherData.temperature.toString());
      formData.append('humidity', weatherData.humidity.toString());
      formData.append('weather_description', weatherData.weather_description);
      formData.append('trend', trend);
      formData.append('language', language);

      const response = await ApiClient.postForm<{ success: boolean; insights: string }>(
        '/api/ai/weather-insights',
        formData
      );

      return response.insights;
    } catch (error) {
      console.error('Error generating weather insights:', error);
      // Fallback to simple template
      if (language === 'hi') {
        return `तापमान ${weatherData.temperature} डिग्री सेल्सियस और नमी ${weatherData.humidity} प्रतिशत है। ${trend === 'warming' ? 'तापमान बढ़ रहा है, सिंचाई पर ध्यान दें।' : trend === 'cooling' ? 'तापमान गिर रहा है, फसलों को ठंड से बचाएं।' : 'मौसम स्थिर है।'}`;
      }
      return `Temperature is ${weatherData.temperature}C with ${weatherData.humidity}% humidity. ${trend === 'warming' ? 'Rising temperatures suggest increased irrigation may be needed.' : trend === 'cooling' ? 'Cooling trend detected, consider protecting crops from cold.' : 'Weather is stable, continue regular farming activities.'}`;
    }
  }

  /**
   * Generate AI-driven insights for sensor parameter using dedicated backend endpoint
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
      // Use dedicated sensor insights endpoint
      const formData = new FormData();
      formData.append('sensor_name', sensorName);
      formData.append('value', value.toString());
      formData.append('unit', unit);
      formData.append('status', status);
      formData.append('trend', trend);
      formData.append('language', language);

      const response = await ApiClient.postForm<{ success: boolean; insights: string }>(
        '/api/ai/sensor-insights',
        formData
      );

      return response.insights;
    } catch (error) {
      console.error('Error generating sensor insights:', error);
      // Fallback to simple template
      const unitDisplay = unit ? ` ${unit}` : '';
      if (language === 'hi') {
        const base = `${sensorName} का मान ${value}${unitDisplay} है।`;
        if (status === 'critical') return `${base} स्थिति गंभीर है, तुरंत कार्रवाई करें।`;
        if (status === 'warning') return `${base} ध्यान देने की आवश्यकता है।`;
        return `${base} मान सामान्य सीमा में है।`;
      }
      const base = `${sensorName} reading is ${value}${unitDisplay}.`;
      if (status === 'critical') return `${base} This is critical and requires immediate action.`;
      if (status === 'warning') return `${base} This needs attention soon.`;
      return `${base} Value is within normal range.`;
    }
  }
}

// Types for bulk testing (keeping for backwards compatibility)
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