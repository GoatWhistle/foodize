import { createAuthStore } from '@shared/store/createAuthStore';
import { authService } from '@shared/services/authService';
import { useCartStore } from './useCartStore';
import { useOrdersStore } from './useOrdersStore';
import { useFavoriteStore } from '@shared/store/useFavoriteStore';
import { useNotificationStore } from './useNotificationStore';

type VerifyCodeData = Parameters<typeof authService.verifyTelegramLoginCode>[0];
type VerifyCodeByUsernameData = Parameters<
  typeof authService.verifyTelegramLoginCodeByUsername
>[0];

export const useAuthStore = createAuthStore({
  authService,
  persistKey: 'auth-storage',
  onLogout: () => {
    useNotificationStore.getState().disconnectWs();
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      total: 0,
      page: 1,
      connectionStatus: 'closed',
      wasEverConnected: false,
    });
    useCartStore.setState({ cart: [], cartRestaurantId: null });
    useOrdersStore.setState({ activeOrder: null, currentOrder: null, orders: [] });
    useFavoriteStore.setState({ favoriteIds: [], loaded: false });
  },
  extraActions: (set) => ({
    loginWithTelegramCode: async (data: VerifyCodeData) => {
      try {
        await authService.verifyTelegramLoginCode(data);
        const me = await authService.getMe();
        set({ user: me.data.data });
        return { requiresPassword: false };
      } catch (err) {
        set({ user: null });
        throw err;
      }
    },

    loginWithTelegramCodeByUsername: async (data: VerifyCodeByUsernameData) => {
      try {
        const res = await authService.verifyTelegramLoginCodeByUsername(data);
        const requiresPassword = res.data.data.requires_password;
        const me = await authService.getMe();
        set({ user: me.data.data });
        return { requiresPassword };
      } catch (err) {
        set({ user: null });
        throw err;
      }
    },

    setTelegramSitePassword: async (password: string) => {
      try {
        await authService.setTelegramSitePassword({ password });
        const me = await authService.getMe();
        set({ user: me.data.data });
      } catch (err) {
        set({ user: null });
        throw err;
      }
    },
  }),
});
