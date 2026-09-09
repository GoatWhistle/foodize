import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { AdminReviewsTab } from '../../../../pages/admin/tabs/AdminReviewsTab';
import type { AdminReview } from '../../../../pages/admin/hooks/useAdminReviews';
import type { adminService as adminServiceType } from '../../../../services/adminService';
import { t } from '@shared/i18n/useTranslation';
import { at, req } from '../../../testUtils';

const reviews: AdminReview[] = [
  {
    id: 'rv1',
    restaurant_id: 'rest1',
    restaurant_name: 'Пицца',
    rating: 5,
    is_verified_purchase: true,
    user_name: 'Иван',
    created_at: '2026-01-01T10:00:00Z',
    text: 'Отлично',
  },
  {
    id: 'rv2',
    restaurant_id: 'rest2abcdef',
    rating: 2,
    is_verified_purchase: false,
    user_id: 'u2abcdef',
    created_at: null,
  },
] as unknown as AdminReview[];

const csvFn = vi.fn(() => Promise.resolve(new Blob()));
const adminService = { exportReviewsCSV: csvFn } as unknown as typeof adminServiceType;

const baseProps = (over: Partial<Parameters<typeof AdminReviewsTab>[0]> = {}) => ({
  reviews,
  reviewsLoading: false,
  reviewsTotal: 2,
  reviewsPage: 1,
  setReviewsPage: vi.fn(),
  reviewFilters: { rating: '' },
  setReviewFilters: vi.fn(),
  selectedReviewIds: new Set<string>(),
  setSelectedReviewIds: vi.fn(),
  exportLoading: false,
  handleExport: vi.fn(),
  handleDeleteReview: vi.fn(),
  todayStr: '2026-07-18',
  adminService,
  PAGE_SIZE: 20,
  ...over,
});

describe('AdminReviewsTab', () => {
  it('shows skeleton while loading empty', () => {
    render(<AdminReviewsTab {...baseProps({ reviews: [], reviewsLoading: true })} />);
    expect(screen.queryByText(t('admin.reviews.emptyTitle'))).not.toBeInTheDocument();
    expect(screen.queryByText('CSV')).not.toBeInTheDocument();
  });

  it('renders reviews with verified badge, text and fallbacks', () => {
    render(<AdminReviewsTab {...baseProps()} />);
    expect(screen.getByText('Пицца')).toBeInTheDocument();
    expect(screen.getByText(t('admin.reviews.verifiedPurchase'))).toBeInTheDocument();
    expect(screen.getByText('Отлично')).toBeInTheDocument();
    expect(screen.getByText('Иван · 01.01.2026, 13:00')).toBeInTheDocument();
    expect(screen.getByText('rest2abc')).toBeInTheDocument();
    expect(screen.getByText(/u2abcdef/)).toBeInTheDocument();
  });

  it('dims the list while reloading with existing reviews', () => {
    const { container } = render(<AdminReviewsTab {...baseProps({ reviewsLoading: true })} />);
    expect(container.querySelector('.loading-dim')).not.toBeNull();
  });

  it('keeps the header checkbox unchecked when there are no reviews', () => {
    render(<AdminReviewsTab {...baseProps({ reviews: [] })} />);
    const boxes = screen.queryAllByRole('checkbox');
    boxes.forEach((box) => { expect(box).not.toBeChecked(); });
  });

  it('renders empty state', () => {
    render(<AdminReviewsTab {...baseProps({ reviews: [] })} />);
    expect(screen.getByText(t('admin.reviews.emptyTitle'))).toBeInTheDocument();
  });

  it('filters by rating and resets page', async () => {
    const setReviewFilters = vi.fn();
    const setReviewsPage = vi.fn();
    render(<AdminReviewsTab {...baseProps({ setReviewFilters, setReviewsPage })} />);
    await userEvent.click(screen.getByRole('button', { name: /5/ }));
    expect(setReviewsPage).toHaveBeenCalledWith(1);
    expect(setReviewFilters).toHaveBeenCalledWith({ rating: '5' });
    await userEvent.click(screen.getByRole('button', { name: t('admin.reviews.allRatings') }));
    expect(setReviewFilters).toHaveBeenLastCalledWith({ rating: '' });
  });

  it('select all and clear via header checkbox', async () => {
    const setSelectedReviewIds = vi.fn();
    render(<AdminReviewsTab {...baseProps({ setSelectedReviewIds })} />);
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(at(checkboxes, 0));
    expect(setSelectedReviewIds).toHaveBeenCalled();
    const arg = at(setSelectedReviewIds.mock.calls, 0)[0] as Set<string>;
    expect(Array.from(arg)).toEqual(['rv1', 'rv2']);
  });

  it('toggles a single review checkbox', async () => {
    const onIds = vi.fn();
    const Harness = () => {
      const [ids, setIds] = useState<Set<string>>(new Set());
      return (
        <AdminReviewsTab
          {...baseProps()}
          selectedReviewIds={ids}
          setSelectedReviewIds={(u) => {
            setIds((prev) => {
              const next = typeof u === 'function' ? u(prev) : u;
              onIds(Array.from(next));
              return next;
            });
          }}
        />
      );
    };
    render(<Harness />);
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(at(checkboxes, 1));
    expect(onIds).toHaveBeenLastCalledWith(['rv1']);
    await userEvent.click(at(checkboxes, 1));
    expect(onIds).toHaveBeenLastCalledWith([]);
  });

  it('exports CSV and deletes review', async () => {
    const handleExport = vi.fn();
    const handleDeleteReview = vi.fn();
    render(
      <AdminReviewsTab
        {...baseProps({
          handleExport,
          handleDeleteReview,
          reviewFilters: { rating: '4' },
        })}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /CSV/ }));
    expect(handleExport).toHaveBeenCalledWith(
      expect.any(Function),
      t('admin.exportFiles.reviews', { date: '2026-07-18' }),
    );
    const exportFn = at(handleExport.mock.calls, 0)[0] as () => Promise<Blob>;
    void exportFn();
    expect(csvFn).toHaveBeenCalledWith({ min_rating: '4', max_rating: '4' });
    await userEvent.click(at(screen.getAllByTitle(t('admin.reviews.deleteTitle')), 0));
    expect(handleDeleteReview).toHaveBeenCalledWith('rv1');
  });

  it('disables export and shows ellipsis when exportLoading', () => {
    render(<AdminReviewsTab {...baseProps({ exportLoading: true })} />);
    const btn = req(screen.getByText('...').closest('button'));
    expect(btn).toBeDisabled();
  });
});
