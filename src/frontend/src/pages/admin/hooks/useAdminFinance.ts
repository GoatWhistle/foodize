import { useState, useEffect, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { adminService } from '../../../services/adminService';
import type {
  AdminRestaurant,
  AdvancedAnalytics,
  FinanceAnalytics,
  SuccessResponse,
  SuccessListResponse,
} from '@shared/types/models';

export type { FinanceAnalytics, AdvancedAnalytics, AdminRestaurant };

const RESTAURANT_DROPDOWN_LIMIT = 100;

export interface UseAdminFinanceArgs {
  activeTab: string;
  setActionError: Dispatch<SetStateAction<string>>;
  todayStr: string;
}

export interface FinanceFilters {
  date_from: string;
  date_to: string;
  restaurant_id: string;
}

export const useAdminFinance = ({ activeTab, setActionError, todayStr }: UseAdminFinanceArgs) => {
  const [allRestaurants, setAllRestaurants] = useState<AdminRestaurant[]>([]);
  const [finance, setFinance] = useState<FinanceAnalytics | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeFilters, setFinanceFilters] = useState<FinanceFilters>({
    date_from: '',
    date_to: '',
    restaurant_id: '',
  });
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics | null>(null);
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
      setFinance((finRes.data as SuccessResponse<FinanceAnalytics>).data);
      setAdvancedAnalytics((advRes.data as SuccessResponse<AdvancedAnalytics>).data);
    } catch {
      setActionError('Не удалось загрузить аналитику');
    } finally {
      setFinanceLoading(false);
      setAnalyticsLoading(false);
    }
  }, [financeFilters, setActionError]);

  useEffect(() => {
    if (activeTab === 'finance') void fetchFinance();
  }, [activeTab, fetchFinance]);

  useEffect(() => {
    if (activeTab === 'finance' && allRestaurants.length === 0) {
      void adminService
        .getRestaurants({ size: RESTAURANT_DROPDOWN_LIMIT })
        .then((res) => {
          const body = res.data as SuccessListResponse<AdminRestaurant>;
          setAllRestaurants(body.data || []);
        });
    }
  }, [activeTab, allRestaurants.length]);

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
