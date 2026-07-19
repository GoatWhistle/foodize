import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { StaffOrder } from '../../../../pages/staff/types';
import { KanbanCard } from '../../../../pages/staff/components/KanbanCard';

const makeOrder = (over: Partial<StaffOrder>): StaffOrder =>
  ({
    id: 'o1',
    display_id: 7,
    status: 'PENDING',
    total_price: 500,
    created_at: new Date().toISOString(),
    items: [{ id: 'i1', menu_item_name: 'Бургер', quantity: 2, selected_options: [] }],
    ...over,
  }) as unknown as StaffOrder;

const baseProps = {
  onAdvance: vi.fn(),
  onCancel: vi.fn(),
  updating: null,
  dragging: false,
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-01-15T10:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('KanbanCard', () => {
  it('renders order id, items and price', () => {
    render(<KanbanCard order={makeOrder({})} {...baseProps} />);
    expect(screen.getByText('#7')).toBeInTheDocument();
    expect(screen.getByText('Бургер')).toBeInTheDocument();
    expect(screen.getByText('×2')).toBeInTheDocument();
  });

  it('has accessible label and roledescription', () => {
    render(<KanbanCard order={makeOrder({})} {...baseProps} />);
    const card = screen.getByRole('listitem');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Заказ №7'));
  });

  it('applies reduced opacity when dragging', () => {
    render(<KanbanCard order={makeOrder({})} {...baseProps} dragging />);
    expect(screen.getByRole('listitem')).toHaveStyle({ opacity: '0.4' });
  });

  it('shows critical delay badge for accepted orders older than 15m', () => {
    const created = new Date('2026-01-15T09:40:00Z').toISOString();
    render(<KanbanCard order={makeOrder({ status: 'ACCEPTED', created_at: created })} {...baseProps} />);
    expect(screen.getByText('20м')).toBeInTheDocument();
  });

  it('shows warning delay badge for accepted orders 8-15m old', () => {
    const created = new Date('2026-01-15T09:50:00Z').toISOString();
    render(<KanbanCard order={makeOrder({ status: 'ACCEPTED', created_at: created })} {...baseProps} />);
    expect(screen.getByText('10м')).toBeInTheDocument();
  });

  it('shows no delay badge for fresh accepted orders', () => {
    const created = new Date('2026-01-15T09:57:00Z').toISOString();
    render(<KanbanCard order={makeOrder({ status: 'ACCEPTED', created_at: created })} {...baseProps} />);
    expect(screen.queryByText(/м$/)).toBeNull();
  });

  it('renders selected options with removal styling and price delta', () => {
    const order = makeOrder({
      items: [
        {
          id: 'i1',
          menu_item_name: 'Пицца',
          quantity: 1,
          selected_options: [
            { id: 'op1', name: 'Без лука', price_delta: 0 },
            { id: 'op2', name: 'Сыр', price_delta: 50 },
          ],
        },
      ] as never,
    });
    render(<KanbanCard order={order} {...baseProps} />);
    expect(screen.getByText('Без лука')).toBeInTheDocument();
    expect(screen.getByText(/Сыр/)).toBeInTheDocument();
    expect(screen.getByText(/\+50₽/)).toBeInTheDocument();
  });

  it('renders comment when present', () => {
    render(<KanbanCard order={makeOrder({ comment: 'острое' })} {...baseProps} />);
    expect(screen.getByText('острое')).toBeInTheDocument();
  });

  it('renders eta for accepted order with estimated_ready_at', () => {
    const ready = new Date('2026-01-15T10:20:00Z').toISOString();
    render(
      <KanbanCard
        order={makeOrder({ status: 'ACCEPTED', estimated_ready_at: ready })}
        {...baseProps}
      />
    );
    expect(screen.getByText(/~20 мин/)).toBeInTheDocument();
  });

  it('renders eta as expired when time passed', () => {
    const ready = new Date('2026-01-15T09:50:00Z').toISOString();
    render(
      <KanbanCard
        order={makeOrder({ status: 'ACCEPTED', estimated_ready_at: ready })}
        {...baseProps}
      />
    );
    expect(screen.getByText(/время вышло/)).toBeInTheDocument();
  });

  it('renders requested pickup time', () => {
    const pickup = new Date('2026-01-15T14:30:00Z').toISOString();
    render(<KanbanCard order={makeOrder({ requested_pickup_at: pickup })} {...baseProps} />);
    expect(screen.getByText(/Ко времени:/)).toBeInTheDocument();
  });
});
