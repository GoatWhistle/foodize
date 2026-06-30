import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { CATEGORY_RU } from '../../utils/locales';
import {
  Star,
  Briefcase,
  ForkKnife,
  Pizza,
  Hamburger,
  BowlFood,
  List,
  Fire,
  Leaf,
  Cookie,
  Coffee,
  DotsThree,
  Heart,
  ShareNetwork,
  Info,
} from '@phosphor-icons/react';
import { useOrderStore } from '../../store/useOrderStore';
import MenuItemCard from '@shared/components/MenuItemCard/MenuItemCard';
import ProductSheet from '@shared/components/ProductSheet/ProductSheet.jsx';
import ShareModal from '../../components/ui/ShareModal';
import { staffService } from '../../services/staffService';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '../../store/useModalStore';
import { useFavoriteStore } from '../../store/useFavoriteStore';
import { useShallow } from 'zustand/react/shallow';
import { useRestaurantPage } from '@shared/hooks/useRestaurantPage.js';
import StaffModal from './components/StaffModal';
import ReviewsModal from './components/ReviewsModal';
import InfoModal from './components/InfoModal';

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
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffMessage, setStaffMessage] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  const {
    restaurant,
    restaurantUUID,
    rating,
    reviewCount,
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
    handleReviewDelete,
  } = useRestaurantPage({ id, initialRestaurant: location.state?.restaurant ?? null });

  const { addToCart } = useOrderStore(
    useShallow((s) => ({ addToCart: s.addToCart }))
  );
  const currentUser = useAuthStore((s) => s.user);
  const requestConfirm = useModalStore((s) => s.requestConfirm);
  const { favoriteIds, toggle: toggleFavorite } = useFavoriteStore(
    useShallow((s) => ({ favoriteIds: s.favoriteIds, toggle: s.toggle }))
  );

  const isFav = restaurantUUID ? favoriteIds.includes(restaurantUUID) : false;
  const myReview = reviewsList.find((r) => r.user_id === currentUser?.id) ?? null;
  const otherReviews = reviewsList.filter((r) => r.user_id !== currentUser?.id);
  const canReview = currentUser?.permissions?.includes('reviews.create');

  const handleDeleteWithConfirm = (reviewId) => {
    requestConfirm({
      title: 'Удалить отзыв?',
      message: 'Точно ли вы хотите удалить этот отзыв?',
      confirmLabel: 'Удалить',
      danger: true,
      onConfirm: () => handleReviewDelete(reviewId),
    });
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffError('');
    setStaffLoading(true);
    try {
      await staffService.createRequest(restaurantUUID, { message: staffMessage });
      setShowStaffModal(false);
      setStaffMessage('');
    } catch {
      setStaffError('Ошибка при отправке заявки');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleProductAdd = ({ item, selectedOptions, quantity }) => {
    addToCart(item, restaurantUUID, selectedOptions, quantity);
    setSelectedProduct(null);
  };

  const reviewsButtonLabel = (() => {
    const parts = [];
    if (rating != null) parts.push(`${Number(rating).toFixed(1)}`);
    if (reviewCount != null)
      parts.push(`${reviewCount} отзыв${reviewCount === 1 ? '' : reviewCount < 5 ? 'а' : 'ов'}`);
    else parts.push('Отзывы');
    return parts.join(' · ');
  })();

  return (
    <div className="page-enter" style={{ minHeight: '100vh' }}>
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
          {restaurant.description && (
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem', margin: '4px 0 8px', lineHeight: 1.4 }}>
              {restaurant.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setShowReviewsModal(true); setReviewFormOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
            >
              <Star size={14} weight="fill" color="#fbbf24" />
              {reviewsButtonLabel}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowInfoModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
            >
              <Info size={14} weight="bold" />
              Инфо
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
              aria-label="Поделиться рестораном"
            >
              <ShareNetwork size={16} weight="bold" />
            </button>
            {currentUser && (
              <button
                onClick={() => toggleFavorite(restaurantUUID)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: isFav ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: isFav ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.2)', color: isFav ? 'var(--error)' : '#fff', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
                aria-pressed={isFav}
              >
                <Heart size={16} weight={isFav ? 'fill' : 'regular'} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="restaurant-content">
        {restaurant.is_open === false && (
          <div
            style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: 'var(--r-md)', color: 'var(--error)', fontSize: '0.85rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            Заведение временно закрыто и не принимает заказы
          </div>
        )}
        <div className="menu-categories-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {cat === 'ALL' ? <List size={14} /> : CATEGORY_ICONS[cat]}
              {cat === 'ALL' ? 'Все' : CATEGORY_RU[cat] || cat}
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

        {restaurant.is_hiring && (
          <button className="hiring-hint" onClick={() => setShowStaffModal(true)}>
            <Briefcase size={14} weight="bold" />
            Заведение ищет сотрудников — откликнуться
          </button>
        )}
      </div>

      {selectedProduct && (
        <ProductSheet
          item={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleProductAdd}
          isRestaurantOpen={isRestaurantOpen}
        />
      )}

      {showStaffModal && (
        <StaffModal
          restaurantName={restaurant.name}
          message={staffMessage}
          setMessage={setStaffMessage}
          onClose={() => setShowStaffModal(false)}
          onSubmit={handleStaffSubmit}
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
          onClose={() => setShowReviewsModal(false)}
          onSubmit={handleReviewSubmit}
          onDeleteWithConfirm={handleDeleteWithConfirm}
        />
      )}

      {showShareModal && (
        <ShareModal restaurant={restaurant} onClose={() => setShowShareModal(false)} />
      )}

      {showInfoModal && (
        <InfoModal workingHours={workingHours} onClose={() => setShowInfoModal(false)} />
      )}
    </div>
  );
};

export default RestaurantPage;
