import Link from 'next/link';

export default function ShopCard({ shop }) {
  return (
    <Link
      href={`/shop/${shop.id}`}
      style={{
        display: 'block',
        width: 220,
        padding: 24,
        borderRadius: 12,
        background: '#1a1a1a',
        border: `1px solid ${shop.accentColor}`,
        textDecoration: 'none',
        color: '#fff',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: shop.accentColor,
          marginBottom: 14,
        }}
      />
      <h2 style={{ margin: 0, fontSize: 18 }}>{shop.name}</h2>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#999' }}>Open POS</p>
    </Link>
  );
}