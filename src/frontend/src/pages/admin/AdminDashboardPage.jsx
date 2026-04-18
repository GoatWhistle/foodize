import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import Pagination from "../../components/ui/Pagination";

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("stats");

  // Stats State
  const [stats, setStats] = useState(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);

  const loadUserDetails = async (id) => {
    setUserDetailsLoading(true);
    try {
      const res = await adminService.getUser(id);
      setSelectedUser(res.data);
    } catch {
      alert("Не удалось загрузить детали пользователя");
    } finally {
      setUserDetailsLoading(false);
    }
  };

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Fetch Stats
  useEffect(() => {
    if (activeTab === "stats" && !stats) {
      adminService
        .getPlatformStats()
        .then((res) => setStats(res.data))
        .catch(() => {});
    }
  }, [activeTab, stats]);

  // Load Users
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
    try {
      await adminService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert("Не удалось удалить пользователя.");
    }
  };

  // Load Orders
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
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          marginBottom: 20,
          letterSpacing: "-0.03em",
        }}
      >
        👑 Панель Администратора
      </h1>

      <div
        style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto" }}
      >
        {["stats", "users", "orders"].map((tab) => (
          <button
            key={tab}
            className={`category-chip ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "stats"
              ? "📊 Статистика"
              : tab === "users"
                ? "👥 Пользователи"
                : "📦 Заказы"}
          </button>
        ))}
      </div>

      {activeTab === "stats" && stats && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              padding: 16,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--stone)",
                marginBottom: 4,
              }}
            >
              Пользователи
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
              {stats.total_users ??
                Object.values(stats.users_by_role || {}).reduce(
                  (a, b) => a + b,
                  0,
                )}
            </div>
          </div>
          <div
            style={{
              background: "var(--bg-card)",
              padding: 16,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--stone)",
                marginBottom: 4,
              }}
            >
              Рестораны
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
              {stats.total_restaurants}
            </div>
          </div>
          <div
            style={{
              background: "var(--bg-card)",
              padding: 16,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              gridColumn: "1 / -1",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--stone)",
                marginBottom: 4,
              }}
            >
              Всего заказов
            </div>
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: 800,
                color: "var(--ember-orange)",
              }}
            >
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
              {(Array.isArray(users) ? users : []).map((u) => {
                return (
                  <div
                    key={u.id}
                    style={{
                      background: "var(--bg-card)",
                      padding: 16,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {u.name || "Без имени"}
                      </div>
                      <div
                        style={{ fontSize: "0.8rem", color: "var(--stone)" }}
                      >
                        {u.phone_number || "Нет телефона"}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          display: "inline-block",
                          background: "var(--border)",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                        }}
                      >
                        {u.user_role}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => loadUserDetails(u.id)}
                      >
                        Подробнее
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: "var(--error)" }}
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
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
              {(Array.isArray(orders) ? orders : []).map((o) => {
                return (
                  <div
                    key={o.id}
                    style={{
                      background: "var(--bg-card)",
                      padding: 16,
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>
                        Заказ #{o.id.slice(0, 6)}
                      </span>
                      <span
                        className={`order-status-badge ${
                          o.status === "PENDING" || o.status === "ACCEPTED"
                            ? "pending"
                            : o.status === "COOKING"
                              ? "preparing"
                              : o.status === "CANCELLED"
                                ? "preparing"
                                : "ready"
                        }`}
                      >
                        {{
                          PENDING: "Принят",
                          ACCEPTED: "Подтверждён",
                          COOKING: "Готовится",
                          READY: "Готов",
                          COMPLETED: "Выдан",
                          CANCELLED: "Отменён",
                        }[o.status] ?? o.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--stone)" }}>
                      Окончательная цена:{" "}
                      <span style={{ fontWeight: 800 }}>{o.total_price} ₽</span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--stone)" }}>
                      Заведение: {o.restaurant_id.slice(0, 8)}
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
      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div
            className="card"
            style={{
              padding: 32,
              width: "100%",
              maxWidth: 440,
              background: "var(--bg-card)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontWeight: 800, fontSize: "1.2rem", margin: 0 }}>
                Детали профиля
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedUser(null)}
                style={{ padding: "4px 8px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {userDetailsLoading ? (
                <div
                  style={{
                    padding: "40px 0",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <div className="spinner" />
                </div>
              ) : (
                <>
                  <div>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--stone)",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      ID (UUID)
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        background: "var(--border)",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {selectedUser.id}
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--stone)",
                        display: "block",
                        marginBottom: 2,
                      }}
                    >
                      Имя
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                      {selectedUser.name || "—"}
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--stone)",
                        display: "block",
                        marginBottom: 2,
                      }}
                    >
                      Номер телефона
                    </span>
                    <span style={{ fontSize: "1rem", fontWeight: 600 }}>
                      {selectedUser.phone_number}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "1px solid var(--border)",
                      paddingTop: 16,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--stone)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Роль в системе
                      </span>
                      <span
                        className="order-status-badge pending"
                        style={{ display: "inline-block" }}
                      >
                        {selectedUser.user_role}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--stone)",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Статус доступа
                      </span>
                      <span
                        className={`order-status-badge ${selectedUser.is_active ? "ready" : "preparing"}`}
                        style={{ display: "inline-block" }}
                      >
                        {selectedUser.is_active ? "Активный" : "Заблокирован"}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      paddingTop: 16,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--stone)",
                        display: "block",
                        marginBottom: 2,
                      }}
                    >
                      Дата регистрации
                    </span>
                    <span>
                      {new Date(selectedUser.created_at).toLocaleString(
                        "ru-RU",
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
