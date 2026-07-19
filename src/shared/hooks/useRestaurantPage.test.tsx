import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMenu = vi.fn();
const getById = vi.fn();
const getWorkingHours = vi.fn();
const getRating = vi.fn();
const getReviews = vi.fn();
const createReview = vi.fn();
const updateMyReview = vi.fn();
const deleteReview = vi.fn();

let storeState: {
  fetchMenu: typeof fetchMenu;
  menus: Record<string, Array<Record<string, unknown>>>;
  menuLoading: boolean;
};

vi.mock("zustand/react/shallow", () => ({
  useShallow: (fn: unknown) => fn,
}));

vi.mock("@shared/store/useRestaurantStore", () => ({
  useRestaurantStore: vi.fn((sel?: (s: unknown) => unknown) =>
    sel ? sel(storeState) : storeState,
  ),
}));

vi.mock("@shared/services/restaurantService", () => ({
  restaurantService: {
    getById: (...a: unknown[]) => getById(...a) as unknown,
    getWorkingHours: (...a: unknown[]) => getWorkingHours(...a) as unknown,
  },
}));

vi.mock("@shared/services/reviewService", () => ({
  reviewService: {
    getRating: (...a: unknown[]) => getRating(...a) as unknown,
    getReviews: (...a: unknown[]) => getReviews(...a) as unknown,
    createReview: (...a: unknown[]) => createReview(...a) as unknown,
    updateMyReview: (...a: unknown[]) => updateMyReview(...a) as unknown,
    deleteReview: (...a: unknown[]) => deleteReview(...a) as unknown,
  },
}));

import { useRestaurantPage } from "@shared/hooks/useRestaurantPage";
import type { Restaurant } from "@shared/types/models";

const RESTAURANT = {
  id: "uuid-1",
  name: "Cafe",
  address: "Street",
  is_open: true,
} as unknown as Restaurant;

const MENU = [
  { id: "m1", category: "Main", is_available: true },
  { id: "m2", category: "Drinks", is_available: true },
  { id: "m3", category: "Main", is_available: false },
];

const ratingResponse = { data: { data: { average_rating: 4.5, review_count: 3 } } };
const reviewsResponse = {
  data: { data: [{ id: "rev1", user_id: "u1" }], pagination: { total: 1 } },
};
const workingHoursResponse = {
  data: { data: [{ day_of_week: 1, open_time: "09:00", close_time: "18:00", is_closed: false }] },
};

describe("useRestaurantPage", () => {
  beforeEach(() => {
    fetchMenu.mockReset().mockResolvedValue(undefined);
    getById.mockReset();
    getWorkingHours.mockReset().mockResolvedValue(workingHoursResponse);
    getRating.mockReset().mockResolvedValue(ratingResponse);
    getReviews.mockReset().mockResolvedValue(reviewsResponse);
    createReview.mockReset().mockResolvedValue({});
    updateMyReview.mockReset().mockResolvedValue({});
    deleteReview.mockReset().mockResolvedValue({});
    storeState = {
      fetchMenu,
      menus: { "uuid-1": MENU },
      menuLoading: false,
    };
  });

  it("fetches the restaurant by id when no initial restaurant", async () => {
    getById.mockResolvedValue({ data: { data: RESTAURANT } });
    const { result } = renderHook(() => useRestaurantPage({ id: "display-1" }));
    expect(result.current.restaurantLoading).toBe(true);
    await waitFor(() => { expect(result.current.restaurantLoading).toBe(false); });
    expect(getById).toHaveBeenCalledWith("display-1");
    expect(result.current.restaurantUUID).toBe("uuid-1");
  });

  it("skips fetching when an initial restaurant is provided", async () => {
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    expect(result.current.restaurantLoading).toBe(false);
    expect(getById).not.toHaveBeenCalled();
    await waitFor(() => { expect(getRating).toHaveBeenCalledWith("uuid-1"); });
  });

  it("loads rating, reviews, working hours and menu categories", async () => {
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() => { expect(result.current.rating).toBe(4.5); });
    expect(result.current.reviewCount).toBe(3);
    await waitFor(() => { expect(result.current.reviewsList).toHaveLength(1); });
    expect(result.current.categories).toEqual(["ALL", "Main", "Drinks"]);
    expect(result.current.filteredMenuItems).toHaveLength(2);
    expect(fetchMenu).toHaveBeenCalledWith("uuid-1");
    await waitFor(() => { expect(result.current.workingHours).toHaveLength(1); });
  });

  it("filters menu items by the active category", async () => {
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() => { expect(result.current.filteredMenuItems).toHaveLength(2); });
    act(() => {
      result.current.setActiveCategory("Drinks");
    });
    expect(result.current.filteredMenuItems.map((i) => i.id)).toEqual(["m2"]);
  });

  it("sets a restaurant error when loading fails", async () => {
    getById.mockRejectedValue({ response: { status: 404, data: { detail: "Restaurant not found" } } });
    const { result } = renderHook(() => useRestaurantPage({ id: "display-1" }));
    await waitFor(() => { expect(result.current.restaurantError).toBe("Ресторан не найден"); });
  });

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
    expect(result.current.reviewError).toBe("Вы уже оставили отзыв на этот ресторан");
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
    expect(result.current.reviewError).toBe("Не удалось удалить отзыв");
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
      { expect(result.current.reviewError).toBe("Не удалось загрузить отзывы"); },
    );
  });

  it("swallows rating and working-hours errors", async () => {
    getRating.mockRejectedValue(new Error("r"));
    getWorkingHours.mockRejectedValue(new Error("wh"));
    const { result } = renderHook(() =>
      useRestaurantPage({ id: "display-1", initialRestaurant: RESTAURANT }),
    );
    await waitFor(() => { expect(getRating).toHaveBeenCalled(); });
    expect(result.current.rating).toBeNull();
    expect(result.current.workingHours).toEqual([]);
  });

  it("loadReviews and refreshRating are no-ops without a target", async () => {
    storeState.menus = {};
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
