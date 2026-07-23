import type { Dispatch, SetStateAction } from 'react';
import { TrashIcon, StarIcon } from '@phosphor-icons/react';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { AdminReview } from '../hooks/useAdminReviews';

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
};

const shortId = (value?: string | null) => (value ? value.slice(0, 8) : '—');

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface AdminReviewCardProps {
  review: AdminReview;
  selectedReviewIds: Set<string>;
  setSelectedReviewIds: Dispatch<SetStateAction<Set<string>>>;
  handleDeleteReview: (reviewId: string) => void;
}

export function AdminReviewCard({
  review,
  selectedReviewIds,
  setSelectedReviewIds,
  handleDeleteReview,
}: AdminReviewCardProps) {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
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
            <span className="order-status-badge pending"><StarIcon size={14} weight="fill" color="var(--star)" /> {review.rating}</span>
            {review.is_verified_purchase && (
              <span className="order-status-badge ready">{t('admin.reviews.verifiedPurchase')}</span>
            )}
          </div>
          <div
            style={{ color: 'var(--text-3)', fontSize: "var(--text-base)", marginTop: 6 }}
          >
            {review.user_name || review.user_phone || shortId(review.user_id)}{' '}
            · {formatDateTime(review.created_at)}
          </div>
          {review.text && (
            <div
              style={{
                color: 'var(--text-2)',
                fontSize: "var(--text-base)",
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
          onClick={() => { handleDeleteReview(review.id); }}
          title={t('admin.reviews.deleteTitle')}
          style={{ color: 'var(--error)', flexShrink: 0 }}
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
}
