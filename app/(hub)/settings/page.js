import { SHOPS } from '@/lib/shops.config';

export default function SettingsPage() {
  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Hub-wide settings. Settings for one shop stay inside that shop.</p>

      <section className="panel">
        <h2>Shops</h2>
        {SHOPS.map((s) => (
          <div key={s.id} className="shop-row">
            <span className="nav-dot" style={{ background: s.accentColor }} />
            <div>
              <div className="shop-row-name">{s.name}</div>
              <div className="shop-row-meta">
                {s.id} · {s.firebaseConfig.projectId}
              </div>
            </div>
          </div>
        ))}
        <p className="panel-note">
          Adding and editing shops from this page comes after the POS screens are moved in.
        </p>
      </section>
    </div>
  );
}