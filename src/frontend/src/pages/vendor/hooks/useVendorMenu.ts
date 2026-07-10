import { useState } from 'react';
import { menuService } from '@shared/services/menuService';
import { useModalStore } from '@shared/store/useModalStore';
import { translateApiError } from '@shared/utils/translateApiError';
import type {
  MenuItem,
  MenuItemCreate,
  Restaurant,
  Schemas,
} from '@shared/types/models';
import {
  EMPTY_MENU_ITEM_FORM,
  type MenuItemForm,
  type OptionGroupDraft,
} from '../tabs/VendorMenuTab';

type MenuItemOptionGroupCreate = Schemas['MenuItemOptionGroupCreate'];

interface UseVendorMenuParams {
  selectedRestaurant: Restaurant | null;
  fetchMenu: (restaurantId: string, options?: { force?: boolean }) => Promise<void>;
  addMenuItem: (restaurantId: string, data: MenuItemCreate) => Promise<MenuItem>;
  setFormLoading: (loading: boolean) => void;
  setFormError: (error: string) => void;
}

export const useVendorMenu = ({
  selectedRestaurant,
  fetchMenu,
  addMenuItem,
  setFormLoading,
  setFormError,
}: UseVendorMenuParams) => {
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuItemForm, setMenuItemForm] = useState<MenuItemForm>(EMPTY_MENU_ITEM_FORM);
  const [menuError, setMenuError] = useState('');
  const [menuSuccess, setMenuSuccess] = useState('');

  const syncOptionGroups = async (item: MenuItem | null, groups: OptionGroupDraft[]) => {
    if (!item?.id || !selectedRestaurant) return;
    if (editingItem?.option_groups?.length) {
      await Promise.all(
        editingItem.option_groups.map((group) =>
          menuService.deleteOptionGroup(selectedRestaurant.id, item.id, group.id)
        )
      );
    }
    const cleanGroups = groups
      .map((group, groupIndex): MenuItemOptionGroupCreate | null => {
        const cleanOptions = (group.options || [])
          .filter((option) => option.name.trim())
          .map((option, optionIndex) => ({
            name: option.name.trim(),
            price_delta: parseInt(option.price_delta, 10) || 0,
            sort_order: optionIndex,
          }));
        if (!group.name.trim() || cleanOptions.length === 0) return null;
        const maxSelected =
          group.selection_type === 'single'
            ? 1
            : group.max_selected
              ? parseInt(String(group.max_selected), 10)
              : null;
        return {
          name: group.name.trim(),
          selection_type: group.selection_type,
          is_required: Boolean(group.is_required),
          min_selected: group.is_required
            ? Math.max(1, parseInt(String(group.min_selected), 10) || 1)
            : parseInt(String(group.min_selected), 10) || 0,
          max_selected: maxSelected,
          sort_order: groupIndex,
          options: cleanOptions,
        };
      })
      .filter((group): group is MenuItemOptionGroupCreate => group !== null);
    for (const group of cleanGroups) {
      await menuService.createOptionGroup(selectedRestaurant.id, item.id, group);
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setFormLoading(true);
    setFormError('');
    try {
      const { option_groups: optionGroups, photoFile, photoUrl, ...baseForm } = menuItemForm;
      const payload: MenuItemCreate = {
        ...baseForm,
        price: parseInt(baseForm.price, 10),
        prep_time_minutes: parseInt(String(baseForm.prep_time_minutes), 10) || 15,
      };
      const previousPhotoUrl = editingItem?.photo_url || '';
      let savedItem: MenuItem | null = editingItem;
      if (editingItem) {
        const res = await menuService.updateItem(
          selectedRestaurant.id,
          editingItem.id,
          payload
        );
        savedItem = res.data.data;
        setEditingItem(null);
      } else {
        savedItem = await addMenuItem(selectedRestaurant.id, payload);
        setShowAddItem(false);
      }
      await syncOptionGroups(savedItem, optionGroups);

      if (savedItem?.id) {
        if (photoFile) {
          await menuService.uploadItemPhoto(selectedRestaurant.id, savedItem.id, photoFile);
        } else if (previousPhotoUrl && !photoUrl) {
          await menuService.deleteItemPhoto(selectedRestaurant.id, savedItem.id);
        }
      }

      await fetchMenu(selectedRestaurant.id, { force: true });
      setMenuItemForm(EMPTY_MENU_ITEM_FORM);
      setMenuSuccess(editingItem ? 'Позиция обновлена' : 'Позиция добавлена');
      setTimeout(() => setMenuSuccess(''), 2000);
    } catch (err) {
      setFormError(translateApiError(err, 'Ошибка сохранения'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMenuItem = (itemId: string) => {
    requestConfirm({
      title: 'Удалить позицию?',
      message: 'Вы уверены, что хотите удалить эту позицию из меню?',
      confirmLabel: 'Удалить',
      danger: true,
      onConfirm: async () => {
        if (!selectedRestaurant) return;
        setMenuError('');
        try {
          await menuService.deleteItem(selectedRestaurant.id, itemId);
          await fetchMenu(selectedRestaurant.id, { force: true });
        } catch {
          setMenuError('Не удалось удалить позицию');
        }
      },
    });
  };

  return {
    showAddItem, setShowAddItem,
    editingItem, setEditingItem,
    menuItemForm, setMenuItemForm,
    menuError,
    menuSuccess,
    handleSaveMenuItem,
    handleDeleteMenuItem,
  };
};
