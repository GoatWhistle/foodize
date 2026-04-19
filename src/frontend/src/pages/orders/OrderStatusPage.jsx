import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrderStore } from "../../store/useOrderStore";
import OrderStatusBadge from "../../components/ui/OrderStatusBadge";
import { ROUTES } from "../../constants/routes";
import { orderService } from "../../services/orderService";

const POLL_INTERVAL = 5000;

const OrderStatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchOrder, currentOrder } = useOrderStore();
  const intervalRef = useRef(null);
  const [cancelling, setCancelling] = useState(false);
  const [events, setEvents] = useState([]);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    fetchOrder(id);
    const loadEvents = async () => {
      try {
        const res = await orderService.getOrderEvents(id);
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        setEvents(list);
      } catch {
        // intentionally ignored — polling errors are non-fatal
      }
    };
    loadEvents();

    intervalRef.current = setInterval(async () => {
      const order = await fetchOrder(id);
      loadEvents();
      if (
        order?.status === "READY" ||
        order?.status === "CANCELLED" ||
        order?.status === "COMPLETED"
      ) {
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

  const isReady =
    currentOrder.status === "READY" || currentOrder.status === "COMPLETED";
  const isCancelled = currentOrder.status === "CANCELLED";
  const isPending = currentOrder.status === "PENDING";

  const handleCancel = async () => {
    if (!window.confirm("Вы уверены, что хотите отменить заказ?")) return;
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

  return (
    <div
      className={`status-screen page-enter${isReady ? " status-ready-flash" : ""}`}
    >
      <OrderStatusBadge
        status={currentOrder.status}
        progress={isCancelled ? 0 : 0.6}
      />

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

        {Array.isArray(currentOrder.items) &&
          currentOrder.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid var(--border)",
                fontSize: "0.9rem",
              }}
            >
              <span style={{ fontWeight: 600, marginRight: 8 }}>
                ×{item.quantity}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  {item.menu_item_name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--stone)" }}>
                  {item.menu_item_category}
                </div>
              </div>
              <span style={{ fontWeight: 700 }}>
                {item.price_at_purchase} ₽
              </span>
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

      <div
        style={{
          marginTop: 16,
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
          История заказа
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(!Array.isArray(events) || events.length === 0) && (
            <div style={{ fontSize: "0.85rem", color: "var(--stone)" }}>
              Загрузка событий...
            </div>
          )}
          {Array.isArray(events) &&
            events.map((ev, i) => (
              <div key={ev.id} style={{ display: "flex", gap: 12 }}>
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
                        i === events.length - 1
                          ? "var(--ember-orange)"
                          : "var(--border)",
                    }}
                  />
                  {i !== events.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        flex: 1,
                        background: "var(--border)",
                        marginTop: 4,
                        minHeight: 20,
                      }}
                    />
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}
                  >
                    {ev.new_status}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--stone)" }}>
                    {new Date(ev.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    • Участник: {ev.actor_role}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {cancelError && (
        <div
          className="form-error"
          style={{ marginTop: 16, maxWidth: 380, width: "100%" }}
        >
          {cancelError}
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: 12,
          width: "100%",
          maxWidth: 380,
        }}
      >
        {isPending && (
          <button
            className="btn btn-secondary"
            style={{ flex: 1, color: "var(--error)" }}
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "Отмена..." : "Отменить"}
          </button>
        )}
        <button
          className="btn btn-primary"
          style={{ flex: 2 }}
          onClick={() => navigate(ROUTES.ORDERS)}
          id="back-to-orders-btn"
        >
          ← Закрыть
        </button>
      </div>
    </div>
  );
};

export default OrderStatusPage;
