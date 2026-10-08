import { useEffect, useState } from 'react';

export default function OfflineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const markOnline = () => setOnline(true);
    const markOffline = () => setOnline(false);
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  if (online) return null;
  return <p role="status" className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">Offline: cached screens are available, but account and campus-data actions need an internet connection.</p>;
}