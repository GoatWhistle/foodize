import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { t } from '@shared/i18n/useTranslation';
import { COLUMN_DEFS } from '../../pages/staff/staffColumns';
import { at } from '../testUtils';
import { APPROVED_PROFILE, MOCK_ORDER, renderStaffPage } from './staffDashboardHarness';

vi.mock('@shared/services/staffService.js', () => ({
  staffService: {
    getMyProfile: vi.fn(),
    getRestaurantOrders: vi.fn(),
    getMenu: vi.fn(),
    getMyApplication: vi.fn().mockResolvedValue({ data: { data: { status: 'PENDING' } } }),
    updateOrderStatus: vi.fn(),
    acceptOrder: vi.fn(),
    cancelOrder: vi.fn(),
    toggleMenuItemAvailability: vi.fn(),
  },
}));

vi.mock('../../services/api', () => ({
  createRestaurantOrdersWebSocket: vi.fn(() => ({ close: vi.fn() })),
}));

vi.mock('@shared/utils/locales.js', async () => {
  const actual = await vi.importActual('@shared/utils/locales.js');
  return actual;
});

const { staffService } = await import('@shared/services/staffService.js');

describe('StaffDashboardPage actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(staffService.getMyProfile).mockResolvedValue({
      data: { data: APPROVED_PROFILE },
    } as unknown as Awaited<ReturnType<typeof staffService.getMyProfile>>);
    vi.mocked(staffService.getRestaurantOrders).mockResolvedValue({
      data: { data: [MOCK_ORDER] },
    } as unknown as Awaited<ReturnType<typeof staffService.getRestaurantOrders>>);
    vi.mocked(staffService.getMenu).mockResolvedValue({
      data: { data: [] },
    } as unknown as Awaited<ReturnType<typeof staffService.getMenu>>);
  });

  it('accepts order and moves it', async () => {
    localStorage.setItem('staff_auto_eta', 'true');
    const user = userEvent.setup();
    vi.mocked(staffService.updateOrderStatus).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof staffService.updateOrderStatus>>
    );

    renderStaffPage();

    await screen.findByText('#1001');

    const acceptBtn = await screen.findByRole('button', { name: t('staff.card.next.accept') });
    await user.click(acceptBtn);

    await waitFor(() => {
      expect(staffService.updateOrderStatus).toHaveBeenCalledWith(
        'order-1',
        'ACCEPTED',
        { estimated_ready_in_minutes: 15 }
      );
    });

    localStorage.removeItem('staff_auto_eta');
  });

  it('switches to menu tab', async () => {
    const user = userEvent.setup();
    renderStaffPage();

    await screen.findByText(t(at(COLUMN_DEFS, 0).labelKey));

    const menuTab = screen.getByRole('button', { name: t('staff.dashboard.tabs.menu') });
    await user.click(menuTab);

    expect(await screen.findByText(t('staff.menuTab.emptyTitle'))).toBeInTheDocument();
    expect(screen.queryByText(t(at(COLUMN_DEFS, 0).labelKey))).toBeNull();
  });

  it('toggles auto-eta preference and persists it', async () => {
    localStorage.removeItem('staff_auto_eta');
    const user = userEvent.setup();
    renderStaffPage();

    await screen.findByText(t(at(COLUMN_DEFS, 0).labelKey));

    const autoEtaCheckbox = screen.getByRole('checkbox', { name: t('staff.dashboard.autoEta') });
    await user.click(autoEtaCheckbox);

    expect(localStorage.getItem('staff_auto_eta')).toBe('true');
    expect(autoEtaCheckbox).toBeChecked();
  });

  it('opens the ETA modal when advancing without auto-eta and confirms it', async () => {
    localStorage.setItem('staff_auto_eta', 'false');
    const user = userEvent.setup();
    vi.mocked(staffService.updateOrderStatus).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof staffService.updateOrderStatus>>
    );
    renderStaffPage();

    await screen.findByText('#1001');
    await user.click(await screen.findByRole('button', { name: t('staff.card.next.accept') }));

    const confirmBtn = await screen.findByRole('button', { name: t('staff.etaModal.confirm') });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(staffService.updateOrderStatus).toHaveBeenCalledWith(
        'order-1',
        'ACCEPTED',
        expect.objectContaining<Record<string, unknown>>({ estimated_ready_in_minutes: expect.any(Number) as unknown })
      );
    });
    localStorage.removeItem('staff_auto_eta');
  });

  it('closes the ETA modal without updating on cancel', async () => {
    localStorage.setItem('staff_auto_eta', 'false');
    const user = userEvent.setup();
    renderStaffPage();

    await screen.findByText('#1001');
    await user.click(await screen.findByRole('button', { name: t('staff.card.next.accept') }));

    await screen.findByRole('button', { name: t('staff.etaModal.confirm') });
    await user.click(screen.getByRole('button', { name: t('common.actions.cancel') }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: t('staff.etaModal.confirm') })).toBeNull();
    });
    expect(staffService.updateOrderStatus).not.toHaveBeenCalled();
    localStorage.removeItem('staff_auto_eta');
  });

  it('toggles menu item availability on the stop-list tab', async () => {
    vi.mocked(staffService.getMenu).mockResolvedValue({
      data: {
        data: [
          { id: 'm1', name: 'Салат', category: 'MAIN', price: 200, is_available: true },
        ],
      },
    } as unknown as Awaited<ReturnType<typeof staffService.getMenu>>);
    vi.mocked(staffService.toggleMenuItemAvailability).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof staffService.toggleMenuItemAvailability>>
    );
    const user = userEvent.setup();
    renderStaffPage();

    await screen.findByText(t(at(COLUMN_DEFS, 0).labelKey));
    await user.click(screen.getByRole('button', { name: t('staff.dashboard.tabs.menu') }));

    const toggle = await screen.findByRole('button', { name: t('staff.menuTab.on') });
    await user.click(toggle);

    await waitFor(() => {
      expect(staffService.toggleMenuItemAvailability).toHaveBeenCalledWith(
        'resto-1',
        'm1',
        false
      );
    });
  });

  it('cancels an order with a reason', async () => {
    const user = userEvent.setup();
    vi.mocked(staffService.cancelOrder).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof staffService.cancelOrder>>
    );
    renderStaffPage();

    await screen.findByText('#1001');

    const cancelIcon = screen.getByRole('button', { name: '' });
    await user.click(cancelIcon);

    const reasonField = await screen.findByPlaceholderText(t('staff.card.cancel.reasonPlaceholder'));
    await user.type(reasonField, 'нет продукта');
    await user.click(screen.getByRole('button', { name: t('common.actions.confirm') }));

    await waitFor(() => {
      expect(staffService.cancelOrder).toHaveBeenCalledWith('order-1', 'нет продукта');
    });
  });
});
