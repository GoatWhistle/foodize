import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { favoriteService } from "@shared/services/favoriteService";
import { logError } from "@shared/utils/logError";
import { useFavoriteStore } from "@shared/store/useFavoriteStore";
import type { Favorite, Restaurant } from "@shared/types/models";

type NavigableRestaurant = Pick<Restaurant, "id" | "display_id">;

export interface UseFavoritesPageOptions {
  pageSize?: number;
  navigateTo?: (restaurant: NavigableRestaurant) => string;
}

export interface UseFavoritesPageResult {
  favorites: Favorite[];
  loading: boolean;
  total: number;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  handleUnfavorite: (restaurantId: string) => Promise<void>;
  handleNavigate: (restaurant: NavigableRestaurant) => void;
}

export const useFavoritesPage = ({
  pageSize = 100,
  navigateTo = (r: NavigableRestaurant) => `/restaurant/${r.display_id}`,
}: UseFavoritesPageOptions = {}): UseFavoritesPageResult => {
  const navigate = useNavigate();
  const toggle = useFavoriteStore((s) => s.toggle);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const load = async (): Promise<void> => {
      try {
        const res = await favoriteService.getAll({ page, size: pageSize });
        if (!active) return;
        const body = res.data;
        const list = Array.isArray(body.data) ? body.data : [];
        setFavorites(list);
        setTotal(body.pagination.total);
      } catch (err) {
        if (active) logError("useFavoritesPage.load", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [page, pageSize]);

  const handleUnfavorite = async (restaurantId: string): Promise<void> => {
    await toggle(restaurantId);
    setFavorites((prev) => prev.filter((f) => f.restaurant.id !== restaurantId));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  const handleNavigate = (restaurant: NavigableRestaurant): void => {
    void navigate(navigateTo(restaurant), { state: { restaurant } });
  };

  return { favorites, loading, total, page, setPage, handleUnfavorite, handleNavigate };
};
