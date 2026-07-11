import { useEffect, useState } from 'react';
import { Image as ImageIcon } from '@phosphor-icons/react';
import { restaurantService } from '@shared/services/restaurantService';
import { translateApiError } from '@shared/utils/translateApiError';
import type { Restaurant } from '@shared/types/models';

interface RestaurantCoverFieldProps {
  selectedRestaurant: Restaurant;
}

export function RestaurantCoverField({ selectedRestaurant }: RestaurantCoverFieldProps) {
  const [coverUrl, setCoverUrl] = useState(selectedRestaurant?.photo_url || '');
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState('');

  useEffect(() => {
    setCoverUrl(selectedRestaurant?.photo_url || '');
    setCoverError('');
  }, [selectedRestaurant?.id, selectedRestaurant?.photo_url]);

  const handleCoverUpload = async (file: File) => {
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
            loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
              if (file) void handleCoverUpload(file);
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
            onClick={() => {
              void handleCoverDelete();
            }}
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
  );
}
