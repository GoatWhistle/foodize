import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCartIcon } from "@phosphor-icons/react";
import { useCartStore } from "../../store/useCartStore";
import { useFavoriteStore } from "@shared/store/useFavoriteStore";
import { useModalStore } from "@shared/store/useModalStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useShallow } from "zustand/react/shallow";
import { getBackButton, hapticImpact } from "../../telegram/sdk";
import { ProductSheet } from "@shared/components/ProductSheet/ProductSheet";
import { CartDrawer } from "@shared/components/CartDrawer/CartDrawer";
import { useRestaurantPageController } from "@shared/hooks/useRestaurantPageController";
import { ReviewsModal } from "@shared/components/ReviewsModal/ReviewsModal";
import { InfoModal } from "@shared/components/InfoModal/InfoModal";
import { RestaurantHero } from "./RestaurantHero";
import { MenuSection } from "./MenuSection";
import type { CartLineOption } from "@shared/store/createCartStore";
import type { Restaurant } from "@shared/types/models";
import { formatPrice } from "@shared/utils/price";
import { useTranslation } from "@shared/i18n/useTranslation";

const Portal = ({ children }: { children: ReactNode }) =>
  typeof document === "undefined"
    ? null
    : createPortal(children, document.body);

export const RestaurantPage = () => {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCart, setShowCart] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

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

  const {
    restaurantView,
    rating,
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
    isFav,
    myReview,
    otherReviews,
    infoWorkingHours,
    handleProductAdd,
    handleToggleFavorite,
    handleReviewSubmitForm,
    handleDeleteWithConfirm,
  } = useRestaurantPageController<CartLineOption>({
    id,
    initialRestaurant:
      (location.state as { restaurant?: Restaurant } | null)?.restaurant ??
      null,
    currentUserId: currentUser?.id,
    addToCart,
    toggleFavorite: toggle,
    favoriteIds,
    requestConfirm,
  });

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

  return (
    <div style={{ minHeight: "100vh", paddingBottom: count > 0 ? 80 : 20 }}>
      <RestaurantHero
        restaurant={restaurantView}
        rating={rating}
        isFav={isFav}
        onToggleFav={handleToggleFavorite}
        onShowReviews={() => { setShowReviews(true); }}
        onShowInfo={() => { setShowInfo(true); }}
      />

      <MenuSection
        isRestaurantOpen={isRestaurantOpen}
        loading={loading}
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        filteredMenuItems={filteredMenuItems}
        onSelectProduct={setSelectedProduct}
      />

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
              {t("order.cart.itemsCount", { count })}
            </span>
            <span className="cart-fab-total">{formatPrice(total)}</span>
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
