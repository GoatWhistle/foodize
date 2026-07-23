import { renderHook } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { useThemeStore } from "@shared/store/useThemeStore";
import { useTheme } from "@/theme/useTheme";
import { darkTheme, lightTheme } from "@/theme/theme";

describe("useTheme", () => {
  let colorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    colorSchemeSpy = jest.spyOn(ReactNative, "useColorScheme");
  });

  afterEach(() => {
    useThemeStore.setState({ theme: "system" });
    colorSchemeSpy.mockRestore();
  });

  it("returns dark theme when preference is dark", () => {
    useThemeStore.setState({ theme: "dark" });
    colorSchemeSpy.mockReturnValue("light");
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(darkTheme);
  });

  it("returns light theme when preference is light", () => {
    useThemeStore.setState({ theme: "light" });
    colorSchemeSpy.mockReturnValue("dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(lightTheme);
  });

  it("follows the system scheme when preference is system", () => {
    useThemeStore.setState({ theme: "system" });
    colorSchemeSpy.mockReturnValue("dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(darkTheme);
  });

  it("falls back to light when system scheme is null", () => {
    useThemeStore.setState({ theme: "system" });
    colorSchemeSpy.mockReturnValue(null);
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(lightTheme);
  });
});
