import SharedFavoritesPage from "@shared/pages/FavoritesPage/FavoritesPage";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { ROUTES } from "../../constants/routes";

const FavoritesPage = () => {
  const navigate = useNavigate();
  return (
    <div className="page-enter" style={{ padding: "80px 20px 100px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <button
          onClick={() => {
            void navigate(ROUTES.PROFILE);
          }}
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-2)",
          }}
        >
          <ArrowLeftIcon size={18} weight="bold" />
        </button>
      </div>
      <SharedFavoritesPage pageSize={20} showPagination={true} />
    </div>
  );
};

export default FavoritesPage;
