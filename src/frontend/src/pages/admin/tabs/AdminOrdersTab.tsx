import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react';
import { Package, Clock, CheckCircle, HandPalm, DownloadSimple } from '@phosphor-icons/react';
import Pagination from '@shared/components/Pagination/Pagination';
import EmptyState from '@shared/components/EmptyState/EmptyState';
import { ORDER_STATUS_RU } from '@shared/utils/locales';
import type { Order } from '@shared/types/models';
import type { adminService as AdminService } from '../../../services/adminService';
import type { OrderFilters } from '../hooks/useAdminOrders';

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
  fontSize: '0.86rem',
  lineHeight: 1.2,
};

interface StatusConfig {
  label: string;
  className: string;
  icon: ReactNode;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  PENDING: { label: ORDER_STATUS_RU.PENDING, className: 'pending', icon: <Clock /> },
  ACCEPTED: { label: ORDER_STATUS_RU.ACCEPTED, className: 'pending', icon: <CheckCircle /> },
  READY: { label: ORDER_STATUS_RU.READY, className: 'ready', icon: <HandPalm /> },
  COMPLETED: { label: ORDER_STATUS_RU.COMPLETED, className: 'ready', icon: <CheckCircle weight="fill" /> },
};

const shortId = (value?: string | null): string => (value ? value.slice(0, 8) : '—');
const orderTitle = (order: Order): string | number => order.display_id ?? shortId(order.id);

export interface AdminOrdersTabProps {
  orders: Order[];
  ordersLoading: boolean;
  ordersTotal: number;
  ordersPage: number;
  setOrdersPage: Dispatch<SetStateAction<number>>;
  orderSearchRaw: string;
  setOrderSearchRaw: Dispatch<SetStateAction<string>>;
  orderFilters: OrderFilters;
  setOrderFilters: Dispatch<SetStateAction<OrderFilters>>;
  exportLoading: boolean;
  handleExport: (exportFn: () => Promise<{ data: Blob }>, filename: string) => void;
  setSelectedOrder: Dispatch<SetStateAction<Order | null>>;
  todayStr: string;
  adminService: typeof AdminService;
  PAGE_SIZE: number;
}

export default function AdminOrdersTab({
  orders,
  ordersLoading,
  ordersTotal,
  ordersPage,
  setOrdersPage,
  orderSearchRaw,
  setOrderSearchRaw,
  orderFilters,
  setOrderFilters,
  exportLoading,
  handleExport,
  setSelectedOrder,
  todayStr,
  adminService,
  PAGE_SIZE,
}: AdminOrdersTabProps) {
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
      <div style={wideFilterGridStyle}>
        <input
          className="form-input"
          style={filterControlStyle}
          placeholder="Клиент, телефон или ресторан"
          value={orderSearchRaw}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setOrdersPage(1);
            setOrderSearchRaw(event.target.value);
          }}
        />
        <input
          className="form-input"
          style={filterControlStyle}
          type="date"
          value={orderFilters.date_from}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setOrdersPage(1);
            setOrderFilters((prev) => ({ ...prev, date_from: event.target.value }));
          }}
        />
        <input
          className="form-input"
          style={filterControlStyle}
          type="date"
          value={orderFilters.date_to}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setOrdersPage(1);
            setOrderFilters((prev) => ({ ...prev, date_to: event.target.value }));
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
        {([
          ['', 'Все'],
          ['PENDING', 'Новые'],
          ['ACCEPTED', 'Принятые'],
          ['READY', 'Готовы'],
          ['COMPLETED', 'Выданы'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={`category-chip${orderFilters.status === key ? ' active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            onClick={() => {
              setOrderFilters((prev) => ({ ...prev, status: key }));
              setOrdersPage(1);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            handleExport(
              () =>
                adminService.exportOrdersCSV({
                  date_from: orderFilters.date_from || undefined,
                  date_to: orderFilters.date_to || undefined,
                  status: orderFilters.status || undefined,
                }),
              `заказы_${todayStr}.csv`
            )
          }
        >
          {exportLoading ? '...' : <><DownloadSimple size={16} weight="bold" /> CSV</>}
        </button>
      </div>

      {orders.map((o) => {
        const cfg = STATUS_MAP[o.status] || {
          label: o.status,
          className: 'pending',
          icon: <Package />,
        };
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setSelectedOrder(o)}
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
                <div style={{ color: 'var(--text-3)', fontSize: '0.74rem', fontWeight: 800 }}>
                  Заказ #{orderTitle(o)}
                </div>
                <div
                  style={{
                    color: 'var(--text-1)',
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    marginTop: 2,
                  }}
                >
                  {o.total_price} ₽
                </div>
              </div>
              <span className={`order-status-badge ${cfg.className}`}>
                {cfg.icon} {cfg.label}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                color: 'var(--text-3)',
                fontSize: '0.84rem',
              }}
            >
              <div>
                <b style={{ color: 'var(--text-2)' }}>{o.customer_name || 'Клиент'}</b>
                {o.customer_phone && <span> · {o.customer_phone}</span>}
              </div>
              {(o.restaurant_name || o.restaurant_address) && (
                <div>
                  {o.restaurant_name && (
                    <b style={{ color: 'var(--text-2)' }}>{o.restaurant_name}</b>
                  )}
                  {o.restaurant_name && o.restaurant_address && <span> · </span>}
                  {o.restaurant_address && <span>{o.restaurant_address}</span>}
                </div>
              )}
            </div>
          </button>
        );
      })}

      {isEmpty && (
        <EmptyState
          title="Заказов пока нет"
          subtitle="Для выбранных фильтров нет результатов"
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
