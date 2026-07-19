import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { VendorOrderCard } from '../../../../../pages/vendor/tabs/components/VendorOrderCard';
import type { Order } from '@shared/types/models';

const STATUS_LABEL_RU = { PENDING: 'Новый', ACCEPTED: 'Принят', READY: 'Готов', COMPLETED: 'Выдан' };
const nextOrderStatus = { PENDING: 'ACCEPTED', ACCEPTED: 'READY', READY: 'COMPLETED' } as const;

const makeOrder = (overrides: Partial<Order> = {}): Order =>
  ({
    id: 'o1',
    status: 'PENDING',
    created_at: '2026-07-18T10:00:00Z',
    total_price: 500,
    requested_pickup_at: null,
    items: [
      { id: 'i1', quantity: 2, menu_item_name: 'Шаурма', selected_options: [] },
    ],
    ...overrides,
  }) as unknown as Order;

describe('VendorOrderCard', () => {
  it('renders order with items and status badge, opens on card click', async () => {
    const user = userEvent.setup();
    const setSelectedOrder = vi.fn();
    render(
      <VendorOrderCard
        order={makeOrder()}
        updatingOrderId={null}
        setSelectedOrder={setSelectedOrder}
        STATUS_LABEL_RU={STATUS_LABEL_RU}
        nextOrderStatus={nextOrderStatus}
        getOrderDisplayId={(o) => o.id}
        formatOrderTime={(v) => (v ? '10:00' : '')}
      />
    );
    expect(screen.getByText(/Заказ #o1/)).toBeInTheDocument();
    expect(screen.getByText('Новый')).toBeInTheDocument();
    expect(screen.getByText(/×2 Шаурма/)).toBeInTheDocument();
    await user.click(screen.getByText(/Заказ #o1/));
    expect(setSelectedOrder).toHaveBeenCalled();
  });

  it('shows options summary, pickup time and details button that stops propagation', async () => {
    const user = userEvent.setup();
    const setSelectedOrder = vi.fn();
    const order = makeOrder({
      requested_pickup_at: '2026-07-18T12:00:00Z',
      items: [
        {
          id: 'i1',
          quantity: 1,
          menu_item_name: 'Бургер',
          selected_options: [{ id: 'so1', name: 'Сыр', price_delta: 50 }],
        },
      ] as unknown as Order['items'],
    });
    render(
      <VendorOrderCard
        order={order}
        updatingOrderId={null}
        setSelectedOrder={setSelectedOrder}
        STATUS_LABEL_RU={STATUS_LABEL_RU}
        nextOrderStatus={nextOrderStatus}
        getOrderDisplayId={(o) => o.id}
        formatOrderTime={(v) => (v ? '12:00' : '')}
      />
    );
    expect(screen.getByText(/к выдаче/)).toBeInTheDocument();
    const detailsBtn = screen.getByRole('button', { name: /Детали/ });
    await user.click(detailsBtn);
    expect(setSelectedOrder).toHaveBeenCalledTimes(1);
  });

  it('renders fallback status label and no time, no details for terminal status', () => {
    render(
      <VendorOrderCard
        order={makeOrder({ status: 'CANCELLED' as Order['status'], created_at: '', items: [] })}
        updatingOrderId={null}
        setSelectedOrder={vi.fn()}
        STATUS_LABEL_RU={{}}
        nextOrderStatus={nextOrderStatus}
        getOrderDisplayId={(o) => o.id}
        formatOrderTime={() => ''}
      />
    );
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Детали/ })).not.toBeInTheDocument();
  });

  it('renders ACCEPTED badge class branch and disables details while updating', () => {
    render(
      <VendorOrderCard
        order={makeOrder({ status: 'ACCEPTED' })}
        updatingOrderId="o1"
        setSelectedOrder={vi.fn()}
        STATUS_LABEL_RU={STATUS_LABEL_RU}
        nextOrderStatus={nextOrderStatus}
        getOrderDisplayId={(o) => o.id}
        formatOrderTime={() => '10:00'}
      />
    );
    expect(screen.getByRole('button', { name: /Детали/ })).toBeDisabled();
  });

  it('renders READY branch badge', () => {
    render(
      <VendorOrderCard
        order={makeOrder({ status: 'READY' })}
        updatingOrderId={null}
        setSelectedOrder={vi.fn()}
        STATUS_LABEL_RU={STATUS_LABEL_RU}
        nextOrderStatus={nextOrderStatus}
        getOrderDisplayId={(o) => o.id}
        formatOrderTime={() => '10:00'}
      />
    );
    expect(screen.getByText('Готов')).toBeInTheDocument();
  });
});
