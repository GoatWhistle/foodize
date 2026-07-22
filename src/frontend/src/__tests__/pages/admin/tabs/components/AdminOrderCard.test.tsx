import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { AdminOrderCard } from '../../../../../pages/admin/tabs/components/AdminOrderCard';
import type { Order } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';

const makeOrder = (over: Partial<Order> = {}): Order =>
  ({
    id: 'o1',
    display_id: 42,
    status: 'PENDING',
    total_price: 500,
    customer_name: 'Иван',
    customer_phone: '+79990001122',
    restaurant_name: 'Пицца',
    restaurant_address: 'ул. Ленина 1',
    ...over,
  }) as unknown as Order;

describe('AdminOrderCard', () => {
  it('renders known-status order with all fields', () => {
    render(<AdminOrderCard order={makeOrder()} onOpen={vi.fn()} />);
    expect(screen.getByText(t('admin.orders.card.title', { displayId: 42 }))).toBeInTheDocument();
    expect(screen.getByText('500 ₽')).toBeInTheDocument();
    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByText(/\+79990001122/)).toBeInTheDocument();
    expect(screen.getByText('Пицца')).toBeInTheDocument();
    expect(screen.getByText('ул. Ленина 1')).toBeInTheDocument();
  });

  it('falls back to default customer and unknown status', () => {
    render(
      <AdminOrderCard
        order={makeOrder({
          status: 'WEIRD' as Order['status'],
          customer_name: '',
          customer_phone: '',
          restaurant_name: '',
          restaurant_address: '',
        })}
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText(t('admin.orders.card.customerFallback'))).toBeInTheDocument();
    expect(screen.getByText('WEIRD')).toBeInTheDocument();
  });

  it('renders address without name branch', () => {
    render(
      <AdminOrderCard
        order={makeOrder({ status: 'READY', restaurant_name: '', restaurant_address: 'Тут' })}
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText('Тут')).toBeInTheDocument();
  });

  it('calls onOpen when clicked', async () => {
    const onOpen = vi.fn();
    const order = makeOrder();
    render(<AdminOrderCard order={order} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith(order);
  });
});
