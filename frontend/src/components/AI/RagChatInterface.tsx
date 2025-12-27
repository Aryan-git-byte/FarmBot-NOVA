/**
 * RAG-based AI Question Answering Interface
 * Real-time agricultural intelligence component
 * Author: Aryan Kumar
 */

import React, { useState, useEffect, useRef } from 'react';
import { RagResponse } from '../../services/ragService';
import { AiService } from '../../services/aiService';
import { Loader2, Send, MapPin, Sparkles, Database, Cloud, Sprout, CheckCircle2, ArrowLeft } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: RagResponse;
}

interface LocationState {
  latitude: number;
  longitude: number;
  name?: string;
  loading: boolean;
  error?: string;
}

interface RagChatInterfaceProps {
  onNavigateBack?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RagChatInterface: React.FC<RagChatInterfaceProps> = ({ onNavigateBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<LocationState>({
    latitude: 0,
    longitude: 0,
    loading: true
  });
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // LOCATION HANDLING
  // ============================================================================

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Try to get location name
          try {
            const response = await fetch(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`
            );
            const data = await response.json();
            const locationName = data[0] ? `${data[0].name}, ${data[0].country}` : 'Unknown';

            setLocation({
              latitude: lat,
              longitude: lon,
              name: locationName,
              loading: false
            });
          } catch {
            setLocation({
              latitude: lat,
              longitude: lon,
              name: 'Your Location',
              loading: false
            });
          }
        },
        () => {
          setLocation({
            latitude: 0,
            longitude: 0,
            loading: false,
            error: 'Location access denied. Using default location.'
          });
        }
      );
    } else {
      setLocation({
        latitude: 0,
        longitude: 0,
        loading: false,
        error: 'Geolocation not supported.'
      });
    }
  };

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingSteps]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setThinkingSteps([]);

    try {
      // Check cache first
  const cached = await AiService.getCachedResponse(userMessage.content);
      
      if (cached) {
        setThinkingSteps(['Found cached answer...']);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: cached.answer,
          timestamp: new Date(),
          response: cached
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        setThinkingSteps([]);
        return;
      }

      // Get real-time answer
      const locationData = location.latitude && location.longitude
        ? { latitude: location.latitude, longitude: location.longitude, name: location.name }
        : undefined;

      // Show thinking process
      const thinkingInterval = setInterval(() => {
        setThinkingSteps(prev => {
          if (prev.length < 4) {
            const steps = [
              'Analyzing your question...',
              'Fetching real-time data...',
              'Processing agricultural insights...',
              'Generating answer...'
            ];
            return steps.slice(0, prev.length + 1);
          }
          return prev;
        });
      }, 800);

  // Route query through AiService for enrichment, then to QueryAnalyzer and RAG pipeline
  const response: RagResponse = await AiService.enrichAndRouteQuery(userMessage.content, locationData);

      clearInterval(thinkingInterval);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        response: response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please check your API keys and try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setThinkingSteps([]);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ============================================================================
  // QUICK QUESTION BUTTONS
  // ============================================================================

  const quickQuestions = [
    "What crops can I grow in my area?",
    "What's the soil pH in my location?",
    "Should I irrigate today?",
    "Best crops for acidic soil?",
    "How much rainfall do I need for rice?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Back Button */}
              {onNavigateBack && (
                <button
                  onClick={onNavigateBack}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
                  aria-label="Go back"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles className="text-green-600" />
                  Farm AI Assistant
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time agricultural intelligence • Powered by RAG
                </p>
              </div>
            </div>
            {!location.loading && location.latitude !== 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium">{location.name || 'Your Location'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Message */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <Sparkles className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome to Smart Farm AI
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Ask any question about farming, soil health, crop recommendations, or weather conditions. 
                I'll fetch real-time data and provide accurate, actionable advice.
              </p>

              {/* Quick Questions */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:border-green-300 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <Database className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Real-Time Soil Data</h3>
                  <p className="text-sm text-gray-600">Live soil properties from SoilGrids API</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <Cloud className="w-8 h-8 text-sky-600 mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Weather Intelligence</h3>
                  <p className="text-sm text-gray-600">Current weather from OpenWeather</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <Sprout className="w-8 h-8 text-green-600 mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">Crop Recommendations</h3>
                  <p className="text-sm text-gray-600">Expert crop data from FAO/Wikidata</p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Thinking Animation */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-200 max-w-md">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                  <span className="font-medium text-gray-700">Processing...</span>
                </div>
                <div className="space-y-2">
                  {thinkingSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about crops, soil, weather, or farming practices..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-2xl px-6 py-4 max-w-3xl ${
          isUser
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-800 shadow-sm border border-gray-200'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* Response Metadata */}
        {!isUser && message.response && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            {/* Data Sources */}
            {message.response.sources.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Database className="w-4 h-4" />
                <span className="font-medium">Data from:</span>
                <div className="flex gap-2">
                  {message.response.sources.map((source, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Data Used Indicators */}
            <div className="flex gap-3 text-xs">
              {message.response.data_used.soil && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Soil Data
                </div>
              )}
              {message.response.data_used.weather && (
                <div className="flex items-center gap-1 text-blue-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Weather Data
                </div>
              )}
              {message.response.data_used.crops && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Crop Data
                </div>
              )}
            </div>

            {/* Response Time */}
            <div className="text-xs text-gray-500">
              Response time: {message.response.response_time_ms}ms
              {message.response.confidence > 0 && (
                <span className="ml-3">
                  Confidence: {(message.response.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-2 ${isUser ? 'text-green-100' : 'text-gray-500'}`}>
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default RagChatInterface;
