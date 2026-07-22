import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Restaurant } from '@shared/types/models';
import { RestaurantCoverField } from './components/RestaurantCoverField';

interface VendorSettingsTabProps {
  selectedRestaurant: Restaurant;
  editRestaurant: Restaurant | null;
  setEditRestaurant: Dispatch<SetStateAction<Restaurant | null>>;
  formError: string;
  formLoading: boolean;
  handleUpdateRestaurant: (e: FormEvent<HTMLFormElement>) => void;
}

const toDateTimeLocalValue = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

export function VendorSettingsTab({
  selectedRestaurant,
  editRestaurant,
  setEditRestaurant,
  formError,
  formLoading,
  handleUpdateRestaurant,
}: VendorSettingsTabProps) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        padding: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <h3 style={{ fontWeight: 700, marginBottom: 12 }}>{t('vendor.settings.sectionTitle')}</h3>

      <RestaurantCoverField selectedRestaurant={selectedRestaurant} />

      <form
        onSubmit={handleUpdateRestaurant}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {formError && <div className="form-error">{formError}</div>}
        <div>
          <label style={{ fontSize: "var(--text-base)", color: 'var(--text-3)' }}>{t('common.labels.title')}</label>
          <input
            className="form-input"
            value={editRestaurant?.name ?? selectedRestaurant.name}
            onChange={(e) =>
              { setEditRestaurant({ ...(editRestaurant || selectedRestaurant), name: e.target.value }); }
            }
          />
        </div>
        <div>
          <label style={{ fontSize: "var(--text-base)", color: 'var(--text-3)' }}>{t('vendor.settings.descriptionLabel')}</label>
          <textarea
            className="form-input"
            placeholder={t('vendor.settings.descriptionPlaceholder')}
            value={editRestaurant?.description ?? selectedRestaurant.description ?? ''}
            onChange={(e) =>
              { setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                description: e.target.value,
              }); }
            }
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div>
          <label style={{ fontSize: "var(--text-base)", color: 'var(--text-3)' }}>{t('common.labels.address')}</label>
          <input
            className="form-input"
            value={editRestaurant?.address ?? selectedRestaurant.address}
            onChange={(e) =>
              { setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                address: e.target.value,
              }); }
            }
          />
        </div>
        <label className="form-check" style={{ marginTop: 4 }}>
          <input
            type="checkbox"
            checked={editRestaurant?.is_open ?? selectedRestaurant.is_open}
            onChange={(e) =>
              { setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                is_open: e.target.checked,
              }); }
            }
          />
          <span className="form-check-label">{t('vendor.settings.isOpen')}</span>
        </label>
        <label className="form-check">
          <input
            type="checkbox"
            checked={
              editRestaurant?.is_ordering_paused ??
              selectedRestaurant.is_ordering_paused
            }
            onChange={(e) =>
              { setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                is_ordering_paused: e.target.checked,
              }); }
            }
          />
          <span className="form-check-label">{t('vendor.settings.orderingPaused')}</span>
        </label>
        <div>
          <label style={{ fontSize: "var(--text-base)", color: 'var(--text-3)' }}>{t('vendor.settings.pausedUntil')}</label>
          <input
            className="form-input"
            type="datetime-local"
            value={toDateTimeLocalValue(
              editRestaurant?.ordering_paused_until ?? selectedRestaurant.ordering_paused_until
            )}
            onChange={(e) =>
              { setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                ordering_paused_until: e.target.value,
              }); }
            }
          />
        </div>
        <div>
          <label style={{ fontSize: "var(--text-base)", color: 'var(--text-3)' }}>
            {t('vendor.settings.avgPrepTime')}
          </label>
          <input
            className="form-input"
            type="number"
            min="1"
            max="240"
            value={
              editRestaurant?.avg_prep_time_minutes ??
              selectedRestaurant.avg_prep_time_minutes
            }
            onChange={(e) =>
              { setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                avg_prep_time_minutes: Number(e.target.value),
              }); }
            }
          />
        </div>
        <div>
          <label style={{ fontSize: "var(--text-base)", color: 'var(--text-3)' }}>
            {t('vendor.settings.maxActiveOrders')}
          </label>
          <input
            className="form-input"
            type="number"
            min="1"
            max="1000"
            placeholder={t('vendor.settings.noLimit')}
            value={
              editRestaurant?.max_active_orders ?? selectedRestaurant.max_active_orders ?? ''
            }
            onChange={(e) =>
              { setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                max_active_orders: e.target.value ? Number(e.target.value) : null,
              }); }
            }
          />
        </div>
        <label className="form-check">
          <input
            type="checkbox"
            checked={editRestaurant?.is_hiring ?? selectedRestaurant.is_hiring}
            onChange={(e) =>
              { setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                is_hiring: e.target.checked,
              }); }
            }
          />
          <span className="form-check-label">{t('vendor.settings.isHiring')}</span>
        </label>
        <button type="submit" className="btn btn-primary" disabled={formLoading}>
          {t('common.actions.save')}
        </button>
      </form>
    </div>
  );
}
