import { categoryLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Category, MenuItem } from '@shared/types/models';
import {
  EMPTY_MENU_ITEM_FORM,
  type MenuItemForm as MenuItemFormValues,
} from './VendorMenuTab';
import { MenuItemPhotoField } from './components/MenuItemPhotoField';
import { MenuItemOptionGroups } from './components/MenuItemOptionGroups';

const CATEGORY_KEYS: Category[] = ['SHAURMA', 'BURGER', 'DRINK', 'PIZZA', 'SUSHI', 'DESSERT', 'SNACK', 'SALAD', 'OTHER'];

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

export function MenuItemForm({
  editingItem,
  menuItemForm,
  setMenuItemForm,
  formLoading,
  formError,
  handleSaveMenuItem,
  setShowAddItem,
  setEditingItem,
}: MenuItemFormProps) {
  const { t } = useTranslation();
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
      <h3 style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>
        {editingItem ? t('vendor.menu.form.editTitle') : t('vendor.menu.form.newTitle')}
      </h3>
      {formError && <div className="form-error">{formError}</div>}
      <input
        className="form-input"
        placeholder={t('common.labels.title')}
        value={menuItemForm.name}
        onChange={(e) => { setMenuItemForm({ ...menuItemForm, name: e.target.value }); }}
        required
      />
      <textarea
        className="form-input"
        placeholder={t('common.labels.description')}
        value={menuItemForm.description}
        onChange={(e) => { setMenuItemForm({ ...menuItemForm, description: e.target.value }); }}
      />
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          className="form-input"
          type="number"
          placeholder={t('common.labels.price')}
          value={menuItemForm.price}
          onChange={(e) => { setMenuItemForm({ ...menuItemForm, price: e.target.value }); }}
          required
          style={{ flex: 1 }}
        />
        <select
          className="form-input"
          value={menuItemForm.category}
          onChange={(e) =>
            { setMenuItemForm({ ...menuItemForm, category: e.target.value as Category }); }
          }
          style={{ flex: 1 }}
        >
          {CATEGORY_KEYS.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      <MenuItemPhotoField menuItemForm={menuItemForm} setMenuItemForm={setMenuItemForm} />

      <MenuItemOptionGroups menuItemForm={menuItemForm} setMenuItemForm={setMenuItemForm} />

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={formLoading}
        >
          {t('common.actions.save')}
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
          {t('common.actions.cancel')}
        </button>
      </div>
    </form>
  );
}
