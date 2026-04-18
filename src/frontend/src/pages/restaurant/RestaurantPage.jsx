import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { useOrderStore } from "../../store/useOrderStore";
import MenuItemCard from "../../components/ui/MenuItemCard";
import CartDrawer from "../../components/ui/CartDrawer";
import EmptyState from "../../components/ui/EmptyState";
import { ROUTES } from "../../constants/routes";
import { reviewService } from "../../services/reviewService";
import { staffService } from "../../services/staffService";

const CATEGORY_EMOJI = {
  SHAURMA: "🌯",
  BURGER: "🍔",
  PIZZA: "🍕",
  SUSHI: "🍣",
};

const RestaurantPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const restaurant = location.state?.restaurant || {
    id,
    name: "Ресторан",
    address: "",
  };

  const { fetchMenu, menus, loading } = useRestaurantStore();
  const { addToCart } = useOrderStore();
  const count = useOrderStore((s) => s.cartCount());
  const total = useOrderStore((s) => s.cartTotal());

  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");

  const [ratingInfo, setRatingInfo] = useState({ average_rating: 0, count: 0 });
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "" });
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffMessage, setStaffMessage] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);

  const menuItems = menus[id] || [];

  useEffect(() => {
    fetchMenu(id);
    reviewService
      .getRating(id)
      .then((res) => setRatingInfo(res.data))
      .catch(() => {});
  }, [id, fetchMenu]);

  const loadReviews = () => {
    setReviewsLoading(true);
    reviewService
      .getReviews(id)
      .then((res) => {
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];
        setReviewsList(list);
      })
      .finally(() => setReviewsLoading(false));
  };

  const handleOpenReviews = () => {
    setShowReviewsModal(true);
    loadReviews();
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewForm.rating < 1 || reviewForm.rating > 5) return;
    try {
      await reviewService.createReview(id, reviewForm);
      setReviewForm({ rating: 5, text: "" });
      loadReviews();
      reviewService
        .getRating(id)
        .then((res) => setRatingInfo(res.data))
        .catch(() => {});
    } catch {
      alert("Не удалось отправить отзыв");
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffLoading(true);
    try {
      await staffService.createRequest(id, { message: staffMessage });
      alert("Заявка успешно отправлена!");
      setShowStaffModal(false);
      setStaffMessage("");
    } catch {
      alert("Ошибка при отправке заявки");
    } finally {
      setStaffLoading(false);
    }
  };

  const categories = [
    "ALL",
    ...new Set(
      (Array.isArray(menuItems) ? menuItems : [])
        .map((i) => i.category)
        .filter(Boolean),
    ),
  ];

  const filtered =
    activeCategory === "ALL"
      ? menuItems
      : menuItems.filter((i) => i.category === activeCategory);

  const handleAdd = (item) => {
    addToCart(item, id);
  };

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const { placeOrder } = useOrderStore();

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const order = await placeOrder();
      setCartOpen(false);
      navigate(ROUTES.ORDER_STATUS.replace(":id", order.id));
    } catch (err) {
      setCheckoutError(
        err.response?.data?.detail || "Не удалось разместить заказ",
      );
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="page-enter">
      {/* Hero */}
      <div className="restaurant-hero">
        {restaurant.photo_url ? (
          <img
            className="restaurant-hero-img"
            src={restaurant.photo_url}
            alt={restaurant.name}
            style={{ viewTransitionName: `restaurant-image-${id}` }}
          />
        ) : (
          <div className="restaurant-hero-placeholder">
            {CATEGORY_EMOJI[restaurant.category] || "🍽️"}
          </div>
        )}
        <div className="restaurant-hero-overlay" />
        <div className="restaurant-hero-info">
          <h1 className="restaurant-hero-name">{restaurant.name}</h1>
          <div className="card-tags">
            {restaurant.is_open === false && (
              <span
                className="tag-pill"
                style={{
                  background: "rgba(255,0,0,0.1)",
                  color: "red",
                  fontWeight: "800",
                }}
              >
                🔴 Закрыто
              </span>
            )}
            {ratingInfo.count > 0 && (
              <span
                className="tag-pill"
                style={{ background: "var(--bg-card)", color: "#ffb800" }}
              >
                ⭐ {ratingInfo.average_rating.toFixed(1)} ({ratingInfo.count})
              </span>
            )}
            <span className="tag-pill">{restaurant.address}</span>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleOpenReviews}
            >
              💬 Отзывы
            </button>
            {restaurant.is_hiring !== false && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowStaffModal(true)}
              >
                💼 Работать здесь
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="restaurant-content">
        {/* Category filter */}
        {Array.isArray(categories) && categories.length > 1 && (
          <div className="menu-categories-scroll">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`menu-cat-${cat.toLowerCase()}`}
                className={`category-chip${activeCategory === cat ? " active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === "ALL"
                  ? "🍽️ Все"
                  : `${CATEGORY_EMOJI[cat] || ""} ${cat}`}
              </button>
            ))}
          </div>
        )}

        {/* Menu */}
        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Меню пустое" subtitle="Позиции ещё не добавлены" />
        ) : (
          <div className="menu-list">
            {(Array.isArray(filtered) ? filtered : []).map((item) => (
              <MenuItemCard key={item.id} item={item} onAdd={handleAdd} />
            ))}
          </div>
        )}
      </div>

      {/* Cart FAB */}
      {count > 0 && (
        <button
          id="cart-fab-btn"
          className="cart-fab"
          onClick={() => setCartOpen(true)}
          aria-label="Открыть корзину"
        >
          <span className="cart-badge">{count}</span>
          Корзина
          <span style={{ marginLeft: "auto", fontWeight: 800 }}>{total} ₽</span>
        </button>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckout}
          isLoading={checkoutLoading}
          error={checkoutError}
        />
      )}

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div
          className="overlay"
          style={{
            zIndex: 1000,
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              padding: 24,
              borderRadius: "var(--radius-lg)",
              width: "calc(100% - 32px)",
              maxWidth: 400,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontWeight: 800 }}>Отзывы</h3>
              <button
                onClick={() => setShowReviewsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmitReview}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() =>
                      setReviewForm((p) => ({ ...p, rating: star }))
                    }
                    style={{
                      fontSize: "1.5rem",
                      cursor: "pointer",
                      color:
                        star <= reviewForm.rating ? "#ffb800" : "var(--stone)",
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <textarea
                className="form-input"
                placeholder="Напишите свой отзыв..."
                value={reviewForm.text}
                onChange={(e) =>
                  setReviewForm((p) => ({ ...p, text: e.target.value }))
                }
                rows={3}
                required
              />
              <button className="btn btn-primary" type="submit">
                Оставить отзыв
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reviewsLoading ? (
                <div className="loading-center">
                  <div className="spinner" />
                </div>
              ) : reviewsList.length === 0 ? (
                <p style={{ color: "var(--stone)", textAlign: "center" }}>
                  Пока нет отзывов
                </p>
              ) : (
                (Array.isArray(reviewsList) ? reviewsList : []).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: 12,
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                        Поль-ль #{r.user_id.slice(0, 6)}
                      </span>
                      <span style={{ color: "#ffb800", fontSize: "0.85rem" }}>
                        {"★".repeat(r.rating)}
                        {"☆".repeat(5 - r.rating)}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.9rem" }}>{r.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div
          className="overlay"
          style={{
            zIndex: 1000,
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              padding: 24,
              borderRadius: "var(--radius-lg)",
              width: "calc(100% - 32px)",
              maxWidth: 400,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontWeight: 800 }}>Заявка на работу</h3>
              <button
                onClick={() => setShowStaffModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--stone)",
                marginBottom: 16,
              }}
            >
              Хотите работать в <b>{restaurant.name}</b>? Напишите владельцу
              сообщение с вашими контактами и опытом.
            </p>
            <form
              onSubmit={handleStaffSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <textarea
                className="form-input"
                placeholder="Расскажите о себе..."
                value={staffMessage}
                onChange={(e) => setStaffMessage(e.target.value)}
                rows={4}
                required
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={staffLoading}
              >
                {staffLoading ? "Отправка..." : "Отправить заявку"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantPage;
