import { describe, it, expect, vi } from "vitest";
import type { KeyboardEvent } from "react";
import { activateOnKey } from "@shared/utils/a11y";

const makeEvent = (key: string) => {
  const preventDefault = vi.fn();
  const event = { key, preventDefault } as unknown as KeyboardEvent<HTMLElement>;
  return { event, preventDefault };
};

describe("activateOnKey", () => {
  it("invokes the action and prevents default on Enter", () => {
    const action = vi.fn();
    const { event, preventDefault } = makeEvent("Enter");
    activateOnKey(action)(event);
    expect(action).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("invokes the action and prevents default on Space", () => {
    const action = vi.fn();
    const { event, preventDefault } = makeEvent(" ");
    activateOnKey(action)(event);
    expect(action).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("does nothing for other keys", () => {
    const action = vi.fn();
    const { event, preventDefault } = makeEvent("Escape");
    activateOnKey(action)(event);
    expect(action).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
