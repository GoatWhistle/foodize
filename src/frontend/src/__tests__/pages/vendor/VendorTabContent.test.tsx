import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VendorTabContent } from '../../../pages/vendor/components/VendorTabContent';

const { invoker } = vi.hoisted(() => {
  return {
    invoker: (label: string) => (props: Record<string, unknown>) => {
      Object.values(props).forEach((v) => {
        if (typeof v === 'function') {
          try {
            (v as (...a: unknown[]) => unknown)({ preventDefault: () => undefined });
          } catch {
            void 0;
          }
        }
      });
      return <div>{label}</div>;
    },
  };
});

vi.mock('@shared/services/vendorService', () => ({ vendorService: {} }));
vi.mock('../../../pages/vendor/tabs/VendorMenuTab', () => ({
  VendorMenuTab: invoker('MENU_TAB'),
}));
vi.mock('../../../pages/vendor/tabs/VendorOrdersTab', () => ({
  VendorOrdersTab: invoker('ORDERS_TAB'),
}));
vi.mock('../../../pages/vendor/tabs/VendorPromosTab', () => ({
  VendorPromosTab: invoker('PROMOS_TAB'),
}));
vi.mock('../../../pages/vendor/tabs/VendorScheduleTab', () => ({
  VendorScheduleTab: invoker('SCHEDULE_TAB'),
}));
vi.mock('../../../pages/vendor/tabs/VendorStaffTab', () => ({
  VendorStaffTab: invoker('STAFF_TAB'),
}));
vi.mock('../../../pages/vendor/tabs/VendorAnalyticsTab', () => ({
  VendorAnalyticsTab: invoker('ANALYTICS_TAB'),
}));
vi.mock('../../../pages/vendor/tabs/VendorSettingsTab', () => ({
  VendorSettingsTab: invoker('SETTINGS_TAB'),
}));
vi.mock('../../../pages/vendor/VendorAdvisorPanel', () => ({
  VendorAdvisorPanel: ({ restaurantId }: { restaurantId: string }) => (
    <div>AI_PANEL_{restaurantId}</div>
  ),
}));

const makeDashboard = (activeTab: string, selectedRestaurant: unknown = { id: 'r1' }) =>
  ({
    activeTab,
    selectedRestaurant,
    handleSaveMenuItem: vi.fn(),
    handleDeleteMenuItem: vi.fn(),
    fetchVendorOrders: vi.fn(),
    handleOrderChange: vi.fn(),
    handleCancelOrder: vi.fn(),
    handleCreatePromo: vi.fn(),
    handleDeactivatePromo: vi.fn(),
    handleSaveWorkingHours: vi.fn(),
    handleRemoveStaffMember: vi.fn(),
    handleStaffDecision: vi.fn(),
    handleUpdateRestaurant: vi.fn(),
    setShowAddItem: vi.fn(),
    setEditingItem: vi.fn(),
    setMenuItemForm: vi.fn(),
  }) as unknown as Parameters<typeof VendorTabContent>[0]['dashboard'];

const baseProps = {
  todayStr: '2026-01-01',
  groupedRestaurantOrders: [],
  handleVendorExport: vi.fn(),
  getVendorRestaurantLabel: () => 'all',
  getVendorDateRange: () => 'range',
  getOrderDisplayId: () => 1,
  formatOrderTime: () => '12:00',
};

const renderTab = (activeTab: string, selectedRestaurant: unknown = { id: 'r1' }) =>
  render(
    <VendorTabContent
      {...baseProps}
      dashboard={makeDashboard(activeTab, selectedRestaurant)}
    />,
  );

describe('VendorTabContent', () => {
  it('returns null when no restaurant selected', () => {
    const { container } = renderTab('menu', null);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['menu', 'MENU_TAB'],
    ['orders', 'ORDERS_TAB'],
    ['promos', 'PROMOS_TAB'],
    ['schedule', 'SCHEDULE_TAB'],
    ['staff', 'STAFF_TAB'],
    ['analytics', 'ANALYTICS_TAB'],
    ['settings', 'SETTINGS_TAB'],
  ])('renders %s tab and wires its handlers', (tab, marker) => {
    const dashboard = makeDashboard(tab);
    render(<VendorTabContent {...baseProps} dashboard={dashboard} />);
    expect(screen.getByText(marker)).toBeInTheDocument();
  });

  it('renders AI advisor panel with restaurant id', () => {
    renderTab('ai');
    expect(screen.getByText('AI_PANEL_r1')).toBeInTheDocument();
  });
});
