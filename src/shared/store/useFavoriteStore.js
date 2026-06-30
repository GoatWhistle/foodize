import { create } from "zustand";
import { favoriteService } from "@shared/services/favoriteService.js";

export const useFavoriteStore = create((set, get) => ({
  favoriteIds: [],
  loaded: false,

  loadFavorites: async () => {
    try {
      const res = await favoriteService.getAll({ size: 100 });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      set({
        favoriteIds: list.map((f) => f.restaurant.id),
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  toggle: async (restaurantId) => {
    const { favoriteIds } = get();
    const isFav = favoriteIds.includes(restaurantId);
    const prev = favoriteIds;
    if (isFav) {
      const next = favoriteIds.filter((id) => id !== restaurantId);
      set({ favoriteIds: next });
      try {
        await favoriteService.remove(restaurantId);
      } catch {
        set({ favoriteIds: prev });
      }
    } else {
      const next = [...favoriteIds, restaurantId];
      set({ favoriteIds: next });
      try {
        await favoriteService.add(restaurantId);
      } catch {
        set({ favoriteIds: prev });
      }
    }
  },
}));
