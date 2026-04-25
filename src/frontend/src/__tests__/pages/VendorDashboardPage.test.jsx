import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import VendorDashboardPage from "../../pages/vendor/VendorDashboardPage";
import { useAuthStore } from "../../store/useAuthStore";
import { useRestaurantStore } from "../../store/useRestaurantStore";

// Mock Stores & Services
vi.mock("../../store/useAuthStore", () => ({
  useAuthStore: vi.fn((sel) => {
    const state = {
      isAuthenticated: true,
      user: { name: "Ivan Ivanov", phone_number: "+7999" },
    };
    return sel ? sel(state) : state;
  }),
}));

vi.mock("../../store/useRestaurantStore", () => ({
  useRestaurantStore: vi.fn((sel) => {
    const state = {
      restaurants: [{ id: "r1", name: "My Resto", address: "Addr 1" }],
      fetchMyRestaurants: vi.fn(),
      fetchMenu: vi.fn(),
      createRestaurant: vi.fn(),
      addMenuItem: vi.fn(),
      loading: false,
      menus: { r1: [] },
    };
    return sel ? sel(state) : state;
  }),
}));

vi.mock("../../services/vendorService", () => ({
  vendorService: {
    getStaffRequests: vi.fn().mockResolvedValue({ data: [] }),
    updateStaffStatus: vi.fn(),
    getMyProfile: vi.fn().mockResolvedValue({ data: { description: "" } }),
    updateDescription: vi.fn().mockResolvedValue({}),
  },
}));

describe("VendorDashboardPage", () => {
  const createRestaurantMock = vi.fn();
  const logoutMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation((sel) => {
      const state = {
        user: { name: "Ivan Ivanov", phone_number: "+7999" },
        logout: logoutMock,
      };
      return sel ? sel(state) : state;
    });
    vi.mocked(useRestaurantStore).mockImplementation((sel) => {
      const state = {
        restaurants: [{ id: "r1", name: "My Resto", address: "Addr 1" }],
        fetchMyRestaurants: vi.fn(),
        fetchMenu: vi.fn(),
        createRestaurant: createRestaurantMock,
        addMenuItem: vi.fn(),
        loading: false,
        menus: { r1: [] },
      };
      return sel ? sel(state) : state;
    });
  });

  it("renders vendor dashboard with restaurants", () => {
    render(
      <BrowserRouter>
        <VendorDashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Дашборд вендора")).toBeDefined();
    expect(screen.getByText("My Resto")).toBeDefined();
  });

  it("opens add restaurant form and submits", async () => {
    render(
      <BrowserRouter>
        <VendorDashboardPage />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Добавить/ }));

    expect(screen.getByText("Новое заведение")).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText("Название"), {
      target: { value: "New Place" },
    });
    fireEvent.change(screen.getByPlaceholderText("Адрес"), {
      target: { value: "New Addr" },
    });

    fireEvent.click(screen.getByText("Создать"));

    await waitFor(() => {
      expect(createRestaurantMock).toHaveBeenCalledWith({
        name: "New Place",
        address: "New Addr",
      });
    });
  });

  it("selects a restaurant and shows its menu section", async () => {
    render(
      <BrowserRouter>
        <VendorDashboardPage />
      </BrowserRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("My Resto"));
    });

    expect(screen.getByText(/Позиции меню/)).toBeDefined();
  });
});
