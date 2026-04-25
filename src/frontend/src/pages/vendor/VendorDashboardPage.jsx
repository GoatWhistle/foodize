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
  Tag,
  Trash,
} from "@phosphor-icons/react";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { vendorService } from "../../services/vendorService";
import { orderService } from "../../services/orderService";
import { menuService } from "../../services/menuService";
import { promoService } from "../../services/promoService";
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
  const [, setStaffTotal] = useState(0);

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
  const [ordersStatusFilter, setOrdersStatusFilter] = useState("");
  const pollInterval = useRef(null);

  const [vendorDescription, setVendorDescription] = useState("");
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionSaved, setDescriptionSaved] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const { createRestaurant } = useRestaurantStore();

  // Promos state
  const [promosList, setPromosList] = useState([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [promosError, setPromosError] = useState("");
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: "",
    discount_type: "PERCENT",
    discount_value: "",
    max_uses: "",
    expires_at: "",
  });
  const [promoFormLoading, setPromoFormLoading] = useState(false);

  useEffect(() => {
    fetchMyRestaurants();
    vendorService
      .getMyProfile()
      .then((res) => {
        setVendorDescription(res.data?.description || "");
      })
      .catch(() => {});
  }, [fetchMyRestaurants]);

  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenu(selectedRestaurant.id);
      setEditRestaurant(null);
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
            {
              page: ordersPage,
              size: 20,
              status: ordersStatusFilter || undefined,
            },
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
      if (ordersPage === 1 && !ordersStatusFilter) {
        pollInterval.current = setInterval(fetchOrders, 5000);
      }
    }
    return () => clearInterval(pollInterval.current);
  }, [selectedRestaurant, activeTab, ordersPage, ordersStatusFilter]);

  useEffect(() => {
    if (activeTab === "promos") {
      setPromosLoading(true);
      setPromosError("");
      promoService
        .list()
        .then((res) => {
          const list = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
              ? res.data
              : [];
          setPromosList(list);
        })
        .catch(() => setPromosError("Не удалось загрузить промокоды"))
        .finally(() => setPromosLoading(false));
    }
  }, [activeTab]);

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

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setPromoFormLoading(true);
    setPromosError("");
    try {
      const payload = {
        code: promoForm.code,
        discount_type: promoForm.discount_type,
        discount_value: parseInt(promoForm.discount_value, 10),
        restaurant_id: selectedRestaurant.id,
        ...(promoForm.max_uses
          ? { max_uses: parseInt(promoForm.max_uses, 10) }
          : {}),
        ...(promoForm.expires_at
          ? { expires_at: new Date(promoForm.expires_at).toISOString() }
          : {}),
      };
      await promoService.create(payload);
      setPromoForm({
        code: "",
        discount_type: "PERCENT",
        discount_value: "",
        max_uses: "",
        expires_at: "",
      });
      setShowPromoForm(false);
      const res = await promoService.list();
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setPromosList(list);
    } catch (err) {
      setPromosError(err.response?.data?.detail || "Ошибка создания промокода");
    } finally {
      setPromoFormLoading(false);
    }
  };

  const handleDeactivatePromo = async (code) => {
    setPromosError("");
    try {
      await promoService.deactivate(code);
      setPromosList((prev) => prev.filter((p) => p.code !== code));
    } catch {
      setPromosError("Не удалось деактивировать промокод");
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
        fetchMenu(selectedRestaurant.id, { force: true });
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

  const handleSaveDescription = async () => {
    setDescriptionLoading(true);
    setDescriptionSaved(false);
    try {
      await vendorService.updateDescription(vendorDescription);
      setDescriptionSaved(true);
      setTimeout(() => setDescriptionSaved(false), 2000);
    } catch {
      /* ignore */
    } finally {
      setDescriptionLoading(false);
    }
  };

  const [menuError, setMenuError] = useState("");
  const [ordersError, setOrdersError] = useState("");

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm("Удалить позицию?")) return;
    setMenuError("");
    try {
      await menuService.deleteItem(selectedRestaurant.id, itemId);
      fetchMenu(selectedRestaurant.id, { force: true });
    } catch {
      setMenuError("Не удалось удалить позицию");
    }
  };

  const handleOrderChange = async (orderId, status) => {
    setOrdersError("");
    try {
      await orderService.updateStatus(orderId, status);
      setRestaurantOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    } catch {
      setOrdersError("Не удалось изменить статус заказа");
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
                <span style={{ marginLeft: "auto", color: "var(--text-3)" }}>
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
              { id: "promos", label: "Промокоды", icon: <Tag /> },
              { id: "settings", label: "Настройки", icon: <Gear /> },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`category-chip ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "settings" && selectedRestaurant) {
                    setEditRestaurant(
                      (prev) => prev ?? { ...selectedRestaurant },
                    );
                  }
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "menu" && (
            <div>
              {menuError && (
                <div className="form-error" style={{ marginBottom: 12 }}>
                  {menuError}
                </div>
              )}
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
                      <option value="SALAD">Салат</option>
                      <option value="SNACK">Снек</option>
                      <option value="DRINK">Напиток</option>
                      <option value="OTHER">Другое</option>
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
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-3)",
                          }}
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

          {activeTab === "orders" && (
            <div>
              {ordersError && (
                <div className="form-error" style={{ marginBottom: 12 }}>
                  {ordersError}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                {[
                  { key: "", label: "Все" },
                  { key: "PENDING", label: "Новые" },
                  { key: "COOKING", label: "Готовятся" },
                  { key: "READY", label: "Готовы" },
                  { key: "COMPLETED", label: "Выданы" },
                  { key: "CANCELLED", label: "Отменены" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className={`category-chip${ordersStatusFilter === key ? " active" : ""}`}
                    style={{ fontSize: "0.78rem", padding: "4px 12px" }}
                    onClick={() => {
                      setOrdersStatusFilter(key);
                      setOrdersPage(1);
                    }}
                  >
                    {label}
                  </button>
                ))}
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
                          style={{ fontSize: "0.8rem", color: "var(--text-3)" }}
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
                                  handleOrderChange(order.id, "ACCEPTED")
                                }
                              >
                                <Check size={16} /> Принять
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
                          {order.status === "ACCEPTED" && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                handleOrderChange(order.id, "COOKING")
                              }
                            >
                              <Fire size={16} /> В готовку
                            </button>
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

          {activeTab === "promos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  Промокоды
                </span>
                {selectedRestaurant && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      height: 32,
                    }}
                    onClick={() => setShowPromoForm((v) => !v)}
                  >
                    <Plus size={14} />
                    Создать
                  </button>
                )}
              </div>

              {promosError && <div className="form-error">{promosError}</div>}

              {showPromoForm && selectedRestaurant && (
                <form
                  onSubmit={handleCreatePromo}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      marginBottom: 4,
                    }}
                  >
                    Новый промокод
                  </div>
                  <input
                    className="form-input"
                    placeholder="Код (напр. SAVE20)"
                    value={promoForm.code}
                    onChange={(e) =>
                      setPromoForm((f) => ({
                        ...f,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    required
                  />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <select
                      className="form-input"
                      value={promoForm.discount_type}
                      onChange={(e) =>
                        setPromoForm((f) => ({
                          ...f,
                          discount_type: e.target.value,
                        }))
                      }
                    >
                      <option value="PERCENT">% Процент</option>
                      <option value="FIXED">₽ Фиксированный</option>
                    </select>
                    <input
                      className="form-input"
                      type="number"
                      placeholder={
                        promoForm.discount_type === "PERCENT"
                          ? "Скидка %"
                          : "Сумма ₽"
                      }
                      min={1}
                      value={promoForm.discount_value}
                      onChange={(e) =>
                        setPromoForm((f) => ({
                          ...f,
                          discount_value: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Макс. использований (не обяз.)"
                      min={1}
                      value={promoForm.max_uses}
                      onChange={(e) =>
                        setPromoForm((f) => ({
                          ...f,
                          max_uses: e.target.value,
                        }))
                      }
                    />
                    <input
                      className="form-input"
                      type="datetime-local"
                      placeholder="Истекает (не обяз.)"
                      value={promoForm.expires_at}
                      onChange={(e) =>
                        setPromoForm((f) => ({
                          ...f,
                          expires_at: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      type="submit"
                      disabled={promoFormLoading}
                      style={{ flex: 1 }}
                    >
                      {promoFormLoading ? "Создаю..." : "Создать"}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={() => setShowPromoForm(false)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </form>
              )}

              {promosLoading ? (
                <div className="loading-center">
                  <div className="spinner" />
                </div>
              ) : promosList.length === 0 ? (
                <EmptyState
                  icon={<Tag size={36} />}
                  title="Нет промокодов"
                  subtitle="Создайте первый промокод для скидки клиентам"
                />
              ) : (
                promosList.map((promo) => (
                  <div
                    key={promo.id}
                    style={{
                      background: "var(--bg-card)",
                      border: `1px solid ${promo.is_active ? "var(--border)" : "var(--border-faint, var(--border))"}`,
                      borderRadius: "var(--radius-md)",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      opacity: promo.is_active ? 1 : 0.5,
                    }}
                  >
                    <Tag
                      size={18}
                      weight="bold"
                      color={promo.is_active ? "var(--fire)" : "var(--text-3)"}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          fontFamily: "monospace",
                        }}
                      >
                        {promo.code}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-3)",
                          marginTop: 2,
                        }}
                      >
                        {promo.discount_type === "PERCENT"
                          ? `${promo.discount_value}%`
                          : `${promo.discount_value} ₽`}
                        {" • "}
                        {promo.used_count}/{promo.max_uses ?? "∞"} исп.
                        {promo.expires_at
                          ? ` • до ${new Date(promo.expires_at).toLocaleDateString()}`
                          : ""}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "100px",
                        background: promo.is_active
                          ? "rgba(34,197,94,0.12)"
                          : "rgba(107,114,128,0.12)",
                        color: promo.is_active ? "#22c55e" : "#6b7280",
                        border: `1px solid ${promo.is_active ? "rgba(34,197,94,0.3)" : "rgba(107,114,128,0.2)"}`,
                      }}
                    >
                      {promo.is_active ? "Активен" : "Завершён"}
                    </span>
                    {promo.is_active && (
                      <button
                        className="btn-icon-sm danger"
                        onClick={() => handleDeactivatePromo(promo.code)}
                        title="Деактивировать"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                ))
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
                  <label style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>
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
                  <label style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>
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
                <label className="form-check">
                  <input
                    type="checkbox"
                    checked={
                      editRestaurant?.is_hiring ??
                      selectedRestaurant.is_hiring ??
                      false
                    }
                    onChange={(e) =>
                      setEditRestaurant({
                        ...(editRestaurant || selectedRestaurant),
                        is_hiring: e.target.checked,
                      })
                    }
                  />
                  <span className="form-check-label">Набор сотрудников</span>
                </label>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  Сохранить
                </button>
              </form>

              {/* Vendor description */}
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 20,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <h4
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 10,
                  }}
                >
                  О заведении
                </h4>
                <textarea
                  className="form-input"
                  placeholder="Расскажите о вашем заведении..."
                  value={vendorDescription}
                  onChange={(e) => setVendorDescription(e.target.value)}
                  rows={4}
                  style={{ resize: "vertical", marginBottom: 10 }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleSaveDescription}
                  disabled={descriptionLoading}
                  style={{ width: "100%" }}
                >
                  {descriptionSaved
                    ? "Сохранено ✓"
                    : descriptionLoading
                      ? "Сохранение..."
                      : "Сохранить описание"}
                </button>
              </div>
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
