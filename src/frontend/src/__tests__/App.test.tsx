import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { UserRead } from '@shared/types/models';

let mockIsAuthenticated = false;
let mockPermissions: string[] = [];

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: unknown) => unknown) => {
    const state = {
      user: mockIsAuthenticated
        ? ({ id: 'u1', permissions: mockPermissions } as unknown as UserRead)
        : null,
    };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('@shared/store/createAuthStore', () => ({
  selectIsAuthenticated: (s: { user: unknown }) => s.user !== null,
}));

import { ProtectedRoute, RoleProtectedRoute } from '../App';

const renderRoute = (element: React.ReactNode, initial = '/target') =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/target" element={element} />
        <Route path="/login" element={<div>Login screen</div>} />
        <Route path="/" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAuthenticated = false;
  mockPermissions = [];
});

describe('ProtectedRoute (real component)', () => {
  it('redirects unauthenticated user to /login', () => {
    mockIsAuthenticated = false;
    renderRoute(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated user', () => {
    mockIsAuthenticated = true;
    renderRoute(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});

describe('RoleProtectedRoute (real component)', () => {
  it('redirects unauthenticated user to /login', () => {
    mockIsAuthenticated = false;
    renderRoute(
      <RoleProtectedRoute permission="restaurants.create">
        <div>Role content</div>
      </RoleProtectedRoute>,
    );
    expect(screen.getByText('Login screen')).toBeInTheDocument();
  });

  it('redirects to home when user lacks the required permission', () => {
    mockIsAuthenticated = true;
    mockPermissions = ['customers:read'];
    renderRoute(
      <RoleProtectedRoute permission="restaurants.create">
        <div>Role content</div>
      </RoleProtectedRoute>,
    );
    expect(screen.getByText('Home screen')).toBeInTheDocument();
    expect(screen.queryByText('Role content')).not.toBeInTheDocument();
  });

  it('renders children when user has the required permission', () => {
    mockIsAuthenticated = true;
    mockPermissions = ['restaurants.create', 'customers:read'];
    renderRoute(
      <RoleProtectedRoute permission="restaurants.create">
        <div>Role content</div>
      </RoleProtectedRoute>,
    );
    expect(screen.getByText('Role content')).toBeInTheDocument();
  });

  it('renders children when no permission is required', () => {
    mockIsAuthenticated = true;
    mockPermissions = [];
    renderRoute(
      <RoleProtectedRoute>
        <div>Role content</div>
      </RoleProtectedRoute>,
    );
    expect(screen.getByText('Role content')).toBeInTheDocument();
  });
});
