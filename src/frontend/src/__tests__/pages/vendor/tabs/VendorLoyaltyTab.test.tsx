import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LoyaltyProgram, MenuItem, Restaurant } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';

const mocks = vi.hoisted(() => ({
  getProgram: vi.fn((..._a: unknown[]): Promise<unknown> => Promise.resolve()),
  upsertProgram: vi.fn((..._a: unknown[]): Promise<unknown> => Promise.resolve()),
}));

vi.mock('@shared/services/loyaltyService', () => ({
  loyaltyService: {
    getProgram: (...a: unknown[]) => mocks.getProgram(...a),
    upsertProgram: (...a: unknown[]) => mocks.upsertProgram(...a),
  },
}));

import { VendorLoyaltyTab } from '../../../../pages/vendor/tabs/VendorLoyaltyTab';

const restaurant = { id: 'r1', name: 'Тест' } as unknown as Restaurant;
const menu = [
  { id: 'm1', name: 'Шаурма' },
  { id: 'm2', name: 'Бургер' },
] as unknown as MenuItem[];

const notFoundError = {
  response: { status: 404, data: { detail: { code: 'LOYALTY_PROGRAM_NOT_FOUND' } } },
};

const cashbackProgram: LoyaltyProgram = {
  id: 'lp1',
  restaurant_id: 'r1',
  type: 'CASHBACK',
  is_active: true,
  tier_basis: 'ORDERS',
  min_order_amount: null,
  punches_required: null,
  reward_type: null,
  reward_value: null,
  reward_menu_item_id: null,
  max_redeem_percent: 50,
  tiers: [{ id: 't1', name: 'Базовый', threshold: 0, cashback_percent: 5 }],
};

const renderTab = () =>
  render(<VendorLoyaltyTab selectedRestaurant={restaurant} selectedMenu={menu} />);

