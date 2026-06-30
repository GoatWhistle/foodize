import SharedFavoritesPage from "@shared/pages/FavoritesPage/FavoritesPage.jsx";
import { getBackButton } from "../../telegram/sdk";

const FavoritesPage = () => (
  <div style={{ padding: "16px 16px calc(var(--bottom-tab-h, 68px) + 24px)" }}>
    <SharedFavoritesPage BackButton={getBackButton()} pageSize={100} showPagination={false} />
  </div>
);

export default FavoritesPage;
