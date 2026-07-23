import { router } from "expo-router";
import {
  extractOrderTarget,
  handleDeepLink,
  navigateToTarget,
  parseDeepLink,
} from "@/services/deepLinks";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("expo-linking", () => ({
  parse: (url: string) => {
    if (url === "throw") throw new Error("bad url");
    if (url.startsWith("path:")) {
      return { hostname: null, path: url.slice("path:".length) };
    }
    if (url === "nopath") {
      return { hostname: "order", path: null };
    }
    const withoutScheme = url.replace(/^foodize:\/\//, "");
    const hostAndPath = withoutScheme.split("?")[0] ?? "";
    const [hostname, ...segments] = hostAndPath.split("/");
    return { hostname, path: segments.join("/") };
  },
}));

const mockedPush = jest.mocked(router.push);

describe("deepLinks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null for empty input", () => {
    expect(parseDeepLink(null)).toBeNull();
    expect(parseDeepLink(undefined)).toBeNull();
  });

  it("returns null when parsing throws", () => {
    expect(parseDeepLink("throw")).toBeNull();
  });

  it("parses an order deep link", () => {
    expect(parseDeepLink("foodize://order/abc123")).toEqual({ type: "order", id: "abc123" });
  });

  it("parses a restaurant deep link", () => {
    expect(parseDeepLink("foodize://restaurant/rest-9")).toEqual({
      type: "restaurant",
      id: "rest-9",
    });
  });

  it("returns null for an unknown target", () => {
    expect(parseDeepLink("foodize://unknown/1")).toBeNull();
  });

  it("returns null when the id is missing", () => {
    expect(parseDeepLink("foodize://order/")).toBeNull();
  });

  it("returns null for an invalid id", () => {
    expect(parseDeepLink("foodize://order/has space")).toBeNull();
  });

  it("parses a path-based order link without a hostname", () => {
    expect(parseDeepLink("path:/order/o-77")).toEqual({ type: "order", id: "o-77" });
  });

  it("parses a path-based restaurant link without a hostname", () => {
    expect(parseDeepLink("path:/restaurant/r-77")).toEqual({ type: "restaurant", id: "r-77" });
  });

  it("returns null when there is no path", () => {
    expect(parseDeepLink("nopath")).toBeNull();
  });

  it("navigates to an order target", () => {
    expect(navigateToTarget({ type: "order", id: "o1" })).toBe(true);
    expect(mockedPush).toHaveBeenCalledWith({ pathname: "/order/[id]", params: { id: "o1" } });
  });

  it("navigates to a restaurant target", () => {
    expect(navigateToTarget({ type: "restaurant", id: "r1" })).toBe(true);
    expect(mockedPush).toHaveBeenCalledWith({
      pathname: "/restaurant/[id]",
      params: { id: "r1" },
    });
  });

  it("does not navigate for a null target", () => {
    expect(navigateToTarget(null)).toBe(false);
    expect(mockedPush).not.toHaveBeenCalled();
  });

  it("handles a deep link end to end", () => {
    expect(handleDeepLink("foodize://order/xyz")).toBe(true);
    expect(mockedPush).toHaveBeenCalled();
  });

  it("returns false for an unhandled deep link", () => {
    expect(handleDeepLink("foodize://nowhere/1")).toBe(false);
  });

  it("extracts an order target from push data", () => {
    expect(extractOrderTarget({ orderId: "o42" })).toEqual({ type: "order", id: "o42" });
    expect(extractOrderTarget({ order_id: "o43" })).toEqual({ type: "order", id: "o43" });
  });

  it("returns null when push data has no order id", () => {
    expect(extractOrderTarget(null)).toBeNull();
    expect(extractOrderTarget({})).toBeNull();
    expect(extractOrderTarget({ orderId: 5 })).toBeNull();
  });
});
