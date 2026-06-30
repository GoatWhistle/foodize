import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBackButton } from "../../telegram/sdk";
import SharedOrdersPage from "@shared/pages/OrdersPage/OrdersPage.jsx";
import s from "./OrdersPage.module.css";

const STATUS_FILTERS = [
  { key: "",          label: "Все" },
  { key: "ACTIVE",    label: "Активные" },
  { key: "COMPLETED", label: "Выданные" },
];

const OrdersPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const btn = getBackButton();
    if (!btn) return;
    btn.show();
    const handler = () => navigate("/");
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
      pageClassName={s.page}
    />
  );
};

export default OrdersPage;
