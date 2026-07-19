import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ReviewCard } from "@shared/components/ReviewCard/ReviewCard";
import type { Review } from "@shared/types/models";

const baseReview: Review = {
  id: "r1",
  user_id: "user-abc",
  user_name: "Иван Петров",
  restaurant_id: "rest-1",
  rating: 4,
  text: "Очень вкусно и быстро",
  is_verified_purchase: false,
  created_at: "2026-01-15T12:30:00Z",
};

describe("ReviewCard", () => {
  it("renders author name, rating stars and text", () => {
    const { container } = render(<ReviewCard review={baseReview} />);
    expect(screen.getByText("Иван Петров")).toBeInTheDocument();
    expect(screen.getByText("Очень вкусно и быстро")).toBeInTheDocument();
    expect(container.querySelectorAll("svg")).toHaveLength(5);
  });

  it("falls back to a default author when name is missing", () => {
    render(<ReviewCard review={{ ...baseReview, user_name: null }} />);
    expect(screen.getByText("Клиент")).toBeInTheDocument();
  });

  it("omits the text paragraph when there is no review text", () => {
    render(<ReviewCard review={{ ...baseReview, text: null }} />);
    expect(screen.queryByText("Очень вкусно и быстро")).not.toBeInTheDocument();
  });

  it("renders an avatar initial when showAvatar is set", () => {
    render(<ReviewCard review={baseReview} showAvatar />);
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("shows the verified purchase badge only when both flag and prop are set", () => {
    const { rerender } = render(
      <ReviewCard review={{ ...baseReview, is_verified_purchase: true }} showVerifiedBadge />,
    );
    expect(screen.getByText("Подтверждённый заказ")).toBeInTheDocument();
    rerender(<ReviewCard review={baseReview} showVerifiedBadge />);
    expect(screen.queryByText("Подтверждённый заказ")).not.toBeInTheDocument();
  });

  it("renders a delete button and calls onDelete when canDelete is set", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<ReviewCard review={baseReview} canDelete onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: "Удалить отзыв" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not render a delete button without canDelete", () => {
    render(<ReviewCard review={baseReview} />);
    expect(screen.queryByRole("button", { name: "Удалить отзыв" })).not.toBeInTheDocument();
  });

  it("renders extra header and action nodes", () => {
    render(
      <ReviewCard
        review={baseReview}
        headerExtra={<span>Вы</span>}
        actionsExtra={<button type="button">edit</button>}
      />,
    );
    expect(screen.getByText("Вы")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "edit" })).toBeInTheDocument();
  });
});
