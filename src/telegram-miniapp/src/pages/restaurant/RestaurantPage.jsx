import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  Star,
  ShoppingCart,
  ChatCircle,
  Pizza,
  Hamburger,
  BowlFood,
  Leaf,
  Cookie,
  Coffee,
  DotsThree,
  List,
  Fire,
  MapPin,
} from "@phosphor-icons/react";
import { useOrderStore } from "../../store/useOrderStore";
import { useFavoriteStore } from "../../store/useFavoriteStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useShallow } from "zustand/react/shallow";
import { getBackButton } from "../../telegram/sdk";
import MenuItemCard from "@shared/components/MenuItemCard/MenuItemCard";
import ProductSheet from "@shared/components/ProductSheet/ProductSheet.jsx";
import CartDrawer from "@shared/components/CartDrawer/CartDrawer.jsx";
import { useRestaurantPage } from "@shared/hooks/useRestaurantPage.js";
import ReviewsModal from "./ReviewsModal.jsx";
import InfoModal from "./InfoModal.jsx";
import DeleteConfirmModal from "./DeleteConfirmModal.jsx";
import s from "./RestaurantPage.module.css";

const Portal = ({ children }) =>
  typeof document === "undefined"
    ? null
    : createPortal(children, document.body);

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

const RestaurantPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCart, setShowCart] = useState(false);
  const [reviewDeleteId, setReviewDeleteId] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const {
    restaurant,
    restaurantUUID,
    rating,
    workingHours,
    loading,
    isRestaurantOpen,
    categories,
    activeCategory,
    setActiveCategory,
    filteredMenuItems,
    reviewsList,
    reviewForm,
    setReviewForm,
    reviewsLoading,
    reviewError,
    reviewSuccess,
    selectedProduct,
    setSelectedProduct,
    handleReviewSubmit,
    handleReviewDelete: deleteReview,
  } = useRestaurantPage({ id, initialRestaurant: location.state?.restaurant ?? null });

  const { addToCart, cartCount, cartTotal } = useOrderStore(
    useShallow((s) => ({
      addToCart: s.addToCart,
      cartCount: s.cartCount,
      cartTotal: s.cartTotal,
    })),
  );
  const { favoriteIds, toggle } = useFavoriteStore(
    useShallow((s) => ({
      favoriteIds: s.favoriteIds,
      toggle: s.toggle,
    })),
  );
  const currentUser = useAuthStore((s) => s.user);

  const isFav = favoriteIds.includes(restaurantUUID || id);
  const count = cartCount ? cartCount() : 0;
  const total = cartTotal ? cartTotal() : 0;

  const haptic = (type = "light") => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);
    } catch {}
  };

  useEffect(() => {
    const btn = getBackButton();
    if (btn) {
      btn.show();
      const handler = () => navigate("/");
      btn.onClick(handler);
      return () => {
        btn.offClick(handler);
        btn.hide();
      };
    }
  }, [navigate]);

  const handleProductAdd = ({ item, selectedOptions, quantity }) => {
    if (!isRestaurantOpen) return;
    addToCart(item, restaurantUUID || id, selectedOptions, quantity);
    setSelectedProduct(null);
  };

  const handleReviewSubmitForm = (e) => {
    e.preventDefault();
    const myReview = reviewsList.find((r) => r.user_id === currentUser?.id) ?? null;
    handleReviewSubmit({ myReview });
  };

  const confirmReviewDelete = async () => {
    if (!reviewDeleteId) return;
    await deleteReview(reviewDeleteId);
    setReviewDeleteId(null);
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: count > 0 ? 80 : 20 }}>
      <div className={s.hero}>
        {restaurant.photo_url ? (
          <img
            className={s.heroImg}
            src={restaurant.photo_url}
            alt={restaurant.name}
          />
        ) : (
          <div className={s.heroPlaceholder}>🍽️</div>
        )}
        <div className={s.heroOverlay} />
        <div className={s.heroInfo}>
          <div className={s.heroName}>{restaurant.name}</div>
          {restaurant.address && (
            <div
              style={{
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.75)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <MapPin size={12} weight="bold" />
              {restaurant.address}
            </div>
          )}
          <div className={s.heroPills}>
            {rating != null && (
              <span className={`${s.pill} ${s.pillRating}`}>
                <Star size={13} weight="fill" />
                {Number(rating).toFixed(1)}
              </span>
            )}
            <button
              className={s.pill}
              onClick={() => {
                haptic("light");
                setShowReviews(true);
              }}
            >
              <ChatCircle size={13} weight="bold" />
              Отзывы
            </button>
            <button
              className={s.pill}
              onClick={() => {
                haptic("light");
                setShowInfo(true);
              }}
            >
              Инфо
            </button>
          </div>
        </div>
        <button
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: isFav ? "rgba(var(--danger-rgb, 239,68,68),0.18)" : "rgba(0,0,0,0.4)",
            border: isFav
              ? "1px solid rgba(var(--danger-rgb, 239,68,68),0.4)"
              : "1px solid rgba(255,255,255,0.15)",
            borderRadius: "var(--r-xs)",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={() => toggle(restaurantUUID)}
          aria-label={isFav ? "Убрать из избранного" : "В избранное"}
        >
          <Heart
            size={16}
            weight={isFav ? "fill" : "regular"}
            color={isFav ? "var(--danger, #ef4444)" : "rgba(255,255,255,0.8)"}
          />
        </button>
      </div>

      <div className={s.content}>
        {!isRestaurantOpen && (
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(var(--danger-rgb, 239,68,68),0.1)",
              border: "1px solid rgba(var(--danger-rgb, 239,68,68),0.35)",
              borderRadius: "var(--r-md)",
              color: "var(--danger, #ef4444)",
              fontSize: "0.84rem",
              fontWeight: 800,
              marginBottom: 14,
            }}
          >
            Заведение сейчас закрыто и не принимает заказы
          </div>
        )}
        <div className={s.categoriesScroll}>
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
          <div className={s.menuList}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="skeleton-wrap"
                style={{ pointerEvents: "none", display: "flex", background: "var(--bg-card)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", overflow: "hidden" }}
              >
                <div className="skeleton" style={{ width: 100, minHeight: 90, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="skeleton" style={{ width: "65%", height: 14 }} />
                  <div className="skeleton" style={{ width: "85%", height: 11 }} />
                  <div className="skeleton" style={{ width: "35%", height: 14, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={s.menuList}>
            {filteredMenuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onSelect={setSelectedProduct}
                isRestaurantOpen={isRestaurantOpen}
                showOptionHint
                onHaptic={() => {
                  try { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged?.(); } catch {}
                }}
              />
            ))}
          </div>
        )}
      </div>

      {count > 0 && !showCart && (
        <Portal>
          <button
            className="cart-fab"
            onClick={() => {
              haptic("medium");
              setShowCart(true);
            }}
          >
            <ShoppingCart size={18} weight="bold" />
            <span className="cart-fab-label">
              {count} {count === 1 ? "товар" : count < 5 ? "товара" : "товаров"}
            </span>
            <span className="cart-fab-total">{total} ₽</span>
          </button>
        </Portal>
      )}

      {showCart && (
        <Portal>
          <CartDrawer
            onClose={() => setShowCart(false)}
            isRestaurantOpen={isRestaurantOpen}
          />
        </Portal>
      )}

      {selectedProduct && (
        <ProductSheet
          item={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleProductAdd}
          isRestaurantOpen={isRestaurantOpen}
        />
      )}

      {reviewDeleteId && (
        <Portal>
          <DeleteConfirmModal
            onConfirm={confirmReviewDelete}
            onCancel={() => setReviewDeleteId(null)}
          />
        </Portal>
      )}

      {showReviews && (
        <ReviewsModal
          reviewsList={reviewsList}
          reviewsLoading={reviewsLoading}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          reviewError={reviewError}
          reviewSuccess={reviewSuccess}
          currentUser={currentUser}
          onClose={() => setShowReviews(false)}
          onSubmit={handleReviewSubmitForm}
          onDelete={setReviewDeleteId}
        />
      )}

      {showInfo && (
        <InfoModal
          restaurant={restaurant}
          workingHours={workingHours}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  );
};

export default RestaurantPage;
