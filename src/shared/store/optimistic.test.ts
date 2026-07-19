import { describe, it, expect, vi } from "vitest";
import { optimisticMutation } from "./optimistic";

vi.mock("@shared/utils/logError", () => ({ logError: vi.fn() }));

interface State {
  a: number;
  b: string;
}

describe("optimisticMutation", () => {
  it("applies immediately and keeps the change when commit succeeds", async () => {
    const state: State = { a: 1, b: "x" };
    const set = vi.fn((partial: Partial<State>) => Object.assign(state, partial));
    const apply = vi.fn(() => {
      state.a = 2;
    });
    const commit = vi.fn().mockResolvedValue(undefined);

    await optimisticMutation<State, keyof State>({
      get: () => state,
      set,
      keys: ["a"],
      apply,
      commit,
      context: "test",
    });

    expect(apply).toHaveBeenCalled();
    expect(commit).toHaveBeenCalled();
    expect(state.a).toBe(2);
    expect(set).not.toHaveBeenCalled();
  });

  it("rolls back the snapshotted keys when commit rejects", async () => {
    const state: State = { a: 1, b: "x" };
    const set = vi.fn((partial: Partial<State>) => Object.assign(state, partial));
    const apply = vi.fn(() => {
      state.a = 99;
      state.b = "y";
    });
    const commit = vi.fn().mockRejectedValue(new Error("boom"));

    await optimisticMutation<State, keyof State>({
      get: () => state,
      set,
      keys: ["a", "b"],
      apply,
      commit,
      context: "test",
    });

    expect(set).toHaveBeenCalledWith({ a: 1, b: "x" });
    expect(state.a).toBe(1);
    expect(state.b).toBe("x");
  });
});
