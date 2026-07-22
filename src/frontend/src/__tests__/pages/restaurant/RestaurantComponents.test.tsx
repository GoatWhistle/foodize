import type { FormEvent } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { t } from '@shared/i18n/useTranslation';
import { StaffModal } from '../../../pages/restaurant/components/StaffModal';
import { RestaurantHero } from '../../../pages/restaurant/components/RestaurantHero';
import type { Restaurant } from '@shared/types/models';
import { at } from '../../testUtils';

describe('StaffModal', () => {
  const setup = (overrides: Partial<Parameters<typeof StaffModal>[0]> = {}) => {
    const props = {
      restaurantName: 'My Resto',
      message: '',
      setMessage: vi.fn(),
      onClose: vi.fn(),
      onSubmit: vi.fn((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
      }),
      loading: false,
      error: null as string | null,
      ...overrides,
    };
    render(<StaffModal {...props} />);
    return props;
  };

  it('renders restaurant name and submit button', () => {
    setup();
    expect(screen.getByText('My Resto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t('catalog.staffModal.submit') })).toBeInTheDocument();
  });

  it('updates message on typing', async () => {
    const { setMessage } = setup();
    await userEvent.type(screen.getByPlaceholderText(t('catalog.staffModal.messagePlaceholder')), 'a');
    expect(setMessage).toHaveBeenCalled();
  });

  it('calls onClose', async () => {
    const { onClose } = setup();
    const buttons = screen.getAllByRole('button');
    await userEvent.click(at(buttons, 0));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error and loading label', () => {
    setup({ error: 'Ошибка', loading: true });
    expect(screen.getByText('Ошибка')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t('catalog.staffModal.submitting') })).toBeInTheDocument();
  });

  it('submits the form', async () => {
    const { onSubmit } = setup({ message: 'hi' });
    await userEvent.click(screen.getByRole('button', { name: t('catalog.staffModal.submit') }));
    expect(onSubmit).toHaveBeenCalled();
  });
});

describe('RestaurantHero', () => {
  const restaurant = { id: 'r1', name: 'Tasty', address: 'Addr' } as unknown as Restaurant;

  const setup = (overrides: Partial<Parameters<typeof RestaurantHero>[0]> = {}) => {
    const props = {
      restaurant,
      restaurantView: { id: 'r1', name: 'Tasty', address: 'Addr', photo_url: 'p.jpg', description: 'Nice' },
      reviewsButtonLabel: '4.5 (10)',
      showFavorite: true,
      isFav: false,
      onOpenReviews: vi.fn(),
      onOpenInfo: vi.fn(),
      onOpenShare: vi.fn(),
      onToggleFavorite: vi.fn(),
      ...overrides,
    };
    render(<RestaurantHero {...props} />);
    return props;
  };

  it('renders image, name, description and reviews label', () => {
    setup();
    expect(screen.getByRole('img', { name: 'Tasty' })).toHaveAttribute('src', 'p.jpg');
    expect(screen.getByText('Tasty')).toBeInTheDocument();
    expect(screen.getByText('Nice')).toBeInTheDocument();
    expect(screen.getByText('4.5 (10)')).toBeInTheDocument();
  });

  it('renders placeholder when no photo and no description', () => {
    setup({ restaurantView: { id: 'r1', name: 'Tasty', address: 'Addr' } });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('Nice')).not.toBeInTheDocument();
  });

  it('fires review/info/share handlers', async () => {
    const p = setup();
    await userEvent.click(screen.getByText('4.5 (10)'));
    await userEvent.click(screen.getByText(t('catalog.restaurantPage.info')));
    await userEvent.click(screen.getByRole('button', { name: t('catalog.restaurantPage.share') }));
    expect(p.onOpenReviews).toHaveBeenCalled();
    expect(p.onOpenInfo).toHaveBeenCalled();
    expect(p.onOpenShare).toHaveBeenCalled();
  });

  it('toggles favorite and reflects pressed state when fav', async () => {
    const p = setup({ isFav: true });
    const favBtn = screen.getByRole('button', { name: t('catalog.restaurantCard.removeFromFavorites') });
    expect(favBtn).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(favBtn);
    expect(p.onToggleFavorite).toHaveBeenCalled();
  });

  it('hides favorite button when showFavorite is false', () => {
    setup({ showFavorite: false });
    expect(screen.queryByRole('button', { name: t('catalog.restaurantCard.addToFavorites') })).not.toBeInTheDocument();
  });
});
