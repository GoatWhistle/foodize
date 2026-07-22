import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FavoritesPage } from "@shared/pages/FavoritesPage/FavoritesPage";
import { useFavoritesPage } from "@shared/hooks/useFavoritesPage";
import type { Favorite } from "@shared/types/models";
import { t } from "@shared/i18n/useTranslation";

vi.mock("@shared/hooks/useFavoritesPage", () => ({
  useFavoritesPage: vi.fn(),
}));

const mockedHook = vi.mocked(useFavoritesPage);

const makeFavorite = (id: string, name: string): Favorite => ({
  id,
  created_at: "2026-01-15T12:30:00Z",
  restaurant: { id: `rest-${id}`, name, address: "адрес", is_open: true, is_hiring: false },
});

const hookState = (over: Partial<ReturnType<typeof useFavoritesPage>> = {}) => ({
  favorites: [],
  loading: false,
  total: 0,
  page: 1,
  setPage: vi.fn(),
  handleUnfavorite: vi.fn(),
  handleNavigate: vi.fn(),
  ...over,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <FavoritesPage />
    </MemoryRouter>,
  );

describe("FavoritesPage", () => {
  beforeEach(() => {
    mockedHook.mockReset();
  });

  it("shows a spinner while loading with no favorites", () => {
    mockedHook.mockReturnValue(hookState({ loading: true }));
    const { container } = renderPage();
    expect(container.querySelector(".spinner")).toBeInTheDocument();
  });

  it("shows the empty state when there are no favorites", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage();
    expect(screen.getByText(t("catalog.favorites.emptyTitle"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("catalog.favorites.browse") })).toBeInTheDocument();
  });

  it("renders the favorites list and the total badge", () => {
    mockedHook.mockReturnValue(
      hookState({
        favorites: [makeFavorite("1", "Пиццерия"), makeFavorite("2", "Суши")],
        total: 2,
      }),
    );
    renderPage();
    expect(screen.getByText("Пиццерия")).toBeInTheDocument();
    expect(screen.getByText("Суши")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("navigates when a favorite card is clicked", async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    mockedHook.mockReturnValue(
      hookState({ favorites: [makeFavorite("1", "Пиццерия")], total: 1, handleNavigate }),
    );
    renderPage();
    await user.click(screen.getByRole("button", { name: /Пиццерия/ }));
    expect(handleNavigate).toHaveBeenCalled();
  });

  it("unfavorites a restaurant from the card", async () => {
    const user = userEvent.setup();
    const handleUnfavorite = vi.fn();
    mockedHook.mockReturnValue(
      hookState({ favorites: [makeFavorite("1", "Пиццерия")], total: 1, handleUnfavorite }),
    );
    renderPage();
    await user.click(screen.getByRole("button", { name: t("catalog.restaurantCard.removeFromFavorites") }));
    expect(handleUnfavorite).toHaveBeenCalledWith("rest-1");
  });

  it("navigates home from the empty-state action", async () => {
    const user = userEvent.setup();
    mockedHook.mockReturnValue(hookState());
    renderPage();
    await user.click(screen.getByRole("button", { name: t("catalog.favorites.browse") }));
  });

  it("wires the Telegram BackButton and cleans up on unmount", () => {
    mockedHook.mockReturnValue(hookState());
    const handlers: (() => void)[] = [];
    const BackButton = {
      show: vi.fn(),
      hide: vi.fn(),
      onClick: vi.fn((h: () => void) => handlers.push(h)),
      offClick: vi.fn(),
    };
    const { unmount } = render(
      <MemoryRouter>
        <FavoritesPage BackButton={BackButton} />
      </MemoryRouter>,
    );
    expect(BackButton.show).toHaveBeenCalled();
    expect(BackButton.onClick).toHaveBeenCalled();
    handlers[0]?.();
    unmount();
    expect(BackButton.offClick).toHaveBeenCalled();
    expect(BackButton.hide).toHaveBeenCalled();
  });

  it("dims the list while refetching with existing favorites", () => {
    mockedHook.mockReturnValue(
      hookState({
        favorites: [makeFavorite("1", "Пиццерия")],
        total: 1,
        loading: true,
      }),
    );
    const { container } = renderPage();
    expect(container.querySelector(".loading-dim")).toBeInTheDocument();
  });
});
