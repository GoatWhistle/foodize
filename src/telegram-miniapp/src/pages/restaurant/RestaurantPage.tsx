import { useState, useEffect } from "react";
import type { SyntheticEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  HeartIcon,
  StarIcon,
  ShoppingCartIcon,
  ChatCircleIcon,
  ListIcon,
  MapPinIcon,
  ForkKnifeIcon,
} from "@phosphor-icons/react";
import { useCartStore } from "../../store/useCartStore";
import { useFavoriteStore } from "@shared/store/useFavoriteStore";
import { useModalStore } from "@shared/store/useModalStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useShallow } from "zustand/react/shallow";
import { getBackButton, hapticSelection, hapticImpact } from "../../telegram/sdk";
import MenuItemCard from "@shared/components/MenuItemCard/MenuItemCard";
import ProductSheet from "@shared/components/ProductSheet/ProductSheet";
import CartDrawer from "@shared/components/CartDrawer/CartDrawer";
import { useRestaurantPage } from "@shared/hooks/useRestaurantPage";
import ReviewsModal from "@shared/components/ReviewsModal/ReviewsModal";
import InfoModal from "@shared/components/InfoModal/InfoModal";
import s from "./RestaurantPage.module.css";
import { getCategoryIcon } from "@shared/utils/categoryIcons";
import { pluralizeRu } from "@shared/utils/pluralize";
import type { CartLineOption } from "@shared/store/createCartStore";
import type { MenuItem, Restaurant } from "@shared/types/models";

interface ProductAddPayload {
  item: MenuItem;
  selectedOptions: CartLineOption[];
  quantity: number;
}

const Portal = ({ children }: { children: ReactNode }) =>
  typeof document === "undefined"
    ? null
    : createPortal(children, document.body);

