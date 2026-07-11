import { create, type StateCreator, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import { logError } from "@shared/utils/logError";
import type { UserRead } from "@shared/types/models";

export type AuthUser = UserRead;

export interface AuthServiceContract {
  register: (data: never) => Promise<unknown>;
  login: (credentials: never) => Promise<unknown>;
  getMe: () => Promise<{ data: { data: AuthUser } }>;
  logout: () => Promise<unknown>;
}

type LoginCredentials<TService extends AuthServiceContract> = Parameters<
  TService["login"]
>[0];

type RegisterData<TService extends AuthServiceContract> = Parameters<
  TService["register"]
>[0];

export interface AuthStoreState<
  TService extends AuthServiceContract = AuthServiceContract,
> {
  user: AuthUser | null;
  isAuthenticated: boolean;
  register: (data: RegisterData<TService>) => Promise<void>;
  login: (credentials: LoginCredentials<TService>) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

type SetAuthState<TService extends AuthServiceContract> = (
  partial: Partial<AuthStoreState<TService>>,
) => void;

type GetAuthState<TService extends AuthServiceContract, TExtra extends object> =
  StoreApi<AuthStoreState<TService> & TExtra>["getState"];

export interface CreateAuthStoreOptions<
  TService extends AuthServiceContract,
  TExtra extends object,
> {
  authService: TService;
  persistKey?: string | null;
  extraActions?: (
    set: SetAuthState<TService>,
    get: GetAuthState<TService, TExtra>,
  ) => TExtra;
}

export function createAuthStore<
  TService extends AuthServiceContract,
  TExtra extends object = Record<never, never>,
>({
  authService,
  persistKey = null,
  extraActions = () => ({}) as TExtra,
}: CreateAuthStoreOptions<TService, TExtra>): UseBoundStore<
  StoreApi<AuthStoreState<TService> & TExtra>
> {
  type State = AuthStoreState<TService> & TExtra;

  const storeFactory: StateCreator<State> = (set, get) => {
    const setAuth: SetAuthState<TService> = (partial) => set(partial as Partial<State>);

    const base: AuthStoreState<TService> = {
      user: null,
      isAuthenticated: false,

      register: async (data) => {
        await authService.register(data);
      },

      login: async (credentials) => {
        try {
          await authService.login(credentials);
          const me = await authService.getMe();
          setAuth({ user: me.data.data, isAuthenticated: true });
        } catch (err) {
          setAuth({ user: null, isAuthenticated: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (err) {
          logError("authStore.logout", err);
        }
        setAuth({ user: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const me = await authService.getMe();
          setAuth({ user: me.data.data, isAuthenticated: true });
        } catch {
          setAuth({ user: null, isAuthenticated: false });
        }
      },
    };

    return {
      ...base,
      ...extraActions(setAuth, get),
    };
  };

  if (persistKey) {
    return create<State>()(
      persist(storeFactory, {
        name: persistKey,
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }),
    );
  }

  return create<State>()(storeFactory);
}
