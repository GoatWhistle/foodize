import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const getAll = vi.fn();
const toggle = vi.fn();
const navigate = vi.fn();

vi.mock("@shared/services/favoriteService", () => ({
  favoriteService: { getAll: (...a: unknown[]) => getAll(...a) as unknown },
}));

vi.mock("@shared/store/useFavoriteStore", () => ({
  useFavoriteStore: vi.fn((sel?: (s: unknown) => unknown) => {
    const state = { toggle };
    return sel ? sel(state) : state;
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

import { useFavoritesPage } from "@shared/hooks/useFavoritesPage";

const makeResponse = (list: unknown[], total: number) => ({
  data: { data: list, pagination: { total } },
});

describe("useFavoritesPage", () => {
  beforeEach(() => {
    getAll.mockReset();
    toggle.mockReset();
    navigate.mockReset();
  });

  it("loads favorites on mount and exposes total", async () => {
    getAll.mockResolvedValue(
      makeResponse([{ restaurant: { id: "r1", display_id: 10 } }], 1),
    );
    const { result } = renderHook(() => useFavoritesPage());
    expect(result.current.loading).toBe(true);
    await waitFor(() => { expect(result.current.loading).toBe(false); });
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(getAll).toHaveBeenCalledWith({ page: 1, size: 100 });
  });

  it("treats a non-array body as empty list", async () => {
    getAll.mockResolvedValue({ data: { data: null, pagination: { total: 0 } } });
    const { result } = renderHook(() => useFavoritesPage());
    await waitFor(() => { expect(result.current.loading).toBe(false); });
    expect(result.current.favorites).toEqual([]);
  });

  it("stops loading when the request fails", async () => {
    getAll.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useFavoritesPage());
    await waitFor(() => { expect(result.current.loading).toBe(false); });
    expect(result.current.favorites).toEqual([]);
  });

  it("handleUnfavorite toggles the store and prunes the list", async () => {
    getAll.mockResolvedValue(
      makeResponse(
        [
          { restaurant: { id: "r1", display_id: 10 } },
          { restaurant: { id: "r2", display_id: 20 } },
        ],
        2,
      ),
    );
    toggle.mockResolvedValue(undefined);
    const { result } = renderHook(() => useFavoritesPage());
    await waitFor(() => { expect(result.current.favorites).toHaveLength(2); });

    await act(async () => {
      await result.current.handleUnfavorite("r1");
    });

    expect(toggle).toHaveBeenCalledWith("r1");
    expect(result.current.favorites.map((f) => f.restaurant.id)).toEqual(["r2"]);
    expect(result.current.total).toBe(1);
  });

  it("handleNavigate uses the default path and passes restaurant state", async () => {
    getAll.mockResolvedValue(makeResponse([], 0));
    const { result } = renderHook(() => useFavoritesPage());
    await waitFor(() => { expect(result.current.loading).toBe(false); });

    act(() => {
      result.current.handleNavigate({ id: "r9", display_id: "42" });
    });
    expect(navigate).toHaveBeenCalledWith("/restaurant/42", {
      state: { restaurant: { id: "r9", display_id: "42" } },
    });
  });

  it("respects a custom navigateTo builder", async () => {
    getAll.mockResolvedValue(makeResponse([], 0));
    const navigateTo = vi.fn(
      (r: { id: string; display_id?: string | null }) => `/x/${r.display_id ?? ""}`,
    );
    const { result } = renderHook(() => useFavoritesPage({ navigateTo }));
    await waitFor(() => { expect(result.current.loading).toBe(false); });

    act(() => {
      result.current.handleNavigate({ id: "r9", display_id: "7" });
    });
    expect(navigateTo).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/x/7", expect.anything());
  });
});
