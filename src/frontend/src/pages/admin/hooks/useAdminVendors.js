import { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';
import { useModalStore } from '../../../store/useModalStore';
import { useDebounce } from '../../../hooks/useDebounce';
import { createDetailLoader } from '../../../utils/createDetailLoader';

const PAGE_SIZE = 20;

export const useAdminVendors = ({ activeTab, setActionError, setActionSuccess, setStats, requestReason }) => {
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const [vendors, setVendors] = useState([]);
  const [vendorsPage, setVendorsPage] = useState(1);
  const [vendorsTotal, setVendorsTotal] = useState(0);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorDetailsLoading, setVendorDetailsLoading] = useState(false);
  const [vendorFilters, setVendorFilters] = useState({ approval_status: '' });
  const [vendorSearchRaw, setVendorSearchRaw] = useState('');
  const [selectedVendorIds, setSelectedVendorIds] = useState(new Set());
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
        setVendors(res.data.data || []);
        setVendorsTotal(res.data.pagination?.total || 0);
      })
      .catch(() => setActionError('Не удалось загрузить вендоров'))
      .finally(() => setVendorsLoading(false));
  }, [activeTab, vendorsPage, vendorFilters, vendorSearch]);

  const loadVendorDetails = createDetailLoader(
    setVendorDetailsLoading,
    setSelectedVendor,
    adminService.getVendor,
    'Не удалось загрузить детали вендора',
    setActionError
  );

  const refreshSelectedVendor = (data) => {
    setSelectedVendor(data);
    setVendors((prev) => prev.map((item) => (item.id === data.id ? data : item)));
  };

  const handleDeleteVendor = async (vendorId) => {
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

  const handleApproveVendor = (vendorId) => {
    requestConfirm({
      title: 'Одобрить вендора?',
      message: 'После одобрения вендор сможет работать в кабинете и управлять заведениями.',
      confirmLabel: 'Одобрить',
      onConfirm: async () => {
        setActionError('');
        try {
          const res = await adminService.approveVendor(vendorId);
          refreshSelectedVendor(res.data.data);
          setActionSuccess('Вендор одобрен');
        } catch {
          setActionError('Не удалось одобрить вендора');
        }
      },
    });
  };

  const handleRejectVendor = (vendorId) => {
    requestReason({
      title: 'Отклонить вендора',
      message: 'Укажите причину отказа, чтобы заявка не выглядела как молчаливый отказ.',
      confirmLabel: 'Отклонить',
      onConfirm: async (reason) => {
        try {
          const res = await adminService.rejectVendor(vendorId, reason);
          refreshSelectedVendor(res.data.data);
          setActionSuccess('Вендор отклонён');
        } catch {
          setActionError('Не удалось отклонить вендора');
        }
      },
    });
  };

  const handleBatchVendors = async (action, reason) => {
    setBatchVendorsLoading(true);
    try {
      const ids = Array.from(selectedVendorIds);
      if (action === 'approve') await adminService.batchApproveVendors(ids);
      else await adminService.batchRejectVendors(ids, reason);
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
