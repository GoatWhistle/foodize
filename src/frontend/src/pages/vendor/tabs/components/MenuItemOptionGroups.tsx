import { Plus, X } from '@phosphor-icons/react';
import type {
  MenuItemForm as MenuItemFormValues,
  OptionDraft,
  OptionGroupDraft,
} from '../VendorMenuTab';

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

interface MenuItemOptionGroupsProps {
  menuItemForm: MenuItemFormValues;
  setMenuItemForm: React.Dispatch<React.SetStateAction<MenuItemFormValues>>;
}

export function MenuItemOptionGroups({
  menuItemForm,
  setMenuItemForm,
}: MenuItemOptionGroupsProps) {
  return (
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
  );
}
