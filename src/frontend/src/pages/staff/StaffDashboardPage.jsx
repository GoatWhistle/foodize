import { useState, useEffect, useRef, useCallback } from "react";
import {
  CookingPot,
  CheckCircle,
  Clock,
  ArrowRight,
  Package,
  Spinner,
  Bell,
  HourglassMedium,
  XCircle,
} from "@phosphor-icons/react";
import { staffService } from "../../services/staffService";
import EmptyState from "../../components/ui/EmptyState";

const STATUS_LABEL = {
  PENDING: "Новый",
  ACCEPTED: "Принят",
  COOKING: "Готовится",
  READY: "Готов",
  COMPLETED: "Выдан",
  CANCELLED: "Отменён",
};

const STATUS_COLOR = {
  PENDING: "#f59e0b",
  ACCEPTED: "#3b82f6",
  COOKING: "#f97316",
  READY: "#22c55e",
  COMPLETED: "#6b7280",
  CANCELLED: "#ef4444",
};

const NEXT_STATUS = {
  PENDING: "ACCEPTED",
  ACCEPTED: "COOKING",
  COOKING: "READY",
  READY: "COMPLETED",
};

const NEXT_LABEL = {
  PENDING: "Принять",
  ACCEPTED: "Начать готовить",
  COOKING: "Готово",
  READY: "Выдан клиенту",
};

const STATUS_TABS = [
  { value: "", label: "Все" },
  { value: "PENDING", label: "Новые" },
  { value: "ACCEPTED", label: "Принятые" },
  { value: "COOKING", label: "Готовятся" },
  { value: "READY", label: "Готовы" },
];

const APPLICATION_STATUS_CONFIG = {
  PENDING: {
    icon: <HourglassMedium size={48} color="#f59e0b" weight="fill" />,
    title: "Заявка на рассмотрении",
    description:
      "Ваша заявка отправлена и ожидает решения менеджера. Обычно это занимает несколько часов.",
    color: "#f59e0b",
    bg: "#f59e0b22",
  },
  ACCEPTED: {
    icon: <CheckCircle size={48} color="#22c55e" weight="fill" />,
    title: "Заявка одобрена",
    description:
      "Ваша заявка принята. Обратитесь к менеджеру для завершения оформления.",
    color: "#22c55e",
    bg: "#22c55e22",
  },
  REJECTED: {
    icon: <XCircle size={48} color="#ef4444" weight="fill" />,
    title: "Заявка отклонена",
    description:
      "К сожалению, ваша заявка была отклонена. Вы можете попробовать снова через 24 часа.",
    color: "#ef4444",
    bg: "#ef444422",
  },
};

const ApplicationStatus = () => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService
      .getMyApplication()
      .then((res) => setApplication(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!application) {
    return (
      <div style={{ padding: "40px 20px", maxWidth: 500, margin: "0 auto" }}>
              <EmptyState
          title="Нет профиля сотрудника"
          subtitle="Вы не привязаны ни к одному заведению. Обратитесь к менеджеру."
        />
      </div>
    );
  }

  const config =
    APPLICATION_STATUS_CONFIG[application.status] ||
    APPLICATION_STATUS_CONFIG.PENDING;

  return (
    <div style={{ padding: "40px 20px", maxWidth: 480, margin: "0 auto" }}>
      <div
        style={{
          background: config.bg,
          border: `1px solid ${config.color}44`,
          borderRadius: "var(--r-lg)",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          textAlign: "center",
        }}
      >
        {config.icon}
        <div>
          <h2
            style={{
              fontWeight: 800,
              fontSize: "1.2rem",
              color: "var(--text-1)",
              marginBottom: 8,
            }}
          >
            {config.title}
          </h2>
          <p
            style={{
              color: "var(--text-3)",
              fontSize: "0.875rem",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {config.description}
          </p>
        </div>
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            padding: "10px 16px",
            fontSize: "0.78rem",
            color: "var(--text-3)",
            fontFamily: "monospace",
          }}
        >
          Заявка #{application.id.slice(0, 8)}
        </div>
      </div>
    </div>
  );
};

