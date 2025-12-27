import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, MessageSquare, Menu, Plus, Trash2, Edit3, Search, X, Mic, MicOff, Volume2, VolumeX, ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AiService } from '../../services/aiService';
import { AuthService } from '../../services/authService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  confidence?: number;
  responseTime?: number;
  intelligence_level?: 'instant' | 'smart' | 'advanced';
  sources?: string[];
  eventBreakdown?: Array<{ label: string; ms: number; source: string }>;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatbotPageProps {
  onNavigateBack?: () => void;
}

const ChatbotPage: React.FC<ChatbotPageProps> = ({ onNavigateBack }) => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseStartTime, setResponseStartTime] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [userConversations, setUserConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  // TTS & STT States
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // Expanded event breakdown for AI message
  const [expandedEventIdx, setExpandedEventIdx] = useState<string | null>(null);

  // Get Deepgram API key from environment
  const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY || '';


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  // Initialize user and load all conversations
  useEffect(() => {
    const initializeUser = async () => {
      try {
  await AuthService.getCurrentUser(); // user fetch for side effects only
  // Removed setCurrentUserId (no longer needed)

        // Load all conversations regardless of authentication
        const conversations = await AiService.getUserConversations();
        setUserConversations(conversations.map(conv => ({
          id: conv.id,
          title: conv.title,
          lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
          timestamp: conv.updatedAt,
          messageCount: conv.messages.length
        })));
      } catch (error) {
        console.error('Error initializing user:', error);
  // Removed setCurrentUserId (no longer needed)
      }
    };

    initializeUser();
  }, []);

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        text: language === 'hi' 
          ? '🌾 नमस्ते! मैं आपका उन्नत AI खेती सहायक हूं। मैं आपके सेंसर डेटा, मौसम की जानकारी, और मिट्टी के विश्लेषण का उपयोग करके 5 सेकंड में व्यक्तिगत सलाह देता हूं। आप मुझसे अपनी फसल, सिंचाई, पोषण या किसी भी खेती संबंधी सवाल पूछ सकते हैं।'
          : '🌾 Hello! I\'m your advanced AI farming assistant. I provide personalized advice within 5 seconds using your sensor data, weather information, and soil analysis. Ask me about your crops, irrigation, nutrition, or any farming questions.',
        sender: 'ai',
        timestamp: new Date(),
        intelligence_level: 'advanced'
      };
      setMessages([welcomeMessage]);
    }
  }, [language, messages.length]);

  // Speech-to-Text using Deepgram
  const startRecording = async () => {
    if (!DEEPGRAM_API_KEY) {
      alert('Deepgram API key not configured. Please add REACT_APP_DEEPGRAM_API_KEY to your .env file');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=' + (language === 'hi' ? 'hi' : 'en'), {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/webm'
        },
        body: audioBlob
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || '';
      if (transcript) {
        setInputText(transcript);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Transcription failed. Please check your API key and try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Text-to-Speech using Chrome's built-in speechSynthesis
  const speakWithChromeTTS = (text: string) => {
    // Stop any currently playing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(true);

    // Remove ** markdown formatting and emojis before speaking
    const cleanText = text
      .replace(/\*\*/g, '') // Remove ** markdown
      .replace(/\*/g, '') // Remove single * as well
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis only
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set language based on current language setting
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    
    // Optional: Configure voice parameters
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    const queryText = inputText;
    setInputText('');
    setIsLoading(true);
    setResponseStartTime(Date.now());
    // Create a placeholder AI message that will be updated as chunks arrive
    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: Message = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      intelligence_level: 'advanced'
    };
    setMessages(prev => [...prev, initialAiMessage]);
    setIsStreaming(true);
    try {
      // Use AiService with streaming
      let streamedText = '';
      const aiResponse = await AiService.processQueryStream(
        queryText,
        (chunk) => {
          streamedText += chunk;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, text: streamedText }
                : msg
            )
          );
        },
        currentConversationId || undefined,
        undefined,
        language
      );
      setIsStreaming(false);
      // Update the conversation ID if this is a new conversation
      if (!currentConversationId && aiResponse.conversationId) {
        setCurrentConversationId(aiResponse.conversationId);
      }
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: aiResponse.advice,
                confidence: aiResponse.confidence,
                responseTime: aiResponse.responseTime,
                intelligence_level: 'advanced',
                sources: aiResponse.sources,
                eventBreakdown: aiResponse.eventBreakdown
              }
            : msg
        )
      );
      // Auto-speak AI response if enabled
      if (autoSpeak) {
        speakWithChromeTTS(aiResponse.advice);
      }
      // Refresh conversation list to show new/updated conversation
      try {
        const conversations = await AiService.getUserConversations();
        setUserConversations(conversations.map(conv => ({
          id: conv.id,
          title: conv.title,
          lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
          timestamp: conv.updatedAt,
          messageCount: conv.messages.length
        })));
      } catch (error) {
        console.error('Error refreshing conversation list:', error);
      }
    } catch (error) {
      setIsStreaming(false);
      const responseTime = responseStartTime ? Date.now() - responseStartTime : 0;
      const errorMessage: Message = {
        id: aiMessageId,
        text: language === 'hi'
          ? `⚠️ माफ करें, ${responseTime > 25000 ? 'जवाब देने में बहुत समय लग गया (25 सेकंड से अधिक)' : 'तकनीकी समस्या हो रही है'}। कृपया फिर कोशिश करें।`
          : `⚠️ Sorry, ${responseTime > 25000 ? 'response took too long (over 25 seconds)' : 'technical issue occurred'}. Please try again.`,
        sender: 'ai',
        timestamp: new Date(),
        confidence: 0.1,
        responseTime,
        intelligence_level: 'instant'
      };
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId ? errorMessage : msg
        )
      );
    } finally {
      setIsLoading(false);
      setResponseStartTime(null);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInputText('');
    setShowSidebar(false);
    // Re-initialize welcome message
    const welcomeMessage: Message = {
      id: '1',
      text: language === 'hi' 
        ? '🌾 नमस्ते! मैं आपका उन्नत AI खेती सहायक हूं। आप मुझसे अपनी फसल, सिंचाई, पोषण या किसी भी खेती संबंधी सवाल पूछ सकते हैं।'
        : '🌾 Hello! I\'m your advanced AI farming assistant. Ask me about your crops, irrigation, nutrition, or any farming questions.',
      sender: 'ai',
      timestamp: new Date(),
      intelligence_level: 'advanced'
    };
    setMessages([welcomeMessage]);
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      setCurrentConversationId(conversationId);
      const history = await AiService.getConversationHistory(conversationId);
      const formattedMessages: Message[] = history.map(msg => ({
        id: msg.id || Date.now().toString(),
        text: msg.content,
        sender: msg.role === 'user' ? 'user' : 'ai',
        timestamp: new Date(msg.timestamp),
        confidence: (msg.metadata as any)?.confidence,
        responseTime: (msg.metadata as any)?.responseTime,
        intelligence_level: (msg.metadata as any)?.intelligence_level,
        sources: (msg.metadata as any)?.sources
      }));
      setMessages(formattedMessages);
      setShowSidebar(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm(language === 'hi' ? 'क्या आप इस बातचीत को हटाना चाहते हैं?' : 'Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await AiService.deleteConversation(conversationId);
      setUserConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleEditTitle = async (conversationId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      await AiService.updateConversationTitle(conversationId, newTitle);
      setUserConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, title: newTitle } : conv
      ));
      setEditingConversationId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = userConversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIntelligenceIcon = (level?: string) => {
    switch (level) {
      case 'instant': return '⚡';
      case 'smart': return '🧠';
      case 'advanced': return '🚀';
      default: return '🤖';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatMessageText = (text?: string) => {
    if (!text) return null;

    const parts = text.split(/(\*\*[\s\S]*?\*\*)/g);

    return parts.map((part, idx) => {
      const boldMatch = part.match(/^\*\*([\s\S]*?)\*\*$/);
      if (boldMatch) {
        return (
          <strong key={idx} className="font-semibold">
            {boldMatch[1]}
          </strong>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        w-[85vw] max-w-[320px] lg:w-80
        transition-transform duration-300 ease-in-out
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
        lg:translate-x-0 shadow-2xl lg:shadow-none
      `}>
        {/* Sidebar Header - Fixed Height */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === 'hi' ? 'बातचीत' : 'Conversations'}
            </h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all touch-manipulation"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 px-4 rounded-xl font-medium hover:from-green-700 hover:to-green-600 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 touch-manipulation"
            aria-label={language === 'hi' ? 'नई बातचीत' : 'New Chat'}
          >
            <Plus className="h-5 w-5" />
            <span>{language === 'hi' ? 'नई बातचीत' : 'New Chat'}</span>
          </button>
        </div>

        {/* Voice Settings - Fixed Height */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {language === 'hi' ? 'वॉइस सेटिंग्स' : 'Voice Settings'}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {DEEPGRAM_API_KEY ? '✓ Voice Enabled' : '✗ API Key Missing'}
              </span>
            </div>
            <label className="flex items-center gap-3 cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors touch-manipulation">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {language === 'hi' ? 'ऑटो-स्पीक' : 'Auto-speak responses'}
              </span>
            </label>
          </div>
        </div>

        {/* Search - Fixed Height */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'बातचीत खोजें...' : 'Search conversations...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm transition-all touch-manipulation"
              aria-label={language === 'hi' ? 'बातचीत खोजें' : 'Search conversations'}
            />
          </div>
        </div>

        {/* Conversations List - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          <div className="space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  {searchTerm ? 
                    (language === 'hi' ? 'कोई बातचीत नहीं मिली' : 'No conversations found') :
                    (language === 'hi' ? 'अभी तक कोई बातचीत नहीं' : 'No conversations yet')
                  }
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group p-3 rounded-lg cursor-pointer transition-all active:scale-[0.98] touch-manipulation ${
                    currentConversationId === conversation.id
                      ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 shadow-sm'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {editingConversationId === conversation.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleEditTitle(conversation.id, editingTitle)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditTitle(conversation.id, editingTitle);
                            }
                            if (e.key === 'Escape') {
                              setEditingConversationId(null);
                              setEditingTitle('');
                            }
                          }}
                          className="w-full bg-transparent border-none outline-none font-medium text-gray-900 dark:text-white p-0 focus:ring-0"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                          {conversation.title}
                        </h3>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1.5 leading-snug">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400 font-medium">
                          {conversation.timestamp.toLocaleDateString()}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-400 font-medium">
                          {conversation.messageCount} {language === 'hi' ? 'संदेश' : 'msgs'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 lg:transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConversationId(conversation.id);
                          setEditingTitle(conversation.title);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all touch-manipulation"
                        aria-label="Edit conversation"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all touch-manipulation"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Chat Header - Fixed Height */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Back/Home Button */}
              {onNavigateBack && (
                <button
                  onClick={onNavigateBack}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all touch-manipulation flex-shrink-0"
                  aria-label={language === 'hi' ? 'वापस जाएं' : 'Go back'}
                  title={language === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Back to Dashboard'}
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              )}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all touch-manipulation flex-shrink-0"
                aria-label={showSidebar ? 'Close sidebar' : 'Open sidebar'}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full p-2 flex-shrink-0">
                  <Bot className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {language === 'hi' ? 'AI खेती सहायक' : 'AI Farm Assistant'}
                  </h1>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {language === 'hi' ? 'ऑनलाइन • <5 सेकंड' : 'Online • <5 seconds'}
                    </p>
                    {DEEPGRAM_API_KEY && <span className="text-sm">🎤</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline font-medium">
                {language === 'hi' ? 'लाइव' : 'Live'}
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Messages - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 lg:px-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`flex items-start gap-2 max-w-[90%] sm:max-w-[85%] ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                      : 'bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-wrap leading-relaxed text-sm break-words flex-1">
                        {typeof message.text === 'string'
                          ? formatMessageText(message.text)
                          : message.text && typeof message.text === 'object'
                            ? <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(message.text, null, 2)}</pre>
                            : null}
                        {/* Show blinking cursor if this message is being streamed */}
                        {message.sender === 'ai' && isStreaming && message.text === messages[messages.length - 1]?.text && (
                          <span className="inline-block w-0.5 h-4 bg-green-500 ml-1 animate-pulse"></span>
                        )}
                        {/* Show loading dots if message is empty and streaming hasn't started */}
                        {message.sender === 'ai' && !message.text && isLoading && (
                          <span className="text-gray-400 animate-pulse">●●●</span>
                        )}
                      </p>
                      {message.sender === 'ai' && message.text && (
                        <button
                          onClick={() => speakWithChromeTTS(message.text)}
                          disabled={isSpeaking}
                          className="flex-shrink-0 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
                          title={language === 'hi' ? 'बोलें' : 'Speak'}
                          aria-label={language === 'hi' ? 'बोलें' : 'Speak'}
                        >
                          <Volume2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      )}
                    </div>
                    {message.sender === 'ai' && (message.responseTime || message.confidence || message.sources) && (
                      <div className="flex flex-wrap items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs gap-2">
                        <div className="flex items-center flex-wrap gap-2 opacity-70">
                          {/* Response time and event breakdown */}
                          {message.responseTime && (
                            <span
                              className="whitespace-nowrap font-medium cursor-pointer select-none"
                              onClick={() => setExpandedEventIdx(expandedEventIdx === message.id ? null : message.id)}
                              title="Show event breakdown"
                            >
                              ⏱️ {(message.responseTime / 1000).toFixed(1)}s
                            </span>
                          )}
                          {/* Expandable event breakdown below time */}
                          {message.responseTime && message.eventBreakdown && expandedEventIdx === message.id && (
                            <div className="w-full mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-xs shadow border border-gray-200 dark:border-gray-700">
                              <div className="font-semibold text-green-600 mb-1">Event Breakdown</div>
                              <ul className="space-y-1">
                                {message.eventBreakdown.map((ev, idx) => (
                                  <li key={idx} className="flex justify-between">
                                    <span>{ev.label}</span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{ev.ms} ms</span>
                                    <span className="ml-2 text-blue-600 dark:text-blue-400">{ev.source}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Confidence percentage removed for cleaner UI */}
                          {message.intelligence_level && (
                            <span title={message.intelligence_level} className="whitespace-nowrap text-base">
                              {getIntelligenceIcon(message.intelligence_level)}
                            </span>
                          )}
                        </div>
                        {message.sources && message.sources.length > 0 && (
                          <div className="flex items-center gap-1 opacity-70">
                            {message.sources.includes('live_sensor_data') && <span title="Live Sensor Data" className="text-base">📊</span>}
                            {message.sources.includes('live_weather_data') && <span title="Live Weather Data" className="text-base">🌤️</span>}
                            {message.sources.includes('gemini_ai') && <span title="Gemini AI" className="text-base">🚀</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex items-start gap-2">
                  <div className="bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full p-2 flex-shrink-0">
                    <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Loader className="h-4 w-4 animate-spin text-green-500" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                        {language === 'hi' ? 'विश्लेषण...' : 'Analyzing...'}
                        {responseStartTime && (
                          <span className="ml-2 font-mono text-xs">
                            {Math.round((Date.now() - responseStartTime) / 1000)}s
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed Height */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 lg:p-4 shadow-lg">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2">
              {/* Voice Input Button */}
              {DEEPGRAM_API_KEY && (
                <div className="relative flex items-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading || isTranscribing}
                    className={`flex-shrink-0 p-3 rounded-xl transition-all active:scale-95 touch-manipulation ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50'
                        : isTranscribing
                          ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'animate-pulse' : ''}`}
                    title={
                      isRecording
                        ? (language === 'hi' ? 'रुकें' : 'Stop')
                        : isTranscribing
                          ? (language === 'hi' ? 'लिप्यंतरण...' : 'Transcribing...')
                          : (language === 'hi' ? 'बोलें' : 'Voice')
                    }
                    aria-label={
                      isRecording
                        ? (language === 'hi' ? 'रुकें' : 'Stop recording')
                        : isTranscribing
                          ? (language === 'hi' ? 'लिप्यंतरण...' : 'Transcribing...')
                          : (language === 'hi' ? 'बोलें' : 'Start voice input')
                    }
                  >
                    {isRecording ? (
                      <MicOff className="h-5 w-5" />
                    ) : isTranscribing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                  {isRecording && (
                    <div className="absolute left-full ml-3 flex items-center gap-1 select-none">
                      <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse" aria-hidden="true"></span>
                      <span className="text-xs text-red-600 dark:text-red-400 font-semibold" role="status">
                        {language === 'hi' ? 'सुन रहा है...' : 'Listening...'}
                      </span>
                    </div>
                  )}
                  {isTranscribing && !isRecording && (
                    <div className="absolute left-full ml-3 flex items-center gap-1 select-none">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" aria-hidden="true" />
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold" role="status">
                        {language === 'hi' ? 'लिप्यंतरण...' : 'Transcribing...'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={language === 'hi' ? 'अपना सवाल यहाँ लिखें...' : 'Type your question here...'}
                  className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 transition-all touch-manipulation"
                  rows={1}
                  disabled={isLoading || isRecording}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  aria-label={language === 'hi' ? 'संदेश टाइप करें' : 'Type message'}
                />
              </div>

              {/* Stop Speaking Button */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="flex-shrink-0 p-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all active:scale-95 shadow-lg shadow-orange-500/50 touch-manipulation"
                  title={language === 'hi' ? 'बंद करें' : 'Stop'}
                  aria-label={language === 'hi' ? 'बोलना बंद करें' : 'Stop speaking'}
                >
                  <VolumeX className="h-5 w-5" />
                </button>
              )}

              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading || isRecording}
                className="flex-shrink-0 bg-gradient-to-r from-green-600 to-blue-600 text-white p-3 rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-green-500/30 touch-manipulation"
                aria-label={language === 'hi' ? 'भेजें' : 'Send'}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="font-medium">{language === 'hi' ? 'AI 5 सेकंड में जवाब' : 'AI responds in 5s'}</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <span>📊</span>
                  <span className="font-medium">{language === 'hi' ? 'लाइव डेटा' : 'Live data'}</span>
                </span>
                {DEEPGRAM_API_KEY && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <span>🎤</span>
                      <span className="font-medium">{language === 'hi' ? 'वॉइस' : 'Voice'}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;