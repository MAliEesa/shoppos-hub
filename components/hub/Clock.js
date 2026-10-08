'use client';

import { useEffect, useState } from 'react';

export default function Clock() {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!now) return <div className="hub-clock" />;

  const text = now.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return <div className="hub-clock">{text}</div>;
}