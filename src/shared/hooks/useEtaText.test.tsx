import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useEtaText } from "@shared/hooks/useEtaText";
import type { OrderStatus } from "@shared/types/models";

describe("useEtaText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty string for terminal status", () => {
    const future = new Date("2026-07-18T12:30:00Z").toISOString();
    const { result } = renderHook(() =>
      useEtaText(future, "COMPLETED"),
    );
    expect(result.current).toBe("");
  });

  it("returns empty string for READY status", () => {
    const future = new Date("2026-07-18T12:30:00Z").toISOString();
    const { result } = renderHook(() =>
      useEtaText(future, "READY"),
    );
    expect(result.current).toBe("");
  });

  it("returns empty string when estimate is missing", () => {
    const { result } = renderHook(() =>
      useEtaText(null, "PREPARING" as OrderStatus),
    );
    expect(result.current).toBe("");
  });

  it("shows remaining minutes for a future estimate", () => {
    const future = new Date("2026-07-18T12:15:00Z").toISOString();
    const { result } = renderHook(() =>
      useEtaText(future, "PREPARING" as OrderStatus),
    );
    expect(result.current).toBe("Будет готов через ~15 мин");
  });

  it("shows delay message for a past estimate", () => {
    const past = new Date("2026-07-18T11:50:00Z").toISOString();
    const { result } = renderHook(() =>
      useEtaText(past, "PREPARING" as OrderStatus),
    );
    expect(result.current).toBe("Задерживаемся, скоро будет");
  });

  it("re-renders on the refresh interval", () => {
    const future = new Date("2026-07-18T12:30:00Z").toISOString();
    const { result } = renderHook(() =>
      useEtaText(future, "PREPARING" as OrderStatus),
    );
    expect(result.current).toBe("Будет готов через ~30 мин");
    act(() => {
      vi.advanceTimersByTime(31_000);
    });
    expect(result.current).toBe("Будет готов через ~29 мин");
  });
});
