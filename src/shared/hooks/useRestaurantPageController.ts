import { useMemo } from "react";
import type { SyntheticEvent } from "react";
import { useRestaurantPage } from "@shared/hooks/useRestaurantPage";
import { splitReviewsByAuthor } from "@shared/utils/reviews";
import { toInfoWorkingHours } from "@shared/utils/restaurant";
import { pluralizeRu } from "@shared/utils/pluralize";
import type { MenuItem, Restaurant } from "@shared/types/models";

interface ConfirmRequest {
  title: string;
  message?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

export interface RestaurantPageControllerArgs<Option> {
  id: string;
  initialRestaurant: Restaurant | null;
  currentUserId: string | null | undefined;
  addToCart: (
    item: MenuItem,
    restaurantId: string,
    options: Option[],
    quantity?: number,
  ) => unknown;
  toggleFavorite: (restaurantId: string) => unknown;
  favoriteIds: string[];
  requestConfirm: (request: ConfirmRequest) => void;
}

export interface ProductAddPayload<Option> {
  item: MenuItem;
  selectedOptions: Option[];
  quantity: number;
}

export function useRestaurantPageController<Option>({
  id,
  initialRestaurant,
  currentUserId,
  addToCart,
  toggleFavorite,
  favoriteIds,
  requestConfirm,
}: RestaurantPageControllerArgs<Option>) {
  const page = useRestaurantPage({ id, initialRestaurant });

  const restaurantView = page.restaurant as Restaurant;
  const targetRestaurantId = page.restaurantUUID || id;
  const isFav = favoriteIds.includes(targetRestaurantId);
  const { myReview, otherReviews } = splitReviewsByAuthor(
    page.reviewsList,
    currentUserId,
  );
  const infoWorkingHours = toInfoWorkingHours(page.workingHours);

  const reviewsButtonLabel = useMemo(() => {
    const parts: string[] = [];
    if (page.rating != null) parts.push(page.rating.toFixed(1));
    if (page.reviewCount != null) {
      parts.push(
        `${page.reviewCount} ${pluralizeRu(page.reviewCount, ["отзыв", "отзыва", "отзывов"])}`,
      );
    } else {
      parts.push("Отзывы");
    }
    return parts.join(" · ");
  }, [page.rating, page.reviewCount]);

  const handleProductAdd = ({
    item,
    selectedOptions,
    quantity,
  }: ProductAddPayload<Option>): void => {
    if (!page.isRestaurantOpen) return;
    if (!page.restaurantUUID && !id) return;
    void addToCart(item, targetRestaurantId, selectedOptions, quantity);
    page.setSelectedProduct(null);
  };

  const handleToggleFavorite = (): void => {
    if (page.restaurantUUID) void toggleFavorite(page.restaurantUUID);
  };

  const handleReviewSubmitForm = (
    payload:
      | SyntheticEvent<HTMLFormElement>
      | { myReview: unknown; onSuccess: () => void },
  ): void => {
    if ("myReview" in payload) {
      void page.handleReviewSubmit({
        myReview: Boolean(payload.myReview),
        onSuccess: payload.onSuccess,
      });
      return;
    }
    payload.preventDefault();
    void page.handleReviewSubmit();
  };

  const handleDeleteWithConfirm = (reviewId: string): void => {
    requestConfirm({
      title: "Удалить отзыв?",
      message: "Точно ли вы хотите удалить этот отзыв?",
      confirmLabel: "Удалить",
      danger: true,
      onConfirm: () => page.handleReviewDelete(reviewId),
    });
  };

  return {
    ...page,
    restaurantView,
    isFav,
    myReview,
    otherReviews,
    infoWorkingHours,
    reviewsButtonLabel,
    handleProductAdd,
    handleToggleFavorite,
    handleReviewSubmitForm,
    handleDeleteWithConfirm,
  };
}
