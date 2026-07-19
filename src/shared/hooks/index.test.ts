import { describe, it, expect } from "vitest";
import * as hooks from "@shared/hooks/index";

describe("hooks barrel", () => {
  it("re-exports every public hook", () => {
    const expected = [
      "useEtaText",
      "useOrderWebSocket",
      "useDebounce",
      "useFavoritesPage",
      "useProfilePage",
      "useHomePageLogic",
      "useRestaurantPage",
      "useFocusTrap",
    ];
    for (const name of expected) {
      expect(hooks[name as keyof typeof hooks]).toBeTypeOf("function");
    }
  });
});
