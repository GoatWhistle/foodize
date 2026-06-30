import { useOrderStore } from "../../store/useOrderStore";
import { useFavoriteStore } from "../../store/useFavoriteStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import { getBackButton, getTelegramUser, getTelegramInitData } from "../../telegram/sdk";
import SharedProfilePage from "@shared/pages/ProfilePage/ProfilePage.jsx";
import s from "./ProfilePage.module.css";

const isTelegramUser = () => {
  try {
    return getTelegramInitData().length > 0;
  } catch {
    return false;
  }
};

const ProfilePage = () => {
  const ordersTotal = useOrderStore((s) => s.ordersTotal);
  const favoriteIds = useFavoriteStore((s) => s.favoriteIds);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const tgUser = getTelegramUser();
  const hasTelegramSession = isTelegramUser();

  return (
    <SharedProfilePage
      routes={{
        orders: "/orders",
        favorites: "/favorites",
        notifications: "/notifications",
        home: "/",
        terms: "/legal/terms",
        privacy: "/legal/privacy",
      }}
      onLogout={() => window.location.assign("/")}
      BackButton={getBackButton()}
      avatarUrl={tgUser?.photo_url || null}
      showPasswordChange={!hasTelegramSession}
      ordersTotal={ordersTotal || 0}
      favoritesCount={favoriteIds?.size || 0}
      unreadCount={unreadCount || 0}
      pageClassName={s.page}
    />
  );
};

export default ProfilePage;
