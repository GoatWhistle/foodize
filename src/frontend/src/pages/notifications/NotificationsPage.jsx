import { useNotificationStore } from "../../store/useNotificationStore";
import SharedNotificationsPage from "@shared/pages/NotificationsPage/NotificationsPage.jsx";

const NotificationsPage = () => (
  <SharedNotificationsPage
    useNotificationStore={useNotificationStore}
    stickyHeader={false}
    pageClassName="page-enter"
    style={{ maxWidth: 640, margin: "0 auto", padding: "28px var(--gutter, 20px)" }}
  />
);

export default NotificationsPage;
