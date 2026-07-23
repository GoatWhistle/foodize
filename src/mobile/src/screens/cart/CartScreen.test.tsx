import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { CartScreen } from "@/screens/cart/CartScreen";
import type { CartLine } from "@shared/utils/cartLine";

const mockReplace = jest.fn();
const mockAddToCart = jest.fn();
const mockRemoveFromCart = jest.fn();
const mockClearCart = jest.fn();
const mockPlaceOrder = jest.fn<Promise<{ id: string } | undefined>, []>();

const line: CartLine = {
  menuItem: { id: "m1", name: "Pizza", price: 500, image_url: null },
  quantity: 2,
  selectedOptionIds: ["o1"],
  selectedOptions: [{ id: "o1", option_id: "o1", name: "Cheese", price_delta: 50 }],
  lineKey: "m1:o1",
};

const mockCartState = {
  cart: [line] as CartLine[],
  cartRestaurantId: "r1" as string | null,
  addToCart: mockAddToCart,
  removeFromCart: mockRemoveFromCart,
  clearCart: mockClearCart,
  placeOrder: mockPlaceOrder,
  orderPlacing: false,
  cartTotal: () => 1100,
  cartCount: () => 2,
};

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));

jest.mock("@/store/useCartStore", () => ({
  useCartStore: (selector: (s: typeof mockCartState) => unknown) => selector(mockCartState),
}));

describe("CartScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCartState.cart = [line];
    mockCartState.cartRestaurantId = "r1";
    mockCartState.orderPlacing = false;
    mockPlaceOrder.mockResolvedValue({ id: "ord1" });
  });

  it("shows an empty state when the cart is empty", () => {
    mockCartState.cart = [];
    render(<CartScreen />);
    fireEvent.press(screen.getByText("Выбрать заведение"));
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
  });

  it("renders lines and the total", () => {
    render(<CartScreen />);
    expect(screen.getByText("Pizza")).toBeTruthy();
    expect(screen.getAllByText("1100 ₽").length).toBeGreaterThan(0);
  });

  it("increases a line by re-adding it", () => {
    render(<CartScreen />);
    fireEvent.press(screen.getByTestId("cart-inc-m1"));
    expect(mockAddToCart).toHaveBeenCalledWith(line.menuItem, "r1", line.selectedOptions, 1);
  });

  it("decreases a line", () => {
    render(<CartScreen />);
    fireEvent.press(screen.getByTestId("cart-dec-m1"));
    expect(mockRemoveFromCart).toHaveBeenCalledWith("m1", ["o1"]);
  });

  it("clears the cart", () => {
    render(<CartScreen />);
    fireEvent.press(screen.getByTestId("cart-clear"));
    expect(mockClearCart).toHaveBeenCalled();
  });

  it("places an order and navigates to the order screen", async () => {
    render(<CartScreen />);
    fireEvent.press(screen.getByTestId("cart-checkout"));
    await waitFor(() => {
      expect(mockPlaceOrder).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({ pathname: "/order/[id]", params: { id: "ord1" } });
    });
  });

  it("does not navigate when placeOrder returns nothing", async () => {
    mockPlaceOrder.mockResolvedValueOnce(undefined);
    render(<CartScreen />);
    fireEvent.press(screen.getByTestId("cart-checkout"));
    await waitFor(() => {
      expect(mockPlaceOrder).toHaveBeenCalled();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows an error when checkout fails", async () => {
    mockPlaceOrder.mockRejectedValueOnce({ response: { status: 400 } });
    render(<CartScreen />);
    fireEvent.press(screen.getByTestId("cart-checkout"));
    await waitFor(() => {
      expect(screen.getByTestId("cart-error")).toBeTruthy();
    });
  });

  it("does not increase when there is no restaurant id", () => {
    mockCartState.cartRestaurantId = null;
    render(<CartScreen />);
    fireEvent.press(screen.getByTestId("cart-inc-m1"));
    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  it("marks the checkout button busy while an order is being placed", () => {
    mockCartState.orderPlacing = true;
    render(<CartScreen />);
    const button = screen.getByTestId("cart-checkout") as unknown as {
      props: { accessibilityState: { busy: boolean } };
    };
    expect(button.props.accessibilityState.busy).toBe(true);
  });
});
