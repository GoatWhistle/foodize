import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Order } from '@shared/types/models';
import { OrderItemsList } from '../../../../components/OrderDetailsModal/orderDetails/OrderItemsList';

const makeOrder = (items: Order['items']): Order =>
  ({ items }) as unknown as Order;

describe('OrderItemsList', () => {
  it('renders each item with quantity and category', () => {
    const order = makeOrder([
      {
        id: 'i1',
        menu_item_name: 'Бургер',
        menu_item_category: 'MAIN',
        quantity: 2,
        price_at_purchase: 300,
        selected_options: [],
      },
    ] as unknown as Order['items']);
    render(<OrderItemsList order={order} />);
    expect(screen.getByText('Бургер')).toBeInTheDocument();
    expect(screen.getByText('×2')).toBeInTheDocument();
    expect(screen.getByText('Состав заказа')).toBeInTheDocument();
  });

  it('renders selected options when present', () => {
    const order = makeOrder([
      {
        id: 'i2',
        menu_item_name: 'Пицца',
        menu_item_category: 'MAIN',
        quantity: 1,
        price_at_purchase: 500,
        selected_options: [
          { name: 'Сыр', price_delta: 50 },
          { name: 'Без лука', price_delta: 0 },
        ],
      },
    ] as unknown as Order['items']);
    render(<OrderItemsList order={order} />);
    expect(screen.getByText(/Сыр \+50 ₽, Без лука/)).toBeInTheDocument();
  });

  it('omits the options row when there are no selected options', () => {
    const order = makeOrder([
      {
        id: 'i3',
        menu_item_name: 'Кофе',
        menu_item_category: 'DRINK',
        quantity: 1,
        price_at_purchase: 150,
        selected_options: [],
      },
    ] as unknown as Order['items']);
    const { container } = render(<OrderItemsList order={order} />);
    expect(screen.getByText('Кофе')).toBeInTheDocument();
    expect(container.textContent).not.toContain('+');
  });
});
