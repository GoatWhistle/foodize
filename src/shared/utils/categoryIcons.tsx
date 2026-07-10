import {
  Fire,
  Hamburger,
  Pizza,
  BowlFood,
  Leaf,
  Cookie,
  Coffee,
  DotsThree,
  Storefront,
  CookingPot,
  type Icon,
} from "@phosphor-icons/react";

const ICON_BY_CATEGORY = {
  SHAURMA: Fire,
  BURGER: Hamburger,
  PIZZA: Pizza,
  SUSHI: BowlFood,
  SALAD: Leaf,
  SNACK: Cookie,
  DRINK: Coffee,
  OTHER: DotsThree,
};

const DEFAULT_ICON = {
  dish: BowlFood,
  venue: Storefront,
  cooking: CookingPot,
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
  const Icon = iconByCategory[String(category ?? "").toUpperCase()] ?? DEFAULT_ICON[fallback] ?? BowlFood;
  return <Icon size={size} weight={weight} />;
}
