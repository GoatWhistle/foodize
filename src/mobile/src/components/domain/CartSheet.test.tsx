import { fireEvent, render, screen } from "@testing-library/react-native";
import { CartSheet } from "@/components/domain/CartSheet";
import type { CartLine } from "@shared/utils/cartLine";

const line: CartLine = {
  menuItem: { id: "m1", name: "Pizza", price: 500, image_url: null },
  quantity: 2,
  selectedOptionIds: ["o1"],
  selectedOptions: [{ id: "o1", option_id: "o1", name: "Extra cheese", price_delta: 50 }],
  lineKey: "m1:o1",
};

describe("CartSheet", () => {
  it("renders line name, options summary and line total", () => {
    render(<CartSheet cart={[line]} onIncrease={jest.fn()} onDecrease={jest.fn()} testID="cart" />);
    expect(screen.getByText("Pizza")).toBeTruthy();
    expect(screen.getByText("Extra cheese +50 ₽")).toBeTruthy();
    expect(screen.getByText("1100 ₽")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("calls onIncrease and onDecrease", () => {
    const onIncrease = jest.fn();
    const onDecrease = jest.fn();
    render(<CartSheet cart={[line]} onIncrease={onIncrease} onDecrease={onDecrease} testID="cart" />);
    fireEvent.press(screen.getByTestId("cart-inc-m1"));
    fireEvent.press(screen.getByTestId("cart-dec-m1"));
    expect(onIncrease).toHaveBeenCalledWith(line);
    expect(onDecrease).toHaveBeenCalledWith(line);
  });

  it("renders an image placeholder or image and lines without options", () => {
    const noOptions: CartLine = {
      menuItem: { id: "m2", name: "Cola", price: 100, image_url: "http://x/c.jpg" },
      quantity: 1,
      selectedOptionIds: [],
      selectedOptions: [],
      lineKey: "m2:",
    };
    render(<CartSheet cart={[noOptions]} onIncrease={jest.fn()} onDecrease={jest.fn()} testID="cart" />);
    expect(screen.getByText("Cola")).toBeTruthy();
    expect(screen.getByTestId("cart-line-m2")).toBeTruthy();
  });
});