const OrderCard = ({ order, onStatusChange, updating }) => {
  const nextStatus = NEXT_STATUS[order.status];
  const isTerminal =
    order.status === "COMPLETED" || order.status === "CANCELLED";

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid var(--border)`,
        borderLeft: `4px solid ${STATUS_COLOR[order.status] || "var(--border)"}`,
        borderRadius: "var(--r-md)",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-3)",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Заказ #{order.id.slice(0, 8)}
          </span>
          <div
            style={{
              marginTop: 4,
              fontWeight: 800,
              fontSize: "1.1rem",
              color: "var(--text-1)",
            }}
          >
            {order.total_price} ₽
          </div>
        </div>
        <span
          style={{
            background: `${STATUS_COLOR[order.status]}22`,
            color: STATUS_COLOR[order.status],
            border: `1px solid ${STATUS_COLOR[order.status]}44`,
            borderRadius: "var(--r-sm)",
            padding: "4px 10px",
            fontSize: "0.78rem",
            fontWeight: 700,
          }}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          background: "var(--bg-surface)",
          borderRadius: "var(--r-sm)",
          padding: "10px 12px",
        }}
      >
        {order.items?.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.875rem",
              color: "var(--text-2)",
            }}
          >
            <span>
              {item.name ?? `Позиция #${item.menu_item_id?.slice(0, 6)}`}
            </span>
            <span style={{ fontWeight: 600, color: "var(--text-1)" }}>
              ×{item.quantity}
            </span>
          </div>
        ))}
      </div>

      {!isTerminal && nextStatus && (
        <button
          className="btn btn-primary"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            height: 44,
            background: STATUS_COLOR[order.status],
            borderColor: STATUS_COLOR[order.status],
          }}
          disabled={updating === order.id}
          onClick={() => onStatusChange(order.id, nextStatus)}
        >
          {updating === order.id ? (
            <Spinner
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <>
              {NEXT_LABEL[order.status]}
              <ArrowRight size={16} weight="bold" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

const StaffDashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const prevOrderIds = useRef(new Set());
  const pollRef = useRef(null);

  useEffect(() => {
    staffService
      .getMyProfile()
      .then((res) => setProfile(res.data))
      .catch(() => setProfileError("Профиль сотрудника не найден"))
      .finally(() => setProfileLoading(false));
  }, []);

  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!profile?.restaurant_id) return;
      if (!silent) setOrdersLoading(true);
      try {
        const res = await staffService.getRestaurantOrders(
          profile.restaurant_id,
          {
            page,
            size: 50,
            status: statusFilter || undefined,
          },
        );
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        setTotal(res.data?.total ?? list.length);

        const incoming = new Set(list.map((o) => o.id));
        if (prevOrderIds.current.size > 0) {
          const hasNew = [...incoming].some(
            (id) => !prevOrderIds.current.has(id),
          );
          if (hasNew) setNewOrderAlert(true);
        }
        prevOrderIds.current = incoming;
        setOrders(list);
      } catch {
        /* ignore */
      } finally {
        if (!silent) setOrdersLoading(false);
      }
    },
    [profile?.restaurant_id, page, statusFilter],
  );

  useEffect(() => {
    if (profile?.restaurant_id) {
      fetchOrders();
      pollRef.current = setInterval(() => fetchOrders(true), 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [fetchOrders, profile?.restaurant_id]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await staffService.updateOrderStatus(orderId, newStatus);
      await fetchOrders(true);
    } catch {
      /* ignore */
    } finally {
      setUpdating(null);
    }
  };

  if (profileLoading) {
    return (
      <div className="loading-center" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (profileError || !profile) {
    return <ApplicationStatus />;
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div
      className="page-enter"
      style={{ padding: "24px 16px", maxWidth: 640, margin: "0 auto" }}
    >
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <CookingPot size={28} weight="fill" color="var(--fire)" />
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "var(--text-1)",
              margin: 0,
            }}
          >
            Кабинет сотрудника
          </h1>
          {newOrderAlert && (
            <button
              style={{
                background: "#22c55e",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "4px 10px",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              onClick={() => setNewOrderAlert(false)}
            >
              <Bell size={12} weight="fill" />
              Новый заказ!
            </button>
          )}
        </div>
        <p style={{ color: "var(--text-3)", fontSize: "0.875rem", margin: 0 }}>
          Роль:{" "}
          <strong style={{ color: "var(--text-2)" }}>{profile.role}</strong>
          &nbsp;·&nbsp;Ресторан:{" "}
          <strong style={{ color: "var(--text-2)" }}>
            {profile.restaurant_id.slice(0, 8)}…
          </strong>
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "Новых",
            status: "PENDING",
            icon: <Clock size={18} weight="fill" />,
          },
          {
            label: "Готовится",
            status: "COOKING",
            icon: <CookingPot size={18} weight="fill" />,
          },
          {
            label: "Готовы",
            status: "READY",
            icon: <CheckCircle size={18} weight="fill" />,
          },
        ].map(({ label, status, icon }) => {
          const count = orders.filter((o) => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              style={{
                background:
                  statusFilter === status
                    ? `${STATUS_COLOR[status]}22`
                    : "var(--bg-card)",
                border: `1px solid ${statusFilter === status ? STATUS_COLOR[status] : "var(--border)"}`,
                borderRadius: "var(--r-md)",
                padding: "14px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                transition: "all var(--dur-sm)",
              }}
            >
              <span style={{ color: STATUS_COLOR[status] }}>{icon}</span>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "1.4rem",
                  color: "var(--text-1)",
                }}
              >
                {count}
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-3)",
                  fontWeight: 600,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="menu-categories-scroll" style={{ marginBottom: 16 }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`category-chip${statusFilter === tab.value ? " active" : ""}`}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {ordersLoading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : orders.length === 0 ? (
                <EmptyState
          icon={<Package size={40} />}
          title="Заказов нет"
          subtitle="Здесь появятся заказы для обработки"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              updating={updating}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 24,
          }}
        >
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </button>
          <span
            style={{
              lineHeight: "36px",
              color: "var(--text-3)",
              fontSize: "0.875rem",
            }}
          >
            {page} / {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд
          </button>
        </div>
      )}
    </div>
  );
};

export default StaffDashboardPage;
