import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { ShieldWarningIcon } from '@phosphor-icons/react';
import { Pagination } from '@shared/components/Pagination/Pagination';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Order } from '@shared/types/models';
import type { adminService as AdminService } from '../../../services/adminService';
import type { OrderFilters } from '../hooks/useAdminOrders';
import type { ReasonDialogConfig } from '../useAdminDashboard';
import { AdminResolutionOrderCard } from './AdminResolutionOrderCard';

const wideFilterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 8,
  alignItems: 'center',
};

const filterControlStyle = {
  minWidth: 0,
  height: 48,
  paddingTop: 11,
  paddingBottom: 11,
  fontSize: "var(--text-base)",
  lineHeight: 1.2,
};

export interface AdminResolutionTabProps {
  orders: Order[];
  ordersLoading: boolean;
  ordersTotal: number;
  ordersPage: number;
  setOrdersPage: Dispatch<SetStateAction<number>>;
  orderSearchRaw: string;
  setOrderSearchRaw: Dispatch<SetStateAction<string>>;
  orderFilters: OrderFilters;
  setOrderFilters: Dispatch<SetStateAction<OrderFilters>>;
  setSelectedOrder: Dispatch<SetStateAction<Order | null>>;
  setReasonDialog: Dispatch<SetStateAction<ReasonDialogConfig | null>>;
  setActionError: (message: string) => void;
  adminService: typeof AdminService;
  PAGE_SIZE: number;
}

export function AdminResolutionTab({
  orders,
  ordersLoading,
  ordersTotal,
  ordersPage,
  setOrdersPage,
  orderSearchRaw,
  setOrderSearchRaw,
  orderFilters,
  setOrderFilters,
  setSelectedOrder,
  setReasonDialog,
  setActionError,
  adminService,
  PAGE_SIZE,
}: AdminResolutionTabProps) {
  const { t } = useTranslation();
  const isEmpty = !Array.isArray(orders) || orders.length === 0;

  if (ordersLoading && isEmpty) {
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
            <div className="skeleton" style={{ width: '30%', height: 16, marginBottom: 8, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={ordersLoading ? 'loading-dim' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <ShieldWarningIcon size={32} color="var(--error)" />
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-md)" }}>{t('admin.resolution.title')}</h3>
          <div style={{ fontSize: "var(--text-base)", color: 'var(--text-3)' }}>
            {t('admin.resolution.subtitle')}
          </div>
        </div>
      </div>

      <div style={wideFilterGridStyle}>
        <input
          className="form-input"
          style={filterControlStyle}
          placeholder={t('admin.resolution.searchPlaceholder')}
          value={orderSearchRaw}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setOrdersPage(1);
            setOrderSearchRaw(event.target.value);
          }}
        />
        <select
          className="form-input"
          style={filterControlStyle}
          value={orderFilters.status}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            setOrdersPage(1);
            setOrderFilters((prev) => ({ ...prev, status: event.target.value }));
          }}
        >
          <option value="">{t('admin.resolution.allStatuses')}</option>
          <option value="PENDING">{t('admin.resolution.statuses.pending')}</option>
          <option value="ACCEPTED">{t('admin.resolution.statuses.accepted')}</option>
          <option value="READY">{t('admin.resolution.statuses.ready')}</option>
          <option value="COMPLETED">{t('admin.resolution.statuses.completed')}</option>
        </select>
      </div>

      {orders.map((o) => (
        <AdminResolutionOrderCard
          key={o.id}
          order={o}
          setOrdersPage={setOrdersPage}
          setSelectedOrder={setSelectedOrder}
          setReasonDialog={setReasonDialog}
          setActionError={setActionError}
          adminService={adminService}
        />
      ))}

      {isEmpty && (
        <EmptyState
          title={t('admin.resolution.emptyTitle')}
          subtitle={t('admin.common.emptySubtitle')}
        />
      )}

      <Pagination
        page={ordersPage}
        totalPages={Math.ceil(ordersTotal / PAGE_SIZE)}
        onPageChange={setOrdersPage}
      />
    </div>
  );
}
