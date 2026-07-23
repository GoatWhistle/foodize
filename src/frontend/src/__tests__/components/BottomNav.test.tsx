import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../../components/layout/BottomNav';
import { t } from '@shared/i18n/useTranslation';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderNav = (
  props: Partial<{ cartCount: number; isAuthenticated: boolean }> = {},
  initialPath = '/'
) => {
  const onCartClick = vi.fn();
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav
        cartCount={props.cartCount ?? 0}
        onCartClick={onCartClick}
        isAuthenticated={props.isAuthenticated ?? true}
      />
    </MemoryRouter>
  );
  return { onCartClick };
};

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all four tabs', () => {
    renderNav();
    expect(screen.getByText(t('profile.nav.restaurants'))).toBeInTheDocument();
    expect(screen.getByText(t('profile.nav.orders'))).toBeInTheDocument();
    expect(screen.getByText(t('profile.nav.cart'))).toBeInTheDocument();
    expect(screen.getByText(t('profile.nav.profile'))).toBeInTheDocument();
  });

  it('disables cart tab when empty and shows badge when filled', () => {
    const { onCartClick } = renderNav({ cartCount: 0 });
    const cartTab = screen.getByText(t('profile.nav.cart')).closest('button');
    expect(cartTab).toBeDisabled();
    expect(onCartClick).not.toHaveBeenCalled();
  });

  it('opens cart drawer on click when cart has items', async () => {
    const user = userEvent.setup();
    const { onCartClick } = renderNav({ cartCount: 12 });
    expect(screen.getByText('9+')).toBeInTheDocument();
    await user.click(screen.getByText(t('profile.nav.cart')));
    expect(onCartClick).toHaveBeenCalled();
  });

  it('navigates to routes for authenticated user', async () => {
    const user = userEvent.setup();
    renderNav({ isAuthenticated: true });
    await user.click(screen.getByText(t('profile.nav.orders')));
    expect(mockNavigate).toHaveBeenCalledWith('/orders');
    await user.click(screen.getByText(t('profile.nav.profile')));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('sends guests to login for protected tabs', async () => {
    const user = userEvent.setup();
    renderNav({ isAuthenticated: false });
    await user.click(screen.getByText(t('profile.nav.profile')));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    await user.click(screen.getByText(t('profile.nav.restaurants')));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('marks active tab by path', () => {
    renderNav({}, '/orders');
    const ordersTab = screen.getByText(t('profile.nav.orders')).closest('button');
    expect(ordersTab?.className).toContain('active');
  });
});
