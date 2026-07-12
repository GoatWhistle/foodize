import type {
  MenuItem,
  MenuItemShort,
  OrderItem,
  CartItem,
  CartItemIn,
  CartSelectedOption,
} from "@shared/types/models";
import { makeId } from "@shared/utils/id";

export type CartLineOption = Partial<
  Pick<CartSelectedOption, "option_id" | "name">
> & {
  id?: string;
  price_delta?: number | null;
};

export type CartMenuItem = (MenuItem | MenuItemShort) & {
  image_url?: string | null;
};

export interface CartLine {
  menuItem: CartMenuItem;
  quantity: number;
  selectedOptionIds: string[];
  selectedOptions: CartLineOption[];
  lineKey?: string;
}

export const getOptionIds = (item: CartLine): string[] =>
  [...new Set(item.selectedOptionIds)].filter((id): id is string =>
    Boolean(id),
  );

export const getSelectedOptions = (item: CartLine): CartLineOption[] =>
  item.selectedOptions;

export const getOptionsTotal = (item: CartLine): number =>
  getSelectedOptions(item).reduce(
    (sum, o) => sum + (Number(o.price_delta) || 0),
    0,
  );

export const getLinePrice = (item: CartLine): number =>
  (item.menuItem.price || 0) + getOptionsTotal(item);

export const getLineKey = (
  menuItemId: string,
  selectedOptionIds: string[] = [],
): string => `${menuItemId}:${[...selectedOptionIds].sort().join(",")}`;

export const normalizeCartLine = (item: CartItem): CartLine => {
  const options: CartLineOption[] = item.selected_options.map((o) => ({
    id: o.option_id,
    option_id: o.option_id,
    name: o.name,
    price_delta: o.price_delta,
  }));
  const optionIds = item.selected_option_ids;
  return {
    menuItem: item.menuItem,
    quantity: item.quantity,
    selectedOptionIds: optionIds,
    selectedOptions: options,
    lineKey: getLineKey(item.menuItem.id, optionIds),
  };
};

export const normalizeOrderItemForCart = (orderItem: OrderItem): CartItemIn => {
  const options = orderItem.selected_options;
  const optionIds = options
    .map((o) => o.option_id)
    .filter((id): id is string => Boolean(id));
  const optionsTotal = options.reduce(
    (sum, o) => sum + (o.price_delta || 0),
    0,
  );
  const basePrice = Math.max(
    0,
    (orderItem.price_at_purchase || 0) - optionsTotal,
  );
  return {
    menu_item_id: orderItem.menu_item_id,
    name: orderItem.menu_item_name,
    price: basePrice,
    image_url: null,
    quantity: orderItem.quantity,
    selected_option_ids: optionIds,
    selected_options: options.map((o) => ({
      option_id: o.option_id ?? "",
      name: o.name,
      price_delta: o.price_delta || 0,
    })),
  };
};

export const uniqueOptions = (
  options: CartLineOption[] = [],
): CartLineOption[] => {
  const seen = new Set<string>();
  return options.filter((o) => {
    const id = o.id ?? o.option_id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export const toCartSelectedOptions = (
  options: CartLineOption[],
): CartSelectedOption[] =>
  options.map((o) => ({
    option_id: o.option_id ?? o.id ?? "",
    name: o.name ?? "",
    price_delta: Number(o.price_delta) || 0,
  }));

export const buildCartItemIn = (i: CartLine): CartItemIn => ({
  menu_item_id: i.menuItem.id,
  name: i.menuItem.name,
  price: i.menuItem.price,
  image_url: i.menuItem.image_url ?? null,
  quantity: i.quantity,
  selected_option_ids: getOptionIds(i),
  selected_options: toCartSelectedOptions(uniqueOptions(getSelectedOptions(i))),
});

export const makeIdempotencyKey = (): string => makeId();
