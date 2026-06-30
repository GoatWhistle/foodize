import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { favoriteService } from "@shared/services/favoriteService.js";
import { useFavoriteStore } from "@shared/store/useFavoriteStore.js";

export const useFavoritesPage = ({ pageSize = 100, navigateTo = (r) => `/restaurant/${r.display_id}` } = {}) => {
  const navigate = useNavigate();
  const { toggle } = useFavoriteStore();
  const [favorites, setFavorites] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    favoriteService
      .getAll({ page, size: pageSize })
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setFavorites(list);
        setTotal(res.data?.pagination?.total ?? list.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  const handleUnfavorite = async (restaurantId) => {
    await toggle(restaurantId);
    setFavorites((prev) => prev.filter((f) => f.restaurant.id !== restaurantId));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  const handleNavigate = (restaurant) => {
    navigate(navigateTo(restaurant), { state: { restaurant } });
  };

  return { favorites, loading, total, page, setPage, handleUnfavorite, handleNavigate };
};
