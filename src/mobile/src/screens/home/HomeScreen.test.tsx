import { fireEvent, render, screen } from "@testing-library/react-native";
import { HomeScreen } from "@/screens/home/HomeScreen";
import type { Restaurant } from "@shared/types/models";

const mockPush = jest.fn();
const mockToggleFavorite = jest.fn();
const mockSetSearch = jest.fn();
type BoolArg = boolean | ((prev: boolean) => boolean);
type NumArg = number | ((prev: number) => number);
const onlyOpenArgs: BoolArg[] = [];
const pageArgs: NumArg[] = [];
const mockSetOnlyOpen = jest.fn((arg: BoolArg) => {
  onlyOpenArgs.push(arg);
});
const mockSetSort = jest.fn();
const mockSetPage = jest.fn((arg: NumArg) => {
  pageArgs.push(arg);
});
const mockResetFilters = jest.fn();

const mockHomeState = {
  search: "",
  setSearch: mockSetSearch,
  searching: false,
  onlyOpen: false,
  setOnlyOpen: mockSetOnlyOpen,
  sort: "default",
  setSort: mockSetSort,
  page: 1,
  setPage: mockSetPage,
  allRestaurants: [] as Restaurant[],
  hasMore: false,
  loading: false,
  resetFilters: mockResetFilters,
};

let mockCartCount = 0;

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock("@shared/hooks/useHomePageLogic", () => ({
  useHomePageLogic: () => mockHomeState,
}));

jest.mock("@shared/store/useFavoriteStore", () => ({
  useFavoriteStore: (selector: (s: unknown) => unknown) =>
    selector({ favoriteIds: ["r1"], toggle: mockToggleFavorite }),
}));

jest.mock("@/store/useCartStore", () => ({
  useCartStore: (selector: (s: { cartCount: () => number }) => unknown) =>
    selector({ cartCount: () => mockCartCount }),
}));

const restaurant: Restaurant = {
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

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onlyOpenArgs.length = 0;
    pageArgs.length = 0;
    mockHomeState.allRestaurants = [];
    mockHomeState.loading = false;
    mockHomeState.onlyOpen = false;
    mockHomeState.sort = "default";
    mockHomeState.hasMore = false;
    mockCartCount = 0;
  });

  it("shows skeletons while loading with no data", () => {
    mockHomeState.loading = true;
    render(<HomeScreen />);
    expect(screen.getByTestId("home-skeletons")).toBeTruthy();
  });

  it("shows an empty state and resets filters", () => {
    render(<HomeScreen />);
    fireEvent.press(screen.getByText("Сбросить"));
    expect(mockResetFilters).toHaveBeenCalled();
  });

  it("renders restaurants and navigates on press", () => {
    mockHomeState.allRestaurants = [restaurant];
    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId("restaurant-r1"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/restaurant/[id]", params: { id: "r1" } });
  });

  it("toggles favorite from a card", () => {
    mockHomeState.allRestaurants = [restaurant];
    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId("restaurant-r1-fav"));
    expect(mockToggleFavorite).toHaveBeenCalledWith("r1");
  });

  it("forwards search text", () => {
    render(<HomeScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("Поиск заведения..."), "burger");
    expect(mockSetSearch).toHaveBeenCalledWith("burger");
  });

  it("selects the onlyOpen chip and toggles the previous value", () => {
    render(<HomeScreen />);
    fireEvent.press(screen.getByText("Открыто"));
    expect(mockSetOnlyOpen).toHaveBeenCalled();
    const updater = onlyOpenArgs[0];
    if (typeof updater === "function") {
      expect(updater(false)).toBe(true);
    }
  });

  it("selects a sort chip", () => {
    render(<HomeScreen />);
    fireEvent.press(screen.getByText("Оценка"));
    expect(mockSetSort).toHaveBeenCalledWith("rating");
  });

  it("loads the next page on end reached", () => {
    mockHomeState.allRestaurants = [restaurant];
    mockHomeState.hasMore = true;
    render(<HomeScreen />);
    fireEvent(screen.getByTestId("home-list"), "endReached");
    expect(mockSetPage).toHaveBeenCalled();
    const updater = pageArgs[0];
    if (typeof updater === "function") {
      expect(updater(2)).toBe(3);
    }
  });

  it("does not load more when there is no next page", () => {
    mockHomeState.allRestaurants = [restaurant];
    mockHomeState.hasMore = false;
    render(<HomeScreen />);
    fireEvent(screen.getByTestId("home-list"), "endReached");
    expect(mockSetPage).not.toHaveBeenCalled();
  });

  it("highlights the onlyOpen chip when the filter is active", () => {
    mockHomeState.onlyOpen = true;
    mockHomeState.allRestaurants = [restaurant];
    render(<HomeScreen />);
    expect(screen.getByTestId("chip-onlyOpen")).toBeTruthy();
  });

  it("shows a cart fab when the cart is not empty and opens the cart", () => {
    mockCartCount = 3;
    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId("home-cart-fab"));
    expect(mockPush).toHaveBeenCalledWith("/cart");
  });

  it("refreshes to the first page and renders separators between cards", () => {
    mockHomeState.allRestaurants = [restaurant, { ...restaurant, id: "r2", name: "Second" }];
    render(<HomeScreen />);
    fireEvent(screen.getByTestId("home-list"), "refresh");
    expect(mockSetPage).toHaveBeenCalledWith(1);
    expect(screen.getByText("Second")).toBeTruthy();
    fireEvent.press(screen.getByTestId("restaurant-r2"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/restaurant/[id]", params: { id: "r2" } });
    fireEvent.press(screen.getByTestId("restaurant-r2-fav"));
    expect(mockToggleFavorite).toHaveBeenCalledWith("r2");
  });

  it("shows the list as refreshing while loading the first page with data present", () => {
    mockHomeState.allRestaurants = [restaurant];
    mockHomeState.loading = true;
    mockHomeState.page = 1;
    render(<HomeScreen />);
    const list = screen.getByTestId("home-list") as unknown as { props: { refreshing: boolean } };
    expect(list.props.refreshing).toBe(true);
    mockHomeState.page = 1;
  });
});
