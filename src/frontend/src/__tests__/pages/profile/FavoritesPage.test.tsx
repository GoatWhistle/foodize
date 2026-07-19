import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { FavoritesPage } from '../../../pages/profile/FavoritesPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@shared/pages/FavoritesPage/FavoritesPage', () => ({
  FavoritesPage: ({ pageSize, showPagination }: { pageSize: number; showPagination: boolean }) => (
    <div data-testid="shared-favorites">
      favorites {pageSize} {String(showPagination)}
    </div>
  ),
}));

describe('FavoritesPage wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shared favorites with props', () => {
    render(
      <MemoryRouter>
        <FavoritesPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('shared-favorites')).toHaveTextContent('favorites 20 true');
  });

  it('navigates back to profile on back button', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FavoritesPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });
});
