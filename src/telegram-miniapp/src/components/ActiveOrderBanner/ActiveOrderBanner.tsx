import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { useOrderStore } from "../../store/useOrderStore";
import { createOrderWebSocket } from "../../services/api";
import { getOrderStatusStyle, getCustomerOrderStatusLabel } from "@shared/utils/orderStatus";
import type { ReliableWebSocket } from "@shared/services/api";
import type { OrderStatus } from "@shared/types/models";

const ACTIVE_STATUSES = new Set(["PENDING", "ACCEPTED", "COOKING", "READY"]);

export default function ActiveOrderBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeOrder = useOrderStore((s) => s.activeOrder);
  const setActiveOrder = useOrderStore((s) => s.setActiveOrder);
  const clearActiveOrder = useOrderStore((s) => s.clearActiveOrder);
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
          const current = useOrderStore.getState().activeOrder;
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
    <div
      onClick={() => {
        void navigate(`/orders/${activeOrder.display_id}`);
      }}
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
            color: getOrderStatusStyle(activeOrder.status).solid,
          }}
        >
          {getCustomerOrderStatusLabel(activeOrder.status)}
        </div>
      </div>
      <div
        style={{
          fontSize: "0.78rem",
          color: "var(--brand)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        Смотреть <ArrowRight size={14} weight="bold" />
      </div>
    </div>
  );
}
