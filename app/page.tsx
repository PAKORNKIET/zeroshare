import Link from 'next/link';
import AdSlot from '@/components/AdSlot';

const tools = [
  {
    href: '/quick',
    title: 'Quick Drop',
    blurb: 'Drop a file, get a link and QR in seconds.',
    icon: 'i-drop',
    tone: 'mint',
  },
  {
    href: '/file',
    title: 'File share',
    blurb: 'Send live to one device, or make a temporary link.',
    icon: 'i-file',
    tone: 'peach',
  },
  {
    href: '/qr',
    title: 'QR generator',
    blurb: 'Turn any link or text into a scannable code.',
    icon: 'i-qr',
    tone: 'lilac',
  },
  {
    href: '/dashboard',
    title: 'Dashboard',
    blurb: 'Everything you have shared while signed in.',
    icon: 'i-grid',
    tone: 'sky',
  },
];

export default function HomePage() {
  return (
    <div>
      <div className="card hero">
        <div className="eyebrow">
          <svg className="icon">
            <use href="#i-link" />
          </svg>
          No account required
        </div>
        <h1>Move files without the setup.</h1>
        <p className="sub">
          Generate a QR code, share a link, or drop a file — anything you send
          here disappears on its own.
        </p>
        <div className="cta-row">
          <Link href="/quick" className="btn primary">
            <svg className="icon">
              <use href="#i-drop" />
            </svg>
            Start a Quick Drop
          </Link>
          <Link href="/qr" className="btn ghost">
            <svg className="icon">
              <use href="#i-qr" />
            </svg>
            Create a QR code
          </Link>
        </div>
      </div>

      <div className="section-head">
        <h2>Tools</h2>
      </div>
      <div className="tiles">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className={`tile ${t.tone}`}>
            <div className="tile-icon">
              <svg className="icon">
                <use href={`#${t.icon}`} />
              </svg>
            </div>
            <span className="tile-arrow" aria-hidden="true">
              &rarr;
            </span>
            <b>{t.title}</b>
            <span>{t.blurb}</span>
          </Link>
        ))}
      </div>

      <AdSlot placement="homepage_top" />
    </div>
  );
}
