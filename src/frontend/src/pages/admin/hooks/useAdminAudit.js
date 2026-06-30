import { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';

const PAGE_SIZE = 20;

export const useAdminAudit = ({ activeTab, setActionError }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilters, setAuditFilters] = useState({
    action: '',
    entity_type: '',
    date_from: '',
    date_to: '',
  });
  const [expandedAuditId, setExpandedAuditId] = useState(null);

  useEffect(() => {
    if (activeTab !== 'audit') return;
    setAuditLoading(true);
    const params = {
      page: auditPage,
      size: PAGE_SIZE,
      ...(auditFilters.action && { action: auditFilters.action }),
      ...(auditFilters.entity_type && { entity_type: auditFilters.entity_type }),
      ...(auditFilters.date_from && { date_from: auditFilters.date_from }),
      ...(auditFilters.date_to && { date_to: auditFilters.date_to }),
    };
    adminService
      .getAuditLogs(params)
      .then((res) => {
        setAuditLogs(res.data.data || []);
        setAuditTotal(res.data.pagination?.total || 0);
      })
      .catch(() => setActionError('Не удалось загрузить логи'))
      .finally(() => setAuditLoading(false));
  }, [activeTab, auditPage, auditFilters]);

  return {
    auditLogs,
    auditTotal,
    auditPage, setAuditPage,
    auditLoading,
    auditFilters, setAuditFilters,
    expandedAuditId, setExpandedAuditId,
  };
};
