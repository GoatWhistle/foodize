import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const restaurantsState = {
  restaurants: [],
  loading: false,
  selectedRestaurant: null as { id: string } | null,
  setSelectedRestaurant: vi.fn(),
  vendorProfile: null,
  fetchMenu: vi.fn(),
  addMenuItem: vi.fn(),
  menus: {} as Record<string, unknown[]>,
  showAddRestaurant: false,
  setShowAddRestaurant: vi.fn(),
  newRestaurant: {},
  setNewRestaurant: vi.fn(),
  editRestaurant: null,
  setEditRestaurant: vi.fn(),
  handleCreateRestaurant: vi.fn(),
  handleUpdateRestaurant: vi.fn(),
  workingHours: [],
  setWorkingHours: vi.fn(),
  workingHoursLoading: false,
  workingHoursSaved: false,
  workingHoursError: '',
  handleSaveWorkingHours: vi.fn(),
};

vi.mock('../../../../pages/vendor/hooks/useVendorFormState', () => ({
  useVendorFormState: () => ({
    formLoading: false,
    setFormLoading: vi.fn(),
    formError: '',
    setFormError: vi.fn(),
  }),
}));

vi.mock('../../../../pages/vendor/hooks/useVendorRestaurants', () => ({
  useVendorRestaurants: () => restaurantsState,
}));

vi.mock('../../../../pages/vendor/hooks/useVendorMenu', () => ({
  useVendorMenu: () => ({
    showAddItem: false,
    setShowAddItem: vi.fn(),
    editingItem: null,
    setEditingItem: vi.fn(),
    menuItemForm: {},
    setMenuItemForm: vi.fn(),
    menuError: '',
    menuSuccess: '',
    handleSaveMenuItem: vi.fn(),
    handleDeleteMenuItem: vi.fn(),
  }),
}));

vi.mock('../../../../pages/vendor/hooks/useVendorOrders', () => ({
  useVendorOrders: () => ({
    restaurantOrders: [],
    ordersPage: 1,
    setOrdersPage: vi.fn(),
    ordersTotal: 0,
    ordersStatusFilter: '',
    setOrdersStatusFilter: vi.fn(),
    ordersDateFromFilter: '',
    setOrdersDateFromFilter: vi.fn(),
    ordersDateToFilter: '',
    setOrdersDateToFilter: vi.fn(),
    ordersLoading: false,
    updatingOrderId: null,
    selectedOrder: null,
    setSelectedOrder: vi.fn(),
    ordersError: '',
    setOrdersError: vi.fn(),
    fetchVendorOrders: vi.fn(),
    handleOrderChange: vi.fn(),
    handleCancelOrder: vi.fn(),
  }),
}));

vi.mock('../../../../pages/vendor/hooks/useVendorPromos', () => ({
  useVendorPromos: () => ({
    promosList: [],
    promosLoading: false,
    promosError: '',
    promosSuccess: '',
    showPromoForm: false,
    setShowPromoForm: vi.fn(),
    promoForm: {},
    setPromoForm: vi.fn(),
    promoFormLoading: false,
    deactivatingPromo: null,
    handleCreatePromo: vi.fn(),
    handleDeactivatePromo: vi.fn(),
  }),
}));

vi.mock('../../../../pages/vendor/hooks/useVendorStaff', () => ({
  useVendorStaff: () => ({
    staffRequests: [],
    staffPage: 1,
    setStaffPage: vi.fn(),
    staffTotal: 0,
    staffMembers: [],
    staffMembersPage: 1,
    setStaffMembersPage: vi.fn(),
    staffMembersTotal: 0,
    staffSubTab: 'requests',
    setStaffSubTab: vi.fn(),
    staffMemberRemoving: null,
    staffDecisionLoading: false,
    handleStaffDecision: vi.fn(),
    handleRemoveStaffMember: vi.fn(),
  }),
}));

vi.mock('../../../../pages/vendor/hooks/useVendorFinance', () => ({
  useVendorFinance: () => ({
    finance: null,
    financeLoading: false,
    advancedAnalytics: null,
    analyticsLoading: false,
    financeFilters: {},
    setFinanceFilters: vi.fn(),
    activePreset: null,
    setActivePreset: vi.fn(),
  }),
}));

vi.mock('../../../../pages/vendor/hooks/useVendorExport', () => ({
  useVendorExport: () => ({
    exportLoading: false,
    handleVendorExport: vi.fn(),
  }),
}));

const { useVendorDashboard } = await import('../../../../pages/vendor/useVendorDashboard');

describe('useVendorDashboard', () => {
  beforeEach(() => {
    restaurantsState.selectedRestaurant = null;
    restaurantsState.menus = {};
    vi.clearAllMocks();
  });

  it('returns empty selectedMenu when no restaurant is selected', () => {
    const { result } = renderHook(() => useVendorDashboard());
    expect(result.current.selectedMenu).toEqual([]);
    expect(result.current.activeTab).toBe('menu');
  });

  it('returns the menu for the selected restaurant', () => {
    restaurantsState.selectedRestaurant = { id: 'r1' };
    restaurantsState.menus = { r1: [{ id: 'm1' }] };
    const { result } = renderHook(() => useVendorDashboard());
    expect(result.current.selectedMenu).toEqual([{ id: 'm1' }]);
  });

  it('falls back to empty array when the selected restaurant has no menu entry', () => {
    restaurantsState.selectedRestaurant = { id: 'r2' };
    restaurantsState.menus = {};
    const { result } = renderHook(() => useVendorDashboard());
    expect(result.current.selectedMenu).toEqual([]);
  });

  it('updates local ui state via setters', () => {
    const { result } = renderHook(() => useVendorDashboard());
    act(() => {
      result.current.setActiveTab('orders');
      result.current.setShowQr(true);
      result.current.setQrType('telegram');
    });
    expect(result.current.activeTab).toBe('orders');
    expect(result.current.showQr).toBe(true);
    expect(result.current.qrType).toBe('telegram');
  });
});
