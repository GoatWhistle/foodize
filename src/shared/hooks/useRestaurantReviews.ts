import { useState, useEffect, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { reviewService } from "@shared/services/reviewService";
import { translateApiError } from "@shared/utils/translateApiError";
import { logError } from "@shared/utils/logError";
import { useTranslation } from "@shared/i18n/useTranslation";
import type { Review } from "@shared/types/models";

export interface ReviewForm {
  rating: number;
  text: string;
}

export interface HandleReviewSubmitArgs {
  myReview?: boolean;
  onSuccess?: () => void;
}

interface UseRestaurantReviewsOptions {
  restaurantUUID: string | null;
  fallbackId: string;
  reviewsPageSize: number;
}

export interface UseRestaurantReviewsResult {
  rating: number | null;
  reviewCount: number | null;
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
  handleReviewSubmit: (args?: HandleReviewSubmitArgs) => Promise<void>;
  handleReviewDelete: (reviewId: string) => Promise<void>;
  loadReviews: (rid?: string | null) => void;
  refreshRating: (rid?: string | null) => void;
}

export const useRestaurantReviews = ({
  restaurantUUID,
  fallbackId,
  reviewsPageSize,
}: UseRestaurantReviewsOptions): UseRestaurantReviewsResult => {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({ rating: 5, text: "" });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

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
          setReviewError(translateApiError(error, t("catalog.reviews.loadFailed")));
        } finally {
          setReviewsLoading(false);
        }
      })();
    },
    [restaurantUUID, reviewsPage, reviewsPageSize, t],
  );

  useEffect(() => {
    if (!restaurantUUID) return;
    loadReviews(restaurantUUID);
  }, [restaurantUUID, loadReviews]);

  const handleReviewSubmit = async ({ myReview, onSuccess }: HandleReviewSubmitArgs = {}): Promise<void> => {
    setReviewError("");
    try {
      const rid = restaurantUUID ?? fallbackId;
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
      setReviewError(translateApiError(err, t("catalog.reviews.submitFailed")));
    }
  };

  const handleReviewDelete = async (reviewId: string): Promise<void> => {
    const rid = restaurantUUID ?? fallbackId;
    try {
      await reviewService.deleteReview(rid, reviewId);
      setReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
      refreshRating(rid);
    } catch (err) {
      setReviewError(translateApiError(err, t("catalog.reviews.deleteFailed")));
    }
  };

  return {
    rating,
    reviewCount,
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
    handleReviewSubmit,
    handleReviewDelete,
    loadReviews,
    refreshRating,
  };
};
