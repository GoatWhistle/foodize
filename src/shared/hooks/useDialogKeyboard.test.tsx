import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useDialogKeyboard } from "@shared/hooks/useDialogKeyboard";

describe("useDialogKeyboard", () => {
  it("calls onEscape when active and Escape pressed", () => {
    const onEscape = vi.fn();
    renderHook(() => { useDialogKeyboard({ active: true, onEscape }); });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("does nothing for other keys", () => {
    const onEscape = vi.fn();
    renderHook(() => { useDialogKeyboard({ active: true, onEscape }); });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("does not listen when inactive", () => {
    const onEscape = vi.fn();
    renderHook(() => { useDialogKeyboard({ active: false, onEscape }); });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("restores focus to previously focused element on cleanup", () => {
    const prev = document.createElement("button");
    document.body.appendChild(prev);
    prev.focus();
    const spy = vi.spyOn(prev, "focus");
    const { unmount } = renderHook(() =>
      { useDialogKeyboard({ active: true, onEscape: vi.fn() }); },
    );
    unmount();
    expect(spy).toHaveBeenCalled();
    prev.remove();
  });

  it("removes listener after deactivation", () => {
    const onEscape = vi.fn();
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => { useDialogKeyboard({ active, onEscape }); },
      { initialProps: { active: true } },
    );
    rerender({ active: false });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).not.toHaveBeenCalled();
  });
});