const RestaurantPage = () => {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCart, setShowCart] = useState(false);
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
    reviewsPage,
    setReviewsPage,
    reviewsTotal,
    reviewForm,
    setReviewForm,
    reviewsLoading,
    reviewError,
    reviewSuccess,
    selectedProduct,
    setSelectedProduct,
    handleReviewSubmit,
    handleReviewDelete: deleteReview,
  } = useRestaurantPage({
    id,
    initialRestaurant:
      (location.state as { restaurant?: Restaurant } | null)?.restaurant ??
      null,
  });

  const restaurantView = restaurant as Restaurant;

  const { addToCart, count, total } = useCartStore(
    useShallow((s) => ({
      addToCart: s.addToCart,
      count: s.cartCount(),
      total: s.cartTotal(),
    })),
  );
  const { favoriteIds, toggle } = useFavoriteStore(
    useShallow((s) => ({
      favoriteIds: s.favoriteIds,
      toggle: s.toggle,
    })),
  );
  const currentUser = useAuthStore((s) => s.user);
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const isFav = favoriteIds.includes(restaurantUUID || id);

  const myReview =
    reviewsList.find((r) => r.user_id === currentUser?.id) ?? null;
  const otherReviews = reviewsList.filter(
    (r) => r.user_id !== currentUser?.id,
  );

  const infoWorkingHours = workingHours.map((wh) => ({
    day_of_week: wh.day_of_week,
    is_open: !wh.is_closed,
    opening_time: wh.open_time,
    closing_time: wh.close_time,
  }));

  useEffect(() => {
    const btn = getBackButton();
    if (btn) {
      btn.show();
      const handler = () => {
        void navigate("/");
      };
      btn.onClick(handler);
      return () => {
        btn.offClick(handler);
        btn.hide();
      };
    }
  }, [navigate]);

  const handleProductAdd = ({
    item,
    selectedOptions,
    quantity,
  }: ProductAddPayload): void => {
    if (!isRestaurantOpen) return;
    void addToCart(item, restaurantUUID || id, selectedOptions, quantity);
    setSelectedProduct(null);
  };

  const handleReviewSubmitForm = (
    payload: SyntheticEvent<HTMLFormElement> | { myReview: unknown; onSuccess: () => void },
  ): void => {
    if ("preventDefault" in payload) payload.preventDefault();
    void handleReviewSubmit({ myReview: !!myReview });
  };

  const handleDeleteWithConfirm = (reviewId: string): void => {
    requestConfirm({
      title: "Удалить отзыв?",
      message: "Точно ли вы хотите удалить этот отзыв?",
      confirmLabel: "Удалить",
      danger: true,
      onConfirm: () => deleteReview(reviewId),
    });
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: count > 0 ? 80 : 20 }}>
      <div className={s.hero}>
        {restaurantView.photo_url ? (
          <img
            className={s.heroImg}
            src={restaurantView.photo_url}
            alt={restaurantView.name}
          />
        ) : (
          <div className={s.heroPlaceholder}><ForkKnifeIcon size={48} color="var(--on-photo-mute)" /></div>
        )}
        <div className={s.heroOverlay} />
        <div className={s.heroInfo}>
          <div className={s.heroName}>{restaurantView.name}</div>
          {restaurantView.address && (
            <div
              style={{
                fontSize: "0.78rem",
                color: "var(--on-photo-dim)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <MapPinIcon size={12} weight="bold" />
              {restaurantView.address}
            </div>
          )}
          <div className={s.heroPills}>
            {rating != null && (
              <span className={`${s.pill} ${s.pillRating}`}>
                <StarIcon size={13} weight="fill" />
                {rating.toFixed(1)}
              </span>
            )}
            <button
              className={s.pill}
              onClick={() => {
                hapticImpact("light");
                setShowReviews(true);
              }}
            >
              <ChatCircleIcon size={13} weight="bold" />
              Отзывы
            </button>
            <button
              className={s.pill}
              onClick={() => {
                hapticImpact("light");
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
            background: isFav ? "var(--color-error-bg)" : "var(--overlay-scrim-soft)",
            border: isFav
              ? "1px solid var(--color-error-border)"
              : "1px solid var(--on-photo-mute)",
            borderRadius: "var(--r-xs)",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={() => {
            if (restaurantUUID) void toggle(restaurantUUID);
          }}
          aria-label={isFav ? "Убрать из избранного" : "В избранное"}
        >
          <HeartIcon
            size={16}
            weight={isFav ? "fill" : "regular"}
            color={isFav ? "var(--danger)" : "var(--on-photo-dim)"}
          />
        </button>
      </div>

      <div className={s.content}>
        {!isRestaurantOpen && (
          <div
            style={{
              padding: "12px 14px",
              background: "var(--color-error-bg)",
              border: "1px solid var(--color-error-border)",
              borderRadius: "var(--r-md)",
              color: "var(--danger)",
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
              onClick={() => { setActiveCategory(cat); }}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              {cat === "ALL" ? <ListIcon size={14} /> : getCategoryIcon(cat, { size: 14 })}
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
                onHaptic={hapticSelection}
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
              hapticImpact("medium");
              setShowCart(true);
            }}
          >
            <ShoppingCartIcon size={18} weight="bold" />
            <span className="cart-fab-label">
              {count} {pluralizeRu(count, ["товар", "товара", "товаров"])}
            </span>
            <span className="cart-fab-total">{total} ₽</span>
          </button>
        </Portal>
      )}

      {showCart && (
        <Portal>
          <CartDrawer
            onClose={() => { setShowCart(false); }}
            isRestaurantOpen={isRestaurantOpen}
          />
        </Portal>
      )}

      {selectedProduct && (
        <ProductSheet
          item={selectedProduct}
          onClose={() => { setSelectedProduct(null); }}
          onAdd={handleProductAdd}
          isRestaurantOpen={isRestaurantOpen}
        />
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
          myReview={myReview}
          otherReviews={otherReviews}
          reviewsPage={reviewsPage}
          setReviewsPage={setReviewsPage}
          reviewsTotal={reviewsTotal}
          onClose={() => { setShowReviews(false); }}
          onSubmit={handleReviewSubmitForm}
          onDeleteWithConfirm={handleDeleteWithConfirm}
          usePortal
        />
      )}

      {showInfo && (
        <InfoModal
          restaurant={restaurantView}
          workingHours={infoWorkingHours}
          onClose={() => { setShowInfo(false); }}
          usePortal
          showDescription
        />
      )}
    </div>
  );
};

export default RestaurantPage;
