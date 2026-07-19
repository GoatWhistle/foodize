import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { MenuItem } from "@shared/types/models";
import { ProductSheet } from "./ProductSheet";

type SheetItem = MenuItem & { category_name?: string | null };

const makeItem = (overrides: Partial<SheetItem> = {}): SheetItem =>
  ({
    id: "m1",
    name: "Бургер",
    price: 400,
    category: "BURGER",
    is_available: true,
    option_groups: [],
    ...overrides,
  }) as unknown as SheetItem;

describe("ProductSheet", () => {
  it("renders nothing when item is null", () => {
    const { container } = render(<ProductSheet item={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the item name and add button with total price", () => {
    render(<ProductSheet item={makeItem()} />);
    expect(screen.getByRole("dialog", { name: "Бургер" })).toBeInTheDocument();
    expect(screen.getByText(/Добавить · 400 ₽/)).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProductSheet item={makeItem()} onClose={onClose} />);
    await user.click(screen.getByLabelText("Закрыть"));
    expect(onClose).toHaveBeenCalled();
  });

  it("increments quantity and updates the add total", async () => {
    const user = userEvent.setup();
    render(<ProductSheet item={makeItem()} />);
    await user.click(screen.getByLabelText("Увеличить"));
    expect(screen.getByText(/Добавить · 800 ₽/)).toBeInTheDocument();
  });

  it("calls onAdd with item and quantity", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<ProductSheet item={makeItem()} onAdd={onAdd} />);
    await user.click(screen.getByText(/Добавить · 400 ₽/));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 1, selectedOptions: [] }),
    );
  });

  it("shows a closed label when the restaurant is closed", () => {
    render(<ProductSheet item={makeItem()} isRestaurantOpen={false} />);
    expect(screen.getByText("Заведение закрыто")).toBeInTheDocument();
  });

  const singleGroup = {
    id: "g1",
    name: "Размер",
    selection_type: "single",
    is_required: true,
    min_selected: 1,
    is_active: true,
    options: [
      { id: "s", name: "Маленький", price_delta: 0, is_available: true },
      { id: "l", name: "Большой", price_delta: 100, is_available: true },
    ],
  };

  const multiGroup = {
    id: "g2",
    name: "Добавки",
    selection_type: "multi",
    is_required: false,
    min_selected: 0,
    max_selected: 2,
    is_active: true,
    options: [
      { id: "a", name: "Сыр", price_delta: 50, is_available: true },
      { id: "b", name: "Бекон", price_delta: 70, is_available: true },
      { id: "cc", name: "Соус", price_delta: 30, is_available: true },
    ],
  };

  it("preselects a required single option and swaps on selection", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <ProductSheet
        item={makeItem({ option_groups: [singleGroup] } as Partial<SheetItem>)}
        onAdd={onAdd}
      />,
    );
    expect(screen.getByText("Обязательно выбрать 1")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Большой/ }));
    expect(screen.getByText(/Добавить · 500 ₽/)).toBeInTheDocument();
    await user.click(screen.getByText(/Добавить ·/));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedOptions: expect.arrayContaining([
          expect.objectContaining({ id: "l" }),
        ]) as unknown,
      }),
    );
  });

  it("enforces max_selected on a multi group by disabling further options", async () => {
    const user = userEvent.setup();
    render(
      <ProductSheet
        item={makeItem({ option_groups: [multiGroup] } as Partial<SheetItem>)}
      />,
    );
    expect(screen.getByText("Можно выбрать до 2")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Сыр/ }));
    await user.click(screen.getByRole("checkbox", { name: /Бекон/ }));
    expect(screen.getByRole("checkbox", { name: /Соус/ })).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /Сыр/ }));
    expect(screen.getByRole("checkbox", { name: /Соус/ })).not.toBeDisabled();
  });

  it("shows a validation error when a required group is unselected", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const requiredMulti = {
      ...multiGroup,
      is_required: true,
      min_selected: 1,
    };
    render(
      <ProductSheet
        item={makeItem({ option_groups: [requiredMulti] } as Partial<SheetItem>)}
        onAdd={onAdd}
      />,
    );
    await user.click(screen.getByText(/Добавить ·/));
    expect(screen.getByText("Выберите: Добавки")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("sets an error when adding while the restaurant is closed", async () => {
    const user = userEvent.setup();
    render(<ProductSheet item={makeItem()} isRestaurantOpen={false} />);
    await user.click(screen.getByText("Заведение закрыто"));
    expect(
      screen.getByText("Заведение сейчас закрыто и не принимает заказы"),
    ).toBeInTheDocument();
  });

  it("renders a photo, description and decrements quantity", async () => {
    const user = userEvent.setup();
    render(
      <ProductSheet
        item={makeItem({
          photo_url: "http://img/x.jpg",
          description: "Вкусно",
          prep_time_minutes: 20,
        })}
      />,
    );
    expect(screen.getByRole("img", { name: "Бургер" })).toBeInTheDocument();
    expect(screen.getByText("Вкусно")).toBeInTheDocument();
    expect(screen.getByText(/~20 мин/)).toBeInTheDocument();
    await user.click(screen.getByLabelText("Уменьшить"));
    expect(screen.getByText(/Добавить · 400 ₽/)).toBeInTheDocument();
  });

  it("closes when the overlay backdrop is pressed", () => {
    const onClose = vi.fn();
    const { baseElement } = render(
      <ProductSheet item={makeItem()} onClose={onClose} />,
    );
    const overlay = baseElement.querySelector('[class*="overlay"]') as Element;
    fireEvent.mouseDown(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it("filters out inactive groups and unavailable options", () => {
    render(
      <ProductSheet
        item={makeItem({
          option_groups: [
            { ...singleGroup, id: "inactive", is_active: false },
            {
              ...multiGroup,
              id: "g3",
              name: "Соусы",
              options: [
                { id: "x", name: "Кетчуп", price_delta: 0, is_available: false },
                { id: "y", name: "Горчица", price_delta: 0, is_available: true },
              ],
            },
          ],
        } as Partial<SheetItem>)}
      />,
    );
    expect(screen.queryByText("Размер")).not.toBeInTheDocument();
    expect(screen.getByText("Горчица")).toBeInTheDocument();
    expect(screen.queryByText("Кетчуп")).not.toBeInTheDocument();
  });
});
