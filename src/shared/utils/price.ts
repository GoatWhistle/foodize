import { CURRENCY_SYMBOL } from "@shared/constants/format";

interface PricedOption {
  name?: string;
  price_delta?: number | null;
}

export const formatPrice = (value: number | string): string =>
  `${value} ${CURRENCY_SYMBOL}`;

export const formatOptionLabel = (option: PricedOption): string =>
  `${option.name}${option.price_delta ? ` +${option.price_delta} ${CURRENCY_SYMBOL}` : ""}`;

export const formatOptionsSummary = (
  options: PricedOption[] | null | undefined,
): string => (options || []).map(formatOptionLabel).join(", ");
