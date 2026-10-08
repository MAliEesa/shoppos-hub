import './globals.css';

export const metadata = {
  title: 'Shop POS Hub',
  description: 'Multi-shop POS management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}