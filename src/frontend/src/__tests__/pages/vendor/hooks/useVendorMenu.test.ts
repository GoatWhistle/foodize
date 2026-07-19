import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVendorMenu } from '../../../../pages/vendor/hooks/useVendorMenu';
import { menuService } from '@shared/services/menuService';
import { useModalStore, type ConfirmDialogConfig } from '@shared/store/useModalStore';
import { EMPTY_MENU_ITEM_FORM } from '../../../../pages/vendor/tabs/VendorMenuTab';
import type { MenuItem, Restaurant } from '@shared/types/models';
import { at } from '../../../testUtils';

vi.mock('@shared/services/menuService', () => ({
  menuService: {
    updateItem: vi.fn(),
    uploadItemPhoto: vi.fn(),
    deleteItemPhoto: vi.fn(),
    deleteItem: vi.fn(),
    createOptionGroup: vi.fn(),
    deleteOptionGroup: vi.fn(),
  },
}));

vi.mock('@shared/utils/translateApiError', () => ({
  translateApiError: (_e: unknown, fallback: string) => fallback,
}));

let confirmConfig: ConfirmDialogConfig | null = null;
vi.mock('@shared/store/useModalStore', () => ({
  useModalStore: vi.fn((sel?: (s: unknown) => unknown) => {
    const state = {
      requestConfirm: (cfg: ConfirmDialogConfig) => {
        confirmConfig = cfg;
      },
    };
    return sel ? sel(state) : state;
  }),
}));

const restaurant = { id: 'r1' } as unknown as Restaurant;
const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.FormEvent<HTMLFormElement>;

const makeParams = (overrides: Record<string, unknown> = {}) => ({
  selectedRestaurant: restaurant,
  fetchMenu: vi.fn(() => Promise.resolve(undefined)),
  addMenuItem: vi.fn(() => Promise.resolve({ id: 'new1' } as MenuItem)),
  setFormLoading: vi.fn(),
  setFormError: vi.fn(),
  ...overrides,
});

