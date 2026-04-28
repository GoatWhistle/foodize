import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RestaurantPage from "../../pages/restaurant/RestaurantPage";
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
            option_groups: [
              {
                id: "g1",
                name: "Добавки",
                selection_type: "multiple",
                is_required: false,
                min_selected: 0,
                max_selected: 2,
                is_active: true,
                options: [
                  {
                    id: "o1",
                    name: "Добавить мясо",
                    price_delta: 80,
                    is_available: true,
                  },
                ],
              },
            ],
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

vi.mock("../../services/restaurantService", () => ({
  restaurantService: {
    getById: vi
      .fn()
      .mockResolvedValue({ data: { id: "mock-1", name: "Test Restaurant" } }),
  },
}));

vi.mock("../../services/reviewService", () => ({
  reviewService: {
    getRating: vi.fn().mockResolvedValue({ data: { average_rating: 4.5 } }),
    getReviews: vi.fn().mockResolvedValue({ data: [] }),
    createReview: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../services/staffService", () => ({
  staffService: {
    createRequest: vi.fn().mockResolvedValue({}),
  },
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
    fireEvent.click(screen.getByText("Добавить мясо"));
    fireEvent.click(screen.getByText("Добавить за 380 ₽"));

    expect(addToCartMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m1" }),
      "mock-1",
      [expect.objectContaining({ id: "o1" })],
    );
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
