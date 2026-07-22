import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MenuSection } from "../../pages/restaurant/MenuSection";
import type { MenuItem } from "@shared/types/models";
import { t } from "@shared/i18n/useTranslation";

vi.mock("../../telegram/sdk", () => ({
  hapticSelection: vi.fn(),
}));

const makeItem = (o: Partial<MenuItem> = {}): MenuItem =>
  ({
    id: "m1",
    name: "Пицца Маргарита",
    price: 500,
    category: "Основное",
    is_available: true,
    ...o,
  }) as unknown as MenuItem;

const baseProps = {
  isRestaurantOpen: true,
  loading: false,
  categories: ["ALL", "Пицца", "Напитки"],
  activeCategory: "ALL",
  setActiveCategory: vi.fn(),
  filteredMenuItems: [makeItem(), makeItem({ id: "m2", name: "Пепперони" })],
  onSelectProduct: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MenuSection", () => {
  it("renders category chips with the Все label for ALL", () => {
    render(<MenuSection {...baseProps} setActiveCategory={vi.fn()} onSelectProduct={vi.fn()} />);
    expect(screen.getByRole("button", { name: t("catalog.restaurantPage.allCategories") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Пицца" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Напитки" })).toBeInTheDocument();
  });

  it("renders the menu items when not loading", () => {
    render(<MenuSection {...baseProps} setActiveCategory={vi.fn()} onSelectProduct={vi.fn()} />);
    expect(screen.getByText("Пицца Маргарита")).toBeInTheDocument();
    expect(screen.getByText("Пепперони")).toBeInTheDocument();
  });

  it("switches category on chip click", async () => {
    const setActiveCategory = vi.fn();
    render(
      <MenuSection {...baseProps} setActiveCategory={setActiveCategory} onSelectProduct={vi.fn()} />,
    );
    await userEvent.click(screen.getByText("Напитки"));
    expect(setActiveCategory).toHaveBeenCalledWith("Напитки");
  });

  it("selects a product when a menu item is clicked", async () => {
    const onSelectProduct = vi.fn();
    render(
      <MenuSection {...baseProps} setActiveCategory={vi.fn()} onSelectProduct={onSelectProduct} />,
    );
    await userEvent.click(screen.getByText("Пицца Маргарита"));
    expect(onSelectProduct).toHaveBeenCalledTimes(1);
    expect(onSelectProduct.mock.calls[0]?.[0]).toMatchObject({ name: "Пицца Маргарита" });
  });

  it("shows the closed banner when the restaurant is closed", () => {
    render(
      <MenuSection
        {...baseProps}
        isRestaurantOpen={false}
        setActiveCategory={vi.fn()}
        onSelectProduct={vi.fn()}
      />,
    );
    expect(
      screen.getByText(t("catalog.restaurantPage.closedBannerMiniapp")),
    ).toBeInTheDocument();
  });

  it("shows skeletons and hides items while loading", () => {
    render(
      <MenuSection {...baseProps} loading setActiveCategory={vi.fn()} onSelectProduct={vi.fn()} />,
    );
    expect(screen.queryByText("Пицца Маргарита")).not.toBeInTheDocument();
    expect(screen.getByText(t("catalog.restaurantPage.allCategories"))).toBeInTheDocument();
  });
});
