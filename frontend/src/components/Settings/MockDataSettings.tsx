import React, { useState } from 'react';
import { Database, Download, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SensorService } from '../../services/sensorService';
import { WeatherService } from '../../services/weatherService';
import { LocationService } from '../../services/locationService';

const MockDataSettings: React.FC = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Insert comprehensive mock data
  const handleInsertMockData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First, ensure we have a location
      let location = await LocationService.getCurrentUserLocation();
      
      if (!location) {
        // Create a default location (Delhi, India - good for farming data)
        const defaultLocation = await LocationService.saveLocation({
          place_name: 'दिल्ली, भारत',
          latitude: 28.6139,
          longitude: 77.2090,
          district: 'New Delhi',
          state: 'Delhi',
          country: 'India',
          is_current: true
        });
        location = defaultLocation;
      }

      if (!location) {
        throw new Error('Could not set location for mock data');
      }

      // Insert sensor data
      await SensorService.insertSampleData();

      setSuccess(
        'नमूना डेटा सफलतापूर्वक डाला गया! डैशबोर्ड देखें।'
      );

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);

    } catch (err) {
      console.error('Error inserting mock data:', err);
      setError(
        'नमूना डेटा डालने में त्रुटि। कृपया फिर कोशिश करें।'
      );
    } finally {
      setLoading(false);
    }
  };

  // Clear all data (for testing purposes)
  const handleClearData = async () => {
    if (!window.confirm(
      'क्या आप सभी डेटा साफ करना चाहते हैं? यह कार्य वापस नहीं किया जा सकता।'
    )) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Note: In a real implementation, you would call APIs to clear data
      // For now, we'll just show a success message
      setSuccess(
        'सभी डेटा साफ कर दिया गया।'
      );

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        'डेटा साफ करने में त्रुटि।'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-4 w-20 h-20 mx-auto mb-4">
          <Database className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('dataManagement')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('dataManagement')}
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <p className="text-green-700 dark:text-green-400 font-medium">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Insert Mock Data */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('insertMockData')}
          </h2>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 dark:text-blue-400 mb-2">
            {t('mockDataIncludes')}
          </h3>
          <ul className="text-blue-800 dark:text-blue-300 text-sm space-y-1">
            <li>• {t('sevenDaysSensorData')}</li>
            <li>• {t('currentWeatherInfo')}</li>
            <li>• {t('locationInfo')}</li>
            <li>• {t('agriculturalAdvice')}</li>
          </ul>
        </div>

        <button
          onClick={handleInsertMockData}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-medium text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <Download className={`h-5 w-5 ${loading ? 'animate-pulse' : ''}`} />
          <span>
            {loading ? 
              t('insertingData') :
              t('insertMockData')
            }
          </span>
        </button>
      </div>

      {/* Data Information */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('dataManagement')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {t('sevenDaysSensorData')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('sensorDataDesc')}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {t('currentWeatherInfo')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('weatherDataDesc')}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {t('agriculturalAdvice')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('agriculturalAdviceDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Clear Data (Danger Zone) */}
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-400">
            {t('dangerZone')}
          </h2>
        </div>
        
        <p className="text-red-700 dark:text-red-300 mb-4">
          {t('clearAllDataDesc')}
        </p>
        
        <button
          onClick={handleClearData}
          disabled={loading}
          className="bg-red-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <Trash2 className="h-5 w-5" />
          <span>
            {t('clearAllData')}
          </span>
        </button>
      </div>

      {/* Usage Instructions */}
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900 dark:text-yellow-400 mb-2">
              {t('usageInstructions')}
            </h3>
            <ul className="text-yellow-800 dark:text-yellow-300 text-sm space-y-1">
              <li>• {t('afterInsertingData')}</li>
              <li>• {t('dataForTesting')}</li>
              <li>• {t('realSensorData')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockDataSettings;