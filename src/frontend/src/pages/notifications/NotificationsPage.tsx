import { useNotificationStore } from "../../store/useNotificationStore";
import { NotificationsPage as SharedNotificationsPage } from "@shared/pages/NotificationsPage/NotificationsPage";
export const NotificationsPage = () => (
  <SharedNotificationsPage
    useNotificationStore={useNotificationStore}
    stickyHeader={false}
    markAllReadOnOpen
    pageClassName="page-enter"
    style={{ maxWidth: 640, margin: "0 auto", padding: "28px var(--gutter, 20px)" }}
  />
);
