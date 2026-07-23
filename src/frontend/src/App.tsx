import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { IconContext } from '@phosphor-icons/react';
import { ErrorBoundary } from '@shared/components/ErrorBoundary/ErrorBoundary';
import { ConfirmDialog } from '@shared/components/ConfirmDialog/ConfirmDialog';
import { useAuthStore } from './store/useAuthStore';
import { selectIsAuthenticated } from '@shared/store/createAuthStore';
import { useThemeEffect } from '@shared/hooks/useThemeEffect';
import { useCartStore } from './store/useCartStore';
import { useFavoriteStore } from '@shared/store/useFavoriteStore';
import { router } from './appRouter';

export function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const fetchCart = useCartStore((s) => s.fetchCart);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const loadFavorites = useFavoriteStore((s) => s.loadFavorites);

  useThemeEffect();

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchCart();
      void loadFavorites();
    }
  }, [isAuthenticated, fetchCart, loadFavorites]);

  return (
    <ErrorBoundary>
      <IconContext.Provider
        value={{
          color: 'currentColor',
          size: 20,
          weight: 'bold',
          mirrored: false,
        }}
      >
        <RouterProvider router={router} />
        <ConfirmDialog />
      </IconContext.Provider>
    </ErrorBoundary>
  );
}
