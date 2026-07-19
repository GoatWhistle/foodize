import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { PromoForm } from '../../../../../pages/vendor/tabs/components/PromoForm';
import type { PromoForm as PromoFormValues } from '../../../../../pages/vendor/hooks/useVendorPromos';
import { at } from '../../../../testUtils';

const EMPTY: PromoFormValues = {
  code: '',
  discount_type: 'PERCENT',
  discount_value: '',
  max_uses: '',
  expires_at: '',
  first_order_only: false,
  min_order_amount: '',
  menu_category: '',
};

const Harness = ({
  onSubmit,
  onCancel,
  loading = false,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  loading?: boolean;
}) => {
  const [form, setForm] = useState<PromoFormValues>(EMPTY);
  return (
    <PromoForm
      promoForm={form}
      setPromoForm={setForm}
      promoFormLoading={loading}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};

describe('PromoForm', () => {
  it('uppercases code, fills fields, and submits', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => { e.preventDefault(); });
    render(<Harness onSubmit={onSubmit} onCancel={vi.fn()} />);

    const code = screen.getByPlaceholderText(/Код/);
    await user.type(code, 'save20');
    expect((code as HTMLInputElement).value).toBe('SAVE20');

    await user.type(screen.getByPlaceholderText('Скидка %'), '20');
    await user.type(screen.getByPlaceholderText(/Макс. использований/), '5');
    await user.type(screen.getByPlaceholderText(/Мин. сумма/), '300');
    await user.click(screen.getByLabelText(/Только для первого заказа/));

    await user.click(screen.getByRole('button', { name: 'Создать' }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('switches discount type to FIXED changing placeholder and selects category', async () => {
    const user = userEvent.setup();
    render(<Harness onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(at(selects, 0), 'FIXED');
    expect(screen.getByPlaceholderText('Сумма ₽')).toBeInTheDocument();
    await user.selectOptions(at(selects, 1), 'SHAURMA');
    expect((selects[1] as HTMLSelectElement).value).toBe('SHAURMA');
  });

  it('sets expires_at datetime', async () => {
    const user = userEvent.setup();
    render(<Harness onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const dt = screen.getByPlaceholderText(/Истекает/);
    await user.type(dt, '2026-12-31T10:00');
    expect((dt as HTMLInputElement).value).toBe('2026-12-31T10:00');
  });

  it('shows loading label and cancel triggers callback', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Harness onSubmit={vi.fn()} onCancel={onCancel} loading />);
    expect(screen.getByRole('button', { name: 'Создаю...' })).toBeDisabled();
    const cancelBtn = at(screen.getAllByRole("button"), 1);
    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });
});
