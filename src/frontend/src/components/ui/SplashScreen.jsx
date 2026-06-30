import { useState, useEffect } from 'react';
import FoodizeLogo from './FoodizeLogo';

const SplashScreen = ({ onDone }) => {
  const [phase, setPhase] = useState('in');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), 1400);
    const t2 = setTimeout(() => {
      setHidden(true);
      onDone();
    }, 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      aria-hidden="true"
      className={`splash-screen${hidden ? ' hidden' : ''}`}
      style={{
        flexDirection: 'column',
        gap: '32px',
        background: 'var(--ink)',
        transition: 'opacity 500ms cubic-bezier(0.16,1,0.3,1)',
        opacity: phase === 'out' ? 0 : 1,
      }}
    >
      <div
        style={{
          animation: 'splash-logo-in 600ms cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <FoodizeLogo size={44} color="var(--fire-text)" />
      </div>

      <div
        style={{
          width: 32,
          height: 2,
          borderRadius: 2,
          background: 'oklch(96% 0 0 / 0.15)',
          overflow: 'hidden',
          animation:
            'splash-logo-in 600ms 120ms cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'var(--fire)',
            animation:
              'splash-bar 900ms 300ms cubic-bezier(0.16,1,0.3,1) forwards',
            width: '0%',
          }}
        />
      </div>

    </div>
  );
};

export default SplashScreen;
