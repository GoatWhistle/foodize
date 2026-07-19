import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { MenuItem } from "@shared/types/models";
import { MenuItemCard } from "./MenuItemCard";

const makeItem = (overrides: Partial<MenuItem> = {}): MenuItem =>
  ({
    id: "m1",
    name: "Шаурма",
    description: "Классическая",
    price: 300,
    category: "SHAWARMA",
    is_available: true,
    photo_url: null,
    ...overrides,
  }) as MenuItem;

describe("MenuItemCard", () => {
  it("renders name, description and price", () => {
    render(<MenuItemCard item={makeItem()} />);
    expect(screen.getByText("Шаурма")).toBeInTheDocument();
    expect(screen.getByText("Классическая")).toBeInTheDocument();
    expect(screen.getByText("300 ₽")).toBeInTheDocument();
  });

  it("renders photo when photo_url is present", () => {
    render(<MenuItemCard item={makeItem({ photo_url: "pic.jpg" })} />);
    expect(screen.getByAltText("Шаурма")).toHaveAttribute("src", "pic.jpg");
  });

  it("calls onSelect and onHaptic on click when available", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onHaptic = vi.fn();
    const item = makeItem();
    render(<MenuItemCard item={item} onSelect={onSelect} onHaptic={onHaptic} />);
    await user.click(screen.getByLabelText("Открыть Шаурма"));
    expect(onSelect).toHaveBeenCalledWith(item);
    expect(onHaptic).toHaveBeenCalled();
  });

  it("clicking the add button selects the item", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const item = makeItem();
    render(<MenuItemCard item={item} onSelect={onSelect} />);
    await user.click(screen.getByLabelText("Добавить Шаурма"));
    expect(onSelect).toHaveBeenCalledWith(item);
  });

  it("does not select when item is unavailable", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MenuItemCard item={makeItem({ is_available: false })} onSelect={onSelect} />);
    await user.click(screen.getByLabelText("Открыть Шаурма"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Добавить Шаурма")).not.toBeInTheDocument();
  });

  it("does not select when the restaurant is closed", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MenuItemCard item={makeItem()} onSelect={onSelect} isRestaurantOpen={false} />);
    await user.click(screen.getByLabelText("Открыть Шаурма"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
