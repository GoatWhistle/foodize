import { useColorScheme } from "react-native";
import { useThemeStore } from "@shared/store/useThemeStore";
import { darkTheme, lightTheme } from "@/theme/theme";
import type { Theme } from "@/theme/theme";

export const useTheme = (): Theme => {
  const preference = useThemeStore((s) => s.theme);
  const systemScheme = useColorScheme();
  const resolved = preference === "system" ? (systemScheme ?? "light") : preference;
  return resolved === "dark" ? darkTheme : lightTheme;
};
