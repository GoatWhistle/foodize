import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { MenuItem } from '@shared/types/models';
import { ProductSheet } from '@shared/components/ProductSheet/ProductSheet';
const item = {
  id: 'item-1',
  name: 'Bowl',
  description: 'Warm lunch',
  price: 300,
  prep_time_minutes: 12,
  category: 'SALAD',
  option_groups: [
    {
      id: 'group-1',
      name: 'Sauce',
      selection_type: 'single',
      is_required: true,
      min_selected: 1,
      max_selected: 1,
      is_active: true,
      options: [
        { id: 'opt-1', name: 'Yogurt', price_delta: 0, is_available: true },
        { id: 'opt-2', name: 'Spicy', price_delta: 40, is_available: true },
      ],
    },
    {
      id: 'group-2',
      name: 'Extras',
      selection_type: 'multiple',
      is_required: false,
      min_selected: 0,
      max_selected: 1,
      is_active: true,
      options: [
        { id: 'opt-3', name: 'Cheese', price_delta: 60, is_available: true },
        { id: 'opt-4', name: 'Seeds', price_delta: 30, is_available: true },
      ],
    },
  ],
} as MenuItem;

describe('ProductSheet', () => {
  it('calculates options, quantity, and submits configured item', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ProductSheet item={item} onClose={vi.fn()} onAdd={onAdd} />);

    await user.click(screen.getByText('Spicy'));
    await user.click(screen.getByText('Cheese'));
    await user.click(screen.getByLabelText('Увеличить'));

    expect(screen.getByText('Добавить · 800 ₽')).toBeInTheDocument();

    await user.click(screen.getByText('Добавить · 800 ₽'));

    expect(onAdd).toHaveBeenCalledWith({
      item,
      selectedOptions: [
        expect.objectContaining({ id: 'opt-2' }),
        expect.objectContaining({ id: 'opt-3' }),
      ],
      quantity: 2,
    });
  });
});
