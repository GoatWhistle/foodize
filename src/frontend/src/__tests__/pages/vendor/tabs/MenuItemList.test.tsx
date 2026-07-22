import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MenuItemList } from '../../../../pages/vendor/tabs/MenuItemList';
import { useRestaurantStore } from '@shared/store/useRestaurantStore';
import { menuService } from '@shared/services/menuService';
import type { MenuItem, Restaurant } from '@shared/types/models';
import { at } from '../../../testUtils';
import { t } from '@shared/i18n/useTranslation';

vi.mock('@shared/store/useRestaurantStore', () => ({
  useRestaurantStore: Object.assign(vi.fn(), {
    getState: vi.fn(),
    setState: vi.fn(),
  }),
}));

vi.mock('@shared/services/menuService', () => ({
  menuService: { updateItem: vi.fn() },
}));

const restaurant = { id: 'r1' } as unknown as Restaurant;

const makeItem = (overrides: Partial<MenuItem> = {}): MenuItem =>
  ({
    id: 'i1',
    name: 'Шаурма',
    description: 'Классика',
    price: 300,
    category: 'SHAURMA',
    prep_time_minutes: 10,
    is_available: true,
    photo_url: '',
    option_groups: [],
    ...overrides,
  }) as unknown as MenuItem;

const setup = (
  props: Partial<React.ComponentProps<typeof MenuItemList>> = {}
) => {
  const setEditingItem = vi.fn();
  const setMenuItemForm = vi.fn();
  const handleDeleteMenuItem = vi.fn();
  render(
    <MenuItemList
      selectedMenu={[makeItem()]}
      loading={false}
      selectedRestaurant={restaurant}
      setEditingItem={setEditingItem}
      setMenuItemForm={setMenuItemForm}
      handleDeleteMenuItem={handleDeleteMenuItem}
      {...props}
    />
  );
  return { setEditingItem, setMenuItemForm, handleDeleteMenuItem };
};

describe('MenuItemList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRestaurantStore.getState).mockReturnValue({
      menus: { r1: [makeItem()] },
    } as never);
  });

  it('renders skeleton when loading with empty menu', () => {
    render(
      <MenuItemList
        selectedMenu={[]}
        loading
        selectedRestaurant={restaurant}
        setEditingItem={vi.fn()}
        setMenuItemForm={vi.fn()}
        handleDeleteMenuItem={vi.fn()}
      />
    );
    expect(screen.queryByText(t('vendor.menu.emptyTitle'))).not.toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <MenuItemList
        selectedMenu={[]}
        loading={false}
        selectedRestaurant={restaurant}
        setEditingItem={vi.fn()}
        setMenuItemForm={vi.fn()}
        handleDeleteMenuItem={vi.fn()}
      />
    );
    expect(screen.getByText(t('vendor.menu.emptyTitle'))).toBeInTheDocument();
  });

  it('renders item with price, category and option groups', () => {
    setup({
      selectedMenu: [
        makeItem({
          option_groups: [
            { id: 'g1', name: 'Соусы', options: [{ id: 'o1' }, { id: 'o2' }] },
          ] as unknown as MenuItem['option_groups'],
        }),
      ],
    });
    expect(screen.getByText('Шаурма')).toBeInTheDocument();
    expect(screen.getByText(/Соусы: 2/)).toBeInTheDocument();
    expect(screen.getByText(t('vendor.menu.on'))).toBeInTheDocument();
  });

  it('renders unavailable item with stop badge and off label', () => {
    setup({ selectedMenu: [makeItem({ is_available: false })] });
    expect(screen.getByText(t('vendor.menu.stopBadge'))).toBeInTheDocument();
    expect(screen.getByText(t('vendor.menu.off'))).toBeInTheDocument();
  });

  it('toggles availability and calls menuService.updateItem', async () => {
    const user = userEvent.setup();
    vi.mocked(menuService.updateItem).mockResolvedValue({} as never);
    setup();
    await user.click(screen.getByText(t('vendor.menu.on')));
    expect(useRestaurantStore.setState).toHaveBeenCalled();
    await waitFor(() => {
      expect(menuService.updateItem).toHaveBeenCalledWith('r1', 'i1', { is_available: false });
    });
  });

  it('reverts optimistic update on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(menuService.updateItem).mockRejectedValue(new Error('fail'));
    setup();
    await user.click(screen.getByText(t('vendor.menu.on')));
    await waitFor(() => {
      expect(useRestaurantStore.setState).toHaveBeenCalledTimes(2);
    });
  });

  it('starts editing an item', async () => {
    const user = userEvent.setup();
    const { setEditingItem, setMenuItemForm } = setup();
    const editBtn = screen.getAllByRole('button').find((b) => b.querySelector('svg') && b.classList.contains('btn-secondary') && !b.style.color);
    await user.click(editBtn as HTMLElement);
    expect(setEditingItem).toHaveBeenCalled();
    expect(setMenuItemForm).toHaveBeenCalled();
  });

  it('deletes an item', async () => {
    const user = userEvent.setup();
    const { handleDeleteMenuItem } = setup();
    const buttons = screen.getAllByRole('button');
    await user.click(at(buttons, buttons.length - 1));
    expect(handleDeleteMenuItem).toHaveBeenCalledWith('i1');
  });

  it('handles missing menu entry in store when toggling', async () => {
    const user = userEvent.setup();
    vi.mocked(useRestaurantStore.getState).mockReturnValue({ menus: {} } as never);
    vi.mocked(menuService.updateItem).mockResolvedValue({} as never);
    setup();
    await user.click(screen.getByText(t('vendor.menu.on')));
    await waitFor(() => {
      expect(menuService.updateItem).toHaveBeenCalled();
    });
  });
});
