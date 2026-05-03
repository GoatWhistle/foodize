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
  COOKING: "#f97316",
  READY: "#22c55e",
  COMPLETED: "#6b7280",
  CANCELLED: "#ef4444",
};

const STATUS_FLOW = ["PENDING", "ACCEPTED", "COOKING", "READY", "COMPLETED"];
const TERMINAL = new Set(["COMPLETED", "CANCELLED"]);

const getDisplayId = (order) => order.display_id ?? order.id.slice(0, 8);

const getStages = (order, events) => {
  const byStatus = new Map((events || []).map((e) => [e.new_status, e]));
  const curIdx = STATUS_FLOW.indexOf(order.status);
  if (order.status === "CANCELLED") {
    return [...STATUS_FLOW.slice(0, Math.max(curIdx, 0) + 1), "CANCELLED"].map(
      (s) => ({
        status: s,
        at: s === "PENDING" ? order.created_at : byStatus.get(s)?.created_at,
        state: s === "CANCELLED" ? "current" : "done",
      }),
    );
  }
  return STATUS_FLOW.map((s, i) => ({
    status: s,
    at: s === "PENDING" ? order.created_at : byStatus.get(s)?.created_at,
    state: i < curIdx ? "done" : i === curIdx ? "current" : "next",
  }));
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
  const [events, setEvents] = useState([]);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [completeError, setCompleteError] = useState("");

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
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  const color = STATUS_COLOR[currentOrder.status] ?? "#6b7280";
  const stages = getStages(currentOrder, events);
  const isPending = currentOrder.status === "PENDING";
  const isReady = currentOrder.status === "READY";
  const isCancelled = currentOrder.status === "CANCELLED";

  const cookingProgress = (() => {
    if (currentOrder.status !== "COOKING") return 0.6;
    if (!currentOrder.estimated_ready_at || !currentOrder.updated_at)
      return 0.3;
    const start = new Date(currentOrder.updated_at).getTime();
    const end = new Date(currentOrder.estimated_ready_at).getTime();
    const now = Date.now();
    return Math.min(1, Math.max(0.05, (now - start) / (end - start)));
  })();

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      await orderService.cancelOrder(id);
      await fetchOrder(id);
    } catch {
      setCancelError("Не удалось отменить заказ");
    } finally {
      setCancelling(false);
    }
  };

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

  return (
    <div
      className="status-screen"
      style={{ justifyContent: "flex-start", padding: "24px 16px 100px" }}
    >
      <OrderStatusBadge
        status={currentOrder.status}
        progress={cookingProgress}
      />

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
        {currentOrder.estimated_ready_at && !isReady && !isCancelled && (
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
      {(cancelError || completeError) && (
        <div
          className="form-error"
          style={{ marginBottom: 12, width: "100%", maxWidth: 480 }}
        >
          {cancelError || completeError}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 480 }}>
        {isPending && (
          <button
            className="btn btn-secondary"
            style={{ flex: 1, color: "#ef4444" }}
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "Отмена..." : "Отменить"}
          </button>
        )}
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
        {["COMPLETED", "CANCELLED"].includes(currentOrder.status) && (
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
  );
};

export default OrderStatusPage;
