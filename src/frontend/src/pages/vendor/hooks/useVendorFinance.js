import { useState, useEffect, useCallback } from 'react';
import { vendorService } from '../../../services/vendorService';

export const useVendorFinance = ({ selectedRestaurant, activeTab }) => {
  const [finance, setFinance] = useState(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [financeFilters, setFinanceFilters] = useState({ date_from: '', date_to: '' });
  const [activePreset, setActivePreset] = useState(null);

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
    if (activeTab === 'analytics') fetchAnalytics();
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
