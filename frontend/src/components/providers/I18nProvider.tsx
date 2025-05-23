'use client';

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { 
  I18nContext,
  createTranslator,
  formatDate,
  formatTime,
  formatCurrency,
  formatNumber,
  detectBrowserLocale,
  saveLocaleToStorage,
  getLocaleFromStorage,
  isRTLLocale
} from '@/lib/i18n';
import { Locale, Namespace, defaultLocale, isValidLocale, getLocaleDirection } from '@/lib/i18n/config';

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export const I18nProvider = ({ children, initialLocale }: I18nProviderProps) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Priority: prop > localStorage > browser > default
    if (initialLocale && isValidLocale(initialLocale)) {
      return initialLocale;
    }
    
    const storedLocale = getLocaleFromStorage();
    if (storedLocale) {
      return storedLocale;
    }
    
    return detectBrowserLocale();
  });

  const setLocale = (newLocale: Locale) => {
    if (isValidLocale(newLocale)) {
      setLocaleState(newLocale);
      saveLocaleToStorage(newLocale);
      
      // Update HTML lang attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
        document.documentElement.dir = getLocaleDirection(newLocale);
      }
    }
  };

  const t = useMemo(() => createTranslator(locale), [locale]);

  const contextValue = useMemo(() => ({
    locale,
    setLocale,
    t,
    formatDate: (date: Date | string) => formatDate(date, locale),
    formatTime: (date: Date | string) => formatTime(date, locale),
    formatCurrency: (amount: number) => formatCurrency(amount, locale),
    formatNumber: (number: number) => formatNumber(number, locale),
    isRTL: isRTLLocale(locale),
  }), [locale, t]);

  // Set initial HTML attributes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = getLocaleDirection(locale);
    }
  }, [locale]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};