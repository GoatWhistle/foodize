import type { Dispatch, SetStateAction } from 'react';
import Pagination from '@shared/components/Pagination/Pagination';
import EmptyState from '@shared/components/EmptyState/EmptyState';
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

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  APPROVE_VENDOR: 'Одобрен вендор',
  REJECT_VENDOR: 'Отклонён вендор',
  DEACTIVATE_VENDOR: 'Деактивирован вендор',
  APPROVE_RESTAURANT: 'Одобрен ресторан',
  REJECT_RESTAURANT: 'Отклонён ресторан',
  DEACTIVATE_USER: 'Деактивирован пользователь',
  ACTIVATE_USER: 'Активирован пользователь',
  UPDATE_PERMISSIONS: 'Изменены права пользователя',
  CREATE_MENU_ITEM: 'Создан пункт меню',
  UPDATE_MENU_ITEM: 'Изменён пункт меню',
  DELETE_MENU_ITEM: 'Удалён пункт меню',
  TOGGLE_MENU_ITEM: 'Изменена доступность пункта меню',
  CREATE_PROMO: 'Создан промокод',
  DEACTIVATE_PROMO: 'Деактивирован промокод',
  FORCE_CANCEL_ORDER: 'Заказ отменён администратором',
  DELETE_REVIEW: 'Удален отзыв',
};

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
};

export default function AdminAuditTab({
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
          <option value="">Все действия</option>
          {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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
          <option value="">Все объекты</option>
          <option value="vendor">Вендор</option>
          <option value="restaurant">Ресторан</option>
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
              style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-1)' }}
            >
              {AUDIT_ACTION_LABELS[log.action] ?? log.action}
            </span>
            <span className="order-status-badge pending">{log.entity_type}</span>
            <span
              style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginLeft: 'auto' }}
            >
              {new Date(log.created_at).toLocaleString('ru-RU')}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 4 }}>
            Объект: {log.entity_id || '—'}
          </div>
          {expandedAuditId === log.id && (
            <pre
              style={{
                marginTop: 8,
                fontSize: '0.75rem',
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
          title="Логов пока нет"
          subtitle="Для выбранных фильтров нет результатов"
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
