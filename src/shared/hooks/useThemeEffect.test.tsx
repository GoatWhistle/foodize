import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useThemeEffect } from "@shared/hooks/useThemeEffect";
import { useThemeStore } from "@shared/store/useThemeStore";

let matches = false;
let listener: (() => void) | null = null;
const addEventListener = vi.fn((_: string, cb: () => void) => {
  listener = cb;
});
const removeEventListener = vi.fn();

describe("useThemeEffect", () => {
  beforeEach(() => {
    matches = false;
    listener = null;
    addEventListener.mockClear();
    removeEventListener.mockClear();
    document.documentElement.removeAttribute("data-theme");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: () =>
        ({
          matches,
          addEventListener,
          removeEventListener,
        }) as unknown as MediaQueryList,
    });
  });

  afterEach(() => {
    useThemeStore.setState({ theme: "system" });
  });

  it("applies an explicit dark theme and does not subscribe", () => {
    useThemeStore.setState({ theme: "dark" });
    renderHook(() => { useThemeEffect(); });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(addEventListener).not.toHaveBeenCalled();
  });

  it("resolves system theme to light when the query does not match", () => {
    matches = false;
    useThemeStore.setState({ theme: "system" });
    renderHook(() => { useThemeEffect(); });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(addEventListener).toHaveBeenCalled();
  });

  it("resolves system theme to dark and reacts to media changes", () => {
    matches = true;
    useThemeStore.setState({ theme: "system" });
    renderHook(() => { useThemeEffect(); });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    matches = false;
    listener?.();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("removes the media listener on unmount", () => {
    useThemeStore.setState({ theme: "system" });
    const { unmount } = renderHook(() => { useThemeEffect(); });
    unmount();
    expect(removeEventListener).toHaveBeenCalled();
  });
});
