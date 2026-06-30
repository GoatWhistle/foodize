import { Package, Clock, CheckCircle, HandPalm, ShieldWarning } from '@phosphor-icons/react';
import Pagination from '../../../components/ui/Pagination';
import EmptyState from '../../../components/ui/EmptyState';
import { ORDER_STATUS_RU } from '../../../utils/locales';
import { translateApiError } from '../../../utils/translateApiError';

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

const STATUS_MAP = {
  PENDING: { label: ORDER_STATUS_RU.PENDING, className: 'pending', icon: <Clock /> },
  ACCEPTED: { label: ORDER_STATUS_RU.ACCEPTED, className: 'pending', icon: <CheckCircle /> },
  READY: { label: ORDER_STATUS_RU.READY, className: 'ready', icon: <HandPalm /> },
  COMPLETED: { label: ORDER_STATUS_RU.COMPLETED, className: 'ready', icon: <CheckCircle weight="fill" /> },
};

const shortId = (value) => (value ? value.slice(0, 8) : '—');
const orderTitle = (order) => order.display_id ?? shortId(order.id);

export default function AdminResolutionTab({
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
}) {
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
        <ShieldWarning size={32} color="var(--error)" />
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Центр Модерации</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
            Инструменты ручной отмены и возврата средств для любых заказов.
          </div>
        </div>
      </div>

      <div style={wideFilterGridStyle}>
        <input
          className="form-input"
          style={filterControlStyle}
          placeholder="ID заказа, телефон клиента"
          value={orderSearchRaw}
          onChange={(event) => {
            setOrdersPage(1);
            setOrderSearchRaw(event.target.value);
          }}
        />
        <select
          className="form-input"
          style={filterControlStyle}
          value={orderFilters.status}
          onChange={(event) => {
            setOrdersPage(1);
            setOrderFilters((prev) => ({ ...prev, status: event.target.value }));
          }}
        >
          <option value="">Все статусы</option>
          <option value="PENDING">Новые</option>
          <option value="ACCEPTED">Принятые</option>
          <option value="READY">Готовы</option>
          <option value="COMPLETED">Выданы (Требуют возврата?)</option>
        </select>
      </div>

      {orders.map((o) => {
        const cfg = STATUS_MAP[o.status] || {
          label: o.status,
          className: 'pending',
          icon: <Package />,
        };
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
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedOrder(o)}
              >
                Подробности
              </button>
              {o.status !== 'CANCELLED' && (
                <button
                  className="btn btn-sm"
                  style={{ background: 'var(--error)', color: 'white' }}
                  onClick={() => {
                    setReasonDialog({
                      title: 'Принудительная отмена',
                      message: `Вы уверены, что хотите отменить заказ #${orderTitle(o)}?`,
                      confirmLabel: 'Отменить',
                      onConfirm: async (reason) => {
                        try {
                          await adminService.forceCancelOrder(o.id, reason);
                          setOrdersPage(1);
                        } catch (err) {
                          setActionError(
                            translateApiError(err, 'Не удалось отменить заказ. Попробуйте ещё раз.')
                          );
                        }
                      },
                    });
                  }}
                >
                  Принудительная отмена / Возврат
                </button>
              )}
            </div>
          </div>
        );
      })}

      {isEmpty && (
        <EmptyState
          title="Проблемных заказов не найдено"
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
