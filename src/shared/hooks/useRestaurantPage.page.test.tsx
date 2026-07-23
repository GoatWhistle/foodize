import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchMenu,
  getById,
  getWorkingHours,
  getRating,
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

describe("useRestaurantPage page and menu", () => {
  beforeEach(resetRestaurantPageMocks);

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
    await waitFor(() => { expect(result.current.restaurantError).toBe(t("apiErrors.byDetail.Restaurant not found")); });
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
});
