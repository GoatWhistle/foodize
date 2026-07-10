import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { CATEGORY_RU } from '@shared/utils/locales';
import type { Restaurant } from '@shared/types/models';
import {
  Star,
  Briefcase,
  ForkKnife,
  List,
  Heart,
  ShareNetwork,
  Info,
} from '@phosphor-icons/react';
import { useOrderStore } from '../../store/useOrderStore';
import MenuItemCard from '@shared/components/MenuItemCard/MenuItemCard';
import ProductSheet from '@shared/components/ProductSheet/ProductSheet';
import ShareModal from '../../components/ShareModal/ShareModal';
import { staffService } from '@shared/services/staffService';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '@shared/store/useModalStore';
import { useFavoriteStore } from '@shared/store/useFavoriteStore';
import { useShallow } from 'zustand/react/shallow';
import { useRestaurantPage } from '@shared/hooks/useRestaurantPage';
import StaffModal from './components/StaffModal';
import ReviewsModal from '@shared/components/ReviewsModal/ReviewsModal';
import InfoModal from '@shared/components/InfoModal/InfoModal';
import { getCategoryIcon } from '@shared/utils/categoryIcons';
import { pluralizeRu } from '@shared/utils/pluralize';

const RestaurantPage = () => {
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
  } = useRestaurantPage({ id: id ?? '', initialRestaurant: locationState?.restaurant ?? null });

  const { addToCart } = useOrderStore(
    useShallow((s) => ({ addToCart: s.addToCart }))
  );
  const currentUser = useAuthStore((s) => s.user);
  const requestConfirm = useModalStore((s) => s.requestConfirm);
  const { favoriteIds, toggle: toggleFavorite } = useFavoriteStore(
    useShallow((s) => ({ favoriteIds: s.favoriteIds, toggle: s.toggle }))
  );

  const restaurantView = restaurant as Partial<Restaurant> & {
    id: string;
    name: string;
    address: string;
  };

  const isFav = restaurantUUID ? favoriteIds.includes(restaurantUUID) : false;
  const myReview = reviewsList.find((r) => r.user_id === currentUser?.id) ?? null;
  const otherReviews = reviewsList.filter((r) => r.user_id !== currentUser?.id);
  const canReview = currentUser?.permissions?.includes('reviews.create');

  const handleDeleteWithConfirm = (reviewId: string) => {
    requestConfirm({
      title: 'Удалить отзыв?',
      message: 'Точно ли вы хотите удалить этот отзыв?',
      confirmLabel: 'Удалить',
      danger: true,
      onConfirm: () => handleReviewDelete(reviewId),
    });
  };

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
      setStaffError('Ошибка при отправке заявки');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleReviewSubmitAdapter = (
    payload: FormEvent<HTMLFormElement> | { myReview: unknown; onSuccess: () => void },
  ) => {
    if ('myReview' in payload) {
      void handleReviewSubmit({
        myReview: Boolean(payload.myReview),
        onSuccess: payload.onSuccess,
      });
    } else {
      payload.preventDefault();
      void handleReviewSubmit();
    }
  };

  const handleProductAdd = ({
    item,
    selectedOptions,
    quantity,
  }: {
    item: Parameters<typeof addToCart>[0];
    selectedOptions: Parameters<typeof addToCart>[2];
    quantity: number;
  }) => {
    if (!restaurantUUID) return;
    void addToCart(item, restaurantUUID, selectedOptions, quantity);
    setSelectedProduct(null);
  };

  const reviewsButtonLabel = (() => {
    const parts = [];
    if (rating != null) parts.push(`${Number(rating).toFixed(1)}`);
    if (reviewCount != null)
      parts.push(`${reviewCount} ${pluralizeRu(reviewCount, ['отзыв', 'отзыва', 'отзывов'])}`);
    else parts.push('Отзывы');
    return parts.join(' · ');
  })();

  return (
    <div className="page-enter" style={{ minHeight: '100vh' }}>
      <div className="restaurant-hero">
        {restaurantView.photo_url ? (
          <img
            className="restaurant-hero-img"
            src={restaurantView.photo_url}
            alt={restaurant.name}
            style={{ viewTransitionName: `restaurant-image-${restaurant.id}` }}
          />
        ) : (
          <div className="restaurant-hero-placeholder">
            <ForkKnife size={48} color="var(--on-photo-mute)" />
          </div>
        )}
        <div className="restaurant-hero-overlay" />
        <div className="restaurant-hero-info">
          <h1 className="restaurant-hero-name">{restaurant.name}</h1>
          {restaurantView.description && (
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem', margin: '4px 0 8px', lineHeight: 1.4 }}>
              {restaurantView.description}
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
                onClick={() => {
                  if (restaurantUUID) void toggleFavorite(restaurantUUID);
                }}
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
        {restaurantView.is_open === false && (
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
              {cat === 'ALL' ? <List size={14} /> : getCategoryIcon(cat, { size: 16 })}
              {cat === 'ALL' ? 'Все' : (CATEGORY_RU as Record<string, string>)[cat] || cat}
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
          onClose={() => setShowReviewsModal(false)}
          onSubmit={handleReviewSubmitAdapter}
          onDeleteWithConfirm={handleDeleteWithConfirm}
          editableForm
          splitOwnReviews
          showPagination
          showRatingInHeader
          successText="Отзыв успешно сохранён"
        />
      )}

      {showShareModal && (
        <ShareModal restaurant={restaurant as Restaurant} onClose={() => setShowShareModal(false)} />
      )}

      {showInfoModal && (
        <InfoModal
          workingHours={workingHours.map((wh) => ({
            day_of_week: wh.day_of_week,
            is_open: !wh.is_closed,
            opening_time: wh.open_time,
            closing_time: wh.close_time,
          }))}
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </div>
  );
};

export default RestaurantPage;
