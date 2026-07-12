import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useOrdersStore } from "../../store/useOrdersStore";
import { createOrderWebSocket } from "../../services/api";
import { getOrderStatusStyle, getCustomerOrderStatusLabel } from "@shared/utils/orderStatus";
import type { ReliableWebSocket } from "@shared/services/api";
import type { OrderStatus } from "@shared/types/models";

const ACTIVE_STATUSES = new Set(["PENDING", "ACCEPTED", "COOKING", "READY"]);

export default function ActiveOrderBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeOrder = useOrdersStore((s) => s.activeOrder);
  const setActiveOrder = useOrdersStore((s) => s.setActiveOrder);
  const clearActiveOrder = useOrdersStore((s) => s.clearActiveOrder);
  const wsRef = useRef<ReliableWebSocket | null>(null);

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
      const status = data.status;
      if (typeof status === "string") {
        if (["COMPLETED", "CANCELLED"].includes(status)) {
          clearActiveOrder();
        } else {
          const current = useOrdersStore.getState().activeOrder;
          if (current) {
            setActiveOrder({ ...current, status: status as OrderStatus });
          }
        }
      }
    });

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [activeOrderId, setActiveOrder, clearActiveOrder]);

  if (!activeOrder || !ACTIVE_STATUSES.has(activeOrder.status)) return null;

  if (location.pathname === `/orders/${activeOrder.display_id}`) return null;

  return (
    <button
      type="button"
      aria-label={`Открыть заказ #${activeOrder.display_id}`}
      onClick={() => {
        void navigate(`/orders/${activeOrder.display_id}`);
      }}
      style={{
        position: "fixed",
        top: "env(safe-area-inset-top, 0px)",
        left: 0,
        right: 0,
        zIndex: 100,
        width: "100%",
        border: "none",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        textAlign: "left",
        cursor: "pointer",
        boxShadow: "var(--shadow-md)",
        font: "inherit",
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
            color: getOrderStatusStyle(activeOrder.status).solid,
          }}
        >
          {getCustomerOrderStatusLabel(activeOrder.status)}
        </div>
      </div>
      <div
        style={{
          fontSize: "0.78rem",
          color: "var(--accent)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        Смотреть <ArrowRightIcon size={14} weight="bold" />
      </div>
    </button>
  );
}
