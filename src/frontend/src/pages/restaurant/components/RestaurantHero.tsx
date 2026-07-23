import { StarIcon, HeartIcon, ShareNetworkIcon, InfoIcon } from '@phosphor-icons/react';
import { RestaurantHeroShell } from '@shared/components/RestaurantHero/RestaurantHeroShell';
import { useTranslation } from '@shared/i18n/useTranslation';
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
  const { t } = useTranslation();
  return (
    <RestaurantHeroShell
      name={restaurant.name}
      photoUrl={restaurantView.photo_url}
      viewTransitionName={`restaurant-image-${restaurant.id}`}
    >
      {restaurantView.description && (
        <p style={{ color: 'var(--on-photo)', fontSize: "var(--text-base)", margin: '4px 0 8px', lineHeight: 1.4 }}>
          {restaurantView.description}
        </p>
      )}
      <div className="restaurant-hero-actions">
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
          {t('catalog.restaurantPage.info')}
        </button>
        <button
          className="hero-icon-btn"
          onClick={onOpenShare}
          aria-label={t('catalog.restaurantPage.share')}
        >
          <ShareNetworkIcon size={16} weight="bold" />
        </button>
        {showFavorite && (
          <button
            className={`hero-icon-btn${isFav ? ' active' : ''}`}
            onClick={onToggleFavorite}
            aria-label={isFav ? t('catalog.restaurantCard.removeFromFavorites') : t('catalog.restaurantCard.addToFavorites')}
            aria-pressed={isFav}
          >
            <HeartIcon size={16} weight={isFav ? 'fill' : 'regular'} />
          </button>
        )}
      </div>
    </RestaurantHeroShell>
  );
}
