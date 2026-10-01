'use client';

import { createContext, useContext, useMemo } from 'react';
import { createTranslator, type Locale, type Translate } from '@/lib/i18n';

const I18nContext = createContext<{ locale: Locale; t: Translate }>({
  locale: 'th',
  t: createTranslator('th'),
});

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, t: createTranslator(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
