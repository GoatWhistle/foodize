import { fireEvent, render, screen } from "@testing-library/react-native";
import { ProductSheet } from "@/components/domain/ProductSheet";
import type { ProductSheetAddPayload } from "@/components/domain/ProductSheet";
import type { MenuItem } from "@shared/types/models";

interface Captured {
  payload: ProductSheetAddPayload | null;
}

const makeOnAdd = (store: Captured) =>
  jest.fn((payload: ProductSheetAddPayload) => {
    store.payload = payload;
  });

const item: MenuItem = {
  id: "m1",
  name: "Burger",
  description: "Juicy",
  price: 300,
  category: "BURGER",
  restaurant_id: "r1",
  is_available: true,
  prep_time_minutes: 8,
  photo_url: "http://x/burger.jpg",
  option_groups: [
    {
      id: "g1",
      menu_item_id: "m1",
      name: "Size",
      selection_type: "single",
      is_required: true,
      min_selected: 1,
      max_selected: 1,
      sort_order: 0,
      is_active: true,
      options: [
        { id: "s1", group_id: "g1", name: "Small", price_delta: 0, is_available: true, sort_order: 0 },
        { id: "s2", group_id: "g1", name: "Large", price_delta: 100, is_available: true, sort_order: 1 },
      ],
    },
    {
      id: "g2",
      menu_item_id: "m1",
      name: "Extras",
      selection_type: "multiple",
      is_required: false,
      min_selected: 0,
      max_selected: 1,
      sort_order: 1,
      is_active: true,
      options: [
        { id: "e1", group_id: "g2", name: "Bacon", price_delta: 50, is_available: true, sort_order: 0 },
        { id: "e2", group_id: "g2", name: "Egg", price_delta: 40, is_available: true, sort_order: 1 },
      ],
    },
  ],
};

describe("ProductSheet", () => {
  it("renders nothing meaningful when item is null", () => {
    render(<ProductSheet item={null} onClose={jest.fn()} onAdd={jest.fn()} />);
    expect(screen.queryByTestId("product-add")).toBeNull();
  });

  it("renders item details and preselects the required single option", () => {
    render(<ProductSheet item={item} onClose={jest.fn()} onAdd={jest.fn()} />);
    expect(screen.getByText("Juicy")).toBeTruthy();
    expect(screen.getByText("Small")).toBeTruthy();
    expect(screen.getByText("Large")).toBeTruthy();
  });

  it("adds with the preselected option and default quantity", () => {
    const onAdd = jest.fn();
    render(<ProductSheet item={item} onClose={jest.fn()} onAdd={onAdd} />);
    fireEvent.press(screen.getByTestId("product-add"));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        item,
        quantity: 1,
        selectedOptions: [expect.objectContaining({ id: "s1", name: "Small" })],
      }),
    );
  });

  it("switches single option, adds a multiple option and increases quantity", () => {
    const store: Captured = { payload: null };
    render(<ProductSheet item={item} onClose={jest.fn()} onAdd={makeOnAdd(store)} />);
    fireEvent.press(screen.getByTestId("option-s2"));
    fireEvent.press(screen.getByTestId("option-e1"));
    fireEvent.press(screen.getByTestId("qty-increase"));
    fireEvent.press(screen.getByTestId("product-add"));
    expect(store.payload?.quantity).toBe(2);
    expect(store.payload?.selectedOptions.map((o) => o.id).sort()).toEqual(["e1", "s2"]);
  });

  it("respects max_selected on a multiple group", () => {
    const store: Captured = { payload: null };
    render(<ProductSheet item={item} onClose={jest.fn()} onAdd={makeOnAdd(store)} />);
    fireEvent.press(screen.getByTestId("option-e1"));
    fireEvent.press(screen.getByTestId("option-e2"));
    fireEvent.press(screen.getByTestId("product-add"));
    const extras =
      store.payload?.selectedOptions.filter((o) => o.id === "e1" || o.id === "e2") ?? [];
    expect(extras).toHaveLength(1);
  });

  it("toggles a multiple option off, and lowers quantity floor at one", () => {
    const store: Captured = { payload: null };
    render(<ProductSheet item={item} onClose={jest.fn()} onAdd={makeOnAdd(store)} />);
    fireEvent.press(screen.getByTestId("option-e1"));
    fireEvent.press(screen.getByTestId("option-e1"));
    fireEvent.press(screen.getByTestId("qty-decrease"));
    fireEvent.press(screen.getByTestId("product-add"));
    expect(store.payload?.quantity).toBe(1);
    expect(store.payload?.selectedOptions.some((o) => o.id === "e1")).toBe(false);
  });

  it("blocks add and shows an error when a required group is unmet", () => {
    const requiredItem: MenuItem = {
      ...item,
      option_groups: [
        {
          id: "g3",
          menu_item_id: "m1",
          name: "Sauce",
          selection_type: "multiple",
          is_required: true,
          min_selected: 1,
          max_selected: 2,
          sort_order: 0,
          is_active: true,
          options: [
            { id: "sa1", group_id: "g3", name: "Ketchup", price_delta: 0, is_available: true, sort_order: 0 },
          ],
        },
      ],
    };
    const onAdd = jest.fn();
    render(<ProductSheet item={requiredItem} onClose={jest.fn()} onAdd={onAdd} />);
    fireEvent.press(screen.getByTestId("product-add"));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText("Выберите: Sauce")).toBeTruthy();
  });

  it("renders the multiple hint for an optional group without a max", () => {
    const multiItem: MenuItem = {
      ...item,
      option_groups: [
        {
          id: "g4",
          menu_item_id: "m1",
          name: "Toppings",
          selection_type: "multiple",
          is_required: false,
          min_selected: 0,
          max_selected: null,
          sort_order: 0,
          is_active: true,
          options: [
            { id: "t1", group_id: "g4", name: "Onion", price_delta: 0, is_available: true, sort_order: 0 },
            { id: "t2", group_id: "g4", name: "Pepper", price_delta: 0, is_available: true, sort_order: 1 },
          ],
        },
      ],
    };
    render(<ProductSheet item={multiItem} onClose={jest.fn()} onAdd={jest.fn()} />);
    expect(screen.getByText("Можно выбрать несколько")).toBeTruthy();
    fireEvent.press(screen.getByTestId("option-t1"));
    fireEvent.press(screen.getByTestId("option-t2"));
    expect(screen.getByTestId("option-t2")).toBeTruthy();
  });

  it("shows the closed label and disables adding when the restaurant is closed", () => {
    const onAdd = jest.fn();
    render(<ProductSheet item={item} isRestaurantOpen={false} onClose={jest.fn()} onAdd={onAdd} />);
    expect(screen.getByText("Заведение закрыто")).toBeTruthy();
  });
});
