import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RestaurantHero } from "../../pages/restaurant/RestaurantHero";
import type { Restaurant } from "@shared/types/models";

const hapticImpact = vi.fn();
vi.mock("../../telegram/sdk", () => ({
  hapticImpact: (style?: string): void => {
    hapticImpact(style);
  },
}));

const makeRestaurant = (o: Partial<Restaurant> = {}): Restaurant =>
  ({
    id: "r1",
    display_id: "1",
    name: "Тестовое Заведение",
    address: "ул. Пушкина, 1",
    photo_url: "https://example.com/photo.jpg",
    is_open: true,
    ...o,
  }) as unknown as Restaurant;

const baseProps = {
  restaurant: makeRestaurant(),
  rating: 4.5 as number | null,
  isFav: false,
  onToggleFav: vi.fn(),
  onShowReviews: vi.fn(),
  onShowInfo: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RestaurantHero", () => {
  it("renders the name, address, rating and hero image", () => {
    render(<RestaurantHero {...baseProps} onToggleFav={vi.fn()} />);
    expect(screen.getByText("Тестовое Заведение")).toBeInTheDocument();
    expect(screen.getByText("ул. Пушкина, 1")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    const img = screen.getByAltText("Тестовое Заведение");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toContain("photo.jpg");
  });

  it("hides the rating pill when rating is null", () => {
    render(<RestaurantHero {...baseProps} rating={null} onToggleFav={vi.fn()} />);
    expect(screen.queryByText("4.5")).not.toBeInTheDocument();
    expect(screen.getByText("Отзывы")).toBeInTheDocument();
  });

  it("renders a placeholder when there is no photo", () => {
    render(
      <RestaurantHero
        {...baseProps}
        restaurant={makeRestaurant({ photo_url: null })}
        onToggleFav={vi.fn()}
      />,
    );
    expect(screen.queryByAltText("Тестовое Заведение")).not.toBeInTheDocument();
    expect(screen.getByText("Тестовое Заведение")).toBeInTheDocument();
  });

  it("fires haptic and callback when Отзывы is clicked", async () => {
    const onShowReviews = vi.fn();
    render(<RestaurantHero {...baseProps} onShowReviews={onShowReviews} onToggleFav={vi.fn()} />);
    await userEvent.click(screen.getByText("Отзывы"));
    expect(hapticImpact).toHaveBeenCalledWith("light");
    expect(onShowReviews).toHaveBeenCalledTimes(1);
  });

  it("fires haptic and callback when Инфо is clicked", async () => {
    const onShowInfo = vi.fn();
    render(<RestaurantHero {...baseProps} onShowInfo={onShowInfo} onToggleFav={vi.fn()} />);
    await userEvent.click(screen.getByText("Инфо"));
    expect(hapticImpact).toHaveBeenCalledWith("light");
    expect(onShowInfo).toHaveBeenCalledTimes(1);
  });

  it("toggles favorite with the right aria-label per state", async () => {
    const onToggleFav = vi.fn();
    const { rerender } = render(
      <RestaurantHero {...baseProps} isFav={false} onToggleFav={onToggleFav} />,
    );
    const addBtn = screen.getByLabelText("В избранное");
    await userEvent.click(addBtn);
    expect(onToggleFav).toHaveBeenCalledTimes(1);

    rerender(<RestaurantHero {...baseProps} isFav onToggleFav={onToggleFav} />);
    expect(screen.getByLabelText("Убрать из избранного")).toBeInTheDocument();
  });
});
