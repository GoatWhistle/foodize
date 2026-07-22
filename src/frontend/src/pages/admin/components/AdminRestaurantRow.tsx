import type { Dispatch, SetStateAction } from 'react';
import { MonitorIcon, StarIcon } from '@phosphor-icons/react';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { AdminRestaurant } from '../hooks/useAdminRestaurants';

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
};

interface AdminRestaurantRowProps {
  restaurant: AdminRestaurant;
  selectedRestaurantIds: Set<string>;
  setSelectedRestaurantIds: Dispatch<SetStateAction<Set<string>>>;
  loadRestaurantDetails: (id: string) => void;
}

export function AdminRestaurantRow({
  restaurant,
  selectedRestaurantIds,
  setSelectedRestaurantIds,
  loadRestaurantDetails,
}: AdminRestaurantRowProps) {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="checkbox"
        checked={selectedRestaurantIds.has(restaurant.id)}
        onChange={(e) => {
          setSelectedRestaurantIds((prev) => {
            const next = new Set(prev);
            if (e.target.checked) next.add(restaurant.id);
            else next.delete(restaurant.id);
            return next;
          });
        }}
        style={{ flexShrink: 0 }}
      />
      <button
        type="button"
        onClick={() => { loadRestaurantDetails(restaurant.id); }}
        style={{
          ...cardStyle,
          padding: 16,
          flex: 1,
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div>
          <div style={{ color: 'var(--text-1)', fontWeight: 900 }}>{restaurant.name}</div>
          <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)", marginTop: 4 }}>
            {restaurant.address}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span
              className={`order-status-badge ${restaurant.is_open ? 'ready' : 'cancelled'}`}
            >
              {restaurant.is_open ? t('admin.restaurants.row.open') : t('admin.restaurants.row.closed')}
            </span>
            <span
              className={`order-status-badge ${restaurant.is_hiring ? 'pending' : 'cancelled'}`}
            >
              {restaurant.is_hiring ? t('admin.restaurants.row.hiring') : t('admin.restaurants.row.notHiring')}
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 6,
          }}
        >
          <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)", textAlign: 'right' }}>
            {t('admin.restaurants.row.ordersCount', { count: restaurant.orders_count || 0 })}
            <br />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <StarIcon size={14} weight="fill" color="var(--star)" /> {restaurant.average_rating || 0}
            </span>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                `/display-board/${restaurant.id}`,
                '_blank',
                'noopener,noreferrer'
              );
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              color: 'var(--text-3)',
              padding: '3px 7px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <MonitorIcon size={11} />
            {t('admin.restaurants.row.displayBoard')}
          </div>
        </div>
      </button>
    </div>
  );
}
