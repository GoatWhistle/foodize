import { describe, it, expect } from "vitest";
import { makeId } from "@shared/utils/id";

describe("makeId", () => {
  it("returns a UUID-shaped string", () => {
    const id = makeId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("returns unique values", () => {
    expect(makeId()).not.toBe(makeId());
  });
});
