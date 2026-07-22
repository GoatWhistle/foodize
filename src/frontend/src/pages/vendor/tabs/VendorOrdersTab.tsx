import type { Dispatch, SetStateAction } from 'react';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import { Pagination } from '@shared/components/Pagination/Pagination';
import { OrderDetailsModal, type OrderStatusChangeData } from '../../../components/OrderDetailsModal/OrderDetailsModal';
import type { Order, Restaurant, OrderStatus } from '@shared/types/models';
import { useTranslation } from '@shared/i18n/useTranslation';
import { VendorOrderCard } from './components/VendorOrderCard';
import { VendorOrdersToolbar } from './components/VendorOrdersToolbar';
import styles from './components/VendorOrders.module.css';

interface OrderGroup {
  dateKey: string;
  title: string;
  orders: Order[];
}

interface VendorOrdersTabProps {
  restaurantOrders: Order[];
  ordersPage: number;
  setOrdersPage: Dispatch<SetStateAction<number>>;
  ordersTotal: number;
  ordersStatusFilter: string;
  setOrdersStatusFilter: Dispatch<SetStateAction<string>>;
  ordersDateFromFilter: string;
  setOrdersDateFromFilter: Dispatch<SetStateAction<string>>;
  ordersDateToFilter: string;
  setOrdersDateToFilter: Dispatch<SetStateAction<string>>;
  ordersLoading: boolean;
  exportLoading: boolean;
  updatingOrderId: string | null;
  selectedOrder: Order | null;
  setSelectedOrder: Dispatch<SetStateAction<Order | null>>;
  todayStr: string;
  groupedRestaurantOrders: OrderGroup[];
  ordersError: string | null;
  handleVendorExport: (
    exportFn: () => Promise<Blob>,
    filename: string,
  ) => void;
  fetchVendorOrders: () => void;
  handleOrderChange: (
    orderId: string,
    status: OrderStatus,
    data?: OrderStatusChangeData,
  ) => Promise<void>;
  handleCancelOrder: (orderId: string, reason: string) => Promise<void>;
  vendorService: {
    exportOrdersCSV: (params: Record<string, unknown>) => Promise<Blob>;
    [key: string]: (...args: never[]) => Promise<unknown>;
  };
  selectedRestaurant: Restaurant | null;
  getOrderDisplayId: (order: Order) => string | number;
  formatOrderTime: (value?: string | null) => string;
}

const NEXT_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'ACCEPTED',
  ACCEPTED: 'READY',
  READY: 'COMPLETED',
};

const NEXT_ORDER_LABEL_KEYS: Partial<Record<OrderStatus, string>> = {
  PENDING: 'vendor.orders.nextLabel.accept',
  ACCEPTED: 'vendor.orders.nextLabel.ready',
  READY: 'vendor.orders.nextLabel.complete',
};

export { NEXT_ORDER_STATUS, NEXT_ORDER_LABEL_KEYS };

export function VendorOrdersTab({
  restaurantOrders,
  ordersPage,
  setOrdersPage,
  ordersTotal,
  ordersStatusFilter,
  setOrdersStatusFilter,
  ordersDateFromFilter,
  setOrdersDateFromFilter,
  ordersDateToFilter,
  setOrdersDateToFilter,
  ordersLoading,
  exportLoading,
  updatingOrderId,
  selectedOrder,
  setSelectedOrder,
  todayStr,
  groupedRestaurantOrders,
  ordersError,
  handleVendorExport,
  fetchVendorOrders,
  handleOrderChange,
  handleCancelOrder,
  vendorService,
  selectedRestaurant,
  getOrderDisplayId,
  formatOrderTime,
}: VendorOrdersTabProps) {
  const { t } = useTranslation();
  const nextOrderLabel = Object.fromEntries(
    Object.entries(NEXT_ORDER_LABEL_KEYS).map(([status, key]) => [status, t(key)]),
  ) as Partial<Record<OrderStatus, string>>;
  return (
    <>
      <div>
        {ordersError && (
          <div className="form-error" style={{ marginBottom: 12 }}>
            {ordersError}
          </div>
        )}
        <VendorOrdersToolbar
          ordersStatusFilter={ordersStatusFilter}
          setOrdersStatusFilter={setOrdersStatusFilter}
          ordersDateFromFilter={ordersDateFromFilter}
          setOrdersDateFromFilter={setOrdersDateFromFilter}
          ordersDateToFilter={ordersDateToFilter}
          setOrdersDateToFilter={setOrdersDateToFilter}
          setOrdersPage={setOrdersPage}
          ordersLoading={ordersLoading}
          exportLoading={exportLoading}
          todayStr={todayStr}
          selectedRestaurant={selectedRestaurant}
          handleVendorExport={handleVendorExport}
          fetchVendorOrders={fetchVendorOrders}
          vendorService={vendorService}
        />
        {ordersLoading && (!Array.isArray(restaurantOrders) || restaurantOrders.length === 0) ? (
          <div className={styles['list']}>
            {[1, 2].map((i) => (
              <div key={i} className={styles['group']}>
                <div className={`skeleton ${styles['skeletonLabel']}`} />
                {[1, 2].map((j) => (
                  <div key={j} className={`order-card skeleton ${styles['skeletonCard']}`} />
                ))}
              </div>
            ))}
          </div>
        ) : !Array.isArray(restaurantOrders) || restaurantOrders.length === 0 ? (
          <EmptyState
            title={t('vendor.orders.emptyTitle')}
            subtitle={ordersStatusFilter ? t('vendor.orders.emptySubtitleFiltered') : t('vendor.orders.emptySubtitle')}
          />
        ) : (
          <div className={`${styles['list']} ${ordersLoading ? 'loading-dim' : ''}`}>
            {groupedRestaurantOrders.map((group) => (
              <div key={group.dateKey} className={styles['group']}>
                <div className={styles['groupTitle']}>{group.title}</div>
                {group.orders.map((order) => (
                  <VendorOrderCard
                    key={order.id}
                    order={order}
                    updatingOrderId={updatingOrderId}
                    setSelectedOrder={setSelectedOrder}
                    nextOrderStatus={NEXT_ORDER_STATUS}
                    getOrderDisplayId={getOrderDisplayId}
                    formatOrderTime={formatOrderTime}
                  />
                ))}
              </div>
            ))}
            <Pagination
              page={ordersPage}
              totalPages={Math.ceil(ordersTotal / 20)}
              onPageChange={setOrdersPage}
            />
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => { setSelectedOrder(null); }}
          nextStatus={NEXT_ORDER_STATUS}
          nextLabel={nextOrderLabel}
          onStatusChange={handleOrderChange}
          onCancel={(orderId, reason) => handleCancelOrder(orderId, reason ?? '')}
          updating={updatingOrderId}
        />
      )}
    </>
  );
}
