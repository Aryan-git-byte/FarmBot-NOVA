import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Thermometer, AlertTriangle, CheckCircle, Clock, MapPin, TrendingUp, TrendingDown, Minus, BarChart2, WifiOff, X, Volume2 } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';
import { SensorService } from '../../services/sensorService';
import { AiService } from '../../services/aiService';
import { SensorData, ProcessedSensorReading } from '../../config/supabase';
import StatusIndicator from '../Common/StatusIndicator';
import LoadingSpinner from '../Common/LoadingSpinner';
import WeatherDashboard from './WeatherDashboard';
import ThinkingOverlay from '../Common/ThinkingOverlay';

const IntegratedDashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { speak } = useTTS(language);
  const [isThinking, setIsThinking] = useState(false);

  // Generate insights text for a sensor parameter (now AI-driven)
  const getSensorInsightsText = async (reading: ProcessedSensorReading, trend: string) => {
    const name = getSensorDisplayName(reading.sensor_type);
    try {
      const trendType = trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'stable';
      const insights = await AiService.getSensorInsights(
        name,
        reading.value,
        reading.unit || '',
        reading.status,
        trendType,
        language
      );
      return insights;
    } catch (error) {
      console.error('Failed to get AI insights, using fallback:', error);
      // Fallback
      if (language === 'hi') {
        let text = `${name}: वर्तमान मान ${reading.value}${reading.unit ? ' ' + reading.unit : ''}.`;
        if (trend === 'up') text += ' मान बढ़ रहा है.';
        else if (trend === 'down') text += ' मान घट रहा है.';
        else text += ' मान स्थिर है.';
        return text;
      } else {
        let text = `${name}: Current value is ${reading.value}${reading.unit ? ' ' + reading.unit : ''}.`;
        if (trend === 'up') text += ' Value is increasing.';
        else if (trend === 'down') text += ' Value is decreasing.';
        else text += ' Value is stable.';
        return text;
      }
    }
  };

  const handleSpeakSensor = async (reading: ProcessedSensorReading, trend: string) => {
    setIsThinking(true);
    try {
      const insights = await getSensorInsightsText(reading, trend);
      if (insights) speak(insights);
    } finally {
      setIsThinking(false);
    }
  };
  const [sensorData, setSensorData] = useState<ProcessedSensorReading[]>([]);
  const [latestSensorReadings, setLatestSensorReadings] = useState<ProcessedSensorReading[]>([]);
  const [historicalData, setHistoricalData] = useState<Record<string, ProcessedSensorReading[]>>({});
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [statusCounts, setStatusCounts] = useState({ optimal: 0, warning: 0, critical: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setUsingCachedData(false);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch all integrated data
  const fetchIntegratedData = useCallback(async () => {
    try {
      setError(null);
      
      // Check if online
      if (!navigator.onLine) {
        // Load from cache
        const cachedLatest = localStorage.getItem('latestSensors');
        const cachedHistorical = localStorage.getItem('historicalSensors');
        const cachedLocation = localStorage.getItem('sensorLocation');
        
        if (cachedLatest) {
          const readings = JSON.parse(cachedLatest);
          setLatestSensorReadings(readings);
          
          const counts = readings.reduce(
            (acc: any, reading: any) => {
              acc[reading.status]++;
              return acc;
            },
            { optimal: 0, warning: 0, critical: 0 }
          );
          setStatusCounts(counts);
          setUsingCachedData(true);
        }
        
        if (cachedHistorical) {
          setHistoricalData(JSON.parse(cachedHistorical));
        }
        
        if (cachedLocation) {
          setCurrentLocation(JSON.parse(cachedLocation));
        }
        
        setError('Offline mode: Showing cached data');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Fetch sensor data
      const sensors = await SensorService.getSensorData({ limit: 100 });
      setSensorData(sensors);

      // Get latest sensor readings
      const latestReadings = await SensorService.getLatestReadings();
      setLatestSensorReadings(latestReadings);
      
      // Cache latest readings
      localStorage.setItem('latestSensors', JSON.stringify(latestReadings));

      // Group historical data by sensor type
      const grouped: Record<string, ProcessedSensorReading[]> = {};
      sensors.forEach(reading => {
        if (!grouped[reading.sensor_type]) {
          grouped[reading.sensor_type] = [];
        }
        grouped[reading.sensor_type].push(reading);
      });
      
      // Sort each group by timestamp
      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
      
      setHistoricalData(grouped);
      localStorage.setItem('historicalSensors', JSON.stringify(grouped));

      // Calculate status counts
      const counts = latestReadings.reduce(
        (acc, reading) => {
          acc[reading.status]++;
          return acc;
        },
        { optimal: 0, warning: 0, critical: 0 }
      );
      setStatusCounts(counts);

      // Extract location from sensor data
      let location: { lat: number; lon: number; name: string } | null = null;
      if (latestReadings.length > 0) {
        const firstReading = latestReadings[0];
        if (firstReading.latitude && firstReading.longitude) {
          location = {
            lat: firstReading.latitude,
            lon: firstReading.longitude,
            name: 'Sensor Location'
          };
        }
      }
      
      // Default location if no sensor data
      if (!location) {
        location = { lat: 28.6139, lon: 77.2090, name: 'Delhi, India' };
      }
      
      setCurrentLocation(location);
      localStorage.setItem('sensorLocation', JSON.stringify(location));

      setLastUpdate(new Date());
      setUsingCachedData(false);
    } catch (err) {
      console.error('Error fetching integrated data:', err);
      
      // Try to load from cache on error
      const cachedLatest = localStorage.getItem('latestSensors');
      const cachedHistorical = localStorage.getItem('historicalSensors');
      const cachedLocation = localStorage.getItem('sensorLocation');
      
      if (cachedLatest) {
        const readings = JSON.parse(cachedLatest);
        setLatestSensorReadings(readings);
        
        const counts = readings.reduce(
          (acc: any, reading: any) => {
            acc[reading.status]++;
            return acc;
          },
          { optimal: 0, warning: 0, critical: 0 }
        );
        setStatusCounts(counts);
        setUsingCachedData(true);
        setError('Using cached data due to connection error');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
      
      if (cachedHistorical) {
        setHistoricalData(JSON.parse(cachedHistorical));
      }
      
      if (cachedLocation) {
        setCurrentLocation(JSON.parse(cachedLocation));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchIntegratedData();
  }, [fetchIntegratedData]);

  // Auto refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        setRefreshing(true);
        fetchIntegratedData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loading, refreshing, fetchIntegratedData]);

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchIntegratedData();
  };

  const getSensorDisplayName = (sensorType: string) => {
    const sensorNames: Record<string, string> = {
      soil_moisture: language === 'hi' ? 'मिट्टी की नमी' : t('soilMoisture'),
      ph: language === 'hi' ? 'pH' : t('soilHealth'),
      soil_temperature: language === 'hi' ? 'तापमान' : t('temperature'),
      ec: language === 'hi' ? 'विद्युत चालकता (EC)' : 'EC',
      n: language === 'hi' ? 'नाइट्रोजन' : 'Nitrogen',
      p: language === 'hi' ? 'फास्फोरस' : 'Phosphorus',
      k: language === 'hi' ? 'पोटेशियम' : 'Potassium'
    };
    return sensorNames[sensorType] || sensorType;
  };

  // Calculate trend for a sensor
  const calculateTrend = (sensorType: string) => {
    const history = historicalData[sensorType];
    if (!history || history.length < 2) return 'stable';
    
    const recent = history.slice(-7); // Last 7 readings
    const first = recent[0].value;
    const last = recent[recent.length - 1].value;
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };

  // Get sparkline data for a sensor
  const getSparklineData = (sensorType: string) => {
    const history = historicalData[sensorType];
    if (!history) return [];
    
    return history.slice(-24).map(reading => ({
      value: reading.value,
      time: new Date(reading.timestamp).getTime()
    }));
  };

  // Sparkline component
  const Sparkline: React.FC<{ data: Array<{value: number, time: number}> }> = ({ data }) => {
    if (data.length === 0) return null;
    
    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    const range = max - min || 1;
    
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-500"
        />
      </svg>
    );
  };

  // Trend icon component
  const TrendIcon: React.FC<{ trend: string }> = ({ trend }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !usingCachedData && !isOnline) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 dark:text-red-400 mb-2">
            {t('error')}
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <ThinkingOverlay isVisible={isThinking} />
      
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex items-center space-x-3">
          <WifiOff className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-orange-900 dark:text-orange-400">
              {language === 'hi' ? '⚠️ ऑफलाइन मोड सक्रिय' : '⚠️ Offline mode activated'}
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {language === 'hi' 
                ? 'अंतिम सहेजा गया डेटा दिखाया जा रहा है। इंटरनेट कनेक्शन की जांच करें।'
                : 'Showing last saved data. Check your internet connection.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Cached Data Warning */}
      {usingCachedData && isOnline && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-400">
              {language === 'hi' ? 'कैश्ड डेटा दिखाया जा रहा है' : 'Showing cached data'}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {language === 'hi' 
                ? 'सर्वर से कनेक्ट नहीं हो पा रहा। पुराना डेटा दिखाया जा रहा है।'
                : 'Unable to connect to server. Displaying previously saved data.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('farmStatus')}
          </h1>
          <div className="flex items-center space-x-2 mt-1">
            {lastUpdate && (
              <span className="text-sm text-gray-500">
                {t('lastChecked')}: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            {currentLocation && (
              <span className="text-sm text-gray-500 flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{currentLocation.name}</span>
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{t('refresh')}</span>
        </button>
      </div>

      {/* Urgency Overview - Top Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
          <div className="text-4xl font-bold text-green-700 dark:text-green-400 mb-2">
            {statusCounts.optimal}
          </div>
          <p className="text-green-600 dark:text-green-400 font-medium">
            {language === 'hi' ? 'अच्छा' : 'Good'}
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 text-center">
          <Clock className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
          <div className="text-4xl font-bold text-yellow-700 dark:text-yellow-400 mb-2">
            {statusCounts.warning}
          </div>
          <p className="text-yellow-600 dark:text-yellow-400 font-medium">
            {language === 'hi' ? 'सावधान' : 'Warning'}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-3" />
          <div className="text-4xl font-bold text-red-700 dark:text-red-400 mb-2">
            {statusCounts.critical}
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">
            {language === 'hi' ? 'खतरनाक' : 'Critical'}
          </p>
        </div>
      </div>

      {/* Weather Dashboard */}
      {currentLocation && (
        <WeatherDashboard 
          latitude={currentLocation.lat} 
          longitude={currentLocation.lon} 
        />
      )}

      {/* Sensor Data */}
      {latestSensorReadings.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'hi' ? 'सेंसर डेटा' : 'Sensor Data'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestSensorReadings.map((reading) => {
              const trend = calculateTrend(reading.sensor_type);
              const sparklineData = getSparklineData(reading.sensor_type);
              
              return (
                <div 
                  key={reading.id} 
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedSensor(reading.sensor_type)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                      {getSensorDisplayName(reading.sensor_type)}
                      <button
                        className="ml-2 flex items-center px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        title={language === 'hi' ? 'इस पैरामीटर की जानकारी सुनें' : 'Speak parameter insights'}
                        onClick={e => {
                          e.stopPropagation();
                          handleSpeakSensor(reading, trend);
                        }}
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </h3>
                    <div className="flex items-center space-x-2">
                      <TrendIcon trend={trend} />
                      <StatusIndicator status={reading.status} size="small" showText={false} />
                    </div>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {reading.value}{reading.unit}
                  </div>
                  
                  {/* Sparkline */}
                  {sparklineData.length > 0 && (
                    <div className="mb-2 opacity-70">
                      <Sparkline data={sparklineData} />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      {new Date(reading.timestamp).toLocaleString()}
                    </span>
                    <button 
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSensor(reading.sensor_type);
                      }}
                    >
                      <BarChart2 className="h-3 w-3" />
                      <span>{language === 'hi' ? 'विवरण' : 'Details'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* No Data Message */
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 text-center">
          <Thermometer className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-400 mb-2">
            {language === 'hi' ? 'कोई डेटा उपलब्ध नहीं' : 'No Data Available'}
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            {language === 'hi' 
              ? 'सेंसर डेटा उपलब्ध नहीं है। नमूना डेटा डालने के लिए सेटिंग्स में जाएं।'
              : 'No sensor data available. Go to Settings to insert sample data.'
            }
          </p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('refresh')}
          </button>
        </div>
      )}

      {/* AI Assistant Tip */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {language === 'hi' ? 'तेज़ AI सहायक उपलब्ध है' : 'Fast AI Assistant Available'}
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {language === 'hi' 
            ? 'ऊपर दाईं ओर चैट आइकन पर क्लिक करके 20 सेकंड में जवाब पाएं।'
            : 'Click the chat icon in the top right to get answers within 20 seconds.'
          }
        </p>
      </div>

      {/* Historical Data Modal */}
      {selectedSensor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getSensorDisplayName(selectedSensor)}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {language === 'hi' ? 'ऐतिहासिक डेटा और रुझान' : 'Historical Data & Trends'}
                </p>
              </div>
              <button
                onClick={() => setSelectedSensor(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary Stats */}
              {historicalData[selectedSensor] && historicalData[selectedSensor].length > 0 && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const data = historicalData[selectedSensor];
                      const values = data.map(d => d.value);
                      const current = values[values.length - 1];
                      const avg = values.reduce((a, b) => a + b, 0) / values.length;
                      const max = Math.max(...values);
                      const min = Math.min(...values);
                      
                      return (
                        <>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                              {language === 'hi' ? 'वर्तमान' : 'Current'}
                            </p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                              {current.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                            <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                              {language === 'hi' ? 'औसत' : 'Average'}
                            </p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                              {avg.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                            <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                              {language === 'hi' ? 'अधिकतम' : 'Maximum'}
                            </p>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                              {max.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                            <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">
                              {language === 'hi' ? 'न्यूनतम' : 'Minimum'}
                            </p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                              {min.toFixed(2)}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Area Chart */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      {language === 'hi' ? 'समय के साथ रुझान' : 'Trend Over Time'}
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={historicalData[selectedSensor].map(d => ({
                        time: new Date(d.timestamp).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit'
                        }),
                        value: d.value
                      }))}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="time" 
                          stroke="#9ca3af"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Data Table */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      {language === 'hi' ? 'हाल के रीडिंग' : 'Recent Readings'}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-300 dark:border-gray-600">
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {language === 'hi' ? 'समय' : 'Time'}
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {language === 'hi' ? 'मान' : 'Value'}
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {language === 'hi' ? 'स्थिति' : 'Status'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {historicalData[selectedSensor].slice(-10).reverse().map((reading, idx) => (
                            <tr 
                              key={idx}
                              className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                                {new Date(reading.timestamp).toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-sm font-medium text-gray-900 dark:text-white">
                                {reading.value}{reading.unit}
                              </td>
                              <td className="py-2 px-3">
                                <StatusIndicator status={reading.status} size="small" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {(!historicalData[selectedSensor] || historicalData[selectedSensor].length === 0) && (
                <div className="text-center py-12">
                  <BarChart2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'hi' 
                      ? 'इस सेंसर के लिए कोई ऐतिहासिक डेटा उपलब्ध नहीं है'
                      : 'No historical data available for this sensor'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegratedDashboard;