import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getById,
  getRating,
  getReviews,
  createReview,
  updateMyReview,
  deleteReview,
  store,
  RESTAURANT,
  resetRestaurantPageMocks,
} from "./useRestaurantPageTestMocks";
import { useRestaurantPage } from "@shared/hooks/useRestaurantPage";
import { t } from "@shared/i18n/useTranslation";

vi.mock("zustand/react/shallow", () => ({
  useShallow: (fn: unknown) => fn,
}));
vi.mock("@shared/store/useRestaurantStore", async () => {
  const { store } = await import("./useRestaurantPageTestMocks");
  return {
    useRestaurantStore: vi.fn((sel?: (s: unknown) => unknown) =>
      sel ? sel(store.state) : store.state,
    ),
  };
});
vi.mock("@shared/services/restaurantService", async () => {
  const m = await import("./useRestaurantPageTestMocks");
  return {
    restaurantService: {
      getById: (...a: unknown[]) => m.getById(...a) as unknown,
      getWorkingHours: (...a: unknown[]) => m.getWorkingHours(...a) as unknown,
    },
  };
});
vi.mock("@shared/services/reviewService", async () => {
  const m = await import("./useRestaurantPageTestMocks");
  return {
    reviewService: {
      getRating: (...a: unknown[]) => m.getRating(...a) as unknown,
      getReviews: (...a: unknown[]) => m.getReviews(...a) as unknown,
      createReview: (...a: unknown[]) => m.createReview(...a) as unknown,
      updateMyReview: (...a: unknown[]) => m.updateMyReview(...a) as unknown,
      deleteReview: (...a: unknown[]) => m.deleteReview(...a) as unknown,
    },
  };
});

describe("useRestaurantPage reviews", () => {
  beforeEach(resetRestaurantPageMocks);

  it("submits a new review and reloads", async () => {
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() => { expect(result.current.reviewsList).toHaveLength(1); });
    getReviews.mockClear();
    getRating.mockClear();
    await act(async () => {
      await result.current.handleReviewSubmit();
    });
    expect(createReview).toHaveBeenCalled();
    expect(result.current.reviewSuccess).toBe(true);
    expect(getReviews).toHaveBeenCalled();
    expect(getRating).toHaveBeenCalled();
  });

  it("updates an existing review when myReview is true", async () => {
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() => { expect(result.current.reviewsList).toHaveLength(1); });
    await act(async () => {
      await result.current.handleReviewSubmit({ myReview: true });
    });
    expect(updateMyReview).toHaveBeenCalled();
    expect(createReview).not.toHaveBeenCalled();
  });

  it("surfaces a review submit error", async () => {
    createReview.mockRejectedValue({ response: { status: 409, data: { detail: "You have already reviewed this restaurant" } } });
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() => { expect(result.current.reviewsList).toHaveLength(1); });
    await act(async () => {
      await result.current.handleReviewSubmit();
    });
    expect(result.current.reviewError).toBe(t("apiErrors.byDetail.You have already reviewed this restaurant"));
  });

  it("deletes a review and prunes the list", async () => {
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() => { expect(result.current.reviewsList).toHaveLength(1); });
    await act(async () => {
      await result.current.handleReviewDelete("rev1");
    });
    expect(deleteReview).toHaveBeenCalledWith("uuid-1", "rev1");
    expect(result.current.reviewsList).toHaveLength(0);
  });

  it("surfaces a delete error", async () => {
    deleteReview.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() => { expect(result.current.reviewsList).toHaveLength(1); });
    await act(async () => {
      await result.current.handleReviewDelete("rev1");
    });
    expect(result.current.reviewError).toBe(t("catalog.reviews.deleteFailed"));
  });

  it("calls onSuccess after a successful submit", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() => { expect(result.current.reviewsList).toHaveLength(1); });
    await act(async () => {
      await result.current.handleReviewSubmit({ onSuccess });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("tolerates non-array review payloads and a missing total", async () => {
    getReviews.mockResolvedValue({ data: { data: null, pagination: {} } });
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() => { expect(getReviews).toHaveBeenCalled(); });
    expect(result.current.reviewsList).toEqual([]);
    expect(result.current.reviewsTotal).toBe(0);
  });

  it("surfaces a reviews load error", async () => {
    getReviews.mockRejectedValue(new Error("net"));
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() =>
      { expect(result.current.reviewError).toBe(t("catalog.reviews.loadFailed")); },
    );
  });

  it("loadReviews and refreshRating are no-ops without a target", async () => {
    store.state.menus = {};
    getById.mockResolvedValue({ data: { data: null } });
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: null }),
    );
    await waitFor(() => { expect(result.current.restaurantLoading).toBe(false); });
    getReviews.mockClear();
    getRating.mockClear();
    act(() => {
      result.current.loadReviews(null);
      result.current.refreshRating(null);
    });
    expect(getReviews).not.toHaveBeenCalled();
    expect(getRating).not.toHaveBeenCalled();
  });

  it("submits a review using the display id when there is no UUID", async () => {
    getById.mockResolvedValue({ data: { data: null } });
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-9", initialRestaurant: null }),
    );
    await waitFor(() => { expect(result.current.restaurantLoading).toBe(false); });
    await act(async () => {
      await result.current.handleReviewSubmit();
    });
    expect(createReview).toHaveBeenCalledWith("display-9", expect.any(Object));
  });

  it("accepts explicit rids for loadReviews and refreshRating", async () => {
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() => { expect(result.current.reviewsList).toHaveLength(1); });
    getReviews.mockClear();
    getRating.mockClear();
    act(() => {
      result.current.loadReviews("other-id");
      result.current.refreshRating("other-id");
    });
    await waitFor(() => { expect(getReviews).toHaveBeenCalledWith("other-id", expect.any(Object)); });
    expect(getRating).toHaveBeenCalledWith("other-id");
  });
});
