import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OrderStatusBadge from '../../components/ui/OrderStatusBadge';

describe('OrderStatusBadge', () => {
  it('renders pending status with ripple rings', () => {
    const { container } = render(<OrderStatusBadge status="PENDING" />);
    expect(screen.getByText('Ожидается')).toBeDefined();
    expect(container.querySelectorAll('.ripple-ring')).toHaveLength(3);
  });

  it('renders accepted status as waiting for customers', () => {
    render(<OrderStatusBadge status="ACCEPTED" />);
    expect(screen.getByText('Ожидается')).toBeDefined();
    expect(screen.getByText('Ресторан готовит заказ к выдаче')).toBeDefined();
  });

  it('renders ready status with checkmark', () => {
    render(<OrderStatusBadge status="READY" />);
    expect(screen.getByText('Забирай!')).toBeDefined();
  });
});
