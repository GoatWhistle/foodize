import { OrdersPage as SharedOrdersPage } from "@shared/pages/OrdersPage/OrdersPage";
import { ROUTES } from "../../constants/routes";

const STATUS_FILTERS = [
  { key: "",       labelKey: "order.list.filterAll" },
  { key: "ACTIVE", labelKey: "order.list.filterActive" },
  { key: "DONE",   labelKey: "order.list.filterDone" },
];

export const OrdersPage = () => (
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
