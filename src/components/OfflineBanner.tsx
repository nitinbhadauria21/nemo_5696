'use client';

import React, { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-[60] bg-amber-600 text-white text-center text-sm font-semibold py-2 px-3"
    >
      Offline — showing last available data (not live)
    </div>
  );
}
