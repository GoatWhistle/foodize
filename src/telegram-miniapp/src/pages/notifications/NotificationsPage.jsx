import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tg } from "../../telegram/sdk";
import { useNotificationStore } from "../../store/useNotificationStore";
import SharedNotificationsPage from "@shared/pages/NotificationsPage/NotificationsPage.jsx";

export default function NotificationsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!tg?.BackButton) return;
    tg.BackButton.show();
    const handler = () => navigate("/profile");
    tg.BackButton.onClick(handler);
    return () => { tg.BackButton.offClick(handler); tg.BackButton.hide(); };
  }, [navigate]);

  return (
    <SharedNotificationsPage
      useNotificationStore={useNotificationStore}
      stickyHeader
      markAllReadOnOpen
      pageClassName="notifications-page"
      style={{ paddingBottom: "calc(var(--bottom-tab-h, 68px) + 24px)" }}
    />
  );
}
