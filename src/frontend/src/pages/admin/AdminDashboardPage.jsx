import { useState, useEffect } from "react";
import {
  ChartLineUp,
  UsersThree,
  Package,
  Storefront,
  Trash,
  Info,
  X,
  UserCircle,
  Clock,
  CheckCircle,
  CookingPot,
  HandPalm,
  Prohibit,
} from "@phosphor-icons/react";
import { adminService } from "../../services/adminService";
import Pagination from "../../components/ui/Pagination";

const STATUS_MAP = {
  PENDING: { label: "Ожидает", className: "pending", icon: <Clock /> },
  ACCEPTED: {
    label: "Подтверждён",
    className: "pending",
    icon: <CheckCircle />,
  },
  COOKING: { label: "Готовится", className: "preparing", icon: <CookingPot /> },
  READY: { label: "Готов", className: "ready", icon: <HandPalm /> },
  COMPLETED: {
    label: "Выдан",
    className: "ready",
    icon: <CheckCircle weight="fill" />,
  },
  CANCELLED: { label: "Отменён", className: "cancelled", icon: <Prohibit /> },
};

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadUserDetails = async (id) => {
    setUserDetailsLoading(true);
    setActionError("");
    try {
      const res = await adminService.getUser(id);
      setSelectedUser(res.data);
    } catch {
      setActionError("Не удалось загрузить детали пользователя");
    } finally {
      setUserDetailsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "stats" && !stats) {
      adminService
        .getPlatformStats()
        .then((res) => setStats(res.data))
        .catch(() => {});
    }
  }, [activeTab, stats]);

  useEffect(() => {
    if (activeTab === "users") {
      setUsersLoading(true);
      adminService
        .getUsers({ page: usersPage, size: 20 })
        .then((res) => {
          setUsers(res.data.data || []);
          setUsersTotal(res.data.total || 0);
        })
        .catch(() => {})
        .finally(() => setUsersLoading(false));
    }
  }, [activeTab, usersPage]);

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Удалить пользователя навсегда?")) return;
    setActionError("");
    try {
      await adminService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setActionError("Не удалось удалить пользователя");
    }
  };

  useEffect(() => {
    if (activeTab === "orders") {
      setOrdersLoading(true);
      adminService
        .getOrders({ page: ordersPage, size: 20 })
        .then((res) => {
          setOrders(res.data.data || []);
          setOrdersTotal(res.data.total || 0);
        })
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, ordersPage]);

  return (
    <div
      className="page-enter"
      style={{ padding: "80px 20px 100px", maxWidth: 600, margin: "0 auto" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.03em",
          }}
        >
          Панель Администратора
        </h1>
      </div>

      {actionError && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          {actionError}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {[
          { id: "stats", label: "Статистика", icon: <ChartLineUp size={18} /> },
          {
            id: "users",
            label: "Пользователи",
            icon: <UsersThree size={18} />,
          },
          { id: "orders", label: "Заказы", icon: <Package size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`category-chip ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "stats" && stats && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div className="admin-stat-card">
            <UsersThree size={20} color="var(--text-3)" />
            <div className="admin-stat-label">Пользователи</div>
            <div className="admin-stat-value">
              {stats.total_users ??
                Object.values(stats.users_by_role || {}).reduce(
                  (a, b) => a + b,
                  0,
                )}
            </div>
          </div>
          <div className="admin-stat-card">
            <Storefront size={20} color="var(--text-3)" />
            <div className="admin-stat-label">Рестораны</div>
            <div className="admin-stat-value">{stats.total_restaurants}</div>
          </div>
          <div className="admin-stat-card" style={{ gridColumn: "1 / -1" }}>
            <Package size={20} color="var(--fire)" />
            <div className="admin-stat-label">Всего заказов</div>
            <div className="admin-stat-value" style={{ color: "var(--fire)" }}>
              {stats.total_orders ??
                Object.values(stats.orders_by_status || {}).reduce(
                  (a, b) => a + b,
                  0,
                )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {usersLoading ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {users.map((u) => (
                <div key={u.id} className="admin-list-item">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <UserCircle size={40} weight="thin" color="var(--text-3)" />
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {u.name || "Без имени"}
                      </div>
                      <div
                        style={{ fontSize: "0.8rem", color: "var(--text-3)" }}
                      >
                        {u.phone_number || "Нет телефона"}
                      </div>
                      <span className="role-tag">{u.user_role}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="btn-icon-sm"
                      onClick={() => loadUserDetails(u.id)}
                      title="Подробнее"
                    >
                      <Info size={18} />
                    </button>
                    <button
                      className="btn-icon-sm danger"
                      onClick={() => handleDeleteUser(u.id)}
                      title="Удалить"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              ))}
              <Pagination
                page={usersPage}
                totalPages={Math.ceil(usersTotal / 20)}
                onPageChange={setUsersPage}
              />
            </>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ordersLoading ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {orders.map((o) => {
                const cfg = STATUS_MAP[o.status] || {
                  label: o.status,
                  className: "pending",
                  icon: <Package />,
                };
                return (
                  <div
                    key={o.id}
                    className="admin-list-item"
                    style={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>
                        #{o.id.slice(0, 8)}
                      </span>
                      <span
                        className={`order-status-badge ${cfg.className}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: "0.85rem", color: "var(--text-3)" }}
                    >
                      Сумма: <b>{o.total_price} ₽</b> • ID заведения:{" "}
                      {o.restaurant_id.slice(0, 8)}
                    </div>
                  </div>
                );
              })}
              <Pagination
                page={ordersPage}
                totalPages={Math.ceil(ordersTotal / 20)}
                onPageChange={setOrdersPage}
              />
            </>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Детали профиля</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedUser(null)}
              >
                <X size={20} />
              </button>
            </div>
            {userDetailsLoading ? (
              <div className="loading-center">
                <div className="spinner" />
              </div>
            ) : (
              <div className="modal-body">
                <div className="detail-item">
                  <label>ID пользователя</label>
                  <code>{selectedUser.id}</code>
                </div>
                <div className="detail-item">
                  <label>Имя</label>
                  <div className="detail-value">{selectedUser.name || "—"}</div>
                </div>
                <div className="detail-item">
                  <label>Телефон</label>
                  <div className="detail-value">
                    {selectedUser.phone_number}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 20,
                    borderTop: "1px solid var(--border)",
                    paddingTop: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label>Роль</label>
                    <div className="order-status-badge pending">
                      {selectedUser.user_role}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Статус</label>
                    <div
                      className={`order-status-badge ${selectedUser.is_active ? "ready" : "preparing"}`}
                    >
                      {selectedUser.is_active ? "Активен" : "Заблокирован"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
