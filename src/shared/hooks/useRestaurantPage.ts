import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useShallow } from "zustand/react/shallow";
import { useRestaurantStore } from "@shared/store/useRestaurantStore";
import type { RestaurantStoreState } from "@shared/store/useRestaurantStore";
import { restaurantService } from "@shared/services/restaurantService";
import { translateApiError } from "@shared/utils/translateApiError";
import { logError } from "@shared/utils/logError";
import { useTranslation } from "@shared/i18n/useTranslation";
import { isRestaurantOpen } from "../utils/restaurant";
import { useRestaurantReviews } from "@shared/hooks/useRestaurantReviews";
import type { ReviewForm, HandleReviewSubmitArgs } from "@shared/hooks/useRestaurantReviews";
import type { MenuItem, Restaurant, Review } from "@shared/types/models";
import type { components } from "@shared/types/api";

type WorkingHoursRead = components["schemas"]["WorkingHoursRead"];

type RestaurantView = Restaurant | { id: string; name: string; address: string };

export interface UseRestaurantPageOptions {
  id: string;
  initialRestaurant?: Restaurant | null;
  reviewsPageSize?: number;
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
  const { t } = useTranslation();
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(initialRestaurant);
  const [workingHours, setWorkingHours] = useState<WorkingHoursRead[]>([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [restaurantLoading, setRestaurantLoading] = useState(!initialRestaurant);
  const [restaurantError, setRestaurantError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

  const { fetchMenu, menus, loading } = useRestaurantStore(
    useShallow((s: RestaurantStoreState) => ({
      fetchMenu: s.fetchMenu,
      menus: s.menus,
      loading: s.menuLoading,
    })),
  );

  const restaurantUUID = restaurantData?.id ?? null;
  const restaurant: RestaurantView = restaurantData ?? { id, name: t("catalog.restaurantPage.fallbackName"), address: "" };
  const menuItems = menus[restaurantUUID ?? id] || [];
  const restaurantOpen = isRestaurantOpen(restaurantData);

  const reviews = useRestaurantReviews({ restaurantUUID, fallbackId: id, reviewsPageSize });
  const { refreshRating } = reviews;

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
        setRestaurantError(translateApiError(error, t("catalog.restaurantPage.loadFailed")));
      } finally {
        if (!state.stale) setRestaurantLoading(false);
      }
    })();
    return () => {
      state.stale = true;
    };
  }, [id, initialRestaurant, t]);

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

  return {
    restaurant,
    restaurantUUID,
    restaurantLoading,
    restaurantError,
    workingHours,
    loading,
    isRestaurantOpen: restaurantOpen,
    categories,
    activeCategory,
    setActiveCategory,
    filteredMenuItems,
    selectedProduct,
    setSelectedProduct,
    ...reviews,
  };
};
