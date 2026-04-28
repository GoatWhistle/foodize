import { useEffect, useState } from "react";
import { Clock, Package, UserCircle, X } from "@phosphor-icons/react";
import { orderService } from "../../services/orderService";

const STATUS_LABEL_RU = {
  PENDING: "Новый",
  ACCEPTED: "Принят",
  COOKING: "Готовится",
  READY: "Готов",
  COMPLETED: "Выдан",
  CANCELLED: "Отменён",
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const optionLabel = (option) =>
  `${option.name}${option.price_delta ? ` +${option.price_delta} ₽` : ""}`;

const buildReadyAtIso = (timeValue) => {
  if (!timeValue) return null;

  const [hours, minutes] = timeValue.split(":").map(Number);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const readyAt = new Date();
  readyAt.setHours(hours, minutes, 0, 0);
  if (readyAt.getTime() <= Date.now()) {
    readyAt.setDate(readyAt.getDate() + 1);
  }

  return readyAt.toISOString();
};

const OrderDetailsModal = ({
  order,
  onClose,
  nextStatus,
  nextLabel,
  onStatusChange,
  updating,
  allowCancel = false,
}) => {
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [etaMinutes, setEtaMinutes] = useState(15);
  const [manualEtaTime, setManualEtaTime] = useState("");

  useEffect(() => {
    if (!order?.id) return;
    setEventsLoading(true);
    setEventsError("");
    orderService
      .getOrderEvents(order.id)
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setEvents(list);
      })
      .catch(() => setEventsError("Не удалось загрузить историю"))
      .finally(() => setEventsLoading(false));
  }, [order?.id]);

  if (!order) return null;

  const next = nextStatus?.[order.status];
  const canCancel =
    allowCancel && ["PENDING", "ACCEPTED"].includes(order.status);
  const etaPayload = () => {
    const manualReadyAt = buildReadyAtIso(manualEtaTime);
    if (manualReadyAt) {
      return { estimated_ready_at: manualReadyAt };
    }
    return { estimated_ready_in_minutes: etaMinutes };
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 4000 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: 560,
          padding: 0,
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                color: "var(--text-3)",
                fontSize: "0.74rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              Заказ #{order.id.slice(0, 8)}
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 900, margin: 0 }}>
              {order.total_price} ₽
            </h3>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            padding: 22,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: 12,
              }}
            >
              <div
                style={{
                  color: "var(--text-3)",
                  fontSize: "0.72rem",
                  marginBottom: 6,
                }}
              >
                Статус
              </div>
              <div style={{ fontWeight: 800 }}>
                {STATUS_LABEL_RU[order.status] ?? order.status}
              </div>
            </div>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: 12,
              }}
            >
              <div
                style={{
                  color: "var(--text-3)",
                  fontSize: "0.72rem",
                  marginBottom: 6,
                }}
              >
                Создан
              </div>
              <div style={{ fontWeight: 800 }}>
                {formatDateTime(order.created_at)}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <UserCircle size={18} color="var(--fire)" />
              <span style={{ fontWeight: 800 }}>Клиент</span>
            </div>
            {order.customer_name && (
              <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>
                {order.customer_name}
              </div>
            )}
            {order.customer_phone && (
              <div style={{ color: "var(--text-2)", fontSize: "0.82rem" }}>
                {order.customer_phone}
              </div>
            )}
            <div style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>
              ID: {order.user_id}
            </div>
            {order.estimated_ready_at && (
              <div style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>
                ETA: {formatDateTime(order.estimated_ready_at)}
              </div>
            )}
            {order.ready_at && (
              <div style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>
                Готов: {formatDateTime(order.ready_at)}
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              <Package size={18} color="var(--fire)" />
              Состав заказа
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>
                        {item.menu_item_name ?? item.name ?? "Позиция"}
                      </div>
                      <div
                        style={{
                          color: "var(--text-3)",
                          fontSize: "0.74rem",
                          marginTop: 2,
                        }}
                      >
                        {item.menu_item_category ?? "—"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 800 }}>
                      ×{item.quantity}
                      <div
                        style={{
                          color: "var(--text-3)",
                          fontSize: "0.74rem",
                          marginTop: 2,
                        }}
                      >
                        {item.price_at_purchase} ₽
                      </div>
                    </div>
                  </div>
                  {item.selected_options?.length > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        color: "var(--text-3)",
                        fontSize: "0.78rem",
                        lineHeight: 1.45,
                      }}
                    >
                      {item.selected_options.map(optionLabel).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: 12,
              }}
            >
              <div style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>
                Комментарий
              </div>
              <div style={{ marginTop: 6, fontSize: "0.84rem" }}>
                {order.comment || "Не указан"}
              </div>
            </div>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: 12,
              }}
            >
              <div style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>
                Промокод
              </div>
              <div style={{ marginTop: 6, fontSize: "0.84rem" }}>
                {order.promo_code || "Не сохранен"}
              </div>
            </div>
          </div>

          {next === "ACCEPTED" && (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: 12,
              }}
            >
              <div
                style={{
                  color: "var(--text-3)",
                  fontSize: "0.72rem",
                  marginBottom: 8,
                }}
              >
                Время готовности
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[10, 15, 20].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={`category-chip${
                      !manualEtaTime && etaMinutes === minutes ? " active" : ""
                    }`}
                    onClick={() => {
                      setEtaMinutes(minutes);
                      setManualEtaTime("");
                    }}
                  >
                    {minutes} мин
                  </button>
                ))}
              </div>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 12,
                  color: "var(--text-3)",
                  fontSize: "0.72rem",
                }}
              >
                Указать точное время
                <input
                  type="time"
                  value={manualEtaTime}
                  onChange={(event) => setManualEtaTime(event.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg)",
                    color: "var(--text-1)",
                    padding: "10px 12px",
                    font: "inherit",
                    fontWeight: 800,
                  }}
                />
              </label>
            </div>
          )}

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              <Clock size={18} color="var(--fire)" />
              История статусов
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {eventsLoading && (
                <div style={{ color: "var(--text-3)", fontSize: "0.84rem" }}>
                  Загружаю историю...
                </div>
              )}
              {eventsError && <div className="form-error">{eventsError}</div>}
              {!eventsLoading && !eventsError && events.length === 0 && (
                <div style={{ color: "var(--text-3)", fontSize: "0.84rem" }}>
                  История появится после первого изменения статуса
                </div>
              )}
              {events.map((event) => (
                <div
                  key={event.id}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: "0.82rem" }}>
                    {STATUS_LABEL_RU[event.old_status] ?? event.old_status} →{" "}
                    {STATUS_LABEL_RU[event.new_status] ?? event.new_status}
                    <div
                      style={{
                        color: "var(--text-3)",
                        fontSize: "0.72rem",
                        marginTop: 2,
                      }}
                    >
                      {event.actor_role}
                    </div>
                  </div>
                  <div
                    style={{
                      color: "var(--text-3)",
                      fontSize: "0.72rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDateTime(event.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(next || canCancel) && (
          <div
            style={{
              padding: "14px 22px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 8,
            }}
          >
            {next && (
              <button
                className="btn btn-primary"
                disabled={updating === order.id}
                onClick={() =>
                  onStatusChange(
                    order.id,
                    next,
                    next === "ACCEPTED" ? etaPayload() : {},
                  )
                }
                style={{ flex: 1 }}
              >
                {updating === order.id
                  ? "..."
                  : nextLabel?.[order.status] || "Дальше"}
              </button>
            )}
            {canCancel && (
              <button
                className="btn btn-secondary"
                disabled={updating === order.id}
                onClick={() => onStatusChange(order.id, "CANCELLED")}
                style={{ color: "var(--error)" }}
              >
                Отменить
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsModal;
