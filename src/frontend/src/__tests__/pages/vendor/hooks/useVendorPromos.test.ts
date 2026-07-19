import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVendorPromos, type PromoForm } from '../../../../pages/vendor/hooks/useVendorPromos';
import { promoService } from '@shared/services/promoService';
import type { Restaurant } from '@shared/types/models';
import { at } from '../../../testUtils';

vi.mock('@shared/services/promoService', () => ({
  promoService: {
    list: vi.fn(),
    create: vi.fn(),
    deactivate: vi.fn(),
  },
}));

vi.mock('@shared/utils/translateApiError', () => ({
  translateApiError: (_e: unknown, fallback: string) => fallback,
}));

const restaurant = { id: 'r1' } as unknown as Restaurant;

const listResponse = (items: unknown[]) =>
  ({ data: { data: items } }) as unknown as Awaited<ReturnType<typeof promoService.list>>;

const fillForm = (): PromoForm => ({
  code: 'SAVE20',
  discount_type: 'PERCENT',
  discount_value: '20',
  max_uses: '5',
  expires_at: '2026-12-31T10:00',
  first_order_only: true,
  min_order_amount: '300',
  menu_category: 'SHAURMA',
});

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.FormEvent<HTMLFormElement>;

describe('useVendorPromos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not load when tab is not promos', () => {
    renderHook(() => useVendorPromos({ selectedRestaurant: restaurant, activeTab: 'orders' }));
    expect(promoService.list).not.toHaveBeenCalled();
  });

  it('loads promos when tab is promos', async () => {
    vi.mocked(promoService.list).mockResolvedValue(listResponse([{ id: 'p1', code: 'A' }]));
    const { result } = renderHook(() =>
      useVendorPromos({ selectedRestaurant: restaurant, activeTab: 'promos' })
    );
    await waitFor(() => { expect(result.current.promosList).toHaveLength(1); });
    expect(result.current.promosLoading).toBe(false);
  });

  it('handles list error', async () => {
    vi.mocked(promoService.list).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() =>
      useVendorPromos({ selectedRestaurant: restaurant, activeTab: 'promos' })
    );
    await waitFor(() => { expect(result.current.promosError).toBe('Не удалось загрузить промокоды'); });
  });

  it('handles non-array list payload', async () => {
    vi.mocked(promoService.list).mockResolvedValue(listResponse(null as never));
    const { result } = renderHook(() =>
      useVendorPromos({ selectedRestaurant: restaurant, activeTab: 'promos' })
    );
    await waitFor(() => { expect(promoService.list).toHaveBeenCalled(); });
    expect(result.current.promosList).toEqual([]);
  });

  it('returns early creating a promo with no restaurant', async () => {
    const { result } = renderHook(() =>
      useVendorPromos({ selectedRestaurant: null, activeTab: 'orders' })
    );
    await act(async () => {
      await result.current.handleCreatePromo(submitEvent());
    });
    expect(promoService.create).not.toHaveBeenCalled();
  });

  it('creates a promo with full payload and refreshes list', async () => {
    vi.useFakeTimers();
    vi.mocked(promoService.list).mockResolvedValue(listResponse([{ id: 'p1', code: 'SAVE20' }]));
    vi.mocked(promoService.create).mockResolvedValue({} as never);
    const { result } = renderHook(() =>
      useVendorPromos({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    act(() => { result.current.setPromoForm(fillForm()); });
    await act(async () => {
      await result.current.handleCreatePromo(submitEvent());
    });
    expect(promoService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SAVE20',
        discount_value: 20,
        restaurant_id: 'r1',
        max_uses: 5,
        min_order_amount: 300,
        menu_category: 'SHAURMA',
        first_order_only: true,
      })
    );
    expect(result.current.promosSuccess).toBe('Промокод создан');
    void act(() => vi.advanceTimersByTime(2000));
    expect(result.current.promosSuccess).toBe('');
    vi.useRealTimers();
  });

  it('creates a promo omitting optional fields', async () => {
    vi.mocked(promoService.list).mockResolvedValue(listResponse([]));
    vi.mocked(promoService.create).mockResolvedValue({} as never);
    const { result } = renderHook(() =>
      useVendorPromos({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    act(() =>
      { result.current.setPromoForm({
        code: 'X',
        discount_type: 'FIXED',
        discount_value: '10',
        max_uses: '',
        expires_at: '',
        first_order_only: false,
        min_order_amount: '',
        menu_category: '',
      }); }
    );
    await act(async () => {
      await result.current.handleCreatePromo(submitEvent());
    });
    const payload = at(vi.mocked(promoService.create).mock.calls, 0)[0];
    expect(payload).not.toHaveProperty('max_uses');
    expect(payload).not.toHaveProperty('expires_at');
  });

  it('sets error when create fails', async () => {
    vi.mocked(promoService.create).mockRejectedValue(new Error('bad'));
    const { result } = renderHook(() =>
      useVendorPromos({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    act(() => { result.current.setPromoForm(fillForm()); });
    await act(async () => {
      await result.current.handleCreatePromo(submitEvent());
    });
    expect(result.current.promosError).toBe('Ошибка создания промокода');
  });

  it('deactivates a promo removing it from the list', async () => {
    vi.mocked(promoService.list).mockResolvedValue(listResponse([{ id: 'p1', code: 'A' }, { id: 'p2', code: 'B' }]));
    vi.mocked(promoService.deactivate).mockResolvedValue({} as never);
    const { result } = renderHook(() =>
      useVendorPromos({ selectedRestaurant: restaurant, activeTab: 'promos' })
    );
    await waitFor(() => { expect(result.current.promosList).toHaveLength(2); });
    await act(async () => {
      await result.current.handleDeactivatePromo('A');
    });
    expect(result.current.promosList.map((p) => p.code)).toEqual(['B']);
  });

  it('sets error when deactivate fails', async () => {
    vi.mocked(promoService.deactivate).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() =>
      useVendorPromos({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    await act(async () => {
      await result.current.handleDeactivatePromo('A');
    });
    expect(result.current.promosError).toBe('Не удалось деактивировать промокод');
  });

  it('exposes form setters', () => {
    const { result } = renderHook(() =>
      useVendorPromos({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    act(() => { result.current.setShowPromoForm(true); });
    expect(result.current.showPromoForm).toBe(true);
  });
});
