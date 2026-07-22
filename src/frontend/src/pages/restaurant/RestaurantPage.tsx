import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { categoryLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Restaurant } from '@shared/types/models';
import { BriefcaseIcon, ListIcon } from '@phosphor-icons/react';
import { useCartStore } from '../../store/useCartStore';
import { MenuItemCard } from '@shared/components/MenuItemCard/MenuItemCard';
import { ProductSheet } from '@shared/components/ProductSheet/ProductSheet';
import { ShareModal } from '../../components/ShareModal/ShareModal';
import { staffService } from '@shared/services/staffService';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '@shared/store/useModalStore';
import { useFavoriteStore } from '@shared/store/useFavoriteStore';
import { useShallow } from 'zustand/react/shallow';
import { useRestaurantPageController } from '@shared/hooks/useRestaurantPageController';
import { StaffModal } from './components/StaffModal';
import { ReviewsModal } from '@shared/components/ReviewsModal/ReviewsModal';
import { InfoModal } from '@shared/components/InfoModal/InfoModal';
import { getCategoryIcon } from '@shared/utils/categoryIcons';
import { toInfoWorkingHours } from '@shared/utils/restaurant';
import { RestaurantHero } from './components/RestaurantHero';
import type { CartLineOption } from '@shared/store/createCartStore';

export const RestaurantPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const locationState = location.state as { restaurant?: Restaurant } | null;
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffMessage, setStaffMessage] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  const { addToCart } = useCartStore(
    useShallow((s) => ({ addToCart: s.addToCart }))
  );
  const currentUser = useAuthStore((s) => s.user);
  const requestConfirm = useModalStore((s) => s.requestConfirm);
  const { favoriteIds, toggle: toggleFavorite } = useFavoriteStore(
    useShallow((s) => ({ favoriteIds: s.favoriteIds, toggle: s.toggle }))
  );

  const {
    restaurant,
    restaurantView,
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
    isFav,
    myReview,
    otherReviews,
    reviewsButtonLabel,
    handleProductAdd,
    handleToggleFavorite,
    handleDeleteWithConfirm,
    handleReviewSubmitForm,
  } = useRestaurantPageController<CartLineOption>({
    id: id ?? '',
    initialRestaurant: locationState?.restaurant ?? null,
    currentUserId: currentUser?.id,
    addToCart,
    toggleFavorite,
    favoriteIds,
    requestConfirm,
  });

  const canReview = currentUser?.permissions.includes('reviews.create') ?? false;

  const handleStaffSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!restaurantUUID) return;
    setStaffError('');
    setStaffLoading(true);
    try {
      await staffService.createRequest(restaurantUUID, { message: staffMessage });
      setShowStaffModal(false);
      setStaffMessage('');
    } catch {
      setStaffError(t('catalog.staffModal.failed'));
    } finally {
      setStaffLoading(false);
    }
  };

  return (
    <div className="page-enter" style={{ minHeight: '100vh' }}>
      <RestaurantHero
        restaurant={restaurant as Restaurant}
        restaurantView={restaurantView}
        reviewsButtonLabel={reviewsButtonLabel}
        showFavorite={Boolean(currentUser)}
        isFav={isFav}
        onOpenReviews={() => { setShowReviewsModal(true); setReviewFormOpen(false); }}
        onOpenInfo={() => { setShowInfoModal(true); }}
        onOpenShare={() => { setShowShareModal(true); }}
        onToggleFavorite={handleToggleFavorite}
      />

      <div className="restaurant-content">
        {!restaurantView.is_open && (
          <div
            style={{ padding: '12px 16px', background: 'var(--color-error-bg)', border: '1px solid var(--error)', borderRadius: 'var(--r-md)', color: 'var(--error)', fontSize: "var(--text-base)", fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {t('catalog.restaurantPage.closedBannerWeb')}
          </div>
        )}
        <div className="menu-categories-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip${activeCategory === cat ? ' active' : ''}`}
              onClick={() => { setActiveCategory(cat); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {cat === 'ALL' ? <ListIcon size={14} /> : getCategoryIcon(cat, { size: 16 })}
              {cat === 'ALL' ? t('catalog.restaurantPage.allCategories') : categoryLabel(cat)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="menu-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="menu-item-skeleton" style={{ pointerEvents: 'none', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ width: '100%', aspectRatio: '3/2' }} />
                <div style={{ padding: '8px 9px 36px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton" style={{ width: '65%', height: 12 }} />
                  <div className="skeleton" style={{ width: '85%', height: 10 }} />
                  <div className="skeleton" style={{ width: '35%', height: 12, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="menu-list">
            {filteredMenuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onSelect={setSelectedProduct}
                isRestaurantOpen={isRestaurantOpen}
              />
            ))}
          </div>
        )}

        {restaurantView.is_hiring && (
          <button className="hiring-hint" onClick={() => { setShowStaffModal(true); }}>
            <BriefcaseIcon size={14} weight="bold" />
            {t('catalog.restaurantPage.hiringHint')}
          </button>
        )}
      </div>

      {selectedProduct && (
        <ProductSheet
          item={selectedProduct}
          onClose={() => { setSelectedProduct(null); }}
          onAdd={handleProductAdd}
          isRestaurantOpen={isRestaurantOpen}
        />
      )}

      {showStaffModal && (
        <StaffModal
          restaurantName={restaurant.name}
          message={staffMessage}
          setMessage={setStaffMessage}
          onClose={() => { setShowStaffModal(false); }}
          onSubmit={(e) => {
            void handleStaffSubmit(e);
          }}
          loading={staffLoading}
          error={staffError}
        />
      )}

      {showReviewsModal && (
        <ReviewsModal
          rating={rating}
          reviewsList={reviewsList}
          reviewsPage={reviewsPage}
          setReviewsPage={setReviewsPage}
          reviewsTotal={reviewsTotal}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          reviewsLoading={reviewsLoading}
          reviewError={reviewError}
          reviewSuccess={reviewSuccess}
          reviewFormOpen={reviewFormOpen}
          setReviewFormOpen={setReviewFormOpen}
          myReview={myReview}
          otherReviews={otherReviews}
          canReview={canReview}
          currentUser={currentUser}
          onClose={() => { setShowReviewsModal(false); }}
          onSubmit={handleReviewSubmitForm}
          onDeleteWithConfirm={handleDeleteWithConfirm}
          editableForm
          splitOwnReviews
          showPagination
          showRatingInHeader
          successText={t('catalog.reviews.saved')}
        />
      )}

      {showShareModal && (
        <ShareModal restaurant={restaurant as Restaurant} onClose={() => { setShowShareModal(false); }} />
      )}

      {showInfoModal && (
        <InfoModal
          workingHours={toInfoWorkingHours(workingHours)}
          onClose={() => { setShowInfoModal(false); }}
        />
      )}
    </div>
  );
};
