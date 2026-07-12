import type { Dispatch, SetStateAction } from 'react';
import type { AxiosResponse } from 'axios';
import EmptyState from '@shared/components/EmptyState/EmptyState';
import Pagination from '@shared/components/Pagination/Pagination';
import OrderDetailsModal, { type OrderStatusChangeData } from '../../../components/OrderDetailsModal/OrderDetailsModal';
import type { Order, Restaurant, OrderStatus } from '@shared/types/models';
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
    exportFn: () => Promise<AxiosResponse<Blob>>,
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
    exportOrdersCSV: (params: Record<string, unknown>) => Promise<AxiosResponse<Blob>>;
    [key: string]: (...args: never[]) => Promise<unknown>;
  };
  selectedRestaurant: Restaurant | null;
  STATUS_LABEL_RU: Record<string, string>;
  getOrderDisplayId: (order: Order) => string | number;
  formatOrderTime: (value?: string | null) => string;
}

const NEXT_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'ACCEPTED',
  ACCEPTED: 'READY',
  READY: 'COMPLETED',
};

const NEXT_ORDER_LABEL_RU: Partial<Record<OrderStatus, string>> = {
  PENDING: 'Принять',
  ACCEPTED: 'Готово',
  READY: 'Выдать',
};

export { NEXT_ORDER_STATUS, NEXT_ORDER_LABEL_RU };

export default function VendorOrdersTab({
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
  STATUS_LABEL_RU,
  getOrderDisplayId,
  formatOrderTime,
}: VendorOrdersTabProps) {
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
          <div className={styles.list}>
            {[1, 2].map((i) => (
              <div key={i} className={styles.group}>
                <div className={`skeleton ${styles.skeletonLabel}`} />
                {[1, 2].map((j) => (
                  <div key={j} className={`order-card skeleton ${styles.skeletonCard}`} />
                ))}
              </div>
            ))}
          </div>
        ) : !Array.isArray(restaurantOrders) || restaurantOrders.length === 0 ? (
          <EmptyState
            title="Нет заказов"
            subtitle={ordersStatusFilter ? 'В этом статусе заказов нет' : 'Пока никто не сделал заказ'}
          />
        ) : (
          <div className={`${styles.list} ${ordersLoading ? 'loading-dim' : ''}`}>
            {groupedRestaurantOrders.map((group) => (
              <div key={group.dateKey} className={styles.group}>
                <div className={styles.groupTitle}>{group.title}</div>
                {group.orders.map((order) => (
                  <VendorOrderCard
                    key={order.id}
                    order={order}
                    updatingOrderId={updatingOrderId}
                    setSelectedOrder={setSelectedOrder}
                    STATUS_LABEL_RU={STATUS_LABEL_RU}
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
          nextLabel={NEXT_ORDER_LABEL_RU}
          onStatusChange={handleOrderChange}
          onCancel={(orderId, reason) => handleCancelOrder(orderId, reason ?? '')}
          updating={updatingOrderId}
        />
      )}
    </>
  );
}
