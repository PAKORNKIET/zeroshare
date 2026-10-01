import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import { getT } from '@/lib/i18n-server';
import type { MessageKey } from '@/lib/i18n';

const actions: { href: string; title: MessageKey; desc: MessageKey; icon: string; tint: number }[] = [
  { href: '/quick', title: 'home.quick.title', desc: 'home.quick.desc', icon: 'i-drop', tint: 1 },
  { href: '/file?mode=live', title: 'home.direct.title', desc: 'home.direct.desc', icon: 'i-send', tint: 2 },
  { href: '/file', title: 'home.link.title', desc: 'home.link.desc', icon: 'i-link', tint: 3 },
  { href: '/qr', title: 'home.qr.title', desc: 'home.qr.desc', icon: 'i-qr', tint: 4 },
];

export default async function HomePage() {
  const t = await getT();

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">{t('home.title')}</h1>
        <p className="sub">{t('home.sub')}</p>
      </div>

      <div className="actions">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="action">
            <span className={`action-icon tint-${a.tint}`}>
              <svg className="icon">
                <use href={`#${a.icon}`} />
              </svg>
            </span>
            <span className="action-text">
              <b>{t(a.title)}</b>
              <span>{t(a.desc)}</span>
            </span>
            <svg className="icon action-chevron">
              <use href="#i-chevron" />
            </svg>
          </Link>
        ))}
      </div>

      <AdSlot placement="homepage_top" />
    </div>
  );
}
