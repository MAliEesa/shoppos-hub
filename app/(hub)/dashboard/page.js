import { SHOPS } from '@/lib/shops.config';
import ShopCard from '@/components/hub/ShopCard';

export default function DashboardPage() {
  return (
    <div className="hub-hero">
      <div className="hub-hero-title">
        <h1>ShopOS</h1>
        <p>Multi-shop control</p>
      </div>

      <div className="shop-grid">
        {SHOPS.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </div>
  );
}