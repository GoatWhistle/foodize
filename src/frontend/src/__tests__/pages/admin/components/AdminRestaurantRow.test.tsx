import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdminRestaurantRow } from '../../../../pages/admin/components/AdminRestaurantRow';
import type { AdminRestaurant } from '../../../../pages/admin/hooks/useAdminRestaurants';

const makeRestaurant = (over: Partial<AdminRestaurant> = {}): AdminRestaurant =>
  ({
    id: 'r1',
    name: 'Пицца',
    address: 'ул. Ленина 1',
    is_open: true,
    is_hiring: true,
    orders_count: 10,
    average_rating: 4.5,
    ...over,
  }) as unknown as AdminRestaurant;

describe('AdminRestaurantRow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders open and hiring badges with counts', () => {
    render(
      <AdminRestaurantRow
        restaurant={makeRestaurant()}
        selectedRestaurantIds={new Set()}
        setSelectedRestaurantIds={vi.fn()}
        loadRestaurantDetails={vi.fn()}
      />,
    );
    expect(screen.getByText('Пицца')).toBeInTheDocument();
    expect(screen.getByText('Открыт')).toBeInTheDocument();
    expect(screen.getByText('Нанимает')).toBeInTheDocument();
    expect(screen.getByText(/10 заказов/)).toBeInTheDocument();
  });

  it('renders closed and not-hiring badges plus zero fallbacks', () => {
    render(
      <AdminRestaurantRow
        restaurant={makeRestaurant({
          is_open: false,
          is_hiring: false,
          orders_count: 0,
          average_rating: 0,
        })}
        selectedRestaurantIds={new Set()}
        setSelectedRestaurantIds={vi.fn()}
        loadRestaurantDetails={vi.fn()}
      />,
    );
    expect(screen.getByText('Закрыт')).toBeInTheDocument();
    expect(screen.getByText('Не нанимает')).toBeInTheDocument();
    expect(screen.getByText(/0 заказов/)).toBeInTheDocument();
  });

  it('opens details when row clicked', async () => {
    const loadRestaurantDetails = vi.fn();
    render(
      <AdminRestaurantRow
        restaurant={makeRestaurant()}
        selectedRestaurantIds={new Set()}
        setSelectedRestaurantIds={vi.fn()}
        loadRestaurantDetails={loadRestaurantDetails}
      />,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(loadRestaurantDetails).toHaveBeenCalledWith('r1');
  });

  it('adds and removes id via checkbox', async () => {
    const onIds = vi.fn();
    const Harness = () => {
      const [ids, setIds] = useState<Set<string>>(new Set());
      return (
        <AdminRestaurantRow
          restaurant={makeRestaurant()}
          selectedRestaurantIds={ids}
          setSelectedRestaurantIds={(u) => {
            setIds((prev) => {
              const next = typeof u === 'function' ? u(prev) : u;
              onIds(Array.from(next));
              return next;
            });
          }}
          loadRestaurantDetails={vi.fn()}
        />
      );
    };
    render(<Harness />);
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);
    expect(onIds).toHaveBeenLastCalledWith(['r1']);
    await userEvent.click(checkbox);
    expect(onIds).toHaveBeenLastCalledWith([]);
  });

  it('opens display board without triggering details', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const loadRestaurantDetails = vi.fn();
    render(
      <AdminRestaurantRow
        restaurant={makeRestaurant()}
        selectedRestaurantIds={new Set()}
        setSelectedRestaurantIds={vi.fn()}
        loadRestaurantDetails={loadRestaurantDetails}
      />,
    );
    await userEvent.click(screen.getByText('Табло'));
    expect(openSpy).toHaveBeenCalledWith(
      '/display-board/r1',
      '_blank',
      'noopener,noreferrer',
    );
    expect(loadRestaurantDetails).not.toHaveBeenCalled();
  });
});
