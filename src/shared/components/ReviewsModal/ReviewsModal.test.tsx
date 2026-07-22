import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ReviewsModal } from "@shared/components/ReviewsModal/ReviewsModal";
import type { Review } from "@shared/types/models";
import { t } from "@shared/i18n/useTranslation";

const makeReview = (over: Partial<Review> = {}): Review => ({
  id: "r1",
  user_id: "user-1",
  user_name: "Мария",
  restaurant_id: "rest-1",
  rating: 5,
  text: "Замечательно",
  is_verified_purchase: false,
  created_at: "2026-01-15T12:30:00Z",
  ...over,
});

interface Overrides {
  reviewsList?: Review[];
  reviewsLoading?: boolean;
  reviewSuccess?: boolean;
  reviewError?: string | null;
  onClose?: () => void;
  onSubmit?: (payload: unknown) => void;
  onDeleteWithConfirm?: (id: string) => void;
  setReviewForm?: (form: { rating: number; text: string }) => void;
  currentUser?: { id: string } | null;
}

const baseProps = (over: Overrides = {}) => ({
  reviewsList: over.reviewsList ?? [],
  reviewsLoading: over.reviewsLoading ?? false,
  reviewForm: { rating: 5, text: "" },
  setReviewForm: over.setReviewForm ?? vi.fn(),
  reviewError: over.reviewError ?? null,
  reviewSuccess: over.reviewSuccess ?? false,
  currentUser: over.currentUser ?? null,
  onClose: over.onClose ?? vi.fn(),
  onSubmit: over.onSubmit ?? vi.fn(),
  onDeleteWithConfirm: over.onDeleteWithConfirm ?? vi.fn(),
  reviewsPage: 1,
  setReviewsPage: vi.fn(),
  reviewsTotal: 0,
  otherReviews: [],
});

describe("ReviewsModal", () => {
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

  it("submits the always-open form and calls onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReviewsModal {...baseProps({ onSubmit })} />);
    await user.click(screen.getByRole("button", { name: t("catalog.reviews.submit") }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("updates the review text through the textarea", async () => {
    const user = userEvent.setup();
    const setReviewForm = vi.fn();
    render(<ReviewsModal {...baseProps({ setReviewForm })} />);
    await user.type(screen.getByPlaceholderText(t("catalog.reviews.textPlaceholder")), "Х");
    expect(setReviewForm).toHaveBeenCalledWith({ rating: 5, text: "Х" });
  });

  it("shows a form error when provided", () => {
    render(<ReviewsModal {...baseProps({ reviewError: "Ошибка отправки" })} />);
    expect(screen.getByText("Ошибка отправки")).toBeInTheDocument();
  });

  it("renders the rating in the header when enabled", () => {
    render(<ReviewsModal {...baseProps()} rating={4.7} showRatingInHeader />);
    expect(screen.getByText("4.7")).toBeInTheDocument();
  });

  it("shows the leave-review button in editable mode when the form is closed", async () => {
    const user = userEvent.setup();
    const setReviewFormOpen = vi.fn();
    render(
      <ReviewsModal
        {...baseProps()}
        editableForm
        canReview
        reviewFormOpen={false}
        setReviewFormOpen={setReviewFormOpen}
      />,
    );
    const openButton = screen.getByRole("button", { name: t("catalog.reviews.leave") });
    expect(openButton).toBeInTheDocument();
    await user.click(openButton);
    expect(setReviewFormOpen).toHaveBeenCalledWith(true);
    expect(screen.queryByPlaceholderText(t("catalog.reviews.textPlaceholder"))).not.toBeInTheDocument();
  });

  it("submits the editable form with a success callback payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ReviewsModal
        {...baseProps({ onSubmit })}
        editableForm
        canReview
        reviewFormOpen
        setReviewFormOpen={vi.fn()}
        myReview={makeReview({ id: "mine", text: "старый" })}
      />,
    );
    await user.click(screen.getByRole("button", { name: t("common.actions.save") }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ onSuccess: expect.any(Function) as unknown }),
    );
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

  it("renders the editable form head and closes it via the X button", async () => {
    const user = userEvent.setup();
    const setReviewFormOpen = vi.fn();
    render(
      <ReviewsModal
        {...baseProps()}
        editableForm
        canReview
        reviewFormOpen
        setReviewFormOpen={setReviewFormOpen}
        myReview={makeReview({ id: "mine", text: "старый" })}
      />,
    );
    const formHeadTitle = screen.getByText(t("catalog.reviews.editTitle"));
    const formHead = formHeadTitle.parentElement as HTMLElement;
    const formHeadClose = formHead.querySelector("button") as HTMLButtonElement;
    await user.click(formHeadClose);
    expect(setReviewFormOpen).toHaveBeenCalledWith(false);
  });

  it("shows the edit button in the header when a review already exists", () => {
    render(
      <ReviewsModal
        {...baseProps()}
        editableForm
        canReview
        reviewFormOpen={false}
        setReviewFormOpen={vi.fn()}
        myReview={makeReview({ id: "mine" })}
      />,
    );
    expect(
      screen.getByRole("button", { name: t("catalog.reviews.edit") }),
    ).toBeInTheDocument();
  });

  it("invokes the editable onSubmit success callback which closes the form", async () => {
    const user = userEvent.setup();
    const setReviewFormOpen = vi.fn();
    const onSubmit = vi.fn(
      (payload: { onSuccess: () => void }) => { payload.onSuccess(); },
    );
    render(
      <ReviewsModal
        {...baseProps({ onSubmit: onSubmit as (p: unknown) => void })}
        editableForm
        canReview
        reviewFormOpen
        setReviewFormOpen={setReviewFormOpen}
        myReview={makeReview({ id: "mine" })}
      />,
    );
    await user.click(screen.getByRole("button", { name: t("common.actions.save") }));
    expect(setReviewFormOpen).toHaveBeenCalledWith(false);
  });

  it("updates the rating via the star input", async () => {
    const user = userEvent.setup();
    const setReviewForm = vi.fn();
    render(<ReviewsModal {...baseProps({ setReviewForm })} />);
    await user.click(screen.getByRole("button", { name: t("catalog.reviews.ratingAria", { value: 4 }) }));
    expect(setReviewForm).toHaveBeenCalledWith({ rating: 4, text: "" });
  });

  it("shows an edit button on the own review card in split editable mode", async () => {
    const user = userEvent.setup();
    const setReviewFormOpen = vi.fn();
    const myReview = makeReview({ id: "mine", user_id: "me", text: "мой" });
    render(
      <ReviewsModal
        {...baseProps({ reviewsList: [myReview], currentUser: { id: "me" } })}
        splitOwnReviews
        editableForm
        canReview
        reviewFormOpen={false}
        setReviewFormOpen={setReviewFormOpen}
        otherReviews={[]}
        myReview={myReview}
      />,
    );
    await user.click(screen.getByRole("button", { name: t("catalog.reviews.editAria") }));
    expect(setReviewFormOpen).toHaveBeenCalledWith(true);
  });

  it("allows deleting an own review", async () => {
    const user = userEvent.setup();
    const onDeleteWithConfirm = vi.fn();
    const reviews = [makeReview({ id: "mine", user_id: "me" })];
    render(
      <ReviewsModal
        {...baseProps({
          reviewsList: reviews,
          currentUser: { id: "me" },
          onDeleteWithConfirm,
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: t("catalog.reviews.deleteAria") }));
    expect(onDeleteWithConfirm).toHaveBeenCalledWith("mine");
  });
});
