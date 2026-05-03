import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  Star,
  ShoppingCart,
  ChatCircle,
  Briefcase,
  Pizza,
  Hamburger,
  BowlFood,
  Leaf,
  Cookie,
  Coffee,
  DotsThree,
  List,
  Fire,
  Trash,
} from "@phosphor-icons/react";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { useOrderStore } from "../../store/useOrderStore";
import { useFavoriteStore } from "../../store/useFavoriteStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useShallow } from "zustand/react/shallow";
import { reviewService } from "../../services/reviewService";
import { restaurantService } from "../../services/restaurantService";
import { staffService } from "../../services/staffService";
import { BackButton } from "../../telegram/sdk";
import MenuItemCard from "../../components/ui/MenuItemCard";
import CartDrawer from "../../components/ui/CartDrawer";

const CATEGORY_ICONS = {
  SHAURMA: <Fire size={14} />,
  BURGER: <Hamburger size={14} />,
  PIZZA: <Pizza size={14} />,
  SUSHI: <BowlFood size={14} />,
  SALAD: <Leaf size={14} />,
  SNACK: <Cookie size={14} />,
  DRINK: <Coffee size={14} />,
  OTHER: <DotsThree size={14} />,
};

const formatReviewTime = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const RestaurantPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [restaurantData, setRestaurantData] = useState(
    location.state?.restaurant ?? null,
  );
  const [rating, setRating] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [showReviews, setShowReviews] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "" });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [customizeError, setCustomizeError] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffMessage, setStaffMessage] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const currentUser = useAuthStore((s) => s.user);
  const [reviewDeleteId, setReviewDeleteId] = useState(null);

  const { fetchMenu, menus, loading } = useRestaurantStore(
    useShallow((s) => ({
      fetchMenu: s.fetchMenu,
      menus: s.menus,
      loading: s.loading,
    })),
  );
  const { addToCart, cartCount } = useOrderStore(
    useShallow((s) => ({
      addToCart: s.addToCart,
      cartCount: s.cartCount,
    })),
  );
  const { favoriteIds, toggle } = useFavoriteStore(
    useShallow((s) => ({
      favoriteIds: s.favoriteIds,
      toggle: s.toggle,
    })),
  );

  const restaurant = restaurantData ?? { id, name: "Ресторан", address: "" };
  const menuItems = menus[id] || [];
  const isFav = favoriteIds.has(id);
  const count = cartCount ? cartCount() : 0;

  useEffect(() => {
    if (BackButton) {
      BackButton.show();
      const handler = () => navigate("/");
      BackButton.onClick(handler);
      return () => {
        BackButton.offClick(handler);
        BackButton.hide();
      };
    }
  }, [navigate]);

  useEffect(() => {
    fetchMenu(id);
    if (!location.state?.restaurant) {
      restaurantService
        .getById(id)
        .then((res) => setRestaurantData(res.data.data))
        .catch(() => {});
    }
    reviewService
      .getRating(id)
      .then((res) => {
        const val =
          res.data?.data?.average_rating ?? res.data?.data?.rating ?? null;
        setRating(val);
      })
      .catch(() => {});
  }, [id, fetchMenu, location.state]);

  const loadReviews = () => {
    setReviewsLoading(true);
    reviewService
      .getReviews(id)
      .then((res) =>
        setReviewsList(Array.isArray(res.data?.data) ? res.data.data : []),
      )
      .finally(() => setReviewsLoading(false));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    if (!reviewForm.text.trim()) {
      setReviewError("Напишите текст");
      return;
    }
    try {
      await reviewService.createReview(id, {
        text: reviewForm.text,
        rating: reviewForm.rating,
      });
      setReviewSuccess(true);
      setReviewForm({ rating: 5, text: "" });
      window.setTimeout(() => setReviewSuccess(false), 2200);
      loadReviews();
    } catch {
      setReviewError("Не удалось отправить");
    }
  };

  const handleReviewDelete = async (reviewId) => {
    setReviewDeleteId(reviewId);
  };

  const confirmReviewDelete = async () => {
    if (!reviewDeleteId) return;
    setReviewError("");
    try {
      await reviewService.deleteReview(id, reviewDeleteId);
      setReviewsList((prev) =>
        prev.filter((review) => review.id !== reviewDeleteId),
      );
      setReviewDeleteId(null);
      reviewService
        .getRating(id)
        .then((res) => {
          const val =
            res.data?.data?.average_rating ?? res.data?.data?.rating ?? null;
          setRating(val);
        })
        .catch(() => {});
    } catch {
      setReviewError("Не удалось удалить отзыв");
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

  const allItems = menuItems.filter((i) => i.is_available !== false);
  const categories = [
    "ALL",
    ...new Set(allItems.map((i) => i.category).filter(Boolean)),
  ];
  const filtered =
    activeCategory === "ALL"
      ? allItems
      : allItems.filter((i) => i.category === activeCategory);

  const getActiveOptionGroups = (item) =>
    (item?.option_groups || [])
      .filter((g) => g.is_active !== false)
      .map((g) => ({
        ...g,
        options: (g.options || []).filter((o) => o.is_available !== false),
      }))
      .filter((g) => g.options.length > 0);

  const getSelectedOptions = (item, ids) => {
    const s = new Set(ids);
    return getActiveOptionGroups(item)
      .flatMap((g) => g.options)
      .filter((o) => s.has(o.id));
  };

  const getCustomizedPrice = (item, ids) =>
    (Number(item?.price) || 0) +
    getSelectedOptions(item, ids).reduce(
      (sum, o) => sum + (Number(o.price_delta) || 0),
      0,
    );

  const handleAddMenuItem = (item) => {
    const groups = getActiveOptionGroups(item);
    if (groups.length === 0) {
      addToCart(item, id);
      return;
    }
    setCustomizingItem(item);
    setSelectedOptionIds(
      groups.flatMap((g) =>
        g.is_required && g.selection_type === "single" ? [g.options[0].id] : [],
      ),
    );
    setCustomizeError("");
  };

  const toggleOption = (group, option) => {
    setCustomizeError("");
    setSelectedOptionIds((cur) => {
      const groupIds = group.options.map((o) => o.id);
      if (group.selection_type === "single")
        return [...cur.filter((oid) => !groupIds.includes(oid)), option.id];
      if (cur.includes(option.id))
        return cur.filter((oid) => oid !== option.id);
      if (
        group.max_selected &&
        cur.filter((oid) => groupIds.includes(oid)).length >= group.max_selected
      )
        return cur;
      return [...cur, option.id];
    });
  };

  const handleConfirmCustomization = () => {
    for (const group of getActiveOptionGroups(customizingItem)) {
      const groupIds = group.options.map((o) => o.id);
      if (
        selectedOptionIds.filter((oid) => groupIds.includes(oid)).length <
        group.min_selected
      ) {
        setCustomizeError(`Выберите: ${group.name}`);
        return;
      }
    }
    addToCart(
      customizingItem,
      id,
      getSelectedOptions(customizingItem, selectedOptionIds),
    );
    setCustomizingItem(null);
    setSelectedOptionIds([]);
    setCustomizeError("");
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: count > 0 ? 80 : 20 }}>
      <div className="restaurant-hero">
        {restaurant.photo_url ? (
          <img
            className="restaurant-hero-img"
            src={restaurant.photo_url}
            alt={restaurant.name}
          />
        ) : (
          <div className="restaurant-hero-placeholder">🍽️</div>
        )}
        <div className="restaurant-hero-overlay" />
        <div className="restaurant-hero-info">
          <div className="restaurant-hero-name">{restaurant.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {rating != null && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "var(--amber)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                <Star size={14} weight="fill" />
                {Number(rating).toFixed(1)}
              </span>
            )}
            <button
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
              }}
              onClick={() => {
                setShowReviews(true);
                loadReviews();
              }}
            >
              <ChatCircle size={14} style={{ marginRight: 4 }} />
              Отзывы
            </button>
          </div>
        </div>
        <button
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: isFav ? "rgba(239,68,68,0.18)" : "rgba(0,0,0,0.4)",
            border: isFav
              ? "1px solid rgba(239,68,68,0.4)"
              : "1px solid rgba(255,255,255,0.15)",
            borderRadius: "var(--r-xs)",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={() => toggle(id)}
          aria-label={isFav ? "Убрать из избранного" : "В избранное"}
        >
          <Heart
            size={16}
            weight={isFav ? "fill" : "regular"}
            color={isFav ? "#ef4444" : "rgba(255,255,255,0.8)"}
          />
        </button>
      </div>

      <div className="restaurant-content">
        <div className="menu-categories-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip${activeCategory === cat ? " active" : ""}`}
              onClick={() => setActiveCategory(cat)}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
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
                onAdd={handleAddMenuItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hiring button */}
      {restaurant.is_hiring && (
        <button className="hiring-hint" onClick={() => setShowStaffModal(true)}>
          <Briefcase size={14} weight="bold" />
          Заведение ищет сотрудников — откликнуться
        </button>
      )}

      {count > 0 && (
        <button className="cart-fab" onClick={() => setShowCart(true)}>
          <ShoppingCart size={20} weight="bold" />
          Корзина
          <span className="cart-badge">{count}</span>
        </button>
      )}

      {showCart && <CartDrawer onClose={() => setShowCart(false)} />}

      {/* Staff application modal */}
      {showStaffModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxWidth: 440, padding: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                Работа в {restaurant.name}
              </div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "var(--text-3)",
                }}
                onClick={() => setShowStaffModal(false)}
              >
                ✕
              </button>
            </div>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-2)",
                marginBottom: 16,
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
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <textarea
                className="form-input"
                placeholder="Расскажите о себе..."
                value={staffMessage}
                onChange={(e) => setStaffMessage(e.target.value)}
                rows={4}
                required
                style={{ resize: "vertical" }}
              />
              {staffError && <div className="form-error">{staffError}</div>}
              <button
                className="btn btn-primary btn-full"
                type="submit"
                disabled={staffLoading}
              >
                {staffLoading ? "Отправка..." : "Отправить заявку"}
              </button>
            </form>
          </div>
        </div>
      )}

      {customizingItem && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxWidth: 460, padding: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem" }}>
                  {customizingItem.name}
                </div>
                <div style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>
                  Настройте блюдо
                </div>
              </div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                }}
                onClick={() => setCustomizingItem(null)}
              >
                ✕
              </button>
            </div>
            {getActiveOptionGroups(customizingItem).map((group) => {
              const groupIds = group.options.map((o) => o.id);
              const selectedCount = selectedOptionIds.filter((oid) =>
                groupIds.includes(oid),
              ).length;
              return (
                <div key={group.id} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: "0.88rem" }}>
                      {group.name}
                    </span>
                    <span
                      style={{ color: "var(--text-3)", fontSize: "0.72rem" }}
                    >
                      {group.is_required ? "Обязательно" : "По желанию"}
                      {group.max_selected ? ` · до ${group.max_selected}` : ""}
                    </span>
                  </div>
                  {group.options.map((option) => {
                    const checked = selectedOptionIds.includes(option.id);
                    const disabled =
                      !checked &&
                      group.max_selected &&
                      selectedCount >= group.max_selected;
                    return (
                      <label
                        key={option.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 12px",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          marginBottom: 6,
                          background: checked
                            ? "var(--fire-subtle)"
                            : "var(--bg-card)",
                          opacity: disabled ? 0.5 : 1,
                          cursor: disabled ? "not-allowed" : "pointer",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <input
                            type={
                              group.selection_type === "single"
                                ? "radio"
                                : "checkbox"
                            }
                            name={`group-${group.id}`}
                            checked={checked}
                            disabled={!!disabled}
                            onChange={() => toggleOption(group, option)}
                          />
                          <span style={{ fontSize: "0.85rem" }}>
                            {option.name}
                          </span>
                        </span>
                        {option.price_delta > 0 && (
                          <span
                            style={{
                              color: "var(--fire)",
                              fontWeight: 800,
                              fontSize: "0.82rem",
                            }}
                          >
                            +{option.price_delta} ₽
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              );
            })}
            {customizeError && (
              <div className="form-error" style={{ marginBottom: 12 }}>
                {customizeError}
              </div>
            )}
            <button
              className="btn btn-primary btn-full"
              onClick={handleConfirmCustomization}
            >
              Добавить за{" "}
              {getCustomizedPrice(customizingItem, selectedOptionIds)} ₽
            </button>
          </div>
        </div>
      )}

      {reviewDeleteId && (
        <div className="modal-overlay" style={{ zIndex: 5000 }}>
          <div
            className="modal-content"
            style={{
              padding: 20,
              borderRadius: 14,
              maxWidth: 360,
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Удалить отзыв?</h3>
            <p
              style={{
                color: "var(--text-3)",
                fontSize: "0.88rem",
                lineHeight: 1.45,
                margin: "10px 0 18px",
              }}
            >
              Точно ли вы хотите удалить этот отзыв?
            </p>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setReviewDeleteId(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmReviewDelete}
                style={{ background: "#ef4444" }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviews && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: 500,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              padding: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                Отзывы
              </span>
              <button
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                }}
                onClick={() => setShowReviews(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {reviewSuccess && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 2,
                    padding: "9px 12px",
                    borderRadius: 8,
                    background: "#16a34a",
                    color: "#fff",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
                  }}
                >
                  Отзыв успешно опубликован
                </div>
              )}
              <form
                onSubmit={handleReviewSubmit}
                style={{
                  background: "var(--bg-surface)",
                  padding: 16,
                  borderRadius: 10,
                  marginBottom: 16,
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rating: s })
                      }
                    >
                      <Star
                        size={24}
                        weight={s <= reviewForm.rating ? "fill" : "regular"}
                        color={
                          s <= reviewForm.rating
                            ? "var(--amber)"
                            : "var(--border-mid)"
                        }
                      />
                    </span>
                  ))}
                </div>
                <textarea
                  className="form-input"
                  placeholder="Ваш отзыв..."
                  value={reviewForm.text}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, text: e.target.value })
                  }
                  style={{ minHeight: 70, marginBottom: 8 }}
                />
                {reviewError && (
                  <div className="form-error" style={{ marginBottom: 8 }}>
                    {reviewError}
                  </div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  style={{ borderRadius: 8 }}
                >
                  Опубликовать
                </button>
              </form>
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
                      padding: 14,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      marginBottom: 8,
                      transition: "all var(--dur-sm)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                        {r.user_name || "Клиент"}
                        {formatReviewTime(r.created_at) && (
                          <span
                            style={{
                              display: "block",
                              color: "var(--text-3)",
                              fontSize: "0.74rem",
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            {formatReviewTime(r.created_at)}
                          </span>
                        )}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            weight={s <= r.rating ? "fill" : "regular"}
                            color={
                              s <= r.rating
                                ? "var(--amber)"
                                : "var(--border-mid)"
                            }
                          />
                        ))}
                        {currentUser?.id === r.user_id && (
                          <button
                            type="button"
                            aria-label="Удалить отзыв"
                            onClick={() => handleReviewDelete(r.id)}
                            style={{
                              width: 26,
                              height: 26,
                              marginLeft: 6,
                              borderRadius: 8,
                              border: "1px solid var(--border)",
                              background: "var(--bg-surface)",
                              color: "var(--danger, #ef4444)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Trash size={13} weight="bold" />
                          </button>
                        )}
                      </span>
                    </div>
                    <p
                      style={{
                        color: "var(--text-2)",
                        margin: 0,
                        fontSize: "0.875rem",
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
      )}
    </div>
  );
};

export default RestaurantPage;
