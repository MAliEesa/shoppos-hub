export const metadata = {
  title: 'Shop POS Hub',
  description: 'Multi-shop POS management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}