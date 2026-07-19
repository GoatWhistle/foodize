import { useOrdersStore } from "../../store/useOrdersStore";
import { useFavoriteStore } from "@shared/store/useFavoriteStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import { getBackButton, getTelegramUser } from "../../telegram/sdk";
import { ProfilePage as SharedProfilePage } from "@shared/pages/ProfilePage/ProfilePage";
import s from "./ProfilePage.module.css";

export const ProfilePage = () => {
  const ordersTotal = useOrdersStore((s) => s.ordersTotal);
  const favoriteIds = useFavoriteStore((s) => s.favoriteIds);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const tgUser = getTelegramUser();

  return (
    <SharedProfilePage
      routes={{
        orders: "/orders",
        favorites: "/favorites",
        notifications: "/notifications",
        home: "/",
        settings: "/settings",
      }}
      onLogout={() => { window.location.assign("/"); }}
      BackButton={getBackButton()}
      avatarUrl={(tgUser?.['photo_url'] as string | undefined) || null}
      ordersTotal={ordersTotal || 0}
      favoritesCount={favoriteIds.length || 0}
      unreadCount={unreadCount || 0}
      pageClassName={s['page']}
    />
  );
};
