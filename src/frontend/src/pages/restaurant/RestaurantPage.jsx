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
  Leaf,
  Cookie,
  Coffee,
  DotsThree,
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
  SALAD: <Leaf />,
  SNACK: <Cookie />,
  DRINK: <Coffee />,
  OTHER: <DotsThree />,
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
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffMessage, setStaffMessage] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");

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
      {/* Hero */}
      <div className="restaurant-hero">
        {restaurant.photo_url ? (
          <img
            className="restaurant-hero-img"
            src={restaurant.photo_url}
            alt={restaurant.name}
            style={{ viewTransitionName: `restaurant-image-${restaurant.id}` }}
          />
        ) : (
          <div className="restaurant-hero-placeholder">
            <ForkKnife size={48} color="rgba(255,255,255,0.3)" />
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
            }}
          >
            <ChatCircleText size={16} weight="bold" /> Отзывы
          </button>
        </div>
      </div>

      {/* Menu */}
      <div className="restaurant-content">
        <div className="menu-categories-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip${activeCategory === cat ? " active" : ""}`}
              onClick={() => setActiveCategory(cat)}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              {cat === "ALL" ? <List size={14} /> : CATEGORY_ICONS[cat]}
              {cat === "ALL" ? "Все" : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
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

      {/* Staff FAB */}
      <button
        className="staff-fab"
        onClick={() => setShowStaffModal(true)}
        aria-label="Работа"
      >
        <Briefcase size={22} weight="fill" />
      </button>

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div
            className="modal-content"
            style={{ maxWidth: "440px", padding: "36px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "var(--text-1)",
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
                  color: "var(--text-3)",
                  display: "flex",
                }}
              >
                <X size={28} weight="bold" />
              </button>
            </div>

            <p
              style={{
                fontSize: "1rem",
                color: "var(--text-2)",
                marginBottom: "24px",
                lineHeight: 1.6,
              }}
            >
              Хотите работать в{" "}
              <span style={{ color: "var(--fire)", fontWeight: 700 }}>
                {restaurant.name}
              </span>
              ?
            </p>

            <form
              onSubmit={handleStaffSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <textarea
                className="form-input"
                placeholder="Расскажите о себе..."
                value={staffMessage}
                onChange={(e) => setStaffMessage(e.target.value)}
                rows={5}
                required
                style={{ borderRadius: "var(--r-md)", resize: "vertical" }}
              />
              {staffError && <div className="form-error">{staffError}</div>}
              <button
                className="btn btn-primary btn-full"
                type="submit"
                style={{ borderRadius: "var(--r-md)", height: "52px" }}
              >
                {staffLoading ? "Отправка..." : "Отправить заявку"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: "500px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              padding: "36px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "var(--text-1)",
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
                  color: "var(--text-3)",
                  display: "flex",
                }}
              >
                <X size={28} weight="bold" />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {/* Write review */}
              <form
                onSubmit={handleReviewSubmit}
                style={{
                  background: "var(--bg-surface)",
                  padding: "24px",
                  borderRadius: "var(--r-lg)",
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
                      size={30}
                      weight={s <= reviewForm.rating ? "fill" : "regular"}
                      color="var(--fire)"
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rating: s })
                      }
                      style={{
                        cursor: "pointer",
                        transition: "transform 150ms",
                        transform:
                          s <= reviewForm.rating ? "scale(1.1)" : "scale(1)",
                      }}
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
                    borderRadius: "var(--r-md)",
                    marginBottom: "12px",
                    background: "var(--bg-card)",
                    minHeight: "80px",
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
                      color: "#22c55e",
                      marginBottom: 8,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    Отзыв опубликован
                  </div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  style={{ borderRadius: "var(--r-md)" }}
                >
                  Опубликовать
                </button>
              </form>

              {/* Reviews list */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {reviewsLoading ? (
                  <div className="loading-center">
                    <div className="spinner" />
                  </div>
                ) : reviewsList.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      color: "var(--text-3)",
                      fontSize: "0.875rem",
                    }}
                  >
                    Отзывов пока нет
                  </p>
                ) : (
                  reviewsList.map((r) => (
                    <div
                      key={r.id}
                      className="review-card"
                      style={{
                        padding: "18px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-md)",
                        transition:
                          "border-color var(--dur-sm), transform var(--dur-sm)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
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
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, var(--fire), var(--amber))",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                            }}
                          >
                            {r.user_id?.slice(0, 1).toUpperCase() || "U"}
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                color: "var(--text-1)",
                              }}
                            >
                              Клиент #{r.user_id?.slice(0, 4)}
                            </div>
                            {r.is_verified_purchase && (
                              <span
                                className="verified-purchase-badge"
                                style={{ marginTop: 3 }}
                              >
                                <ShoppingBag size={10} weight="fill" />
                                Подтверждённый заказ
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 1,
                            color: "var(--fire)",
                          }}
                        >
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              weight={i < r.rating ? "fill" : "regular"}
                            />
                          ))}
                        </div>
                      </div>
                      <p
                        style={{
                          color: "var(--text-2)",
                          margin: 0,
                          lineHeight: 1.6,
                          fontSize: "0.875rem",
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
