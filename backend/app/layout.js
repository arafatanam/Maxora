import { Inter, Sora } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', weight: ['400', '500', '600', '700'], display: 'swap' });

export const metadata = {
  title: { default: 'Maxora', template: '%s · Maxora' },
  description: 'An honest AI read on your facial features, with a focused plan to improve. Free, no sign-up.',
  applicationName: 'Maxora',
  appleWebApp: { title: 'Maxora', statusBarStyle: 'black-translucent' },
};
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#161513', colorScheme: 'dark' };

export default function Root({ children }) {
  return <html lang="en" className={`${inter.variable} ${sora.variable}`}><body>{children}</body></html>;
}
