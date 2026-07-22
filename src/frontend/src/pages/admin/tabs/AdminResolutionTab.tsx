import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react';
import { PackageIcon, ClockIcon, CheckCircleIcon, HandPalmIcon, ShieldWarningIcon } from '@phosphor-icons/react';
import { Pagination } from '@shared/components/Pagination/Pagination';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import { orderStatusLabel } from '@shared/utils/locales';
import { translateApiError } from '@shared/utils/translateApiError';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Order } from '@shared/types/models';
import type { adminService as AdminService } from '../../../services/adminService';
import type { OrderFilters } from '../hooks/useAdminOrders';
import type { ReasonDialogConfig } from '../useAdminDashboard';
import { formatPrice } from '@shared/utils/price';

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
};

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

interface StatusConfig {
  className: string;
  icon: ReactNode;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  PENDING: { className: 'pending', icon: <ClockIcon /> },
  ACCEPTED: { className: 'pending', icon: <CheckCircleIcon /> },
  READY: { className: 'ready', icon: <HandPalmIcon /> },
  COMPLETED: { className: 'ready', icon: <CheckCircleIcon weight="fill" /> },
};

const orderTitle = (order: Order): number => order.display_id;

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

      {orders.map((o) => {
        const cfg = STATUS_MAP[o.status] ?? { className: 'pending', icon: <PackageIcon /> };
        return (
          <div
            key={o.id}
            style={{
              ...cardStyle,
              padding: 16,
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-3)', fontSize: "var(--text-sm)", fontWeight: 800 }}>
                  {t('admin.resolution.orderTitle', { displayId: orderTitle(o) })}
                </div>
                <div
                  style={{
                    color: 'var(--text-1)',
                    fontWeight: 900,
                    fontSize: "var(--text-md)",
                    marginTop: 2,
                  }}
                >
                  {formatPrice(o.total_price)}
                </div>
              </div>
              <span className={`order-status-badge ${cfg.className}`}>
                {cfg.icon} {orderStatusLabel(o.status)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                color: 'var(--text-3)',
                fontSize: "var(--text-base)",
              }}
            >
              <div>
                <b style={{ color: 'var(--text-2)' }}>{o.customer_name || t('admin.resolution.customerFallback')}</b>
                {o.customer_phone && <span> · {o.customer_phone}</span>}
              </div>
              {(o.restaurant_name || o.restaurant_address) && (
                <div>
                  {o.restaurant_name && (
                    <b style={{ color: 'var(--text-2)' }}>{o.restaurant_name}</b>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setSelectedOrder(o); }}
              >
                {t('admin.resolution.details')}
              </button>
              {o.status !== 'CANCELLED' && (
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--error)', color: 'white' }}
                  onClick={() => {
                    setReasonDialog({
                      title: t('admin.resolution.dialogs.forceCancelTitle'),
                      message: t('admin.resolution.dialogs.forceCancelMessage', { displayId: orderTitle(o) }),
                      confirmLabel: t('admin.resolution.dialogs.forceCancelConfirm'),
                      onConfirm: async (reason) => {
                        try {
                          await adminService.forceCancelOrder(o.id, reason);
                          setOrdersPage(1);
                        } catch (error) {
                          setActionError(
                            translateApiError(error, t('admin.resolution.errors.cancelFailed'))
                          );
                        }
                      },
                    });
                  }}
                >
                  {t('admin.resolution.forceCancel')}
                </button>
              )}
            </div>
          </div>
        );
      })}

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
