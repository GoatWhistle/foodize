import type { Dispatch, SetStateAction } from 'react';
import type { AxiosResponse } from 'axios';
import { ArrowsClockwise, DownloadSimple } from '@phosphor-icons/react';
import EmptyState from '@shared/components/EmptyState/EmptyState';
import Pagination from '@shared/components/Pagination/Pagination';
import OrderDetailsModal, { type OrderStatusChangeData } from '../../../components/OrderDetailsModal/OrderDetailsModal';
import type { Order, Restaurant, OrderStatus } from '@shared/types/models';
import { VendorOrderCard } from './components/VendorOrderCard';

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
              Заказы заведения
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: '0.76rem' }}>
              Новые заказы обновляются автоматически
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={exportLoading}
              onClick={() =>
                handleVendorExport(
                  () =>
                    vendorService.exportOrdersCSV({
                      restaurant_id: selectedRestaurant?.id || undefined,
                      status: ordersStatusFilter || undefined,
                    }),
                  `заказы_${todayStr}.csv`
                )
              }
            >
              {exportLoading ? '...' : <><DownloadSimple size={16} weight="bold" /> CSV</>}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fetchVendorOrders()}
              disabled={ordersLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <ArrowsClockwise size={14} />
              {ordersLoading ? '...' : 'Обновить'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { key: '', label: 'Все' },
            { key: 'PENDING', label: 'Новые' },
            { key: 'ACCEPTED', label: 'Принятые' },
            { key: 'READY', label: 'Готовые' },
            { key: 'COMPLETED', label: 'Выданные' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`category-chip${ordersStatusFilter === key ? ' active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '4px 12px' }}
              onClick={() => {
                setOrdersStatusFilter(key);
                setOrdersPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <input
            className="form-input"
            type="date"
            value={ordersDateFromFilter}
            onChange={(e) => {
              setOrdersDateFromFilter(e.target.value);
              setOrdersPage(1);
            }}
            style={{ maxWidth: 140, height: 36, fontSize: '0.82rem' }}
            aria-label="Дата с"
          />
          <span style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>—</span>
          <input
            className="form-input"
            type="date"
            value={ordersDateToFilter}
            onChange={(e) => {
              setOrdersDateToFilter(e.target.value);
              setOrdersPage(1);
            }}
            style={{ maxWidth: 140, height: 36, fontSize: '0.82rem' }}
            aria-label="Дата по"
          />
          {(ordersDateFromFilter || ordersDateToFilter) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setOrdersDateFromFilter('');
                setOrdersDateToFilter('');
                setOrdersPage(1);
              }}
            >
              Сбросить период
            </button>
          )}
        </div>
        {ordersLoading && (!Array.isArray(restaurantOrders) || restaurantOrders.length === 0) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ width: '100px', height: 12, borderRadius: 4 }} />
                {[1, 2].map((j) => (
                  <div key={j} className="order-card skeleton" style={{ height: 80, border: 'none' }} />
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
          <div
            className={ordersLoading ? 'loading-dim' : undefined}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {groupedRestaurantOrders.map((group) => (
              <div key={group.dateKey} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    color: 'var(--text-3)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 2px',
                  }}
                >
                  {group.title}
                </div>
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
          onClose={() => setSelectedOrder(null)}
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
