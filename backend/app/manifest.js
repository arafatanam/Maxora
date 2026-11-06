export default function manifest() {
  return {
    name: 'Maxora',
    short_name: 'Maxora',
    description: 'An honest AI read on your facial features, with a focused plan to improve.',
    start_url: '/',
    display: 'standalone',
    background_color: '#150D2E',
    theme_color: '#150D2E',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
