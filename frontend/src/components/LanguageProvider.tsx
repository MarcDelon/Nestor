'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import frMessages from '../../messages/fr.json';
import enMessages from '../../messages/en.json';

const LanguageContext = createContext({ locale: 'fr', setLocale: (_: string) => {} });
export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState('fr');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' ? sessionStorage.getItem('safetrip_locale') : null) || 'fr';
    setLocaleState(saved);
  }, []);

  const setLocale = (lang: string) => {
    sessionStorage.setItem('safetrip_locale', lang);
    setLocaleState(lang);
  };

  const messages = locale === 'en' ? enMessages : frMessages;

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Douala">
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}
