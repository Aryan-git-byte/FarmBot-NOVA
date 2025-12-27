import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Updated Database Types for minimalist schema
export interface SensorData {
  id: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  soil_moisture?: number;    // Percentage
  ec?: number;              // Electrical conductivity
  soil_temperature?: number; // Degrees Celsius
  n?: number;               // Nitrogen (ppm)
  p?: number;               // Phosphorus (ppm)
  k?: number;               // Potassium (ppm)
  ph?: number;              // pH value
}

export interface ApiData {
  id: string;
  timestamp: string;
  api_source: string;       // e.g., 'OpenWeather', 'ISRIC'
  data: Record<string, any>; // Raw JSON data from API fetches
  latitude?: number;
  longitude?: number;
}

export interface ManualEntry {
  id: string;
  timestamp: string;
  entry_type: string;       // e.g., 'water_quality', 'fertilizer', 'observation'
  title: string;
  description?: string;
  data: Record<string, any>; // Flexible additional manual entry details
  latitude?: number;
  longitude?: number;
}

// Updated AiLog interface to match public.ai_log table schema
// Add this to your supabase config file or types file
export interface AiLog {
  id: string;
  timestamp: string;
  query: string;
  response: string;
  sources: string[] | null;
  status: string;
  language: string;
  confidence: number | null;
  model_used: string | null;
  response_time: number | null;
  user_feedback: number | null;
  created_at: string;
  conversation_id: string | null;
  intelligence_level: string | null;
}

// Helper types for sensor data processing
export type SensorType = 'soil_moisture' | 'ec' | 'soil_temperature' | 'n' | 'p' | 'k' | 'ph';

export interface ProcessedSensorReading {
  id: string;
  sensor_type: SensorType;
  value: number;
  unit: string;
  status: 'optimal' | 'warning' | 'critical';
  timestamp: string;
  latitude?: number;
  longitude?: number;
  sensor_id?: string;
}

// Status derivation helper - derive status from sensor values
export const deriveSensorStatus = (sensorType: SensorType, value: number): 'optimal' | 'warning' | 'critical' => {
  const thresholds = {
    soil_moisture: { optimal: [40, 60], warning: [25, 75], critical: [0, 100] },
    ec: { optimal: [0.5, 2.0], warning: [0.3, 3.0], critical: [0, 5.0] },
    soil_temperature: { optimal: [18, 25], warning: [10, 30], critical: [-10, 40] },
    n: { optimal: [20, 50], warning: [10, 80], critical: [0, 150] },
    p: { optimal: [10, 30], warning: [5, 50], critical: [0, 100] },
    k: { optimal: [100, 300], warning: [50, 400], critical: [0, 600] },
    ph: { optimal: [6.0, 7.5], warning: [5.5, 8.0], critical: [4.0, 9.0] }
  };

  const threshold = thresholds[sensorType];
  if (value >= threshold.optimal[0] && value <= threshold.optimal[1]) {
    return 'optimal';
  } else if (value >= threshold.warning[0] && value <= threshold.warning[1]) {
    return 'warning';
  } else {
    return 'critical';
  }
};

// Unit mapping for sensor types
export const getSensorUnit = (sensorType: SensorType): string => {
  const units = {
    soil_moisture: '%',
    ec: 'dS/m',
    soil_temperature: '°C',
    n: 'ppm',
    p: 'ppm',
    k: 'ppm',
    ph: ''
  };
  return units[sensorType];
};