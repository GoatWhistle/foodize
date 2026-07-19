import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { Restaurant } from '@shared/types/models';
import { RestaurantCard } from '@shared/components/RestaurantCard/RestaurantCard';
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver =
  mockIntersectionObserver;

describe('RestaurantCard', () => {
  const restaurant = {
    id: '1',
    name: 'Burger King',
    address: 'Street 1',
    category: 'BURGER',
    photo_url: 'burger.jpg',
  } as unknown as Restaurant;

  it('renders restaurant details correctly', () => {
    render(<RestaurantCard restaurant={restaurant} />);

    expect(screen.getByText('Burger King')).toBeInTheDocument();
    expect(screen.getByText('Street 1')).toBeInTheDocument();

    const img = screen.getByAltText('Burger King');
    expect(img.getAttribute('src')).toBe('burger.jpg');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<RestaurantCard restaurant={restaurant} onClick={onClick} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders emoji placeholder if no photo_url', () => {
    const noPhotoRest = { ...restaurant, photo_url: null };
    render(<RestaurantCard restaurant={noPhotoRest} />);

    expect(screen.getByTestId('restaurant-photo-placeholder')).toBeInTheDocument();
    expect(screen.queryByAltText('Burger King')).not.toBeInTheDocument();
  });
});
