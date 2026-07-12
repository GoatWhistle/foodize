import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { adminService } from '../../../services/adminService';

const PAGE_SIZE = 20;

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  created_at: string;
  details?: unknown;
}

export interface AuditFilters {
  action: string;
  entity_type: string;
  date_from: string;
  date_to: string;
}

export interface UseAdminAuditArgs {
  activeTab: string;
  setActionError: Dispatch<SetStateAction<string>>;
}

export const useAdminAudit = ({ activeTab, setActionError }: UseAdminAuditArgs) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilters, setAuditFilters] = useState<AuditFilters>({
    action: '',
    entity_type: '',
    date_from: '',
    date_to: '',
  });
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

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
      .getAuditLogs<AuditLog>(params)
      .then((res) => {
        const body = res.data;
        setAuditLogs(body.data);
        setAuditTotal(body.pagination.total || 0);
      })
      .catch(() => { setActionError('Не удалось загрузить логи'); })
      .finally(() => { setAuditLoading(false); });
  }, [activeTab, auditPage, auditFilters, setActionError]);

  return {
    auditLogs,
    auditTotal,
    auditPage, setAuditPage,
    auditLoading,
    auditFilters, setAuditFilters,
    expandedAuditId, setExpandedAuditId,
  };
};
