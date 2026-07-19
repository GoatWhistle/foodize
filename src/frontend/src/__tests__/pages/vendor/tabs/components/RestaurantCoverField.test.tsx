import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RestaurantCoverField } from '../../../../../pages/vendor/tabs/components/RestaurantCoverField';
import { restaurantService } from '@shared/services/restaurantService';
import type { Restaurant } from '@shared/types/models';

vi.mock('@shared/services/restaurantService', () => ({
  restaurantService: {
    uploadPhoto: vi.fn(),
    deletePhoto: vi.fn(),
  },
}));

const makeRestaurant = (overrides: Partial<Restaurant> = {}): Restaurant =>
  ({ id: 'r1', name: 'R', photo_url: '', ...overrides }) as unknown as Restaurant;

describe('RestaurantCoverField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders placeholder and upload label when no cover', () => {
    render(<RestaurantCoverField selectedRestaurant={makeRestaurant()} />);
    expect(screen.getByText('Загрузить обложку')).toBeInTheDocument();
    expect(screen.queryByAltText('Обложка ресторана')).not.toBeInTheDocument();
  });

  it('renders existing cover with replace and delete', () => {
    render(<RestaurantCoverField selectedRestaurant={makeRestaurant({ photo_url: 'http://c/x.png' })} />);
    expect(screen.getByAltText('Обложка ресторана')).toBeInTheDocument();
    expect(screen.getByText('Заменить обложку')).toBeInTheDocument();
    expect(screen.getByText('Удалить')).toBeInTheDocument();
  });

  it('uploads a file and shows returned url', async () => {
    const user = userEvent.setup();
    vi.mocked(restaurantService.uploadPhoto).mockResolvedValue({
      data: { data: { photo_url: 'http://c/new.png' } },
    } as unknown as Awaited<ReturnType<typeof restaurantService.uploadPhoto>>);
    const { container } = render(<RestaurantCoverField selectedRestaurant={makeRestaurant()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['x'], 'c.png', { type: 'image/png' }));
    expect(await screen.findByAltText('Обложка ресторана')).toHaveAttribute('src', 'http://c/new.png');
  });

  it('shows error when upload fails', async () => {
    const user = userEvent.setup();
    vi.mocked(restaurantService.uploadPhoto).mockRejectedValue(new Error('boom'));
    const { container } = render(<RestaurantCoverField selectedRestaurant={makeRestaurant()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['x'], 'c.png', { type: 'image/png' }));
    expect(await screen.findByText('Не удалось загрузить фото')).toBeInTheDocument();
  });

  it('ignores empty file selection', async () => {
    const { container } = render(<RestaurantCoverField selectedRestaurant={makeRestaurant()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(input, { target: { files: [] } });
    expect(restaurantService.uploadPhoto).not.toHaveBeenCalled();
  });

  it('deletes cover successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(restaurantService.deletePhoto).mockResolvedValue({} as unknown as Awaited<ReturnType<typeof restaurantService.deletePhoto>>);
    render(<RestaurantCoverField selectedRestaurant={makeRestaurant({ photo_url: 'http://c/x.png' })} />);
    await user.click(screen.getByText('Удалить'));
    await waitFor(() => {
      expect(screen.queryByAltText('Обложка ресторана')).not.toBeInTheDocument();
    });
  });

  it('shows error when delete fails', async () => {
    const user = userEvent.setup();
    vi.mocked(restaurantService.deletePhoto).mockRejectedValue(new Error('nope'));
    render(<RestaurantCoverField selectedRestaurant={makeRestaurant({ photo_url: 'http://c/x.png' })} />);
    await user.click(screen.getByText('Удалить'));
    expect(await screen.findByText('Не удалось удалить фото')).toBeInTheDocument();
  });

  it('resets cover url when selected restaurant changes', () => {
    const { rerender } = render(
      <RestaurantCoverField selectedRestaurant={makeRestaurant({ id: 'r1', photo_url: 'http://c/a.png' })} />
    );
    expect(screen.getByAltText('Обложка ресторана')).toHaveAttribute('src', 'http://c/a.png');
    rerender(
      <RestaurantCoverField selectedRestaurant={makeRestaurant({ id: 'r2', photo_url: '' })} />
    );
    expect(screen.queryByAltText('Обложка ресторана')).not.toBeInTheDocument();
  });
});
