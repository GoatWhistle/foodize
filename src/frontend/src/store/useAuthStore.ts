import { createAuthStore } from '@shared/store/createAuthStore';
import { authService } from '@shared/services/authService';
import { useOrderStore } from './useOrderStore';
import { useFavoriteStore } from '@shared/store/useFavoriteStore';
import { useNotificationStore } from './useNotificationStore';

type VerifyCodeData = Parameters<typeof authService.verifyTelegramLoginCode>[0];
type VerifyCodeByUsernameData = Parameters<
  typeof authService.verifyTelegramLoginCodeByUsername
>[0];

export const useAuthStore = createAuthStore({
  authService,
  persistKey: 'auth-storage',
  extraActions: (set) => ({
    logout: async () => {
      try {
        await authService.logout();
      } catch {}
      set({ user: null, isAuthenticated: false });
      useNotificationStore.getState().disconnectWs();
      useNotificationStore.setState({ notifications: [], unreadCount: 0, total: 0, page: 1, connectionStatus: 'closed', wasEverConnected: false });
      useOrderStore.setState({ cart: [], cartRestaurantId: null, activeOrder: null, currentOrder: null, orders: [] });
      useFavoriteStore.setState({ favoriteIds: [], loaded: false });
    },

    loginWithTelegramCode: async (data: VerifyCodeData) => {
      try {
        await authService.verifyTelegramLoginCode(data);
        const me = await authService.getMe();
        set({ user: me.data.data, isAuthenticated: true });
        return { requiresPassword: false };
      } catch (err) {
        set({ user: null, isAuthenticated: false });
        throw err;
      }
    },

    loginWithTelegramCodeByUsername: async (data: VerifyCodeByUsernameData) => {
      try {
        const res = await authService.verifyTelegramLoginCodeByUsername(data);
        const requiresPassword = res?.data?.data?.requires_password ?? false;
        const me = await authService.getMe();
        set({ user: me.data.data, isAuthenticated: true });
        return { requiresPassword };
      } catch (err) {
        set({ user: null, isAuthenticated: false });
        throw err;
      }
    },

    setTelegramSitePassword: async (password: string) => {
      try {
        await authService.setTelegramSitePassword({ password });
        const me = await authService.getMe();
        set({ user: me.data.data, isAuthenticated: true });
      } catch (err) {
        set({ user: null, isAuthenticated: false });
        throw err;
      }
    },
  }),
});
