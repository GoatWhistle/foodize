import { useState, useEffect, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useShallow } from "zustand/react/shallow";
import { useRestaurantStore } from "@shared/store/useRestaurantStore";
import type { RestaurantStoreState } from "@shared/store/useRestaurantStore";
import { reviewService } from "@shared/services/reviewService";
import { restaurantService } from "@shared/services/restaurantService";
import { translateApiError } from "@shared/utils/translateApiError";
import { logError } from "@shared/utils/logError";
import { isRestaurantOpen } from "../utils/restaurant";
import type { MenuItem, Restaurant, Review } from "@shared/types/models";
import type { components } from "@shared/types/api";

type WorkingHoursRead = components["schemas"]["WorkingHoursRead"];

type RestaurantView = Restaurant | { id: string; name: string; address: string };

interface ReviewForm {
  rating: number;
  text: string;
}

export interface UseRestaurantPageOptions {
  id: string;
  initialRestaurant?: Restaurant | null;
  reviewsPageSize?: number;
}

export interface HandleReviewSubmitArgs {
  myReview?: boolean;
  onSuccess?: () => void;
}

export interface UseRestaurantPageResult {
  restaurant: RestaurantView;
  restaurantUUID: string | null;
  restaurantLoading: boolean;
  restaurantError: string;
  rating: number | null;
  reviewCount: number | null;
  workingHours: WorkingHoursRead[];
  loading: boolean;
  isRestaurantOpen: boolean;
  categories: string[];
  activeCategory: string;
  setActiveCategory: Dispatch<SetStateAction<string>>;
  filteredMenuItems: MenuItem[];
  reviewsList: Review[];
  reviewsPage: number;
  setReviewsPage: Dispatch<SetStateAction<number>>;
  reviewsTotal: number;
  reviewForm: ReviewForm;
  setReviewForm: Dispatch<SetStateAction<ReviewForm>>;
  reviewsLoading: boolean;
  reviewError: string;
  setReviewError: Dispatch<SetStateAction<string>>;
  reviewSuccess: boolean;
  selectedProduct: MenuItem | null;
  setSelectedProduct: Dispatch<SetStateAction<MenuItem | null>>;
  handleReviewSubmit: (args?: HandleReviewSubmitArgs) => Promise<void>;
  handleReviewDelete: (reviewId: string) => Promise<void>;
  loadReviews: (rid?: string | null) => void;
  refreshRating: (rid?: string | null) => void;
}

export const useRestaurantPage = ({
  id,
  initialRestaurant = null,
  reviewsPageSize = 10,
}: UseRestaurantPageOptions): UseRestaurantPageResult => {
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(initialRestaurant);
  const [rating, setRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHoursRead[]>([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({ rating: 5, text: "" });
  const [restaurantLoading, setRestaurantLoading] = useState(!initialRestaurant);
  const [restaurantError, setRestaurantError] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

  const { fetchMenu, menus, loading } = useRestaurantStore(
    useShallow((s: RestaurantStoreState) => ({
      fetchMenu: s.fetchMenu,
      menus: s.menus,
      loading: s.menuLoading,
    })),
  );

  const restaurantUUID = restaurantData?.id ?? null;
  const restaurant: RestaurantView = restaurantData ?? { id, name: "Ресторан", address: "" };
  const menuItems = menus[restaurantUUID ?? id] || [];
  const restaurantOpen = isRestaurantOpen(restaurantData);

  const availableMenuItems = menuItems.filter((i) => i.is_available);
  const categories: string[] = [
    "ALL",
    ...new Set(
      availableMenuItems
        .map((i) => i.category)
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    ),
  ];
  const filteredMenuItems =
    activeCategory === "ALL"
      ? availableMenuItems
      : availableMenuItems.filter((i) => i.category === activeCategory);

  const refreshRating = useCallback(
    (rid?: string | null) => {
      const target = rid ?? restaurantUUID;
      if (!target) return;
      void (async () => {
        try {
          const response = await reviewService.getRating(target);
          const ratingData = response.data.data;
          setRating(ratingData.average_rating);
          setReviewCount(ratingData.review_count);
        } catch (error) {
          logError("useRestaurantPage.refreshRating", error);
        }
      })();
    },
    [restaurantUUID],
  );

  const loadReviews = useCallback(
    (rid?: string | null) => {
      const target = rid ?? restaurantUUID;
      if (!target) return;
      setReviewsLoading(true);
      void (async () => {
        try {
          const response = await reviewService.getReviews(target, {
            page: reviewsPage,
            size: reviewsPageSize,
          });
          const body = response.data;
          const list = Array.isArray(body.data) ? body.data : [];
          setReviewsList(list);
          setReviewsTotal(body.pagination.total || 0);
        } catch (error) {
          setReviewError(translateApiError(error, "Не удалось загрузить отзывы"));
        } finally {
          setReviewsLoading(false);
        }
      })();
    },
    [restaurantUUID, reviewsPage, reviewsPageSize],
  );

  useEffect(() => {
    if (initialRestaurant) return;
    const state = { stale: false };
    setRestaurantLoading(true);
    setRestaurantError("");
    void (async () => {
      try {
        const response = await restaurantService.getById(id);
        if (state.stale) return;
        setRestaurantData(response.data.data);
      } catch (error) {
        if (state.stale) return;
        setRestaurantError(translateApiError(error, "Не удалось загрузить ресторан"));
      } finally {
        if (!state.stale) setRestaurantLoading(false);
      }
    })();
    return () => {
      state.stale = true;
    };
  }, [id, initialRestaurant]);

  useEffect(() => {
    if (!restaurantUUID) return;
    const state = { stale: false };
    void fetchMenu(restaurantUUID);
    refreshRating(restaurantUUID);
    void (async () => {
      try {
        const response = await restaurantService.getWorkingHours(restaurantUUID);
        if (state.stale) return;
        setWorkingHours(response.data.data);
      } catch (error) {
        logError("useRestaurantPage.getWorkingHours", error);
      }
    })();
    return () => {
      state.stale = true;
    };
  }, [restaurantUUID, fetchMenu, refreshRating]);

  useEffect(() => {
    if (!restaurantUUID) return;
    loadReviews(restaurantUUID);
  }, [restaurantUUID, loadReviews]);

  const handleReviewSubmit = async ({ myReview, onSuccess }: HandleReviewSubmitArgs = {}): Promise<void> => {
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
      window.setTimeout(() => { setReviewSuccess(false); }, 2200);
      onSuccess?.();
    } catch (err) {
      setReviewError(translateApiError(err, "Не удалось отправить отзыв"));
    }
  };

  const handleReviewDelete = async (reviewId: string): Promise<void> => {
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
