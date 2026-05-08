import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { createDisplayBoardWebSocket } from '../../services/api';

const RETRY_DELAY_MS = 3000;
const NEW_HIGHLIGHT_MS = 1500;

export default function DisplayBoardPage() {
  const { restaurantId } = useParams();
  const [cooking, setCooking] = useState([]);
  const [ready, setReady] = useState([]);
  const [newCooking, setNewCooking] = useState(new Set());
  const [newReady, setNewReady] = useState(new Set());
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const retryRef = useRef(null);
  const prevCookingRef = useRef(new Set());
  const prevReadyRef = useRef(new Set());

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      wsRef.current = createDisplayBoardWebSocket(
        restaurantId,
        (data) => {
          if (data.error) {
            setError(data.error);
            return;
          }

          const nextCooking = data.cooking ?? [];
          const nextReady = data.ready ?? [];

          const addedCooking = nextCooking.filter(
            (id) => !prevCookingRef.current.has(id)
          );
          const addedReady = nextReady.filter(
            (id) => !prevReadyRef.current.has(id)
          );

          prevCookingRef.current = new Set(nextCooking);
          prevReadyRef.current = new Set(nextReady);

          setCooking(nextCooking);
          setReady(nextReady);

          if (addedCooking.length > 0) {
            setNewCooking((prev) => new Set([...prev, ...addedCooking]));
            setTimeout(() => {
              setNewCooking((prev) => {
                const next = new Set(prev);
                addedCooking.forEach((id) => next.delete(id));
                return next;
              });
            }, NEW_HIGHLIGHT_MS);
          }

          if (addedReady.length > 0) {
            setNewReady((prev) => new Set([...prev, ...addedReady]));
            setTimeout(() => {
              setNewReady((prev) => {
                const next = new Set(prev);
                addedReady.forEach((id) => next.delete(id));
                return next;
              });
            }, NEW_HIGHLIGHT_MS);
          }
        },
        () => {
          if (!cancelled) {
            retryRef.current = setTimeout(connect, RETRY_DELAY_MS);
          }
        }
      );
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [restaurantId]);

  if (error) {
    return (
      <div style={styles.errorScreen}>
        <span style={styles.errorText}>
          {error === 'forbidden' ? 'Нет доступа' : 'Ошибка подключения'}
        </span>
      </div>
    );
  }

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={styles.root}>
        <Column
          title="Готовятся"
          ids={cooking}
          newIds={newCooking}
          accentColor="#f97316"
          bgColor="#f9731612"
        />
        <div style={styles.divider} />
        <Column
          title="Готовы к выдаче"
          ids={ready}
          newIds={newReady}
          accentColor="#22c55e"
          bgColor="#22c55e12"
        />
      </div>
    </>
  );
}

function Column({ title, ids, newIds, accentColor, bgColor }) {
  return (
    <div style={{ ...styles.column, background: bgColor }}>
      <div style={{ ...styles.columnHeader, color: accentColor }}>{title}</div>
      <div style={styles.grid}>
        {ids.length === 0 ? (
          <div style={styles.empty}>—</div>
        ) : (
          ids.map((id) => (
            <div
              key={id}
              style={{
                ...styles.card,
                borderColor: accentColor,
                animation: newIds.has(id)
                  ? 'orderSlideIn 0.4s ease forwards'
                  : undefined,
              }}
            >
              {id}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const KEYFRAMES = `
@keyframes orderSlideIn {
  from {
    opacity: 0;
    transform: scale(0.7) translateY(-12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
`;

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    background: '#0f0f0f',
    overflow: 'hidden',
    fontFamily: 'Manrope, sans-serif',
  },
  column: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 24px',
    overflow: 'hidden',
  },
  columnHeader: {
    fontSize: '1.5rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: 24,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    alignContent: 'flex-start',
    overflowY: 'auto',
    flex: 1,
  },
  card: {
    width: 120,
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    fontWeight: 900,
    color: '#fff',
    borderRadius: 16,
    border: '2px solid',
    background: '#1a1a1a',
    letterSpacing: '-0.03em',
    transition: 'transform 0.15s ease',
  },
  divider: {
    width: 1,
    background: '#2a2a2a',
    margin: '24px 0',
  },
  empty: {
    color: '#444',
    fontSize: '2rem',
    fontWeight: 700,
    marginTop: 40,
  },
  errorScreen: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f0f',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '1.25rem',
    fontWeight: 700,
    fontFamily: 'Manrope, sans-serif',
  },
};
