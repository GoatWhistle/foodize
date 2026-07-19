import { OrderStatusPage as SharedOrderStatusPage } from "@shared/pages/OrderStatusPage/OrderStatusPage";
import { createOrderWebSocket } from "../../services/api";
import { ROUTES } from "../../constants/routes";

export const OrderStatusPage = () => (
  <SharedOrderStatusPage
    createOrderWebSocket={createOrderWebSocket}
    onBack={ROUTES.ORDERS}
    screenClassName="status-screen"
  />
);
