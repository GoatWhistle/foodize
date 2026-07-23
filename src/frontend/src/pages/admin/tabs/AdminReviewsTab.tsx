import type { Dispatch, SetStateAction } from 'react';
import { StarIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { Pagination } from '@shared/components/Pagination/Pagination';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { adminService as adminServiceType } from '../../../services/adminService';
import type { AdminReview, ReviewFilters } from '../hooks/useAdminReviews';
import { AdminReviewCard } from './AdminReviewCard';

interface AdminReviewsTabProps {
  reviews: AdminReview[];
  reviewsLoading: boolean;
  reviewsTotal: number;
  reviewsPage: number;
  setReviewsPage: Dispatch<SetStateAction<number>>;
  reviewFilters: ReviewFilters;
  setReviewFilters: Dispatch<SetStateAction<ReviewFilters>>;
  selectedReviewIds: Set<string>;
  setSelectedReviewIds: Dispatch<SetStateAction<Set<string>>>;
  exportLoading: boolean;
  handleExport: (exportFn: () => Promise<Blob>, filename: string) => void;
  handleDeleteReview: (reviewId: string) => void;
  todayStr: string;
  adminService: typeof adminServiceType;
  PAGE_SIZE: number;
}

export function AdminReviewsTab({
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
}: AdminReviewsTabProps) {
  const { t } = useTranslation();
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
          {t('admin.reviews.allRatings')}
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
            <StarIcon size={14} weight="fill" color="var(--star)" /> {rating}
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
            fontSize: "var(--text-base)",
            color: 'var(--text-3)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={reviews.length > 0 && selectedReviewIds.size === reviews.length}
            onChange={(e) =>
              { setSelectedReviewIds(
                e.target.checked ? new Set(reviews.map((r) => r.id)) : new Set()
              ); }
            }
          />
          {t('admin.common.selectAll')}
        </label>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            { handleExport(
              () =>
                adminService.exportReviewsCSV({
                  min_rating: reviewFilters.rating || undefined,
                  max_rating: reviewFilters.rating || undefined,
                }),
              t('admin.exportFiles.reviews', { date: todayStr })
            ); }
          }
        >
          {exportLoading ? '...' : <><DownloadSimpleIcon size={16} weight="bold" /> CSV</>}
        </button>
      </div>

      {reviews.map((review) => (
        <AdminReviewCard
          key={review.id}
          review={review}
          selectedReviewIds={selectedReviewIds}
          setSelectedReviewIds={setSelectedReviewIds}
          handleDeleteReview={handleDeleteReview}
        />
      ))}

      {isEmpty && (
        <EmptyState
          title={t('admin.reviews.emptyTitle')}
          subtitle={t('admin.common.emptySubtitle')}
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
