import { describe, it, expect } from "vitest";
import * as components from "@shared/components/index";

describe("components barrel", () => {
  it("re-exports every public component", () => {
    const expected = [
      "RestaurantCard",
      "MenuItemCard",
      "OrderButton",
      "EmptyState",
      "ErrorBoundary",
      "Pagination",
      "LegalPage",
      "ProductSheet",
      "CartDrawer",
      "OrderStatusBadge",
      "ConfirmDialog",
      "ThemeSwitcher",
      "FavoriteRestaurantCard",
      "OrderCard",
      "SearchFilterBar",
      "InfoModal",
      "StarRatingInput",
      "ReviewCard",
      "ReviewsModal",
    ];
    for (const name of expected) {
      expect(components[name as keyof typeof components]).toBeTruthy();
    }
  });
});
