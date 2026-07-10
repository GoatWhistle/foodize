import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { useFavoriteStore } from "@shared/store/useFavoriteStore";
import { favoriteService } from "@shared/services/favoriteService";

vi.mock("@shared/services/favoriteService", () => ({
  favoriteService: {
    getAll: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  },
}));

const favoriteServiceMock = favoriteService as unknown as {
  getAll: Mock;
  add: Mock;
  remove: Mock;
};

describe("useFavoriteStore", () => {
  beforeEach(() => {
    useFavoriteStore.setState({
      favoriteIds: [],
      loaded: false,
    });
    vi.clearAllMocks();
  });

  it("should load favorites successfully", async () => {
    favoriteServiceMock.getAll.mockResolvedValueOnce({
      data: {
        data: [
          { restaurant: { id: "rest-1" } },
          { restaurant: { id: "rest-2" } },
        ],
      },
    });

    await useFavoriteStore.getState().loadFavorites();

    const state = useFavoriteStore.getState();
    expect(state.loaded).toBe(true);
    expect(state.favoriteIds.includes("rest-1")).toBe(true);
    expect(state.favoriteIds.includes("rest-2")).toBe(true);
    expect(state.favoriteIds.length).toBe(2);
  });

  it("should handle load favorites error", async () => {
    favoriteServiceMock.getAll.mockRejectedValueOnce(new Error("Failed"));

    await useFavoriteStore.getState().loadFavorites();

    const state = useFavoriteStore.getState();
    expect(state.loaded).toBe(true);
    expect(state.favoriteIds.length).toBe(0);
  });

  it("should toggle favorite from true to false", async () => {
    useFavoriteStore.setState({
      favoriteIds: ["rest-1"],
      loaded: true,
    });
    favoriteServiceMock.remove.mockResolvedValueOnce({});

    await useFavoriteStore.getState().toggle("rest-1");

    const state = useFavoriteStore.getState();
    expect(state.favoriteIds.includes("rest-1")).toBe(false);
    expect(favoriteServiceMock.remove).toHaveBeenCalledWith("rest-1");
  });

  it("should revert toggle from true to false on error", async () => {
    useFavoriteStore.setState({
      favoriteIds: ["rest-1"],
      loaded: true,
    });
    favoriteServiceMock.remove.mockRejectedValueOnce(new Error("Failed"));

    await useFavoriteStore.getState().toggle("rest-1");

    const state = useFavoriteStore.getState();
    expect(state.favoriteIds.includes("rest-1")).toBe(true);
  });

  it("should toggle favorite from false to true", async () => {
    useFavoriteStore.setState({
      favoriteIds: [],
      loaded: true,
    });
    favoriteServiceMock.add.mockResolvedValueOnce({});

    await useFavoriteStore.getState().toggle("rest-1");

    const state = useFavoriteStore.getState();
    expect(state.favoriteIds.includes("rest-1")).toBe(true);
    expect(favoriteServiceMock.add).toHaveBeenCalledWith("rest-1");
  });

  it("should revert toggle from false to true on error", async () => {
    useFavoriteStore.setState({
      favoriteIds: [],
      loaded: true,
    });
    favoriteServiceMock.add.mockRejectedValueOnce(new Error("Failed"));

    await useFavoriteStore.getState().toggle("rest-1");

    const state = useFavoriteStore.getState();
    expect(state.favoriteIds.includes("rest-1")).toBe(false);
  });
});
