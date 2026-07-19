import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: "42" }),
    useLocation: () => ({ state: null, pathname: "/restaurant/42", key: "k" }),
  };
});

interface CartState {
  addToCart: () => void;
  cartCount: () => number;
  cartTotal: () => number;
}
let cartState: CartState;
vi.mock("../../store/useCartStore", () => ({
  useCartStore: (sel: (s: CartState) => unknown) => sel(cartState),
}));

vi.mock("@shared/store/useFavoriteStore", () => ({
  useFavoriteStore: (sel: (s: { favoriteIds: string[]; toggle: () => void }) => unknown) =>
    sel({ favoriteIds: [], toggle: vi.fn() }),
}));

vi.mock("@shared/store/useModalStore", () => ({
  useModalStore: (sel: (s: { requestConfirm: () => void }) => unknown) =>
    sel({ requestConfirm: vi.fn() }),
}));

vi.mock("../../store/useAuthStore", () => ({
  useAuthStore: (sel: (s: { user: { id: string } | null }) => unknown) =>
    sel({ user: { id: "u1" } }),
}));

const backButton = {
  show: vi.fn(),
  hide: vi.fn(),
  onClick: vi.fn(),
  offClick: vi.fn(),
};
const hapticImpact = vi.fn();
vi.mock("../../telegram/sdk", () => ({
  getBackButton: () => backButton,
  hapticImpact: (s?: string): void => {
    hapticImpact(s);
  },
}));

let controllerState: Record<string, unknown>;
vi.mock("@shared/hooks/useRestaurantPageController", () => ({
  useRestaurantPageController: () => controllerState,
}));

vi.mock("../../pages/restaurant/RestaurantHero", () => ({
  RestaurantHero: (props: { onShowReviews: () => void; onShowInfo: () => void }) => (
    <div data-testid="hero">
      <button onClick={props.onShowReviews}>open-reviews</button>
      <button onClick={props.onShowInfo}>open-info</button>
    </div>
  ),
}));

vi.mock("../../pages/restaurant/MenuSection", () => ({
  MenuSection: () => <div data-testid="menu" />,
}));

vi.mock("@shared/components/CartDrawer/CartDrawer", () => ({
  CartDrawer: (props: { onClose: () => void }) => (
    <div data-testid="cart-drawer">
      <button onClick={props.onClose}>close-cart</button>
    </div>
  ),
}));

vi.mock("@shared/components/ProductSheet/ProductSheet", () => ({
  ProductSheet: (props: { onClose: () => void }) => (
    <div data-testid="product-sheet">
      <button onClick={props.onClose}>close-product</button>
    </div>
  ),
}));

vi.mock("@shared/components/ReviewsModal/ReviewsModal", () => ({
  ReviewsModal: (props: { onClose: () => void }) => (
    <div data-testid="reviews-modal">
      <button onClick={props.onClose}>close-reviews</button>
    </div>
  ),
}));

vi.mock("@shared/components/InfoModal/InfoModal", () => ({
  InfoModal: (props: { onClose: () => void }) => (
    <div data-testid="info-modal">
      <button onClick={props.onClose}>close-info</button>
    </div>
  ),
}));

import { RestaurantPage } from "../../pages/restaurant/RestaurantPage";

const makeController = (o: Record<string, unknown> = {}): Record<string, unknown> => ({
  restaurantView: { id: "42", name: "Кафе" },
  rating: 4.2,
  loading: false,
  isRestaurantOpen: true,
  categories: ["ALL"],
  activeCategory: "ALL",
  setActiveCategory: vi.fn(),
  filteredMenuItems: [],
  reviewsList: [],
  reviewsPage: 1,
  setReviewsPage: vi.fn(),
  reviewsTotal: 0,
  reviewForm: {},
  setReviewForm: vi.fn(),
  reviewsLoading: false,
  reviewError: "",
  reviewSuccess: false,
  selectedProduct: null,
  setSelectedProduct: vi.fn(),
  isFav: false,
  myReview: null,
  otherReviews: [],
  infoWorkingHours: [],
  handleProductAdd: vi.fn(),
  handleToggleFavorite: vi.fn(),
  handleReviewSubmitForm: vi.fn(),
  handleDeleteWithConfirm: vi.fn(),
  ...o,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <RestaurantPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  cartState = {
    addToCart: vi.fn(),
    cartCount: () => 0,
    cartTotal: () => 0,
  };
  controllerState = makeController();
});

describe("RestaurantPage", () => {
  it("renders the hero and menu sections", () => {
    renderPage();
    expect(screen.getByTestId("hero")).toBeInTheDocument();
    expect(screen.getByTestId("menu")).toBeInTheDocument();
  });

  it("hides the cart fab when the cart is empty", () => {
    renderPage();
    expect(screen.queryByText(/товар/)).not.toBeInTheDocument();
  });

  it("shows the cart fab with count and total when items are in the cart", () => {
    cartState = { addToCart: vi.fn(), cartCount: () => 3, cartTotal: () => 900 };
    renderPage();
    expect(screen.getByText(/3 товара/)).toBeInTheDocument();
  });

  it("opens the cart drawer via the cart fab and fires haptic", async () => {
    cartState = { addToCart: vi.fn(), cartCount: () => 2, cartTotal: () => 500 };
    renderPage();
    await userEvent.click(screen.getByText(/2 товара/));
    expect(hapticImpact).toHaveBeenCalledWith("medium");
    expect(screen.getByTestId("cart-drawer")).toBeInTheDocument();
  });

  it("renders the product sheet when a product is selected", () => {
    controllerState = makeController({ selectedProduct: { id: "p1", name: "Item" } });
    renderPage();
    expect(screen.getByTestId("product-sheet")).toBeInTheDocument();
  });

  it("opens the reviews modal from the hero", async () => {
    renderPage();
    expect(screen.queryByTestId("reviews-modal")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("open-reviews"));
    expect(screen.getByTestId("reviews-modal")).toBeInTheDocument();
  });

  it("opens the info modal from the hero", async () => {
    renderPage();
    await userEvent.click(screen.getByText("open-info"));
    expect(screen.getByTestId("info-modal")).toBeInTheDocument();
  });

  it("closes the cart drawer from within it", async () => {
    cartState = { addToCart: vi.fn(), cartCount: () => 2, cartTotal: () => 500 };
    renderPage();
    await userEvent.click(screen.getByText(/2 товара/));
    await userEvent.click(screen.getByText("close-cart"));
    expect(screen.queryByTestId("cart-drawer")).not.toBeInTheDocument();
  });

  it("closes the product sheet", async () => {
    controllerState = makeController({
      selectedProduct: { id: "p1", name: "Item" },
    });
    renderPage();
    await userEvent.click(screen.getByText("close-product"));
    expect(controllerState['setSelectedProduct']).toHaveBeenCalledWith(null);
  });

  it("closes the reviews modal", async () => {
    renderPage();
    await userEvent.click(screen.getByText("open-reviews"));
    await userEvent.click(screen.getByText("close-reviews"));
    expect(screen.queryByTestId("reviews-modal")).not.toBeInTheDocument();
  });

  it("closes the info modal", async () => {
    renderPage();
    await userEvent.click(screen.getByText("open-info"));
    await userEvent.click(screen.getByText("close-info"));
    expect(screen.queryByTestId("info-modal")).not.toBeInTheDocument();
  });

  it("shows the back button and navigates home on click", () => {
    renderPage();
    expect(backButton.show).toHaveBeenCalledTimes(1);
    const handler = backButton.onClick.mock.calls[0]?.[0] as () => void;
    handler();
    expect(navigateMock).toHaveBeenCalledWith("/");
  });
});
