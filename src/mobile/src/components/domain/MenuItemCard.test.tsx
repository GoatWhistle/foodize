import { fireEvent, render, screen } from "@testing-library/react-native";
import { MenuItemCard } from "@/components/domain/MenuItemCard";
import type { MenuItem } from "@shared/types/models";

const baseItem: MenuItem = {
  id: "m1",
  name: "Cheeseburger",
  price: 350,
  category: "BURGER",
  restaurant_id: "r1",
  is_available: true,
  prep_time_minutes: 10,
  option_groups: [],
};

describe("MenuItemCard", () => {
  it("renders name, category label and price", () => {
    render(<MenuItemCard item={baseItem} testID="mi" />);
    expect(screen.getByText("Cheeseburger")).toBeTruthy();
    expect(screen.getByText("Бургеры")).toBeTruthy();
    expect(screen.getByText("350 ₽")).toBeTruthy();
  });

  it("calls onSelect when available", () => {
    const onSelect = jest.fn();
    render(<MenuItemCard item={baseItem} testID="mi" onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId("mi"));
    expect(onSelect).toHaveBeenCalledWith(baseItem);
  });

  it("does not call onSelect when unavailable", () => {
    const onSelect = jest.fn();
    render(<MenuItemCard item={{ ...baseItem, is_available: false }} testID="mi" onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId("mi"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not call onSelect when the restaurant is closed", () => {
    const onSelect = jest.fn();
    render(<MenuItemCard item={baseItem} testID="mi" isRestaurantOpen={false} onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId("mi"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders a photo when photo_url is present", () => {
    render(<MenuItemCard item={{ ...baseItem, photo_url: "http://x/b.jpg" }} testID="mi" />);
    expect(screen.getByText("Cheeseburger")).toBeTruthy();
  });
});
