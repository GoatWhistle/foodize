import { useState, useEffect, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useRestaurantStore } from "@shared/store/useRestaurantStore.js";
import { reviewService } from "@shared/services/reviewService.js";
import { restaurantService } from "@shared/services/restaurantService.js";
import { translateApiError } from "@shared/utils/translateApiError.js";
import { isRestaurantOpen } from "../utils/restaurant.js";

export const useRestaurantPage = ({ id, initialRestaurant = null, reviewsPageSize = 10 } = {}) => {
  const [restaurantData, setRestaurantData] = useState(initialRestaurant);
  const [rating, setRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(null);
  const [workingHours, setWorkingHours] = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "" });
  const [restaurantLoading, setRestaurantLoading] = useState(!initialRestaurant);
  const [restaurantError, setRestaurantError] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { fetchMenu, menus, loading } = useRestaurantStore(
    useShallow((s) => ({
      fetchMenu: s.fetchMenu,
      menus: s.menus,
      loading: s.loading,
    })),
  );

  const restaurantUUID = restaurantData?.id?.toString() ?? null;
  const restaurant = restaurantData ?? { id, name: "Ресторан", address: "" };
  const menuItems = menus[restaurantUUID ?? id] || [];
  const restaurantOpen = isRestaurantOpen(restaurant);

  const availableMenuItems = menuItems.filter((i) => i.is_available !== false);
  const categories = ["ALL", ...new Set(availableMenuItems.map((i) => i.category).filter(Boolean))];
  const filteredMenuItems =
    activeCategory === "ALL"
      ? availableMenuItems
      : availableMenuItems.filter((i) => i.category === activeCategory);

  const refreshRating = useCallback(
    (rid) => {
      const target = rid ?? restaurantUUID;
      if (!target) return;
      reviewService
        .getRating(target)
        .then((res) => {
          const d = res.data?.data;
          setRating(d?.average_rating ?? d?.rating ?? null);
          setReviewCount(d?.review_count ?? null);
        })
        .catch(() => {});
    },
    [restaurantUUID],
  );

  const loadReviews = useCallback(
    (rid) => {
      const target = rid ?? restaurantUUID;
      if (!target) return;
      setReviewsLoading(true);
      reviewService
        .getReviews(target, { page: reviewsPage, size: reviewsPageSize })
        .then((res) => {
          const list = Array.isArray(res.data?.data) ? res.data.data : [];
          setReviewsList(list);
          setReviewsTotal(res.data?.pagination?.total || 0);
        })
        .catch((err) => {
          setReviewError(translateApiError(err, "Не удалось загрузить отзывы"));
        })
        .finally(() => setReviewsLoading(false));
    },
    [restaurantUUID, reviewsPage, reviewsPageSize],
  );

  useEffect(() => {
    if (!initialRestaurant) {
      setRestaurantLoading(true);
      setRestaurantError("");
      restaurantService
        .getById(id)
        .then((res) => setRestaurantData(res.data.data))
        .catch((err) => setRestaurantError(translateApiError(err, "Не удалось загрузить ресторан")))
        .finally(() => setRestaurantLoading(false));
    }
  }, [id, initialRestaurant]);

  useEffect(() => {
    if (!restaurantUUID) return;
    fetchMenu(restaurantUUID);
    refreshRating(restaurantUUID);
    restaurantService
      .getWorkingHours(restaurantUUID)
      .then((res) => setWorkingHours(res.data?.data || []))
      .catch(() => {});
  }, [restaurantUUID, fetchMenu, refreshRating]);

  useEffect(() => {
    if (!restaurantUUID) return;
    loadReviews(restaurantUUID);
  }, [restaurantUUID, loadReviews]);

  const handleReviewSubmit = async ({ myReview, onSuccess } = {}) => {
    setReviewError("");
    try {
      const rid = restaurantUUID ?? id;
      if (myReview) {
        await reviewService.updateMyReview(rid, {
          text: reviewForm.text || null,
          rating: reviewForm.rating,
        });
      } else {
        await reviewService.createReview(rid, {
          text: reviewForm.text || null,
          rating: reviewForm.rating,
        });
      }
      setReviewSuccess(true);
      loadReviews(rid);
      refreshRating(rid);
      window.setTimeout(() => setReviewSuccess(false), 2200);
      onSuccess?.();
    } catch (err) {
      setReviewError(translateApiError(err, "Не удалось отправить отзыв"));
    }
  };

  const handleReviewDelete = async (reviewId) => {
    const rid = restaurantUUID ?? id;
    try {
      await reviewService.deleteReview(rid, reviewId);
      setReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
      refreshRating(rid);
    } catch (err) {
      setReviewError(translateApiError(err, "Не удалось удалить отзыв"));
    }
  };

  return {
    restaurant,
    restaurantUUID,
    restaurantLoading,
    restaurantError,
    rating,
    reviewCount,
    workingHours,
    loading,
    isRestaurantOpen: restaurantOpen,
    categories,
    activeCategory,
    setActiveCategory,
    filteredMenuItems,
    reviewsList,
    reviewsPage,
    setReviewsPage,
    reviewsTotal,
    reviewForm,
    setReviewForm,
    reviewsLoading,
    reviewError,
    setReviewError,
    reviewSuccess,
    selectedProduct,
    setSelectedProduct,
    handleReviewSubmit,
    handleReviewDelete,
    loadReviews,
    refreshRating,
  };
};
