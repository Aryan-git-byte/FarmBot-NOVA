import React, { useState } from 'react';
import { Globe, ArrowRight, X } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../config/languages';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onLanguageSelect: (language: string) => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({ 
  isOpen, 
  onLanguageSelect, 
  onClose,
  showCloseButton = false 
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const handleContinue = () => {
    if (selectedLanguage) {
      onLanguageSelect(selectedLanguage);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close language selection"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          <div className="text-center">
            <div className="bg-green-600 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <Globe className="h-8 w-8 text-white mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Select Language / भाषा चुनें
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose your preferred language<br />
              <span className="text-sm">अपनी पसंदीदा भाषा चुनें</span>
            </p>
          </div>
        </div>

        {/* Language Options */}
        <div className="p-6">
          <div className="space-y-3 mb-6">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedLanguage === lang.code
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-300 hover:bg-green-25 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {lang.nativeName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{lang.name}</p>
                  </div>
                  {selectedLanguage === lang.code && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedLanguage}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-medium text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <span>Continue / जारी रखें</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Simple farm monitoring for better harvests<br />
              बेहतर फसल के लिए सरल खेत निगरानी
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectionModal;