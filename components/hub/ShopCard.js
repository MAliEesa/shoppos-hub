import Link from 'next/link';

export default function ShopCard({ shop }) {
  return (
    <Link
      href={`/shop/${shop.id}`}
      className="shop-card"
      style={{ '--card-accent': shop.accentColor }}
    >
      <div className="shop-card-icon">🏪</div>
      <h2>{shop.name}</h2>
      <p>Open POS</p>
    </Link>
  );
}