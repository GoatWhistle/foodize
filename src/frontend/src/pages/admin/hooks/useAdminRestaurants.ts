import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { adminService } from '../../../services/adminService';
import { useModalStore } from '@shared/store/useModalStore';
import { useDebounce } from '@shared/utils/useDebounce';
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
        setActionError('Не удалось загрузить рестораны');
      } finally {
        setRestaurantsLoading(false);
      }
    })();
  }, [activeTab, restaurantsPage, restaurantFilters, restaurantSearch, restaurantVendorSearch, setActionError]);

  const loadRestaurantDetails = createDetailLoader<AdminRestaurant | null>(
    setRestaurantDetailsLoading,
    setSelectedRestaurant,
    adminService.getRestaurant,
    'Не удалось загрузить детали ресторана',
    setActionError
  );

  const refreshSelectedRestaurant = (data: AdminRestaurant) => {
    setSelectedRestaurant(data);
    setRestaurants((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  };

  const handleDeleteRestaurant = (restaurantId: string) => {
    requestConfirm({
      title: 'Удалить ресторан?',
      message: 'Точно ли вы хотите удалить ресторан? Он пропадёт из активных списков и будет закрыт.',
      confirmLabel: 'Удалить ресторан',
      danger: true,
      onConfirm: async () => {
        setActionError('');
        try {
          await adminService.deleteRestaurant(restaurantId);
          setRestaurants((prev) => prev.filter((item) => item.id !== restaurantId));
          setSelectedRestaurant(null);
          setStats(null);
        } catch {
          setActionError('Не удалось удалить ресторан');
        }
      },
    });
  };

  const handleApproveRestaurant = async (restaurantId: string) => {
    setApproveLoading(true);
    try {
      const restaurant = await adminService.approveRestaurant(restaurantId);
      refreshSelectedRestaurant(restaurant);
      setActionSuccess('Ресторан одобрен');
    } catch {
      setActionError('Не удалось одобрить ресторан');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectRestaurant = (restaurantId: string) => {
    requestReason({
      title: 'Отклонить ресторан',
      message: 'Укажите причину. Вендор увидит, что нужно исправить перед повторной проверкой.',
      confirmLabel: 'Отклонить',
      onConfirm: async (reason) => {
        try {
          const restaurant = await adminService.rejectRestaurant(restaurantId, reason);
          refreshSelectedRestaurant(restaurant);
          setActionSuccess('Ресторан отклонён');
        } catch {
          setActionError('Не удалось отклонить ресторан');
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
      setActionSuccess(`Готово: ${ids.length} ресторанов`);
      setRestaurantsPage(1);
      setRestaurantFilters((f) => ({ ...f }));
    } catch {
      setActionError('Ошибка при массовом действии');
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
