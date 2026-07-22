import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { StaffOrder } from '../../../../pages/staff/types';
import { StaffOrdersTab } from '../../../../pages/staff/components/StaffOrdersTab';
import { COLUMN_DEFS } from '../../../../pages/staff/staffColumns';
import { t } from '@shared/i18n/useTranslation';
import { at } from '../../../testUtils';

const makeOrder = (over: Partial<StaffOrder>): StaffOrder =>
  ({
    id: over.id ?? 'o1',
    display_id: over.display_id ?? 1,
    status: over.status ?? 'PENDING',
    items: over.items ?? [],
    total_price: over.total_price ?? 100,
    created_at: over.created_at ?? new Date().toISOString(),
    ...over,
  }) as unknown as StaffOrder;

const baseProps = {
  updating: null,
  draggingOrderId: null,
  onAdvance: vi.fn(),
  onCancel: vi.fn(),
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onDrop: vi.fn(),
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-01-15T10:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('StaffOrdersTab', () => {
  it('shows loading spinner', () => {
    const { container } = render(
      <StaffOrdersTab orders={[]} ordersLoading {...baseProps} />
    );
    expect(container.querySelector('.spinner')).not.toBeNull();
  });

  it('renders three kanban columns and distributes orders', () => {
    const orders = [
      makeOrder({ id: 'p', display_id: 1, status: 'PENDING' }),
      makeOrder({ id: 'a', display_id: 2, status: 'ACCEPTED' }),
      makeOrder({ id: 'r', display_id: 3, status: 'READY' }),
    ];
    render(<StaffOrdersTab orders={orders} ordersLoading={false} {...baseProps} />);
    expect(screen.getByRole('list', { name: t(at(COLUMN_DEFS, 0).labelKey) })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: t(at(COLUMN_DEFS, 1).labelKey) })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: t(at(COLUMN_DEFS, 2).labelKey) })).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('does not show critical banner when no delayed orders', () => {
    const orders = [makeOrder({ status: 'PENDING' })];
    render(<StaffOrdersTab orders={orders} ordersLoading={false} {...baseProps} />);
    expect(screen.queryByText(t('staff.delayedBanner.hint'), { exact: false })).toBeNull();
  });

  it('shows singular critical banner for one delayed accepted order', () => {
    const old = new Date('2026-01-15T09:40:00Z').toISOString();
    const orders = [makeOrder({ id: 'a', status: 'ACCEPTED', created_at: old })];
    render(<StaffOrdersTab orders={orders} ordersLoading={false} {...baseProps} />);
    expect(
      screen.getByText(
        `${t('staff.delayedBanner.orders', { count: 1 })} ${t('staff.delayedBanner.hint')}`,
        { exact: false }
      )
    ).toBeInTheDocument();
  });

  it('shows plural (2-4) banner form', () => {
    const old = new Date('2026-01-15T09:40:00Z').toISOString();
    const orders = [
      makeOrder({ id: 'a1', status: 'ACCEPTED', created_at: old }),
      makeOrder({ id: 'a2', status: 'ACCEPTED', created_at: old }),
    ];
    render(<StaffOrdersTab orders={orders} ordersLoading={false} {...baseProps} />);
    expect(
      screen.getByText(t('staff.delayedBanner.orders', { count: 2 }), { exact: false })
    ).toBeInTheDocument();
  });

  it('shows many (>=5) banner form', () => {
    const old = new Date('2026-01-15T09:40:00Z').toISOString();
    const orders = Array.from({ length: 5 }, (_, i) =>
      makeOrder({ id: `a${i}`, display_id: i, status: 'ACCEPTED', created_at: old })
    );
    render(<StaffOrdersTab orders={orders} ordersLoading={false} {...baseProps} />);
    expect(
      screen.getByText(t('staff.delayedBanner.orders', { count: 5 }), { exact: false })
    ).toBeInTheDocument();
  });
});
