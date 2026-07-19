import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderStatusBadge } from '@shared/components/OrderStatusBadge/OrderStatusBadge';
describe('OrderStatusBadge', () => {
  it('renders pending status with ripple rings', () => {
    render(<OrderStatusBadge status="PENDING" />);
    expect(screen.getByText('Ожидается')).toBeInTheDocument();
    expect(screen.getByText('Ожидаем подтверждения ресторана')).toBeInTheDocument();
  });

  it('renders accepted status as confirmed by restaurant', () => {
    render(<OrderStatusBadge status="ACCEPTED" />);
    expect(screen.getByText('Принят')).toBeInTheDocument();
    expect(screen.getByText('Ресторан подтвердил заказ')).toBeInTheDocument();
  });

  it('renders ready status with checkmark', () => {
    render(<OrderStatusBadge status="READY" />);
    expect(screen.getByText('Забирай!')).toBeInTheDocument();
  });
});
