import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext();

const SUPPORTED_LANGUAGES = ['en', 'ro', 'es'];
const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'chatters_language';

// Detect browser language and return supported language code
const detectBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0].toLowerCase();

  if (SUPPORTED_LANGUAGES.includes(langCode)) {
    return langCode;
  }
  return DEFAULT_LANGUAGE;
};

// Get initial language from localStorage or browser detection
const getInitialLanguage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
    return stored;
  }
  return detectBrowserLanguage();
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  // Persist language changes to localStorage
  const setLanguage = (lang) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem(STORAGE_KEY, lang);
    }
  };

  // Translation function
  const t = (key, replacements = {}) => {
    let text = translations[language]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;

    // Handle replacements like {current} and {total}
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(`{${placeholder}}`, value);
    });

    return text;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
