import { useState } from 'react';
import { menuService } from '../../../services/menuService';
import { useModalStore } from '../../../store/useModalStore';
import { translateApiError } from '../../../utils/translateApiError';

export const useVendorMenu = ({
  selectedRestaurant,
  fetchMenu,
  addMenuItem,
  setFormLoading,
  setFormError,
}) => {
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'SHAURMA',
    prep_time_minutes: 15,
    option_groups: [],
  });
  const [menuError, setMenuError] = useState('');
  const [menuSuccess, setMenuSuccess] = useState('');

  const syncOptionGroups = async (item, groups) => {
    if (!item?.id) return;
    if (editingItem?.option_groups?.length) {
      await Promise.all(
        editingItem.option_groups.map((group) =>
          menuService.deleteOptionGroup(selectedRestaurant.id, item.id, group.id)
        )
      );
    }
    const cleanGroups = groups
      .map((group, groupIndex) => {
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
              ? parseInt(group.max_selected, 10)
              : null;
        return {
          name: group.name.trim(),
          selection_type: group.selection_type,
          is_required: Boolean(group.is_required),
          min_selected: group.is_required
            ? Math.max(1, parseInt(group.min_selected, 10) || 1)
            : parseInt(group.min_selected, 10) || 0,
          max_selected: maxSelected,
          sort_order: groupIndex,
          options: cleanOptions,
        };
      })
      .filter(Boolean);
    for (const group of cleanGroups) {
      await menuService.createOptionGroup(selectedRestaurant.id, item.id, group);
    }
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setFormLoading(true);
    setFormError('');
    try {
      const { option_groups: optionGroups, ...baseForm } = menuItemForm;
      const payload = {
        ...baseForm,
        price: parseInt(baseForm.price, 10),
        prep_time_minutes: parseInt(baseForm.prep_time_minutes, 10) || 15,
      };
      let savedItem = editingItem;
      if (editingItem) {
        const res = await menuService.updateItem(selectedRestaurant.id, editingItem.id, payload);
        savedItem = res.data.data;
        setEditingItem(null);
      } else {
        savedItem = await addMenuItem(selectedRestaurant.id, payload);
        setShowAddItem(false);
      }
      await syncOptionGroups(savedItem, optionGroups);
      fetchMenu(selectedRestaurant.id, { force: true });
      setMenuItemForm({
        name: '',
        description: '',
        price: '',
        category: 'SHAURMA',
        prep_time_minutes: 15,
        option_groups: [],
      });
      setMenuSuccess(editingItem ? 'Позиция обновлена' : 'Позиция добавлена');
      setTimeout(() => setMenuSuccess(''), 2000);
    } catch (err) {
      setFormError(translateApiError(err, 'Ошибка сохранения'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    requestConfirm({
      title: 'Удалить позицию?',
      message: 'Вы уверены, что хотите удалить эту позицию из меню?',
      confirmLabel: 'Удалить',
      danger: true,
      onConfirm: async () => {
        setMenuError('');
        try {
          await menuService.deleteItem(selectedRestaurant.id, itemId);
          fetchMenu(selectedRestaurant.id, { force: true });
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
