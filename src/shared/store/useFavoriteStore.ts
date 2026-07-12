import { create } from "zustand";
import { favoriteService } from "@shared/services/favoriteService";
import { logError } from "@shared/utils/logError";

export interface FavoriteStoreState {
  favoriteIds: string[];
  loaded: boolean;
  loadFavorites: () => Promise<void>;
  toggle: (restaurantId: string) => Promise<void>;
}

export const useFavoriteStore = create<FavoriteStoreState>((set, get) => ({
  favoriteIds: [],
  loaded: false,

  loadFavorites: async () => {
    try {
      const res = await favoriteService.getAll({ size: 100 });
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      set({
        favoriteIds: list.map((f) => f.restaurant.id),
        loaded: true,
      });
    } catch (err) {
      logError("useFavoriteStore.loadFavorites", err);
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
      } catch (err) {
        logError("useFavoriteStore.toggle.remove", err);
        set({ favoriteIds: prev });
      }
    } else {
      const next = [...favoriteIds, restaurantId];
      set({ favoriteIds: next });
      try {
        await favoriteService.add(restaurantId);
      } catch (err) {
        logError("useFavoriteStore.toggle.add", err);
        set({ favoriteIds: prev });
      }
    }
  },
}));
