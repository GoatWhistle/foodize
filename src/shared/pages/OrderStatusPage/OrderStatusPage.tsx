import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "@shared/store/useCartStore.instance";
import { useOrdersStore } from "@shared/store/useOrdersStore.instance";
import type { OrdersStoreState } from "@shared/store/createOrdersStore";
import { orderService } from "@shared/services/orderService";
import { useEtaText } from "@shared/hooks/useEtaText";
import { translateApiError } from "@shared/utils/translateApiError";
import HorizontalSteps from "@shared/components/HorizontalSteps/HorizontalSteps";
import { getOrderStatusStyle, getCustomerOrderStatusLabel } from "@shared/utils/orderStatus";
import { parseOrderMessage } from "@shared/utils/wsMessages";
import { OrderStatusSkeleton, OrderDetails } from "./OrderStatusSections";
import type { OrderStatus } from "@shared/types/models";
import styles from "./OrderStatusPage.module.css";

interface OrderWebSocket {
  close: () => void;
}

interface OrderStatusPageProps {
  createOrderWebSocket: (
    id: string,
    onMessage: (data: { error?: unknown } & Record<string, unknown>) => void,
    onClose: () => void,
  ) => OrderWebSocket;
  onBack?: string | (() => void);
  screenClassName?: string;
  showDetails?: boolean;
}

const TERMINAL_STATUSES = new Set<OrderStatus>(["COMPLETED", "CANCELLED"]);

const fmtTime = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const OrderStatusPage = ({ createOrderWebSocket, onBack, screenClassName = "status-screen", showDetails = true }: OrderStatusPageProps) => {
  const { id } = useParams();
  const orderId = id ?? "";
  const navigate = useNavigate();
  const { fetchOrder, currentOrder } = useOrdersStore(
    useShallow((s: OrdersStoreState) => ({ fetchOrder: s.fetchOrder, currentOrder: s.currentOrder })),
  );
  const wsRef = useRef<OrderWebSocket | null>(null);
  const prevStatusRef = useRef<OrderStatus | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [showBonAppetit, setShowBonAppetit] = useState(false);

  const loadOrder = useCallback(() => {
    fetchOrder(orderId).catch((err: unknown) => {
      setLoadError(translateApiError(err, "Не удалось загрузить заказ"));
    });
  }, [orderId, fetchOrder]);

  useEffect(() => {
    loadOrder();
    wsRef.current = createOrderWebSocket(
      orderId,
      (data) => {
        if (data.error) return;
        const order = parseOrderMessage(data);
        if (order) useOrdersStore.setState({ currentOrder: order });
      },
      () => {
        const status = useOrdersStore.getState().currentOrder?.status;
        if (!status || !TERMINAL_STATUSES.has(status)) loadOrder();
      },
    );
    return () => wsRef.current?.close();
  }, [orderId, loadOrder, createOrderWebSocket]);

  useEffect(() => {
    if (!currentOrder?.status) return;
    if (prevStatusRef.current && prevStatusRef.current !== currentOrder.status) {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(
        currentOrder.status === "READY" ? "heavy" : "medium",
      );
    }
    prevStatusRef.current = currentOrder.status;
  }, [currentOrder?.status]);

  useEffect(() => {
    if (currentOrder?.status === "COMPLETED") {
      const key = `order_seen_${orderId}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        setShowBonAppetit(true);
      }
    }
  }, [currentOrder?.status, orderId]);

  const etaText = useEtaText(currentOrder?.estimated_ready_at, currentOrder?.status ?? "PENDING");

  if (!currentOrder) {
    return <OrderStatusSkeleton screenClassName={screenClassName} loadError={loadError} />;
  }

  const pill = getOrderStatusStyle(currentOrder.status);
  const pillLabel = getCustomerOrderStatusLabel(currentOrder.status);
  const isReady = currentOrder.status === "READY";
  const isDone = TERMINAL_STATUSES.has(currentOrder.status);
  const backPath = onBack ?? "/orders";

  const handleComplete = async () => {
    setCompleting(true);
    setCompleteError("");
    try {
      await orderService.completeOrder(orderId);
      await fetchOrder(orderId);
    } catch {
      setCompleteError("Не удалось подтвердить получение");
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      await orderService.cancelOrder(orderId, null);
      await fetchOrder(orderId);
    } catch (err) {
      setCancelError(translateApiError(err, "Не удалось отменить заказ"));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={`${screenClassName} page-enter${isReady ? " status-ready-flash" : ""}`}>
      <div className={styles.header}>
        <div className={styles.headerLabel}>Заказ</div>
        <div className={`${styles.orderNumber}${currentOrder.status === "CANCELLED" ? ` ${styles.orderNumberCancelled}` : ""}`}>
          #{currentOrder.display_id}
        </div>
      </div>

      <div
        className={styles.pill}
        style={{ background: pill.bg, color: pill.color, border: `1px solid ${pill.border}` }}
      >
        {pillLabel}
      </div>

      {currentOrder.status === "CANCELLED" && currentOrder.cancellation_reason && (
        <div className={styles.cancelReason}>{currentOrder.cancellation_reason}</div>
      )}

      <HorizontalSteps order={currentOrder} />

      <div className={styles.etaBlock}>
        {isReady ? (
          <div className={styles.etaReady}>Подойдите к стойке — ваш заказ готов!</div>
        ) : etaText ? (
          <div className={`${styles.etaText}${etaText.startsWith("Задерж") ? ` ${styles.etaTextDelayed}` : ""}`}>
            {etaText}
          </div>
        ) : null}
        {showBonAppetit && <div className={styles.bonAppetit}>Приятного аппетита!</div>}
        <div className={styles.etaMeta}>
          Оформлен в {fmtTime(currentOrder.created_at)}
          {currentOrder.requested_pickup_at ? ` · выдача в ${fmtTime(currentOrder.requested_pickup_at)}` : ""}
        </div>
      </div>

      {showDetails && <OrderDetails order={currentOrder} />}

      {completeError && (
        <div className={`form-error ${styles.formError}`}>{completeError}</div>
      )}
      {cancelError && (
        <div className={`form-error ${styles.formError}`}>{cancelError}</div>
      )}

      <div className={styles.actions}>
        {isReady && (
          <button
            className={`btn btn-primary ${styles.successBtn}`}
            onClick={() => { void handleComplete(); }}
            disabled={completing}
          >
            {completing ? "Подтверждение..." : "Получил заказ"}
          </button>
        )}
        {isDone && (
          <button
            className={`btn btn-primary ${styles.actionBtn}`}
            onClick={() => {
              void (async () => {
                const repeat = useCartStore.getState().repeatOrder;
                await repeat(currentOrder);
                void navigate(`/restaurant/${currentOrder.restaurant_display_id}`);
              })();
            }}
          >
            Повторить заказ
          </button>
        )}
        {currentOrder.status === "PENDING" && (
          <button
            className={`btn btn-secondary ${styles.cancelBtn}`}
            onClick={() => { void handleCancel(); }}
            disabled={cancelling}
          >
            {cancelling ? "Отмена..." : "Отменить"}
          </button>
        )}
        <button
          className={`btn btn-secondary ${styles.backBtn}${isDone ? ` ${styles.actionBtn}` : ` ${styles.backBtnWide}`}`}
          onClick={() => { if (typeof backPath === "function") backPath(); else void navigate(backPath); }}
        >
          <ArrowLeftIcon size={16} weight="bold" /> Мои заказы
        </button>
      </div>
    </div>
  );
};

export default OrderStatusPage;
