import { describe, it, expect, vi, beforeEach } from "vitest";

const favoriteService = {
  getAll: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
};

vi.mock("@shared/services/favoriteService", () => ({
  favoriteService: {
    getAll: (...a: unknown[]) => favoriteService.getAll(...a) as unknown,
    add: (...a: unknown[]) => favoriteService.add(...a) as unknown,
    remove: (...a: unknown[]) => favoriteService.remove(...a) as unknown,
  },
}));

vi.mock("@shared/utils/logError", () => ({ logError: vi.fn() }));

import { useFavoriteStore } from "@shared/store/useFavoriteStore";

describe("useFavoriteStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFavoriteStore.setState({ favoriteIds: [], loaded: false });
  });

  it("loadFavorites maps restaurant ids and marks loaded", async () => {
    favoriteService.getAll.mockResolvedValue({
      data: { data: [{ restaurant: { id: "r1" } }, { restaurant: { id: "r2" } }] },
    });
    await useFavoriteStore.getState().loadFavorites();
    expect(useFavoriteStore.getState().favoriteIds).toEqual(["r1", "r2"]);
    expect(useFavoriteStore.getState().loaded).toBe(true);
  });

  it("loadFavorites tolerates a non-array payload", async () => {
    favoriteService.getAll.mockResolvedValue({ data: { data: null } });
    await useFavoriteStore.getState().loadFavorites();
    expect(useFavoriteStore.getState().favoriteIds).toEqual([]);
    expect(useFavoriteStore.getState().loaded).toBe(true);
  });

  it("loadFavorites still marks loaded on error", async () => {
    favoriteService.getAll.mockRejectedValue(new Error("down"));
    await useFavoriteStore.getState().loadFavorites();
    expect(useFavoriteStore.getState().loaded).toBe(true);
  });

  it("toggle adds a restaurant optimistically", async () => {
    favoriteService.add.mockResolvedValue({});
    await useFavoriteStore.getState().toggle("r1");
    expect(useFavoriteStore.getState().favoriteIds).toEqual(["r1"]);
    expect(favoriteService.add).toHaveBeenCalledWith("r1");
  });

  it("toggle rolls back an add on error", async () => {
    favoriteService.add.mockRejectedValue(new Error("boom"));
    await useFavoriteStore.getState().toggle("r1");
    expect(useFavoriteStore.getState().favoriteIds).toEqual([]);
  });

  it("toggle removes a restaurant optimistically", async () => {
    useFavoriteStore.setState({ favoriteIds: ["r1"], loaded: true });
    favoriteService.remove.mockResolvedValue({});
    await useFavoriteStore.getState().toggle("r1");
    expect(useFavoriteStore.getState().favoriteIds).toEqual([]);
    expect(favoriteService.remove).toHaveBeenCalledWith("r1");
  });

  it("toggle rolls back a remove on error", async () => {
    useFavoriteStore.setState({ favoriteIds: ["r1"], loaded: true });
    favoriteService.remove.mockRejectedValue(new Error("boom"));
    await useFavoriteStore.getState().toggle("r1");
    expect(useFavoriteStore.getState().favoriteIds).toEqual(["r1"]);
  });
});
