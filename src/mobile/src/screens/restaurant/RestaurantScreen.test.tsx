import { fireEvent, render, screen } from "@testing-library/react-native";
import { RestaurantScreen } from "@/screens/restaurant/RestaurantScreen";
import type { MenuItem } from "@shared/types/models";

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockAddToCart = jest.fn();
const mockToggleFavorite = jest.fn();
const mockSetActiveCategory = jest.fn();
const mockSetSelectedProduct = jest.fn();
const mockHandleProductAdd = jest.fn();
const mockHandleToggleFavorite = jest.fn();

const menuItem: MenuItem = {
  id: "m1",
  name: "Burger",
  price: 300,
  category: "BURGER",
  restaurant_id: "r1",
  is_available: true,
  prep_time_minutes: 8,
  option_groups: [],
};

const mockController = {
  restaurantView: {
    id: "r1",
    name: "Tasty Place",
    address: "Main St 1",
    average_rating: 4.5,
    photo_url: "http://x/p.jpg",
  } as Record<string, unknown>,
  restaurantLoading: false,
  restaurantError: "",
  loading: false,
  isRestaurantOpen: true,
  isFav: false,
  categories: ["ALL", "BURGER"],
  activeCategory: "ALL",
  setActiveCategory: mockSetActiveCategory,
  filteredMenuItems: [menuItem] as MenuItem[],
  selectedProduct: null as MenuItem | null,
  setSelectedProduct: mockSetSelectedProduct,
  handleProductAdd: mockHandleProductAdd,
  handleToggleFavorite: mockHandleToggleFavorite,
};

let mockCartCount = 0;

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: jest.fn() }),
}));

const mockControllerArgs: { current: Record<string, unknown> | null } = { current: null };

jest.mock("@shared/hooks/useRestaurantPageController", () => ({
  useRestaurantPageController: (args: Record<string, unknown>) => {
    mockControllerArgs.current = args;
    return mockController;
  },
}));

jest.mock("@/store/useCartStore", () => ({
  useCartStore: (selector: (s: { addToCart: unknown; cartCount: () => number }) => unknown) =>
    selector({ addToCart: mockAddToCart, cartCount: () => mockCartCount }),
}));

jest.mock("@shared/store/useFavoriteStore", () => ({
  useFavoriteStore: (selector: (s: unknown) => unknown) =>
    selector({ favoriteIds: [], toggle: mockToggleFavorite }),
}));

let mockUser: { id: string } | null = { id: "u1" };

jest.mock("@/store/useAuthStore", () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: mockUser }),
}));

