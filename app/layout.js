import './globals.css';
import './hub.css';
import { DM_Sans, Space_Mono } from 'next/font/google';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'Shop POS Hub',
  description: 'Multi-shop POS management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}