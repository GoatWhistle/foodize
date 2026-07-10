import type { FormEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Star, X, ChatCircleText, PencilSimple } from "@phosphor-icons/react";
import Pagination from "@shared/components/Pagination/Pagination";
import ReviewCard from "@shared/components/ReviewCard/ReviewCard";
import StarRatingInput from "@shared/components/StarRatingInput/StarRatingInput";
import type { Review } from "@shared/types/models";
import s from "./ReviewsModal.module.css";

interface ReviewForm {
  rating: number;
  text: string;
}

interface ReviewsUser {
  id: string;
}

interface SubmitPayload {
  myReview: Review | null;
  onSuccess: () => void;
}

interface ReviewsModalProps {
  rating?: number | null;
  reviewsList: Review[];
  reviewsLoading: boolean;
  reviewForm: ReviewForm;
  setReviewForm: (form: ReviewForm) => void;
  reviewError?: string | null;
  reviewSuccess?: boolean;
  currentUser?: ReviewsUser | null;
  onClose?: () => void;
  onSubmit: (payload: SubmitPayload | FormEvent<HTMLFormElement>) => void;
  onDeleteWithConfirm: (id: string) => void;
  reviewsPage: number;
  setReviewsPage: (page: number) => void;
  reviewsTotal: number;
  reviewFormOpen?: boolean;
  setReviewFormOpen?: (open: boolean) => void;
  myReview?: Review | null;
  otherReviews: Review[];
  canReview?: boolean;
  usePortal?: boolean;
  showPagination?: boolean;
  editableForm?: boolean;
  splitOwnReviews?: boolean;
  showRatingInHeader?: boolean;
  pageSize?: number;
  successText?: string;
  submitLabel?: string;
}

const ReviewsModal = ({
  rating = null,
  reviewsList,
  reviewsLoading,
  reviewForm,
  setReviewForm,
  reviewError,
  reviewSuccess,
  currentUser,
  onClose,
  onSubmit,
  onDeleteWithConfirm,
  reviewsPage,
  setReviewsPage,
  reviewsTotal,
  reviewFormOpen,
  setReviewFormOpen,
  myReview = null,
  otherReviews,
  canReview = false,
  usePortal = false,
  showPagination = false,
  editableForm = false,
  splitOwnReviews = false,
  showRatingInHeader = false,
  pageSize = 10,
  successText = "Отзыв успешно опубликован",
  submitLabel = "Опубликовать",
}: ReviewsModalProps) => {
  const openReviewForm = () => {
    setReviewForm(
      myReview
        ? { rating: myReview.rating, text: myReview.text ?? "" }
        : { rating: 5, text: "" },
    );
    setReviewFormOpen?.(true);
  };

  const formOpen = editableForm ? reviewFormOpen : true;

  const renderReviewCard = (review: Review, ownActions = false): ReactNode => {
    const isOwn = currentUser?.id === review.user_id;
    return (
      <ReviewCard
        key={review.id}
        review={review}
        showAvatar
        showVerifiedBadge
        canDelete={isOwn}
        onDelete={() => onDeleteWithConfirm(review.id)}
        className={isOwn ? "review-card--own" : undefined}
        headerExtra={isOwn ? <span className={s.ownBadge}>Вы</span> : null}
        actionsExtra={
          ownActions && isOwn ? (
            <button
              type="button"
              aria-label="Редактировать отзыв"
              onClick={openReviewForm}
              className={s.editBtn}
            >
              <PencilSimple size={13} weight="bold" />
            </button>
          ) : null
        }
      />
    );
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editableForm) {
      onSubmit({ myReview, onSuccess: () => setReviewFormOpen?.(false) });
    } else {
      onSubmit(e);
    }
  };

  const modal: ReactNode = (
    <div className={s.overlay} style={{ zIndex: 3000 }}>
      <div className={s.content}>
        <div className={s.header}>
          <div className={s.headerTitle}>
            <h2 className={s.title}>Отзывы</h2>
            {showRatingInHeader && rating != null && (
              <span className={s.headerRating}>
                <Star size={14} weight="fill" color="var(--star)" />
                {Number(rating).toFixed(1)}
              </span>
            )}
          </div>
          <div className={s.headerActions}>
            {editableForm && canReview && !reviewFormOpen && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={openReviewForm}
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                {myReview ? (
                  <><PencilSimple size={13} weight="bold" /> Редактировать</>
                ) : (
                  <><Star size={13} weight="bold" /> Оставить отзыв</>
                )}
              </button>
            )}
            <button onClick={onClose} className={s.closeBtn} aria-label="Закрыть">
              <X size={24} weight="bold" />
            </button>
          </div>
        </div>

        <div className={s.scroll}>
          {formOpen && (
            <div className={s.formCard}>
              {editableForm && (
                <div className={s.formHead}>
                  <span className={s.formHeadTitle}>
                    {myReview ? "Редактировать отзыв" : "Оставить отзыв"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReviewFormOpen?.(false)}
                    className={s.closeBtn}
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSubmit} className={s.form}>
                <div className={s.formRating}>
                  <StarRatingInput
                    value={reviewForm.rating}
                    onChange={(r) => setReviewForm({ ...reviewForm, rating: r })}
                    size={28}
                    activeColor="var(--amber)"
                  />
                </div>
                <textarea
                  className="form-input"
                  placeholder="Ваш отзыв..."
                  value={reviewForm.text}
                  onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                  style={{ minHeight: 72 }}
                />
                {reviewError && <div className="form-error">{reviewError}</div>}
                <button type="submit" className="btn btn-primary btn-full">
                  {myReview ? "Сохранить" : submitLabel}
                </button>
              </form>
            </div>
          )}

          {reviewSuccess && <div className={s.success}>{successText}</div>}

          {reviewsLoading && reviewsList.length === 0 ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : reviewsList.length === 0 ? (
            <div className={s.empty}>
              <ChatCircleText size={36} style={{ opacity: 0.4 }} />
              <div className={s.emptyTitle}>Отзывов пока нет</div>
              <div className={s.emptyHint}>Будьте первым, кто оставит отзыв!</div>
            </div>
          ) : (
            <div className={s.list}>
              {splitOwnReviews ? (
                <>
                  {myReview && renderReviewCard(myReview, editableForm)}
                  {otherReviews.map((r) => renderReviewCard(r, editableForm))}
                </>
              ) : (
                reviewsList.map((r) => renderReviewCard(r, false))
              )}
              {showPagination && (
                <Pagination
                  page={reviewsPage}
                  totalPages={Math.ceil(reviewsTotal / pageSize)}
                  onPageChange={setReviewsPage}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return usePortal ? createPortal(modal, document.body) : modal;
};

export default ReviewsModal;
