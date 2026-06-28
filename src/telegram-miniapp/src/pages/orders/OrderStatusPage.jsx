import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { useOrderStore } from "../../store/useOrderStore";
import { orderService } from "../../services/orderService";
import { createOrderWebSocket } from "../../services/api";
import { ORDER_STATUS_RU } from "../../utils/locales";
import s from "./OrderStatusPage.module.css";

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);
const STATUS_FLOW = ["PENDING", "ACCEPTED", "READY", "COMPLETED"];

const STATUS_PILL = {
  PENDING: { label: "Принимается", color: "var(--accent)", bg: "var(--accent-subtle)" },
  ACCEPTED: { label: "Готовится", color: "var(--accent-dim)", bg: "oklch(46% 0.12 42 / 0.12)" },
  READY: { label: "Готов к выдаче", color: "var(--color-success)", bg: "var(--color-success-bg)" },
  COMPLETED: { label: "Выдан", color: "var(--dusk)", bg: "rgba(107,93,74,0.1)" },
  CANCELLED: { label: "Отменён", color: "var(--color-error)", bg: "var(--color-error-bg)" },
};

const haptic = (type = "medium") => {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
  } catch {}
};

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const useEtaText = (estimatedReadyAt, status) => {
  const compute = useCallback(() => {
    if (TERMINAL_STATUSES.has(status) || status === "READY" || !estimatedReadyAt) return "";
    const diff = Math.round((new Date(estimatedReadyAt) - Date.now()) / 60000);
    return diff > 0 ? `Будет готов через ~${diff} мин` : "Задерживаемся, скоро будет";
  }, [estimatedReadyAt, status]);

  const [text, setText] = useState(compute);
  useEffect(() => {
    setText(compute());
    if (TERMINAL_STATUSES.has(status) || status === "READY" || !estimatedReadyAt) return;
    const id = setInterval(() => setText(compute()), 30_000);
    return () => clearInterval(id);
  }, [estimatedReadyAt, status, compute]);
  return text;
};

