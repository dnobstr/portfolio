import { useEffect, useState } from 'react';

export function useClock(intervalMs = 15_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    const intervalId = window.setInterval(updateClock, intervalMs);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateClock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);

  return now;
}
