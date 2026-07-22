import type { Dispatch, SetStateAction } from 'react';
import { Pagination } from '@shared/components/Pagination/Pagination';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { AuditLog, AuditFilters } from '../hooks/useAdminAudit';

interface AdminAuditTabProps {
  auditLogs: AuditLog[];
  auditLoading: boolean;
  auditTotal: number;
  auditPage: number;
  setAuditPage: Dispatch<SetStateAction<number>>;
  auditFilters: AuditFilters;
  setAuditFilters: Dispatch<SetStateAction<AuditFilters>>;
  expandedAuditId: string | null;
  setExpandedAuditId: Dispatch<SetStateAction<string | null>>;
  PAGE_SIZE: number;
}

export const AUDIT_ACTIONS = [
  'APPROVE_VENDOR',
  'REJECT_VENDOR',
  'DEACTIVATE_VENDOR',
  'APPROVE_RESTAURANT',
  'REJECT_RESTAURANT',
  'DEACTIVATE_USER',
  'ACTIVATE_USER',
  'UPDATE_PERMISSIONS',
  'CREATE_MENU_ITEM',
  'UPDATE_MENU_ITEM',
  'DELETE_MENU_ITEM',
  'TOGGLE_MENU_ITEM',
  'CREATE_PROMO',
  'DEACTIVATE_PROMO',
  'FORCE_CANCEL_ORDER',
  'DELETE_REVIEW',
];

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
};

export function AdminAuditTab({
  auditLogs,
  auditLoading,
  auditTotal,
  auditPage,
  setAuditPage,
  auditFilters,
  setAuditFilters,
  expandedAuditId,
  setExpandedAuditId,
  PAGE_SIZE,
}: AdminAuditTabProps) {
  const { t } = useTranslation();
  const actionLabel = (action: string): string => {
    const key = `admin.audit.actions.${action}`;
    const resolved = t(key);
    return resolved === key ? action : resolved;
  };
  const isEmpty = !Array.isArray(auditLogs) || auditLogs.length === 0;

  if (auditLoading && isEmpty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: 16,
            }}
          >
            <div
              className="skeleton"
              style={{ width: '30%', height: 16, marginBottom: 8, borderRadius: 4 }}
            />
            <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={auditLoading ? 'loading-dim' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <select
          className="form-input"
          style={{ maxWidth: 180 }}
          value={auditFilters.action}
          onChange={(e) => {
            setAuditPage(1);
            setAuditFilters((f) => ({ ...f, action: e.target.value }));
          }}
        >
          <option value="">{t('admin.audit.allActions')}</option>
          {AUDIT_ACTIONS.map((action) => (
            <option key={action} value={action}>
              {actionLabel(action)}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          style={{ maxWidth: 160 }}
          value={auditFilters.entity_type}
          onChange={(e) => {
            setAuditPage(1);
            setAuditFilters((f) => ({ ...f, entity_type: e.target.value }));
          }}
        >
          <option value="">{t('admin.audit.allEntities')}</option>
          <option value="vendor">{t('admin.audit.entityVendor')}</option>
          <option value="restaurant">{t('admin.audit.entityRestaurant')}</option>
        </select>
        <input
          type="date"
          className="form-input"
          style={{ maxWidth: 160 }}
          value={auditFilters.date_from}
          onChange={(e) => {
            setAuditPage(1);
            setAuditFilters((f) => ({ ...f, date_from: e.target.value }));
          }}
        />
        <input
          type="date"
          className="form-input"
          style={{ maxWidth: 160 }}
          value={auditFilters.date_to}
          onChange={(e) => {
            setAuditPage(1);
            setAuditFilters((f) => ({ ...f, date_to: e.target.value }));
          }}
        />
      </div>

      {auditLogs.map((log) => (
        <div
          key={log.id}
          style={{ ...cardStyle, padding: '12px 16px', cursor: 'pointer' }}
          onClick={() =>
            { setExpandedAuditId(expandedAuditId === log.id ? null : log.id); }
          }
        >
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{ fontWeight: 700, fontSize: "var(--text-base)", color: 'var(--text-1)' }}
            >
              {actionLabel(log.action)}
            </span>
            <span className="order-status-badge pending">{log.entity_type}</span>
            <span
              style={{ fontSize: "var(--text-sm)", color: 'var(--text-3)', marginLeft: 'auto' }}
            >
              {new Date(log.created_at).toLocaleString('ru-RU')}
            </span>
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: 'var(--text-3)', marginTop: 4 }}>
            {t('admin.audit.entity', { id: log.entity_id || t('common.states.dash') })}
          </div>
          {expandedAuditId === log.id && (
            <pre
              style={{
                marginTop: 8,
                fontSize: "var(--text-sm)",
                color: 'var(--text-2)',
                background: 'var(--bg-surface)',
                borderRadius: 6,
                padding: 8,
                overflow: 'auto',
              }}
            >
              {JSON.stringify(log.details, null, 2)}
            </pre>
          )}
        </div>
      ))}

      {isEmpty && (
        <EmptyState
          title={t('admin.audit.emptyTitle')}
          subtitle={t('admin.common.emptySubtitle')}
        />
      )}

      <Pagination
        page={auditPage}
        totalPages={Math.ceil(auditTotal / PAGE_SIZE)}
        onPageChange={setAuditPage}
      />
    </div>
  );
}
