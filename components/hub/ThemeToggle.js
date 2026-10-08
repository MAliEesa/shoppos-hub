'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hubTheme');
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
      }
    } catch {}
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('hubTheme', next);
    } catch {}
  }

  return (
    <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}