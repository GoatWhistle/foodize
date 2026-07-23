import { screen, waitFor } from '@testing-library/react';
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

describe('StaffDashboardPage rendering', () => {
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

  it('shows loading state initially', () => {
    vi.mocked(staffService.getMyProfile).mockReturnValue(
      new Promise(() => {})
    );
    const { container } = renderStaffPage();
    expect(container.querySelector('.spinner')).not.toBeNull();
    expect(screen.queryByText(t(at(COLUMN_DEFS, 0).labelKey))).toBeNull();
  });

  it('renders kanban columns for approved staff', async () => {
    renderStaffPage();

    await waitFor(() => {
      expect(screen.getByText(t(at(COLUMN_DEFS, 0).labelKey))).toBeInTheDocument();
      expect(screen.getByText(t(at(COLUMN_DEFS, 1).labelKey))).toBeInTheDocument();
      expect(screen.getByText(t(at(COLUMN_DEFS, 2).labelKey))).toBeInTheDocument();
    });
  });

  it('shows order in pending column', async () => {
    renderStaffPage();

    await waitFor(() => {
      expect(screen.getByText('#1001')).toBeInTheDocument();
    });
  });

  it('hides kanban when profile fetch fails', async () => {
    vi.mocked(staffService.getMyProfile).mockRejectedValue(new Error('Not found'));

    renderStaffPage();

    await waitFor(() => {
      expect(screen.queryByText(t(at(COLUMN_DEFS, 0).labelKey))).toBeNull();
    });
  });
});
