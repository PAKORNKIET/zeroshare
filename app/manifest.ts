import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Zero Share',
    short_name: 'Zero Share',
    description: 'Move files without the setup.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#EEF5F3',
    theme_color: '#EEF5F3',
    categories: ['productivity', 'utilities'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Quick Drop', url: '/quick', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Share a file', url: '/file', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Create a QR code', url: '/qr', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
