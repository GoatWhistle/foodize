export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
} as const;

export const lightPalette = {
  accent: "#e8562a",
  accentDim: "#cf4a24",
  accentDeep: "#a63c1e",
  accentSubtle: "rgba(232, 86, 42, 0.12)",
  accentText: "#fffaf7",
  telegram: "#2f9fe0",
  bg: "#f8f6f4",
  bgCard: "#ffffff",
  bgSurface: "#efece9",
  bgRaised: "#e7e3df",
  text1: "#1c1917",
  text2: "#403a35",
  text3: "#7c7570",
  border: "#e4dfda",
  borderMid: "#d3ccc5",
  success: "#2f9e5f",
  warning: "#d9a334",
  error: "#d94b34",
  overlay: "rgba(28, 25, 23, 0.45)",
  skeleton: "#e7e3df",
} as const;

export const darkPalette = {
  accent: "#f26b3f",
  accentDim: "#e8562a",
  accentDeep: "#cf4a24",
  accentSubtle: "rgba(242, 107, 63, 0.16)",
  accentText: "#fffaf7",
  telegram: "#3aabee",
  bg: "#141210",
  bgCard: "#201d1a",
  bgSurface: "#28241f",
  bgRaised: "#332e28",
  text1: "#f5f1ed",
  text2: "#cfc7bf",
  text3: "#948b82",
  border: "#332e28",
  borderMid: "#443d35",
  success: "#41b978",
  warning: "#e0b24d",
  error: "#e8624a",
  overlay: "rgba(0, 0, 0, 0.6)",
  skeleton: "#28241f",
} as const;

export type ThemeColors = Record<keyof typeof lightPalette, string>;

export const palette = lightPalette;

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  scheme: "light" | "dark";
}

export const lightTheme: Theme = {
  colors: lightPalette,
  spacing,
  radius,
  typography,
  scheme: "light",
};

export const darkTheme: Theme = {
  colors: darkPalette,
  spacing,
  radius,
  typography,
  scheme: "dark",
};

export const theme = lightTheme;

export type ThemeSpacing = typeof spacing;
export type TypographyVariant = keyof typeof typography;
