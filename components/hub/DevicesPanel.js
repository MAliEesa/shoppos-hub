'use client';

import { useEffect, useState } from 'react';

const btn = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid var(--border2)',
  background: 'var(--bg3)',
  color: 'var(--text)',
  fontSize: '0.8rem',
  cursor: 'pointer',
};

function ago(iso) {
  if (!iso) return 'never';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

export default function DevicesPanel() {
  const [shops, setShops] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/devices', { cache: 'no-store' });
      if (!res.ok) throw new Error('bad');
      const data = await res.json();
      setShops(data.shops);
      setError('');
    } catch {
      setError('Could not load devices.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(body) {
    setBusy(true);
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('bad');
      await load();
    } catch {
      setError('That did not work. Try again.');
    }
    setBusy(false);
  }

  function rename(shopId, d) {
    const name = window.prompt('New name for this device:', d.name);
    if (name === null || !name.trim()) return;
    act({ shopId, key: d.key, action: 'rename', name });
  }

  function remove(shopId, d) {
    if (!window.confirm(`Remove "${d.name}"? It will have to type the admin password again.`)) return;
    act({ shopId, key: d.key, action: 'remove' });
  }

  return (
    <section className="panel" style={{ marginBottom: 20 }}>
      <h2>Admin devices</h2>
      <p className="panel-note" style={{ marginTop: 0, marginBottom: 12 }}>
        A device appears here after someone types the correct admin password on it. Approve it to skip the
        password on that device. Leave it unapproved to always ask. Never approve the workers&apos; shop laptop.
      </p>

      {error && <p style={{ color: '#f66', fontSize: 13 }}>{error}</p>}
      {!shops && !error && <p className="panel-note">Loading...</p>}

      {shops &&
        shops.map((s) => (
          <div key={s.id} style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <span className="nav-dot" style={{ background: s.accentColor }} />
              {s.name}
            </div>
            {s.error && <p className="panel-note">Could not read this shop&apos;s devices.</p>}
            {!s.error && s.devices.length === 0 && <p className="panel-note">No devices yet.</p>}
            {s.devices.map((d) => (
              <div
                key={d.key}
                className="shop-row"
                style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}
              >
                <div>
                  <div className="shop-row-name">
                    {d.name}{' '}
                    <span style={{ fontSize: '0.75rem', color: d.approved ? 'var(--accent2)' : 'var(--text3)' }}>
                      {d.approved ? '· approved' : '· asks password'}
                    </span>
                  </div>
                  <div className="shop-row-meta">last used {ago(d.lastSeen)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    style={btn}
                    disabled={busy}
                    onClick={() => act({ shopId: s.id, key: d.key, action: d.approved ? 'unapprove' : 'approve' })}
                  >
                    {d.approved ? 'Unapprove' : 'Approve'}
                  </button>
                  <button style={btn} disabled={busy} onClick={() => rename(s.id, d)}>
                    Rename
                  </button>
                  <button style={btn} disabled={busy} onClick={() => remove(s.id, d)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
    </section>
  );
}