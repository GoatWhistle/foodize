import SharedOrderStatusPage from "@shared/pages/OrderStatusPage/OrderStatusPage";
import { createOrderWebSocket } from "../../services/api";

const OrderStatusPage = () => (
  <SharedOrderStatusPage
    createOrderWebSocket={createOrderWebSocket}
    onBack="/orders"
    screenClassName="status-screen"
    showDetails={false}
  />
);

export default OrderStatusPage;
