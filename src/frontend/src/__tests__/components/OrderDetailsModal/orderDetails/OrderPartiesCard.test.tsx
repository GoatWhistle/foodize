import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Order } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';
import { OrderPartiesCard } from '../../../../components/OrderDetailsModal/orderDetails/OrderPartiesCard';

describe('OrderPartiesCard', () => {
  it('renders all present fields', () => {
    const order = {
      customer_name: 'Иван',
      restaurant_name: 'Кафе',
      restaurant_address: 'ул. Пушкина',
      estimated_ready_at: '2026-01-15T10:00:00Z',
      ready_at: '2026-01-15T11:00:00Z',
    } as Order;
    render(<OrderPartiesCard order={order} />);
    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByText('Кафе')).toBeInTheDocument();
    expect(screen.getByText('ул. Пушкина')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(t('order.details.expectedBy', { time: '' }).trim()))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(t('order.details.readyAt', { time: '' }).trim()))).toBeInTheDocument();
  });

  it('renders labels even when optional fields are absent', () => {
    const order = {} as Order;
    render(<OrderPartiesCard order={order} />);
    expect(screen.getByText(t('order.details.customer'))).toBeInTheDocument();
    expect(screen.getByText(t('order.details.venue'))).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(t('order.details.expectedBy', { time: '' }).trim()))).toBeNull();
    expect(screen.queryByText(new RegExp(t('order.details.readyAt', { time: '' }).trim()))).toBeNull();
  });
});
