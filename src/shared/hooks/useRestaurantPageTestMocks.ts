import { vi } from "vitest";
import type { Restaurant } from "@shared/types/models";

export const fetchMenu = vi.fn();
export const getById = vi.fn();
export const getWorkingHours = vi.fn();
export const getRating = vi.fn();
export const getReviews = vi.fn();
export const createReview = vi.fn();
export const updateMyReview = vi.fn();
export const deleteReview = vi.fn();

interface StoreState {
  fetchMenu: typeof fetchMenu;
  menus: Record<string, Array<Record<string, unknown>>>;
  menuLoading: boolean;
}

export const store = { state: undefined as unknown as StoreState };

export const RESTAURANT = {
  id: "uuid-1",
  name: "Cafe",
  address: "Street",
  is_open: true,
} as unknown as Restaurant;

export const MENU = [
  { id: "m1", category: "Main", is_available: true },
  { id: "m2", category: "Drinks", is_available: true },
  { id: "m3", category: "Main", is_available: false },
];

export const ratingResponse = { data: { data: { average_rating: 4.5, review_count: 3 } } };
export const reviewsResponse = {
  data: { data: [{ id: "rev1", user_id: "u1" }], pagination: { total: 1 } },
};
export const workingHoursResponse = {
  data: { data: [{ day_of_week: 1, open_time: "09:00", close_time: "18:00", is_closed: false }] },
};

export const resetRestaurantPageMocks = (): void => {
  fetchMenu.mockReset().mockResolvedValue(undefined);
  getById.mockReset();
  getWorkingHours.mockReset().mockResolvedValue(workingHoursResponse);
  getRating.mockReset().mockResolvedValue(ratingResponse);
  getReviews.mockReset().mockResolvedValue(reviewsResponse);
  createReview.mockReset().mockResolvedValue({});
  updateMyReview.mockReset().mockResolvedValue({});
  deleteReview.mockReset().mockResolvedValue({});
  store.state = {
    fetchMenu,
    menus: { "uuid-1": MENU },
    menuLoading: false,
  };
};
