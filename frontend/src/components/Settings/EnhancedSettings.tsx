import React, { useState } from 'react';
import { Settings as SettingsIcon, MapPin, Database, Globe, Sun, Moon, LogOut, User } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import LocationSettings from './LocationSettings';
import MockDataSettings from './MockDataSettings';

const EnhancedSettings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    {
      id: 'general',
      title: language === 'hi' ? 'सामान्य' : 'General',
      icon: SettingsIcon
    },
    {
      id: 'location',
      title: language === 'hi' ? 'स्थान' : 'Location',
      icon: MapPin
    },
    {
      id: 'data',
      title: language === 'hi' ? 'डेटा' : 'Data',
      icon: Database
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'location':
        return <LocationSettings />;
      case 'data':
        return <MockDataSettings />;
      default:
        return (
          <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Account Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="h-6 w-6 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('account')}</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('email')}:</span>
                  <span className="text-gray-900 dark:text-white">
                    Default User
                  </span>
                </div>
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
                {[
                  { code: 'hi', name: 'हिंदी', nativeName: 'Hindi' },
                  { code: 'en', name: 'English', nativeName: 'English' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      language === lang.code
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {lang.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {lang.nativeName}
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
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === 'light'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
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
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
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
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('settings')}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSettings;