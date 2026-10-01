import { cookies, headers } from 'next/headers';
import { createTranslator, isLocale, LOCALE_COOKIE, type Locale } from './i18n';

export const THEME_COOKIE = 'theme';
export type Theme = 'light' | 'dark';

/**
 * The visitor's language: their saved choice if they've picked one,
 * otherwise Thai whenever the browser lists Thai at all, else English.
 */
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;

  const accept = (await headers()).get('accept-language') ?? '';
  return /(^|,)\s*th\b/i.test(accept) ? 'th' : 'en';
}

export async function getT() {
  return createTranslator(await getLocale());
}

/** The saved theme, or null to follow the operating system setting. */
export async function getTheme(): Promise<Theme | null> {
  const saved = (await cookies()).get(THEME_COOKIE)?.value;
  return saved === 'light' || saved === 'dark' ? saved : null;
}
