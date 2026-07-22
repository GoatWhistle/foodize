import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RestaurantCard } from "@shared/components/RestaurantCard/RestaurantCard";
import type { Restaurant } from "@shared/types/models";
import { t } from "@shared/i18n/useTranslation";

const baseRestaurant = (over: Partial<Restaurant> = {}): Restaurant =>
  ({
    id: "r1",
    name: "Пиццерия",
    address: "ул. Ленина, 1",
    photo_url: null,
    is_open: true,
    average_rating: 4.5,
    ...over,
  }) as Restaurant;

class IO {
  cb: (entries: unknown[]) => void;
  constructor(cb: (entries: unknown[]) => void) {
    this.cb = cb;
  }
  observe() {
    this.cb([{ isIntersecting: true }]);
  }
  unobserve() {}
  disconnect() {}
}

describe("RestaurantCard", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", IO);
  });

  it("renders name, address and rating", () => {
    render(<RestaurantCard restaurant={baseRestaurant()} />);
    expect(screen.getByText("Пиццерия")).toBeInTheDocument();
    expect(screen.getByText("ул. Ленина, 1")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText(t("catalog.restaurantCard.open"))).toBeInTheDocument();
  });

  it("shows a placeholder when there is no photo and 0.0 rating when missing", () => {
    render(
      <RestaurantCard
        restaurant={baseRestaurant({ average_rating: null, is_open: false } as unknown as Partial<Restaurant>)}
      />,
    );
    expect(
      screen.getByTestId("restaurant-photo-placeholder"),
    ).toBeInTheDocument();
    expect(screen.getByText("0.0")).toBeInTheDocument();
    expect(screen.getByText(t("catalog.restaurantCard.closed"))).toBeInTheDocument();
  });

  it("renders a photo with a view transition name when a photo url is present", () => {
    render(
      <RestaurantCard
        restaurant={baseRestaurant({ photo_url: "http://img/p.jpg" })}
      />,
    );
    const img = screen.getByRole("img", { name: "Пиццерия" });
    expect(img).toHaveAttribute("src", "http://img/p.jpg");
  });

  it("fires onClick on click and on keyboard activation", () => {
    const onClick = vi.fn();
    render(<RestaurantCard restaurant={baseRestaurant()} onClick={onClick} />);
    const card = screen.getByRole("button", { name: t("catalog.restaurantCard.ariaLabel", { name: "Пиццерия" }) });
    fireEvent.click(card);
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("toggles favorite without triggering the card click", () => {
    const onClick = vi.fn();
    const onFavoriteToggle = vi.fn();
    render(
      <RestaurantCard
        restaurant={baseRestaurant()}
        onClick={onClick}
        isFavorite={false}
        onFavoriteToggle={onFavoriteToggle}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: t("catalog.restaurantCard.addToFavorites") }));
    expect(onFavoriteToggle).toHaveBeenCalledWith("r1");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders an active favorite label and bottom position", () => {
    render(
      <RestaurantCard
        restaurant={baseRestaurant()}
        isFavorite={true}
        onFavoriteToggle={vi.fn()}
        favPosition="bottom"
        viewTransition={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: t("catalog.restaurantCard.removeFromFavorites") }),
    ).toBeInTheDocument();
  });

  it("omits the address tag when address is empty", () => {
    render(
      <RestaurantCard
        restaurant={baseRestaurant({ address: "" })}
      />,
    );
    expect(screen.queryByText("ул. Ленина, 1")).not.toBeInTheDocument();
  });
});
