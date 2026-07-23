import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { PackageIcon, ClockIcon, CheckCircleIcon, HandPalmIcon } from '@phosphor-icons/react';
import { orderStatusLabel } from '@shared/utils/locales';
import { translateApiError } from '@shared/utils/translateApiError';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Order } from '@shared/types/models';
import type { adminService as AdminService } from '../../../services/adminService';
import type { ReasonDialogConfig } from '../useAdminDashboard';
import { formatPrice } from '@shared/utils/price';

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
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

interface AdminResolutionOrderCardProps {
  order: Order;
  setOrdersPage: Dispatch<SetStateAction<number>>;
  setSelectedOrder: Dispatch<SetStateAction<Order | null>>;
  setReasonDialog: Dispatch<SetStateAction<ReasonDialogConfig | null>>;
  setActionError: (message: string) => void;
  adminService: typeof AdminService;
}

export function AdminResolutionOrderCard({
  order,
  setOrdersPage,
  setSelectedOrder,
  setReasonDialog,
  setActionError,
  adminService,
}: AdminResolutionOrderCardProps) {
  const { t } = useTranslation();
  const cfg = STATUS_MAP[order.status] ?? { className: 'pending', icon: <PackageIcon /> };
  return (
    <div
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
            {t('admin.resolution.orderTitle', { displayId: orderTitle(order) })}
          </div>
          <div
            style={{
              color: 'var(--text-1)',
              fontWeight: 900,
              fontSize: "var(--text-md)",
              marginTop: 2,
            }}
          >
            {formatPrice(order.total_price)}
          </div>
        </div>
        <span className={`order-status-badge ${cfg.className}`}>
          {cfg.icon} {orderStatusLabel(order.status)}
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
          <b style={{ color: 'var(--text-2)' }}>{order.customer_name || t('admin.resolution.customerFallback')}</b>
          {order.customer_phone && <span> · {order.customer_phone}</span>}
        </div>
        {(order.restaurant_name || order.restaurant_address) && (
          <div>
            {order.restaurant_name && (
              <b style={{ color: 'var(--text-2)' }}>{order.restaurant_name}</b>
            )}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setSelectedOrder(order); }}
        >
          {t('admin.resolution.details')}
        </button>
        {order.status !== 'CANCELLED' && (
          <button
            className="btn btn-sm"
            style={{ background: 'var(--error)', color: 'white' }}
            onClick={() => {
              setReasonDialog({
                title: t('admin.resolution.dialogs.forceCancelTitle'),
                message: t('admin.resolution.dialogs.forceCancelMessage', { displayId: orderTitle(order) }),
                confirmLabel: t('admin.resolution.dialogs.forceCancelConfirm'),
                onConfirm: async (reason) => {
                  try {
                    await adminService.forceCancelOrder(order.id, reason);
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
}
