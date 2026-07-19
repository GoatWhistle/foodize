import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { VendorPromosTab } from '../../../../pages/vendor/tabs/VendorPromosTab';
import type { Promo, Restaurant } from '@shared/types/models';
import type { PromoForm as PromoFormValues } from '../../../../pages/vendor/hooks/useVendorPromos';

const EMPTY_FORM: PromoFormValues = {
  code: '',
  discount_type: 'PERCENT',
  discount_value: '',
  max_uses: '',
  expires_at: '',
  first_order_only: false,
  min_order_amount: '',
  menu_category: '',
};

const promos: Promo[] = [
  {
    id: 'p1',
    code: 'SAVE20',
    discount_type: 'PERCENT',
    discount_value: 20,
    used_count: 0,
    max_uses: 10,
    expires_at: null,
    is_active: true,
  },
] as unknown as Promo[];

const Harness = ({
  restaurant = { id: 'r1' } as unknown as Restaurant,
  list = promos,
  loading = false,
  error = '',
  success = '',
  showForm = false,
  formLoading = false,
  deactivating = null,
  onCreate = vi.fn(),
  onDeactivate = vi.fn(),
}: Record<string, unknown>) => {
  const [show, setShow] = useState(showForm as boolean);
  const [form, setForm] = useState<PromoFormValues>(EMPTY_FORM);
  return (
    <VendorPromosTab
      selectedRestaurant={restaurant as Restaurant | null}
      promosList={list as Promo[]}
      promosLoading={loading as boolean}
      promosError={error as string}
      promosSuccess={success as string}
      showPromoForm={show}
      setShowPromoForm={setShow}
      promoForm={form}
      setPromoForm={setForm}
      promoFormLoading={formLoading as boolean}
      deactivatingPromo={deactivating as string | null}
      handleCreatePromo={onCreate as never}
      handleDeactivatePromo={onDeactivate as (code: string) => void}
    />
  );
};

describe('VendorPromosTab', () => {
  it('renders list of promos', () => {
    render(<Harness />);
    expect(screen.getByText('SAVE20')).toBeInTheDocument();
  });

  it('shows error and success banners', () => {
    render(<Harness error="Плохо" success="Хорошо" />);
    expect(screen.getByText('Плохо')).toBeInTheDocument();
    expect(screen.getByText('Хорошо')).toBeInTheDocument();
  });

  it('toggles the promo form open', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /Создать/ }));
    expect(screen.getByText('Новый промокод')).toBeInTheDocument();
  });

  it('renders form when showPromoForm and can cancel it', async () => {
    const user = userEvent.setup();
    render(<Harness showForm />);
    expect(screen.getByText('Новый промокод')).toBeInTheDocument();
    const cancelBtn = screen.getAllByRole('button').find((b) => b.getAttribute('type') === 'button' && b.querySelector('svg'));
    await user.click(cancelBtn as HTMLElement);
    expect(screen.queryByText('Новый промокод')).not.toBeInTheDocument();
  });

  it('shows skeleton while loading with empty list', () => {
    render(<Harness list={[]} loading />);
    expect(screen.queryByText('Нет промокодов')).not.toBeInTheDocument();
  });

  it('shows empty state when no promos', () => {
    render(<Harness list={[]} />);
    expect(screen.getByText('Нет промокодов')).toBeInTheDocument();
  });

  it('deactivates a promo', async () => {
    const user = userEvent.setup();
    const onDeactivate = vi.fn();
    render(<Harness onDeactivate={onDeactivate} />);
    await user.click(screen.getByTitle('Деактивировать'));
    expect(onDeactivate).toHaveBeenCalledWith('SAVE20');
  });

  it('hides create button when no restaurant selected', () => {
    render(<Harness restaurant={null} />);
    expect(screen.queryByRole('button', { name: /Создать/ })).not.toBeInTheDocument();
  });
});
