import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ReviewsModal } from "@shared/components/ReviewsModal/ReviewsModal";
import { t } from "@shared/i18n/useTranslation";
import { makeReview, baseProps } from "./reviewsModalTestUtils";

describe("ReviewsModal form", () => {
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
