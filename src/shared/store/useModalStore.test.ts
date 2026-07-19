import { describe, it, expect, vi, beforeEach } from "vitest";
import { useModalStore } from "@shared/store/useModalStore";

describe("useModalStore", () => {
  beforeEach(() => {
    useModalStore.setState({ confirmDialog: null, confirmLoading: false });
  });

  it("requestConfirm stores the dialog config", () => {
    useModalStore.getState().requestConfirm({ title: "Delete?" });
    expect(useModalStore.getState().confirmDialog).toEqual({ title: "Delete?" });
  });

  it("runConfirmAction is a no-op when there is no dialog", async () => {
    await useModalStore.getState().runConfirmAction();
    expect(useModalStore.getState().confirmLoading).toBe(false);
  });

  it("runConfirmAction is a no-op when the dialog has no onConfirm", async () => {
    useModalStore.getState().requestConfirm({ title: "x" });
    await useModalStore.getState().runConfirmAction();
    expect(useModalStore.getState().confirmDialog).toEqual({ title: "x" });
  });

  it("runConfirmAction runs onConfirm and clears the dialog", async () => {
    const onConfirm = vi.fn(() => Promise.resolve());
    useModalStore.getState().requestConfirm({ onConfirm });
    await useModalStore.getState().runConfirmAction();
    expect(onConfirm).toHaveBeenCalled();
    expect(useModalStore.getState().confirmDialog).toBeNull();
    expect(useModalStore.getState().confirmLoading).toBe(false);
  });

  it("runConfirmAction clears loading even when onConfirm throws", async () => {
    const onConfirm = vi.fn(() => Promise.reject(new Error("boom")));
    useModalStore.getState().requestConfirm({ onConfirm });
    await expect(
      useModalStore.getState().runConfirmAction(),
    ).rejects.toThrow("boom");
    expect(useModalStore.getState().confirmLoading).toBe(false);
    expect(useModalStore.getState().confirmDialog).toBeNull();
  });

  it("cancelConfirm resets dialog and loading", () => {
    useModalStore.setState({
      confirmDialog: { title: "x" },
      confirmLoading: true,
    });
    useModalStore.getState().cancelConfirm();
    expect(useModalStore.getState().confirmDialog).toBeNull();
    expect(useModalStore.getState().confirmLoading).toBe(false);
  });
});
