import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tg } from "../../telegram/sdk";
import { useNotificationStore } from "../../store/useNotificationStore";
import { NotificationsPage as SharedNotificationsPage } from "@shared/pages/NotificationsPage/NotificationsPage";
export function NotificationsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const backButton = tg?.BackButton;
    if (!backButton) return;
    backButton.show();
    const handler = () => {
      void navigate("/profile");
    };
    backButton.onClick(handler);
    return () => {
      backButton.offClick(handler);
      backButton.hide();
    };
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
