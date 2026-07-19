import { useState, useEffect } from 'react';

export const useElapsedSeconds = (startIso?: string | null): number => {
  const [seconds, setSeconds] = useState<number>(
    startIso ? Math.floor((Date.now() - new Date(startIso).getTime()) / 1000) : 0
  );
  useEffect(() => {
    if (!startIso) return;
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));
    }, 1000);
    return () => { clearInterval(id); };
  }, [startIso]);
  return seconds;
};
