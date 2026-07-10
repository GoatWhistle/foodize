import { useState, useEffect, useRef } from 'react';
import type { CSSProperties, ComponentType } from 'react';
import { useParams } from 'react-router-dom';
import { CookingPot, CheckCircle } from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';
import { createDisplayBoardWebSocket } from '../../services/api';
import { ReliableWebSocket } from '@shared/services/api';
import { restaurantService } from '@shared/services/restaurantService';
import { getOrderStatusStyle } from '@shared/utils/orderStatus';

type OrderId = string | number;

interface StatusStyle {
  color: string;
  bg: string;
  border: string;
  solid: string;
}

const NEW_HIGHLIGHT_MS = 1500;
const COOKING_STYLE = getOrderStatusStyle('COOKING');
const READY_STYLE = getOrderStatusStyle('READY');

export default function DisplayBoardPage() {
  const { restaurantId } = useParams();
  const [cooking, setCooking] = useState<OrderId[]>([]);
  const [ready, setReady] = useState<OrderId[]>([]);
  const [newCooking, setNewCooking] = useState<Set<OrderId>>(new Set());
  const [newReady, setNewReady] = useState<Set<OrderId>>(new Set());
  const [restaurantName, setRestaurantName] = useState('');
  const [error] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const wsRef = useRef<ReliableWebSocket | null>(null);
  const prevCookingRef = useRef<Set<OrderId>>(new Set());
  const prevReadyRef = useRef<Set<OrderId>>(new Set());

  useEffect(() => {
    if (!restaurantId) return;
    restaurantService
      .getById(restaurantId)
      .then((res) => setRestaurantName(res.data?.data?.name || ''))
      .catch(() => {});
  }, [restaurantId]);

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    wsRef.current = createDisplayBoardWebSocket(
      restaurantId,
      (data) => {
        const nextCooking = (data.cooking as OrderId[] | undefined) ?? [];
        const nextReady = (data.ready as OrderId[] | undefined) ?? [];

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
      null,
    );

    return () => {
      wsRef.current?.close();
    };
  }, [restaurantId]);

  if (error) {
    return (
      <div data-theme="dark" style={styles.errorScreen}>
        <span style={styles.errorText}>
          {error === 'forbidden' ? 'Нет доступа' : 'Ошибка подключения'}
        </span>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div data-theme="dark" style={styles.root}>
        <div style={styles.header}>
          <span style={styles.headerName}>{restaurantName}</span>
          <span style={styles.headerTime}>{timeStr}</span>
        </div>
        <div style={styles.columns}>
          <Column
            title="Готовятся"
            Icon={CookingPot}
            ids={cooking}
            newIds={newCooking}
            style={COOKING_STYLE}
          />
          <div style={styles.divider} />
          <Column
            title="Готовы к выдаче"
            Icon={CheckCircle}
            ids={ready}
            newIds={newReady}
            style={READY_STYLE}
          />
        </div>
      </div>
    </>
  );
}

interface ColumnProps {
  title: string;
  Icon: ComponentType<IconProps>;
  ids: OrderId[];
  newIds: Set<OrderId>;
  style: StatusStyle;
}

function Column({ title, Icon, ids, newIds, style }: ColumnProps) {
  return (
    <div style={{ ...styles.column, background: style.bg }}>
      <div style={{ ...styles.columnHeader, color: style.solid }}>
        <Icon size={30} weight="fill" />
        <span>{title}</span>
        <span style={styles.columnCount}>{ids.length}</span>
      </div>
      <div style={styles.grid}>
        {ids.length === 0 ? (
          <div style={styles.empty}>
            <Icon size={48} weight="light" />
            <span style={styles.emptyText}>Пусто</span>
          </div>
        ) : (
          ids.map((id) => (
            <div
              key={id}
              style={{
                ...styles.card,
                borderColor: newIds.has(id) ? style.solid : 'var(--border)',
                boxShadow: newIds.has(id)
                  ? `0 0 32px ${style.border}`
                  : 'none',
                animation: newIds.has(id)
                  ? 'orderSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)'
                  : undefined,
              }}
            >
              <span style={styles.cardNumber}>{id}</span>
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
    transform: scale(0.6) translateY(-16px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
`;

const styles: Record<string, CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: 'var(--bg)',
    color: 'var(--text-1)',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 40px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    flexShrink: 0,
  },
  headerName: {
    color: 'var(--text-1)',
    fontSize: 'clamp(1.4rem, 2vw, 2rem)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  headerTime: {
    color: 'var(--text-3)',
    fontSize: 'clamp(1.2rem, 1.6vw, 1.6rem)',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.04em',
  },
  columns: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  column: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 32px 28px',
    overflow: 'hidden',
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
    fontSize: 'clamp(1.3rem, 1.8vw, 1.9rem)',
    fontWeight: 800,
    letterSpacing: '-0.01em',
    textTransform: 'uppercase',
  },
  columnCount: {
    marginLeft: 'auto',
    fontSize: 'clamp(1.8rem, 2.4vw, 2.6rem)',
    fontWeight: 900,
    letterSpacing: '-0.03em',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: 20,
    alignContent: 'flex-start',
    overflowX: 'auto',
    overflowY: 'hidden',
    flex: 1,
  },
  card: {
    width: 'clamp(150px, 15vw, 200px)',
    height: 'clamp(150px, 15vw, 200px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: 24,
    border: '3px solid',
    background: 'var(--bg-card)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    cursor: 'default',
  },
  cardNumber: {
    fontSize: 'clamp(3rem, 5vw, 5rem)',
    fontWeight: 900,
    color: 'var(--text-1)',
    lineHeight: 1,
    letterSpacing: '-0.04em',
    fontVariantNumeric: 'tabular-nums',
  },
  divider: {
    width: 1,
    background: 'var(--border)',
    margin: '24px 0',
    flexShrink: 0,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    color: 'var(--text-3)',
    marginTop: 56,
    width: '100%',
  },
  emptyText: {
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  errorScreen: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
  },
  errorText: {
    color: 'var(--color-error)',
    fontSize: '1.5rem',
    fontWeight: 700,
    fontFamily: 'var(--font-sans)',
  },
};
