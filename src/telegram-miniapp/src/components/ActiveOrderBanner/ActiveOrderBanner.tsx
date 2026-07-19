import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useOrdersStore } from "../../store/useOrdersStore";
import { createOrderWebSocket } from "../../services/api";
import { getOrderStatusStyle, getCustomerOrderStatusLabel } from "@shared/utils/orderStatus";
import type { ReliableWebSocket } from "@shared/services/api";
import type { OrderStatus } from "@shared/types/models";
import styles from "./ActiveOrderBanner.module.css";

const ACTIVE_STATUSES = new Set(["PENDING", "ACCEPTED", "READY"]);

export function ActiveOrderBanner() {
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
      const status = data['status'];
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
      className={styles['banner']}
    >
      <div>
        <div className={styles['orderId']}>Заказ #{activeOrder.display_id}</div>
        <div
          className={styles['status']}
          style={{ color: getOrderStatusStyle(activeOrder.status).solid }}
        >
          {getCustomerOrderStatusLabel(activeOrder.status)}
        </div>
      </div>
      <div className={styles['cta']}>
        Смотреть <ArrowRightIcon size={14} weight="bold" />
      </div>
    </button>
  );
}
