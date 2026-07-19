import { describe, it, expect, vi, afterEach } from "vitest";
import { logError } from "@shared/utils/logError";

describe("logError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs the context tag and error via console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("boom");
    logError("myContext", error);
    expect(spy).toHaveBeenCalledWith("[myContext]", error);
  });

  it("handles non-Error values", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logError("ctx", "some string");
    expect(spy).toHaveBeenCalledWith("[ctx]", "some string");
  });
});
