import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Storefront, Faders } from '@phosphor-icons/react';
import RestaurantCard from '../../components/ui/RestaurantCard';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { useAuthStore } from '../../store/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { ROUTES } from '../../constants/routes';

const HomePage = () => {
  const [search, setSearch] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated }))
  );
  const {
    publicRestaurants,
    publicRestaurantsTotal,
    fetchPublicRestaurants,
    loading,
  } = useRestaurantStore(
    useShallow((s) => ({
      publicRestaurants: s.publicRestaurants,
      publicRestaurantsTotal: s.publicRestaurantsTotal,
      fetchPublicRestaurants: s.fetchPublicRestaurants,
      loading: s.loading,
    }))
  );
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const size = 20;
  const filterRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, onlyOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPublicRestaurants({
        name: search || undefined,
        is_open: onlyOpen ? true : undefined,
        page,
        size,
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [search, onlyOpen, page, fetchPublicRestaurants]);

  const handleCardClick = (restaurant) => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    navigate(
      ROUTES.RESTAURANT.replace(':id', restaurant.display_id || restaurant.id),
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
            className={`btn ${showFilters || onlyOpen ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-label="Открыть фильтры"
            style={{
              height: '46px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: 'var(--radius-md)',
              position: 'relative',
            }}
          >
            <Faders size={18} weight="bold" />
            {onlyOpen && !showFilters && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--color-success)',
                  border: '1.5px solid var(--bg-card)',
                }}
              />
            )}
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
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  color: 'var(--text-1)',
                }}
              >
                Параметры поиска
              </h4>
              <label className="form-check" style={{ margin: 0 }}>
                <input
                  type="checkbox"
                  checked={onlyOpen}
                  onChange={(e) => setOnlyOpen(e.target.checked)}
                />
                <span className="form-check-label">Открыто</span>
              </label>
              {/* Будущие фильтры можно добавлять сюда */}
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
            {publicRestaurants.length}
          </span>
        </div>

        {loading && publicRestaurants.length === 0 ? (
          <div className="restaurants-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="restaurant-card-skeleton" />
            ))}
          </div>
        ) : publicRestaurants.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            subtitle="Попробуйте другой поиск или фильтр"
            action={{
              label: 'Сбросить',
              onClick: () => {
                setSearch('');
                setOnlyOpen(false);
              },
            }}
          />
        ) : (
          <div>
            <div
              className={`restaurants-grid${loading ? ' restaurants-grid--loading' : ''}`}
            >
              {publicRestaurants.map((r, i) => (
                <div
                  key={r.id}
                  className="restaurant-card-fade"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <RestaurantCard
                    restaurant={r}
                    onClick={() => handleCardClick(r)}
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
