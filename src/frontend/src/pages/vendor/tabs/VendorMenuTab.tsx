import { PlusIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import type { Category, MenuItem, MenuItemOptionGroup, Restaurant } from '@shared/types/models';
import { vendorService } from '@shared/services/vendorService';
import { useTranslation } from '@shared/i18n/useTranslation';
import { MenuItemForm } from './MenuItemForm';
import { MenuItemList } from './MenuItemList';
export interface OptionDraft {
  draftId: string;
  id?: string;
  name: string;
  price_delta: string;
}

export interface OptionGroupDraft {
  draftId: string;
  id?: string;
  name: string;
  selection_type: 'single' | 'multiple';
  is_required: boolean;
  min_selected: number | string;
  max_selected: number | string;
  options: OptionDraft[];
}

export interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  category: Category;
  prep_time_minutes: number | string;
  option_groups: OptionGroupDraft[];
  photoFile: File | null;
  photoUrl: string;
}

export const normalizeOptionGroups = (
  groups: MenuItemOptionGroup[] = []
): OptionGroupDraft[] =>
  groups.map((group) => ({
    draftId: group.id || crypto.randomUUID(),
    id: group.id,
    name: group.name,
    selection_type: group.selection_type === 'single' ? 'single' : 'multiple',
    is_required: group.is_required,
    min_selected: group.min_selected,
    max_selected: group.max_selected ?? '',
    options: group.options.map((option) => ({
      draftId: option.id || crypto.randomUUID(),
      id: option.id,
      name: option.name,
      price_delta: option.price_delta.toString(),
    })),
  }));

export const EMPTY_MENU_ITEM_FORM: MenuItemForm = {
  name: '',
  description: '',
  price: '',
  category: 'SHAURMA',
  prep_time_minutes: 15,
  option_groups: [],
  photoFile: null,
  photoUrl: '',
};

interface VendorMenuTabProps {
  selectedRestaurant: Restaurant;
  selectedMenu: MenuItem[];
  loading: boolean;
  exportLoading: boolean;
  todayStr: string;
  showAddItem: boolean;
  setShowAddItem: React.Dispatch<React.SetStateAction<boolean>>;
  editingItem: MenuItem | null;
  setEditingItem: React.Dispatch<React.SetStateAction<MenuItem | null>>;
  menuItemForm: MenuItemForm;
  setMenuItemForm: React.Dispatch<React.SetStateAction<MenuItemForm>>;
  formLoading: boolean;
  formError: string;
  menuError: string;
  menuSuccess: string;
  handleSaveMenuItem: (e: React.FormEvent<HTMLFormElement>) => void;
  handleDeleteMenuItem: (itemId: string) => void;
  handleVendorExport: (
    exportFn: () => ReturnType<typeof vendorService.exportMenuCSV>,
    filename: string
  ) => void;
  vendorService: typeof vendorService;
}

export function VendorMenuTab({
  selectedRestaurant,
  selectedMenu,
  loading,
  exportLoading,
  todayStr,
  showAddItem,
  setShowAddItem,
  editingItem,
  setEditingItem,
  menuItemForm,
  setMenuItemForm,
  formLoading,
  formError,
  menuError,
  menuSuccess,
  handleSaveMenuItem,
  handleDeleteMenuItem,
  handleVendorExport,
  vendorService,
}: VendorMenuTabProps) {
  const { t } = useTranslation();
  return (
    <div>
      {menuError && (
        <div className="form-error" style={{ marginBottom: 12 }}>
          {menuError}
        </div>
      )}
      {menuSuccess && (
        <div className="form-success" style={{ marginBottom: 12, color: 'var(--color-success)' }}>
          {menuSuccess}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontWeight: 700, fontSize: "var(--text-md)" }}>{t('vendor.menu.sectionTitle')}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={exportLoading}
            onClick={() =>
              { handleVendorExport(
                () =>
                  vendorService.exportMenuCSV({
                    restaurant_id: selectedRestaurant.id || undefined,
                  }),
                t('vendor.exportFiles.menu', { date: todayStr })
              ); }
            }
          >
            {exportLoading ? '...' : <><DownloadSimpleIcon size={16} weight="bold" /> CSV</>}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingItem(null);
              setMenuItemForm(EMPTY_MENU_ITEM_FORM);
              setShowAddItem(!showAddItem);
            }}
          >
            <PlusIcon size={16} /> {t('vendor.menu.addItem')}
          </button>
        </div>
      </div>

      {(showAddItem || editingItem) && (
        <MenuItemForm
          editingItem={editingItem}
          menuItemForm={menuItemForm}
          setMenuItemForm={setMenuItemForm}
          formLoading={formLoading}
          formError={formError}
          handleSaveMenuItem={handleSaveMenuItem}
          setShowAddItem={setShowAddItem}
          setEditingItem={setEditingItem}
        />
      )}

      <MenuItemList
        selectedMenu={selectedMenu}
        loading={loading}
        selectedRestaurant={selectedRestaurant}
        setEditingItem={setEditingItem}
        setMenuItemForm={setMenuItemForm}
        handleDeleteMenuItem={handleDeleteMenuItem}
      />
    </div>
  );
}
