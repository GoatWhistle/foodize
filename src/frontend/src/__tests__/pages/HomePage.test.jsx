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

  it("searches restaurants by name", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );

    const searchInput = screen.getByPlaceholderText(
      "Поиск ресторана или адреса...",
    );
    fireEvent.change(searchInput, { target: { value: "Pizza" } });

    expect(screen.getByText("Pizza Nova")).toBeDefined();
    expect(screen.queryByText("Burger Point")).toBeNull();
  });

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
