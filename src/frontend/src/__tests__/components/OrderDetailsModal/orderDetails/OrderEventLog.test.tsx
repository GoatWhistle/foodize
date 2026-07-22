import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { OrderEvent } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';
import { OrderEventLog } from '../../../../components/OrderDetailsModal/orderDetails/OrderEventLog';

const EVENTS = [
  {
    id: 'e1',
    old_status: 'PENDING',
    new_status: 'ACCEPTED',
    actor_permissions: ['orders.manage'],
    created_at: '2026-01-15T10:00:00Z',
  },
] as unknown as OrderEvent[];

describe('OrderEventLog', () => {
  it('shows loading state', () => {
    render(<OrderEventLog events={[]} eventsLoading eventsUnavailable={false} />);
    expect(screen.getByText(t('order.events.loading'))).toBeInTheDocument();
  });

  it('shows unavailable state', () => {
    render(<OrderEventLog events={[]} eventsLoading={false} eventsUnavailable />);
    expect(screen.getByText(t('order.events.unavailable'))).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    render(<OrderEventLog events={[]} eventsLoading={false} eventsUnavailable={false} />);
    expect(
      screen.getByText(t('order.events.empty'))
    ).toBeInTheDocument();
  });

  it('renders event rows with status transition', () => {
    render(<OrderEventLog events={EVENTS} eventsLoading={false} eventsUnavailable={false} />);
    expect(screen.getByText(t('order.events.title'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(t('enums.orderStatus.PENDING')))).toBeInTheDocument();
  });
});
