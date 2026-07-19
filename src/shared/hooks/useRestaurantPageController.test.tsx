import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const useRestaurantPage = vi.fn();
const handleReviewSubmit = vi.fn();
const handleReviewDelete = vi.fn();
const setSelectedProduct = vi.fn();

vi.mock("@shared/hooks/useRestaurantPage", () => ({
  useRestaurantPage: (...a: unknown[]) => useRestaurantPage(...a) as unknown,
}));

import { useRestaurantPageController } from "@shared/hooks/useRestaurantPageController";

const basePage = (overrides: Record<string, unknown> = {}) => ({
  restaurant: { id: "uuid-1", name: "Cafe", address: "Street" },
  restaurantUUID: "uuid-1",
  reviewsList: [
    { id: "rev1", user_id: "me", rating: 5, text: "mine" },
    { id: "rev2", user_id: "other", rating: 4, text: "theirs" },
  ],
  workingHours: [
    { day_of_week: 1, open_time: "09:00", close_time: "18:00", is_closed: false },
  ],
  rating: 4.25,
  reviewCount: 2,
  isRestaurantOpen: true,
  handleReviewSubmit,
  handleReviewDelete,
  setSelectedProduct,
  ...overrides,
});

const baseArgs = (overrides: Record<string, unknown> = {}) => ({
  id: "display-1",
  initialRestaurant: null,
  currentUserId: "me",
  addToCart: vi.fn(),
  toggleFavorite: vi.fn(),
  favoriteIds: [] as string[],
  requestConfirm: vi.fn(),
  ...overrides,
});

describe("useRestaurantPageController", () => {
  beforeEach(() => {
    useRestaurantPage.mockReset();
    handleReviewSubmit.mockReset();
    handleReviewDelete.mockReset();
    setSelectedProduct.mockReset();
  });

  it("splits reviews by the current user", () => {
    useRestaurantPage.mockReturnValue(basePage());
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs()),
    );
    expect(result.current.myReview?.id).toBe("rev1");
    expect(result.current.otherReviews.map((r) => r.id)).toEqual(["rev2"]);
  });

  it("maps working hours to info shape", () => {
    useRestaurantPage.mockReturnValue(basePage());
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs()),
    );
    expect(result.current.infoWorkingHours).toEqual([
      { day_of_week: 1, is_open: true, opening_time: "09:00", closing_time: "18:00" },
    ]);
  });

  it("builds the reviews label with pluralization", () => {
    useRestaurantPage.mockReturnValue(basePage({ reviewCount: 2, rating: 4.25 }));
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs()),
    );
    expect(result.current.reviewsButtonLabel).toBe("4.3 · 2 отзыва");
  });

  it("falls back to 'Отзывы' when count is null", () => {
    useRestaurantPage.mockReturnValue(basePage({ reviewCount: null, rating: null }));
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs()),
    );
    expect(result.current.reviewsButtonLabel).toBe("Отзывы");
  });

  it("marks favorite based on the target restaurant id", () => {
    useRestaurantPage.mockReturnValue(basePage());
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs({ favoriteIds: ["uuid-1"] })),
    );
    expect(result.current.isFav).toBe(true);
  });

  it("handleProductAdd adds to cart and clears the selection", () => {
    useRestaurantPage.mockReturnValue(basePage());
    const addToCart = vi.fn();
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs({ addToCart })),
    );
    const item = { id: "m1" } as never;
    act(() => {
      result.current.handleProductAdd({ item, selectedOptions: [], quantity: 2 });
    });
    expect(addToCart).toHaveBeenCalledWith(item, "uuid-1", [], 2);
    expect(setSelectedProduct).toHaveBeenCalledWith(null);
  });

  it("handleProductAdd is a no-op when the restaurant is closed", () => {
    useRestaurantPage.mockReturnValue(basePage({ isRestaurantOpen: false }));
    const addToCart = vi.fn();
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs({ addToCart })),
    );
    act(() => {
      result.current.handleProductAdd({
        item: { id: "m1" } as never,
        selectedOptions: [],
        quantity: 1,
      });
    });
    expect(addToCart).not.toHaveBeenCalled();
  });

  it("handleProductAdd falls back to the display id when there is no UUID", () => {
    useRestaurantPage.mockReturnValue(basePage({ restaurantUUID: null }));
    const addToCart = vi.fn();
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs({ addToCart, id: "display-1" })),
    );
    const item = { id: "m1" } as never;
    act(() => {
      result.current.handleProductAdd({ item, selectedOptions: [], quantity: 1 });
    });
    expect(addToCart).toHaveBeenCalledWith(item, "display-1", [], 1);
  });

  it("handleProductAdd is a no-op when neither UUID nor id is present", () => {
    useRestaurantPage.mockReturnValue(basePage({ restaurantUUID: null }));
    const addToCart = vi.fn();
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs({ addToCart, id: "" })),
    );
    act(() => {
      result.current.handleProductAdd({
        item: { id: "m1" } as never,
        selectedOptions: [],
        quantity: 1,
      });
    });
    expect(addToCart).not.toHaveBeenCalled();
  });

  it("handleToggleFavorite does nothing without a UUID", () => {
    useRestaurantPage.mockReturnValue(basePage({ restaurantUUID: null }));
    const toggleFavorite = vi.fn();
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs({ toggleFavorite })),
    );
    act(() => {
      result.current.handleToggleFavorite();
    });
    expect(toggleFavorite).not.toHaveBeenCalled();
  });

  it("handleToggleFavorite uses the restaurant UUID", () => {
    useRestaurantPage.mockReturnValue(basePage());
    const toggleFavorite = vi.fn();
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs({ toggleFavorite })),
    );
    act(() => {
      result.current.handleToggleFavorite();
    });
    expect(toggleFavorite).toHaveBeenCalledWith("uuid-1");
  });

  it("handleReviewSubmitForm forwards the myReview object variant", () => {
    useRestaurantPage.mockReturnValue(basePage());
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs()),
    );
    const onSuccess = vi.fn();
    act(() => {
      result.current.handleReviewSubmitForm({ myReview: true, onSuccess });
    });
    expect(handleReviewSubmit).toHaveBeenCalledWith({ myReview: true, onSuccess });
  });

  it("handleReviewSubmitForm prevents default for form events", () => {
    useRestaurantPage.mockReturnValue(basePage());
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs()),
    );
    const preventDefault = vi.fn();
    act(() => {
      result.current.handleReviewSubmitForm({ preventDefault } as never);
    });
    expect(preventDefault).toHaveBeenCalled();
    expect(handleReviewSubmit).toHaveBeenCalledWith();
  });

  it("handleDeleteWithConfirm requests confirmation then deletes", () => {
    useRestaurantPage.mockReturnValue(basePage());
    const requestConfirm = vi.fn();
    const { result } = renderHook(() =>
      useRestaurantPageController(baseArgs({ requestConfirm })),
    );
    act(() => {
      result.current.handleDeleteWithConfirm("rev2");
    });
    expect(requestConfirm).toHaveBeenCalledTimes(1);
    const request = requestConfirm.mock.calls[0]?.[0] as
      | { danger?: boolean; onConfirm: () => void }
      | undefined;
    expect(request?.danger).toBe(true);
    act(() => {
      request?.onConfirm();
    });
    expect(handleReviewDelete).toHaveBeenCalledWith("rev2");
  });
});
