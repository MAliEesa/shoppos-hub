'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) throw new Error('Wrong password');

      router.push(params.get('next') || '/dashboard');
    } catch (err) {
      setError('Wrong password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: 320, maxWidth: '90vw', padding: 24, background: '#1a1a1a', borderRadius: 12, textAlign: 'center' }}>
      <h1 style={{ color: '#fff', marginBottom: 16, fontSize: 20 }}>Shop POS Hub</h1>
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{ width: '100%', padding: 10, marginBottom: 14, borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', textAlign: 'center' }}
      />
      {error && <p style={{ color: '#f66', marginBottom: 10, fontSize: 13 }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600 }}>
        {loading ? 'Checking...' : 'Enter'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f' }}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}