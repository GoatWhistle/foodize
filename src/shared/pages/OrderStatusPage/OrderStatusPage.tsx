import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "@shared/store/useCartStore.instance";
import { useOrdersStore } from "@shared/store/useOrdersStore.instance";
import type { OrdersStoreState } from "@shared/store/createOrdersStore";
import { orderService } from "@shared/services/orderService";
import { useEtaState } from "@shared/hooks/useEtaText";
import { translateApiError } from "@shared/utils/translateApiError";
import { HorizontalSteps } from "@shared/components/HorizontalSteps/HorizontalSteps";
import { getOrderStatusStyle, getCustomerOrderStatusLabel } from "@shared/utils/orderStatus";
import { parseOrderMessage } from "@shared/utils/wsMessages";
import { OrderStatusSkeleton, OrderDetails } from "./OrderStatusSections";
import type { OrderStatus } from "@shared/types/models";
import { useTranslation } from "@shared/i18n/useTranslation";
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
  const date = new Date(iso);
  return isNaN(date.getTime()) ? "" : date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

export const OrderStatusPage = ({ createOrderWebSocket, onBack, screenClassName = "status-screen", showDetails = true }: OrderStatusPageProps) => {
  const { t } = useTranslation();
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
    void (async () => {
      try {
        await fetchOrder(orderId);
      } catch (error) {
        setLoadError(translateApiError(error, t("order.status.loadFailed")));
      }
    })();
  }, [orderId, fetchOrder, t]);

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

  const { text: etaText, delayed } = useEtaState(
    currentOrder?.estimated_ready_at,
    currentOrder?.status ?? "PENDING",
  );

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
      setCompleteError(t("order.status.confirmFailed"));
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
      setCancelError(translateApiError(err, t("order.status.cancelFailed")));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={`${screenClassName} page-enter${isReady ? " status-ready-flash" : ""}`}>
      <div className={styles['header']}>
        <div className={styles['headerLabel']}>{t("order.status.headerLabel")}</div>
        <div className={`${styles['orderNumber']}${currentOrder.status === "CANCELLED" ? ` ${styles['orderNumberCancelled']}` : ""}`}>
          #{currentOrder.display_id}
        </div>
      </div>

      <div
        className={styles['pill']}
        style={{ background: pill.bg, color: pill.color, border: `1px solid ${pill.border}` }}
      >
        {pillLabel}
      </div>

      {currentOrder.status === "CANCELLED" && currentOrder.cancellation_reason && (
        <div className={styles['cancelReason']}>{currentOrder.cancellation_reason}</div>
      )}

      <HorizontalSteps order={currentOrder} />

      <div className={styles['etaBlock']}>
        {isReady ? (
          <div className={styles['etaReady']}>{t("order.status.readyCallout")}</div>
        ) : etaText ? (
          <div className={`${styles['etaText']}${delayed ? ` ${styles['etaTextDelayed']}` : ""}`}>
            {etaText}
          </div>
        ) : null}
        {showBonAppetit && <div className={styles['bonAppetit']}>{t("order.status.bonAppetit")}</div>}
        <div className={styles['etaMeta']}>
          {t("order.status.placedAt", { time: fmtTime(currentOrder.created_at) })}
          {currentOrder.requested_pickup_at
            ? t("order.status.pickupAt", { time: fmtTime(currentOrder.requested_pickup_at) })
            : ""}
        </div>
      </div>

      {showDetails && <OrderDetails order={currentOrder} />}

      {completeError && (
        <div className={`form-error ${styles['formError']}`}>{completeError}</div>
      )}
      {cancelError && (
        <div className={`form-error ${styles['formError']}`}>{cancelError}</div>
      )}

      <div className={styles['actions']}>
        {isReady && (
          <button
            className={`btn btn-primary ${styles['successBtn']}`}
            onClick={() => { void handleComplete(); }}
            disabled={completing}
          >
            {completing ? t("order.status.confirming") : t("order.status.confirmReceipt")}
          </button>
        )}
        {isDone && (
          <button
            className={`btn btn-primary ${styles['actionBtn']}`}
            onClick={() => {
              void (async () => {
                const repeat = useCartStore.getState().repeatOrder;
                await repeat(currentOrder);
                void navigate(`/restaurant/${currentOrder.restaurant_display_id}`);
              })();
            }}
          >
            {t("order.status.repeat")}
          </button>
        )}
        {currentOrder.status === "PENDING" && (
          <button
            className={`btn btn-secondary ${styles['cancelBtn']}`}
            onClick={() => { void handleCancel(); }}
            disabled={cancelling}
          >
            {cancelling ? t("order.status.cancelling") : t("order.status.cancel")}
          </button>
        )}
        <button
          className={`btn btn-secondary ${styles['backBtn']}${isDone ? ` ${styles['actionBtn']}` : ` ${styles['backBtnWide']}`}`}
          onClick={() => { if (typeof backPath === "function") backPath(); else void navigate(backPath); }}
        >
          <ArrowLeftIcon size={16} weight="bold" /> {t("order.status.backToOrders")}
        </button>
      </div>
    </div>
  );
};