const HorizontalSteps = ({ order }) => {
  const currentIndex = order.status === "CANCELLED" ? -1 : STATUS_FLOW.indexOf(order.status);

  return (
    <div style={{ width: "100%", maxWidth: 360, marginTop: 24, padding: "0 4px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {STATUS_FLOW.map((status, i) => {
          const state =
            order.status === "CANCELLED"
              ? "next"
              : i < currentIndex
                ? "done"
                : i === currentIndex
                  ? "current"
                  : "next";

          const dotColor =
            state === "done"
              ? "var(--color-success)"
              : state === "current"
                ? "var(--accent)"
                : "var(--border-hi)";

          const isActiveLine =
            i === currentIndex + 1 &&
            order.status !== "CANCELLED" &&
            order.status !== "COMPLETED";

          const lineColor =
            i <= currentIndex && order.status !== "CANCELLED"
              ? "var(--color-success)"
              : "var(--border)";

          return (
            <Fragment key={status}>
              {i > 0 && (
                <div
                  className={isActiveLine ? s.stepLineActive : ""}
                  style={{
                    flex: 1,
                    height: 2,
                    background: isActiveLine ? undefined : lineColor,
                    marginBottom: 18,
                    transition: isActiveLine ? "none" : "background 0.4s",
                    borderRadius: 2,
                  }}
                />
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <div
                  className={state === "current" ? s.stepDotActive : ""}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                    transition: "background 0.4s",
                    boxShadow:
                      state === "done"
                        ? "0 0 0 3px var(--color-success-bg)"
                        : state === "current"
                          ? "0 0 0 3px var(--accent-subtle)"
                          : "none",
                  }}
                />
                <div
                  style={{
                    fontSize: "0.64rem",
                    fontWeight: state === "current" ? 800 : 500,
                    color:
                      state === "next"
                        ? "var(--text-3)"
                        : state === "current"
                          ? "var(--accent)"
                          : "var(--color-success)",
                    textAlign: "center",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    letterSpacing: "0.03em",
                  }}
                >
                  {ORDER_STATUS_RU[status] ?? status}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

const OrderStatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchOrder, currentOrder } = useOrderStore(
    useShallow((s) => ({
      fetchOrder: s.fetchOrder,
      currentOrder: s.currentOrder,
    })),
  );
  const wsRef = useRef(null);
  const prevStatusRef = useRef(null);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showBonAppetit, setShowBonAppetit] = useState(false);

  const loadOrder = useCallback(() => fetchOrder(id), [id, fetchOrder]);

  useEffect(() => {
    loadOrder();

    wsRef.current = createOrderWebSocket(
      id,
      (data) => {
        if (data.error) return;
        useOrderStore.setState({ currentOrder: data });
      },
      () => {
        if (!TERMINAL_STATUSES.has(useOrderStore.getState().currentOrder?.status)) {
          loadOrder();
        }
      },
    );

    return () => wsRef.current?.close();
  }, [id, loadOrder]);

  useEffect(() => {
    if (!currentOrder?.status) return;
    if (prevStatusRef.current && prevStatusRef.current !== currentOrder.status) {
      haptic(currentOrder.status === "READY" ? "heavy" : "medium");
    }
    prevStatusRef.current = currentOrder.status;
  }, [currentOrder?.status]);

  useEffect(() => {
    if (currentOrder?.status === "COMPLETED") {
      const key = `order_seen_${id}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        setShowBonAppetit(true);
        haptic("heavy");
      }
    }
  }, [currentOrder?.status, id]);

  const etaText = useEtaText(currentOrder?.estimated_ready_at, currentOrder?.status);

  if (!currentOrder) {
    return (
      <div className={s.screen}>
        <div className="skeleton" style={{ width: 60, height: 14, marginBottom: 8, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: 140, height: 72, borderRadius: 8, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: 280, height: 32, borderRadius: 20, marginBottom: 24 }} />
        <div
          style={{
            width: "100%",
            maxWidth: 380,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: 20,
            marginBottom: 16,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="skeleton" style={{ width: "58%", height: 14 }} />
              <div className="skeleton" style={{ width: "18%", height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pill = STATUS_PILL[currentOrder.status] || STATUS_PILL.PENDING;
  const isReady = currentOrder.status === "READY";
  const isDone = TERMINAL_STATUSES.has(currentOrder.status);

  const handleComplete = async () => {
    setCompleting(true);
    setCompleteError("");
    haptic("medium");
    try {
      await orderService.completeOrder(id);
      await fetchOrder(id);
    } catch {
      setCompleteError("Не удалось подтвердить получение");
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await orderService.cancelOrder(id, null);
      await fetchOrder(id);
    } catch {
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={`${s.screen} page-enter${isReady ? ` ${s.readyFlash}` : ""}`}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "0.64rem",
            color: "var(--text-3)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Заказ
        </div>
        <div
          style={{
            fontSize: "clamp(3.5rem, 14vw, 5rem)",
            fontWeight: 900,
            color: currentOrder.status === "CANCELLED" ? "var(--text-3)" : "var(--text-1)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          #{currentOrder.display_id}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "inline-flex",
          alignItems: "center",
          padding: "6px 16px",
          borderRadius: 99,
          background: pill.bg,
          color: pill.color,
          fontWeight: 800,
          fontSize: "0.8rem",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          border: `1px solid ${pill.color}33`,
        }}
      >
        {pill.label}
      </div>

      {currentOrder.status === "CANCELLED" && currentOrder.cancellation_reason && (
        <div
          style={{
            marginTop: 8,
            fontSize: "0.82rem",
            color: "var(--text-2)",
            textAlign: "center",
            maxWidth: 300,
          }}
        >
          {currentOrder.cancellation_reason}
        </div>
      )}

      <HorizontalSteps order={currentOrder} />

      <div style={{ marginTop: 14, textAlign: "center", minHeight: 44 }}>
        {isReady ? (
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-success)" }}>
            Подойдите к стойке — ваш заказ готов!
          </div>
        ) : etaText ? (
          <div
            style={{
              fontWeight: 600,
              fontSize: "0.85rem",
              color: etaText.startsWith("Задерж") ? "#f97316" : "var(--text-2)",
            }}
          >
            {etaText}
          </div>
        ) : null}
        {showBonAppetit && (
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-success)", marginTop: 4 }}>
            Приятного аппетита!
          </div>
        )}
        <div style={{ marginTop: 6, fontSize: "0.72rem", color: "var(--text-3)" }}>
          Оформлен в {fmtTime(currentOrder.created_at)}
          {currentOrder.requested_pickup_at
            ? ` · выдача в ${fmtTime(currentOrder.requested_pickup_at)}`
            : ""}
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          width: "100%",
          maxWidth: 380,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: "16px 18px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.64rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-3)",
            marginBottom: 12,
          }}
        >
          Состав заказа
        </div>

        {Array.isArray(currentOrder.items) &&
          currentOrder.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid var(--border)",
                fontSize: "0.88rem",
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--accent)", minWidth: 24, fontSize: "0.78rem" }}>
                ×{item.quantity}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "var(--text-1)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.menu_item_name}
                </div>
                {item.selected_options?.length > 0 && (
                  <div style={{ marginTop: 2, fontSize: "0.7rem", color: "var(--text-3)", lineHeight: 1.35 }}>
                    {item.selected_options
                      .map((o) => `${o.name}${o.price_delta ? ` +${o.price_delta} ₽` : ""}`)
                      .join(", ")}
                  </div>
                )}
              </div>
              <span style={{ fontWeight: 700, flexShrink: 0, color: "var(--text-1)" }}>
                {item.price_at_purchase * item.quantity} ₽
              </span>
            </div>
          ))}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 12,
            fontWeight: 800,
            fontSize: "1rem",
            letterSpacing: "-0.01em",
          }}
        >
          <span style={{ color: "var(--text-2)" }}>Итого</span>
          <span style={{ color: "var(--accent)" }}>{currentOrder.total_price} ₽</span>
        </div>
      </div>

      {(currentOrder.restaurant_name || currentOrder.restaurant_address) && (
        <div
          style={{
            marginTop: 10,
            width: "100%",
            maxWidth: 380,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: "12px 18px",
          }}
        >
          {currentOrder.restaurant_name && (
            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-1)" }}>
              {currentOrder.restaurant_name}
            </div>
          )}
          {currentOrder.restaurant_address && (
            <div style={{ fontSize: "0.78rem", color: "var(--text-3)", marginTop: 2 }}>
              {currentOrder.restaurant_address}
            </div>
          )}
        </div>
      )}

      {completeError && (
        <div className="form-error" style={{ marginTop: 16, maxWidth: 380, width: "100%" }}>
          {completeError}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16, width: "100%", maxWidth: 380 }}>
        {isReady && (
          <button
            className="btn btn-primary"
            style={{ flex: 1, background: "var(--color-success)", borderColor: "var(--color-success)" }}
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? "Подтверждение..." : "Получил заказ"}
          </button>
        )}
        {isDone && (
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={async () => {
              haptic("light");
              const repeat = useOrderStore.getState().repeatOrder;
              await repeat(currentOrder);
              navigate(`/restaurant/${currentOrder.restaurant_display_id || currentOrder.restaurant_id}`);
            }}
          >
            Повторить заказ
          </button>
        )}
        {currentOrder.status === "PENDING" && (
          <button
            className="btn btn-secondary"
            style={{ flex: 1, color: "var(--color-error)", borderColor: "var(--color-error-border)" }}
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "Отмена..." : "Отменить"}
          </button>
        )}
        <button
          className="btn btn-secondary"
          style={{ flex: isDone ? 1 : 2 }}
          onClick={() => navigate("/orders")}
        >
          ← Мои заказы
        </button>
      </div>
    </div>
  );
};

export default OrderStatusPage;
