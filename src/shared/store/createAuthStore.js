import { create } from "zustand";
import { persist } from "zustand/middleware";

export function createAuthStore({
  authService,
  persistKey = null,
  extraActions = () => ({}),
}) {
  const storeFactory = (set, get) => ({
    user: null,
    isAuthenticated: false,

    register: async (data) => {
      await authService.register(data);
    },

    login: async (credentials) => {
      try {
        await authService.login(credentials);
        const me = await authService.getMe();
        set({ user: me.data.data, isAuthenticated: true });
      } catch (err) {
        set({ user: null, isAuthenticated: false });
        throw err;
      }
    },

    logout: async () => {
      try {
        await authService.logout();
      } catch {}
      set({ user: null, isAuthenticated: false });
    },

    fetchMe: async () => {
      try {
        const me = await authService.getMe();
        set({ user: me.data.data, isAuthenticated: true });
      } catch {
        set({ user: null, isAuthenticated: false });
      }
    },

    ...extraActions(set, get),
  });

  if (persistKey) {
    return create(
      persist(storeFactory, {
        name: persistKey,
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }),
    );
  }

  return create(storeFactory);
}
