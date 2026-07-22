import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { adminService } from '../../../services/adminService';
import { useModalStore } from '@shared/store/useModalStore';
import { useDebounce } from '@shared/utils/useDebounce';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { AdminRestaurant, PlatformStats } from '@shared/types/models';
import { createDetailLoader } from '../../../utils/createDetailLoader';
import type { RequestReason } from '../useAdminDashboard';

export type { AdminRestaurant };

const PAGE_SIZE = 20;

export interface UseAdminRestaurantsArgs {
  activeTab: string;
  setActionError: Dispatch<SetStateAction<string>>;
  setActionSuccess: (message: string) => void;
  setStats: Dispatch<SetStateAction<PlatformStats | null>>;
  requestReason: RequestReason;
}

export interface RestaurantFilters {
  is_open: string;
  moderation_status: string;
  min_rating: string;
}

export const useAdminRestaurants = ({
  activeTab,
  setActionError,
  setActionSuccess,
  setStats,
  requestReason,
}: UseAdminRestaurantsArgs) => {
  const { t } = useTranslation();
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [restaurantsPage, setRestaurantsPage] = useState(1);
  const [restaurantsTotal, setRestaurantsTotal] = useState(0);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<AdminRestaurant | null>(null);
  const [restaurantDetailsLoading, setRestaurantDetailsLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [restaurantFilters, setRestaurantFilters] = useState<RestaurantFilters>({
    is_open: '',
    moderation_status: '',
    min_rating: '',
  });
  const [restaurantSearchRaw, setRestaurantSearchRaw] = useState('');
  const [restaurantVendorSearchRaw, setRestaurantVendorSearchRaw] = useState('');
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState<Set<string>>(new Set());
  const [batchRestaurantsLoading, setBatchRestaurantsLoading] = useState(false);

  const restaurantSearch = useDebounce(restaurantSearchRaw);
  const restaurantVendorSearch = useDebounce(restaurantVendorSearchRaw);

  useEffect(() => { setSelectedRestaurantIds(new Set()); }, [restaurantsPage]);

  useEffect(() => {
    if (activeTab !== 'restaurants') return;
    setRestaurantsLoading(true);
    void (async () => {
      try {
        const { items, total } = await adminService.getRestaurants({
          page: restaurantsPage,
          size: PAGE_SIZE,
          search: restaurantSearch || undefined,
          vendor_search: restaurantVendorSearch || undefined,
          is_open: restaurantFilters.is_open || undefined,
          moderation_status: restaurantFilters.moderation_status || undefined,
          min_rating: restaurantFilters.min_rating || undefined,
        });
        setRestaurants(items);
        setRestaurantsTotal(total);
      } catch {
        setActionError(t('admin.restaurants.errors.loadFailed'));
      } finally {
        setRestaurantsLoading(false);
      }
    })();
  }, [activeTab, restaurantsPage, restaurantFilters, restaurantSearch, restaurantVendorSearch, setActionError, t]);

  const loadRestaurantDetails = createDetailLoader<AdminRestaurant | null>(
    setRestaurantDetailsLoading,
    setSelectedRestaurant,
    adminService.getRestaurant,
    t('admin.restaurants.errors.detailsFailed'),
    setActionError
  );

  const refreshSelectedRestaurant = (data: AdminRestaurant) => {
    setSelectedRestaurant(data);
    setRestaurants((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  };

  const handleDeleteRestaurant = (restaurantId: string) => {
    requestConfirm({
      title: t('admin.restaurants.dialogs.deleteTitle'),
      message: t('admin.restaurants.dialogs.deleteMessage'),
      confirmLabel: t('admin.restaurants.dialogs.deleteConfirm'),
      danger: true,
      onConfirm: async () => {
        setActionError('');
        try {
          await adminService.deleteRestaurant(restaurantId);
          setRestaurants((prev) => prev.filter((item) => item.id !== restaurantId));
          setSelectedRestaurant(null);
          setStats(null);
        } catch {
          setActionError(t('admin.restaurants.errors.deleteFailed'));
        }
      },
    });
  };

  const handleApproveRestaurant = async (restaurantId: string) => {
    setApproveLoading(true);
    try {
      const restaurant = await adminService.approveRestaurant(restaurantId);
      refreshSelectedRestaurant(restaurant);
      setActionSuccess(t('admin.restaurants.messages.approved'));
    } catch {
      setActionError(t('admin.restaurants.errors.approveFailed'));
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectRestaurant = (restaurantId: string) => {
    requestReason({
      title: t('admin.restaurants.dialogs.rejectTitle'),
      message: t('admin.restaurants.dialogs.rejectMessage'),
      confirmLabel: t('common.actions.reject'),
      onConfirm: async (reason) => {
        try {
          const restaurant = await adminService.rejectRestaurant(restaurantId, reason);
          refreshSelectedRestaurant(restaurant);
          setActionSuccess(t('admin.restaurants.messages.rejected'));
        } catch {
          setActionError(t('admin.restaurants.errors.rejectFailed'));
        }
      },
    });
  };

  const handleBatchRestaurants = async (action: 'approve' | 'reject', reason?: string) => {
    setBatchRestaurantsLoading(true);
    try {
      const ids = Array.from(selectedRestaurantIds);
      if (action === 'approve') await adminService.batchApproveRestaurants(ids);
      else await adminService.batchRejectRestaurants(ids, reason ?? '');
      setSelectedRestaurantIds(new Set());
      setActionSuccess(t('admin.restaurants.messages.batchDone', { count: ids.length }));
      setRestaurantsPage(1);
      setRestaurantFilters((f) => ({ ...f }));
    } catch {
      setActionError(t('admin.restaurants.errors.batchFailed'));
    } finally {
      setBatchRestaurantsLoading(false);
    }
  };

  return {
    restaurants,
    restaurantsPage, setRestaurantsPage,
    restaurantsTotal,
    restaurantsLoading,
    selectedRestaurant, setSelectedRestaurant,
    restaurantDetailsLoading,
    approveLoading,
    restaurantFilters, setRestaurantFilters,
    restaurantSearchRaw, setRestaurantSearchRaw,
    restaurantVendorSearchRaw, setRestaurantVendorSearchRaw,
    selectedRestaurantIds, setSelectedRestaurantIds,
    batchRestaurantsLoading,
    loadRestaurantDetails,
    handleDeleteRestaurant,
    handleApproveRestaurant,
    handleRejectRestaurant,
    handleBatchRestaurants,
  };
};
