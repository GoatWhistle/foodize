import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminBatchBars } from '../../../../pages/admin/components/AdminBatchBars';
import type { useAdminDashboard } from '../../../../pages/admin/useAdminDashboard';
import { at } from '../../../testUtils';

type Dashboard = ReturnType<typeof useAdminDashboard>;

const makeDashboard = (overrides: Partial<Dashboard> = {}): Dashboard =>
  ({
    selectedUserIds: new Set(['u1']),
    selectedReviewIds: new Set(['r1']),
    selectedVendorIds: new Set(['v1']),
    selectedRestaurantIds: new Set(['s1']),
    batchLoading: false,
    setSelectedUserIds: vi.fn(),
    setSelectedReviewIds: vi.fn(),
    setSelectedVendorIds: vi.fn(),
    setSelectedRestaurantIds: vi.fn(),
    handleBatchUsers: vi.fn(),
    handleBatchDeleteReviews: vi.fn(),
    handleBatchVendors: vi.fn().mockResolvedValue(undefined),
    handleBatchRestaurants: vi.fn().mockResolvedValue(undefined),
    requestReason: vi.fn(),
    ...overrides,
  }) as unknown as Dashboard;

describe('AdminBatchBars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders four batch bars with counts', () => {
    render(<AdminBatchBars dashboard={makeDashboard()} />);
    expect(screen.getByText(/пользователей/)).toBeInTheDocument();
    expect(screen.getByText(/отзывов/)).toBeInTheDocument();
    expect(screen.getByText(/вендоров/)).toBeInTheDocument();
    expect(screen.getByText(/ресторанов/)).toBeInTheDocument();
  });

  it('clears user selection', async () => {
    const user = userEvent.setup();
    const setSelectedUserIds = vi.fn();
    render(<AdminBatchBars dashboard={makeDashboard({ setSelectedUserIds })} />);
    const clearButtons = screen.getAllByRole('button', { name: 'Снять выделение' });
    await user.click(at(clearButtons, 0));
    expect(setSelectedUserIds).toHaveBeenCalledWith(new Set());
  });

  it('activates and deactivates users', async () => {
    const user = userEvent.setup();
    const handleBatchUsers = vi.fn();
    render(<AdminBatchBars dashboard={makeDashboard({ handleBatchUsers })} />);
    await user.click(screen.getByRole('button', { name: 'Активировать' }));
    await user.click(screen.getByRole('button', { name: 'Деактивировать' }));
    expect(handleBatchUsers).toHaveBeenCalledWith('activate');
    expect(handleBatchUsers).toHaveBeenCalledWith('deactivate');
  });

  it('deletes selected reviews', async () => {
    const user = userEvent.setup();
    const handleBatchDeleteReviews = vi.fn();
    render(<AdminBatchBars dashboard={makeDashboard({ handleBatchDeleteReviews })} />);
    await user.click(screen.getByRole('button', { name: 'Удалить выбранные' }));
    expect(handleBatchDeleteReviews).toHaveBeenCalled();
  });

  it('approves and rejects vendors', async () => {
    const user = userEvent.setup();
    const handleBatchVendors = vi.fn().mockResolvedValue(undefined);
    const requestReason = vi.fn();
    render(
      <AdminBatchBars
        dashboard={makeDashboard({ handleBatchVendors, requestReason })}
      />
    );
    const approveButtons = screen.getAllByRole('button', { name: 'Одобрить выбранных' });
    const rejectButtons = screen.getAllByRole('button', { name: 'Отклонить выбранных' });
    await user.click(at(approveButtons, 0));
    await user.click(at(rejectButtons, 0));
    expect(handleBatchVendors).toHaveBeenCalledWith('approve');
    expect(requestReason).toHaveBeenCalledWith(
      expect.objectContaining({ confirmLabel: 'Отклонить' })
    );
    const config = at(requestReason.mock.calls, 0)[0] as { onConfirm: (r: string) => void };
    config.onConfirm('bad');
    expect(handleBatchVendors).toHaveBeenCalledWith('reject', 'bad');
  });

  it('approves and rejects restaurants', async () => {
    const user = userEvent.setup();
    const handleBatchRestaurants = vi.fn().mockResolvedValue(undefined);
    const requestReason = vi.fn();
    render(
      <AdminBatchBars
        dashboard={makeDashboard({ handleBatchRestaurants, requestReason })}
      />
    );
    const approveButtons = screen.getAllByRole('button', { name: 'Одобрить выбранных' });
    const rejectButtons = screen.getAllByRole('button', { name: 'Отклонить выбранных' });
    await user.click(at(approveButtons, 1));
    await user.click(at(rejectButtons, 1));
    expect(handleBatchRestaurants).toHaveBeenCalledWith('approve');
    const config = at(requestReason.mock.calls, 0)[0] as { onConfirm: (r: string) => void };
    config.onConfirm('closed');
    expect(handleBatchRestaurants).toHaveBeenCalledWith('reject', 'closed');
  });

  it('clears review, vendor and restaurant selections', async () => {
    const user = userEvent.setup();
    const setSelectedReviewIds = vi.fn();
    const setSelectedVendorIds = vi.fn();
    const setSelectedRestaurantIds = vi.fn();
    render(
      <AdminBatchBars
        dashboard={makeDashboard({
          setSelectedReviewIds,
          setSelectedVendorIds,
          setSelectedRestaurantIds,
        })}
      />
    );
    const clearButtons = screen.getAllByRole('button', { name: 'Снять выделение' });
    await user.click(at(clearButtons, 1));
    await user.click(at(clearButtons, 2));
    await user.click(at(clearButtons, 3));
    expect(setSelectedReviewIds).toHaveBeenCalledWith(new Set());
    expect(setSelectedVendorIds).toHaveBeenCalledWith(new Set());
    expect(setSelectedRestaurantIds).toHaveBeenCalledWith(new Set());
  });
});
