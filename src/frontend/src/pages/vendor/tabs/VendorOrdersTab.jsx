import { ArrowsClockwise, CaretRight } from '@phosphor-icons/react';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import OrderDetailsModal from '../../../components/ui/OrderDetailsModal';

const NEXT_ORDER_STATUS = {
  PENDING: 'ACCEPTED',
  ACCEPTED: 'READY',
  READY: 'COMPLETED',
};

const NEXT_ORDER_LABEL_RU = {
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
}) {
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
              {exportLoading ? '...' : '↓ CSV'}
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
                  <div
                    key={order.id}
                    className="order-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        Заказ #{getOrderDisplayId(order)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                        {formatOrderTime(order.created_at) && (
                          <>{formatOrderTime(order.created_at)} • </>
                        )}
                        {order.items?.length || 0} позиц. • {order.total_price} ₽
                        {order.requested_pickup_at && (
                          <> • к выдаче {formatOrderTime(order.requested_pickup_at)}</>
                        )}
                      </div>
                      {order.items?.length > 0 && (
                        <div
                          style={{
                            marginTop: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            color: 'var(--text-2)',
                            fontSize: '0.78rem',
                          }}
                        >
                          {(order.items ?? []).map((item) => (
                            <div key={item.id}>
                              ×{item.quantity} {item.menu_item_name}
                              {item.selected_options?.length > 0 && (
                                <span style={{ color: 'var(--text-3)' }}>
                                  {' '}(
                                  {item.selected_options
                                    .map(
                                      (option) =>
                                        `${option.name}${option.price_delta ? ` +${option.price_delta} ₽` : ''}`
                                    )
                                    .join(', ')}
                                  )
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 6,
                      }}
                    >
                      <span
                        className={`order-status-badge ${
                          order.status === 'PENDING'
                            ? 'pending'
                            : order.status === 'ACCEPTED'
                              ? 'preparing'
                              : 'ready'
                        }`}
                      >
                        {STATUS_LABEL_RU[order.status] ?? order.status}
                      </span>
                      {NEXT_ORDER_STATUS[order.status] && (
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={updatingOrderId === order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                        >
                          Детали
                          <CaretRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
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
          onCancel={handleCancelOrder}
          updating={updatingOrderId}
        />
      )}
    </>
  );
}
