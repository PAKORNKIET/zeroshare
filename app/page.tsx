import Link from 'next/link';

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
          <Link href="/qr" className="btn primary">
            <svg className="icon">
              <use href="#i-qr" />
            </svg>
            Create a QR code
          </Link>
          <Link href="/file" className="btn ghost">
            <svg className="icon">
              <use href="#i-file" />
            </svg>
            Share a file
          </Link>
          <Link href="/quick" className="btn ghost">
            <svg className="icon">
              <use href="#i-drop" />
            </svg>
            Quick Drop
          </Link>
        </div>
      </div>
      <div className="adslot">
        <svg className="icon">
          <use href="#i-mega" />
        </svg>
        Advertisement space — homepage top
      </div>
    </div>
  );
}