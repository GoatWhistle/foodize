import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrderStore } from "../../store/useOrderStore";
import { useShallow } from "zustand/react/shallow";
import { orderService } from "../../services/orderService";
import { createOrderWebSocket } from "../../services/api";
import { BackButton } from "../../telegram/sdk";
import OrderStatusBadge from "../../components/ui/OrderStatusBadge";
import { ORDER_STATUS_RU } from "../../utils/locales";

const STATUS_LABEL = ORDER_STATUS_RU;

const STATUS_COLOR = {
  PENDING: "#f59e0b",
  ACCEPTED: "#3b82f6",
  READY: "#22c55e",
  COMPLETED: "#6b7280",
  CANCELLED: "#ef4444",
};

const STATUS_FLOW = ["PENDING", "ACCEPTED", "READY", "COMPLETED"];
const TERMINAL = new Set(["COMPLETED", "CANCELLED"]);

const getDisplayId = (order) => order.display_id ?? order.id.slice(0, 8);

const getStages = (order, events) => {
  const byStatus = new Map((events || []).map((e) => [e.new_status, e]));
  if (order.status === "CANCELLED") {
    return STATUS_FLOW.map((s) => ({
      status: s,
      at: s === "PENDING" ? order.created_at : byStatus.get(s)?.created_at,
      state: byStatus.has(s) || s === "PENDING" ? "done" : "next",
    }));
  }
  const curIdx = STATUS_FLOW.indexOf(order.status);
  return STATUS_FLOW.map((s, i) => ({
    status: s,
    at: s === "PENDING" ? order.created_at : byStatus.get(s)?.created_at,
    state: i < curIdx ? "done" : i === curIdx ? "current" : "next",
  }));
};

const OrderStatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchOrder, currentOrder, clearActiveOrder } = useOrderStore(
    useShallow((s) => ({
      fetchOrder: s.fetchOrder,
      currentOrder: s.currentOrder,
      clearActiveOrder: s.clearActiveOrder,
    })),
  );
  const wsRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (BackButton) {
      BackButton.show();
      const handler = () => navigate("/orders");
      BackButton.onClick(handler);
      return () => {
        BackButton.offClick(handler);
        BackButton.hide();
      };
    }
  }, [navigate]);

  const loadEvents = useCallback(async () => {
    try {
      const res = await orderService.getOrderEvents(id);
      setEvents(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {}
  }, [id]);

  useEffect(() => {
    fetchOrder(id);
    loadEvents();
    wsRef.current = createOrderWebSocket(
      id,
      (data) => {
        if (!data.error) {
          useOrderStore.setState({ currentOrder: data });
          loadEvents();
        }
      },
      () => {
        if (!TERMINAL.has(useOrderStore.getState().currentOrder?.status))
          fetchOrder(id);
      },
    );
    return () => wsRef.current?.close();
  }, [id, fetchOrder, loadEvents]);

  if (!currentOrder) {
    return (
      <div
        className="status-screen"
        style={{
          justifyContent: "flex-start",
          padding: "24px 16px calc(var(--bottom-tab-h, 68px) + 24px)",
        }}
      >
        <div
          className="skeleton"
          style={{
            width: 160,
            height: 48,
            borderRadius: "var(--r-md)",
            marginBottom: 24,
            alignSelf: "center",
          }}
        />
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: 18,
            marginBottom: 14,
          }}
        >
          <div
            className="skeleton"
            style={{ width: 80, height: 11, marginBottom: 16 }}
          />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div className="skeleton" style={{ width: "58%", height: 14 }} />
              <div className="skeleton" style={{ width: "18%", height: 14 }} />
            </div>
          ))}
        </div>
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: 18,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
              }}
            >
              <div
                className="skeleton"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
              <div
                className="skeleton"
                style={{ width: `${40 + i * 10}%`, height: 13 }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const color = STATUS_COLOR[currentOrder.status] ?? "#6b7280";
  const stages = getStages(currentOrder, events);
  const isReady = currentOrder.status === "READY";

  const handleComplete = async () => {
    setCompleting(true);
    setCompleteError("");
    try {
      await orderService.completeOrder(id);
      await fetchOrder(id);
    } catch {
      setCompleteError("Не удалось подтвердить получение");
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = () => {
    const tgApp = window.Telegram?.WebApp;
    const doCancel = async () => {
      setCancelling(true);
      try {
        await orderService.cancelOrder(id);
        await fetchOrder(id);
        clearActiveOrder();
      } catch {
        setCompleteError("Не удалось отменить заказ");
      } finally {
        setCancelling(false);
      }
    };
    if (tgApp?.showConfirm) {
      tgApp.showConfirm("Отменить заказ?", (ok) => ok && doCancel());
    } else {
      if (window.confirm("Отменить заказ?")) doCancel();
    }
  };

  return (
    <div
      className="status-screen"
      style={{
        justifyContent: "flex-start",
        padding: "24px 16px calc(var(--bottom-tab-h, 68px) + 24px)",
      }}
    >
      <OrderStatusBadge status={currentOrder.status} />

      {currentOrder.status === "CANCELLED" && (
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "var(--r-md)",
            padding: "12px 16px",
            marginBottom: 14,
            fontSize: "0.85rem",
            color: "#ef4444",
            fontWeight: 600,
          }}
        >
          Заказ был отменён
        </div>
      )}

      {/* Order composition */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          padding: 18,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-3)",
            marginBottom: 12,
          }}
        >
          Заказ #{getDisplayId(currentOrder)}
        </div>

        {(currentOrder.items || []).map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              padding: "8px 0",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--text-3)",
                  marginRight: 6,
                }}
              >
                ×{item.quantity}
              </span>
              <span style={{ color: "var(--text-1)" }}>
                {item.menu_item_name}
              </span>
              {item.selected_options?.length > 0 && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-3)",
                    marginTop: 2,
                  }}
                >
                  {item.selected_options
                    .map(
                      (o) =>
                        `${o.name}${o.price_delta ? ` +${o.price_delta}₽` : ""}`,
                    )
                    .join(", ")}
                </div>
              )}
            </div>
            <span style={{ fontWeight: 700, marginLeft: 8 }}>
              {item.price_at_purchase} ₽
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
          }}
        >
          <span>Итого</span>
          <span style={{ color: "var(--fire)" }}>
            {currentOrder.total_price} ₽
          </span>
        </div>

        {/* Estimated ready time */}
        {currentOrder.estimated_ready_at && !isReady && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid var(--border)",
              fontSize: "0.85rem",
              color: "var(--text-2)",
            }}
          >
            <span style={{ fontWeight: 700, color: "var(--fire)" }}>
              Ожидаем к{" "}
            </span>
            {new Date(currentOrder.estimated_ready_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}

        {/* Actual ready time */}
        {currentOrder.ready_at && isReady && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid var(--border)",
              fontSize: "0.85rem",
              color: "var(--text-2)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontWeight: 700, color: "var(--fire)" }}>
              Готов в
            </span>
            {new Date(currentOrder.ready_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>

      {/* Stages */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          padding: 18,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-3)",
            marginBottom: 12,
          }}
        >
          Этапы
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {stages.map((stage, i) => (
            <div key={stage.status} style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background:
                      stage.state === "current"
                        ? color
                        : stage.state === "done"
                          ? "#22c55e"
                          : "var(--border)",
                  }}
                />
                {i !== stages.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      background: "var(--border)",
                      marginTop: 4,
                      minHeight: 18,
                    }}
                  />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color:
                      stage.state === "next"
                        ? "var(--text-3)"
                        : "var(--text-1)",
                  }}
                >
                  {STATUS_LABEL[stage.status] ?? stage.status}
                  {stage.state === "current" && (
                    <span
                      style={{
                        color,
                        marginLeft: 8,
                        fontWeight: 400,
                        fontSize: "0.78rem",
                      }}
                    >
                      сейчас
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>
                  {stage.at
                    ? new Date(stage.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "ожидается"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Errors */}
      {completeError && (
        <div
          className="form-error"
          style={{ marginBottom: 12, width: "100%", maxWidth: 480 }}
        >
          {completeError}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          maxWidth: 480,
        }}
      >
        {(currentOrder.status === "PENDING" ||
          currentOrder.status === "ACCEPTED") && (
          <button
            className="btn btn-secondary"
            style={{
              width: "100%",
              color: "var(--color-error)",
              borderColor: "var(--color-error-border)",
            }}
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "Отмена..." : "Отменить заказ"}
          </button>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          {isReady && (
            <button
              className="btn btn-primary"
              style={{ flex: 1, background: "#22c55e", borderColor: "#22c55e" }}
              onClick={handleComplete}
              disabled={completing}
              id="complete-order-btn"
            >
              {completing ? "..." : "✓ Получил"}
            </button>
          )}
          {(currentOrder.status === "COMPLETED" ||
            currentOrder.status === "CANCELLED") && (
            <button
              className="btn btn-primary"
              style={{ flex: 1, background: "var(--fire)" }}
              onClick={async () => {
                const repeat = useOrderStore.getState().repeatOrder;
                await repeat(currentOrder);
                navigate(`/restaurant/${currentOrder.restaurant_id}`);
              }}
            >
              Повторить заказ
            </button>
          )}
          <button
            className="btn btn-secondary"
            style={{ flex: 2 }}
            onClick={() => navigate("/orders")}
            id="back-to-orders-btn"
          >
            ← К заказам
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;
