"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Locale = "en" | "vi";

interface I18nContextProps {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (locale: Locale) => void;
  isTranslationsLoaded: boolean;
}

const I18nContext = createContext<I18nContextProps>({
  locale: "en",
  t: (key) => key,
  setLocale: () => {},
  isTranslationsLoaded: false,
});

export const I18nProvider = ({
  children,
  defaultLocale = "en",
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) => {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTranslationsLoaded, setIsTranslationsLoaded] = useState(false);

  // Load saved locale from localStorage on initial mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('nkc-locale');
    if (savedLocale === 'en' || savedLocale === 'vi') {
      setLocaleState(savedLocale);
    }
    setIsLoaded(true);
  }, []);

  // Custom setLocale function that persists to localStorage
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('nkc-locale', newLocale);
  };

  // Fetch translations whenever locale changes (but only after initial localStorage check)
  useEffect(() => {
    if (isLoaded) {
      setIsTranslationsLoaded(false);
      fetch(`/locales/${locale}/common.json`)
        .then((res) => res.json())
        .then((data) => {
          setTranslations(data);
          setIsTranslationsLoaded(true);
        })
        .catch((error) => {
          console.error('Failed to load translations:', error);
          setIsTranslationsLoaded(true); // Set to true even on error to prevent infinite loading
        });
    }
  }, [locale, isLoaded]);
  // Translation function
  const t = (key: string) => {
    const translation = translations[key];
    if (!translation && isTranslationsLoaded) {
      console.warn(`Missing translation for key: ${key} in locale: ${locale}`);
    }
    return translation || key;
  };

  // Only render children after initial localStorage check to avoid hydration mismatch
  return (
    <I18nContext.Provider value={{ locale, t, setLocale, isTranslationsLoaded }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
