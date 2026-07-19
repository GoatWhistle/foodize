import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FavoriteRestaurantCard } from "@shared/components/FavoriteRestaurantCard/FavoriteRestaurantCard";
import type { Favorite } from "@shared/types/models";

const makeFavorite = (over: Partial<Favorite["restaurant"]> = {}): Favorite => ({
  id: "fav-1",
  created_at: "2026-01-15T12:30:00Z",
  restaurant: {
    id: "rest-1",
    name: "Бургерная",
    address: "ул. Ленина, 5",
    is_open: true,
    is_hiring: false,
    ...over,
  },
});

describe("FavoriteRestaurantCard", () => {
  it("renders name, address and open status", () => {
    render(
      <FavoriteRestaurantCard favorite={makeFavorite()} onNavigate={vi.fn()} onUnfavorite={vi.fn()} />,
    );
    expect(screen.getByText("Бургерная")).toBeInTheDocument();
    expect(screen.getByText("ул. Ленина, 5")).toBeInTheDocument();
    expect(screen.getByText("Открыто")).toBeInTheDocument();
  });

  it("renders the closed status", () => {
    render(
      <FavoriteRestaurantCard
        favorite={makeFavorite({ is_open: false })}
        onNavigate={vi.fn()}
        onUnfavorite={vi.fn()}
      />,
    );
    expect(screen.getByText("Закрыто")).toBeInTheDocument();
  });

  it("renders a hiring badge when the restaurant is hiring", () => {
    render(
      <FavoriteRestaurantCard
        favorite={makeFavorite({ is_hiring: true })}
        onNavigate={vi.fn()}
        onUnfavorite={vi.fn()}
      />,
    );
    expect(screen.getByText("Вакансии")).toBeInTheDocument();
  });

  it("calls onNavigate when the card is clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <FavoriteRestaurantCard favorite={makeFavorite()} onNavigate={onNavigate} onUnfavorite={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: /Бургерная/ }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: "rest-1" }));
  });

  it("calls onUnfavorite without navigating when the heart button is clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onUnfavorite = vi.fn();
    render(
      <FavoriteRestaurantCard
        favorite={makeFavorite()}
        onNavigate={onNavigate}
        onUnfavorite={onUnfavorite}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Убрать из избранного" }));
    expect(onUnfavorite).toHaveBeenCalledWith("rest-1");
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
