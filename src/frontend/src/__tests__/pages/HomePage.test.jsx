import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import HomePage from "../../pages/home/HomePage";

vi.mock("../../store/useAuthStore", () => ({
  useAuthStore: (sel) => {
    const state = { isAuthenticated: true };
    return sel ? sel(state) : state;
  },
}));

vi.mock("../../store/useRestaurantStore", () => ({
  useRestaurantStore: (sel) => {
    const state = {
      publicRestaurants: [
        { id: "mock-1", name: "Шаурма Хаус", category: "SHAURMA" },
        { id: "mock-2", name: "Burger Point", category: "BURGER" },
        { id: "mock-3", name: "Pizza Nova", category: "PIZZA" },
        { id: "mock-4", name: "Sushi House", category: "SUSHI" },
      ],
      fetchPublicRestaurants: vi.fn(),
      loading: false,
    };
    return sel ? sel(state) : state;
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock IntersectionObserver
window.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search bar and category chips", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    expect(
      screen.getByPlaceholderText("Поиск ресторана или адреса..."),
    ).toBeDefined();
    expect(screen.getByText("🌯 Шаурма")).toBeDefined();
    expect(screen.getByText("🍔 Бургеры")).toBeDefined();
  });

  it("filters restaurants by category", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    // Initial state shows all 4 mock restaurants (from the code)
    expect(screen.getByText("4 мест")).toBeDefined();

    // Click Burger category
    fireEvent.click(screen.getByText("🍔 Бургеры"));

    // Burger Point should remain, Shaurma House should disappear
    expect(screen.getByText("Burger Point")).toBeDefined();
    expect(screen.queryByText("Шаурма Хаус")).toBeNull();
    expect(screen.getByText("1 мест")).toBeDefined();
  });

  // The text search is tested on backend service layer now

  it("navigates to restaurant page on card click", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByText("Шаурма Хаус"));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining("/restaurants/mock-1"),
      expect.anything(),
    );
  });
});
