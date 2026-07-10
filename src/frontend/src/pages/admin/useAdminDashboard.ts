import { useEffect, useState, useRef, useMemo } from 'react';
import { adminService } from '../../services/adminService';
import { useAuthStore } from '../../store/useAuthStore';
import { ORDER_STATUS_RU, translate } from '@shared/utils/locales';
import type { AdminRestaurant, PlatformStats, SuccessResponse } from '@shared/types/models';
import { downloadBlob } from '../../utils/download';
import { useAdminUsers } from './hooks/useAdminUsers';
import { useAdminRestaurants } from './hooks/useAdminRestaurants';
import { useAdminVendors } from './hooks/useAdminVendors';
import { useAdminOrders } from './hooks/useAdminOrders';
import { useAdminReviews } from './hooks/useAdminReviews';
import { useAdminFinance } from './hooks/useAdminFinance';
import { useAdminAudit } from './hooks/useAdminAudit';

export { PAGE_SIZE } from './hooks/useAdminUsers';

export type { PlatformStats };
export type QrType = 'site' | 'telegram';

export interface ReasonDialogConfig {
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: (reason: string) => void | Promise<void>;
}

export type RequestReason = (dialog: ReasonDialogConfig) => void;

const SUCCESS_TOAST_DURATION = 4000;

export const useAdminDashboard = () => {
  const { user: currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [permissionActionLoading, setPermissionActionLoading] = useState(false);
  const actionSuccessTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(actionSuccessTimerRef.current), []);

  useEffect(() => {
    setActionError('');
    setActionSuccess('');
  }, [activeTab]);

  const [reasonDialog, setReasonDialog] = useState<ReasonDialogConfig | null>(null);
  const [reasonLoading, setReasonLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [entitiesOpen, setEntitiesOpen] = useState(true);
  const [qrRestaurant, setQrRestaurant] = useState<AdminRestaurant | null>(null);
  const [qrType, setQrType] = useState<QrType>('site');

  useEffect(() => {
    if (['users', 'orders', 'restaurants', 'vendors', 'reviews'].includes(activeTab)) {
      setEntitiesOpen(true);
    }
  }, [activeTab]);

  const requestReason: RequestReason = (dialog) => setReasonDialog(dialog);

  const runReasonAction = async (reason: string) => {
    if (!reasonDialog?.onConfirm) return;
    setReasonLoading(true);
    try {
      await reasonDialog.onConfirm(reason);
      setReasonDialog(null);
    } finally {
      setReasonLoading(false);
    }
  };

  const showActionSuccess = (message: string) => {
    setActionError('');
    setActionSuccess(message);
    clearTimeout(actionSuccessTimerRef.current);
    actionSuccessTimerRef.current = window.setTimeout(
      () => setActionSuccess(''),
      SUCCESS_TOAST_DURATION
    );
  };

  useEffect(() => {
    if (activeTab === 'stats' && !stats) {
      adminService
        .getPlatformStats()
        .then((res) => setStats((res.data as SuccessResponse<PlatformStats>).data))
        .catch(() => setActionError('Не удалось загрузить статистику'));
    }
  }, [activeTab, stats]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const ordersByStatusChartData = useMemo(() => {
    if (!stats?.orders_by_status) return null;
    return Object.fromEntries(
      Object.entries(stats.orders_by_status).map(([k, v]) => [translate(ORDER_STATUS_RU, k), v])
    );
  }, [stats?.orders_by_status]);

  const handleExport = async (
    exportFn: () => Promise<{ data: Blob }>,
    filename: string
  ) => {
    setExportLoading(true);
    try {
      const res = await exportFn();
      downloadBlob(res.data, filename);
    } catch {
      setActionError('Не удалось выполнить экспорт');
    } finally {
      setExportLoading(false);
    }
  };

  const sharedArgs = { activeTab, setActionError, setActionSuccess: showActionSuccess };

  const users = useAdminUsers({
    ...sharedArgs,
    permissionActionLoading,
    setPermissionActionLoading,
  });

  const restaurants = useAdminRestaurants({
    ...sharedArgs,
    setStats,
    requestReason,
  });

  const vendors = useAdminVendors({
    ...sharedArgs,
    setStats,
    requestReason,
  });

  const orders = useAdminOrders(sharedArgs);
  const reviews = useAdminReviews(sharedArgs);

  const finance = useAdminFinance({ ...sharedArgs, todayStr });
  const audit = useAdminAudit(sharedArgs);

  const batchLoading =
    users.batchUsersLoading ||
    restaurants.batchRestaurantsLoading ||
    vendors.batchVendorsLoading ||
    reviews.batchReviewsLoading;

  return {
    currentUser,
    activeTab, setActiveTab,
    stats,
    actionError, actionSuccess,
    permissionActionLoading,

    ...users,
    ...orders,
    ...restaurants,
    ...vendors,
    ...reviews,
    ...finance,
    ...audit,

    batchLoading,
    reasonDialog, setReasonDialog, reasonLoading,
    exportLoading,
    entitiesOpen, setEntitiesOpen,
    qrRestaurant, setQrRestaurant, qrType, setQrType,
    todayStr, ordersByStatusChartData,
    handleExport,
    requestReason, runReasonAction,
  };
};
