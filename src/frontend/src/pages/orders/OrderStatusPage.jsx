import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrderStore } from "../../store/useOrderStore";
import OrderStatusBadge from "../../components/ui/OrderStatusBadge";
import { ROUTES } from "../../constants/routes";

const POLL_INTERVAL = 5000; // 5 seconds

const OrderStatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchOrder, currentOrder } = useOrderStore();
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchOrder(id);

    // Poll every 5s until order is ready
    intervalRef.current = setInterval(async () => {
      const order = await fetchOrder(id);
      if (order?.status === "ready") {
        clearInterval(intervalRef.current);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [id, fetchOrder]);

  if (!currentOrder) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  const isReady = currentOrder.status === "ready";

  return (
    <div
      className={`status-screen page-enter${isReady ? " status-ready-flash" : ""}`}
    >
      <OrderStatusBadge status={currentOrder.status} progress={0.6} />

      {/* Order details */}
      <div
        style={{
          marginTop: 40,
          width: "100%",
          maxWidth: 380,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.75rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--stone)",
            marginBottom: 14,
          }}
        >
          Состав заказа
        </div>

        {currentOrder.items?.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.9rem",
            }}
          >
            <span style={{ fontWeight: 600 }}>×{item.quantity}</span>
            <span
              style={{ flex: 1, marginLeft: 12, color: "var(--text-primary)" }}
            >
              Позиция #{item.menu_item_id.slice(0, 6)}
            </span>
            <span style={{ fontWeight: 700 }}>{item.price_at_purchase} ₽</span>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 14,
            fontWeight: 800,
            fontSize: "1.1rem",
            letterSpacing: "-0.02em",
          }}
        >
          <span>Итого</span>
          <span style={{ color: "var(--ember-orange)" }}>
            {currentOrder.total_price} ₽
          </span>
        </div>
      </div>

      <button
        className="btn btn-secondary"
        style={{ marginTop: 24 }}
        onClick={() => navigate(ROUTES.ORDERS)}
        id="back-to-orders-btn"
      >
        ← Все заказы
      </button>
    </div>
  );
};

export default OrderStatusPage;
