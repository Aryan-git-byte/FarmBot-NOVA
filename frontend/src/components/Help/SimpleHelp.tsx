import React from 'react';
import { HelpCircle, CheckCircle, AlertTriangle, XCircle, Smartphone, Wifi } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import StatusIndicator from '../Common/StatusIndicator';

const SimpleHelp: React.FC = () => {
  const { t } = useLanguage();


  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-4 w-20 h-20 mx-auto mb-4">
          <HelpCircle className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('helpTitle')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('simpleFarmMonitoringDesc')}
        </p>
      </div>

      {/* Color Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          {t('understandingColors')}
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <StatusIndicator status="optimal" size="large" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('everythingGood')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('everythingGoodDesc')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <StatusIndicator status="warning" size="large" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('checkSoon')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('checkSoonDesc')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <StatusIndicator status="critical" size="large" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('takeActionNow')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('takeActionNowDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Smartphone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('usingOnMobile')}</h3>
          </div>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• {t('tapRefreshButton')}</li>
            <li>• {t('usePlusButton')}</li>
            <li>• {t('swipeLeftRight')}</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Wifi className="h-8 w-8 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('internetConnection')}</h3>
          </div>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• {t('worksSlowInternet')}</li>
            <li>• {t('dataSavedAutomatically')}</li>
            <li>• {t('addDataOffline')}</li>
          </ul>
        </div>
      </div>

      {/* Common Questions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          {t('commonQuestions')}
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {t('howOftenCheck')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('howOftenCheckAnswer')}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {t('whatRedStatus')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('whatRedStatusAnswer')}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {t('useWithoutSensors')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('useWithoutSensorsAnswer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleHelp;