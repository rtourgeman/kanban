import { useEffect, useState } from 'react';

export function OfflineIndicator(): JSX.Element {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

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

  return (
    <div className={`offline-indicator ${online ? 'online' : 'offline'}`} role="status">
      {online ? 'שמירה מקומית פעילה' : 'אין חיבור - הנתונים נשמרים מקומית'}
    </div>
  );
}
