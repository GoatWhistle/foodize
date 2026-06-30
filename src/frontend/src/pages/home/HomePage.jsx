import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  Storefront,
  Faders,
  SortAscending,
  SortDescending,
  Star,
  ChartBar,
} from '@phosphor-icons/react';
import RestaurantCard from '@shared/components/RestaurantCard/RestaurantCard';
import EmptyState from '@shared/components/EmptyState/EmptyState';
import Pagination from '@shared/components/Pagination/Pagination';
import { useAuthStore } from '../../store/useAuthStore';
import { useFavoriteStore } from '../../store/useFavoriteStore';
import { useShallow } from 'zustand/react/shallow';
import { ROUTES } from '../../constants/routes';
import { useHomePageLogic } from '@shared/hooks/useHomePageLogic.js';

const HomePage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const { isAuthenticated } = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated }))
  );
  const { favoriteIds, toggle: toggleFavorite } = useFavoriteStore(
    useShallow((s) => ({ favoriteIds: s.favoriteIds, toggle: s.toggle }))
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
  } = useHomePageLogic({ pageSize: 20, infiniteScroll: false });

  const size = 20;

  const handleCardClick = (restaurant) => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    navigate(
      ROUTES.RESTAURANT.replace(':id', restaurant.display_id),
      {
        state: { restaurant },
        viewTransition: true,
      }
    );
  };

  return (
    <div className="home-page page-enter">
      <div className="search-bar-wrap">
        <div className="search-bar" style={{ flex: 1 }}>
          <MagnifyingGlass className="search-icon" size={18} weight="bold" />
          <input
            id="restaurant-search"
            type="search"
            placeholder="Поиск ресторана или адреса..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Поиск ресторана"
          />
        </div>
        <div style={{ position: 'relative' }} ref={filterRef}>
          <button
            className={`btn btn-icon ${showFilters ? 'btn-primary' : 'btn-secondary'}${onlyOpen || sort !== 'default' ? ' btn-icon-active' : ''}`}
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
            aria-label="Открыть фильтры"
            style={{
              height: '46px',
              width: '46px',
              padding: 0,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Faders size={18} weight="bold" />
          </button>

          {showFilters && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                minWidth: '220px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <label className="sort-chip sort-chip-checkbox">
                <input
                  type="checkbox"
                  checked={onlyOpen}
                  onChange={() => setOnlyOpen((value) => !value)}
                />
                Открыто
              </label>
              <div className="home-sort-panel">
                <button
                  type="button"
                  className={`sort-chip${sort === 'default' ? ' active' : ''}`}
                  onClick={() => {
                    if (sort === 'default') return;
                    setSort('default');
                  }}
                >
                  По умолчанию
                </button>
                <button
                  type="button"
                  className={`sort-chip${sort === 'rating' ? ' active' : ''}`}
                  onClick={() => {
                    if (sort === 'rating') {
                      setDirection((value) =>
                        value === 'desc' ? 'asc' : 'desc'
                      );
                    } else {
                      setSort('rating');
                    }
                  }}
                >
                  <Star size={14} weight="fill" />
                  Оценка
                  {sort === 'rating' && (
                    <span className="sort-direction-icon">
                      {direction === 'desc' ? (
                        <SortDescending size={14} weight="bold" />
                      ) : (
                        <SortAscending size={14} weight="bold" />
                      )}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className={`sort-chip${sort === 'popularity_7d' ? ' active' : ''}`}
                  onClick={() => {
                    if (sort === 'popularity_7d') {
                      setDirection((value) =>
                        value === 'desc' ? 'asc' : 'desc'
                      );
                    } else {
                      setSort('popularity_7d');
                    }
                  }}
                >
                  <ChartBar size={14} weight="bold" />
                  Популярность
                  {sort === 'popularity_7d' && (
                    <span className="sort-direction-icon">
                      {direction === 'desc' ? (
                        <SortDescending size={14} weight="bold" />
                      ) : (
                        <SortAscending size={14} weight="bold" />
                      )}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="restaurants-section">
        <div className="section-header">
          <Storefront size={20} weight="bold" color="var(--fire)" />
          <h1 className="section-title">Все заведения</h1>
          <span
            className="text-muted"
            style={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            {allRestaurants.length}
          </span>
        </div>

        {loading && allRestaurants.length === 0 ? (
          <div className="restaurants-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="restaurant-card-skeleton" />
            ))}
          </div>
        ) : allRestaurants.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            subtitle="Попробуйте другой поиск или фильтр"
            action={{
              label: 'Сбросить',
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
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <RestaurantCard
                    restaurant={r}
                    onClick={() => handleCardClick(r)}
                    isFavorite={isAuthenticated && favoriteIds.includes(r.id)}
                  />
                </div>
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={Math.ceil((publicRestaurantsTotal || 1) / size)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
