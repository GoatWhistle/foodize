import { create } from "zustand";
import { restaurantService } from "@shared/services/restaurantService";
import { menuService } from "@shared/services/menuService";
import { translateApiError } from "@shared/utils/translateApiError";
import { createTtlCache } from "@shared/utils/ttlCache";
import type {
  Restaurant,
  MenuItem,
  RestaurantCreate,
  MenuItemCreate,
} from "@shared/types/models";

const PUBLIC_RESTAURANTS_TTL_MS = 60_000;

interface PublicRestaurantsResult {
  list: Restaurant[];
  total: number;
}

const publicRestaurantsCache = createTtlCache<PublicRestaurantsResult>(
  PUBLIC_RESTAURANTS_TTL_MS,
);

export interface RestaurantStoreState {
  publicRestaurants: Restaurant[];
  publicRestaurantsTotal: number;
  restaurants: Restaurant[];
  menus: Record<string, MenuItem[]>;
  currentRestaurant: Restaurant | null;
  publicLoading: boolean;
  myLoading: boolean;
  menuLoading: boolean;
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
  publicLoading: false,
  myLoading: false,
  menuLoading: false,
  error: null,

  fetchPublicRestaurants: async (params = {}) => {
    const cacheKey = JSON.stringify(params);
    const cached = publicRestaurantsCache.get(cacheKey);
    if (cached) {
      set({
        publicRestaurants: cached.list,
        publicRestaurantsTotal: cached.total,
        publicLoading: false,
      });
      return;
    }
    set({ publicLoading: true, error: null });
    try {
      const res = await restaurantService.getAll(params);
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      const total = res.data.pagination.total || list.length;
      publicRestaurantsCache.set(cacheKey, { list, total });
      set({ publicRestaurants: list, publicRestaurantsTotal: total, publicLoading: false });
    } catch (e) {
      set({ error: translateApiError(e), publicLoading: false });
    }
  },

  fetchMyRestaurants: async () => {
    set({ myLoading: true, error: null });
    try {
      const res = await restaurantService.getMy();
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      set({ restaurants: list, myLoading: false });
    } catch (e) {
      set({ error: translateApiError(e), myLoading: false });
    }
  },

  fetchMenu: async (restaurantId, { force = false } = {}) => {
    if (!force && get().menus[restaurantId]) return;
    set({ menuLoading: true });
    try {
      const res = await menuService.getMenu(restaurantId);
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      set((s) => ({ menus: { ...s.menus, [restaurantId]: list }, menuLoading: false }));
    } catch (e) {
      set({ error: translateApiError(e), menuLoading: false });
    }
  },

  setCurrentRestaurant: (restaurant) => { set({ currentRestaurant: restaurant }); },

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
