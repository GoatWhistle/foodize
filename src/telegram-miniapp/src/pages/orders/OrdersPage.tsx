import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBackButton } from "../../telegram/sdk";
import { OrdersPage as SharedOrdersPage } from "@shared/pages/OrdersPage/OrdersPage";
import s from "./OrdersPage.module.css";

const STATUS_FILTERS = [
  { key: "",          labelKey: "order.list.filterAll" },
  { key: "ACTIVE",    labelKey: "order.list.filterActive" },
  { key: "COMPLETED", labelKey: "order.list.filterCompleted" },
];

export const OrdersPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const btn = getBackButton();
    if (!btn) return;
    btn.show();
    const handler = () => {
      void navigate("/");
    };
    btn.onClick(handler);
    return () => { btn.offClick(handler); btn.hide(); };
  }, [navigate]);

  return (
    <SharedOrdersPage
      routes={{ home: "/", orderStatus: "/orders/:id" }}
      statusFilters={STATUS_FILTERS}
      infiniteScroll
      showPagination={false}
      pullToRefresh
      expandableCards
      pageClassName={s['page']}
    />
  );
};
