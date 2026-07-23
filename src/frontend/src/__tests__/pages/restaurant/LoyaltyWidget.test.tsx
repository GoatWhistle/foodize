import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LoyaltyStatus } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';
import { formatPrice } from '@shared/utils/price';

const mocks = vi.hoisted(() => ({
  getStatus: vi.fn((..._a: unknown[]): Promise<unknown> => Promise.resolve()),
}));

vi.mock('@shared/services/loyaltyService', () => ({
  loyaltyService: { getStatus: (...a: unknown[]) => mocks.getStatus(...a) },
}));

import { LoyaltyWidget } from '../../../pages/restaurant/components/LoyaltyWidget';

const baseStatus: LoyaltyStatus = {
  program: null,
  points_balance: 0,
  punches_count: 0,
  orders_count: 0,
  total_spent: 0,
  current_tier: null,
  next_tier: null,
  rewards: [],
};

const punchProgram = {
  id: 'lp1',
  restaurant_id: 'r1',
  type: 'PUNCH_CARD',
  is_active: true,
  tier_basis: 'ORDERS',
  min_order_amount: null,
  punches_required: 5,
  reward_type: 'FREE_ITEM',
  reward_value: null,
  reward_menu_item_id: 'm1',
  max_redeem_percent: 100,
  tiers: [],
} as LoyaltyStatus['program'];

const cashbackProgram = {
  ...(punchProgram as NonNullable<LoyaltyStatus['program']>),
  type: 'CASHBACK',
  tier_basis: 'SPENT',
  tiers: [
    { id: 't1', name: 'Базовый', threshold: 0, cashback_percent: 5 },
    { id: 't2', name: 'Золото', threshold: 5000, cashback_percent: 10 },
  ],
} as LoyaltyStatus['program'];

describe('LoyaltyWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when the program is inactive', async () => {
    mocks.getStatus.mockResolvedValue({ data: { data: baseStatus } });
    const { container } = render(<LoyaltyWidget restaurantId="r1" />);
    await vi.waitFor(() => { expect(mocks.getStatus).toHaveBeenCalledWith('r1'); });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when the request fails', async () => {
    mocks.getStatus.mockRejectedValue(new Error('down'));
    const { container } = render(<LoyaltyWidget restaurantId="r1" />);
    await vi.waitFor(() => { expect(mocks.getStatus).toHaveBeenCalled(); });
    expect(container.firstChild).toBeNull();
  });

  it('shows punches progress and the available rewards count', async () => {
    mocks.getStatus.mockResolvedValue({
      data: {
        data: {
          ...baseStatus,
          program: punchProgram,
          punches_count: 3,
          rewards: [
            {
              id: 'rw1',
              reward_type: 'FREE_ITEM',
              reward_value: null,
              reward_menu_item_id: 'm1',
              status: 'AVAILABLE',
              created_at: '2026-01-01T00:00:00Z',
            },
          ],
        },
      },
    });
    render(<LoyaltyWidget restaurantId="r1" />);
    expect(await screen.findByText(t('loyalty.widget.title'))).toBeInTheDocument();
    expect(
      screen.getByText(t('loyalty.widget.punchesProgress', { count: 3, total: 5 })),
    ).toBeInTheDocument();
    expect(
      screen.getByText(t('loyalty.widget.availableRewards', { count: 1 })),
    ).toBeInTheDocument();
  });

  it('shows the cashback balance, tier and progress to the next tier', async () => {
    mocks.getStatus.mockResolvedValue({
      data: {
        data: {
          ...baseStatus,
          program: cashbackProgram,
          points_balance: 250,
          total_spent: 1200,
          current_tier: { id: 't1', name: 'Базовый', threshold: 0, cashback_percent: 5 },
          next_tier: { id: 't2', name: 'Золото', threshold: 5000, cashback_percent: 10 },
        },
      },
    });
    render(<LoyaltyWidget restaurantId="r1" />);
    expect(
      await screen.findByText(new RegExp(t('loyalty.widget.pointsBalance'))),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(formatPrice(250)))).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(t('loyalty.widget.cashbackPercent', { percent: 5 }))),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        t('loyalty.widget.progressToNext', {
          tier: 'Золото',
          count: formatPrice(1200),
          total: formatPrice(5000),
        }),
      ),
    ).toBeInTheDocument();
  });

  it('shows the max tier message when there is no next tier', async () => {
    mocks.getStatus.mockResolvedValue({
      data: {
        data: {
          ...baseStatus,
          program: cashbackProgram,
          current_tier: { id: 't2', name: 'Золото', threshold: 5000, cashback_percent: 10 },
          next_tier: null,
        },
      },
    });
    render(<LoyaltyWidget restaurantId="r1" />);
    expect(await screen.findByText(t('loyalty.widget.maxTierReached'))).toBeInTheDocument();
  });
});
