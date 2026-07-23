import { vi, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { StaffProfile, MenuItem } from '@shared/types/models';
import type { StaffOrder } from '../../../../pages/staff/types';
import { staffService } from '@shared/services/staffService';
import { useStaffDashboard } from '../../../../pages/staff/hooks/useStaffDashboard';

export const PROFILE = {
  restaurant_id: 'r1',
  role: 'COOK',
} as unknown as StaffProfile;

export const order = (over: Partial<StaffOrder>): StaffOrder =>
  ({
    id: 'o1',
    status: 'PENDING',
    items: [{ menu_item_prep_time: 20 }],
    created_at: new Date().toISOString(),
    ...over,
  }) as unknown as StaffOrder;

export const menuItem: MenuItem = { id: 'm1', is_available: true } as unknown as MenuItem;

export const mockResolved = (fn: ReturnType<typeof vi.fn>, data: unknown) =>
  vi.mocked(fn).mockResolvedValue({ data: { data } });

export const setupHappy = (orders: StaffOrder[] = [order({})]) => {
  mockResolved(staffService.getMyProfile as never, PROFILE);
  mockResolved(staffService.getRestaurantOrders as never, orders);
  mockResolved(staffService.getMenu as never, [menuItem]);
  vi.mocked(staffService.updateOrderStatus).mockResolvedValue({} as never);
  vi.mocked(staffService.cancelOrder).mockResolvedValue({} as never);
  vi.mocked(staffService.toggleMenuItemAvailability).mockResolvedValue({} as never);
};

export const renderReady = async () => {
  const hook = renderHook(() => useStaffDashboard());
  await waitFor(() => { expect(hook.result.current.profile).not.toBeNull(); });
  await waitFor(() => { expect(hook.result.current.ordersLoading).toBe(false); });
  return hook;
};
