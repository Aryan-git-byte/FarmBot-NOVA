import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { translations, TranslationKey, DEFAULT_LANGUAGE } from '../config/languages';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    const saved = localStorage.getItem('farmMonitor_language');
    return saved || DEFAULT_LANGUAGE;
  });
  const [loading, setLoading] = useState(false);

  const setLanguage = useCallback(async (lang: string) => {
    setLoading(true);
    try {
      // Update local state and localStorage immediately
      setLanguageState(lang);
      localStorage.setItem('farmMonitor_language', lang);
      document.documentElement.lang = lang;
    } catch (error) {
      console.error('Error updating language preference:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced translation function with fallback mechanism
  const t = useCallback((key: TranslationKey): string => {
    const langTranslations = translations[language as keyof typeof translations];
    
    // Try to get translation for current language
    if (langTranslations && langTranslations[key]) {
      return langTranslations[key];
    }
    
    // Fallback to English if translation not found
    if (translations.en[key]) {
      return translations.en[key];
    }
    
    // Final fallback: return the key itself
    console.warn(`Translation missing for key: ${key} in language: ${language}`);
    return key;
  }, [language]);

  // Initialize language on mount
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};