import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { adminService } from '../../../services/adminService';
import { useModalStore } from '@shared/store/useModalStore';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { AdminReview } from '@shared/types/models';

export type { AdminReview };

const PAGE_SIZE = 20;

export interface UseAdminReviewsArgs {
  activeTab: string;
  setActionError: Dispatch<SetStateAction<string>>;
  setActionSuccess: (message: string) => void;
}

export interface ReviewFilters {
  rating: string;
}

export const useAdminReviews = ({ activeTab, setActionError, setActionSuccess }: UseAdminReviewsArgs) => {
  const { t } = useTranslation();
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewFilters, setReviewFilters] = useState<ReviewFilters>({ rating: '' });
  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(new Set());
  const [batchReviewsLoading, setBatchReviewsLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'reviews') return;
    setReviewsLoading(true);
    void (async () => {
      try {
        const { items, total } = await adminService.getReviews({
          page: reviewsPage,
          size: PAGE_SIZE,
          rating: reviewFilters.rating || undefined,
        });
        setReviews(items);
        setReviewsTotal(total);
      } catch {
        setActionError(t('admin.reviews.errors.loadFailed'));
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [activeTab, reviewsPage, reviewFilters, setActionError, t]);

  const handleDeleteReview = (reviewId: string) => {
    requestConfirm({
      title: t('admin.reviews.dialogs.deleteTitle'),
      message: t('admin.reviews.dialogs.deleteMessage'),
      confirmLabel: t('admin.reviews.dialogs.deleteConfirm'),
      danger: true,
      onConfirm: async () => {
        setActionError('');
        try {
          await adminService.deleteReview(reviewId);
          setReviews((prev) => prev.filter((item) => item.id !== reviewId));
          setReviewsTotal((prev) => Math.max(0, prev - 1));
        } catch {
          setActionError(t('admin.reviews.errors.deleteFailed'));
        }
      },
    });
  };

  const handleBatchDeleteReviews = () => {
    const ids = Array.from(selectedReviewIds);
    requestConfirm({
      title: t('admin.reviews.dialogs.batchDeleteTitle', { count: ids.length }),
      message: t('admin.reviews.dialogs.batchDeleteMessage'),
      confirmLabel: t('common.actions.delete'),
      danger: true,
      onConfirm: async () => {
        setBatchReviewsLoading(true);
        try {
          await adminService.batchDeleteReviews(ids);
          setSelectedReviewIds(new Set());
          setActionSuccess(t('admin.reviews.messages.batchDeleted', { count: ids.length }));
          setReviewsPage(1);
          setReviewFilters((f) => ({ ...f }));
        } catch {
          setActionError(t('admin.reviews.errors.batchDeleteFailed'));
        } finally {
          setBatchReviewsLoading(false);
        }
      },
    });
  };

  return {
    reviews,
    reviewsPage, setReviewsPage,
    reviewsTotal,
    reviewsLoading,
    reviewFilters, setReviewFilters,
    selectedReviewIds, setSelectedReviewIds,
    batchReviewsLoading,
    handleDeleteReview,
    handleBatchDeleteReviews,
  };
};
