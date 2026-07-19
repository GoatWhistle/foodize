import type { Review } from "@shared/types/models";

export interface ReviewsByAuthor {
  myReview: Review | null;
  otherReviews: Review[];
}

export function splitReviewsByAuthor(
  reviews: readonly Review[],
  currentUserId: string | null | undefined,
): ReviewsByAuthor {
  return {
    myReview: reviews.find((review) => review.user_id === currentUserId) ?? null,
    otherReviews: reviews.filter((review) => review.user_id !== currentUserId),
  };
}
