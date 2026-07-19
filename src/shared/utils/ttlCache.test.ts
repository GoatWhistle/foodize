import { describe, it, expect, afterEach, vi } from "vitest";
import { createTtlCache } from "@shared/utils/ttlCache";

describe("createTtlCache", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores and retrieves values", () => {
    const cache = createTtlCache<number>(1000);
    cache.set("a", 42);
    expect(cache.get("a")).toBe(42);
  });

  it("returns undefined for a missing key", () => {
    const cache = createTtlCache<number>(1000);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("expires entries after the ttl and evicts them", () => {
    const nowSpy = vi.spyOn(performance, "now");
    nowSpy.mockReturnValue(0);
    const cache = createTtlCache<string>(100);
    cache.set("k", "v");
    nowSpy.mockReturnValue(50);
    expect(cache.get("k")).toBe("v");
    nowSpy.mockReturnValue(200);
    expect(cache.get("k")).toBeUndefined();
    nowSpy.mockReturnValue(250);
    expect(cache.get("k")).toBeUndefined();
  });

  it("clear removes all entries", () => {
    const cache = createTtlCache<number>(1000);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
  });
});
