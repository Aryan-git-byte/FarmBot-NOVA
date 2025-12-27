import React, { useState, useEffect } from 'react';
import { Cloud, Thermometer, Droplets, Wind, Eye, Calendar, AlertCircle, WifiOff, Sunrise, Sunset, CloudRain, CloudSnow, CloudDrizzle, Sun, CloudFog, Zap, History, TrendingUp, TrendingDown, X, Volume2 } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { useLanguage } from '../../contexts/LanguageContext';
import { WeatherService, WeatherData, WeatherForecast } from '../../services/weatherService';
import { AiService } from '../../services/aiService';
import LoadingSpinner from '../Common/LoadingSpinner';

interface WeatherDashboardProps {
  latitude: number;
  longitude: number;
}

interface HistoricalWeatherData extends Partial<WeatherData> {
  fetchedAt: string;
  temperature: number;
  humidity: number;
  weather_condition: string;
  weather_description: string;
}

const WeatherDashboard: React.FC<WeatherDashboardProps> = ({ latitude, longitude }) => {
  const { t, language } = useLanguage();
  const { speak } = useTTS(language);

  // Generate weather insights text for TTS (now AI-driven)
  const getWeatherInsightsText = async () => {
    if (!currentWeather) return '';
    const trend = calculateWeatherTrend();
    try {
      const insights = await AiService.getWeatherInsights(currentWeather, trend, language);
      return insights;
    } catch (error) {
      console.error('Failed to get AI insights, using fallback:', error);
      // Fallback
      if (language === 'hi') {
        let text = `मौसम की जानकारी: तापमान ${currentWeather.temperature} डिग्री सेल्सियस, आर्द्रता ${currentWeather.humidity} प्रतिशत, स्थिति: ${currentWeather.weather_description}.`;
        if (trend === 'warming') text += ' तापमान बढ़ रहा है.';
        else if (trend === 'cooling') text += ' तापमान घट रहा है.';
        else text += ' तापमान स्थिर है.';
        return text;
      } else {
        let text = `Weather update: Temperature is ${currentWeather.temperature}°C, humidity is ${currentWeather.humidity} percent, condition: ${currentWeather.weather_description}.`;
        if (trend === 'warming') text += ' Temperature is rising.';
        else if (trend === 'cooling') text += ' Temperature is falling.';
        else text += ' Temperature is stable.';
        return text;
      }
    }
  };

  const handleSpeakWeather = async () => {
    const insights = await getWeatherInsightsText();
    if (insights) speak(insights);
  };
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [historicalWeather, setHistoricalWeather] = useState<HistoricalWeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setUsingCachedData(false);
      fetchWeatherData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchWeatherData();
  }, [latitude, longitude]);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if online
      if (!navigator.onLine) {
        loadCachedWeather();
        return;
      }

      const [weather, forecastData] = await Promise.all([
        WeatherService.getCurrentWeather(latitude, longitude),
        WeatherService.getWeatherForecast(latitude, longitude)
      ]);

      setCurrentWeather(weather);
      setForecast(forecastData);
      setLastFetch(new Date());
      setUsingCachedData(false);

      // Cache current weather data
      localStorage.setItem('currentWeather', JSON.stringify(weather));
      localStorage.setItem('weatherForecast', JSON.stringify(forecastData));
      localStorage.setItem('weatherLastFetch', new Date().toISOString());

      // Store historical weather data
      const historicalKey = `weatherHistory_${latitude}_${longitude}`;
      const stored = localStorage.getItem(historicalKey);
      const history: HistoricalWeatherData[] = stored ? JSON.parse(stored) : [];
      
      const newEntry: HistoricalWeatherData = {
        ...weather,
        temperature: weather.temperature ?? 0,
        humidity: weather.humidity ?? 0,
        weather_condition: weather.weather_condition ?? 'unknown',
        weather_description: weather.weather_description ?? 'unknown',
        fetchedAt: new Date().toISOString()
      };
      
      // Keep last 20 entries
      history.push(newEntry);
      if (history.length > 20) history.shift();
      
      localStorage.setItem(historicalKey, JSON.stringify(history));
      setHistoricalWeather(history);

    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      loadCachedWeather();
    } finally {
      setLoading(false);
    }
  };

  const loadCachedWeather = () => {
    const cachedWeather = localStorage.getItem('currentWeather');
    const cachedForecast = localStorage.getItem('weatherForecast');
    const cachedLastFetch = localStorage.getItem('weatherLastFetch');
    const historicalKey = `weatherHistory_${latitude}_${longitude}`;
    const cachedHistory = localStorage.getItem(historicalKey);

    if (cachedWeather) {
      setCurrentWeather(JSON.parse(cachedWeather));
      setUsingCachedData(true);
    }

    if (cachedForecast) {
      setForecast(JSON.parse(cachedForecast));
    }

    if (cachedLastFetch) {
      setLastFetch(new Date(cachedLastFetch));
    }

    if (cachedHistory) {
      setHistoricalWeather(JSON.parse(cachedHistory));
    }

    if (!cachedWeather) {
      setError('No cached weather data available');
    } else {
      setError('Offline mode: Showing cached weather data');
    }

    setLoading(false);
  };

  const getWeatherIcon = (condition: string) => {
    return WeatherService.getWeatherIcon(condition);
  };

  const getDetailedWeatherIcon = (condition: string, size: number = 24) => {
    const iconProps = { size, className: "text-blue-500" };
    const lower = condition.toLowerCase();
    
    if (lower.includes('rain')) return <CloudRain {...iconProps} />;
    if (lower.includes('drizzle')) return <CloudDrizzle {...iconProps} />;
    if (lower.includes('snow')) return <CloudSnow {...iconProps} />;
    if (lower.includes('thunder') || lower.includes('storm')) return <Zap {...iconProps} />;
    if (lower.includes('fog') || lower.includes('mist')) return <CloudFog {...iconProps} />;
    if (lower.includes('clear')) return <Sun {...iconProps} />;
    return <Cloud {...iconProps} />;
  };

  const calculateWeatherTrend = () => {
    if (historicalWeather.length < 2) return 'stable';
    
    const recent = historicalWeather.slice(-5);
    const temps = recent.map(w => w.temperature);
    const avgRecent = temps.reduce((a, b) => a + b, 0) / temps.length;
    const current = temps[temps.length - 1];
    
    if (current > avgRecent + 2) return 'warming';
    if (current < avgRecent - 2) return 'cooling';
    return 'stable';
  };

  const getTimeSinceUpdate = () => {
    if (!lastFetch) return '';
    const mins = Math.floor((Date.now() - lastFetch.getTime()) / 60000);
    if (mins < 1) return language === 'hi' ? 'अभी' : 'Just now';
    if (mins < 60) return language === 'hi' ? `${mins} मिनट पहले` : `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    return language === 'hi' ? `${hours} घंटे पहले` : `${hours} hr ago`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-sm border border-blue-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="medium" />
        </div>
      </div>
    );
  }

  if (error && !usingCachedData && !currentWeather) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-sm border border-blue-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-32 text-center">
          <div>
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchWeatherData}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const trend = calculateWeatherTrend();

  return (
  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-sm border border-blue-200 dark:border-gray-700 p-6">
      {/* Offline/Cached Banner */}
      {!isOnline && (
        <div className="mb-4 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-xl p-3 flex items-center space-x-2">
          <WifiOff className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <span className="text-sm text-orange-800 dark:text-orange-300">
            {language === 'hi' ? '⚠️ ऑफलाइन: कैश्ड मौसम डेटा' : '⚠️ Offline: Cached weather data'}
          </span>
        </div>
      )}

      {usingCachedData && isOnline && (
        <div className="mb-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-xl p-3 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm text-blue-800 dark:text-blue-300">
            {language === 'hi' ? 'सर्वर से कनेक्ट नहीं हो पाया। पुराना डेटा दिखाया जा रहा है।' : 'Could not connect to server. Showing cached data.'}
          </span>
        </div>
      )}

      {/* Header */}
  <div className="flex items-center justify-between mb-6">
  <div className="flex items-center space-x-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg flex items-center space-x-2">
            <Cloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <button
              className="ml-2 flex items-center px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors"
              title={language === 'hi' ? 'मौसम की जानकारी सुनें' : 'Speak weather insights'}
              onClick={handleSpeakWeather}
            >
              <Volume2 className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">{language === 'hi' ? 'सुनें' : 'Speak'}</span>
            </button>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('currentWeather')}
            </h2>
            {lastFetch && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getTimeSinceUpdate()}
              </p>
            )}
          </div>
        </div>

        {historicalWeather.length > 0 && (
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <History className="h-4 w-4" />
            <span>{language === 'hi' ? 'इतिहास' : 'History'}</span>
          </button>
        )}
      </div>

      {currentWeather && (
        <div className="space-y-6">
          {/* Current Weather - Hero Section */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 dark:from-blue-600 dark:to-cyan-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="text-6xl">
                    {getWeatherIcon(currentWeather.weather_condition)}
                  </div>
                  <div>
                    <div className="text-5xl font-bold">
                      {currentWeather.temperature}°C
                    </div>
                    {trend !== 'stable' && (
                      <div className="flex items-center space-x-1 text-sm mt-1">
                        {trend === 'warming' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>{trend === 'warming' ? (language === 'hi' ? 'गर्म हो रहा' : 'Warming') : (language === 'hi' ? 'ठंडा हो रहा' : 'Cooling')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xl font-medium capitalize mb-1">
                  {currentWeather.weather_description}
                </div>
                <div className="text-sm opacity-90 flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>{currentWeather.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('humidity')}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentWeather.humidity}%
              </div>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${currentWeather.humidity}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-2">
                <Wind className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('windSpeed')}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentWeather.wind_speed}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">km/h</div>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-2">
                <Thermometer className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {language === 'hi' ? 'दबाव' : 'Pressure'}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentWeather.pressure}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">hPa</div>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('visibility')}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentWeather.visibility}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">km</div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          {forecast.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>{t('weatherForecast')}</span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {forecast.map((day, index) => (
                  <div 
                    key={day.date} 
                    className="bg-white dark:bg-gray-700 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all hover:scale-105"
                  >
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      {index === 0 ? t('today') : new Date(day.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en', { weekday: 'short' })}
                    </div>
                    <div className="text-3xl mb-2">
                      {getWeatherIcon(day.weather_condition)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-2 text-sm">
                        <span className="font-bold text-red-600 dark:text-red-400">{day.temperature_max}°</span>
                        <span className="text-gray-400">/</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{day.temperature_min}°</span>
                      </div>
                      {day.rainfall > 0 && (
                        <div className="flex items-center justify-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                          <Droplets className="h-3 w-3" />
                          <span>{day.rainfall}mm</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historical Weather Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-800">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <History className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <span>{language === 'hi' ? 'मौसम का इतिहास' : 'Weather History'}</span>
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {language === 'hi' ? 'पिछले मौसम के रिकॉर्ड' : 'Past weather records'}
                </p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {historicalWeather.length > 0 ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {(() => {
                      const temps = historicalWeather.map(w => w.temperature);
                      const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
                      const max = Math.max(...temps);
                      const min = Math.min(...temps);
                      
                      return (
                        <>
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                            <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                              {language === 'hi' ? 'औसत' : 'Average'}
                            </p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                              {avg.toFixed(1)}°C
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-4">
                            <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                              {language === 'hi' ? 'अधिकतम' : 'Maximum'}
                            </p>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                              {max.toFixed(1)}°C
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4">
                            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                              {language === 'hi' ? 'न्यूनतम' : 'Minimum'}
                            </p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                              {min.toFixed(1)}°C
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Temperature Timeline */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {language === 'hi' ? 'तापमान रुझान' : 'Temperature Trend'}
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="relative h-32">
                        {(() => {
                          const temps = historicalWeather.map(w => w.temperature);
                          const max = Math.max(...temps);
                          const min = Math.min(...temps);
                          const range = max - min || 1;
                          
                          return (
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3"/>
                                </linearGradient>
                              </defs>
                              <polyline
                                points={temps.map((temp, i) => {
                                  const x = (i / (temps.length - 1)) * 100;
                                  const y = 100 - ((temp - min) / range) * 80 - 10;
                                  return `${x},${y}`;
                                }).join(' ')}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                              />
                              <polyline
                                points={`0,100 ${temps.map((temp, i) => {
                                  const x = (i / (temps.length - 1)) * 100;
                                  const y = 100 - ((temp - min) / range) * 80 - 10;
                                  return `${x},${y}`;
                                }).join(' ')} 100,100`}
                                fill="url(#tempGradient)"
                              />
                            </svg>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Historical Records Table */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {language === 'hi' ? 'हाल के रिकॉर्ड' : 'Recent Records'}
                    </h3>
                    <div className="space-y-2">
                      {historicalWeather.slice(-10).reverse().map((record, idx) => (
                        <div 
                          key={idx}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">
                                {getWeatherIcon(record.weather_condition)}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {record.temperature}°C
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {new Date(record.fetchedAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div className="text-gray-600 dark:text-gray-400 capitalize">
                                {record.weather_description}
                              </div>
                              <div className="flex items-center justify-end space-x-3 text-xs text-gray-500 dark:text-gray-500 mt-1">
                                <span className="flex items-center space-x-1">
                                  <Droplets className="h-3 w-3" />
                                  <span>{record.humidity}%</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Wind className="h-3 w-3" />
                                  <span>{record.wind_speed}km/h</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Cloud className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'hi' 
                      ? 'कोई ऐतिहासिक मौसम डेटा उपलब्ध नहीं है'
                      : 'No historical weather data available'
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

export default WeatherDashboard;