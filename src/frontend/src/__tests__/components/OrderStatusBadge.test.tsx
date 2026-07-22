import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderStatusBadge } from '@shared/components/OrderStatusBadge/OrderStatusBadge';
import { t } from '@shared/i18n/useTranslation';
describe('OrderStatusBadge', () => {
  it('renders pending status with ripple rings', () => {
    render(<OrderStatusBadge status="PENDING" />);
    expect(screen.getByText(t('order.badge.pendingTitle'))).toBeInTheDocument();
    expect(screen.getByText(t('order.badge.pendingSubtitle'))).toBeInTheDocument();
  });

  it('renders accepted status as confirmed by restaurant', () => {
    render(<OrderStatusBadge status="ACCEPTED" />);
    expect(screen.getByText(t('order.badge.acceptedTitle'))).toBeInTheDocument();
    expect(screen.getByText(t('order.badge.acceptedSubtitle'))).toBeInTheDocument();
  });

  it('renders ready status with checkmark', () => {
    render(<OrderStatusBadge status="READY" />);
    expect(screen.getByText(t('order.badge.readyTitle'))).toBeInTheDocument();
  });
});
