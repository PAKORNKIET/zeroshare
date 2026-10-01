'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/components/I18nProvider';
import { LanguageSwitch, ThemeToggle } from '@/components/Preferences';
import type { MessageKey } from '@/lib/i18n';

const navItems: { href: string; label: MessageKey; short: MessageKey; icon: string }[] = [
  { href: '/', label: 'nav.home', short: 'tab.home', icon: 'i-home' },
  { href: '/qr', label: 'nav.qr', short: 'tab.qr', icon: 'i-qr' },
  { href: '/file', label: 'nav.file', short: 'tab.file', icon: 'i-file' },
  { href: '/quick', label: 'nav.quick', short: 'tab.quick', icon: 'i-drop' },
  { href: '/dashboard', label: 'nav.dashboard', short: 'tab.dashboard', icon: 'i-grid' },
  { href: '/login', label: 'nav.account', short: 'nav.account', icon: 'i-users' },
];

// On phones the five main destinations live in the bottom tab bar; account
// moves up into the top bar.
const tabItems = navItems.filter((i) => i.href !== '/login');
const accountItem = navItems.find((i) => i.href === '/login')!;

function Brand() {
  const { t } = useI18n();
  return (
    <Link href="/" className="brand" aria-label={t('brand.home')}>
      <div className="mark" />
      <div className="word">
        Zero<span>Share</span>
      </div>
    </Link>
  );
}

export default function Sidebar({ serverTheme }: { serverTheme: 'light' | 'dark' | null }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <aside className="sidebar">
        <Brand />

        <nav className="sidenav" aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={t(item.label)}
              className={isActive(item.href) ? 'active' : ''}
            >
              <svg className="icon">
                <use href={`#${item.icon}`} />
              </svg>
              <span>{t(item.label)}</span>
            </Link>
          ))}
        </nav>

        <div className="prefs">
          <div className="prefs-full">
            <LanguageSwitch variant="segmented" />
            <ThemeToggle variant="row" serverTheme={serverTheme} />
          </div>
          <div className="prefs-compact">
            <LanguageSwitch variant="icon" />
            <ThemeToggle variant="icon" serverTheme={serverTheme} />
          </div>
        </div>

        <div className="side-footer">{t('footer.links')}</div>
      </aside>

      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          <LanguageSwitch variant="icon" />
          <ThemeToggle variant="icon" serverTheme={serverTheme} />
          <Link
            href={accountItem.href}
            aria-label={t(accountItem.label)}
            className={`icon-btn ${isActive(accountItem.href) ? 'active' : ''}`}
          >
            <svg className="icon">
              <use href={`#${accountItem.icon}`} />
            </svg>
          </Link>
        </div>
      </header>

      <nav className="tabbar" aria-label="Main">
        {tabItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(item.href) ? 'active' : ''}
          >
            <svg className="icon">
              <use href={`#${item.icon}`} />
            </svg>
            <span>{t(item.short)}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
