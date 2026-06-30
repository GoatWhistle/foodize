import SharedOrderStatusPage from "@shared/pages/OrderStatusPage/OrderStatusPage.jsx";
import { createOrderWebSocket } from "../../services/api";
import { ROUTES } from "../../constants/routes";

const OrderStatusPage = () => (
  <SharedOrderStatusPage
    createOrderWebSocket={createOrderWebSocket}
    onBack={ROUTES.ORDERS}
    screenClassName="status-screen"
  />
);

export default OrderStatusPage;
