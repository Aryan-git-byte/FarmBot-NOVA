# 🌾 Comprehensive Farm Monitoring Application

![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-Closed%20Source-red)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Android-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)
![Capacitor](https://img.shields.io/badge/Capacitor-7.4.2-119EFF?logo=capacitor)

> **FarmBot AI** - An AI-powered agricultural monitoring system with intelligent farming advice, real-time sensor data, and comprehensive weather integration designed specifically for Indian farmers.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [API Integrations](#-api-integrations)
- [Routing & Navigation](#-routing--navigation)
- [Component Breakdown](#-component-breakdown)
- [Services Layer](#-services-layer)
- [Setup & Installation](#-setup--installation)
- [Environment Configuration](#-environment-configuration)
- [Development](#-development)
- [Build & Deployment](#-build--deployment)
- [Progressive Web App (PWA)](#-progressive-web-app-pwa)
- [Author](#-author)

---

## 🎯 Overview

The **Comprehensive Farm Monitoring Application** is an advanced agricultural intelligence platform that combines real-time sensor monitoring, weather forecasting, AI-powered farming advice, and educational resources. Built with modern web technologies and deployable as both a Progressive Web App (PWA) and native Android application via Capacitor.

### Target Audience
- **Primary**: Indian farmers (Hinglish/Hindi/Bhojpuri support)
- **Secondary**: Agricultural consultants and farming communities
- **Internal**: Development and operations teams

---

## ✨ Key Features

### 🤖 **AI-Powered Assistance**
- **RAG-Based Intelligence**: Real-time agricultural question answering using Retrieval-Augmented Generation
- **Multi-Language Support**: Hindi, Bhojpuri, and Hinglish for local accessibility
- **Context-Aware Responses**: Leverages farm location, sensor data, weather, and soil conditions
- **Conversational Memory**: Maintains conversation context across sessions
- **Voice Output**: Text-to-Speech (TTS) for audio responses
- **Two AI Modes**:
  - **Smart AI (RAG)**: Advanced retrieval-augmented generation with real-time data integration
  - **Traditional Chatbot**: Conversational AI for general farming queries

### 📊 **Real-Time Sensor Monitoring**
- **Multi-Parameter Tracking**:
  - Soil Temperature
  - Soil Moisture
  - Soil pH Level
  - Nitrogen (N) Content
  - Phosphorus (P) Content
  - Potassium (K) Content
- **Status Indicators**: Optimal, Warning, Critical alerts with visual feedback
- **Trend Analysis**: Historical sparkline charts for trend visualization
- **Auto-Refresh**: Real-time updates with manual refresh capability
- **Offline Mode**: Graceful degradation when network is unavailable

### 🌦️ **Weather Intelligence**
- **Current Weather**: Real-time temperature, humidity, rainfall, wind speed
- **7-Day Forecast**: Extended weather predictions
- **Weather Alerts**: Farming advice based on weather conditions
- **Historical Data**: Weather pattern analysis
- **Multi-Location Support**: Multiple farm locations tracking

### 🌱 **Agricultural Data Integration**
- **Soil Analysis**: SoilGrids API integration for detailed soil composition
- **Crop Recommendations**: AI-driven crop suggestions based on local conditions
- **NPK Analysis**: Nutrient level tracking and recommendations
- **Seasonal Planning**: Agricultural calendar integration

### 📚 **Educational Resources**
- Curated educational videos for farmers
- Best practices and farming techniques
- Localized content in multiple Indian languages

### ⚙️ **User Configuration**
- **Theme Support**: Light/Dark mode
- **Mock Data Toggle**: Development and demo mode
- **Language Preferences**: Multi-language interface
- **Offline Capability**: Service Worker for offline functionality

---

## 🛠️ Technology Stack

### **Frontend Framework**
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI component framework |
| **TypeScript** | 5.5.3 | Type-safe development |
| **Vite** | 7.2.4 | Build tool and dev server |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework |

### **Mobile & PWA**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Capacitor** | 7.4.2 | Native mobile wrapper (Android) |
| **Vite PWA Plugin** | 1.1.0 | Progressive Web App capabilities |
| **Workbox** | 7.3.0 | Service Worker management |

### **UI & Visualization**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Lucide React** | 0.344.0 | Icon library |
| **Chart.js** | 4.5.0 | Data visualization (charts) |
| **Recharts** | 3.4.1 | React charting library |
| **date-fns** | 4.1.0 | Date manipulation |

### **Backend & APIs**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.54.0 | Backend-as-a-Service (Database, Auth, Real-time) |
| **Groq SDK** | 0.30.0 | LLM integration for AI responses |

### **Development Tools**
| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.9.1 | Code linting |
| **PostCSS** | 8.4.35 | CSS processing |
| **Autoprefixer** | 10.4.18 | CSS vendor prefixing |

---

## 🏗️ Architecture

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │ AI Chat  │  │ Settings │  │  Videos  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     Services Layer (TypeScript)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  AI Service  │  │RAG Service   │  │Weather Service│     │
│  │  (Groq AI)   │  │(Query Analyzer)│ │(OpenWeather) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Sensor Service│  │External APIs │  │Video Service │     │
│  │  (Supabase)  │  │  (SoilGrids) │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     External APIs & Data Sources             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Groq AI    │  │ OpenWeather  │  │  SoilGrids   │     │
│  │  (Llama 3.3) │  │     API      │  │  (ISRIC)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Supabase    │  │   Wikidata   │  │ YouTube API  │     │
│  │  (PostgreSQL)│  │    SPARQL    │  │ (Optional)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### **RAG Pipeline Architecture**

```
User Query
    ↓
┌─────────────────────────────────────────────┐
│ Query Analyzer (AI-powered classification)  │
│ - Determines query type                     │
│ - Extracts entities (crop, season, etc.)   │
│ - Identifies required data sources          │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ Data Retriever (Parallel fetching)          │
│ ├─ SoilGrids API (soil properties)         │
│ ├─ OpenWeather API (weather data)          │
│ ├─ Wikidata SPARQL (crop information)      │
│ └─ Sensor Service (real-time readings)     │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ Context Merger                              │
│ - Combines all fetched data                │
│ - Builds comprehensive context              │
│ - Includes location & user history          │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ RAG Responder (Groq AI)                    │
│ Model: llama-3.3-70b-versatile             │
│ - Generates contextual response             │
│ - Provides actionable recommendations       │
│ - Cites data sources                        │
└─────────────────────────────────────────────┘
    ↓
Formatted Response + TTS Output
```

---

## 📁 Project Structure

```
Comprehensive-Farm-Monitoring-Application-main/
│
├── 📂 public/                      # Static assets
│   └── icons/                      # PWA icons (72x72 to 512x512)
│
├── 📂 src/
│   ├── 📂 components/              # React components
│   │   ├── AI/                     # AI-related components
│   │   │   ├── ChatbotPage.tsx     # Traditional AI chatbot interface
│   │   │   └── RagChatInterface.tsx # RAG-based AI chat
│   │   │
│   │   ├── Common/                 # Reusable UI components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── StatusIndicator.tsx
│   │   │   ├── ThinkingOverlay.tsx # AI processing animation
│   │   │   └── InstallPrompt.tsx   # PWA install prompt
│   │   │
│   │   ├── Dashboard/              # Main dashboard
│   │   │   ├── IntegratedDashboard.tsx  # Primary sensor dashboard
│   │   │   └── WeatherDashboard.tsx     # Weather display
│   │   │
│   │   ├── Educational/
│   │   │   └── EducationalVideos.tsx    # Video library
│   │   │
│   │   ├── Help/
│   │   │   └── SimpleHelp.tsx           # Help documentation
│   │   │
│   │   ├── LanguageSelector/
│   │   │   └── LanguageSelectionModal.tsx
│   │   │
│   │   ├── Layout/
│   │   │   └── SimpleNavigation.tsx     # Bottom navigation
│   │   │
│   │   ├── Settings/                    # Settings panels
│   │   │   ├── MobileOptimizedSettings.tsx
│   │   │   ├── EnhancedSettings.tsx
│   │   │   ├── MockDataSettings.tsx
│   │   │   └── SimpleSettings.tsx
│   │   │
│   │   └── Testing/
│   │       └── TestAIPage.tsx           # AI testing interface
│   │
│   ├── 📂 config/                  # Configuration
│   │   ├── supabase.ts             # Supabase client & types
│   │   └── languages.ts            # Language definitions
│   │
│   ├── 📂 contexts/                # React Context providers
│   │   ├── ThemeContext.tsx        # Dark/Light theme
│   │   └── LanguageContext.tsx     # i18n context
│   │
│   ├── 📂 hooks/                   # Custom React hooks
│   │   ├── useTTS.ts               # Text-to-speech hook
│   │   └── useUserPreferences.ts   # User settings persistence
│   │
│   ├── 📂 services/                # Business logic & API clients
│   │   ├── aiService.ts            # AI orchestration (81KB - largest)
│   │   ├── ragService.ts           # RAG pipeline implementation
│   │   ├── sensorService.ts        # Sensor data management
│   │   ├── weatherService.ts       # Weather API integration
│   │   ├── externalApiService.ts   # SoilGrids, Wikidata, etc.
│   │   ├── authService.ts          # Supabase authentication
│   │   ├── locationService.ts      # Geolocation handling
│   │   ├── manualEntryService.ts   # Manual data entry
│   │   └── videoService.ts         # Educational video management
│   │
│   ├── 📂 utils/
│   │   └── dateUtils.ts            # Date formatting utilities
│   │
│   ├── App.tsx                     # Main application component
│   ├── main.tsx                    # Application entry point
│   ├── index.css                   # Global styles
│   └── vite-env.d.ts               # TypeScript environment types
│
├── 📄 capacitor.config.ts          # Capacitor configuration
├── 📄 vite.config.ts               # Vite build configuration
├── 📄 tailwind.config.js           # Tailwind CSS configuration
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 package.json                 # Dependencies
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitignore                   # Git ignore rules
└── 📄 index.html                   # HTML entry point
```

---

## 🔌 API Integrations

### **1. Groq AI (Primary AI Engine)**
- **Model**: `llama-3.3-70b-versatile`
- **Purpose**: Generate intelligent farming advice, analyze queries, provide recommendations
- **Features**:
  - Automatic API key fallback (supports up to 3 keys)
  - Streaming responses for real-time output
  - Context-aware conversations
  - Multi-language support
- **Cost**: (Check Groq pricing)
- **Configuration**: `VITE_GROQ_API_KEY_1/2/3`

### **2. OpenWeather API**
- **Endpoint**: `https://api.openweathermap.org/data/2.5`
- **Purpose**: Real-time weather data and 7-day forecasts
- **Data Retrieved**:
  - Current weather conditions
  - Temperature, humidity, pressure
  - Wind speed and direction
  - Rainfall measurements
  - UV index
  - Weather forecasts
- **Free Tier**: 1000 calls/day
- **Caching**: 30-minute cache to optimize API usage
- **Configuration**: `VITE_OPENWEATHER_API_KEY`

### **3. SoilGrids API (ISRIC)**
- **Endpoint**: `https://rest.isric.org/soilgrids/v2.0`
- **Purpose**: Global soil property data
- **Data Retrieved**:
  - Soil pH levels
  - Organic carbon content
  - NPK (Nitrogen, Phosphorus, Potassium)
  - Soil texture (clay, sand, silt)
  - Bulk density
  - Cation Exchange Capacity (CEC)
- **Authentication**: None (public API)
- **Caching**: 24-hour cache for soil data
- **Depth Levels**: Supports multiple depths (0-5cm, 5-15cm, etc.)

### **4. Wikidata SPARQL**
- **Endpoint**: `https://query.wikidata.org/sparql`
- **Purpose**: Crop information and agricultural knowledge
- **Data Retrieved**:
  - Scientific crop names
  - Optimal pH ranges
  - Temperature requirements
  - Growing seasons
  - NPK requirements
- **Authentication**: None (public)
- **Fallback**: Local FAO crop database

### **5. Supabase (Backend Services)**
- **Services Used**:
  - **PostgreSQL Database**: Sensor data, AI logs, weather cache, manual entries
  - **Real-time Subscriptions**: Live sensor data updates
  - **Authentication**: User management (optional)
  - **Storage**: API response caching
- **Tables**:
  - `sensor_data`: Real-time sensor readings
  - `ai_logs`: AI query history
  - `api_data`: External API response cache
  - `manual_entries`: User-submitted farm data
  - `video_library`: Educational content metadata
- **Configuration**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### **6. YouTube API (Optional)**
- **Purpose**: Educational video content delivery
- **Implementation**: Direct video embedding or API-based retrieval

---

## 🧭 Routing & Navigation

### **Navigation System**
The application uses a **Tab-based navigation** system with state management via React hooks. Navigation is handled through the `SimpleNavigation` component.

### **Available Routes**

| Route/Tab | Component | Description | Guard |
|-----------|-----------|-------------|-------|
| **`/` (dashboard)** | `IntegratedDashboard` | Main sensor monitoring dashboard | None |
| **`manual-entry`** | `EducationalVideos` | Educational resources (videos) | None |
| **`ai-chatbot`** | `ChatbotPage` | Traditional AI chatbot interface | None |
| **`rag-ai`** | `RagChatInterface` | RAG-based Smart AI chat | None |
| **`settings`** | `MobileOptimizedSettings` | Application settings panel | None |
| **`help`** | `SimpleHelp` | Help and documentation | None |
| **`/test-ai`** | `TestAIPage` | AI testing interface (hidden route) | Dev only |

### **Navigation Flow**

```
┌─────────────────────────────────────────────────────┐
│          Bottom Navigation Bar (Tabs)               │
├─────────────────────────────────────────────────────┤
│  [Home] [Videos] [AI Chat] [Settings] [Help]       │
└─────────────────────────────────────────────────────┘
         ↓          ↓         ↓         ↓        ↓
   Dashboard    Videos   AI Modes   Settings   Help
                            ↓
                    ┌───────┴────────┐
                    │                │
             Traditional AI      Smart AI
              (Chatbot)           (RAG)
```

### **Navigation Implementation**
```typescript
// App.tsx - Tab-based routing
const [activeTab, setActiveTab] = useState('dashboard');

// Navigation component handles tab switching
<SimpleNavigation 
  activeTab={activeTab} 
  onTabChange={setActiveTab}
/>
```

**Note**: Unlike traditional React Router, this app uses state-based routing for simplicity and mobile optimization.

---

## 🧩 Component Breakdown

### **Core Components**

#### **1. IntegratedDashboard** (`components/Dashboard/IntegratedDashboard.tsx`)
**Purpose**: Main sensor monitoring interface  
**Features**:
- Real-time sensor data display (6 parameters)
- Status indicators (optimal/warning/critical)
- Sparkline trend charts
- Auto-refresh (30-second interval)
- Manual refresh button
- Offline mode handling
- Voice output for sensor insights
- AI-powered sensor analysis

**State Management**:
- Sensor readings array
- Historical data for trends
- Loading states
- Error handling
- Thinking overlay for AI processing

#### **2. RagChatInterface** (`components/AI/RagChatInterface.tsx`)
**Purpose**: RAG-based AI chat interface  
**Features**:
- Context-aware conversations
- Real-time data integration
- Multi-language support
- Voice output (TTS)
- Thinking animation during processing
- Source citation
- Conversation history
- Follow-up question suggestions

#### **3. ChatbotPage** (`components/AI/ChatbotPage.tsx`)
**Purpose**: Traditional conversational AI  
**Features**:
- General farming queries
- Conversation memory
- Multi-turn dialogue
- Language selection
- Voice responses

#### **4. WeatherDashboard** (`components/Dashboard/WeatherDashboard.tsx`)
**Purpose**: Weather information display  
**Features**:
- Current weather conditions
- 7-day forecast
- Weather-based farming advice
- Multi-location support
- Historical weather data

#### **5. ThinkingOverlay** (`components/Common/ThinkingOverlay.tsx`)
**Purpose**: AI processing visual feedback  
**Features**:
- Animated loading spinner
- Rotating status messages
- Transparent overlay
- Engaging user feedback during AI queries

#### **6. SimpleNavigation** (`components/Layout/SimpleNavigation.tsx`)
**Purpose**: Bottom navigation bar  
**Features**:
- Tab-based navigation
- Active tab highlighting
- Icon-based UI
- Mobile-optimized

---

## ⚙️ Services Layer

### **AI Services**

#### **aiService.ts** (81KB - Core Intelligence)
**Responsibilities**:
- AI query orchestration
- Conversation session management
- Context building from multiple data sources
- System prompt generation
- Multi-language prompt engineering
- Performance monitoring
- Response caching

**Key Methods**:
```typescript
// Main query processing with context
processQuery(query: string, conversationId?: string, userId?: string, language?: string): Promise<AiResponse>

// Streaming responses
processQueryStream(query: string, onChunk: (chunk: string) => void, ...): Promise<AiResponse>

// Conversation management
createNewConversation(language: string): Promise<ConversationSession>
getConversationSession(conversationId: string): Promise<ConversationSession>

// Data integration
getFarmData(): Promise<FarmData>
analyzeQueryWithContext(query: string, language: string, session: ConversationSession): QueryContext
```

#### **ragService.ts** (RAG Pipeline)
**Responsibilities**:
- Query analysis and classification
- External data retrieval
- Context merging
- AI response generation with citations

**Pipeline Components**:
```typescript
// 1. Query Analyzer
QueryAnalyzer.analyzeQuery(userQuery: string, location): Promise<QueryAnalysis>

// 2. Data Retriever
DataRetriever.fetchData(analysis: QueryAnalysis): Promise<Partial<MergedContext>>

// 3. Context Merger
ContextMerger.mergeContext(baseContext: MergedContext, externalData): MergedContext

// 4. RAG Responder
RagResponder.generateResponse(context: MergedContext, language: string): Promise<RagResponse>

// 5. Caching
RagService.getCachedResponse(query: string): Promise<RagResponse | null>
```

### **Data Services**

#### **sensorService.ts**
**Responsibilities**:
- CRUD operations for sensor data
- Real-time subscriptions
- Status derivation (optimal/warning/critical)
- Sample data generation
- Trend analysis

**Key Methods**:
```typescript
getSensorData(filters): Promise<ProcessedSensorReading[]>
getLatestReadings(): Promise<ProcessedSensorReading[]>
subscribeToSensorData(callback): void
addSensorReading(reading): Promise<SensorData>
generateSampleData(): SensorData[]
getStatusCounts(): Promise<{optimal, warning, critical}>
```

#### **weatherService.ts**
**Responsibilities**:
- OpenWeather API integration
- Weather data caching
- Forecast retrieval
- Historical weather analysis
- Weather-based advice generation

**Key Methods**:
```typescript
getCurrentWeather(lat: number, lon: number): Promise<WeatherData>
getWeatherForecast(lat: number, lon: number): Promise<WeatherForecast[]>
getCachedWeatherData(lat, lon, maxAgeMinutes): Promise<WeatherData | null>
generateWeatherAdvice(weather: WeatherData, language: string): string[]
```

#### **externalApiService.ts**
**Responsibilities**:
- SoilGrids API integration
- Wikidata SPARQL queries
- Crop information database
- API response caching

**Service Classes**:
```typescript
// SoilGrids integration
SoilGridsService.fetchSoilData(latitude, longitude, depth): Promise<SoilGridsData>

// Enhanced weather (alternative)
EnhancedOpenWeatherService.fetchWeatherData(lat, lon): Promise<OpenWeatherData>

// Crop information
CropInformationService.fetchCropInfo(cropName: string): Promise<CropInfo>
CropInformationService.searchCropsByConditions(ph, temp, rainfall): Promise<CropInfo[]>
```

#### **locationService.ts**
**Responsibilities**:
- Browser Geolocation API
- Location caching
- Reverse geocoding (via external APIs)
- Permission handling

---

## 🚀 Setup & Installation

### **Prerequisites**
- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Git**: Latest version
- **Android Studio**: (for Android builds)

### **Installation Steps**

```bash
# 1. Clone the repository
git clone <repository-url>
cd Comprehensive-Farm-Monitoring-Application-main

# 2. Install dependencies
npm install

# 3. Copy environment template
copy .env.example .env

# 4. Configure environment variables (see next section)
# Edit .env file with your API keys

# 5. Start development server
npm run dev
```

---

## 🔑 Environment Configuration

### **Required Environment Variables**

Create a `.env` file in the project root with the following variables:

```bash
# ============================================================================
# GROQ API KEYS (Required)
# ============================================================================
# Get from: https://console.groq.com/keys
# Model: llama-3.3-70b-versatile
# System supports up to 3 keys for automatic fallback

VITE_GROQ_API_KEY_1=gsk-your-key-here
VITE_GROQ_API_KEY_2=gsk-optional-fallback-key
VITE_GROQ_API_KEY_3=gsk-optional-fallback-key-2

# ============================================================================
# OPENWEATHER API KEY (Required)
# ============================================================================
# Get from: https://openweathermap.org/api
# Free tier: 1000 calls/day

VITE_OPENWEATHER_API_KEY=your-openweather-api-key-here

# ============================================================================
# SUPABASE CONFIGURATION (Required)
# ============================================================================
# Get from: https://supabase.com → Project Settings → API
# Free tier: 500MB database + 2GB transfer

VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# ============================================================================
# OPTIONAL: SITE METADATA
# ============================================================================
VITE_SITE_URL=https://yourfarm.app
VITE_SITE_NAME=Smart Farm Assistant
```

### **Obtaining API Keys**

#### **Groq API Key**
1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up / Log in
3. Navigate to API Keys section
4. Create new API key
5. Copy and paste into `.env`

#### **OpenWeather API Key**
1. Visit [https://openweathermap.org/api](https://openweathermap.org/api)
2. Sign up for free account
3. Navigate to API Keys
4. Generate new key
5. Copy and paste into `.env`

#### **Supabase Configuration**
1. Visit [https://supabase.com](https://supabase.com)
2. Create new project
3. Go to Project Settings → API
4. Copy `Project URL` → `VITE_SUPABASE_URL`
5. Copy `anon public` key → `VITE_SUPABASE_ANON_KEY`
6. Run database schema setup (see database documentation)

---

## 💻 Development

### **Available Scripts**

```bash
# Start development server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

### **Development Server**
- **URL**: http://localhost:5173
- **LAN Access**: Enabled (accessible from mobile devices on same network)
- **Hot Module Replacement (HMR)**: Enabled for fast development

### **Code Style & Standards**
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and TypeScript
- **Component Structure**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities
- **Import Order**: React → Third-party → Internal services → Components → Styles

### **Mock Data Mode**
For development without real sensor hardware:
1. Navigate to Settings
2. Enable "Mock Data" toggle
3. Sample sensor data will be generated automatically

---

## 📦 Build & Deployment

### **Web Build (PWA)**

```bash
# Production build
npm run build

# Output directory: dist/
# Upload dist/ folder to your web server

# Test production build locally
npm run preview
```

### **Android Build (Capacitor)**

```bash
# 1. Build web assets
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. Build APK/AAB from Android Studio
# Build → Generate Signed Bundle/APK
```

### **PWA Deployment**
The app includes service worker configuration for offline functionality:
- **Caching Strategy**: CacheFirst for weather data, NetworkFirst for AI APIs
- **Offline Support**: Static assets cached automatically
- **Update Mechanism**: Auto-update on new service worker detection

### **Production Checklist**
- [ ] All API keys configured in production environment
- [ ] Supabase production database setup
- [ ] Service worker configured for production domain
- [ ] PWA manifest updated with production URLs
- [ ] Icons generated for all required sizes
- [ ] Android signing keys configured
- [ ] Environment variables secured (not committed to git)

---

## 📱 Progressive Web App (PWA)

### **PWA Features**
- ✅ **Installable**: Add to home screen on mobile and desktop
- ✅ **Offline Support**: Service worker caches critical assets
- ✅ **Push Notifications**: Ready (implementation pending)
- ✅ **App-like Experience**: Standalone display mode
- ✅ **Auto-updating**: Service worker automatically updates
- ✅ **Responsive**: Optimized for all screen sizes

### **Manifest Configuration**
- **App Name**: "Farm Monitoring System"
- **Short Name**: "FarmBot AI"
- **Theme Color**: `#22c55e` (Green)
- **Background**: White
- **Display**: Standalone
- **Icons**: 72x72 to 512x512 (including maskable)

### **Service Worker Caching**
```javascript
// Weather API - Cache First (24 hours)
openweathermap.org/* → CacheFirst (50 entries max)

// AI API - Network First (1 hour)
openrouter.ai/* → NetworkFirst (20 entries max)

// Supabase - Network First (1 hour)
*.supabase.co/* → NetworkFirst (100 entries max)
```

### **Installation Prompt**
Users are prompted to install the PWA when:
- They visit the site multiple times
- They interact with the app
- Implementation via `InstallPrompt` component

---

## 👨‍💻 Author

**Aryan Kumar**

- **Email**: aryankumar@example.com
- **GitHub**: [@Aryan-git-byte](https://github.com/Aryan-git-byte)
- **Project**: Comprehensive Farm Monitoring Application
- **Version**: 1.0.0

---

## 📋 Additional Notes

### **Known Limitations**
- Sensor data requires Supabase connection (no local-only mode)
- AI responses depend on API key availability
- Weather data limited by OpenWeather free tier (1000 calls/day)
- SoilGrids data accuracy varies by region

### **Future Enhancements**
- Push notification integration
- Bluetooth sensor connectivity
- Local database sync for offline mode
- Multi-farm management
- Community features (farmer network)
- Market price integration
- Disease detection via image recognition

### **Performance Optimizations**
- API response caching (Supabase)
- Service worker for offline assets
- Code splitting (lazy loading)
- Image optimization
- Debounced user inputs

### **Security Considerations**
- All API keys stored in environment variables
- Supabase Row Level Security (RLS) enabled
- No sensitive data in client-side code
- HTTPS enforced in production
- Regular dependency updates for security patches

---

## 🔒 License

**Closed Source** - Internal documentation only. This project is proprietary and not for public distribution.

---

## 📞 Support

For internal support or questions, contact the development team or refer to the project wiki.

---

**Last Updated**: November 2025  
**Documentation Version**: 1.0.0
