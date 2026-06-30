import { Trash } from '@phosphor-icons/react';
import Pagination from '../../../components/ui/Pagination';
import EmptyState from '../../../components/ui/EmptyState';

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
};

const shortId = (value) => (value ? value.slice(0, 8) : '—');

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminReviewsTab({
  reviews,
  reviewsLoading,
  reviewsTotal,
  reviewsPage,
  setReviewsPage,
  reviewFilters,
  setReviewFilters,
  selectedReviewIds,
  setSelectedReviewIds,
  exportLoading,
  handleExport,
  handleDeleteReview,
  todayStr,
  adminService,
  PAGE_SIZE,
}) {
  const isEmpty = !Array.isArray(reviews) || reviews.length === 0;

  if (reviewsLoading && isEmpty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: 16,
            }}
          >
            <div className="skeleton" style={{ width: '30%', height: 16, marginBottom: 8, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={reviewsLoading ? 'loading-dim' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12 }}>
        <button
          className={`btn btn-sm ${!reviewFilters.rating ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setReviewsPage(1);
            setReviewFilters({ rating: '' });
          }}
        >
          Все
        </button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            className={`btn btn-sm ${reviewFilters.rating === rating.toString() ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setReviewsPage(1);
              setReviewFilters({ rating: rating.toString() });
            }}
          >
            ★ {rating}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.82rem',
            color: 'var(--text-3)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={reviews.length > 0 && selectedReviewIds.size === reviews.length}
            onChange={(e) =>
              setSelectedReviewIds(
                e.target.checked ? new Set(reviews.map((r) => r.id)) : new Set()
              )
            }
          />
          Выбрать все
        </label>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            handleExport(
              () =>
                adminService.exportReviewsCSV({
                  min_rating: reviewFilters.rating || undefined,
                  max_rating: reviewFilters.rating || undefined,
                }),
              `отзывы_${todayStr}.csv`
            )
          }
        >
          {exportLoading ? '...' : '↓ CSV'}
        </button>
      </div>

      {reviews.map((review) => (
        <div
          key={review.id}
          style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
        >
          <input
            type="checkbox"
            checked={selectedReviewIds.has(review.id)}
            onChange={(e) => {
              setSelectedReviewIds((prev) => {
                const next = new Set(prev);
                if (e.target.checked) next.add(review.id);
                else next.delete(review.id);
                return next;
              });
            }}
            style={{ flexShrink: 0, marginTop: 18 }}
          />
          <div
            style={{
              ...cardStyle,
              padding: 16,
              flex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--text-1)', fontWeight: 900 }}>
                  {review.restaurant_name || shortId(review.restaurant_id)}
                </span>
                <span className="order-status-badge pending">★ {review.rating}</span>
                {review.is_verified_purchase && (
                  <span className="order-status-badge ready">Покупка подтверждена</span>
                )}
              </div>
              <div
                style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: 6 }}
              >
                {review.user_name || review.user_phone || shortId(review.user_id)}{' '}
                · {formatDateTime(review.created_at)}
              </div>
              {review.text && (
                <div
                  style={{
                    color: 'var(--text-2)',
                    fontSize: '0.9rem',
                    marginTop: 10,
                    lineHeight: 1.5,
                  }}
                >
                  {review.text}
                </div>
              )}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleDeleteReview(review.id)}
              title="Удалить отзыв"
              style={{ color: 'var(--error)', flexShrink: 0 }}
            >
              <Trash size={16} />
            </button>
          </div>
        </div>
      ))}

      {isEmpty && (
        <EmptyState
          title="Отзывов пока нет"
          subtitle="Для выбранных фильтров нет результатов"
        />
      )}

      <Pagination
        page={reviewsPage}
        totalPages={Math.ceil(reviewsTotal / PAGE_SIZE)}
        onPageChange={setReviewsPage}
      />
    </div>
  );
}
