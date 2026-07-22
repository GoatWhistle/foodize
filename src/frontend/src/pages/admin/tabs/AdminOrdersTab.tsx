import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { Pagination } from '@shared/components/Pagination/Pagination';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Order } from '@shared/types/models';
import type { adminService as AdminService } from '../../../services/adminService';
import type { OrderFilters } from '../hooks/useAdminOrders';
import { AdminOrderCard } from './components/AdminOrderCard';
import styles from './components/adminTable.module.css';

const STATUS_CHIPS = [
  ['', 'admin.orders.filters.all'],
  ['PENDING', 'admin.orders.filters.pending'],
  ['ACCEPTED', 'admin.orders.filters.accepted'],
  ['READY', 'admin.orders.filters.ready'],
  ['COMPLETED', 'admin.orders.filters.completed'],
] as const;

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
  handleExport: (exportFn: () => Promise<Blob>, filename: string) => void;
  setSelectedOrder: Dispatch<SetStateAction<Order | null>>;
  todayStr: string;
  adminService: typeof AdminService;
  PAGE_SIZE: number;
}

export function AdminOrdersTab({
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
  const { t } = useTranslation();
  const isEmpty = !Array.isArray(orders) || orders.length === 0;

  if (ordersLoading && isEmpty) {
    return (
      <div className={styles['list']}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={styles['skeletonCard']}>
            <div className={`skeleton ${styles['skeletonLine']}`} style={{ width: '30%' }} />
            <div className={`skeleton ${styles['skeletonLineSub']}`} style={{ width: '70%' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${styles['list']} ${ordersLoading ? 'loading-dim' : ''}`}>
      <div className={styles['wideFilterGrid']}>
        <input
          className={`form-input ${styles['filterControl']}`}
          placeholder={t('admin.orders.searchPlaceholder')}
          value={orderSearchRaw}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setOrdersPage(1);
            setOrderSearchRaw(event.target.value);
          }}
        />
        <input
          className={`form-input ${styles['filterControl']}`}
          type="date"
          value={orderFilters.date_from}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setOrdersPage(1);
            setOrderFilters((prev) => ({ ...prev, date_from: event.target.value }));
          }}
        />
        <input
          className={`form-input ${styles['filterControl']}`}
          type="date"
          value={orderFilters.date_to}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setOrdersPage(1);
            setOrderFilters((prev) => ({ ...prev, date_to: event.target.value }));
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
        {STATUS_CHIPS.map(([key, labelKey]) => (
          <button
            key={key}
            className={`category-chip${orderFilters.status === key ? ' active' : ''}`}
            style={{ fontSize: "var(--text-sm)", padding: '6px 12px' }}
            onClick={() => {
              setOrderFilters((prev) => ({ ...prev, status: key }));
              setOrdersPage(1);
            }}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            { handleExport(
              () =>
                adminService.exportOrdersCSV({
                  date_from: orderFilters.date_from || undefined,
                  date_to: orderFilters.date_to || undefined,
                  status: orderFilters.status || undefined,
                }),
              t('admin.exportFiles.orders', { date: todayStr })
            ); }
          }
        >
          {exportLoading ? '...' : <><DownloadSimpleIcon size={16} weight="bold" /> CSV</>}
        </button>
      </div>

      {orders.map((o) => (
        <AdminOrderCard key={o.id} order={o} onOpen={setSelectedOrder} />
      ))}

      {isEmpty && (
        <EmptyState
          title={t('admin.orders.emptyTitle')}
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
