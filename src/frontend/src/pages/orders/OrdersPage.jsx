import SharedOrdersPage from "@shared/pages/OrdersPage/OrdersPage.jsx";
import { ROUTES } from "../../constants/routes";

const STATUS_FILTERS = [
  { key: "",       label: "Все" },
  { key: "ACTIVE", label: "Активные" },
  { key: "DONE",   label: "Завершённые" },
];

const OrdersPage = () => (
  <SharedOrdersPage
    routes={{
      home: ROUTES.HOME,
      orderStatus: ROUTES.ORDER_STATUS,
    }}
    statusFilters={STATUS_FILTERS}
    showPagination
    infiniteScroll={false}
    pullToRefresh={false}
    pageClassName="page-enter"
    style={{ padding: "28px var(--gutter, 20px)" }}
  />
);

export default OrdersPage;
