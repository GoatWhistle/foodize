import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { adminService } from '../../../services/adminService';
import { useModalStore } from '@shared/store/useModalStore';
import { useDebounce } from '@shared/utils/useDebounce';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { AdminVendor, PlatformStats } from '@shared/types/models';
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
  const { t } = useTranslation();
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
    void (async () => {
      try {
        const { items, total } = await adminService.getVendors({
          page: vendorsPage,
          size: PAGE_SIZE,
          search: vendorSearch || undefined,
          approval_status: vendorFilters.approval_status || undefined,
        });
        setVendors(items);
        setVendorsTotal(total);
      } catch {
        setActionError(t('admin.vendors.errors.loadFailed'));
      } finally {
        setVendorsLoading(false);
      }
    })();
  }, [activeTab, vendorsPage, vendorFilters, vendorSearch, setActionError, t]);

  const loadVendorDetails = createDetailLoader<AdminVendor | null>(
    setVendorDetailsLoading,
    setSelectedVendor,
    adminService.getVendor,
    t('admin.vendors.errors.detailsFailed'),
    setActionError
  );

  const refreshSelectedVendor = (data: AdminVendor) => {
    setSelectedVendor(data);
    setVendors((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  };

  const handleDeleteVendor = (vendorId: string) => {
    requestConfirm({
      title: t('admin.vendors.dialogs.deleteTitle'),
      message: t('admin.vendors.dialogs.deleteMessage'),
      confirmLabel: t('admin.vendors.dialogs.deleteConfirm'),
      danger: true,
      onConfirm: async () => {
        setActionError('');
        try {
          await adminService.deleteVendor(vendorId);
          setVendors((prev) => prev.filter((item) => item.id !== vendorId));
          setSelectedVendor(null);
          setStats(null);
        } catch {
          setActionError(t('admin.vendors.errors.deleteFailed'));
        }
      },
    });
  };

  const handleApproveVendor = (vendorId: string) => {
    requestConfirm({
      title: t('admin.vendors.dialogs.approveTitle'),
      message: t('admin.vendors.dialogs.approveMessage'),
      confirmLabel: t('common.actions.approve'),
      onConfirm: async () => {
        setActionError('');
        try {
          const vendor = await adminService.approveVendor(vendorId);
          refreshSelectedVendor(vendor);
          setActionSuccess(t('admin.vendors.messages.approved'));
        } catch {
          setActionError(t('admin.vendors.errors.approveFailed'));
        }
      },
    });
  };

  const handleRejectVendor = (vendorId: string) => {
    requestReason({
      title: t('admin.vendors.dialogs.rejectTitle'),
      message: t('admin.vendors.dialogs.rejectMessage'),
      confirmLabel: t('common.actions.reject'),
      onConfirm: async (reason) => {
        try {
          const vendor = await adminService.rejectVendor(vendorId, reason);
          refreshSelectedVendor(vendor);
          setActionSuccess(t('admin.vendors.messages.rejected'));
        } catch {
          setActionError(t('admin.vendors.errors.rejectFailed'));
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
      setActionSuccess(t('admin.vendors.messages.batchDone', { count: ids.length }));
      setVendorsPage(1);
      setVendorFilters((f) => ({ ...f }));
    } catch {
      setActionError(t('admin.vendors.errors.batchFailed'));
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
