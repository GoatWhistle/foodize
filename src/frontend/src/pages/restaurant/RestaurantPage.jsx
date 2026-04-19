import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Star,
  ChatCircleText,
  Briefcase,
  ForkKnife,
  X,
  Pizza,
  Hamburger,
  BowlFood,
  List,
  Fire,
  ShoppingBag,
} from "@phosphor-icons/react";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { useOrderStore } from "../../store/useOrderStore";
import MenuItemCard from "../../components/ui/MenuItemCard";
import { reviewService } from "../../services/reviewService";
import { staffService } from "../../services/staffService";

const CATEGORY_ICONS = {
  SHAURMA: <Fire />,
  BURGER: <Hamburger />,
  PIZZA: <Pizza />,
  SUSHI: <BowlFood />,
};

const RestaurantPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const restaurant = location.state?.restaurant || {
    id,
    name: "Ресторан",
    address: "",
  };

  const { fetchMenu, menus, loading } = useRestaurantStore();
  const { addToCart } = useOrderStore();

  const [activeCategory, setActiveCategory] = useState("ALL");
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

  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess(false);
    if (!reviewForm.text.trim()) {
      setReviewError("Напишите текст отзыва");
      return;
    }
    try {
      await reviewService.createReview(id, {
        text: reviewForm.text,
        rating: reviewForm.rating,
      });
      setReviewSuccess(true);
      setReviewForm({ rating: 5, text: "" });
      loadReviews();
    } catch (err) {
      setReviewError(
        err.response?.data?.detail || "Не удалось отправить отзыв",
      );
    }
  };

  const [staffError, setStaffError] = useState("");

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffError("");
    setStaffLoading(true);
    try {
      await staffService.createRequest(id, { message: staffMessage });
      setShowStaffModal(false);
      setStaffMessage("");
    } catch {
      setStaffError("Ошибка при отправке заявки");
    } finally {
      setStaffLoading(false);
    }
  };

  const categories = [
    "ALL",
    ...new Set(menuItems.map((i) => i.category).filter(Boolean)),
  ];
  const filtered =
    activeCategory === "ALL"
      ? menuItems
      : menuItems.filter((i) => i.category === activeCategory);

  return (
    <div
      className="page-enter"
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <div className="restaurant-hero">
        {restaurant.photo_url ? (
          <img
            className="restaurant-hero-img"
            src={restaurant.photo_url}
            alt={restaurant.name}
          />
        ) : (
          <div className="restaurant-hero-placeholder">
            <ForkKnife size={48} color="white" />
          </div>
        )}
        <div className="restaurant-hero-overlay" />
        <div className="restaurant-hero-info">
          <h1 className="restaurant-hero-name">{restaurant.name}</h1>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setShowReviewsModal(true);
              loadReviews();
            }}
            style={{ marginTop: 12 }}
          >
            <ChatCircleText size={18} /> Отзывы
          </button>
        </div>
      </div>

      <div className="restaurant-content">
        <div className="menu-categories-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip${activeCategory === cat ? " active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "ALL" ? <List /> : CATEGORY_ICONS[cat]}{" "}
              {cat === "ALL" ? "Все" : cat}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="menu-list">
            {filtered.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAdd={(i) => addToCart(i, id)}
              />
            ))}
          </div>
        )}
      </div>

      <button className="staff-fab" onClick={() => setShowStaffModal(true)}>
        <Briefcase size={24} weight="fill" />
      </button>

      {showStaffModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: "440px",
              width: "90%",
              background: "var(--bg-card)",
              borderRadius: "28px",
              padding: "32px",
            }}
          >
            <div
              className="modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "2.4rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Работа
              </h2>
              <button
                onClick={() => setShowStaffModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                }}
              >
                <X size={32} weight="bold" />
              </button>
            </div>
            <p
              style={{
                fontSize: "1.5rem",
                color: "var(--text-primary)",
                marginBottom: "28px",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Хотите работать в{" "}
              <span style={{ color: "var(--ember-orange)" }}>
                {restaurant.name}
              </span>
              ?
            </p>
            <form
              onSubmit={handleStaffSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <textarea
                className="form-input"
                placeholder="Расскажите о себе..."
                value={staffMessage}
                onChange={(e) => setStaffMessage(e.target.value)}
                rows={5}
                required
                style={{ borderRadius: "16px" }}
              />
              {staffError && <div className="form-error">{staffError}</div>}
              <button
                className="btn btn-primary btn-full"
                type="submit"
                style={{
                  borderRadius: "16px",
                  height: "56px",
                  fontSize: "1.1rem",
                }}
              >
                {staffLoading ? "Отправка..." : "Отправить заявку"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showReviewsModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: "500px",
              width: "95%",
              maxHeight: "85vh",
              background: "var(--bg-card)",
              display: "flex",
              flexDirection: "column",
              borderRadius: "28px",
              padding: "32px",
            }}
          >
            <div
              className="modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "2.4rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Отзывы
              </h2>
              <button
                onClick={() => setShowReviewsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                }}
              >
                <X size={32} weight="bold" />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "8px" }}>
              <div
                style={{
                  background: "var(--bg-surface)",
                  padding: "24px",
                  borderRadius: "20px",
                  marginBottom: "24px",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={32}
                      weight={s <= reviewForm.rating ? "fill" : "regular"}
                      color="var(--ember-orange)"
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rating: s })
                      }
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </div>
                <textarea
                  className="form-input"
                  placeholder="Ваш отзыв..."
                  value={reviewForm.text}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, text: e.target.value })
                  }
                  style={{
                    borderRadius: "14px",
                    marginBottom: "12px",
                    background: "var(--bg-card)",
                  }}
                />
                {reviewError && (
                  <div className="form-error" style={{ marginBottom: 8 }}>
                    {reviewError}
                  </div>
                )}
                {reviewSuccess && (
                  <div
                    style={{
                      color: "green",
                      marginBottom: 8,
                      fontSize: "0.85rem",
                    }}
                  >
                    Отзыв опубликован
                  </div>
                )}
                <button
                  className="btn btn-primary btn-full"
                  style={{ borderRadius: "14px" }}
                  onClick={handleReviewSubmit}
                >
                  Опубликовать
                </button>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {reviewsLoading ? (
                  <div className="spinner" />
                ) : reviewsList.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--stone)" }}>
                    Отзывов пока нет
                  </p>
                ) : (
                  reviewsList.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: "20px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "20px",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "var(--ember-orange)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "0.8rem",
                              fontWeight: 800,
                            }}
                          >
                            {r.user_id?.slice(0, 1).toUpperCase() || "U"}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color: "var(--text-primary)",
                              }}
                            >
                              Клиент #{r.user_id?.slice(0, 4)}
                            </span>
                            {r.is_verified_purchase && (
                              <span className="verified-purchase-badge">
                                <ShoppingBag size={11} weight="fill" />
                                Подтверждённый заказ
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            color: "var(--ember-orange)",
                          }}
                        >
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              weight={i < r.rating ? "fill" : "regular"}
                            />
                          ))}
                        </div>
                      </div>
                      <p
                        style={{
                          color: "var(--text-primary)",
                          opacity: 0.85,
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {r.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantPage;
