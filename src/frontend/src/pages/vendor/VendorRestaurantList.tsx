import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { HouseIcon, PlusIcon, CaretRightIcon } from '@phosphor-icons/react';
import EmptyState from '@shared/components/EmptyState/EmptyState';
import type { Restaurant } from '@shared/types/models';
import type { NewRestaurantForm, VendorProfile } from './hooks/useVendorRestaurants';

interface VendorRestaurantListProps {
  restaurants: Restaurant[];
  loading: boolean;
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: Dispatch<SetStateAction<Restaurant | null>>;
  vendorProfile: VendorProfile | null;
  showAddRestaurant: boolean;
  setShowAddRestaurant: Dispatch<SetStateAction<boolean>>;
  newRestaurant: NewRestaurantForm;
  setNewRestaurant: Dispatch<SetStateAction<NewRestaurantForm>>;
  formError: string;
  formLoading: boolean;
  handleCreateRestaurant: (e: FormEvent<HTMLFormElement>) => void;
}

export default function VendorRestaurantList({
  restaurants,
  loading,
  selectedRestaurant,
  setSelectedRestaurant,
  vendorProfile,
  showAddRestaurant,
  setShowAddRestaurant,
  newRestaurant,
  setNewRestaurant,
  formError,
  formLoading,
  handleCreateRestaurant,
}: VendorRestaurantListProps) {
  return (
    <div className="vendor-section">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span
          className="vendor-section-title"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <HouseIcon /> Мои заведения
        </span>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setShowAddRestaurant(!showAddRestaurant); }}
          disabled={vendorProfile?.approval_status !== 'APPROVED'}
          title={
            vendorProfile?.approval_status !== 'APPROVED'
              ? 'Дождитесь одобрения профиля'
              : ''
          }
        >
          <PlusIcon size={16} /> Добавить
        </button>
      </div>

      {showAddRestaurant && (
        <form
          onSubmit={handleCreateRestaurant}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Новое заведение</h3>
          {formError && <div className="form-error">{formError}</div>}
          <input
            className="form-input"
            placeholder="Название"
            value={newRestaurant.name}
            onChange={(e) => { setNewRestaurant({ ...newRestaurant, name: e.target.value }); }}
            required
          />
          <input
            className="form-input"
            placeholder="Адрес"
            value={newRestaurant.address}
            onChange={(e) => { setNewRestaurant({ ...newRestaurant, address: e.target.value }); }}
            required
          />
          <input
            className="form-input"
            type="number"
            min="1"
            max="240"
            placeholder="Среднее время приготовления, минут"
            value={newRestaurant.avg_prep_time_minutes}
            onChange={(e) =>
              { setNewRestaurant({ ...newRestaurant, avg_prep_time_minutes: e.target.value }); }
            }
          />
          <input
            className="form-input"
            type="number"
            min="1"
            max="1000"
            placeholder="Мягкий лимит активных заказов"
            value={newRestaurant.max_active_orders}
            onChange={(e) =>
              { setNewRestaurant({ ...newRestaurant, max_active_orders: e.target.value }); }
            }
          />
          <button type="submit" className="btn btn-primary" disabled={formLoading}>
            Создать
          </button>
        </form>
      )}

      {loading && (!Array.isArray(restaurants) || restaurants.length === 0) ? (
        <div className="restaurant-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="restaurant-row" style={{ opacity: 1, cursor: 'default' }}>
              <div style={{ flex: 1 }}>
                <div
                  className="skeleton"
                  style={{ width: '60%', height: 16, marginBottom: 8, borderRadius: 4 }}
                />
                <div className="skeleton" style={{ width: '40%', height: 12, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : !Array.isArray(restaurants) || restaurants.length === 0 ? (
        <EmptyState title="Нет заведений" subtitle="Добавьте первое заведение" />
      ) : (
        <div className={`restaurant-list${loading ? ' loading-dim' : ''}`}>
          {restaurants.map((r) => (
            <div
              key={r.id}
              className={`restaurant-row${selectedRestaurant?.id === r.id ? ' active' : ''}`}
              onClick={() => { setSelectedRestaurant(r); }}
            >
              <div>
                <div
                  className="restaurant-row-name"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {r.name}
                  {r.display_id && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-3)',
                        fontFamily: 'monospace',
                        background: 'var(--bg-surface)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        fontWeight: 'normal',
                      }}
                    >
                      @{r.display_id}
                    </span>
                  )}
                  {r.moderation_status === 'PENDING' && (
                    <span
                      className="order-status-badge pending"
                      style={{ fontSize: '0.6rem' }}
                    >
                      На модерации
                    </span>
                  )}
                  {r.moderation_status === 'REJECTED' && (
                    <span
                      className="order-status-badge cancelled"
                      style={{ fontSize: '0.6rem' }}
                    >
                      Отклонён
                    </span>
                  )}
                </div>
                <div className="restaurant-row-addr">{r.address}</div>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-3)' }}>
                <CaretRightIcon />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
