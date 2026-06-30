import { Plus } from '@phosphor-icons/react';
import MenuItemForm from './MenuItemForm';
import MenuItemList from './MenuItemList';

const createOptionDraft = () => ({
  draftId: crypto.randomUUID(),
  name: '',
  price_delta: '',
});

const createOptionGroupDraft = () => ({
  draftId: crypto.randomUUID(),
  name: '',
  selection_type: 'multiple',
  is_required: false,
  min_selected: 0,
  max_selected: '',
  options: [createOptionDraft()],
});

export const normalizeOptionGroups = (groups = []) =>
  groups.map((group) => ({
    ...group,
    draftId: group.id || crypto.randomUUID(),
    max_selected: group.max_selected ?? '',
    options: (group.options || []).map((option) => ({
      ...option,
      draftId: option.id || crypto.randomUUID(),
      price_delta: option.price_delta?.toString?.() ?? '0',
    })),
  }));

export const EMPTY_MENU_ITEM_FORM = {
  name: '',
  description: '',
  price: '',
  category: 'SHAURMA',
  prep_time_minutes: 15,
  option_groups: [],
};

export default function VendorMenuTab({
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
}) {
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
        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Позиции меню</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={exportLoading}
            onClick={() =>
              handleVendorExport(
                () =>
                  vendorService.exportMenuCSV({
                    restaurant_id: selectedRestaurant?.id || undefined,
                  }),
                `меню_${todayStr}.csv`
              )
            }
          >
            {exportLoading ? '...' : '↓ CSV'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingItem(null);
              setMenuItemForm(EMPTY_MENU_ITEM_FORM);
              setShowAddItem(!showAddItem);
            }}
          >
            <Plus size={16} /> Позиция
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
