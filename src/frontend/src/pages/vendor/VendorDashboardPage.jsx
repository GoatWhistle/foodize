import { useState, useEffect, useRef } from "react";
import {
  Storefront,
  House,
  Plus,
  CaretRight,
  ForkKnife,
  Package,
  Gear,
  Fire,
  X,
  Check,
  Flag,
  PencilSimple,
  Users,
} from "@phosphor-icons/react";
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
  const [staffPage] = useState(1);
  const [setStaffTotal] = useState(0);

  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");

  const [newRestaurant, setNewRestaurant] = useState({ name: "", address: "" });
  const [editRestaurant, setEditRestaurant] = useState(null);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [menuItemForm, setMenuItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "SHAURMA",
    prep_time_minutes: 15,
  });

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
    if (selectedRestaurant) {
      fetchMenu(selectedRestaurant.id);
    }
  }, [selectedRestaurant, fetchMenu]);

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
          /* ignore */
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
      const { restaurantService } =
        await import("../../services/restaurantService");
      await restaurantService.update(selectedRestaurant.id, editRestaurant);
      await fetchMyRestaurants();
      setEditRestaurant(null);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Ошибка обновления");
    } finally {
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
        fetchMenu(selectedRestaurant.id);
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
      fetchMenu(selectedRestaurant.id);
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
      /* ignore */
    }
  };

  const selectedMenu = selectedRestaurant
    ? menus[selectedRestaurant.id] || []
    : [];

  return (
    <div className="vendor-page page-enter">
      <h1
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "1.5rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: 28,
        }}
      >
        <Storefront /> Дашборд вендора
      </h1>

      <div className="vendor-section">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <span
            className="vendor-section-title"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <House /> Мои заведения
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddRestaurant(!showAddRestaurant)}
          >
            <Plus size={16} /> Добавить
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
            <h3 style={{ fontWeight: 700, fontSize: "0.9rem" }}>
              Новое заведение
            </h3>
            {formError && <div className="form-error">{formError}</div>}
            <input
              className="form-input"
              placeholder="Название"
              value={newRestaurant.name}
              onChange={(e) =>
                setNewRestaurant({ ...newRestaurant, name: e.target.value })
              }
              required
            />
            <input
              className="form-input"
              placeholder="Адрес"
              value={newRestaurant.address}
              onChange={(e) =>
                setNewRestaurant({ ...newRestaurant, address: e.target.value })
              }
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formLoading}
            >
              Создать
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
                  <CaretRight />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

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
            {[
              { id: "menu", label: "Меню", icon: <ForkKnife /> },
              { id: "orders", label: "Заказы", icon: <Package /> },
              { id: "settings", label: "Настройки", icon: <Gear /> },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`category-chip ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

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
                    setEditingItem(null);
                    setMenuItemForm({
                      name: "",
                      description: "",
                      price: "",
                      category: "SHAURMA",
                      prep_time_minutes: 15,
                    });
                    setShowAddItem(!showAddItem);
                  }}
                >
                  <Plus size={16} /> Позиция
                </button>
              </div>

              {/* ФОРМА ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ (ТО, ЧЕГО НЕ ХВАТАЛО) */}
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
                  <h3 style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {editingItem ? "Редактировать" : "Новая позиция"}
                  </h3>
                  {formError && <div className="form-error">{formError}</div>}
                  <input
                    className="form-input"
                    placeholder="Название"
                    value={menuItemForm.name}
                    onChange={(e) =>
                      setMenuItemForm({ ...menuItemForm, name: e.target.value })
                    }
                    required
                  />
                  <textarea
                    className="form-input"
                    placeholder="Описание"
                    value={menuItemForm.description}
                    onChange={(e) =>
                      setMenuItemForm({
                        ...menuItemForm,
                        description: e.target.value,
                      })
                    }
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Цена"
                      value={menuItemForm.price}
                      onChange={(e) =>
                        setMenuItemForm({
                          ...menuItemForm,
                          price: e.target.value,
                        })
                      }
                      required
                      style={{ flex: 1 }}
                    />
                    <select
                      className="form-input"
                      value={menuItemForm.category}
                      onChange={(e) =>
                        setMenuItemForm({
                          ...menuItemForm,
                          category: e.target.value,
                        })
                      }
                      style={{ flex: 1 }}
                    >
                      <option value="SHAURMA">Шаурма</option>
                      <option value="BURGER">Бургер</option>
                      <option value="PIZZA">Пицца</option>
                      <option value="SUSHI">Суши</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={formLoading}
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddItem(false);
                        setEditingItem(null);
                      }}
                      style={{ flex: 1 }}
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
                  {selectedMenu.map((item) => (
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
                        <div
                          style={{ fontSize: "0.78rem", color: "var(--stone)" }}
                        >
                          {item.price} ₽ • {item.category}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setEditingItem(item);
                            setMenuItemForm({
                              name: item.name,
                              description: item.description,
                              price: item.price.toString(),
                              category: item.category,
                              prep_time_minutes: item.prep_time_minutes,
                            });
                          }}
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: "var(--error)" }}
                          onClick={() => handleDeleteMenuItem(item.id)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ... разделы orders и settings без изменений ... */}
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
                          className={`order-status-badge ${order.status === "PENDING" ? "pending" : "ready"}`}
                        >
                          {order.status}
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
                                <Fire size={16} /> В готовку
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ color: "var(--error)" }}
                                onClick={() =>
                                  handleOrderChange(order.id, "CANCELLED")
                                }
                              >
                                <X size={16} />
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
                              <Check size={16} /> Готов
                            </button>
                          )}
                          {order.status === "READY" && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                handleOrderChange(order.id, "COMPLETED")
                              }
                            >
                              <Flag size={16} /> Выдан
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
                      setEditRestaurant({
                        ...(editRestaurant || selectedRestaurant),
                        name: e.target.value,
                      })
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
                      setEditRestaurant({
                        ...(editRestaurant || selectedRestaurant),
                        address: e.target.value,
                      })
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
                      setEditRestaurant({
                        ...(editRestaurant || selectedRestaurant),
                        is_open: e.target.checked,
                      })
                    }
                  />
                  <span className="form-check-label">Заведение открыто</span>
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
        </div>
      )}

      <div className="vendor-section">
        <span
          className="vendor-section-title"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Users /> Заявки на работу
        </span>
        {!Array.isArray(staffRequests) || staffRequests.length === 0 ? (
          <EmptyState title="Нет заявок" subtitle="Заявки появятся здесь" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {staffRequests.map((req) => (
              <div key={req.id} className="staff-request-card">
                <div className="staff-request-info">
                  <div style={{ fontWeight: 700 }}>
                    Пользователь #{req.user_id.slice(0, 8)}
                  </div>
                  <span className="order-status-badge pending">
                    {req.status}
                  </span>
                </div>
                {req.status === "PENDING" && (
                  <div className="staff-request-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStaffDecision(req.id, "ACCEPTED")}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStaffDecision(req.id, "REJECTED")}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboardPage;
