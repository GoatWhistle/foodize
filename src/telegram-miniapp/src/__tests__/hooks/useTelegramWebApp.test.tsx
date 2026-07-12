import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTelegramWebApp } from "../../hooks/useTelegramWebApp";
import { tg, getBackButton, getMainButton, getHapticFeedback } from "../../telegram/sdk";

vi.mock("../../telegram/sdk", () => {
  const close = vi.fn();
  const showAlert = vi.fn();
  const showConfirm = vi.fn();
  return {
    tg: { close, showAlert, showConfirm },
    getColorScheme: () => "dark",
    getBackButton: () => ({ id: "back" }),
    getMainButton: () => ({ id: "main" }),
    getHapticFeedback: () => ({ id: "haptic" }),
  };
});

const tgMock = tg as unknown as {
  close: ReturnType<typeof vi.fn>;
  showAlert: ReturnType<typeof vi.fn>;
  showConfirm: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTelegramWebApp", () => {
  it("returns the SDK surface resolved from the sdk module", () => {
    const { result } = renderHook(() => useTelegramWebApp());
    expect(result.current.tg).toBe(tg);
    expect(result.current.colorScheme).toBe("dark");
    expect(result.current.BackButton).toEqual(getBackButton());
    expect(result.current.MainButton).toEqual(getMainButton());
    expect(result.current.HapticFeedback).toEqual(getHapticFeedback());
  });

  it("delegates close/showAlert/showConfirm to the underlying webapp", () => {
    const { result } = renderHook(() => useTelegramWebApp());

    result.current.close();
    expect(tgMock.close).toHaveBeenCalledTimes(1);

    const alertCb = vi.fn();
    result.current.showAlert("hi", alertCb);
    expect(tgMock.showAlert).toHaveBeenCalledWith("hi", alertCb);

    const confirmCb = vi.fn();
    result.current.showConfirm("sure?", confirmCb);
    expect(tgMock.showConfirm).toHaveBeenCalledWith("sure?", confirmCb);
  });
});