describe('useVendorMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmConfig = null;
    void useModalStore;
  });

  it('returns early saving with no restaurant', async () => {
    const params = makeParams({ selectedRestaurant: null });
    const { result } = renderHook(() => useVendorMenu(params));
    await act(async () => {
      await result.current.handleSaveMenuItem(submitEvent());
    });
    expect(params.setFormLoading).not.toHaveBeenCalled();
  });

  it('creates a new menu item and uploads photo', async () => {
    vi.useFakeTimers();
    const params = makeParams();
    vi.mocked(menuService.uploadItemPhoto).mockResolvedValue({} as never);
    const { result } = renderHook(() => useVendorMenu(params));
    act(() =>
      { result.current.setMenuItemForm({
        ...EMPTY_MENU_ITEM_FORM,
        name: 'Пицца',
        price: '500',
        photoFile: new File(['x'], 'p.png', { type: 'image/png' }),
      }); }
    );
    await act(async () => {
      await result.current.handleSaveMenuItem(submitEvent());
    });
    expect(params.addMenuItem).toHaveBeenCalledWith('r1', expect.objectContaining({ price: 500 }));
    expect(menuService.uploadItemPhoto).toHaveBeenCalledWith('r1', 'new1', expect.any(File));
    expect(params.fetchMenu).toHaveBeenCalledWith('r1', { force: true });
    expect(result.current.menuSuccess).toBe('Позиция добавлена');
    void act(() => vi.advanceTimersByTime(2000));
    expect(result.current.menuSuccess).toBe('');
    vi.useRealTimers();
  });

  it('updates an existing item, deleting old photo and syncing option groups', async () => {
    const params = makeParams();
    vi.mocked(menuService.updateItem).mockResolvedValue({ data: { data: { id: 'i1' } } } as never);
    vi.mocked(menuService.deleteOptionGroup).mockResolvedValue({} as never);
    vi.mocked(menuService.createOptionGroup).mockResolvedValue({} as never);
    vi.mocked(menuService.deleteItemPhoto).mockResolvedValue({} as never);
    const editing = {
      id: 'i1',
      photo_url: 'http://old.png',
      option_groups: [{ id: 'g0' }],
    } as unknown as MenuItem;
    const { result } = renderHook(() => useVendorMenu(params));
    act(() => { result.current.setEditingItem(editing); });
    act(() =>
      { result.current.setMenuItemForm({
        ...EMPTY_MENU_ITEM_FORM,
        name: 'Обнов',
        price: '600',
        photoUrl: '',
        option_groups: [
          {
            draftId: 'd1',
            name: 'Соусы',
            selection_type: 'multiple',
            is_required: true,
            min_selected: 0,
            max_selected: '2',
            options: [
              { draftId: 'o1', name: 'Кетчуп', price_delta: '10' },
              { draftId: 'o2', name: '', price_delta: '' },
            ],
          },
          {
            draftId: 'd2',
            name: '',
            selection_type: 'single',
            is_required: false,
            min_selected: 0,
            max_selected: '',
            options: [],
          },
        ],
      }); }
    );
    await act(async () => {
      await result.current.handleSaveMenuItem(submitEvent());
    });
    expect(menuService.updateItem).toHaveBeenCalledWith('r1', 'i1', expect.objectContaining({ price: 600 }));
    expect(menuService.deleteOptionGroup).toHaveBeenCalledWith('r1', 'i1', 'g0');
    expect(menuService.createOptionGroup).toHaveBeenCalledTimes(1);
    expect(menuService.deleteItemPhoto).toHaveBeenCalledWith('r1', 'i1');
    expect(result.current.menuSuccess).toBe('Позиция обновлена');
  });

  it('builds single-type group with max_selected 1 and required min_selected', async () => {
    const params = makeParams();
    vi.mocked(menuService.updateItem).mockResolvedValue({ data: { data: { id: 'i1' } } } as never);
    vi.mocked(menuService.createOptionGroup).mockResolvedValue({} as never);
    const editing = { id: 'i1', photo_url: '', option_groups: [] } as unknown as MenuItem;
    const { result } = renderHook(() => useVendorMenu(params));
    act(() => { result.current.setEditingItem(editing); });
    act(() =>
      { result.current.setMenuItemForm({
        ...EMPTY_MENU_ITEM_FORM,
        name: 'X',
        price: '100',
        option_groups: [
          {
            draftId: 'd1',
            name: 'Размер',
            selection_type: 'single',
            is_required: true,
            min_selected: 0,
            max_selected: '',
            options: [{ draftId: 'o1', name: 'Большой', price_delta: '0' }],
          },
        ],
      }); }
    );
    await act(async () => {
      await result.current.handleSaveMenuItem(submitEvent());
    });
    const payload = at(vi.mocked(menuService.createOptionGroup).mock.calls, 0)[2];
    expect(payload.selection_type).toBe('single');
    expect(payload.max_selected).toBe(1);
    expect(payload.min_selected).toBe(1);
  });

  it('sets form error when save fails', async () => {
    const params = makeParams();
    vi.mocked(menuService.updateItem).mockRejectedValue(new Error('bad'));
    const { result } = renderHook(() => useVendorMenu(params));
    act(() =>
      { result.current.setEditingItem({ id: 'i1', photo_url: '', option_groups: [] } as unknown as MenuItem); }
    );
    act(() => { result.current.setMenuItemForm({ ...EMPTY_MENU_ITEM_FORM, name: 'X', price: '1' }); });
    await act(async () => {
      await result.current.handleSaveMenuItem(submitEvent());
    });
    expect(params.setFormError).toHaveBeenCalledWith('Ошибка сохранения');
  });

  it('deletes a menu item after confirmation', async () => {
    const params = makeParams();
    vi.mocked(menuService.deleteItem).mockResolvedValue({} as never);
    const { result } = renderHook(() => useVendorMenu(params));
    act(() => { result.current.handleDeleteMenuItem('i1'); });
    expect(confirmConfig).toBeTruthy();
    await act(async () => {
      await confirmConfig?.onConfirm?.();
    });
    expect(menuService.deleteItem).toHaveBeenCalledWith('r1', 'i1');
    expect(params.fetchMenu).toHaveBeenCalledWith('r1', { force: true });
  });

  it('sets menuError when delete fails', async () => {
    const params = makeParams();
    vi.mocked(menuService.deleteItem).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useVendorMenu(params));
    act(() => { result.current.handleDeleteMenuItem('i1'); });
    await act(async () => {
      await confirmConfig?.onConfirm?.();
    });
    await waitFor(() => { expect(result.current.menuError).toBe('Не удалось удалить позицию'); });
  });

  it('delete confirm returns early with no restaurant', async () => {
    const params = makeParams({ selectedRestaurant: null });
    const { result } = renderHook(() => useVendorMenu(params));
    act(() => { result.current.handleDeleteMenuItem('i1'); });
    await act(async () => {
      await confirmConfig?.onConfirm?.();
    });
    expect(menuService.deleteItem).not.toHaveBeenCalled();
  });

  it('exposes toggling setters', () => {
    const { result } = renderHook(() => useVendorMenu(makeParams()));
    act(() => { result.current.setShowAddItem(true); });
    expect(result.current.showAddItem).toBe(true);
  });
});
