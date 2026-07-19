import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

interface AuthState {
  user: { first_name?: string; name: string } | null;
}
let authState: AuthState;
vi.mock("../../store/useAuthStore", () => ({
  useAuthStore: (sel: (s: AuthState) => unknown) => sel(authState),
}));

let homeLogic: Record<string, unknown>;
vi.mock("@shared/hooks/useHomePageLogic", () => ({
  useHomePageLogic: () => homeLogic,
}));

vi.mock("@shared/utils/restaurant", () => ({
  getGreeting: () => "Добрый день",
}));

const streamChat = vi.fn();
vi.mock("@shared/services/aiOrderService", () => ({
  aiOrderService: {
    streamChat: (...args: unknown[]) => streamChat(...args) as Promise<void>,
  },
}));

vi.mock("../../services/api", () => ({
  refreshAccessToken: vi.fn(),
}));

import { HomePage } from "../../pages/home/HomePage";
import type { Restaurant } from "@shared/types/models";

const makeRestaurant = (id: string, name: string): Restaurant =>
  ({ id, display_id: id, name, is_open: true }) as unknown as Restaurant;

const makeLogic = (o: Record<string, unknown> = {}): Record<string, unknown> => ({
  search: "",
  setSearch: vi.fn(),
  searching: false,
  onlyOpen: false,
  setOnlyOpen: vi.fn(),
  sort: "",
  setSort: vi.fn(),
  direction: "",
  setDirection: vi.fn(),
  allRestaurants: [],
  loading: false,
  publicRestaurantsTotal: 0,
  sentinelRef: { current: null },
  ...o,
});

const renderHome = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

const openAiChip = async () => {
  await userEvent.click(screen.getByLabelText("Открыть фильтры"));
  await userEvent.click(screen.getByText("AI-помощник"));
};

beforeEach(() => {
  vi.clearAllMocks();
  authState = { user: null };
  homeLogic = makeLogic();
});

describe("HomePage", () => {
  it("shows a spinner while loading with no restaurants", () => {
    homeLogic = makeLogic({ loading: true, allRestaurants: [] });
    const { container } = renderHome();
    expect(container.querySelector(".spinner")).toBeInTheDocument();
  });

  it("shows the empty state when there are no restaurants", () => {
    homeLogic = makeLogic({ loading: false, allRestaurants: [] });
    renderHome();
    expect(screen.getByText("Ничего не найдено")).toBeInTheDocument();
  });

  it("renders the restaurant list and total when populated", () => {
    homeLogic = makeLogic({
      allRestaurants: [makeRestaurant("1", "Первое"), makeRestaurant("2", "Второе")],
      publicRestaurantsTotal: 2,
    });
    renderHome();
    expect(screen.getByText("Первое")).toBeInTheDocument();
    expect(screen.getByText("Второе")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows the pagination spinner while loading more over an existing list", () => {
    homeLogic = makeLogic({
      loading: true,
      allRestaurants: [makeRestaurant("1", "Первое")],
      publicRestaurantsTotal: 10,
    });
    const { container } = renderHome();
    expect(screen.getByText("Первое")).toBeInTheDocument();
    expect(container.querySelector(".loading-center .spinner")).toBeInTheDocument();
  });

  it("greets the user by first name when available", () => {
    authState = { user: { first_name: "Иван", name: "Иван Петров" } };
    renderHome();
    expect(screen.getByText("Иван")).toBeInTheDocument();
  });

  it("navigates to the restaurant on card click", async () => {
    homeLogic = makeLogic({ allRestaurants: [makeRestaurant("1", "Первое")] });
    renderHome();
    await userEvent.click(screen.getByText("Первое"));
    expect(navigateMock).toHaveBeenCalledWith("/restaurant/1", expect.any(Object));
  });

  it("streams the AI assistant answer when the chip is clicked", async () => {
    streamChat.mockImplementationOnce(
      (_msgs: unknown, opts: { onChunk: (c: string) => void }) => {
        opts.onChunk("Возьмите ");
        opts.onChunk("салат");
        return Promise.resolve();
      },
    );
    renderHome();
    await openAiChip();
    expect(streamChat).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText("Возьмите салат")).toBeInTheDocument();
    });
  });

  it("shows an error message when the AI assistant fails", async () => {
    streamChat.mockRejectedValueOnce(new Error("boom"));
    renderHome();
    await openAiChip();
    await waitFor(() => {
      expect(
        screen.getByText("Не удалось получить ответ ассистента"),
      ).toBeInTheDocument();
    });
  });

  it("closes the AI panel when the close button is clicked", async () => {
    streamChat.mockImplementationOnce(
      (_msgs: unknown, opts: { onChunk: (c: string) => void }) => {
        opts.onChunk("Ответ");
        return Promise.resolve();
      },
    );
    renderHome();
    await openAiChip();
    await waitFor(() => {
      expect(screen.getByText("Ответ")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByLabelText("Закрыть"));
    expect(screen.queryByText("Ответ")).not.toBeInTheDocument();
  });
});
