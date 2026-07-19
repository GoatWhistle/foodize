import { StarIcon, ForkKnifeIcon, HeartIcon, ShareNetworkIcon, InfoIcon } from '@phosphor-icons/react';
import type { Restaurant } from '@shared/types/models';

interface RestaurantHeroProps {
  restaurant: Restaurant;
  restaurantView: Partial<Restaurant> & { id: string; name: string; address: string };
  reviewsButtonLabel: string;
  showFavorite: boolean;
  isFav: boolean;
  onOpenReviews: () => void;
  onOpenInfo: () => void;
  onOpenShare: () => void;
  onToggleFavorite: () => void;
}

export function RestaurantHero({
  restaurant,
  restaurantView,
  reviewsButtonLabel,
  showFavorite,
  isFav,
  onOpenReviews,
  onOpenInfo,
  onOpenShare,
  onToggleFavorite,
}: RestaurantHeroProps) {
  return (
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
          <ForkKnifeIcon size={48} color="var(--on-photo-mute)" />
        </div>
      )}
      <div className="restaurant-hero-overlay" />
      <div className="restaurant-hero-info">
        <h1 className="restaurant-hero-name">{restaurant.name}</h1>
        {restaurantView.description && (
          <p style={{ color: 'var(--on-photo)', fontSize: "var(--text-base)", margin: '4px 0 8px', lineHeight: 1.4 }}>
            {restaurantView.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenReviews}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--on-photo-fill)', backdropFilter: 'blur(8px)', border: '1px solid var(--on-photo-line)', color: 'var(--on-photo)' }}
          >
            <StarIcon size={14} weight="fill" color="var(--color-warning)" />
            {reviewsButtonLabel}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenInfo}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--on-photo-fill)', backdropFilter: 'blur(8px)', border: '1px solid var(--on-photo-line)', color: 'var(--on-photo)' }}
          >
            <InfoIcon size={14} weight="bold" />
            Инфо
          </button>
          <button
            onClick={onOpenShare}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'var(--on-photo-fill)', backdropFilter: 'blur(8px)', border: '1px solid var(--on-photo-line)', color: 'var(--on-photo)', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
            aria-label="Поделиться рестораном"
          >
            <ShareNetworkIcon size={16} weight="bold" />
          </button>
          {showFavorite && (
            <button
              onClick={onToggleFavorite}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: isFav ? 'var(--color-error-bg)' : 'var(--on-photo-fill)', backdropFilter: 'blur(8px)', border: isFav ? '1px solid var(--error)' : '1px solid var(--on-photo-line)', color: isFav ? 'var(--error)' : 'var(--on-photo)', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
              aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
              aria-pressed={isFav}
            >
              <HeartIcon size={16} weight={isFav ? 'fill' : 'regular'} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
