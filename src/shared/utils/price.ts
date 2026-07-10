interface PricedOption {
  name?: string;
  price_delta?: number | null;
}

export const formatPrice = (value: number | string): string => `${value} ₽`;

export const formatOptionLabel = (option: PricedOption): string =>
  `${option.name}${option.price_delta ? ` +${option.price_delta} ₽` : ""}`;

export const formatOptionsSummary = (
  options: PricedOption[] | null | undefined,
): string => (options || []).map(formatOptionLabel).join(", ");
