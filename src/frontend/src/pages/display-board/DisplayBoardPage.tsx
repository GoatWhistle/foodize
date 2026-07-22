import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { CookingPotIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { createDisplayBoardWebSocket } from '../../services/api';
import { ReliableWebSocket } from '@shared/services/api';
import { restaurantService } from '@shared/services/restaurantService';
import { logError } from '@shared/utils/logError';
import { getOrderStatusStyle } from '@shared/utils/orderStatus';
import { useTranslation } from '@shared/i18n/useTranslation';
import { DisplayBoardColumn } from './DisplayBoardColumn';
import { KEYFRAMES, NEW_HIGHLIGHT_MS, styles } from './displayBoardStyles';

type OrderId = string | number;

const COOKING_STYLE = getOrderStatusStyle('ACCEPTED');
const READY_STYLE = getOrderStatusStyle('READY');

export function DisplayBoardPage() {
  const { t } = useTranslation();
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
    void (async () => {
      try {
        const response = await restaurantService.getById(restaurantId);
        setRestaurantName(response.data.data.name || '');
      } catch (error) {
        logError('DisplayBoardPage.getRestaurant', error);
      }
    })();
  }, [restaurantId]);

  useEffect(() => {
    const tick = setInterval(() => { setTime(new Date()); }, 1000);
    return () => { clearInterval(tick); };
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    wsRef.current = createDisplayBoardWebSocket(
      restaurantId,
      (data) => {
        const nextCooking = (data['cooking'] as OrderId[] | undefined) ?? [];
        const nextReady = (data['ready'] as OrderId[] | undefined) ?? [];

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
      <div data-theme="dark" style={styles['errorScreen']}>
        <span style={styles['errorText']}>
          {error === 'forbidden' ? t('staff.displayBoard.noAccess') : t('staff.displayBoard.connectionError')}
        </span>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div data-theme="dark" style={styles['root']}>
        <div style={styles['header']}>
          <span style={styles['headerName']}>{restaurantName}</span>
          <span style={styles['headerTime']}>{timeStr}</span>
        </div>
        <div style={styles['columns']}>
          <DisplayBoardColumn
            title={t('staff.displayBoard.cooking')}
            Icon={CookingPotIcon}
            ids={cooking}
            newIds={newCooking}
            style={COOKING_STYLE}
          />
          <div style={styles['divider']} />
          <DisplayBoardColumn
            title={t('staff.displayBoard.ready')}
            Icon={CheckCircleIcon}
            ids={ready}
            newIds={newReady}
            style={READY_STYLE}
          />
        </div>
      </div>
    </>
  );
}
