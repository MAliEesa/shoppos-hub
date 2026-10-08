import { SHOPS } from '@/lib/shops.config';
import ShopCard from '@/components/ShopCard';
import LogoutButton from '@/components/LogoutButton';

export default function DashboardPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', padding: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 24 }}>Shop POS Hub</h1>
        <LogoutButton />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {SHOPS.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </div>
  );
}