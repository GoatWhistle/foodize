import { describe, it, expect } from "vitest";
import { splitReviewsByAuthor } from "@shared/utils/reviews";
import type { Review } from "@shared/types/models";

const makeReview = (id: string, userId: string): Review =>
  ({ id, user_id: userId }) as Review;

describe("splitReviewsByAuthor", () => {
  it("separates the current user's review from others", () => {
    const reviews = [
      makeReview("r1", "u1"),
      makeReview("r2", "u2"),
      makeReview("r3", "u3"),
    ];
    const result = splitReviewsByAuthor(reviews, "u2");
    expect(result.myReview?.id).toBe("r2");
    expect(result.otherReviews.map((r) => r.id)).toEqual(["r1", "r3"]);
  });

  it("returns null myReview when user has no review", () => {
    const reviews = [makeReview("r1", "u1")];
    const result = splitReviewsByAuthor(reviews, "u9");
    expect(result.myReview).toBeNull();
    expect(result.otherReviews).toHaveLength(1);
  });

  it("returns null myReview for null currentUserId", () => {
    const reviews = [makeReview("r1", "u1")];
    const result = splitReviewsByAuthor(reviews, null);
    expect(result.myReview).toBeNull();
    expect(result.otherReviews).toHaveLength(1);
  });

  it("returns null myReview for undefined currentUserId", () => {
    const reviews = [makeReview("r1", "u1")];
    const result = splitReviewsByAuthor(reviews, undefined);
    expect(result.myReview).toBeNull();
    expect(result.otherReviews).toHaveLength(1);
  });

  it("handles empty reviews", () => {
    const result = splitReviewsByAuthor([], "u1");
    expect(result.myReview).toBeNull();
    expect(result.otherReviews).toEqual([]);
  });

  it("picks the first matching review when multiple match", () => {
    const reviews = [makeReview("r1", "u1"), makeReview("r2", "u1")];
    const result = splitReviewsByAuthor(reviews, "u1");
    expect(result.myReview?.id).toBe("r1");
    expect(result.otherReviews).toEqual([]);
  });
});
