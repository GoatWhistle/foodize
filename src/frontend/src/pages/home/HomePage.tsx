import { useNavigate } from 'react-router-dom';
import { StorefrontIcon } from '@phosphor-icons/react';
import { RestaurantCard } from '@shared/components/RestaurantCard/RestaurantCard';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import { Pagination } from '@shared/components/Pagination/Pagination';
import { SearchFilterBar } from '@shared/components/SearchFilterBar/SearchFilterBar';
import { useAuthStore } from '../../store/useAuthStore';
import { useFavoriteStore } from '@shared/store/useFavoriteStore';
import { useShallow } from 'zustand/react/shallow';
import { ROUTES } from '../../constants/routes';
import { useHomePageLogic } from '@shared/hooks/useHomePageLogic';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Restaurant } from '@shared/types/models';

const PAGE_SIZE = 20;
const SKELETON_CARD_COUNT = 8;
const CARD_FADE_STEP_MS = 40;

export const HomePage = () => {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  const { favoriteIds } = useFavoriteStore(
    useShallow((s) => ({ favoriteIds: s.favoriteIds }))
  );
  const navigate = useNavigate();

  const {
    search, setSearch,
    onlyOpen, setOnlyOpen,
    sort, setSort,
    direction, setDirection,
    page, setPage,
    allRestaurants,
    loading,
    publicRestaurantsTotal,
    resetFilters,
  } = useHomePageLogic({ pageSize: PAGE_SIZE, infiniteScroll: false });

  const handleCardClick = (restaurant: Restaurant) => {
    if (!isAuthenticated) {
      void navigate(ROUTES.LOGIN);
      return;
    }
    void navigate(
      ROUTES.RESTAURANT.replace(':id', restaurant.display_id ?? restaurant.id),
      {
        state: { restaurant },
        viewTransition: true,
      }
    );
  };

  return (
    <div className="home-page page-enter">
      <SearchFilterBar
        search={search}
        setSearch={setSearch}
        onlyOpen={onlyOpen}
        setOnlyOpen={setOnlyOpen}
        sort={sort}
        setSort={setSort}
        direction={direction}
        setDirection={setDirection}
        placeholder={t('catalog.search.placeholderRestaurant')}
      />

      <div className="restaurants-section">
        <div className="section-header">
          <StorefrontIcon size={20} weight="bold" color="var(--fire)" />
          <h1 className="section-title">{t('catalog.home.allVenuesTitle')}</h1>
          <span
            className="text-muted"
            style={{ fontSize: "var(--text-base)", fontWeight: 600 }}
          >
            {allRestaurants.length}
          </span>
        </div>

        {loading && allRestaurants.length === 0 ? (
          <div className="restaurants-grid" role="status" aria-busy="true" aria-label={t('catalog.home.loadingRestaurants')}>
            {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
              <div key={i} className="restaurant-card-skeleton" />
            ))}
          </div>
        ) : allRestaurants.length === 0 ? (
          <EmptyState
            title={t('catalog.home.emptyTitle')}
            subtitle={t('catalog.home.emptySubtitleWeb')}
            action={{
              label: t('common.actions.reset'),
              onClick: resetFilters,
            }}
          />
        ) : (
          <div>
            <div
              className={`restaurants-grid${loading ? ' restaurants-grid--loading' : ''}`}
            >
              {allRestaurants.map((r, i) => (
                <div
                  key={r.id}
                  className="restaurant-card-fade"
                  style={{ animationDelay: `${i * CARD_FADE_STEP_MS}ms` }}
                >
                  <RestaurantCard
                    restaurant={r}
                    onClick={() => { handleCardClick(r); }}
                    isFavorite={isAuthenticated && favoriteIds.includes(r.id)}
                  />
                </div>
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={Math.ceil((publicRestaurantsTotal || 1) / PAGE_SIZE)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
