import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OrderStatusBadge from '@shared/components/OrderStatusBadge/OrderStatusBadge';

describe('OrderStatusBadge', () => {
  it('renders pending status with ripple rings', () => {
    render(<OrderStatusBadge status="PENDING" />);
    expect(screen.getByText('Ожидается')).toBeDefined();
    expect(screen.getByText('Ожидаем подтверждения ресторана')).toBeDefined();
  });

  it('renders accepted status as confirmed by restaurant', () => {
    render(<OrderStatusBadge status="ACCEPTED" />);
    expect(screen.getByText('Принят')).toBeDefined();
    expect(screen.getByText('Ресторан подтвердил заказ')).toBeDefined();
  });

  it('renders ready status with checkmark', () => {
    render(<OrderStatusBadge status="READY" />);
    expect(screen.getByText('Забирай!')).toBeDefined();
  });
});
