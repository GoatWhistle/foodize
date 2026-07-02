import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrderStore } from "../store/useOrderStore";
import { createOrderWebSocket } from "../services/api";

const STATUS_LABEL = {
  PENDING: "Ожидает подтверждения",
  ACCEPTED: "Готовится",
  COOKING: "Готовится",
  READY: "Готов к выдаче",
};

const STATUS_COLOR = {
  PENDING: "var(--text-3)",
  ACCEPTED: "var(--mustard)",
  READY: "var(--color-success)",
};

export default function ActiveOrderBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeOrder = useOrderStore((s) => s.activeOrder);
  const setActiveOrder = useOrderStore((s) => s.setActiveOrder);
  const clearActiveOrder = useOrderStore((s) => s.clearActiveOrder);
  const wsRef = useRef(null);

  const activeOrderId = activeOrder?.id;

  useEffect(() => {
    if (!activeOrderId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    wsRef.current = createOrderWebSocket(activeOrderId, (data) => {
      if (data.status) {
        if (["COMPLETED", "CANCELLED"].includes(data.status)) {
          clearActiveOrder();
        } else {
          const current = useOrderStore.getState().activeOrder;
          if (current) setActiveOrder({ ...current, status: data.status });
        }
      }
    });

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [activeOrderId, setActiveOrder, clearActiveOrder]);

  if (!activeOrder || !STATUS_LABEL[activeOrder.status]) return null;

  // Don't cover the order's own status page with a redundant banner.
  if (location.pathname === `/orders/${activeOrder.display_id}`) return null;

  return (
    <div
      onClick={() => navigate(`/orders/${activeOrder.display_id}`)}
      style={{
        position: "fixed",
        top: "env(safe-area-inset-top, 0px)",
        left: 0,
        right: 0,
        zIndex: 100,
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "var(--text-3)",
            marginBottom: 1,
          }}
        >
          Заказ #{activeOrder.display_id}
        </div>
        <div
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: STATUS_COLOR[activeOrder.status],
          }}
        >
          {STATUS_LABEL[activeOrder.status]}
        </div>
      </div>
      <div
        style={{
          fontSize: "0.78rem",
          color: "var(--brand)",
          fontWeight: 600,
          textDecoration: "underline",
        }}
      >
        Смотреть →
      </div>
    </div>
  );
}
