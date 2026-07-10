import { useState, useEffect, useCallback } from 'react';
import { vendorService } from '@shared/services/vendorService';
import type { AdvancedAnalytics, FinanceAnalytics, Restaurant } from '@shared/types/models';

export interface FinanceFilters {
  date_from: string;
  date_to: string;
}

interface UseVendorFinanceParams {
  selectedRestaurant: Restaurant | null;
  activeTab: string;
}

export const useVendorFinance = ({ selectedRestaurant, activeTab }: UseVendorFinanceParams) => {
  const [finance, setFinance] = useState<FinanceAnalytics | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [financeFilters, setFinanceFilters] = useState<FinanceFilters>({ date_from: '', date_to: '' });
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedRestaurant) return;
    setFinanceLoading(true);
    setAnalyticsLoading(true);
    try {
      const rawParams = { ...financeFilters, restaurant_id: selectedRestaurant.id };
      const params = Object.fromEntries(
        Object.entries(rawParams).filter(([, v]) => v !== '' && v != null)
      );
      const [finRes, advRes] = await Promise.all([
        vendorService.getFinance(params),
        vendorService.getAdvancedAnalytics(params),
      ]);
      setFinance(finRes.data.data);
      setAdvancedAnalytics(advRes.data.data);
    } catch {
    } finally {
      setFinanceLoading(false);
      setAnalyticsLoading(false);
    }
  }, [selectedRestaurant, financeFilters]);

  useEffect(() => {
    if (activeTab === 'analytics') void fetchAnalytics();
  }, [activeTab, fetchAnalytics]);

  return {
    finance,
    financeLoading,
    advancedAnalytics,
    analyticsLoading,
    financeFilters, setFinanceFilters,
    activePreset, setActivePreset,
  };
};
