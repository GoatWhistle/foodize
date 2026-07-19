import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Restaurant, MenuItem } from "@shared/types/models";

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getMy: vi.fn(),
  create: vi.fn(),
  getMenu: vi.fn(),
  addItem: vi.fn(),
}));

vi.mock("@shared/services/restaurantService", () => ({
  restaurantService: { getAll: mocks.getAll, getMy: mocks.getMy, create: mocks.create },
}));

vi.mock("@shared/services/menuService", () => ({
  menuService: { getMenu: mocks.getMenu, addItem: mocks.addItem },
}));

vi.mock("@shared/utils/translateApiError", () => ({
  translateApiError: () => "Ошибка",
}));

import { useRestaurantStore } from "./useRestaurantStore";

const rest = (id: string): Restaurant => ({ id, name: `R${id}` } as unknown as Restaurant);
const item = (id: string): MenuItem => ({ id, name: `I${id}` } as unknown as MenuItem);

const reset = () =>
  { useRestaurantStore.setState({
    publicRestaurants: [],
    publicRestaurantsTotal: 0,
    restaurants: [],
    menus: {},
    currentRestaurant: null,
    publicLoading: false,
    myLoading: false,
    menuLoading: false,
    error: null,
  }); };

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  reset();
});

describe("useRestaurantStore", () => {
  it("fetchPublicRestaurants loads and caches results", async () => {
    mocks.getAll.mockResolvedValue({ data: { data: [rest("1")], pagination: { total: 1 } } });
    const key = { q: `pub-${Date.now()}` };
    await useRestaurantStore.getState().fetchPublicRestaurants(key);
    expect(useRestaurantStore.getState().publicRestaurants).toHaveLength(1);
    expect(useRestaurantStore.getState().publicRestaurantsTotal).toBe(1);

    reset();
    await useRestaurantStore.getState().fetchPublicRestaurants(key);
    expect(mocks.getAll).toHaveBeenCalledTimes(1);
    expect(useRestaurantStore.getState().publicRestaurants).toHaveLength(1);
  });

  it("fetchPublicRestaurants sets error on failure", async () => {
    mocks.getAll.mockRejectedValue(new Error("net"));
    await useRestaurantStore.getState().fetchPublicRestaurants({ q: `err-${Date.now()}` });
    expect(useRestaurantStore.getState().error).toBe("Ошибка");
    expect(useRestaurantStore.getState().publicLoading).toBe(false);
  });

  it("fetchMyRestaurants stores the list", async () => {
    mocks.getMy.mockResolvedValue({ data: { data: [rest("2"), rest("3")] } });
    await useRestaurantStore.getState().fetchMyRestaurants();
    expect(useRestaurantStore.getState().restaurants).toHaveLength(2);
  });

  it("fetchMyRestaurants sets error on failure", async () => {
    mocks.getMy.mockRejectedValue(new Error("net"));
    await useRestaurantStore.getState().fetchMyRestaurants();
    expect(useRestaurantStore.getState().error).toBe("Ошибка");
  });

  it("fetchMenu loads a menu and caches it", async () => {
    mocks.getMenu.mockResolvedValue({ data: { data: [item("1")] } });
    await useRestaurantStore.getState().fetchMenu("r1");
    expect(useRestaurantStore.getState().menus["r1"]).toHaveLength(1);
    await useRestaurantStore.getState().fetchMenu("r1");
    expect(mocks.getMenu).toHaveBeenCalledTimes(1);
  });

  it("fetchMenu refetches when forced", async () => {
    mocks.getMenu.mockResolvedValue({ data: { data: [item("1")] } });
    await useRestaurantStore.getState().fetchMenu("r2");
    await useRestaurantStore.getState().fetchMenu("r2", { force: true });
    expect(mocks.getMenu).toHaveBeenCalledTimes(2);
  });

  it("fetchMenu sets error on failure", async () => {
    mocks.getMenu.mockRejectedValue(new Error("net"));
    await useRestaurantStore.getState().fetchMenu("r3");
    expect(useRestaurantStore.getState().error).toBe("Ошибка");
  });

  it("setCurrentRestaurant updates state", () => {
    useRestaurantStore.getState().setCurrentRestaurant(rest("9"));
    expect(useRestaurantStore.getState().currentRestaurant?.id).toBe("9");
  });

  it("createRestaurant appends the created restaurant", async () => {
    mocks.create.mockResolvedValue({ data: { data: rest("5") } });
    const result = await useRestaurantStore.getState().createRestaurant({} as never);
    expect(result.id).toBe("5");
    expect(useRestaurantStore.getState().restaurants.at(-1)?.id).toBe("5");
  });

  it("createRestaurant sets error and rethrows on failure", async () => {
    mocks.create.mockRejectedValue(new Error("net"));
    await expect(useRestaurantStore.getState().createRestaurant({} as never)).rejects.toThrow();
    expect(useRestaurantStore.getState().error).toBe("Ошибка");
  });

  it("addMenuItem appends to the restaurant menu", async () => {
    mocks.addItem.mockResolvedValue({ data: { data: item("7") } });
    const result = await useRestaurantStore.getState().addMenuItem("r4", {} as never);
    expect(result.id).toBe("7");
    expect(useRestaurantStore.getState().menus["r4"]).toHaveLength(1);
  });

  it("addMenuItem sets error and rethrows on failure", async () => {
    mocks.addItem.mockRejectedValue(new Error("net"));
    await expect(useRestaurantStore.getState().addMenuItem("r5", {} as never)).rejects.toThrow();
    expect(useRestaurantStore.getState().error).toBe("Ошибка");
  });

  it("fetchPublicRestaurants falls back to list length when total is missing", async () => {
    mocks.getAll.mockResolvedValue({
      data: { data: [rest("1"), rest("2")], pagination: { total: 0 } },
    });
    await useRestaurantStore
      .getState()
      .fetchPublicRestaurants({ q: `len-${Date.now()}` });
    expect(useRestaurantStore.getState().publicRestaurantsTotal).toBe(2);
  });

  it("fetchPublicRestaurants tolerates a non-array payload", async () => {
    mocks.getAll.mockResolvedValue({
      data: { data: null, pagination: { total: 0 } },
    });
    await useRestaurantStore
      .getState()
      .fetchPublicRestaurants({ q: `na-${Date.now()}` });
    expect(useRestaurantStore.getState().publicRestaurants).toEqual([]);
  });

  it("fetchMyRestaurants and fetchMenu tolerate non-array payloads", async () => {
    mocks.getMy.mockResolvedValue({ data: { data: null } });
    mocks.getMenu.mockResolvedValue({ data: { data: null } });
    await useRestaurantStore.getState().fetchMyRestaurants();
    await useRestaurantStore.getState().fetchMenu("rNA");
    expect(useRestaurantStore.getState().restaurants).toEqual([]);
    expect(useRestaurantStore.getState().menus["rNA"]).toEqual([]);
  });

  it("addMenuItem appends to an already-populated menu", async () => {
    useRestaurantStore.setState({ menus: { r8: [item("existing")] } });
    mocks.addItem.mockResolvedValue({ data: { data: item("new") } });
    await useRestaurantStore.getState().addMenuItem("r8", {} as never);
    expect(useRestaurantStore.getState().menus["r8"]).toHaveLength(2);
  });
});
