import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { adminService } from '../../../services/adminService';
import { useModalStore } from '@shared/store/useModalStore';
import { useDebounce } from '@shared/utils/useDebounce';
import type { AdminVendor, PlatformStats, SuccessListResponse, SuccessResponse } from '@shared/types/models';
import { createDetailLoader } from '../../../utils/createDetailLoader';
import type { RequestReason } from '../useAdminDashboard';

export type { AdminVendor };

const PAGE_SIZE = 20;

export interface UseAdminVendorsArgs {
  activeTab: string;
  setActionError: Dispatch<SetStateAction<string>>;
  setActionSuccess: (message: string) => void;
  setStats: Dispatch<SetStateAction<PlatformStats | null>>;
  requestReason: RequestReason;
}

export interface VendorFilters {
  approval_status: string;
}

export const useAdminVendors = ({
  activeTab,
  setActionError,
  setActionSuccess,
  setStats,
  requestReason,
}: UseAdminVendorsArgs) => {
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [vendorsPage, setVendorsPage] = useState(1);
  const [vendorsTotal, setVendorsTotal] = useState(0);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<AdminVendor | null>(null);
  const [vendorDetailsLoading, setVendorDetailsLoading] = useState(false);
  const [vendorFilters, setVendorFilters] = useState<VendorFilters>({ approval_status: '' });
  const [vendorSearchRaw, setVendorSearchRaw] = useState('');
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set());
  const [batchVendorsLoading, setBatchVendorsLoading] = useState(false);

  const vendorSearch = useDebounce(vendorSearchRaw);

  useEffect(() => { setSelectedVendorIds(new Set()); }, [vendorsPage]);

  useEffect(() => {
    if (activeTab !== 'vendors') return;
    setVendorsLoading(true);
    adminService
      .getVendors({
        page: vendorsPage,
        size: PAGE_SIZE,
        search: vendorSearch || undefined,
        approval_status: vendorFilters.approval_status || undefined,
      })
      .then((res) => {
        const body = res.data as SuccessListResponse<AdminVendor>;
        setVendors(body.data || []);
        setVendorsTotal(body.pagination?.total || 0);
      })
      .catch(() => setActionError('Не удалось загрузить вендоров'))
      .finally(() => setVendorsLoading(false));
  }, [activeTab, vendorsPage, vendorFilters, vendorSearch, setActionError]);

  const loadVendorDetails = createDetailLoader<AdminVendor | null>(
    setVendorDetailsLoading,
    setSelectedVendor,
    adminService.getVendor,
    'Не удалось загрузить детали вендора',
    setActionError
  );

  const refreshSelectedVendor = (data: AdminVendor) => {
    setSelectedVendor(data);
    setVendors((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  };

  const handleDeleteVendor = (vendorId: string) => {
    requestConfirm({
      title: 'Удалить вендора?',
      message: 'Точно ли вы хотите удалить вендора? Его рестораны будут скрыты.',
      confirmLabel: 'Удалить вендора',
      danger: true,
      onConfirm: async () => {
        setActionError('');
        try {
          await adminService.deleteVendor(vendorId);
          setVendors((prev) => prev.filter((item) => item.id !== vendorId));
          setSelectedVendor(null);
          setStats(null);
        } catch {
          setActionError('Не удалось удалить вендора');
        }
      },
    });
  };

  const handleApproveVendor = (vendorId: string) => {
    requestConfirm({
      title: 'Одобрить вендора?',
      message: 'После одобрения вендор сможет работать в кабинете и управлять заведениями.',
      confirmLabel: 'Одобрить',
      onConfirm: async () => {
        setActionError('');
        try {
          const res = await adminService.approveVendor(vendorId);
          refreshSelectedVendor((res.data as SuccessResponse<AdminVendor>).data);
          setActionSuccess('Вендор одобрен');
        } catch {
          setActionError('Не удалось одобрить вендора');
        }
      },
    });
  };

  const handleRejectVendor = (vendorId: string) => {
    requestReason({
      title: 'Отклонить вендора',
      message: 'Укажите причину отказа, чтобы заявка не выглядела как молчаливый отказ.',
      confirmLabel: 'Отклонить',
      onConfirm: async (reason) => {
        try {
          const res = await adminService.rejectVendor(vendorId, reason);
          refreshSelectedVendor((res.data as SuccessResponse<AdminVendor>).data);
          setActionSuccess('Вендор отклонён');
        } catch {
          setActionError('Не удалось отклонить вендора');
        }
      },
    });
  };

  const handleBatchVendors = async (action: 'approve' | 'reject', reason?: string) => {
    setBatchVendorsLoading(true);
    try {
      const ids = Array.from(selectedVendorIds);
      if (action === 'approve') await adminService.batchApproveVendors(ids);
      else await adminService.batchRejectVendors(ids, reason ?? '');
      setSelectedVendorIds(new Set());
      setActionSuccess(`Готово: ${ids.length} вендоров`);
      setVendorsPage(1);
      setVendorFilters((f) => ({ ...f }));
    } catch {
      setActionError('Ошибка при массовом действии');
    } finally {
      setBatchVendorsLoading(false);
    }
  };

  return {
    vendors,
    vendorsPage, setVendorsPage,
    vendorsTotal,
    vendorsLoading,
    selectedVendor, setSelectedVendor,
    vendorDetailsLoading,
    vendorFilters, setVendorFilters,
    vendorSearchRaw, setVendorSearchRaw,
    selectedVendorIds, setSelectedVendorIds,
    batchVendorsLoading,
    loadVendorDetails,
    handleDeleteVendor,
    handleApproveVendor,
    handleRejectVendor,
    handleBatchVendors,
  };
};
