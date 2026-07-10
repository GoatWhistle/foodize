import { create, type StateCreator, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import type { UserRead } from "@shared/types/models";

export type AuthUser = UserRead;

export interface AuthServiceContract {
  register: (data: never) => Promise<unknown>;
  login: (credentials: never) => Promise<unknown>;
  getMe: () => Promise<{ data: { data: AuthUser } }>;
  logout: () => Promise<unknown>;
}

export interface AuthStoreState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  register: (data: unknown) => Promise<void>;
  login: (credentials: unknown) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  [key: string]: unknown;
}

export interface CreateAuthStoreOptions {
  authService: AuthServiceContract;
  persistKey?: string | null;
  extraActions?: (
    set: StoreApi<AuthStoreState>["setState"],
    get: StoreApi<AuthStoreState>["getState"],
  ) => Partial<AuthStoreState>;
}

export function createAuthStore({
  authService,
  persistKey = null,
  extraActions = () => ({}),
}: CreateAuthStoreOptions): UseBoundStore<StoreApi<AuthStoreState>> {
  const storeFactory: StateCreator<AuthStoreState> = (set, get) => ({
    user: null,
    isAuthenticated: false,

    register: async (data) => {
      await authService.register(data as never);
    },

    login: async (credentials) => {
      try {
        await authService.login(credentials as never);
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
    return create<AuthStoreState>()(
      persist(storeFactory, {
        name: persistKey,
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }),
    );
  }

  return create<AuthStoreState>()(storeFactory);
}
