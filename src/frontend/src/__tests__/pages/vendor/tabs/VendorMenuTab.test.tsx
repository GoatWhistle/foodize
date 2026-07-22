import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { VendorMenuTab, EMPTY_MENU_ITEM_FORM, normalizeOptionGroups, type MenuItemForm as MenuItemFormValues } from '../../../../pages/vendor/tabs/VendorMenuTab';
import type { MenuItem, MenuItemOptionGroup, Restaurant } from '@shared/types/models';
import { at } from '../../../testUtils';
import { t } from '@shared/i18n/useTranslation';

vi.mock('@shared/store/useRestaurantStore', () => ({
  useRestaurantStore: Object.assign(vi.fn(), { getState: vi.fn(() => ({ menus: {} })), setState: vi.fn() }),
}));
vi.mock('@shared/services/menuService', () => ({ menuService: { updateItem: vi.fn() } }));

const restaurant = { id: 'r1' } as unknown as Restaurant;

const vendorServiceMock = {
  exportMenuCSV: vi.fn(() => Promise.resolve(new Blob())),
} as unknown as never;

const Harness = ({
  menu = [] as MenuItem[],
  loading = false,
  exportLoading = false,
  showAddItem = false,
  editingItem = null as MenuItem | null,
  menuError = '',
  menuSuccess = '',
  onSave = vi.fn(),
  onDelete = vi.fn(),
  onExport = vi.fn(),
}: Record<string, unknown>) => {
  const [show, setShow] = useState(showAddItem as boolean);
  const [editing, setEditing] = useState<MenuItem | null>(editingItem as MenuItem | null);
  const [form, setForm] = useState<MenuItemFormValues>(EMPTY_MENU_ITEM_FORM);
  return (
    <VendorMenuTab
      selectedRestaurant={restaurant}
      selectedMenu={menu as MenuItem[]}
      loading={loading as boolean}
      exportLoading={exportLoading as boolean}
      todayStr="2026-07-18"
      showAddItem={show}
      setShowAddItem={setShow}
      editingItem={editing}
      setEditingItem={setEditing}
      menuItemForm={form}
      setMenuItemForm={setForm}
      formLoading={false}
      formError=""
      menuError={menuError as string}
      menuSuccess={menuSuccess as string}
      handleSaveMenuItem={onSave as never}
      handleDeleteMenuItem={onDelete as (id: string) => void}
      handleVendorExport={onExport as never}
      vendorService={vendorServiceMock}
    />
  );
};

describe('VendorMenuTab', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders heading and empty menu', () => {
    render(<Harness />);
    expect(screen.getByText(t('vendor.menu.sectionTitle'))).toBeInTheDocument();
    expect(screen.getByText(t('vendor.menu.emptyTitle'))).toBeInTheDocument();
  });

  it('shows menu error and success', () => {
    render(<Harness menuError="Ошибка" menuSuccess="Успех" />);
    expect(screen.getByText('Ошибка')).toBeInTheDocument();
    expect(screen.getByText('Успех')).toBeInTheDocument();
  });

  it('opens add form when clicking add item', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: new RegExp(t('vendor.menu.addItem')) }));
    expect(screen.getByText(t('vendor.menu.form.newTitle'))).toBeInTheDocument();
  });

  it('renders the form when showAddItem is true', () => {
    render(<Harness showAddItem />);
    expect(screen.getByText(t('vendor.menu.form.newTitle'))).toBeInTheDocument();
  });

  it('exports menu CSV', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    render(<Harness onExport={onExport} />);
    await user.click(screen.getByRole('button', { name: /CSV/ }));
    expect(onExport).toHaveBeenCalledWith(expect.any(Function), t('vendor.exportFiles.menu', { date: '2026-07-18' }));
    const fn = at(onExport.mock.calls, 0)[0] as () => Promise<Blob>;
    await fn();
    expect((vendorServiceMock as { exportMenuCSV: ReturnType<typeof vi.fn> }).exportMenuCSV).toHaveBeenCalledWith({ restaurant_id: 'r1' });
  });

  it('shows export loading indicator', () => {
    render(<Harness exportLoading />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('renders form when editingItem set', () => {
    render(<Harness editingItem={{ id: 'i1' }} />);
    expect(screen.getByText(t('vendor.menu.form.editTitle'))).toBeInTheDocument();
  });
});

describe('normalizeOptionGroups', () => {
  it('returns empty array for no groups', () => {
    expect(normalizeOptionGroups()).toEqual([]);
  });

  it('normalizes groups mapping single/multiple and options', () => {
    const groups = [
      {
        id: 'g1',
        name: 'Соусы',
        selection_type: 'single',
        is_required: true,
        min_selected: 1,
        max_selected: null,
        options: [{ id: 'o1', name: 'Кетчуп', price_delta: 10 }],
      },
      {
        id: '',
        name: 'Топпинги',
        selection_type: 'multiple',
        is_required: false,
        min_selected: 0,
        max_selected: 3,
        options: [{ id: '', name: 'Сыр', price_delta: 20 }],
      },
    ] as unknown as MenuItemOptionGroup[];
    const result = normalizeOptionGroups(groups);
    expect(at(result, 0).selection_type).toBe('single');
    expect(at(result, 0).max_selected).toBe('');
    expect(at(result, 1).selection_type).toBe('multiple');
    expect(at(result, 1).max_selected).toBe(3);
    expect(at(at(result, 0).options, 0).price_delta).toBe('10');
    expect(typeof at(result, 1).draftId).toBe('string');
  });
});
