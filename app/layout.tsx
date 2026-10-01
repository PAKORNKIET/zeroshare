import type { Metadata, Viewport } from 'next';
import './globals.css';
import IconSprite from '@/components/IconSprite';
import Sidebar from '@/components/Sidebar';
import { I18nProvider } from '@/components/I18nProvider';
import { getLocale, getTheme } from '@/lib/i18n-server';

export const metadata: Metadata = {
  title: 'Zero Share',
  description: 'Move files without the setup.',
  applicationName: 'Zero Share',
  appleWebApp: {
    capable: true,
    title: 'Zero Share',
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F6F4' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1211' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);

  return (
    <html lang={locale} data-theme={theme ?? undefined}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Anuphan:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider locale={locale}>
          <IconSprite />
          <div className="shell">
            <Sidebar serverTheme={theme} />
            <main className="content">{children}</main>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
