import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  state: {
    confirmDialog: null as Record<string, unknown> | null,
    confirmLoading: false,
    cancelConfirm: vi.fn(),
    runConfirmAction: vi.fn(),
  },
}));

vi.mock("@shared/store/useModalStore", () => ({
  useModalStore: (sel: (s: unknown) => unknown) => sel(mocks.state),
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: <T,>(fn: T) => fn,
}));

import { ConfirmDialog } from "./ConfirmDialog";
import { t } from "@shared/i18n/useTranslation";

const openDialog = (overrides: Record<string, unknown> = {}) => {
  mocks.state.confirmDialog = {
    title: "Удалить заказ?",
    message: "Это действие необратимо",
    confirmLabel: "Удалить",
    danger: true,
    onConfirm: vi.fn(),
    ...overrides,
  };
};

beforeEach(() => {
  mocks.state.confirmDialog = null;
  mocks.state.confirmLoading = false;
  mocks.state.cancelConfirm = vi.fn();
  mocks.state.runConfirmAction = vi.fn();
});

describe("ConfirmDialog", () => {
  it("renders nothing when there is no dialog", () => {
    const { container } = render(<ConfirmDialog />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the dialog title, message and confirm label", () => {
    openDialog();
    render(<ConfirmDialog />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Удалить заказ?")).toBeInTheDocument();
    expect(screen.getByText("Это действие необратимо")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Удалить" })).toBeInTheDocument();
  });

  it("calls cancelConfirm when the cancel button is clicked", async () => {
    const user = userEvent.setup();
    openDialog();
    render(<ConfirmDialog />);
    await user.click(screen.getByRole("button", { name: t("common.actions.cancel") }));
    expect(mocks.state.cancelConfirm).toHaveBeenCalled();
  });

  it("calls runConfirmAction when the confirm button is clicked", async () => {
    const user = userEvent.setup();
    openDialog();
    render(<ConfirmDialog />);
    await user.click(screen.getByRole("button", { name: "Удалить" }));
    expect(mocks.state.runConfirmAction).toHaveBeenCalled();
  });

  it("cancels on Escape", async () => {
    const user = userEvent.setup();
    openDialog();
    render(<ConfirmDialog />);
    await user.keyboard("{Escape}");
    expect(mocks.state.cancelConfirm).toHaveBeenCalled();
  });

  it("shows a loading label and disables buttons while loading", () => {
    openDialog();
    mocks.state.confirmLoading = true;
    render(<ConfirmDialog />);
    expect(screen.getByText(t("common.actions.running"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("common.actions.cancel") })).toBeDisabled();
  });

  it("renders a non-danger dialog with the fire accent", () => {
    openDialog({ danger: false, confirmLabel: "OK" });
    render(<ConfirmDialog />);
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });

  it("cancels when the overlay backdrop is pressed", () => {
    openDialog();
    render(<ConfirmDialog />);
    const overlay = screen.getByRole("dialog").parentElement as HTMLElement;
    fireEvent.mouseDown(overlay);
    expect(mocks.state.cancelConfirm).toHaveBeenCalled();
  });

  it("does not cancel via the overlay or Escape while loading", () => {
    openDialog();
    mocks.state.confirmLoading = true;
    render(<ConfirmDialog />);
    const overlay = screen.getByRole("dialog").parentElement as HTMLElement;
    fireEvent.mouseDown(overlay);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mocks.state.cancelConfirm).not.toHaveBeenCalled();
  });
});
