import { createPortal } from "react-dom";
import { Star, Trash } from "@phosphor-icons/react";
import { formatReviewTime } from "@shared/utils/formatReviewTime.js";
import m from "../../components/ui/Modal.module.css";

const ReviewsModal = ({
  reviewsList,
  reviewsLoading,
  reviewForm,
  setReviewForm,
  reviewError,
  reviewSuccess,
  currentUser,
  onClose,
  onSubmit,
  onDelete,
}) => {
  return createPortal(
    <div className={`${m.overlay} ${m.restaurantOverlay}`} style={{ zIndex: 3000 }}>
      <div
        className={`${m.content} ${m.reviews}`}
        style={{
          maxWidth: 500,
          maxHeight: "calc(var(--tg-viewport-h, 100dvh) - 24px)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>Отзывы</span>
          <button
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className={m.reviewsScroll} style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {reviewSuccess && (
            <div
              style={{
                position: "absolute",
                top: 14,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 2,
                padding: "9px 12px",
                borderRadius: 8,
                background: "var(--success, #16a34a)",
                color: "var(--color-white, #fff)",
                fontSize: "0.82rem",
                fontWeight: 800,
                boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
              }}
            >
              Отзыв успешно опубликован
            </div>
          )}
          <form
            onSubmit={onSubmit}
            style={{ background: "var(--bg-surface)", padding: 16, borderRadius: 10, marginBottom: 16, border: "1px solid var(--border)" }}
          >
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  style={{ cursor: "pointer" }}
                  onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                >
                  <Star
                    size={24}
                    weight={s <= reviewForm.rating ? "fill" : "regular"}
                    color={s <= reviewForm.rating ? "var(--amber)" : "var(--border-mid)"}
                  />
                </span>
              ))}
            </div>
            <textarea
              className="form-input"
              placeholder="Ваш отзыв..."
              value={reviewForm.text}
              onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
              style={{ minHeight: 70, marginBottom: 8 }}
            />
            {reviewError && (
              <div className="form-error" style={{ marginBottom: 8 }}>{reviewError}</div>
            )}
            <button type="submit" className="btn btn-primary btn-full" style={{ borderRadius: 8 }}>
              Опубликовать
            </button>
          </form>
          {reviewsLoading ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : reviewsList.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-3)", fontSize: "0.875rem" }}>
              Отзывов пока нет
            </p>
          ) : (
            reviewsList.map((r) => (
              <div
                key={r.id}
                className="review-card"
                style={{
                  padding: 14,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  marginBottom: 8,
                  transition: "all var(--dur-sm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                    {r.user_name || "Клиент"}
                    {formatReviewTime(r.created_at) && (
                      <span style={{ display: "block", color: "var(--text-3)", fontSize: "0.74rem", fontWeight: 600, marginTop: 2 }}>
                        {formatReviewTime(r.created_at)}
                      </span>
                    )}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        weight={s <= r.rating ? "fill" : "regular"}
                        color={s <= r.rating ? "var(--amber)" : "var(--border-mid)"}
                      />
                    ))}
                    {currentUser?.id === r.user_id && (
                      <button
                        type="button"
                        aria-label="Удалить отзыв"
                        onClick={() => onDelete(r.id)}
                        style={{
                          width: 26,
                          height: 26,
                          marginLeft: 6,
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "var(--bg-surface)",
                          color: "var(--danger, #ef4444)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Trash size={13} weight="bold" />
                      </button>
                    )}
                  </span>
                </div>
                <p style={{ color: "var(--text-2)", margin: 0, fontSize: "0.875rem", lineHeight: 1.5 }}>
                  {r.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ReviewsModal;
