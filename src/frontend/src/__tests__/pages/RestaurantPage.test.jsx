import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RestaurantPage from "../../pages/restaurant/RestaurantPage";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { useOrderStore } from "../../store/useOrderStore";

// Mock Stores
vi.mock("../../store/useRestaurantStore", () => ({
  useRestaurantStore: (sel) => {
    const state = {
      fetchMenu: vi.fn(),
      menus: {
        "mock-1": [
          {
            id: "m1",
            name: "Classic Shaurma",
            price: 300,
            category: "SHAURMA",
          },
          { id: "m2", name: "Veggie Burger", price: 400, category: "BURGER" },
        ],
      },
      loading: false,
    };
    return sel ? sel(state) : state;
  },
}));

vi.mock("../../store/useOrderStore", () => ({
  useOrderStore: vi.fn((sel) => {
    const state = {
      cart: [],
      addToCart: vi.fn(),
      cartTotal: () => 0,
      cartCount: () => 0,
    };
    return sel ? sel(state) : state;
  }),
}));

describe("RestaurantPage", () => {
  const addToCartMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useOrderStore).mockImplementation((sel) => {
      const state = {
        cart: [],
        addToCart: addToCartMock,
        cartTotal: () => 0,
        cartCount: () => 0,
      };
      return sel ? sel(state) : state;
    });
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter initialEntries={["/restaurants/mock-1"]}>
        <Routes>
          <Route path="/restaurants/:id" element={<RestaurantPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it("renders restaurant info and menu items", () => {
    renderWithRouter();

    expect(screen.getByText("Classic Shaurma")).toBeDefined();
    expect(screen.getByText("300 ₽")).toBeDefined();
  });

  it("calls addToCart when + button is clicked", () => {
    renderWithRouter();

    const addBtns = screen.getAllByRole("button", { name: /Добавить/ });
    fireEvent.click(addBtns[0]);

    expect(addToCartMock).toHaveBeenCalled();
  });

  it("shows cart FAB when items are in cart", () => {
    vi.mocked(useOrderStore).mockImplementation((sel) => {
      const state = {
        cart: [
          { menuItem: { id: "m1", name: "Shaurma", price: 300 }, quantity: 1 },
        ],
        addToCart: addToCartMock,
        cartTotal: () => 300,
        cartCount: () => 1,
      };
      return sel ? sel(state) : state;
    });

    renderWithRouter();

    expect(screen.getByText("Корзина")).toBeDefined();
    expect(screen.getAllByText(/300 ₽/)).toHaveLength(2);
  });

  it("filters menu items by category", () => {
    renderWithRouter();

    // Show all by default (2 items)
    expect(screen.getByText("Classic Shaurma")).toBeDefined();
    expect(screen.getByText("Veggie Burger")).toBeDefined();

    // Click Burger category chip (in the filters list)
    fireEvent.click(screen.getAllByText(/BURGER/)[0]);

    expect(screen.queryByText("Classic Shaurma")).toBeNull();
    expect(screen.getByText("Veggie Burger")).toBeDefined();
  });
});
