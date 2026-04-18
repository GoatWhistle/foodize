import { useState, useEffect, useRef } from "react";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { vendorService } from "../../services/vendorService";
import { orderService } from "../../services/orderService";
import { menuService } from "../../services/menuService";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";

const VendorDashboardPage = () => {
  const {
    restaurants,
    fetchMyRestaurants,
    fetchMenu,
    loading,
    addMenuItem,
    menus,
  } = useRestaurantStore();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [staffRequests, setStaffRequests] = useState([]);
  const [staffPage, setStaffPage] = useState(1);
  const [staffTotal, setStaffTotal] = useState(0);

  // UI states
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [activeTab, setActiveTab] = useState("menu"); // 'menu' | 'orders' | 'settings'

  // Create / Edit Restaurant
  const [newRestaurant, setNewRestaurant] = useState({ name: "", address: "" });
  const [editRestaurant, setEditRestaurant] = useState(null);

  // Menu Item
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [menuItemForm, setMenuItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "SHAURMA",
    prep_time_minutes: 15,
  });

  // Orders
  const [restaurantOrders, setRestaurantOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const pollInterval = useRef(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const { createRestaurant } = useRestaurantStore();

  useEffect(() => {
    fetchMyRestaurants();
  }, [fetchMyRestaurants]);

  useEffect(() => {
    vendorService
      .getStaffRequests({ page: staffPage, size: 20 })
      .then((res) => {
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        setStaffRequests(list);
        setStaffTotal(res.data?.total || list.length);
      })
      .catch(() => {});
  }, [staffPage]);

  // Order polling
  useEffect(() => {
    if (selectedRestaurant && activeTab === "orders") {
      const fetchOrders = async () => {
        try {
          const res = await orderService.getByRestaurant(
            selectedRestaurant.id,
            { page: ordersPage, size: 20 },
          );
          const list = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
              ? res.data
              : [];
          setRestaurantOrders(list);
          setOrdersTotal(res.data?.total || list.length);
        } catch {
          // ignore
        }
      };
      fetchOrders();
      if (ordersPage === 1) {
        pollInterval.current = setInterval(fetchOrders, 5000);
      }
    }
    return () => clearInterval(pollInterval.current);
  }, [selectedRestaurant, activeTab, ordersPage]);

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const r = await createRestaurant(newRestaurant);
      setSelectedRestaurant(r);
      setShowAddRestaurant(false);
      setNewRestaurant({ name: "", address: "" });
    } catch (err) {
      setFormError(err.response?.data?.detail || "Ошибка создания");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      // NOTE: Because update isn't in store, we do it via service then refresh
      import("../../services/restaurantService").then(
        async ({ restaurantService }) => {
          await restaurantService.update(selectedRestaurant.id, editRestaurant);
          await fetchMyRestaurants();
          setEditRestaurant(null);
          setFormLoading(false);
        },
      );
    } catch (err) {
      setFormError(err.response?.data?.detail || "Ошибка обновления");
      setFormLoading(false);
    }
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setFormLoading(true);
    setFormError("");

    try {
      const payload = {
        ...menuItemForm,
        price: parseInt(menuItemForm.price, 10),
        prep_time_minutes: parseInt(menuItemForm.prep_time_minutes, 10) || 15,
      };
      if (editingItem) {
        await menuService.updateItem(
          selectedRestaurant.id,
          editingItem.id,
          payload,
        );
        fetchMenu(selectedRestaurant.id); // reload menu
        setEditingItem(null);
      } else {
        await addMenuItem(selectedRestaurant.id, payload);
        setShowAddItem(false);
      }
      setMenuItemForm({
        name: "",
        description: "",
        price: "",
        category: "SHAURMA",
        prep_time_minutes: 15,
      });
    } catch (err) {
      setFormError(err.response?.data?.detail || "Ошибка сохранения");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm("Удалить позицию?")) return;
    try {
      await menuService.deleteItem(selectedRestaurant.id, itemId);
      fetchMenu(selectedRestaurant.id); // reload menu
    } catch {
      alert("Не удалось удалить позицию");
    }
  };

  const handleOrderChange = async (orderId, status) => {
    try {
      await orderService.updateStatus(orderId, status);
      setRestaurantOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    } catch {
      alert("Не удалось изменить статус заказа");
    }
  };

  const handleStaffDecision = async (requestId, status) => {
    try {
      await vendorService.updateStaffStatus(requestId, status);
      setStaffRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r)),
      );
    } catch {
      // ignore
    }
  };

  const selectedMenu = selectedRestaurant
    ? menus[selectedRestaurant.id] || []
    : [];

  return (
    <div className="vendor-page page-enter">
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: 28,
        }}
      >
        🏪 Дашборд вендора
      </h1>

      {/* Restaurants Section */}
      <div className="vendor-section">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <span className="vendor-section-title">🏠 Мои заведения</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddRestaurant(!showAddRestaurant)}
          >
            + Добавить
          </button>
        </div>

        {showAddRestaurant && (
          <form
            onSubmit={handleCreateRestaurant}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              marginBottom: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <h3
              style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 2 }}
            >
              Новое заведение
            </h3>
            {formError && <div className="form-error">{formError}</div>}
            <input
              className="form-input"
              placeholder="Название"
              value={newRestaurant.name}
              onChange={(e) =>
                setNewRestaurant((p) => ({ ...p, name: e.target.value }))
              }
              required
            />
            <input
              className="form-input"
              placeholder="Адрес"
              value={newRestaurant.address}
              onChange={(e) =>
                setNewRestaurant((p) => ({ ...p, address: e.target.value }))
              }
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formLoading}
            >
              {formLoading ? "Создаём..." : "Создать"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : !Array.isArray(restaurants) || restaurants.length === 0 ? (
          <EmptyState
            title="Нет заведений"
            subtitle="Добавьте первое заведение"
          />
        ) : (
          <div className="restaurant-list">
            {restaurants.map((r) => (
              <div
                key={r.id}
                className={`restaurant-row${selectedRestaurant?.id === r.id ? " active" : ""}`}
                onClick={() => setSelectedRestaurant(r)}
              >
                <div>
                  <div className="restaurant-row-name">{r.name}</div>
                  <div className="restaurant-row-addr">{r.address}</div>
                </div>
                <span style={{ marginLeft: "auto", color: "var(--stone)" }}>
                  ›
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Restaurant Detail */}
      {selectedRestaurant && (
        <div className="vendor-section">
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              overflowX: "auto",
            }}
          >
            {["menu", "orders", "settings"].map((tab) => (
              <button
                key={tab}
                className={`category-chip ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "menu"
                  ? "🍽️ Меню"
                  : tab === "orders"
                    ? "📦 Заказы"
                    : "⚙️ Настройки"}
              </button>
            ))}
          </div>

          {activeTab === "settings" && (
            <div
              style={{
                padding: 16,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>
                Настройки ресторана
              </h3>
              <form
                onSubmit={handleUpdateRestaurant}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {formError && <div className="form-error">{formError}</div>}
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--stone)" }}>
                    Название
                  </label>
                  <input
                    className="form-input"
                    value={editRestaurant?.name ?? selectedRestaurant.name}
                    onChange={(e) =>
                      setEditRestaurant((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--stone)" }}>
                    Адрес
                  </label>
                  <input
                    className="form-input"
                    value={
                      editRestaurant?.address ?? selectedRestaurant.address
                    }
                    onChange={(e) =>
                      setEditRestaurant((p) => ({
                        ...p,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>
                <label className="form-check" style={{ marginTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={
                      editRestaurant?.is_open ?? selectedRestaurant.is_open
                    }
                    onChange={(e) =>
                      setEditRestaurant((p) => ({
                        ...(p || selectedRestaurant),
                        is_open: e.target.checked,
                      }))
                    }
                  />
                  <span className="form-check-label">
                    Заведение открыто (принимает заказы)
                  </span>
                </label>
                <label className="form-check">
                  <input
                    type="checkbox"
                    checked={
                      editRestaurant?.is_hiring ?? selectedRestaurant.is_hiring
                    }
                    onChange={(e) =>
                      setEditRestaurant((p) => ({
                        ...(p || selectedRestaurant),
                        is_hiring: e.target.checked,
                      }))
                    }
                  />
                  <span className="form-check-label">
                    Ведется набор персонала
                  </span>
                </label>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading || !editRestaurant}
                >
                  Сохранить
                </button>
              </form>
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>
                  Активные заказы
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--stone)" }}>
                  {ordersPage === 1
                    ? "Автообновление (5с)"
                    : "Архив (автообновление выкл)"}
                </span>
              </div>

              {!Array.isArray(restaurantOrders) ||
              restaurantOrders.length === 0 ? (
                <EmptyState
                  title="Нет заказов"
                  subtitle="Пока никто не сделал заказ"
                />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {restaurantOrders.map((order) => (
                    <div
                      key={order.id}
                      className="order-card"
                      style={{ cursor: "default" }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          Заказ #{order.id.slice(0, 8)}
                        </div>
                        <div
                          style={{ fontSize: "0.8rem", color: "var(--stone)" }}
                        >
                          {order.items?.length || 0} позиц. •{" "}
                          {order.total_price} ₽
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 6,
                        }}
                      >
                        <span
                          className={`order-status-badge ${
                            order.status === "PENDING" ||
                            order.status === "ACCEPTED"
                              ? "pending"
                              : order.status === "COOKING"
                                ? "preparing"
                                : order.status === "CANCELLED"
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
                          }[order.status] ?? order.status}
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {order.status === "PENDING" && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                  handleOrderChange(order.id, "COOKING")
                                }
                              >
                                ♨️ В готовку
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ color: "var(--error)" }}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Отменить этот заказ? Клиент получит уведомление.",
                                    )
                                  ) {
                                    handleOrderChange(order.id, "CANCELLED");
                                  }
                                }}
                              >
                                ✕ Отменить
                              </button>
                            </>
                          )}
                          {order.status === "COOKING" && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                handleOrderChange(order.id, "READY")
                              }
                            >
                              ✅ Готов
                            </button>
                          )}
                          {order.status === "READY" && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                handleOrderChange(order.id, "COMPLETED")
                              }
                            >
                              🏁 Выдан (Завершен)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Pagination
                    page={ordersPage}
                    totalPages={Math.ceil(ordersTotal / 20)}
                    onPageChange={setOrdersPage}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "menu" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>
                  Позиции меню
                </h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowAddItem(!showAddItem);
                    setEditingItem(null);
                    setMenuItemForm({
                      name: "",
                      description: "",
                      price: "",
                      category: "SHAURMA",
                      prep_time_minutes: 15,
                    });
                  }}
                >
                  + Позиция
                </button>
              </div>

              {(showAddItem || editingItem) && (
                <form
                  onSubmit={handleSaveMenuItem}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    marginBottom: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      marginBottom: 2,
                    }}
                  >
                    {editingItem ? "Редактировать позицию" : "Новая позиция"}
                  </h3>
                  {formError && <div className="form-error">{formError}</div>}
                  <input
                    className="form-input"
                    placeholder="Название"
                    value={menuItemForm.name}
                    onChange={(e) =>
                      setMenuItemForm((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                  <input
                    className="form-input"
                    placeholder="Описание (опционально)"
                    value={menuItemForm.description}
                    onChange={(e) =>
                      setMenuItemForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  />
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Цена (в рублях)"
                    value={menuItemForm.price}
                    onChange={(e) =>
                      setMenuItemForm((p) => ({ ...p, price: e.target.value }))
                    }
                    required
                    min="1"
                  />
                  <div className="form-group">
                    <label className="form-label">Категория</label>
                    <select
                      className="form-input"
                      value={menuItemForm.category}
                      onChange={(e) =>
                        setMenuItemForm((p) => ({
                          ...p,
                          category: e.target.value,
                        }))
                      }
                    >
                      {["SHAURMA", "BURGER", "PIZZA", "SUSHI"].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Время приготовления (мин)
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Время в минутах"
                      value={menuItemForm.prep_time_minutes}
                      onChange={(e) =>
                        setMenuItemForm((p) => ({
                          ...p,
                          prep_time_minutes: e.target.value,
                        }))
                      }
                      min="1"
                      max="120"
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={formLoading}
                      style={{ flex: 1 }}
                    >
                      {formLoading ? "Сохраняем..." : "Сохранить"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddItem(false);
                        setEditingItem(null);
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}

              {selectedMenu.length === 0 ? (
                <EmptyState
                  title="Меню пустое"
                  subtitle="Добавьте первую позицию"
                />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {!Array.isArray(selectedMenu) || selectedMenu.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                      <div style={{ fontSize: "2rem", marginBottom: 12 }}>
                        🍽️
                      </div>
                      <div
                        style={{ fontWeight: 600, color: "var(--foreground)" }}
                      >
                        Меню пусто
                      </div>
                      <div
                        style={{ fontSize: "0.8rem", color: "var(--stone)" }}
                      >
                        Добавьте позиции, чтобы они появились здесь
                      </div>
                    </div>
                  ) : (
                    selectedMenu.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                            {item.name}
                          </div>
                          {item.description && (
                            <div
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--stone)",
                              }}
                            >
                              {item.description}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 800,
                              color: "var(--ember-orange)",
                            }}
                          >
                            {item.price} ₽
                          </span>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setEditingItem(item);
                              setMenuItemForm({
                                name: item.name,
                                description: item.description || "",
                                price: item.price,
                                category: item.category || "SHAURMA",
                                prep_time_minutes: item.prep_time_minutes || 15,
                              });
                            }}
                          >
                            ✎
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: "var(--error)" }}
                            onClick={() => handleDeleteMenuItem(item.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Staff requests */}
      <div className="vendor-section">
        <span className="vendor-section-title">👥 Заявки на работу</span>
        {!Array.isArray(staffRequests) || staffRequests.length === 0 ? (
          <EmptyState
            title="Нет заявок"
            subtitle="Заявки от сотрудников появятся здесь"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {staffRequests.map((req) => (
              <div key={req.id} className="staff-request-card">
                <div className="staff-request-info">
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    Пользователь #{req.user_id.slice(0, 8)}
                  </div>
                  {req.message && (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--stone)",
                        marginTop: 2,
                        fontStyle: "italic",
                      }}
                    >
                      &ldquo;{req.message}&rdquo;
                    </div>
                  )}
                  <span
                    className={`order-status-badge ${req.status === "PENDING" ? "pending" : req.status === "ACCEPTED" ? "ready" : "preparing"}`}
                    style={{ marginTop: 6, display: "inline-flex" }}
                  >
                    {req.status}
                  </span>
                </div>
                {req.status === "PENDING" && (
                  <div className="staff-request-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStaffDecision(req.id, "ACCEPTED")}
                    >
                      ✓
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStaffDecision(req.id, "REJECTED")}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
            <Pagination
              page={staffPage}
              totalPages={Math.ceil(staffTotal / 20)}
              onPageChange={setStaffPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboardPage;
