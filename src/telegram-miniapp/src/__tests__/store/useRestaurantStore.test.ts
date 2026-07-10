import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { useRestaurantStore } from "@shared/store/useRestaurantStore";
import { restaurantService } from "@shared/services/restaurantService";
import { menuService } from "@shared/services/menuService";

vi.mock("@shared/services/restaurantService", () => ({
  restaurantService: {
    getAll: vi.fn(),
  },
}));

vi.mock("@shared/services/menuService", () => ({
  menuService: {
    getMenu: vi.fn(),
  },
}));

const restaurantServiceMock = restaurantService as unknown as {
  getAll: Mock;
};

const menuServiceMock = menuService as unknown as {
  getMenu: Mock;
};

describe("useRestaurantStore", () => {
  beforeEach(() => {
    useRestaurantStore.setState({
      publicRestaurants: [],
      publicRestaurantsTotal: 0,
      menus: {},
      loading: false,
    });
    vi.clearAllMocks();
  });

  it("should fetch public restaurants successfully", async () => {
    restaurantServiceMock.getAll.mockResolvedValueOnce({
      data: {
        data: [{ id: "r1", name: "Restaurant 1" }],
        pagination: { total: 10 },
      },
    });

    await useRestaurantStore.getState().fetchPublicRestaurants({ page: 1 });

    const state = useRestaurantStore.getState();
    expect(state.loading).toBe(false);
    expect(state.publicRestaurants).toEqual([
      { id: "r1", name: "Restaurant 1" },
    ]);
    expect(state.publicRestaurantsTotal).toBe(10);
  });

  it("should handle error in fetch public restaurants", async () => {
    restaurantServiceMock.getAll.mockRejectedValueOnce(new Error("Network Error"));

    await useRestaurantStore.getState().fetchPublicRestaurants();

    const state = useRestaurantStore.getState();
    expect(state.loading).toBe(false);
    expect(state.publicRestaurants).toEqual([]);
    expect(state.publicRestaurantsTotal).toBe(0);
  });

  it("should fetch and cache menu successfully", async () => {
    menuServiceMock.getMenu.mockResolvedValueOnce({
      data: {
        data: [{ id: "m1", name: "Item 1" }],
      },
    });

    await useRestaurantStore.getState().fetchMenu("r1");

    let state = useRestaurantStore.getState();
    expect(state.loading).toBe(false);
    expect(state.menus["r1"]).toEqual([{ id: "m1", name: "Item 1" }]);

    await useRestaurantStore.getState().fetchMenu("r1");
    expect(menuServiceMock.getMenu).toHaveBeenCalledTimes(1);

    menuServiceMock.getMenu.mockResolvedValueOnce({
      data: {
        data: [
          { id: "m1", name: "Item 1" },
          { id: "m2", name: "Item 2" },
        ],
      },
    });
    await useRestaurantStore.getState().fetchMenu("r1", { force: true });
    state = useRestaurantStore.getState();
    expect(state.menus["r1"].length).toBe(2);
    expect(menuServiceMock.getMenu).toHaveBeenCalledTimes(2);
  });

  it("should handle error in fetchMenu", async () => {
    menuServiceMock.getMenu.mockRejectedValueOnce(new Error("Failed"));

    await useRestaurantStore.getState().fetchMenu("r2");

    const state = useRestaurantStore.getState();
    expect(state.loading).toBe(false);
    expect(state.menus["r2"]).toBeUndefined();
  });
});
