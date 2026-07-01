import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEffect } from 'react';

const initTheme = vi.fn();
const fetchMe = vi.fn().mockResolvedValue(undefined);
const fetchCart = vi.fn().mockResolvedValue(undefined);
const loadFavorites = vi.fn().mockResolvedValue(undefined);

let mockIsAuthenticated = false;
let mockPermissions = [];

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel) => {
    const state = {
      isAuthenticated: mockIsAuthenticated,
      user: mockIsAuthenticated ? { id: 'u1', permissions: mockPermissions } : null,
      fetchMe,
    };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('../store/useThemeStore', () => ({
  useThemeStore: vi.fn((sel) => {
    const state = { initTheme, theme: 'dark' };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('../store/useOrderStore', () => ({
  useOrderStore: vi.fn((sel) => {
    const state = { fetchCart, cart: [], restaurantId: null };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('../store/useFavoriteStore', () => ({
  useFavoriteStore: vi.fn((sel) => {
    const state = { loadFavorites, favoriteIds: new Set() };
    return sel ? sel(state) : state;
  }),
}));

import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useOrderStore } from '../store/useOrderStore';
import { useFavoriteStore } from '../store/useFavoriteStore';

const ProtectedRouteSimulator = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <div data-testid="login-redirect">Redirect to login</div>;
  return <div data-testid="protected">Protected content</div>;
};

const RoleProtectedSimulator = ({ permission }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const permissions = useAuthStore((s) => s.user?.permissions);
  if (!isAuthenticated) return <div data-testid="login-redirect">Redirect to login</div>;
  if (permission && !permissions?.includes(permission)) return <div data-testid="denied">Access denied</div>;
  return <div data-testid="role-content">Role content</div>;
};

const AppBootstrapSimulator = () => {
  const _initTheme = useThemeStore((s) => s.initTheme);
  const _fetchMe = useAuthStore((s) => s.fetchMe);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _fetchCart = useOrderStore((s) => s.fetchCart);
  const _loadFavs = useFavoriteStore((s) => s.loadFavorites);

  useEffect(() => {
    _initTheme();
    _fetchMe();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      _fetchCart();
      _loadFavs();
    }
  }, [isAuthenticated]);

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
    expect(screen.getByTestId('login-redirect')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('shows content for authenticated user', () => {
    mockIsAuthenticated = true;
    render(<ProtectedRouteSimulator />);
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });
});

describe('RoleProtectedRoute', () => {
  it('denies access when user lacks permission', () => {
    mockIsAuthenticated = true;
    mockPermissions = ['customers:read'];
    render(<RoleProtectedSimulator permission="restaurants.create" />);
    expect(screen.getByTestId('denied')).toBeInTheDocument();
  });

  it('allows access when user has required permission', () => {
    mockIsAuthenticated = true;
    mockPermissions = ['restaurants.create', 'customers:read'];
    render(<RoleProtectedSimulator permission="restaurants.create" />);
    expect(screen.getByTestId('role-content')).toBeInTheDocument();
  });

  it('redirects unauthenticated user regardless of permission', () => {
    mockIsAuthenticated = false;
    render(<RoleProtectedSimulator permission="restaurants.create" />);
    expect(screen.getByTestId('login-redirect')).toBeInTheDocument();
  });

  it('allows access with no permission requirement', () => {
    mockIsAuthenticated = true;
    mockPermissions = [];
    render(<RoleProtectedSimulator permission={null} />);
    expect(screen.getByTestId('role-content')).toBeInTheDocument();
  });
});

describe('App bootstrap effects', () => {
  it('calls initTheme and fetchMe on mount when not authenticated', async () => {
    mockIsAuthenticated = false;
    render(<AppBootstrapSimulator />);
    await waitFor(() => {
      expect(initTheme).toHaveBeenCalledTimes(1);
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
    await waitFor(() => expect(initTheme).toHaveBeenCalled());
    expect(fetchCart).not.toHaveBeenCalled();
  });
});
