import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { vendorService } from "../../services/vendorService";
import EmptyState from "../../components/ui/EmptyState";
import { ROUTES } from "../../constants/routes";

const VendorDashboardPage = () => {
  const { restaurants, fetchMyRestaurants, loading, addMenuItem } =
    useRestaurantStore();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [staffRequests, setStaffRequests] = useState([]);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({ name: "", address: "" });
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "SHAURMA",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();

  const { createRestaurant } = useRestaurantStore();

  useEffect(() => {
    fetchMyRestaurants();
    vendorService
      .getStaffRequests()
      .then((res) => setStaffRequests(res.data))
      .catch(() => {});
  }, [fetchMyRestaurants]);

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

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setFormLoading(true);
    setFormError("");
    try {
      await addMenuItem(selectedRestaurant.id, {
        ...newItem,
        price: parseInt(newItem.price, 10),
      });
      setShowAddItem(false);
      setNewItem({ name: "", description: "", price: "", category: "SHAURMA" });
    } catch (err) {
      setFormError(err.response?.data?.detail || "Ошибка добавления");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStaffDecision = async (requestId, status) => {
    try {
      await vendorService.updateStaffStatus(requestId, status);
      setStaffRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r)),
      );
    } catch {}
  };

  const menus = useRestaurantStore((s) => s.menus);
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

      {/* Restaurants */}
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
            id="add-restaurant-btn"
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
              id="new-restaurant-name"
              className="form-input"
              placeholder="Название"
              value={newRestaurant.name}
              onChange={(e) =>
                setNewRestaurant((p) => ({ ...p, name: e.target.value }))
              }
              required
            />
            <input
              id="new-restaurant-address"
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
              id="create-restaurant-submit"
            >
              {formLoading ? "Создаём..." : "Создать"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : restaurants.length === 0 ? (
          <EmptyState
            title="Нет заведений"
            subtitle="Добавьте первое заведение"
          />
        ) : (
          <div className="restaurant-list">
            {restaurants.map((r) => (
              <div
                key={r.id}
                id={`restaurant-row-${r.id}`}
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

      {/* Menu for selected restaurant */}
      {selectedRestaurant && (
        <div className="vendor-section">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <span className="vendor-section-title">
              🍽️ Меню — {selectedRestaurant.name}
            </span>
            <button
              id="add-menu-item-btn"
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddItem(!showAddItem)}
            >
              + Позиция
            </button>
          </div>

          {showAddItem && (
            <form
              onSubmit={handleAddItem}
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
                Новая позиция
              </h3>
              {formError && <div className="form-error">{formError}</div>}
              <input
                id="new-item-name"
                className="form-input"
                placeholder="Название"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
              <input
                id="new-item-description"
                className="form-input"
                placeholder="Описание (опционально)"
                value={newItem.description}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, description: e.target.value }))
                }
              />
              <input
                id="new-item-price"
                className="form-input"
                type="number"
                placeholder="Цена (в рублях)"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, price: e.target.value }))
                }
                required
                min="1"
              />
              <select
                id="new-item-category"
                className="form-input"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, category: e.target.value }))
                }
              >
                {["SHAURMA", "BURGER", "PIZZA", "SUSHI"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formLoading}
                id="create-item-submit"
              >
                {formLoading ? "Добавляем..." : "Добавить"}
              </button>
            </form>
          )}

          {selectedMenu.length === 0 ? (
            <EmptyState
              title="Меню пустое"
              subtitle="Добавьте первую позицию"
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                    {item.description && (
                      <div
                        style={{ fontSize: "0.78rem", color: "var(--stone)" }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                  <span
                    style={{ fontWeight: 800, color: "var(--ember-orange)" }}
                  >
                    {item.price} ₽
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff requests */}
      <div className="vendor-section">
        <span className="vendor-section-title">👥 Заявки на работу</span>
        {staffRequests.length === 0 ? (
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
                      }}
                    >
                      "{req.message}"
                    </div>
                  )}
                  <span
                    className={`order-status-badge ${req.status === "pending" ? "pending" : req.status === "approved" ? "ready" : "preparing"}`}
                    style={{ marginTop: 6, display: "inline-flex" }}
                  >
                    {req.status}
                  </span>
                </div>
                {req.status === "pending" && (
                  <div className="staff-request-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      id={`approve-request-${req.id}`}
                      onClick={() => handleStaffDecision(req.id, "approved")}
                    >
                      ✓
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      id={`reject-request-${req.id}`}
                      onClick={() => handleStaffDecision(req.id, "rejected")}
                    >
                      ✕
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
