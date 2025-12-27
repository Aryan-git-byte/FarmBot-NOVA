import React from 'react';
import { Home, BookOpen, HelpCircle, Settings, Sun, Moon, MessageSquare, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface SimpleNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const SimpleNavigation: React.FC<SimpleNavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'manual-entry', label: t('manualEntry'), icon: BookOpen },
    { id: 'ai-chatbot', label: t('aiAssistant'), icon: MessageSquare },
    { id: 'help', label: t('help'), icon: HelpCircle },
    { id: 'settings', label: t('settings'), icon: Settings }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 rounded-lg p-2">
              <Home className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('farmStatus')}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap min-w-[80px] ${
                    activeTab === tab.id
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SimpleNavigation;