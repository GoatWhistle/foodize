import { PencilSimpleIcon, XIcon } from '@phosphor-icons/react';
import { useRestaurantStore } from '@shared/store/useRestaurantStore';
import { menuService } from '@shared/services/menuService';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import { CATEGORY_RU, translate } from '@shared/utils/locales';
import type { MenuItem, Restaurant } from '@shared/types/models';
import { normalizeOptionGroups, type MenuItemForm } from './VendorMenuTab';
import { formatPrice } from '@shared/utils/price';

interface MenuItemListProps {
  selectedMenu: MenuItem[];
  loading: boolean;
  selectedRestaurant: Restaurant;
  setEditingItem: React.Dispatch<React.SetStateAction<MenuItem | null>>;
  setMenuItemForm: React.Dispatch<React.SetStateAction<MenuItemForm>>;
  handleDeleteMenuItem: (itemId: string) => void;
}

export function MenuItemList({
  selectedMenu,
  loading,
  selectedRestaurant,
  setEditingItem,
  setMenuItemForm,
  handleDeleteMenuItem,
}: MenuItemListProps) {
  if (loading && selectedMenu.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton" style={{ width: '30%', height: 16, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (selectedMenu.length === 0) {
    return <EmptyState title="Меню пустое" subtitle="Добавьте первую позицию" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {selectedMenu.map((item) => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ opacity: item.is_available ? 1 : 0.5 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "var(--text-base)",
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ textDecoration: item.is_available ? 'none' : 'line-through' }}>
                {item.name}
              </span>
              {!item.is_available && (
                <span
                  className="order-status-badge cancelled"
                  style={{ fontSize: "var(--text-xs)", padding: '2px 6px' }}
                >
                  СТОП
                </span>
              )}
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: 'var(--text-3)' }}>
              {formatPrice(item.price)} • {translate(CATEGORY_RU, item.category)}
            </div>
            {item.option_groups.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {item.option_groups.map((group) => (
                  <span
                    key={group.id}
                    className="tag-pill"
                    style={{
                      fontSize: "var(--text-xs)",
                      background: 'var(--bg-raised)',
                      color: 'var(--text-3)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {group.name}: {group.options.length || 0}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-sm"
              title={item.is_available ? 'Доступно (сделать недоступным)' : 'Недоступно (сделать доступным)'}
              style={{
                padding: '4px 12px',
                height: 28,
                minWidth: 56,
                borderRadius: '20px',
                border: `1px solid ${item.is_available ? 'var(--color-success-border)' : 'var(--border)'}`,
                background: item.is_available ? 'var(--color-success-bg)' : 'var(--bg-raised)',
                color: item.is_available ? 'var(--color-success-dim)' : 'var(--text-3)',
                transition: 'all 0.2s ease',
              }}
              onClick={(e) => {
                e.stopPropagation();
                const newVal = !item.is_available;
                const restId = selectedRestaurant.id;
                const { menus: currentMenus } = useRestaurantStore.getState();
                const optimistic = (currentMenus[restId] || []).map((m) =>
                  m.id === item.id ? { ...m, is_available: newVal } : m
                );
                useRestaurantStore.setState((s) => ({
                  menus: { ...s.menus, [restId]: optimistic },
                }));
                void (async () => {
                  try {
                    await menuService.updateItem(restId, item.id, { is_available: newVal });
                  } catch {
                    useRestaurantStore.setState((s) => ({
                      menus: { ...s.menus, [restId]: currentMenus[restId] ?? [] },
                    }));
                  }
                })();
              }}
            >
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 800 }}>
                {item.is_available ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEditingItem(item);
                setMenuItemForm({
                  name: item.name,
                  description: item.description ?? '',
                  price: item.price.toString(),
                  category: item.category,
                  prep_time_minutes: item.prep_time_minutes,
                  option_groups: normalizeOptionGroups(item.option_groups),
                  photoFile: null,
                  photoUrl: item.photo_url || '',
                });
              }}
            >
              <PencilSimpleIcon size={16} />
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--error)' }}
              onClick={() => { handleDeleteMenuItem(item.id); }}
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
