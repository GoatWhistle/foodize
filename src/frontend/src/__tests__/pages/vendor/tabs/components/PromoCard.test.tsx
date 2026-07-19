import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PromoCard } from '../../../../../pages/vendor/tabs/components/PromoCard';
import type { Promo } from '@shared/types/models';

const makePromo = (overrides: Partial<Promo> = {}): Promo =>
  ({
    id: 'p1',
    code: 'SAVE20',
    discount_type: 'PERCENT',
    discount_value: 20,
    used_count: 2,
    max_uses: 10,
    expires_at: null,
    first_order_only: false,
    min_order_amount: null,
    menu_category: null,
    is_active: true,
    ...overrides,
  }) as unknown as Promo;

describe('PromoCard', () => {
  it('renders percent promo with active badge and conditions', () => {
    const promo = makePromo({
      first_order_only: true,
      min_order_amount: 500,
      menu_category: 'SHAURMA',
      expires_at: '2026-12-31T00:00:00Z',
    });
    render(<PromoCard promo={promo} deactivating={false} onDeactivate={vi.fn()} />);
    expect(screen.getByText('SAVE20')).toBeInTheDocument();
    expect(screen.getByText(/20%/)).toBeInTheDocument();
    expect(screen.getByText(/Условия:/)).toBeInTheDocument();
    expect(screen.getByText('Активен')).toBeInTheDocument();
  });

  it('renders fixed discount and infinite uses without conditions', () => {
    const promo = makePromo({
      discount_type: 'FIXED',
      discount_value: 100,
      max_uses: null,
    });
    render(<PromoCard promo={promo} deactivating={false} onDeactivate={vi.fn()} />);
    expect(screen.getByText(/∞/)).toBeInTheDocument();
    expect(screen.queryByText(/Условия:/)).not.toBeInTheDocument();
  });

  it('renders unknown menu_category label as raw value', () => {
    const promo = makePromo({ menu_category: 'MYSTERY' });
    render(<PromoCard promo={promo} deactivating={false} onDeactivate={vi.fn()} />);
    expect(screen.getByText(/MYSTERY/)).toBeInTheDocument();
  });

  it('calls onDeactivate when active and clicked', async () => {
    const user = userEvent.setup();
    const onDeactivate = vi.fn();
    render(<PromoCard promo={makePromo()} deactivating={false} onDeactivate={onDeactivate} />);
    await user.click(screen.getByTitle('Деактивировать'));
    expect(onDeactivate).toHaveBeenCalledWith('SAVE20');
  });

  it('hides deactivate button when inactive and shows finished badge', () => {
    render(
      <PromoCard promo={makePromo({ is_active: false })} deactivating={false} onDeactivate={vi.fn()} />
    );
    expect(screen.getByText('Завершён')).toBeInTheDocument();
    expect(screen.queryByTitle('Деактивировать')).not.toBeInTheDocument();
  });

  it('disables deactivate button while deactivating', () => {
    render(<PromoCard promo={makePromo()} deactivating onDeactivate={vi.fn()} />);
    expect(screen.getByTitle('Деактивировать')).toBeDisabled();
  });
});
