import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ReviewsModal } from "@shared/components/ReviewsModal/ReviewsModal";
import { t } from "@shared/i18n/useTranslation";
import { makeReview, baseProps } from "./reviewsModalTestUtils";

describe("ReviewsModal display", () => {
  it("renders the modal dialog with a title", () => {
    render(<ReviewsModal {...baseProps()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: t("catalog.reviews.title") })).toBeInTheDocument();
  });

  it("shows the empty state when there are no reviews", () => {
    render(<ReviewsModal {...baseProps()} />);
    expect(screen.getByText(t("catalog.reviews.emptyTitle"))).toBeInTheDocument();
    expect(screen.getByText(t("catalog.reviews.emptyHint"))).toBeInTheDocument();
  });

  it("shows a spinner while loading with no reviews", () => {
    const { container } = render(<ReviewsModal {...baseProps({ reviewsLoading: true })} />);
    expect(container.querySelector(".spinner")).toBeInTheDocument();
    expect(screen.queryByText(t("catalog.reviews.emptyTitle"))).not.toBeInTheDocument();
  });

  it("renders the reviews list when populated", () => {
    const reviews = [
      makeReview({ id: "a", user_name: "Аня", text: "Отлично" }),
      makeReview({ id: "b", user_name: "Борис", text: "Неплохо" }),
    ];
    render(<ReviewsModal {...baseProps({ reviewsList: reviews })} />);
    expect(screen.getByText("Аня")).toBeInTheDocument();
    expect(screen.getByText("Борис")).toBeInTheDocument();
    expect(screen.getByText("Отлично")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ReviewsModal {...baseProps({ onClose })} />);
    await user.click(screen.getByRole("button", { name: t("common.actions.close") }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape via the focus trap", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ReviewsModal {...baseProps({ onClose })} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the success message when reviewSuccess is set", () => {
    render(<ReviewsModal {...baseProps({ reviewSuccess: true })} />);
    expect(screen.getByText(t("catalog.reviews.published"))).toBeInTheDocument();
  });

  it("renders the rating in the header when enabled", () => {
    render(<ReviewsModal {...baseProps()} rating={4.7} showRatingInHeader />);
    expect(screen.getByText("4.7")).toBeInTheDocument();
  });

  it("splits own and other reviews when splitOwnReviews is set", () => {
    const myReview = makeReview({ id: "mine", user_id: "me", user_name: "Я", text: "мой отзыв" });
    const other = makeReview({ id: "o1", user_id: "other", user_name: "Другой", text: "чужой" });
    render(
      <ReviewsModal
        {...baseProps({ reviewsList: [myReview, other], currentUser: { id: "me" } })}
        splitOwnReviews
        otherReviews={[other]}
        myReview={myReview}
      />,
    );
    expect(screen.getByText("Я")).toBeInTheDocument();
    expect(screen.getByText("Другой")).toBeInTheDocument();
    expect(screen.getByText(t("catalog.reviews.ownBadge"))).toBeInTheDocument();
  });

  it("renders pagination when showPagination and multiple pages exist", () => {
    const reviews = [makeReview({ id: "a" })];
    render(
      <ReviewsModal
        {...baseProps({ reviewsList: reviews })}
        showPagination
        reviewsTotal={25}
        pageSize={10}
        reviewsPage={1}
      />,
    );
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("renders through a portal when usePortal is set", () => {
    render(<ReviewsModal {...baseProps()} usePortal />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
