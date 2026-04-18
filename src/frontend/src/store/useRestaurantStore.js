import { create } from "zustand";
import { restaurantService } from "../services/restaurantService";
import { menuService } from "../services/menuService";

export const useRestaurantStore = create((set, get) => ({
  publicRestaurants: [],
  restaurants: [],
  menus: {}, // { [restaurantId]: MenuItem[] }
  currentRestaurant: null,
  loading: false,
  error: null,

  fetchPublicRestaurants: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await restaurantService.getAll(params);
      set({ publicRestaurants: res.data.data || res.data, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  fetchMyRestaurants: async () => {
    set({ loading: true, error: null });
    try {
      const res = await restaurantService.getMy();
      set({ restaurants: res.data, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  fetchMenu: async (restaurantId) => {
    if (get().menus[restaurantId]) return; // cached
    set({ loading: true });
    try {
      const res = await menuService.getMenu(restaurantId);
      set((s) => ({
        menus: { ...s.menus, [restaurantId]: res.data },
        loading: false,
      }));
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  setCurrentRestaurant: (restaurant) => set({ currentRestaurant: restaurant }),

  createRestaurant: async (data) => {
    const res = await restaurantService.create(data);
    set((s) => ({ restaurants: [...s.restaurants, res.data] }));
    return res.data;
  },

  addMenuItem: async (restaurantId, data) => {
    const res = await menuService.addItem(restaurantId, data);
    set((s) => ({
      menus: {
        ...s.menus,
        [restaurantId]: [...(s.menus[restaurantId] || []), res.data],
      },
    }));
    return res.data;
  },
}));
