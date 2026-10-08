'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/session', { method: 'DELETE' });
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid #333',
        background: 'transparent',
        color: '#999',
        cursor: 'pointer',
      }}
    >
      Log out
    </button>
  );
}