import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

const LanguageContext = createContext(null);

const SUPPORTED = ["en", "tr"];
const DEFAULT_LANG = "en";
const STORAGE_KEY = "language";

const normalize = (value) => {
  if (!value) return DEFAULT_LANG;
  const short = value.toLowerCase().split("-")[0];
  return SUPPORTED.includes(short) ? short : DEFAULT_LANG;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normalize(stored || i18n.language || DEFAULT_LANG);
  });

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language, i18n]);

  const setLanguage = useCallback((next) => {
    setLanguageState(normalize(next));
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "tr" ? "en" : "tr"));
  }, []);

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    supported: SUPPORTED,
    locale: language === "tr" ? "tr-TR" : "en-US",
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
