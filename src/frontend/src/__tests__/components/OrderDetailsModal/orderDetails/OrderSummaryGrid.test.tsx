import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Order } from '@shared/types/models';
import { OrderSummaryGrid } from '../../../../components/OrderDetailsModal/orderDetails/OrderSummaryGrid';

const makeOrder = (overrides: Partial<Order>): Order =>
  ({
    status: 'PENDING',
    created_at: '2026-01-15T10:00:00Z',
    requested_pickup_at: null,
    ...overrides,
  }) as unknown as Order;

describe('OrderSummaryGrid', () => {
  it('renders status, created and pickup labels', () => {
    render(<OrderSummaryGrid order={makeOrder({})} />);
    expect(screen.getByText('Статус')).toBeInTheDocument();
    expect(screen.getByText('Создан')).toBeInTheDocument();
    expect(screen.getByText('К выдаче')).toBeInTheDocument();
  });

  it('shows the requested pickup time when provided', () => {
    render(
      <OrderSummaryGrid
        order={makeOrder({ requested_pickup_at: '2026-01-15T12:30:00Z' })}
      />
    );
    expect(screen.queryByText('Как можно скорее')).toBeNull();
  });

  it('falls back to "как можно скорее" when no pickup time is set', () => {
    render(<OrderSummaryGrid order={makeOrder({ requested_pickup_at: null })} />);
    expect(screen.getByText('Как можно скорее')).toBeInTheDocument();
  });
});
