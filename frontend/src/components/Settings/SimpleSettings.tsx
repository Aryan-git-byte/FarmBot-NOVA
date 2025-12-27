import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, Sun, Moon, LogOut, User } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
import LanguageSelectionModal from '../LanguageSelector/LanguageSelectionModal';

const SimpleSettings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { preferences, loading: preferencesLoading, updatePreferences } = useUserPreferences();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      setError(null);
      await setLanguage(newLanguage);
      setSuccess(t('settingsSaved'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update language');
      console.error('Language update error:', err);
    }
  };

  const handleThemeToggle = async () => {
    try {
      setError(null);
      await toggleTheme();
      setSuccess(t('settingsSaved'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update theme');
      console.error('Theme update error:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-20 h-20 mx-auto mb-4">
          <SettingsIcon className="h-12 w-12 text-gray-600 dark:text-gray-400 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('settings')}
        </h1>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-2xl p-4">
          <p className="text-green-700 dark:text-green-400 text-center">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl p-4">
          <p className="text-red-700 dark:text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <User className="h-6 w-6 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('account')}</h2>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{t('email')}:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              Default User
            </span>
          </div>
          
          {preferences && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{t('dateFormat')}:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {preferences.date_format}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{t('timezone')}:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  Mumbai IST
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="h-6 w-6 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('language')}
          </h2>
        </div>
        
        <div className="space-y-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={preferencesLoading}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                language === lang.code
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-green-300 disabled:opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {lang.nativeName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {lang.name}
                  </p>
                </div>
                {language === lang.code && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowLanguageModal(true)}
            className="w-full text-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium py-2"
          >
            {t('selectLanguage')}
          </button>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          {theme === 'light' ? (
            <Sun className="h-6 w-6 text-gray-400" />
          ) : (
            <Moon className="h-6 w-6 text-gray-400" />
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('theme')}
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => theme === 'dark' && handleThemeToggle()}
            disabled={preferencesLoading}
            className={`p-4 rounded-xl border-2 transition-all ${
              theme === 'light'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-green-300 disabled:opacity-50'
            }`}
          >
            <div className="text-center">
              <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="font-medium text-gray-900 dark:text-white">
                {t('lightMode')}
              </p>
            </div>
          </button>

          <button
            onClick={() => theme === 'light' && handleThemeToggle()}
            disabled={preferencesLoading}
            className={`p-4 rounded-xl border-2 transition-all ${
              theme === 'dark'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-green-300 disabled:opacity-50'
            }`}
          >
            <div className="text-center">
              <Moon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="font-medium text-gray-900 dark:text-white">
                {t('darkMode')}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Language Selection Modal */}
      <LanguageSelectionModal
        isOpen={showLanguageModal}
        onLanguageSelect={(lang) => {
          handleLanguageChange(lang);
          setShowLanguageModal(false);
        }}
        onClose={() => setShowLanguageModal(false)}
        showCloseButton={true}
      />
    </div>
  );
};

export default SimpleSettings;