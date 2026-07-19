import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { OrderCard } from "@shared/components/OrderCard/OrderCard";
import type { Order } from "@shared/types/models";

const baseOrder: Order = {
  id: "o1",
  display_id: 42,
  user_id: "u1",
  restaurant_id: "rest-1",
  restaurant_name: "Шаурма №1",
  restaurant_address: "ул. Пушкина, 1",
  status: "ACCEPTED",
  total_price: 550,
  created_at: "2026-01-15T12:30:00Z",
  items: [
    {
      id: "i1",
      menu_item_id: "m1",
      menu_item_name: "Шаурма классическая",
      menu_item_category: "SHAURMA",
      menu_item_prep_time: 8,
      quantity: 2,
      price_at_purchase: 250,
      selected_options: [{ id: "opt1", option_id: "o", name: "Острый соус", price_delta: 25 }],
    },
  ],
};

describe("OrderCard", () => {
  it("renders order id, restaurant, status label, item count and price", () => {
    render(<OrderCard order={baseOrder} />);
    expect(screen.getByText("#42")).toBeInTheDocument();
    expect(screen.getByText("Шаурма №1")).toBeInTheDocument();
    expect(screen.getByText("Готовится")).toBeInTheDocument();
    expect(screen.getByText("1 поз.")).toBeInTheDocument();
    expect(screen.getByText("550 ₽")).toBeInTheDocument();
  });

  it("calls onClick when the card is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<OrderCard order={baseOrder} onClick={onClick} />);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("activates onClick via the keyboard", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<OrderCard order={baseOrder} onClick={onClick} />);
    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not render details toggle in non-expandable mode", () => {
    render(<OrderCard order={baseOrder} />);
    expect(screen.queryByRole("button", { name: /детали/ })).not.toBeInTheDocument();
  });

  it("toggles item details in expandable mode", async () => {
    const user = userEvent.setup();
    render(<OrderCard order={baseOrder} expandable />);
    expect(screen.queryByText("Шаурма классическая")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /детали/ });
    await user.click(toggle);
    expect(screen.getByText("Шаурма классическая")).toBeInTheDocument();
    expect(screen.getByText("Острый соус +25 ₽")).toBeInTheDocument();
    expect(screen.getByText("ул. Пушкина, 1")).toBeInTheDocument();
    await user.click(toggle);
    expect(screen.queryByText("Шаурма классическая")).not.toBeInTheDocument();
  });

  it("does not trigger the row onClick when toggling details", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<OrderCard order={baseOrder} expandable onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: /детали/ }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders a cancelled status label", () => {
    render(<OrderCard order={{ ...baseOrder, status: "CANCELLED" }} />);
    expect(screen.getByText("Отменён")).toBeInTheDocument();
  });
});