describe('VendorLoyaltyTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProgram.mockRejectedValue(notFoundError);
  });

  it('renders an empty punch card form when the program is not configured', async () => {
    renderTab();
    expect(screen.getByText(t('loyalty.vendor.sectionTitle'))).toBeInTheDocument();
    await waitFor(() => { expect(mocks.getProgram).toHaveBeenCalledWith('r1'); });
    expect(screen.getByLabelText(t('loyalty.vendor.punchesRequired'))).toBeInTheDocument();
    expect(screen.queryByText(t('loyalty.vendor.errors.loadFailed'))).not.toBeInTheDocument();
  });

  it('loads an existing cashback program into the form', async () => {
    mocks.getProgram.mockResolvedValue({ data: { data: cashbackProgram } });
    renderTab();
    expect(await screen.findByDisplayValue('Базовый')).toBeInTheDocument();
    expect(screen.getByLabelText(t('loyalty.vendor.maxRedeemPercent'))).toHaveValue(50);
  });

  it('shows a load error for unexpected failures', async () => {
    mocks.getProgram.mockRejectedValue(new Error('down'));
    renderTab();
    expect(await screen.findByText(t('loyalty.vendor.errors.loadFailed'))).toBeInTheDocument();
  });

  it('switches the program type and shows the cashback block', async () => {
    const user = userEvent.setup();
    renderTab();
    await waitFor(() => { expect(mocks.getProgram).toHaveBeenCalled(); });
    await user.click(screen.getByRole('radio', { name: t('loyalty.programType.CASHBACK') }));
    expect(screen.getByLabelText(t('loyalty.vendor.tierBasisLabel'))).toBeInTheDocument();
    expect(screen.getByText(t('loyalty.vendor.tiers.title'))).toBeInTheDocument();
  });

  it('adds and removes tier rows', async () => {
    const user = userEvent.setup();
    renderTab();
    await waitFor(() => { expect(mocks.getProgram).toHaveBeenCalled(); });
    await user.click(screen.getByRole('radio', { name: t('loyalty.programType.CASHBACK') }));
    await user.click(screen.getByRole('button', { name: new RegExp(t('loyalty.vendor.tiers.add')) }));
    await user.click(screen.getByRole('button', { name: new RegExp(t('loyalty.vendor.tiers.add')) }));
    expect(screen.getAllByLabelText(t('loyalty.vendor.tiers.name'))).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: t('loyalty.vendor.tiers.remove') })[0] as HTMLElement);
    expect(screen.getAllByLabelText(t('loyalty.vendor.tiers.name'))).toHaveLength(1);
  });

  it('shows validation feedback when punches required is missing', async () => {
    const user = userEvent.setup();
    renderTab();
    await waitFor(() => { expect(mocks.getProgram).toHaveBeenCalled(); });
    await user.click(screen.getByRole('button', { name: t('common.actions.save') }));
    expect(
      screen.getByText(t('apiErrors.byCode.LOYALTY_PUNCHES_REQUIRED_MISSING')),
    ).toBeInTheDocument();
    expect(mocks.upsertProgram).not.toHaveBeenCalled();
  });

  it('shows validation feedback when a cashback program has no tiers', async () => {
    const user = userEvent.setup();
    renderTab();
    await waitFor(() => { expect(mocks.getProgram).toHaveBeenCalled(); });
    await user.click(screen.getByRole('radio', { name: t('loyalty.programType.CASHBACK') }));
    await user.click(screen.getByRole('button', { name: t('common.actions.save') }));
    expect(screen.getByText(t('apiErrors.byCode.LOYALTY_TIERS_REQUIRED'))).toBeInTheDocument();
    expect(mocks.upsertProgram).not.toHaveBeenCalled();
  });

  it('requires a free item selection for a FREE_ITEM reward', async () => {
    const user = userEvent.setup();
    renderTab();
    await waitFor(() => { expect(mocks.getProgram).toHaveBeenCalled(); });
    await user.type(screen.getByLabelText(t('loyalty.vendor.punchesRequired')), '5');
    await user.click(screen.getByRole('button', { name: t('common.actions.save') }));
    expect(
      screen.getByText(t('apiErrors.byCode.LOYALTY_REWARD_ITEM_REQUIRED')),
    ).toBeInTheDocument();
  });

  it('saves a punch card program and shows the saved confirmation', async () => {
    const user = userEvent.setup();
    mocks.upsertProgram.mockResolvedValue({
      data: {
        data: {
          ...cashbackProgram,
          type: 'PUNCH_CARD',
          punches_required: 5,
          reward_type: 'FREE_ITEM',
          reward_menu_item_id: 'm1',
          tiers: [],
        },
      },
    });
    renderTab();
    await waitFor(() => { expect(mocks.getProgram).toHaveBeenCalled(); });
    await user.type(screen.getByLabelText(t('loyalty.vendor.punchesRequired')), '5');
    await user.selectOptions(screen.getByLabelText(t('loyalty.vendor.freeItemLabel')), 'm1');
    await user.click(screen.getByRole('button', { name: t('common.actions.save') }));
    await waitFor(() => {
      expect(mocks.upsertProgram).toHaveBeenCalledWith('r1', {
        type: 'PUNCH_CARD',
        is_active: true,
        tier_basis: 'ORDERS',
        max_redeem_percent: 100,
        punches_required: 5,
        reward_type: 'FREE_ITEM',
        reward_menu_item_id: 'm1',
      });
    });
    expect(await screen.findByText(t('loyalty.vendor.saved'))).toBeInTheDocument();
  });

  it('saves a cashback program with tiers', async () => {
    const user = userEvent.setup();
    mocks.upsertProgram.mockResolvedValue({ data: { data: cashbackProgram } });
    renderTab();
    await waitFor(() => { expect(mocks.getProgram).toHaveBeenCalled(); });
    await user.click(screen.getByRole('radio', { name: t('loyalty.programType.CASHBACK') }));
    await user.click(screen.getByRole('button', { name: new RegExp(t('loyalty.vendor.tiers.add')) }));
    await user.type(screen.getByLabelText(t('loyalty.vendor.tiers.name')), 'Базовый');
    await user.type(screen.getByLabelText(t('loyalty.vendor.tiers.threshold')), '0');
    await user.type(screen.getByLabelText(t('loyalty.vendor.tiers.cashbackPercent')), '5');
    await user.click(screen.getByRole('button', { name: t('common.actions.save') }));
    await waitFor(() => {
      expect(mocks.upsertProgram).toHaveBeenCalledWith('r1', {
        type: 'CASHBACK',
        is_active: true,
        tier_basis: 'ORDERS',
        max_redeem_percent: 100,
        tiers: [{ name: 'Базовый', threshold: 0, cashback_percent: 5 }],
      });
    });
  });

  it('shows a save error from the API', async () => {
    const user = userEvent.setup();
    mocks.upsertProgram.mockRejectedValue({
      response: { status: 422, data: { detail: { code: 'LOYALTY_TIER_THRESHOLDS_DUPLICATE' } } },
    });
    renderTab();
    await waitFor(() => { expect(mocks.getProgram).toHaveBeenCalled(); });
    await user.type(screen.getByLabelText(t('loyalty.vendor.punchesRequired')), '5');
    await user.selectOptions(screen.getByLabelText(t('loyalty.vendor.freeItemLabel')), 'm1');
    await user.click(screen.getByRole('button', { name: t('common.actions.save') }));
    expect(
      await screen.findByText(t('apiErrors.byCode.LOYALTY_TIER_THRESHOLDS_DUPLICATE')),
    ).toBeInTheDocument();
  });

  it('renders nothing without a selected restaurant', () => {
    const { container } = render(
      <VendorLoyaltyTab selectedRestaurant={null} selectedMenu={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
