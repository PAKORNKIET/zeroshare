'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/I18nProvider';
import { LOCALE_COOKIE, type Locale } from '@/lib/i18n';

const YEAR = 60 * 60 * 24 * 365;

function saveCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${YEAR}; samesite=lax`;
}

// ---- Language ----

export function LanguageSwitch({ variant }: { variant: 'segmented' | 'icon' }) {
  const { locale, t } = useI18n();
  const router = useRouter();

  function choose(next: Locale) {
    if (next === locale) return;
    saveCookie(LOCALE_COOKIE, next);
    // Re-render server components (and <html lang>) in the new language;
    // client state stays.
    router.refresh();
  }

  if (variant === 'icon') {
    const next: Locale = locale === 'th' ? 'en' : 'th';
    return (
      <button
        type="button"
        className="icon-btn lang-btn"
        onClick={() => choose(next)}
        aria-label={t('pref.switchLanguage')}
        title={t('pref.switchLanguage')}
      >
        {locale === 'th' ? 'TH' : 'EN'}
      </button>
    );
  }

  return (
    <div className="seg" role="group" aria-label={t('pref.language')}>
      {(['th', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          className={locale === l ? 'active' : ''}
          aria-pressed={locale === l}
          onClick={() => choose(l)}
        >
          {l === 'th' ? 'ไทย' : 'EN'}
        </button>
      ))}
    </div>
  );
}

// ---- Theme ----

const darkQuery = '(prefers-color-scheme: dark)';

function subscribeTheme(onChange: () => void) {
  const mq = window.matchMedia(darkQuery);
  mq.addEventListener('change', onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => {
    mq.removeEventListener('change', onChange);
    observer.disconnect();
  };
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
  saveCookie('theme', theme);
}

function currentTheme(): 'light' | 'dark' {
  const forced = document.documentElement.dataset.theme;
  if (forced === 'light' || forced === 'dark') return forced;
  return window.matchMedia(darkQuery).matches ? 'dark' : 'light';
}

export function ThemeToggle({
  variant,
  serverTheme,
}: {
  variant: 'row' | 'icon';
  serverTheme: 'light' | 'dark' | null;
}) {
  const { t } = useI18n();
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => serverTheme ?? 'light');
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? t('pref.dark') : t('pref.light');

  const icon = (
    <svg className="icon">
      <use href={theme === 'dark' ? '#i-sun' : '#i-moon'} />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <button type="button" className="icon-btn" onClick={() => applyTheme(next)} aria-label={label} title={label}>
        {icon}
      </button>
    );
  }

  return (
    <button type="button" className="pref-row" onClick={() => applyTheme(next)}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
