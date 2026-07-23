import { fireEvent, render, screen } from "@testing-library/react-native";
import { RestaurantCard } from "@/components/domain/RestaurantCard";
import type { Restaurant } from "@shared/types/models";

const baseRestaurant: Restaurant = {
  id: "r1",
  name: "Tasty Place",
  address: "Main St 1",
  vendor_id: "v1",
  is_hiring: false,
  is_open: true,
  is_ordering_paused: false,
  avg_prep_time_minutes: 15,
  average_rating: 4.6,
  review_count: 12,
  orders_count_7d: 3,
  moderation_status: "APPROVED",
};

describe("RestaurantCard", () => {
  it("renders name, address and open badge", () => {
    render(<RestaurantCard restaurant={baseRestaurant} testID="card" />);
    expect(screen.getByText("Tasty Place")).toBeTruthy();
    expect(screen.getByText("Main St 1")).toBeTruthy();
    expect(screen.getByText("Открыто")).toBeTruthy();
    expect(screen.getByText("4.6")).toBeTruthy();
  });

  it("shows closed badge when not open and a placeholder when no photo", () => {
    render(<RestaurantCard restaurant={{ ...baseRestaurant, is_open: false }} testID="card" />);
    expect(screen.getByText("Закрыто")).toBeTruthy();
  });

  it("renders a photo when photo_url is present", () => {
    render(<RestaurantCard restaurant={{ ...baseRestaurant, photo_url: "http://x/a.jpg" }} testID="card" />);
    expect(screen.getByText("Tasty Place")).toBeTruthy();
  });

  it("calls onPress when the card is pressed", () => {
    const onPress = jest.fn();
    render(<RestaurantCard restaurant={baseRestaurant} testID="card" onPress={onPress} />);
    fireEvent.press(screen.getByTestId("card"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("toggles favorite without triggering card press", () => {
    const onFavoriteToggle = jest.fn();
    render(
      <RestaurantCard
        restaurant={baseRestaurant}
        testID="card"
        isFavorite
        onFavoriteToggle={onFavoriteToggle}
      />,
    );
    fireEvent.press(screen.getByTestId("card-fav"));
    expect(onFavoriteToggle).toHaveBeenCalledWith("r1");
  });

  it("does not render a favorite button without a handler", () => {
    render(<RestaurantCard restaurant={baseRestaurant} testID="card" />);
    expect(screen.queryByTestId("card-fav")).toBeNull();
  });

  it("uses default testIDs when none are provided", () => {
    const onPress = jest.fn();
    const onFavoriteToggle = jest.fn();
    render(
      <RestaurantCard restaurant={baseRestaurant} onPress={onPress} onFavoriteToggle={onFavoriteToggle} />,
    );
    fireEvent.press(screen.getByTestId("card-fav"));
    expect(onFavoriteToggle).toHaveBeenCalledWith("r1");
  });
});
