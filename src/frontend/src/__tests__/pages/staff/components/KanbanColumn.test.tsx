import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KanbanColumn } from '../../../../pages/staff/components/KanbanColumn';
import { COLUMN_DEFS } from '../../../../pages/staff/staffColumns';
import type { StaffOrder } from '../../../../pages/staff/types';
import { at } from '../../../testUtils';

vi.mock('../../../../pages/staff/components/KanbanCard', () => ({
  KanbanCard: ({
    order,
    dragging,
    onDragStart,
    onDragEnd,
  }: {
    order: StaffOrder;
    dragging: boolean;
    onDragStart: () => void;
    onDragEnd: () => void;
  }) => (
    <div
      data-testid={`card-${order.id}`}
      data-dragging={dragging}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {order.id}
    </div>
  ),
}));

const column = at(COLUMN_DEFS, 0);

const makeOrder = (id: string): StaffOrder =>
  ({ id, display_id: 1, status: 'PENDING', items: [] }) as unknown as StaffOrder;

const baseProps = {
  column,
  orders: [makeOrder('o1'), makeOrder('o2')],
  onAdvance: vi.fn(),
  onCancel: vi.fn(),
  updating: null,
  draggingId: null as string | null,
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onDrop: vi.fn(),
};

describe('KanbanColumn', () => {
  it('renders column header with order count', () => {
    render(<KanbanColumn {...baseProps} />);
    expect(screen.getByText('Новые')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByTestId('card-o1')).toBeInTheDocument();
    expect(screen.getByTestId('card-o2')).toBeInTheDocument();
  });

  it('shows empty placeholder when there are no orders', () => {
    render(<KanbanColumn {...baseProps} orders={[]} />);
    expect(screen.getByText('Пусто')).toBeInTheDocument();
  });

  it('marks the currently dragged card', () => {
    render(<KanbanColumn {...baseProps} draggingId="o2" />);
    expect(screen.getByTestId('card-o1')).toHaveAttribute('data-dragging', 'false');
    expect(screen.getByTestId('card-o2')).toHaveAttribute('data-dragging', 'true');
  });

  it('sets drag-over state on dragOver and clears on drop', () => {
    render(<KanbanColumn {...baseProps} />);
    const group = screen.getByRole('group');
    fireEvent.dragOver(group);
    fireEvent.drop(group);
    expect(baseProps.onDrop).toHaveBeenCalledWith(column);
  });

  it('clears drag-over when leaving to an outside element', () => {
    const onDrop = vi.fn();
    render(<KanbanColumn {...baseProps} onDrop={onDrop} />);
    const group = screen.getByRole('group');
    fireEvent.dragOver(group);
    fireEvent.dragLeave(group, { relatedTarget: document.body });
    fireEvent.dragLeave(group, { relatedTarget: null });
    fireEvent.drop(group);
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it('keeps drag-over when leaving into a child element', () => {
    render(<KanbanColumn {...baseProps} />);
    const group = screen.getByRole('group');
    fireEvent.dragOver(group);
    const child = screen.getByTestId('card-o1');
    fireEvent.dragLeave(group, { relatedTarget: child });
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('forwards drag start and end from a card', () => {
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    render(<KanbanColumn {...baseProps} onDragStart={onDragStart} onDragEnd={onDragEnd} />);
    const card = screen.getByTestId('card-o1');
    fireEvent.dragStart(card);
    fireEvent.dragEnd(card);
    expect(onDragStart).toHaveBeenCalledWith(baseProps.orders[0]);
    expect(onDragEnd).toHaveBeenCalled();
  });
});
