import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "@phosphor-icons/react";
import { useFavoritesPage } from "@shared/hooks/useFavoritesPage";
import EmptyState from "@shared/components/EmptyState/EmptyState";
import FavoriteRestaurantCard from "@shared/components/FavoriteRestaurantCard/FavoriteRestaurantCard";
import Pagination from "@shared/components/Pagination/Pagination";
import type { FavoriteRestaurantInfo } from "@shared/types/models";

const PAGE_SIZE = 20;

interface BackButtonControl {
  show: () => void;
  hide: () => void;
  onClick: (handler: () => void) => void;
  offClick: (handler: () => void) => void;
}

interface FavoritesPageProps {
  BackButton?: BackButtonControl | null;
  pageSize?: number;
  showPagination?: boolean;
}

const FavoritesPage = ({ BackButton, pageSize = PAGE_SIZE, showPagination = true }: FavoritesPageProps) => {
  const navigate = useNavigate();
  const { favorites, loading, total, page, setPage, handleUnfavorite, handleNavigate } =
    useFavoritesPage({ pageSize });

  useEffect(() => {
    if (!BackButton) return;
    BackButton.show();
    const handler = () => { void navigate(-1); };
    BackButton.onClick(handler);
    return () => {
      BackButton.offClick(handler);
      BackButton.hide();
    };
  }, [navigate, BackButton]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <Heart size={22} weight="fill" color="var(--color-error)" />
        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-1)" }}>
          Избранное
        </span>
        {total > 0 && (
          <span
            style={{
              background: "var(--color-error-bg)",
              color: "var(--color-error)",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: "0.75rem",
              fontWeight: 800,
            }}
          >
            {total}
          </span>
        )}
      </div>

      {loading && favorites.length === 0 ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          title="Нет избранных"
          subtitle="Нажмите на сердечко на карточке ресторана, чтобы сохранить"
          action={{ label: "Смотреть рестораны", onClick: () => { void navigate("/"); } }}
        />
      ) : (
        <div className={loading ? "loading-dim" : undefined} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {favorites.map((fav) => (
            <FavoriteRestaurantCard
              key={fav.id}
              favorite={fav}
              onNavigate={(restaurant: FavoriteRestaurantInfo) =>
                handleNavigate(restaurant)
              }
              onUnfavorite={(restaurantId: string) => { void handleUnfavorite(restaurantId); }}
            />
          ))}
          {showPagination && (
            <Pagination
              page={page}
              totalPages={Math.ceil(total / pageSize)}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
