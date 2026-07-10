import { create } from "zustand";
import { restaurantService } from "@shared/services/restaurantService";
import { menuService } from "@shared/services/menuService";
import { translateApiError } from "@shared/utils/translateApiError";
import type {
  Restaurant,
  MenuItem,
  RestaurantCreate,
  MenuItemCreate,
} from "@shared/types/models";

const PUBLIC_RESTAURANTS_TTL_MS = 60_000;

interface CacheEntry {
  list: Restaurant[];
  total: number;
  ts: number;
}

const publicRestaurantsCache = new Map<string, CacheEntry>();

export interface RestaurantStoreState {
  publicRestaurants: Restaurant[];
  publicRestaurantsTotal: number;
  restaurants: Restaurant[];
  menus: Record<string, MenuItem[]>;
  currentRestaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  fetchPublicRestaurants: (params?: Record<string, unknown>) => Promise<void>;
  fetchMyRestaurants: () => Promise<void>;
  fetchMenu: (
    restaurantId: string,
    options?: { force?: boolean },
  ) => Promise<void>;
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  createRestaurant: (data: RestaurantCreate) => Promise<Restaurant>;
  addMenuItem: (restaurantId: string, data: MenuItemCreate) => Promise<MenuItem>;
}

export const useRestaurantStore = create<RestaurantStoreState>((set, get) => ({
  publicRestaurants: [],
  publicRestaurantsTotal: 0,
  restaurants: [],
  menus: {},
  currentRestaurant: null,
  loading: false,
  error: null,

  fetchPublicRestaurants: async (params = {}) => {
    const cacheKey = JSON.stringify(params);
    const cached = publicRestaurantsCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < PUBLIC_RESTAURANTS_TTL_MS) {
      set({ publicRestaurants: cached.list, publicRestaurantsTotal: cached.total, loading: false });
      return;
    }
    set({ loading: true, error: null });
    try {
      const res = await restaurantService.getAll(params);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const total = res.data?.pagination?.total || list.length;
      publicRestaurantsCache.set(cacheKey, { list, total, ts: Date.now() });
      set({ publicRestaurants: list, publicRestaurantsTotal: total, loading: false });
    } catch (e) {
      set({ error: translateApiError(e), loading: false });
    }
  },

  fetchMyRestaurants: async () => {
    set({ loading: true, error: null });
    try {
      const res = await restaurantService.getMy();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      set({ restaurants: list, loading: false });
    } catch (e) {
      set({ error: translateApiError(e), loading: false });
    }
  },

  fetchMenu: async (restaurantId, { force = false } = {}) => {
    if (!force && get().menus[restaurantId]) return;
    set({ loading: true });
    try {
      const res = await menuService.getMenu(restaurantId);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      set((s) => ({ menus: { ...s.menus, [restaurantId]: list }, loading: false }));
    } catch (e) {
      set({ error: translateApiError(e), loading: false });
    }
  },

  setCurrentRestaurant: (restaurant) => set({ currentRestaurant: restaurant }),

  createRestaurant: async (data) => {
    set({ error: null });
    try {
      const res = await restaurantService.create(data);
      set((s) => ({ restaurants: [...s.restaurants, res.data.data] }));
      return res.data.data;
    } catch (e) {
      set({ error: translateApiError(e) });
      throw e;
    }
  },

  addMenuItem: async (restaurantId, data) => {
    set({ error: null });
    try {
      const res = await menuService.addItem(restaurantId, data);
      set((s) => {
        const currentMenu = Array.isArray(s.menus[restaurantId]) ? s.menus[restaurantId] : [];
        return { menus: { ...s.menus, [restaurantId]: [...currentMenu, res.data.data] } };
      });
      return res.data.data;
    } catch (e) {
      set({ error: translateApiError(e) });
      throw e;
    }
  },
}));
