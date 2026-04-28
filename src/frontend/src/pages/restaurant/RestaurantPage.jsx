import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { translateApiError } from "../../utils/translateApiError";
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
import { restaurantService } from "../../services/restaurantService";

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
  const [restaurantData, setRestaurantData] = useState(
    location.state?.restaurant ?? null,
  );
  const [rating, setRating] = useState(null);
  const restaurant = restaurantData ?? { id, name: "Ресторан", address: "" };

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
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [customizeError, setCustomizeError] = useState("");

  const menuItems = menus[id] || [];

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
  }, [id, fetchMenu]);

  const loadReviews = () => {
    setReviewsLoading(true);
    reviewService
      .getReviews(id)
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
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
      setReviewError(translateApiError(err, "Не удалось отправить отзыв"));
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

  const availableMenuItems = menuItems.filter((i) => i.is_available !== false);
  const categories = [
    "ALL",
    ...new Set(availableMenuItems.map((i) => i.category).filter(Boolean)),
  ];
  const filtered =
    activeCategory === "ALL"
      ? availableMenuItems
      : availableMenuItems.filter((i) => i.category === activeCategory);

  const getActiveOptionGroups = (item) =>
    (item?.option_groups || [])
      .filter((group) => group.is_active !== false)
      .map((group) => ({
        ...group,
        options: (group.options || []).filter(
          (option) => option.is_available !== false,
        ),
      }))
      .filter((group) => group.options.length > 0);

  const getSelectedOptions = (item, ids) => {
    const idsSet = new Set(ids);
    return getActiveOptionGroups(item)
      .flatMap((group) => group.options)
      .filter((option) => idsSet.has(option.id));
  };

  const getCustomizedPrice = (item, ids) =>
    (Number(item?.price) || 0) +
    getSelectedOptions(item, ids).reduce(
      (sum, option) => sum + (Number(option.price_delta) || 0),
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
      groups.flatMap((group) =>
        group.is_required && group.selection_type === "single"
          ? [group.options[0].id]
          : [],
      ),
    );
    setCustomizeError("");
  };

  const toggleOption = (group, option) => {
    setCustomizeError("");
    setSelectedOptionIds((current) => {
      const groupOptionIds = group.options.map((item) => item.id);
      const hasOption = current.includes(option.id);

      if (group.selection_type === "single") {
        return [
          ...current.filter((id) => !groupOptionIds.includes(id)),
          option.id,
        ];
      }

      if (hasOption) {
        return current.filter((id) => id !== option.id);
      }

      if (group.max_selected) {
        const selectedInGroup = current.filter((id) =>
          groupOptionIds.includes(id),
        );
        if (selectedInGroup.length >= group.max_selected) return current;
      }

      return [...current, option.id];
    });
  };

  const handleConfirmCustomization = () => {
    const groups = getActiveOptionGroups(customizingItem);
    for (const group of groups) {
      const groupOptionIds = group.options.map((option) => option.id);
      const selectedCount = selectedOptionIds.filter((optionId) =>
        groupOptionIds.includes(optionId),
      ).length;
      if (selectedCount < group.min_selected) {
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
          {rating != null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 8,
              }}
            >
              <Star size={14} weight="fill" color="#fbbf24" />
              <span
                style={{
                  fontWeight: 700,
                  color: "#fff",
                  fontSize: "0.875rem",
                  lineHeight: 1,
                }}
              >
                {Number(rating).toFixed(1)}
              </span>
            </div>
          )}
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
                onAdd={handleAddMenuItem}
              />
            ))}
          </div>
        )}

        {restaurant.is_hiring && (
          <button
            className="hiring-hint"
            onClick={() => setShowStaffModal(true)}
          >
            <Briefcase size={14} weight="bold" />
            Заведение ищет сотрудников — откликнуться
          </button>
        )}
      </div>

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

      {customizingItem && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div
            className="modal-content"
            style={{ maxWidth: "460px", padding: "28px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                marginBottom: 18,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
                  {customizingItem.name}
                </h3>
                <div style={{ color: "var(--text-3)", fontSize: "0.82rem" }}>
                  Настройте блюдо под себя
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setCustomizingItem(null)}
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {getActiveOptionGroups(customizingItem).map((group) => {
                const groupOptionIds = group.options.map((option) => option.id);
                const selectedCount = selectedOptionIds.filter((optionId) =>
                  groupOptionIds.includes(optionId),
                ).length;

                return (
                  <div key={group.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>
                        {group.name}
                      </div>
                      <div
                        style={{
                          color: "var(--text-3)",
                          fontSize: "0.72rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {group.is_required ? "Обязательно" : "По желанию"}
                        {group.max_selected
                          ? ` • до ${group.max_selected}`
                          : ""}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
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
                              gap: 12,
                              padding: "10px 12px",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-md)",
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
                                gap: 10,
                                minWidth: 0,
                              }}
                            >
                              <input
                                type={
                                  group.selection_type === "single"
                                    ? "radio"
                                    : "checkbox"
                                }
                                name={`option-group-${group.id}`}
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleOption(group, option)}
                              />
                              <span style={{ fontSize: "0.86rem" }}>
                                {option.name}
                              </span>
                            </span>
                            {option.price_delta > 0 && (
                              <span
                                style={{
                                  color: "var(--fire)",
                                  fontWeight: 800,
                                  fontSize: "0.82rem",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                +{option.price_delta} ₽
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {customizeError && (
              <div className="form-error" style={{ marginTop: 14 }}>
                {customizeError}
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={handleConfirmCustomization}
              style={{ marginTop: 18 }}
            >
              Добавить за{" "}
              {getCustomizedPrice(customizingItem, selectedOptionIds)} ₽
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantPage;
