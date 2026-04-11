import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderStore } from "../../store/useOrderStore";
import EmptyState from "../../components/ui/EmptyState";
import { ROUTES } from "../../constants/routes";

const STATUS_CONFIG = {
  pending: { label: "Принят", className: "pending" },
  preparing: { label: "Готовится", className: "preparing" },
  ready: { label: "Готов", className: "ready" },
};

const OrdersPage = () => {
  const { orders, fetchMyOrders, ordersLoading } = useOrderStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  if (ordersLoading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: "24px 16px" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: 20,
        }}
      >
        Мои заказы
      </h1>

      {orders.length === 0 ? (
        <EmptyState
          title="Заказов пока нет"
          subtitle="Сделайте первый заказ — это займёт меньше минуты"
          action={{
            label: "Выбрать заведение",
            onClick: () => navigate(ROUTES.HOME),
          }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className="order-card"
                onClick={() =>
                  navigate(ROUTES.ORDER_STATUS.replace(":id", order.id))
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  navigate(ROUTES.ORDER_STATUS.replace(":id", order.id))
                }
                aria-label={`Заказ на ${order.total_price} ₽`}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      letterSpacing: "-0.02em",
                      marginBottom: 4,
                    }}
                  >
                    Заказ #{order.id.slice(0, 8)}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--stone)" }}>
                    {order.items?.length || 0} позиц.
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "right",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 6,
                  }}
                >
                  <span className={`order-status-badge ${cfg.className}`}>
                    {cfg.label}
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "1.05rem",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {order.total_price} ₽
                  </span>
                </div>

                <span style={{ color: "var(--stone)", marginLeft: 8 }}>›</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
