'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: 'i-home' },
  { href: '/qr', label: 'QR generator', icon: 'i-qr' },
  { href: '/file', label: 'File share', icon: 'i-file' },
  { href: '/quick', label: 'Quick Drop', icon: 'i-drop' },
  { href: '/dashboard', label: 'Dashboard', icon: 'i-grid' },
  { href: '/admin', label: 'Admin', icon: 'i-shield' },
  { href: '/login', label: 'Account', icon: 'i-users' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <div className="mark" />
        <div className="word">
          Zero<span>Share</span>
        </div>
      </Link>

      <nav className="sidenav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'active' : ''}
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
  );
}