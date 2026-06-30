import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../../services/adminService';

const RESTAURANT_DROPDOWN_LIMIT = 100;

export const useAdminFinance = ({ activeTab, setActionError, todayStr }) => {
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [finance, setFinance] = useState(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeFilters, setFinanceFilters] = useState({
    date_from: '',
    date_to: '',
    restaurant_id: '',
  });
  const [activePreset, setActivePreset] = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchFinance = useCallback(async () => {
    setFinanceLoading(true);
    setAnalyticsLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(financeFilters).filter(([, v]) => v !== '' && v != null)
      );
      const [finRes, advRes] = await Promise.all([
        adminService.getFinance(params),
        adminService.getAdvancedAnalytics(params),
      ]);
      setFinance(finRes.data.data);
      setAdvancedAnalytics(advRes.data.data);
    } catch {
      setActionError('Не удалось загрузить аналитику');
    } finally {
      setFinanceLoading(false);
      setAnalyticsLoading(false);
    }
  }, [financeFilters]);

  useEffect(() => {
    if (activeTab === 'finance') fetchFinance();
  }, [activeTab, fetchFinance]);

  useEffect(() => {
    if (activeTab === 'finance' && allRestaurants.length === 0) {
      adminService
        .getRestaurants({ size: RESTAURANT_DROPDOWN_LIMIT })
        .then((res) => setAllRestaurants(res.data.data || []));
    }
  }, [activeTab]);

  const getRestaurantLabel = () => {
    if (!financeFilters.restaurant_id) return 'все';
    return (
      allRestaurants.find((r) => r.id === financeFilters.restaurant_id)?.name || 'все'
    ).replace(/\s+/g, '_');
  };

  const getDateRangeLabel = () => {
    const from = financeFilters.date_from || todayStr;
    const to = financeFilters.date_to || todayStr;
    return `${from}_${to}`;
  };

  return {
    allRestaurants,
    finance,
    financeLoading,
    financeFilters, setFinanceFilters,
    activePreset, setActivePreset,
    advancedAnalytics,
    analyticsLoading,
    getRestaurantLabel,
    getDateRangeLabel,
  };
};
