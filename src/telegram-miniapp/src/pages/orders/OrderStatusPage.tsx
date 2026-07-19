import { OrderStatusPage as SharedOrderStatusPage } from "@shared/pages/OrderStatusPage/OrderStatusPage";
import { createOrderWebSocket } from "../../services/api";

export const OrderStatusPage = () => (
  <SharedOrderStatusPage
    createOrderWebSocket={createOrderWebSocket}
    onBack="/orders"
    screenClassName="status-screen"
    showDetails={false}
  />
);
