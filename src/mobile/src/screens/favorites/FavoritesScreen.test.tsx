import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { FavoritesScreen } from "@/screens/favorites/FavoritesScreen";
import { triggerRefresh } from "@/screens/testUtils";
import { favoriteService } from "@shared/services/favoriteService";
import { useFavoriteStore } from "@shared/store/useFavoriteStore";
import type { Favorite } from "@shared/types/models";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => ({
  __esModule: true,
  default: ({
    children,
    renderRightActions,
  }: {
    children: React.ReactNode;
    renderRightActions?: () => React.ReactNode;
  }) => (
    <>
      {children}
      {renderRightActions ? renderRightActions() : null}
    </>
  ),
}));

jest.mock("@shared/services/favoriteService", () => ({
  favoriteService: { getAll: jest.fn() },
}));

const mockToggle = jest.fn();
jest.mock("@shared/store/useFavoriteStore", () => ({
  useFavoriteStore: jest.fn(),
}));

const makeFavorite = (id: string) =>
  ({
    id: `fav-${id}`,
    created_at: new Date().toISOString(),
    restaurant: {
      id,
      name: `Ресторан ${id}`,
      address: "ул. Пушкина",
      is_open: true,
      is_hiring: false,
    },
  }) as Favorite;

const mockedGetAll = jest.mocked(favoriteService.getAll);
const mockedStore = jest.mocked(useFavoriteStore) as unknown as jest.Mock;

const resolveFavorites = (list: Favorite[]): void => {
  mockedGetAll.mockResolvedValue({
    data: { data: list, pagination: { total: list.length } },
  } as never);
};

describe("FavoritesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToggle.mockResolvedValue(undefined);
    mockedStore.mockImplementation((selector: (s: { toggle: unknown }) => unknown) =>
      selector({ toggle: mockToggle }),
    );
  });

  it("renders favorites after loading", async () => {
    resolveFavorites([makeFavorite("r1")]);
    render(<FavoritesScreen />);
    await waitFor(() => {
      expect(screen.getByText("Ресторан r1")).toBeTruthy();
    });
  });

  it("shows the empty state when there are no favorites", async () => {
    resolveFavorites([]);
    render(<FavoritesScreen />);
    await waitFor(() => {
      expect(screen.getByText("Нет уведомлений")).toBeTruthy();
    });
  });

  it("shows an error state on failure and retries", async () => {
    mockedGetAll.mockRejectedValueOnce(new Error("boom"));
    render(<FavoritesScreen />);
    await waitFor(() => {
      expect(screen.getByText("Что-то пошло не так")).toBeTruthy();
    });
    resolveFavorites([makeFavorite("r2")]);
    fireEvent.press(screen.getByText("Попробовать снова"));
    await waitFor(() => {
      expect(screen.getByText("Ресторан r2")).toBeTruthy();
    });
  });

  it("navigates to the restaurant on tap", async () => {
    resolveFavorites([makeFavorite("r1")]);
    render(<FavoritesScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("favorite-r1")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("favorite-r1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/restaurant/[id]",
      params: { id: "r1" },
    });
  });

  it("refreshes on pull to refresh", async () => {
    resolveFavorites([makeFavorite("r1")]);
    render(<FavoritesScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("favorites-list")).toBeTruthy();
    });
    mockedGetAll.mockClear();
    triggerRefresh("favorites-list");
    await waitFor(() => {
      expect(mockedGetAll).toHaveBeenCalled();
    });
  });

  it("removes a favorite on swipe action", async () => {
    resolveFavorites([makeFavorite("r1")]);
    render(<FavoritesScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("favorite-remove-r1")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("favorite-remove-r1"));
    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith("r1");
    });
    expect(screen.queryByText("Ресторан r1")).toBeNull();
  });
});
