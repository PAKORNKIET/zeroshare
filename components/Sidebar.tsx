'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', short: 'Home', icon: 'i-home' },
  { href: '/qr', label: 'QR generator', short: 'QR', icon: 'i-qr' },
  { href: '/file', label: 'File share', short: 'Files', icon: 'i-file' },
  { href: '/quick', label: 'Quick Drop', short: 'Drop', icon: 'i-drop' },
  { href: '/dashboard', label: 'Dashboard', short: 'Mine', icon: 'i-grid' },
  { href: '/admin', label: 'Admin', short: 'Admin', icon: 'i-shield' },
  { href: '/login', label: 'Account', short: 'Account', icon: 'i-users' },
];

// On phones the five main destinations live in the bottom tab bar; account
// and admin move up into the top bar.
const tabItems = navItems.filter((i) => !['/admin', '/login'].includes(i.href));
const topItems = navItems.filter((i) => ['/admin', '/login'].includes(i.href));

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Zero Share home">
      <div className="mark" />
      <div className="word">
        Zero<span>Share</span>
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
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
              title={item.label}
              className={isActive(item.href) ? 'active' : ''}
            >
              <svg className="icon">
                <use href={`#${item.icon}`} />
              </svg>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="side-footer">About &middot; Privacy &middot; Terms &middot; Contact</div>
      </aside>

      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          {topItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`icon-btn ${isActive(item.href) ? 'active' : ''}`}
            >
              <svg className="icon">
                <use href={`#${item.icon}`} />
              </svg>
            </Link>
          ))}
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
            <span>{item.short}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
