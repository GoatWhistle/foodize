import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { InfoModal } from "@shared/components/InfoModal/InfoModal";
import type { Restaurant } from "@shared/types/models";
import { t } from "@shared/i18n/useTranslation";

const workingHours = [
  { day_of_week: 1, is_open: true, opening_time: "09:00:00", closing_time: "22:00:00" },
  { day_of_week: 2, is_open: false, opening_time: "00:00:00", closing_time: "00:00:00" },
];

describe("InfoModal", () => {
  it("renders the heading and working hours block", () => {
    render(<InfoModal workingHours={workingHours} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: t("catalog.info.title") })).toBeInTheDocument();
    expect(screen.getByText(t("catalog.info.workingHours"))).toBeInTheDocument();
    expect(screen.getByText("09:00 - 22:00")).toBeInTheDocument();
    expect(screen.getByText(t("catalog.info.dayOff"))).toBeInTheDocument();
  });

  it("shows a fallback when there are no working hours", () => {
    render(<InfoModal workingHours={[]} onClose={vi.fn()} />);
    expect(screen.getByText(t("catalog.info.notSpecified"))).toBeInTheDocument();
  });

  it("renders the restaurant description when enabled", () => {
    const restaurant = { description: "Лучшая шаурма" } as Restaurant;
    render(
      <InfoModal workingHours={[]} onClose={vi.fn()} restaurant={restaurant} showDescription />,
    );
    expect(screen.getByText("Лучшая шаурма")).toBeInTheDocument();
  });

  it("hides the description when showDescription is false", () => {
    const restaurant = { description: "Лучшая шаурма" } as Restaurant;
    render(<InfoModal workingHours={[]} onClose={vi.fn()} restaurant={restaurant} />);
    expect(screen.queryByText("Лучшая шаурма")).not.toBeInTheDocument();
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InfoModal workingHours={workingHours} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: t("common.actions.close") }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the overlay is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InfoModal workingHours={workingHours} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement as HTMLElement;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InfoModal workingHours={workingHours} onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside the dialog content", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InfoModal workingHours={workingHours} onClose={onClose} />);
    await user.click(screen.getByRole("heading", { name: t("catalog.info.title") }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders through a portal when usePortal is set", () => {
    render(
      <InfoModal workingHours={workingHours} onClose={vi.fn()} usePortal />,
    );
    expect(
      screen.getByRole("heading", { name: t("catalog.info.title") }),
    ).toBeInTheDocument();
  });

  it("falls back to a shifted weekday label for 1-based day indices", () => {
    render(
      <InfoModal
        workingHours={[
          {
            day_of_week: 7,
            is_open: true,
            opening_time: "10:00:00",
            closing_time: "18:00:00",
          },
        ]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("10:00 - 18:00")).toBeInTheDocument();
  });
});
