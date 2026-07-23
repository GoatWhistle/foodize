import { vi } from "vitest";
import type { Review } from "@shared/types/models";

export const makeReview = (over: Partial<Review> = {}): Review => ({
  id: "r1",
  user_id: "user-1",
  user_name: "Мария",
  restaurant_id: "rest-1",
  rating: 5,
  text: "Замечательно",
  is_verified_purchase: false,
  created_at: "2026-01-15T12:30:00Z",
  ...over,
});

export interface Overrides {
  reviewsList?: Review[];
  reviewsLoading?: boolean;
  reviewSuccess?: boolean;
  reviewError?: string | null;
  onClose?: () => void;
  onSubmit?: (payload: unknown) => void;
  onDeleteWithConfirm?: (id: string) => void;
  setReviewForm?: (form: { rating: number; text: string }) => void;
  currentUser?: { id: string } | null;
}

export const baseProps = (over: Overrides = {}) => ({
  reviewsList: over.reviewsList ?? [],
  reviewsLoading: over.reviewsLoading ?? false,
  reviewForm: { rating: 5, text: "" },
  setReviewForm: over.setReviewForm ?? vi.fn(),
  reviewError: over.reviewError ?? null,
  reviewSuccess: over.reviewSuccess ?? false,
  currentUser: over.currentUser ?? null,
  onClose: over.onClose ?? vi.fn(),
  onSubmit: over.onSubmit ?? vi.fn(),
  onDeleteWithConfirm: over.onDeleteWithConfirm ?? vi.fn(),
  reviewsPage: 1,
  setReviewsPage: vi.fn(),
  reviewsTotal: 0,
  otherReviews: [],
});
