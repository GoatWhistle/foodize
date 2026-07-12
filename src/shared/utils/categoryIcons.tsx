import {
  FireIcon,
  HamburgerIcon,
  PizzaIcon,
  BowlFoodIcon,
  LeafIcon,
  CookieIcon,
  CoffeeIcon,
  DotsThreeIcon,
  StorefrontIcon,
  CookingPotIcon,
  type Icon,
} from "@phosphor-icons/react";

const ICON_BY_CATEGORY = {
  SHAURMA: FireIcon,
  BURGER: HamburgerIcon,
  PIZZA: PizzaIcon,
  SUSHI: BowlFoodIcon,
  SALAD: LeafIcon,
  SNACK: CookieIcon,
  DRINK: CoffeeIcon,
  OTHER: DotsThreeIcon,
};

const DEFAULT_ICON = {
  dish: BowlFoodIcon,
  venue: StorefrontIcon,
  cooking: CookingPotIcon,
};

interface CategoryIconOptions {
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  fallback?: "dish" | "venue" | "cooking";
}

export function getCategoryIcon(
  category: string | null | undefined,
  { size = 24, weight = "regular", fallback = "dish" }: CategoryIconOptions = {},
) {
  const iconByCategory = ICON_BY_CATEGORY as Record<string, Icon>;
  const Icon = iconByCategory[(category ?? "").toUpperCase()] ?? DEFAULT_ICON[fallback];
  return <Icon size={size} weight={weight} />;
}