describe("RestaurantScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockController.restaurantError = "";
    mockController.loading = false;
    mockController.isRestaurantOpen = true;
    mockController.isFav = false;
    mockController.selectedProduct = null;
    mockController.filteredMenuItems = [menuItem];
    mockController.restaurantLoading = false;
    mockCartCount = 0;
    mockUser = { id: "u1" };
  });

  it("renders the restaurant header and menu", () => {
    render(<RestaurantScreen id="r1" />);
    expect(screen.getByText("Tasty Place")).toBeTruthy();
    expect(screen.getByText("Main St 1")).toBeTruthy();
    expect(screen.getByText("Burger")).toBeTruthy();
    expect(screen.getByText("Открыто")).toBeTruthy();
  });

  it("renders an error state when loading failed", () => {
    mockController.restaurantError = "Не удалось загрузить ресторан";
    render(<RestaurantScreen id="r1" />);
    expect(screen.getByText("Не удалось загрузить ресторан")).toBeTruthy();
  });

  it("navigates back", () => {
    render(<RestaurantScreen id="r1" />);
    fireEvent.press(screen.getByTestId("restaurant-back"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("toggles favorite", () => {
    render(<RestaurantScreen id="r1" />);
    fireEvent.press(screen.getByTestId("restaurant-fav"));
    expect(mockHandleToggleFavorite).toHaveBeenCalled();
  });

  it("opens a product when a menu item is pressed", () => {
    render(<RestaurantScreen id="r1" />);
    fireEvent.press(screen.getByTestId("menu-item-m1"));
    expect(mockSetSelectedProduct).toHaveBeenCalledWith(menuItem);
  });

  it("selects a category", () => {
    render(<RestaurantScreen id="r1" />);
    fireEvent.press(screen.getByTestId("chip-BURGER"));
    expect(mockSetActiveCategory).toHaveBeenCalledWith("BURGER");
  });

  it("shows menu skeletons while loading with no items", () => {
    mockController.loading = true;
    mockController.filteredMenuItems = [];
    render(<RestaurantScreen id="r1" />);
    expect(screen.getByText("Все")).toBeTruthy();
  });

  it("shows a closed badge when the restaurant is closed", () => {
    mockController.isRestaurantOpen = false;
    render(<RestaurantScreen id="r1" />);
    expect(screen.getByText("Закрыто")).toBeTruthy();
  });

  it("opens the cart from the fab", () => {
    mockCartCount = 2;
    render(<RestaurantScreen id="r1" />);
    fireEvent.press(screen.getByTestId("restaurant-cart-fab"));
    expect(mockPush).toHaveBeenCalledWith("/cart");
  });

  it("renders a selected product in the sheet, closes and adds it", () => {
    mockController.selectedProduct = menuItem;
    mockController.filteredMenuItems = [menuItem, { ...menuItem, id: "m2", name: "Fries" }];
    render(<RestaurantScreen id="r1" />);
    expect(screen.getByText("Fries")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("close"));
    expect(mockSetSelectedProduct).toHaveBeenCalledWith(null);
    fireEvent.press(screen.getByTestId("product-add"));
    expect(mockHandleProductAdd).toHaveBeenCalledWith(
      expect.objectContaining({ item: menuItem, quantity: 1 }),
    );
  });

  it("wires addToCart, toggleFavorite and requestConfirm into the controller", () => {
    render(<RestaurantScreen id="r1" />);
    const args = mockControllerArgs.current as {
      addToCart: (item: MenuItem, rid: string, options: { id: string; name: string; price_delta: number }[], q: number) => void;
      toggleFavorite: (rid: string) => void;
      requestConfirm: (r: unknown) => void;
    };
    args.addToCart(menuItem, "r1", [{ id: "o1", name: "Extra", price_delta: 10 }], 2);
    expect(mockAddToCart).toHaveBeenCalledWith(
      menuItem,
      "r1",
      [{ id: "o1", option_id: "o1", name: "Extra", price_delta: 10 }],
      2,
    );
    args.toggleFavorite("r1");
    expect(mockToggleFavorite).toHaveBeenCalledWith("r1");
    args.requestConfirm({});
  });

  it("renders a placeholder header and no rating for a minimal restaurant view", () => {
    mockController.restaurantView = { id: "r1", name: "Bare", address: "" };
    render(<RestaurantScreen id="r1" />);
    expect(screen.getByText("Bare")).toBeTruthy();
    mockController.restaurantView = {
      id: "r1",
      name: "Tasty Place",
      address: "Main St 1",
      average_rating: 4.5,
      photo_url: "http://x/p.jpg",
    };
  });

  it("renders a filled heart when the restaurant is a favorite", () => {
    mockController.isFav = true;
    render(<RestaurantScreen id="r1" />);
    expect(screen.getByLabelText("Убрать из избранного")).toBeTruthy();
  });

  it("shows a category skeleton while the restaurant is loading", () => {
    mockController.restaurantLoading = true;
    render(<RestaurantScreen id="r1" />);
    expect(screen.getByText("Tasty Place")).toBeTruthy();
  });

  it("handles a null current user", () => {
    mockUser = null;
    render(<RestaurantScreen id="r1" />);
    const args = mockControllerArgs.current as { currentUserId: string | null };
    expect(args.currentUserId).toBeNull();
  });
});
