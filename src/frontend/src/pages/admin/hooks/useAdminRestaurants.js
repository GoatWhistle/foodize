import { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';
import { useModalStore } from '../../../store/useModalStore';
import { useDebounce } from '../../../hooks/useDebounce';
import { createDetailLoader } from '../../../utils/createDetailLoader';

const PAGE_SIZE = 20;

export const useAdminRestaurants = ({ activeTab, setActionError, setActionSuccess, setStats, requestReason }) => {
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsPage, setRestaurantsPage] = useState(1);
  const [restaurantsTotal, setRestaurantsTotal] = useState(0);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantDetailsLoading, setRestaurantDetailsLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [restaurantFilters, setRestaurantFilters] = useState({
    is_open: '',
    moderation_status: '',
    min_rating: '',
  });
  const [restaurantSearchRaw, setRestaurantSearchRaw] = useState('');
  const [restaurantVendorSearchRaw, setRestaurantVendorSearchRaw] = useState('');
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState(new Set());
  const [batchRestaurantsLoading, setBatchRestaurantsLoading] = useState(false);

  const restaurantSearch = useDebounce(restaurantSearchRaw);
  const restaurantVendorSearch = useDebounce(restaurantVendorSearchRaw);

  useEffect(() => { setSelectedRestaurantIds(new Set()); }, [restaurantsPage]);

  useEffect(() => {
    if (activeTab !== 'restaurants') return;
    setRestaurantsLoading(true);
    adminService
      .getRestaurants({
        page: restaurantsPage,
        size: PAGE_SIZE,
        search: restaurantSearch || undefined,
        vendor_search: restaurantVendorSearch || undefined,
        is_open: restaurantFilters.is_open || undefined,
        moderation_status: restaurantFilters.moderation_status || undefined,
        min_rating: restaurantFilters.min_rating || undefined,
      })
      .then((res) => {
        setRestaurants(res.data.data || []);
        setRestaurantsTotal(res.data.pagination?.total || 0);
      })
      .catch(() => setActionError('Не удалось загрузить рестораны'))
      .finally(() => setRestaurantsLoading(false));
  }, [activeTab, restaurantsPage, restaurantFilters, restaurantSearch, restaurantVendorSearch]);

  const loadRestaurantDetails = createDetailLoader(
    setRestaurantDetailsLoading,
    setSelectedRestaurant,
    adminService.getRestaurant,
    'Не удалось загрузить детали ресторана',
    setActionError
  );

  const refreshSelectedRestaurant = (data) => {
    setSelectedRestaurant(data);
    setRestaurants((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  };

  const handleDeleteRestaurant = async (restaurantId) => {
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

  const handleApproveRestaurant = async (restaurantId) => {
    setApproveLoading(true);
    try {
      const res = await adminService.approveRestaurant(restaurantId);
      refreshSelectedRestaurant(res.data.data);
      setActionSuccess('Ресторан одобрен');
    } catch {
      setActionError('Не удалось одобрить ресторан');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectRestaurant = (restaurantId) => {
    requestReason({
      title: 'Отклонить ресторан',
      message: 'Укажите причину. Вендор увидит, что нужно исправить перед повторной проверкой.',
      confirmLabel: 'Отклонить',
      onConfirm: async (reason) => {
        try {
          const res = await adminService.rejectRestaurant(restaurantId, reason);
          refreshSelectedRestaurant(res.data.data);
          setActionSuccess('Ресторан отклонён');
        } catch {
          setActionError('Не удалось отклонить ресторан');
        }
      },
    });
  };

  const handleBatchRestaurants = async (action, reason) => {
    setBatchRestaurantsLoading(true);
    try {
      const ids = Array.from(selectedRestaurantIds);
      if (action === 'approve') await adminService.batchApproveRestaurants(ids);
      else await adminService.batchRejectRestaurants(ids, reason);
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
