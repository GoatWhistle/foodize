import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { StarRatingInput } from "@shared/components/StarRatingInput/StarRatingInput";
import { t } from "@shared/i18n/useTranslation";

describe("StarRatingInput", () => {
  it("renders five interactive stars by default", () => {
    render(<StarRatingInput />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.getByLabelText(t("catalog.reviews.ratingAria", { value: 1 }))).toBeInTheDocument();
    expect(screen.getByLabelText(t("catalog.reviews.ratingAria", { value: 5 }))).toBeInTheDocument();
  });

  it("calls onChange with the clicked star value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRatingInput value={0} onChange={onChange} />);
    await user.click(screen.getByLabelText(t("catalog.reviews.ratingAria", { value: 4 })));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("selects a rating via the Enter key", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRatingInput onChange={onChange} />);
    screen.getByLabelText(t("catalog.reviews.ratingAria", { value: 3 })).focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("selects a rating via the Space key", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StarRatingInput onChange={onChange} />);
    screen.getByLabelText(t("catalog.reviews.ratingAria", { value: 2 })).focus();
    await user.keyboard("[Space]");
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("renders no interactive buttons in readOnly mode", () => {
    render(<StarRatingInput value={3} readOnly />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(t("catalog.reviews.ratingAria", { value: 1 }))).not.toBeInTheDocument();
  });

  it("does not throw when clicked without an onChange handler", async () => {
    const user = userEvent.setup();
    render(<StarRatingInput value={1} />);
    await user.click(screen.getByLabelText(t("catalog.reviews.ratingAria", { value: 5 })));
    expect(screen.getByLabelText(t("catalog.reviews.ratingAria", { value: 5 }))).toBeInTheDocument();
  });
});
