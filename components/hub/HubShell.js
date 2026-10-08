'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import Clock from './Clock';

export default function HubShell({ shops, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      if (localStorage.getItem('hubSidebarCollapsed') === '1') setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleSidebar() {
    if (window.innerWidth <= 800) {
      setMobileOpen(!mobileOpen);
      return;
    }
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('hubSidebarCollapsed', next ? '1' : '0');
    } catch {}
  }

  async function handleLogout() {
    await fetch('/api/session', { method: 'DELETE' });
    router.push('/login');
  }

  const cls = `hub${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`;

  return (
    <div className={cls}>
      <aside className="hub-sidebar">
        <div className="hub-brand">ShopOS Hub</div>

        <nav>
          <Link href="/dashboard" className={`nav-item${pathname === '/dashboard' ? ' active' : ''}`}>
            🏠 Dashboard
          </Link>

          <div className="nav-section">Shops</div>
          {shops.map((s) => (
            <Link key={s.id} href={`/shop/${s.id}`} className="nav-item">
              <span className="nav-dot" style={{ background: s.accentColor }} />
              {s.name}
            </Link>
          ))}

          <div className="nav-section">Hub</div>
          <Link href="/settings" className={`nav-item${pathname === '/settings' ? ' active' : ''}`}>
            ⚙️ Settings
          </Link>
        </nav>

        <div className="hub-sidebar-bottom">
          <button className="nav-item" onClick={handleLogout}>
            🚪 Log out
          </button>
        </div>
      </aside>

      <div className="hub-backdrop" onClick={() => setMobileOpen(false)} />

      <div className="hub-main">
        <header className="hub-topbar">
          <button className="icon-btn" onClick={toggleSidebar} aria-label="Toggle menu">
            ☰
          </button>
          <ThemeToggle />
          <Clock />
        </header>
        <main className="hub-content">{children}</main>
      </div>
    </div>
  );
}