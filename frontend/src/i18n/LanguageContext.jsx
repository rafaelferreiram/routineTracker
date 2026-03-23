import { createContext, useContext, useState, useEffect } from 'react';
import { t as translate, LANGUAGES } from './translations';

const LanguageContext = createContext();

const STORAGE_KEY = 'routinetracker_language';

/**
 * Detect user's preferred language from browser settings
 */
function detectBrowserLanguage() {
  const browserLang = navigator.language?.split('-')[0] || 'en';
  return ['en', 'pt', 'es', 'de'].includes(browserLang) ? browserLang : 'en';
}

/**
 * Language Provider Component
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    // Try to get from localStorage first
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['en', 'pt', 'es', 'de'].includes(saved)) {
      return saved;
    }
    // Otherwise detect from browser
    return detectBrowserLanguage();
  });

  // Persist language change
  const setLanguage = (lang) => {
    if (['en', 'pt', 'es', 'de'].includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem(STORAGE_KEY, lang);
      // Update document lang attribute
      document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
    }
  };

  // Set initial document language
  useEffect(() => {
    document.documentElement.lang = language === 'pt' ? 'pt-BR' : language;
  }, [language]);

  // Translation function bound to current language
  const t = (path) => translate(path, language);

  const value = {
    language,
    setLanguage,
    t,
    languages: LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to use language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
