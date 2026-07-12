import { ImageIcon } from '@phosphor-icons/react';
import type { MenuItemForm as MenuItemFormValues } from '../VendorMenuTab';

interface MenuItemPhotoFieldProps {
  menuItemForm: MenuItemFormValues;
  setMenuItemForm: React.Dispatch<React.SetStateAction<MenuItemFormValues>>;
}

export function MenuItemPhotoField({ menuItemForm, setMenuItemForm }: MenuItemPhotoFieldProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 12,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {menuItemForm.photoUrl ? (
          <img
            src={menuItemForm.photoUrl}
            alt="Фото блюда"
            loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <ImageIcon size={26} color="var(--text-3)" />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
          {menuItemForm.photoUrl ? 'Заменить фото' : 'Загрузить фото'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setMenuItemForm((form) => ({
                ...form,
                photoFile: file,
                photoUrl: URL.createObjectURL(file),
              }));
              e.target.value = '';
            }}
          />
        </label>
        {menuItemForm.photoUrl && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--error)' }}
            onClick={() =>
              { setMenuItemForm((form) => ({ ...form, photoFile: null, photoUrl: '' })); }
            }
          >
            Удалить фото
          </button>
        )}
        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
          JPEG, PNG или WebP · до 5 МБ
        </span>
      </div>
    </div>
  );
}
