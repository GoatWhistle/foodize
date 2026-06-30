import { Star, X, ChatCircleText, PencilSimple, ShoppingBag, Trash } from '@phosphor-icons/react';
import Pagination from '@shared/components/Pagination/Pagination';
import { formatReviewTime } from '@shared/utils/formatReviewTime.js';

const ReviewCard = ({ r, currentUserId, onEdit, onDelete }) => (
  <div
    style={{
      padding: '16px',
      background: r.user_id === currentUserId ? 'var(--fire-subtle)' : 'var(--bg-card)',
      border: `1px solid ${r.user_id === currentUserId ? 'var(--fire)' : 'var(--border)'}`,
      borderRadius: 'var(--r-md)',
      opacity: r.user_id === currentUserId ? 1 : 0.95,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: r.text ? 10 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--fire), var(--amber))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
          }}
        >
          {r.user_id?.slice(0, 1).toUpperCase() || 'U'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {r.user_name || 'Клиент'}
            {r.user_id === currentUserId && (
              <span style={{ fontSize: '0.7rem', color: 'var(--fire)', fontWeight: 700 }}>Вы</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{ display: 'flex', gap: 1, color: 'var(--fire)' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={11} weight={i < r.rating ? 'fill' : 'regular'} />
              ))}
            </div>
            {formatReviewTime(r.created_at) && (
              <span style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>
                {formatReviewTime(r.created_at)}
              </span>
            )}
          </div>
          {r.is_verified_purchase && (
            <span className="verified-purchase-badge" style={{ marginTop: 3 }}>
              <ShoppingBag size={10} weight="fill" />
              Подтверждённый заказ
            </span>
          )}
        </div>
      </div>
      {r.user_id === currentUserId && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            aria-label="Редактировать отзыв"
            onClick={onEdit}
            style={{ width: 28, height: 28, borderRadius: 'var(--r-xs)', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <PencilSimple size={13} weight="bold" />
          </button>
          <button
            type="button"
            aria-label="Удалить отзыв"
            onClick={onDelete}
            style={{ width: 28, height: 28, borderRadius: 'var(--r-xs)', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Trash size={13} weight="bold" />
          </button>
        </div>
      )}
    </div>
    {r.text && (
      <p style={{ color: 'var(--text-2)', margin: 0, lineHeight: 1.6, fontSize: '0.875rem' }}>
        {r.text}
      </p>
    )}
  </div>
);

const ReviewsModal = ({
  rating,
  reviewsList,
  reviewsPage,
  setReviewsPage,
  reviewsTotal,
  reviewForm,
  setReviewForm,
  reviewsLoading,
  reviewError,
  reviewSuccess,
  reviewFormOpen,
  setReviewFormOpen,
  myReview,
  otherReviews,
  canReview,
  currentUser,
  onClose,
  onSubmit,
  onDeleteWithConfirm,
}) => {
  const openReviewForm = () => {
    setReviewForm(
      myReview
        ? { rating: myReview.rating, text: myReview.text ?? '' }
        : { rating: 5, text: '' }
    );
    setReviewFormOpen(true);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '28px 28px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
              Отзывы
            </h2>
            {rating != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-2)', fontSize: '0.9rem' }}>
                <Star size={14} weight="fill" color="#fbbf24" />
                {Number(rating).toFixed(1)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {canReview && !reviewFormOpen && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={openReviewForm}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {myReview ? (
                  <><PencilSimple size={13} weight="bold" /> Редактировать</>
                ) : (
                  <><Star size={13} weight="bold" /> Оставить отзыв</>
                )}
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
              <X size={26} weight="bold" />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 28 }}>
          {reviewFormOpen && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-1)' }}>
                  {myReview ? 'Редактировать отзыв' : 'Оставить отзыв'}
                </span>
                <button type="button" onClick={() => setReviewFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                  <X size={18} weight="bold" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmit({ myReview, onSuccess: () => setReviewFormOpen(false) });
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`rating-star${s <= reviewForm.rating ? ' rating-star--selected' : ''}`}
                      size={30}
                      weight={s <= reviewForm.rating ? 'fill' : 'regular'}
                      onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                    />
                  ))}
                </div>
                <textarea
                  className="form-input"
                  placeholder="Ваш отзыв (необязательно)..."
                  value={reviewForm.text}
                  onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                  style={{ borderRadius: 'var(--r-md)', background: 'var(--bg-card)', minHeight: '72px' }}
                />
                {reviewError && <div className="form-error">{reviewError}</div>}
                <button type="submit" className="btn btn-primary btn-full" style={{ borderRadius: 'var(--r-md)' }}>
                  {myReview ? 'Сохранить' : 'Опубликовать'}
                </button>
              </form>
            </div>
          )}

          {reviewSuccess && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--color-success)', color: '#fff', fontSize: '0.86rem', fontWeight: 800, marginBottom: 12 }}>
              Отзыв успешно сохранён
            </div>
          )}

          {reviewsLoading && reviewsList.length === 0 ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : reviewsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
              <ChatCircleText size={36} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div style={{ fontWeight: 600 }}>Отзывов пока нет</div>
              <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Будьте первым, кто оставит отзыв!</div>
            </div>
          ) : (
            <div className={reviewsLoading ? 'loading-dim' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myReview && (
                <ReviewCard
                  r={myReview}
                  currentUserId={currentUser?.id}
                  onEdit={openReviewForm}
                  onDelete={() => onDeleteWithConfirm(myReview.id)}
                />
              )}
              {otherReviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  r={r}
                  currentUserId={currentUser?.id}
                  onEdit={openReviewForm}
                  onDelete={() => onDeleteWithConfirm(r.id)}
                />
              ))}
              <Pagination
                page={reviewsPage}
                totalPages={Math.ceil(reviewsTotal / 10)}
                onPageChange={setReviewsPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
