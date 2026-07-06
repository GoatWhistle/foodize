import { useEffect, useState } from 'react';
import { Image as ImageIcon } from '@phosphor-icons/react';
import { restaurantService } from '../../../services/restaurantService';
import { translateApiError } from '../../../utils/translateApiError';

const toDateTimeLocalValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

export default function VendorSettingsTab({
  selectedRestaurant,
  editRestaurant,
  setEditRestaurant,
  formError,
  formLoading,
  handleUpdateRestaurant,
}) {
  const [coverUrl, setCoverUrl] = useState(selectedRestaurant?.photo_url || '');
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState('');

  useEffect(() => {
    setCoverUrl(selectedRestaurant?.photo_url || '');
    setCoverError('');
  }, [selectedRestaurant?.id, selectedRestaurant?.photo_url]);

  const handleCoverUpload = async (file) => {
    setCoverLoading(true);
    setCoverError('');
    try {
      const res = await restaurantService.uploadPhoto(selectedRestaurant.id, file);
      setCoverUrl(res.data.data.photo_url || '');
    } catch (err) {
      setCoverError(translateApiError(err, 'Не удалось загрузить фото'));
    } finally {
      setCoverLoading(false);
    }
  };

  const handleCoverDelete = async () => {
    setCoverLoading(true);
    setCoverError('');
    try {
      await restaurantService.deletePhoto(selectedRestaurant.id);
      setCoverUrl('');
    } catch (err) {
      setCoverError(translateApiError(err, 'Не удалось удалить фото'));
    } finally {
      setCoverLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Настройки ресторана</h3>

      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 12,
          marginBottom: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>Обложка ресторана</div>
        {coverError && <div className="form-error">{coverError}</div>}
        {/* Пропорция как у реального баннера на странице ресторана (~21:9),
            чтобы вендор видел кадрирование заранее. */}
        <div
          style={{
            width: '100%',
            maxWidth: 560,
            aspectRatio: '21 / 9',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Обложка ресторана"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <ImageIcon size={32} color="var(--text-3)" />
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label
            className="btn btn-secondary btn-sm"
            style={{ cursor: coverLoading ? 'wait' : 'pointer', margin: 0 }}
          >
            {coverLoading ? 'Загрузка…' : coverUrl ? 'Заменить обложку' : 'Загрузить обложку'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              disabled={coverLoading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverUpload(file);
                e.target.value = '';
              }}
            />
          </label>
          {coverUrl && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--error)' }}
              disabled={coverLoading}
              onClick={handleCoverDelete}
            >
              Удалить
            </button>
          )}
          <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
            JPEG, PNG или WebP · до 5 МБ
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
          Показывается широким баннером в шапке страницы ресторана. Лучше всего
          подходит горизонтальное фото (например, интерьер или блюдо крупным
          планом) шириной от 1200 px — вертикальные будут сильно обрезаны.
        </span>
      </div>
      <form
        onSubmit={handleUpdateRestaurant}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {formError && <div className="form-error">{formError}</div>}
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Название</label>
          <input
            className="form-input"
            value={editRestaurant?.name ?? selectedRestaurant.name}
            onChange={(e) =>
              setEditRestaurant({ ...(editRestaurant || selectedRestaurant), name: e.target.value })
            }
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Описание ресторана</label>
          <textarea
            className="form-input"
            placeholder="Краткое описание заведения для посетителей..."
            value={editRestaurant?.description ?? selectedRestaurant.description ?? ''}
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                description: e.target.value,
              })
            }
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Адрес</label>
          <input
            className="form-input"
            value={editRestaurant?.address ?? selectedRestaurant.address}
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                address: e.target.value,
              })
            }
          />
        </div>
        <label className="form-check" style={{ marginTop: 4 }}>
          <input
            type="checkbox"
            checked={editRestaurant?.is_open ?? selectedRestaurant.is_open ?? true}
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                is_open: e.target.checked,
              })
            }
          />
          <span className="form-check-label">Заведение открыто</span>
        </label>
        <label className="form-check">
          <input
            type="checkbox"
            checked={
              editRestaurant?.is_ordering_paused ??
              selectedRestaurant.is_ordering_paused ??
              false
            }
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                is_ordering_paused: e.target.checked,
              })
            }
          />
          <span className="form-check-label">Пауза приёма заказов</span>
        </label>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Пауза до</label>
          <input
            className="form-input"
            type="datetime-local"
            value={toDateTimeLocalValue(
              editRestaurant?.ordering_paused_until ?? selectedRestaurant.ordering_paused_until
            )}
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                ordering_paused_until: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            Среднее время приготовления, минут
          </label>
          <input
            className="form-input"
            type="number"
            min="1"
            max="240"
            value={
              editRestaurant?.avg_prep_time_minutes ??
              selectedRestaurant.avg_prep_time_minutes ??
              15
            }
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                avg_prep_time_minutes: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            Мягкий лимит активных заказов
          </label>
          <input
            className="form-input"
            type="number"
            min="1"
            max="1000"
            placeholder="Без лимита"
            value={
              editRestaurant?.max_active_orders ?? selectedRestaurant.max_active_orders ?? ''
            }
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                max_active_orders: e.target.value,
              })
            }
          />
        </div>
        <label className="form-check">
          <input
            type="checkbox"
            checked={editRestaurant?.is_hiring ?? selectedRestaurant.is_hiring ?? false}
            onChange={(e) =>
              setEditRestaurant({
                ...(editRestaurant || selectedRestaurant),
                is_hiring: e.target.checked,
              })
            }
          />
          <span className="form-check-label">Набор сотрудников</span>
        </label>
        <button type="submit" className="btn btn-primary" disabled={formLoading}>
          Сохранить
        </button>
      </form>
    </div>
  );
}
