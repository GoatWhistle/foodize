import { useState, useEffect } from 'react';

const useElapsedSeconds = (startIso) => {
  const [seconds, setSeconds] = useState(
    startIso ? Math.floor((Date.now() - new Date(startIso)) / 1000) : 0
  );
  useEffect(() => {
    if (!startIso) return;
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - new Date(startIso)) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startIso]);
  return seconds;
};

export default useElapsedSeconds;
