import React, { useState } from 'react';
import { Settings as SettingsIcon, Globe, Sun, Moon, Database, Smartphone, Wifi, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { SensorService } from '../../services/sensorService';
import { SUPPORTED_LANGUAGES } from '../../config/languages';

const MobileOptimizedSettings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInsertMockData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await SensorService.insertSampleData();
      setSuccess(
        language === 'hi' 
          ? 'नमूना डेटा सफलतापूर्वक डाला गया! डैशबोर्ड देखें।'
          : 'Sample data inserted successfully! Check the dashboard.'
      );
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error inserting mock data:', err);
      setError(
        language === 'hi'
          ? 'नमूना डेटा डालने में त्रुटि। कृपया फिर कोशिश करें।'
          : 'Error inserting sample data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3 w-16 h-16 mx-auto mb-3">
          <SettingsIcon className="h-10 w-10 text-gray-600 dark:text-gray-400 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('settings')}
        </h1>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-3">
          <p className="text-green-700 dark:text-green-400 text-sm text-center">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-3">
          <p className="text-red-700 dark:text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Language Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Globe className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('language')}
          </h2>
        </div>
        
        <div className="space-y-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                language === lang.code
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {lang.nativeName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {lang.name}
                  </p>
                </div>
                {language === lang.code && (
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3 mb-3">
          {theme === 'light' ? (
            <Sun className="h-5 w-5 text-gray-400" />
          ) : (
            <Moon className="h-5 w-5 text-gray-400" />
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('theme')}
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`p-3 rounded-lg border transition-all ${
              theme === 'light'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
            }`}
          >
            <div className="text-center">
              <Sun className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t('lightMode')}
              </p>
            </div>
          </button>

          <button
            onClick={() => theme === 'light' && toggleTheme()}
            className={`p-3 rounded-lg border transition-all ${
              theme === 'dark'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
            }`}
          >
            <div className="text-center">
              <Moon className="h-6 w-6 mx-auto mb-1 text-blue-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {t('darkMode')}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Database className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('dataManagement')}
          </h2>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 mb-3">
          <p className="text-blue-800 dark:text-blue-300 text-sm">
            {language === 'hi' 
              ? 'नमूना डेटा में GPS स्थान के साथ 7 दिनों का सेंसर डेटा शामिल है। AI सहायक इस डेटा का उपयोग करके तेज़ सलाह देगा।'
              : 'Sample data includes 7 days of sensor readings with GPS locations. AI assistant will use this data for fast advice.'
            }
          </p>
        </div>

        <button
          onClick={handleInsertMockData}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <Database className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
          <span>
            {loading ? 
              (language === 'hi' ? 'डेटा डाला जा रहा है...' : 'Inserting data...') :
              (language === 'hi' ? 'नमूना डेटा डालें' : 'Insert Sample Data')
            }
          </span>
        </button>
      </div>

      {/* App Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Info className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {language === 'hi' ? 'ऐप की जानकारी' : 'App Info'}
          </h2>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>
              {language === 'hi' ? 'मोबाइल के लिए अनुकूलित' : 'Mobile Optimized'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4" />
            <span>
              {language === 'hi' ? 'GPS आधारित डेटा' : 'GPS-based Data'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>
              {language === 'hi' ? 'तेज़ AI सहायक (<20s)' : 'Fast AI Assistant (<20s)'}
            </span>
          </div>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
        <h3 className="font-medium text-yellow-900 dark:text-yellow-400 mb-2 text-sm">
          {language === 'hi' ? 'उपयोग की युक्तियां' : 'Usage Tips'}
        </h3>
        <ul className="text-yellow-800 dark:text-yellow-300 text-xs space-y-1">
          <li>• {language === 'hi' ? 'AI सहायक से तेज़ खेती की सलाह लें' : 'Get fast farming advice from AI assistant'}</li>
          <li>• {language === 'hi' ? 'डैशबोर्ड को नियमित रूप से जांचें' : 'Check the dashboard regularly'}</li>
          <li>• {language === 'hi' ? 'मैन्युअल डेटा जोड़ना न भूलें' : 'Don\'t forget to add manual observations'}</li>
          <li>• {language === 'hi' ? 'सेंसर डेटा से स्थान अपने आप मिलता है' : 'Location is automatically detected from sensor data'}</li>
        </ul>
      </div>
    </div>
  );
};

export default MobileOptimizedSettings;