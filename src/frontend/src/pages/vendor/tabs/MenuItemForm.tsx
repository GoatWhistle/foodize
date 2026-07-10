import { Plus, X, Image as ImageIcon } from '@phosphor-icons/react';
import { CATEGORY_RU } from '@shared/utils/locales';
import type { Category, MenuItem } from '@shared/types/models';
import {
  EMPTY_MENU_ITEM_FORM,
  type MenuItemForm as MenuItemFormValues,
  type OptionDraft,
  type OptionGroupDraft,
} from './VendorMenuTab';

const createOptionDraft = (): OptionDraft => ({
  draftId: crypto.randomUUID(),
  name: '',
  price_delta: '',
});

const createOptionGroupDraft = (): OptionGroupDraft => ({
  draftId: crypto.randomUUID(),
  name: '',
  selection_type: 'multiple',
  is_required: false,
  min_selected: 0,
  max_selected: '',
  options: [createOptionDraft()],
});

interface MenuItemFormProps {
  editingItem: MenuItem | null;
  menuItemForm: MenuItemFormValues;
  setMenuItemForm: React.Dispatch<React.SetStateAction<MenuItemFormValues>>;
  formLoading: boolean;
  formError: string;
  handleSaveMenuItem: (e: React.FormEvent<HTMLFormElement>) => void;
  setShowAddItem: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingItem: React.Dispatch<React.SetStateAction<MenuItem | null>>;
}

export default function MenuItemForm({
  editingItem,
  menuItemForm,
  setMenuItemForm,
  formLoading,
  formError,
  handleSaveMenuItem,
  setShowAddItem,
  setEditingItem,
}: MenuItemFormProps) {
  return (
    <form
      onSubmit={handleSaveMenuItem}
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
      <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>
        {editingItem ? 'Редактировать' : 'Новая позиция'}
      </h3>
      {formError && <div className="form-error">{formError}</div>}
      <input
        className="form-input"
        placeholder="Название"
        value={menuItemForm.name}
        onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
        required
      />
      <textarea
        className="form-input"
        placeholder="Описание"
        value={menuItemForm.description}
        onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          className="form-input"
          type="number"
          placeholder="Цена"
          value={menuItemForm.price}
          onChange={(e) => setMenuItemForm({ ...menuItemForm, price: e.target.value })}
          required
          style={{ flex: 1 }}
        />
        <select
          className="form-input"
          value={menuItemForm.category}
          onChange={(e) =>
            setMenuItemForm({ ...menuItemForm, category: e.target.value as Category })
          }
          style={{ flex: 1 }}
        >
          {Object.entries(CATEGORY_RU).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

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
                setMenuItemForm((form) => ({ ...form, photoFile: null, photoUrl: '' }))
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

      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>Опции блюда</div>
            <div style={{ color: 'var(--text-3)', fontSize: '0.74rem' }}>
              Например: убрать лук, добавить мясо
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() =>
              setMenuItemForm((form) => ({
                ...form,
                option_groups: [...form.option_groups, createOptionGroupDraft()],
              }))
            }
          >
            <Plus size={14} /> Группа
          </button>
        </div>

        {menuItemForm.option_groups.map((group, groupIndex) => (
          <div
            key={group.draftId}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                placeholder="Название группы"
                value={group.name}
                onChange={(e) =>
                  setMenuItemForm((form) => ({
                    ...form,
                    option_groups: form.option_groups.map((g, i) =>
                      i === groupIndex ? { ...g, name: e.target.value } : g
                    ),
                  }))
                }
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--error)' }}
                onClick={() =>
                  setMenuItemForm((form) => ({
                    ...form,
                    option_groups: form.option_groups.filter((_, i) => i !== groupIndex),
                  }))
                }
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <select
                className="form-input"
                value={group.selection_type}
                onChange={(e) =>
                  setMenuItemForm((form) => ({
                    ...form,
                    option_groups: form.option_groups.map((g, i) =>
                      i === groupIndex
                        ? {
                            ...g,
                            selection_type: e.target.value === 'single' ? 'single' : 'multiple',
                            max_selected: e.target.value === 'single' ? 1 : g.max_selected,
                          }
                        : g
                    ),
                  }))
                }
              >
                <option value="multiple">Несколько</option>
                <option value="single">Один вариант</option>
              </select>
              <input
                className="form-input"
                type="number"
                min="1"
                placeholder="Макс. выборов"
                value={group.max_selected}
                disabled={group.selection_type === 'single'}
                onChange={(e) =>
                  setMenuItemForm((form) => ({
                    ...form,
                    option_groups: form.option_groups.map((g, i) =>
                      i === groupIndex ? { ...g, max_selected: e.target.value } : g
                    ),
                  }))
                }
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-2)',
                fontSize: '0.8rem',
              }}
            >
              <input
                type="checkbox"
                checked={group.is_required}
                onChange={(e) =>
                  setMenuItemForm((form) => ({
                    ...form,
                    option_groups: form.option_groups.map((g, i) =>
                      i === groupIndex
                        ? {
                            ...g,
                            is_required: e.target.checked,
                            min_selected: e.target.checked ? 1 : 0,
                          }
                        : g
                    ),
                  }))
                }
              />
              Обязательный выбор
            </label>

            {group.options.map((option, optionIndex) => (
              <div key={option.draftId} style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  placeholder="Опция"
                  value={option.name}
                  onChange={(e) =>
                    setMenuItemForm((form) => ({
                      ...form,
                      option_groups: form.option_groups.map((g, i) =>
                        i === groupIndex
                          ? {
                              ...g,
                              options: g.options.map((o, j) =>
                                j === optionIndex ? { ...o, name: e.target.value } : o
                              ),
                            }
                          : g
                      ),
                    }))
                  }
                  style={{ flex: 1 }}
                />
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="+₽"
                  value={option.price_delta}
                  onChange={(e) =>
                    setMenuItemForm((form) => ({
                      ...form,
                      option_groups: form.option_groups.map((g, i) =>
                        i === groupIndex
                          ? {
                              ...g,
                              options: g.options.map((o, j) =>
                                j === optionIndex
                                  ? { ...o, price_delta: e.target.value }
                                  : o
                              ),
                            }
                          : g
                      ),
                    }))
                  }
                  style={{ width: 96 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--error)' }}
                  onClick={() =>
                    setMenuItemForm((form) => ({
                      ...form,
                      option_groups: form.option_groups.map((g, i) =>
                        i === groupIndex
                          ? {
                              ...g,
                              options: g.options.filter((_, j) => j !== optionIndex),
                            }
                          : g
                      ),
                    }))
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                setMenuItemForm((form) => ({
                  ...form,
                  option_groups: form.option_groups.map((g, i) =>
                    i === groupIndex
                      ? { ...g, options: [...g.options, createOptionDraft()] }
                      : g
                  ),
                }))
              }
            >
              <Plus size={14} /> Опция
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={formLoading}
        >
          Сохранить
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setShowAddItem(false);
            setEditingItem(null);
            setMenuItemForm(EMPTY_MENU_ITEM_FORM);
          }}
          style={{ flex: 1 }}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
