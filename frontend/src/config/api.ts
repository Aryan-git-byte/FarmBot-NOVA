/**
 * Backend API Configuration
 * Handles all communication with the FarmBot Nova Backend
 */

// Backend API URL - configurable via environment variable
export const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

// API Key for backend authentication
export const BACKEND_API_KEY = import.meta.env.VITE_BACKEND_API_KEY;

if (!BACKEND_API_KEY) {
  console.warn('VITE_BACKEND_API_KEY is not set. Backend API calls may fail.');
}

/**
 * API Client for making requests to the backend
 */
export class ApiClient {
  private static baseUrl = BACKEND_API_URL;
  private static apiKey = BACKEND_API_KEY;

  /**
   * Make a GET request to the backend
   */
  static async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData.detail || errorData.error || errorData.message || JSON.stringify(errorData) || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Make a POST request to the backend with JSON body
   */
  static async post<T>(endpoint: string, data: Record<string, any>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData.detail || errorData.error || errorData.message || JSON.stringify(errorData) || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Make a POST request to the backend with FormData (for file uploads)
   */
  static async postForm<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey || '',
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData.detail || errorData.error || errorData.message || JSON.stringify(errorData) || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Make a DELETE request to the backend
   */
  static async delete<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'X-API-Key': this.apiKey || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData.detail || errorData.error || errorData.message || JSON.stringify(errorData) || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Check if the backend is reachable
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

// Response types for backend API

export interface BackendAiResponse {
  answer: string;
  context_used: {
    coordinates: { lat: number; lon: number };
    location_context: Record<string, any>;
    language_detected: string;
    sensor_data?: Record<string, any>;
    sensor_available: boolean;
    ml_crop_predictions?: Record<string, any>;
    knowledge_retrieval?: Record<string, any>;
    retrieved_knowledge?: string;
  };
  conversation_id: string;
  message_count: number;
  had_image: boolean;
  rag_info: {
    success: boolean;
    rag_chunks_count?: number;
    web_results_count?: number;
    used_web_search?: boolean;
    search_decision?: string;
    rag_sources?: Array<{
      source: string;
      crop: string;
      region: string;
      similarity: number;
      text_preview: string;
    }>;
    web_sources?: Array<{
      title: string;
      url: string;
      content_preview: string;
    }>;
    error?: string;
  };
  ml_prediction_used: boolean;
  detected_language: string;
  timing_analysis: {
    get_coordinates_ms?: number;
    location_context_build_ms?: number;
    soil_analysis_ms?: number;
    sensor_data_fetch_ms?: number;
    ml_prediction_ms?: number;
    history_retrieval_ms?: number;
    rag_search_ms?: number;
    image_processing_ms?: number;
    prompt_building_ms?: number;
    llm_inference_ms?: number;
    ttft_ms?: number;
    db_save_ms?: number;
    total_processing_ms?: number;
  };
}

export interface BackendConversation {
  conversation_id: string;  // Backend uses conversation_id, not id
  last_message: string;     // Timestamp of last message
  title?: string;           // Optional - may not be present
}

export interface BackendMessage {
  id?: string;
  auth_id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;  // Backend uses timestamp, not created_at
}

export interface BackendConversationsResponse {
  auth_id: string;
  conversations: BackendConversation[];
  total: number;
}

export interface BackendConversationHistoryResponse {
  conversation_id: string;
  messages: BackendMessage[];
  total: number;
}
