import { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';
import { useModalStore } from '../../../store/useModalStore';

const PAGE_SIZE = 20;

export const useAdminReviews = ({ activeTab, setActionError, setActionSuccess }) => {
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const [reviews, setReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewFilters, setReviewFilters] = useState({ rating: '' });
  const [selectedReviewIds, setSelectedReviewIds] = useState(new Set());
  const [batchReviewsLoading, setBatchReviewsLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'reviews') return;
    setReviewsLoading(true);
    adminService
      .getReviews({ page: reviewsPage, size: PAGE_SIZE, rating: reviewFilters.rating || undefined })
      .then((res) => {
        setReviews(res.data.data || []);
        setReviewsTotal(res.data.pagination?.total || 0);
      })
      .catch(() => setActionError('Не удалось загрузить отзывы'))
      .finally(() => setReviewsLoading(false));
  }, [activeTab, reviewsPage, reviewFilters]);

  const handleDeleteReview = async (reviewId) => {
    requestConfirm({
      title: 'Удалить отзыв?',
      message: 'Точно ли вы хотите удалить отзыв? Он исчезнет из карточки ресторана.',
      confirmLabel: 'Удалить отзыв',
      danger: true,
      onConfirm: async () => {
        setActionError('');
        try {
          await adminService.deleteReview(reviewId);
          setReviews((prev) => prev.filter((item) => item.id !== reviewId));
          setReviewsTotal((prev) => Math.max(0, prev - 1));
        } catch {
          setActionError('Не удалось удалить отзыв');
        }
      },
    });
  };

  const handleBatchDeleteReviews = () => {
    const ids = Array.from(selectedReviewIds);
    requestConfirm({
      title: `Удалить ${ids.length} отзывов?`,
      message: 'Это действие необратимо.',
      confirmLabel: 'Удалить',
      danger: true,
      onConfirm: async () => {
        setBatchReviewsLoading(true);
        try {
          await adminService.batchDeleteReviews(ids);
          setSelectedReviewIds(new Set());
          setActionSuccess(`Удалено: ${ids.length} отзывов`);
          setReviewsPage(1);
          setReviewFilters((f) => ({ ...f }));
        } catch {
          setActionError('Ошибка при удалении');
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
