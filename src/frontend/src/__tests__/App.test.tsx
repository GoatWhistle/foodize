import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEffect } from 'react';
import type { UserRead } from '@shared/types/models';

const themeEffect = vi.fn();
const fetchMe = vi.fn().mockResolvedValue(undefined);
const fetchCart = vi.fn().mockResolvedValue(undefined);
const loadFavorites = vi.fn().mockResolvedValue(undefined);

let mockIsAuthenticated = false;
let mockPermissions: string[] = [];

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: { user: UserRead | null; fetchMe: typeof fetchMe }) => unknown) => {
    const state = {
      user: mockIsAuthenticated ? ({ id: 'u1', permissions: mockPermissions } as unknown as UserRead) : null,
      fetchMe,
    };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('@shared/hooks/useThemeEffect.js', () => ({
  useThemeEffect: (): void => {
    themeEffect();
  },
}));

vi.mock('../store/useCartStore', () => ({
  useCartStore: vi.fn(
    (sel?: (s: { fetchCart: typeof fetchCart; cart: never[]; cartRestaurantId: null }) => unknown) => {
      const state = { fetchCart, cart: [], cartRestaurantId: null };
      return sel ? sel(state) : state;
    }
  ),
}));

vi.mock('@shared/store/useFavoriteStore.js', () => ({
  useFavoriteStore: vi.fn(
    (sel?: (s: { loadFavorites: typeof loadFavorites; favoriteIds: Set<string> }) => unknown) => {
      const state = { loadFavorites, favoriteIds: new Set<string>() };
      return sel ? sel(state) : state;
    }
  ),
}));

import { useAuthStore } from '../store/useAuthStore';
import { useThemeEffect } from '@shared/hooks/useThemeEffect';
import { useCartStore } from '../store/useCartStore';
import { useFavoriteStore } from '@shared/store/useFavoriteStore';

const ProtectedRouteSimulator = () => {
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  if (!isAuthenticated) return <div>Redirect to login</div>;
  return <div>Protected content</div>;
};

const RoleProtectedSimulator = ({ permission }: { permission: string | null }) => {
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  const permissions = useAuthStore((s) => s.user?.permissions);
  if (!isAuthenticated) return <div>Redirect to login</div>;
  if (permission && !permissions?.includes(permission as never)) return <div>Access denied</div>;
  return <div>Role content</div>;
};

const AppBootstrapSimulator = () => {
  const _fetchMe = useAuthStore((s) => s.fetchMe);
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  const _fetchCart = useCartStore((s) => s.fetchCart);
  const _loadFavs = useFavoriteStore((s) => s.loadFavorites);

  useThemeEffect();

  useEffect(() => {
    void _fetchMe();
  }, [_fetchMe]);

  useEffect(() => {
    if (isAuthenticated) {
      void _fetchCart();
      void _loadFavs();
    }
  }, [isAuthenticated, _fetchCart, _loadFavs]);

  return <div data-testid="app">app</div>;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAuthenticated = false;
  mockPermissions = [];
  fetchMe.mockResolvedValue(undefined);
  fetchCart.mockResolvedValue(undefined);
  loadFavorites.mockResolvedValue(undefined);
});

describe('ProtectedRoute', () => {
  it('redirects unauthenticated user', () => {
    mockIsAuthenticated = false;
    render(<ProtectedRouteSimulator />);
    expect(screen.getByText('Redirect to login')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows content for authenticated user', () => {
    mockIsAuthenticated = true;
    render(<ProtectedRouteSimulator />);
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});

describe('RoleProtectedRoute', () => {
  it('denies access when user lacks permission', () => {
    mockIsAuthenticated = true;
    mockPermissions = ['customers:read'];
    render(<RoleProtectedSimulator permission="restaurants.create" />);
    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });

  it('allows access when user has required permission', () => {
    mockIsAuthenticated = true;
    mockPermissions = ['restaurants.create', 'customers:read'];
    render(<RoleProtectedSimulator permission="restaurants.create" />);
    expect(screen.getByText('Role content')).toBeInTheDocument();
  });

  it('redirects unauthenticated user regardless of permission', () => {
    mockIsAuthenticated = false;
    render(<RoleProtectedSimulator permission="restaurants.create" />);
    expect(screen.getByText('Redirect to login')).toBeInTheDocument();
  });

  it('allows access with no permission requirement', () => {
    mockIsAuthenticated = true;
    mockPermissions = [];
    render(<RoleProtectedSimulator permission={null} />);
    expect(screen.getByText('Role content')).toBeInTheDocument();
  });
});

describe('App bootstrap effects', () => {
  it('applies theme and calls fetchMe on mount when not authenticated', async () => {
    mockIsAuthenticated = false;
    render(<AppBootstrapSimulator />);
    await waitFor(() => {
      expect(themeEffect).toHaveBeenCalled();
      expect(fetchMe).toHaveBeenCalledTimes(1);
    });
    expect(fetchCart).not.toHaveBeenCalled();
    expect(loadFavorites).not.toHaveBeenCalled();
  });

  it('calls fetchCart and loadFavorites when authenticated', async () => {
    mockIsAuthenticated = true;
    render(<AppBootstrapSimulator />);
    await waitFor(() => {
      expect(fetchCart).toHaveBeenCalledTimes(1);
      expect(loadFavorites).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call fetchCart when not authenticated', async () => {
    mockIsAuthenticated = false;
    render(<AppBootstrapSimulator />);
    await waitFor(() => { expect(themeEffect).toHaveBeenCalled(); });
    expect(fetchCart).not.toHaveBeenCalled();
  });
});
